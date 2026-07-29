import io
import time
from sqlalchemy import text
from ingestion.database import engine
from ingestion.logger import logger
from ingestion.config import RETRY_LIMIT, RETRY_BACKOFF

# Target table column schemas (excluding geometry)
TABLE_COLUMNS = {
    "poi_master": [
        "osm_id", "name", "main_category", "sub_category", "source_key", "source_value",
        "brand", "operator", "healthcare", "cuisine", "website", "phone", "opening_hours",
        "wheelchair", '"addr:housenumber"', '"addr:street"', '"addr:city"', '"addr:postcode"',
        '"addr:district"', '"addr:state"', "latitude", "longitude"
    ],
    "roads_master": [
        "osm_id", "name", "road_class", "highway", "lanes", "surface", "maxspeed", "oneway",
        "bridge", "tunnel"
    ],
    "transit_master": [
        "osm_id", "name", "transit_type", "subtype", "latitude", "longitude"
    ],
    "buildings_master": [
        "osm_id", "name", "building_class", "building_type", "levels", "height", "roof_shape",
        "material", "area", "latitude", "longitude"
    ],
    "landuse_master": [
        "osm_id", "name", "landuse_category", "landuse_type", "area", "latitude", "longitude"
    ],
    "natural_master": [
        "osm_id", "name", "natural_type", "source_key", "source_value", "area", "latitude", "longitude"
    ]
}

def load_with_retry(df, table_name):
    """
    Loads data into PostgreSQL using exponential backoff retry.
    """
    attempt = 1
    while attempt <= RETRY_LIMIT:
        try:
            load_data(df, table_name)
            return True
        except Exception as e:
            logger.error(f"Ingestion attempt {attempt} failed for table {table_name}: {e}")
            if attempt == RETRY_LIMIT:
                raise e
            time.sleep(RETRY_BACKOFF ** attempt)
            attempt += 1

def load_data(df, table_name):
    """
    Performs fast binary COPY staging loading followed by PostgreSQL spatial merging.
    """
    columns = TABLE_COLUMNS.get(table_name)
    if not columns:
        raise ValueError(f"No columns definition found for table name: {table_name}")

    staging_table = f"{table_name}_staging"

    # Get data types configuration from bootstrap script
    from ingestion.create_tables import TABLE_SCHEMAS
    schema_info = TABLE_SCHEMAS[table_name]
    dtypes = schema_info["columns"]
    
    col_defs = []
    for col in columns:
        dtype = dtypes[col].replace(" PRIMARY KEY", "")
        col_defs.append(f"{col} {dtype}")
    col_defs_str = ", ".join(col_defs)
    
    create_staging_sql = f"""
        CREATE TEMP TABLE {staging_table} (
            {col_defs_str},
            geometry TEXT
        ) ON COMMIT DROP;
    """

    # Filter dataframe columns
    clean_cols = [c.replace('"', '') for c in columns] + ["geometry"]
    
    # Save records to StringIO stream buffer
    csv_buffer = io.StringIO()
    df[clean_cols].to_csv(csv_buffer, index=False, header=True, encoding="utf-8")
    csv_buffer.seek(0)

    raw_conn = engine.raw_connection()
    try:
        with raw_conn.cursor() as cursor:
            # 1. Initialize staging
            cursor.execute(create_staging_sql)

            # 2. Bulk Ingest CSV records to staging
            copy_sql = f"COPY {staging_table} FROM STDIN WITH CSV HEADER"
            cursor.copy_expert(copy_sql, csv_buffer)

            # 3. Merge logic
            insert_cols = ", ".join(columns) + ", geometry"
            
            # Select values converting geometry WKT strings
            select_cols_list = []
            for col in columns:
                select_cols_list.append(col)
            select_cols_list.append("CASE WHEN geometry IS NOT NULL AND geometry != '' THEN ST_GeomFromText(geometry, 4326) ELSE NULL END")
            select_cols = ", ".join(select_cols_list)

            if table_name in ["poi_master", "transit_master"]:
                # Incremental UPSERT targeting osm_id conflict
                update_actions = ", ".join([f"{col} = EXCLUDED.{col}" for col in columns if col != "osm_id"])
                update_actions += ", geometry = EXCLUDED.geometry"

                # Check if fields differ to prevent redundant writes
                distinct_checks = " OR ".join([
                    f"public.{table_name}.{col} IS DISTINCT FROM EXCLUDED.{col}" 
                    for col in columns if col != "osm_id"
                ])
                distinct_checks += f" OR public.{table_name}.geometry IS DISTINCT FROM EXCLUDED.geometry"

                upsert_sql = f"""
                    INSERT INTO public.{table_name} ({insert_cols})
                    SELECT {select_cols}
                    FROM {staging_table}
                    ON CONFLICT (osm_id) 
                    DO UPDATE SET {update_actions}
                    WHERE {distinct_checks};
                """
                cursor.execute(upsert_sql)
            else:
                # Static dense overlays transaction replacement
                logger.info(f"Target table public.{table_name} contains null OSM keys. Executing transaction replacement...")
                cursor.execute(f"TRUNCATE TABLE public.{table_name};")
                
                insert_sql = f"""
                    INSERT INTO public.{table_name} ({insert_cols})
                    SELECT {select_cols}
                    FROM {staging_table};
                """
                cursor.execute(insert_sql)

        raw_conn.commit()
        logger.info(f"Bulk data load committed successfully for public.{table_name}.")
    except Exception as e:
        raw_conn.rollback()
        logger.error(f"Error loading public.{table_name}: {e}")
        raise e
    finally:
        raw_conn.close()

def refresh_view_cache():
    """
    Concurrent refresh of analytical materialized views.
    """
    logger.info("Triggering refresh of spatial materialized views...")
    try:
        with engine.begin() as conn:
            conn.execute(text("REFRESH MATERIALIZED VIEW CONCURRENTLY features.billboard_precalculated_metrics;"))
            logger.info("Materialized views sync complete.")
    except Exception as e:
        logger.warning(f"Materialized views refresh skipped (may not exist or lacks unique index): {e}")
