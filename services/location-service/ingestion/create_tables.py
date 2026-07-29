from sqlalchemy import text
from ingestion.database import engine
from ingestion.logger import logger

TABLE_SCHEMAS = {
    "poi_master": {
        "columns": {
            "osm_id": "BIGINT",
            "name": "TEXT",
            "main_category": "VARCHAR(100)",
            "sub_category": "VARCHAR(100)",
            "source_key": "VARCHAR(100)",
            "source_value": "VARCHAR(100)",
            "brand": "VARCHAR(255)",
            "operator": "VARCHAR(255)",
            "healthcare": "VARCHAR(255)",
            "cuisine": "VARCHAR(255)",
            "website": "TEXT",
            "phone": "VARCHAR(255)",
            "opening_hours": "TEXT",
            "wheelchair": "VARCHAR(255)",
            '"addr:housenumber"': "VARCHAR(100)",
            '"addr:street"': "VARCHAR(255)",
            '"addr:city"': "VARCHAR(100)",
            '"addr:postcode"': "VARCHAR(50)",
            '"addr:district"': "VARCHAR(100)",
            '"addr:state"': "VARCHAR(100)",
            "latitude": "DOUBLE PRECISION",
            "longitude": "DOUBLE PRECISION"
        },
        "geom_type": "Geometry"
    },
    "roads_master": {
        "columns": {
            "osm_id": "BIGINT",
            "name": "TEXT",
            "road_class": "VARCHAR(100)",
            "highway": "VARCHAR(100)",
            "lanes": "VARCHAR(50)",
            "surface": "VARCHAR(100)",
            "maxspeed": "VARCHAR(50)",
            "oneway": "VARCHAR(50)",
            "bridge": "VARCHAR(50)",
            "tunnel": "VARCHAR(50)"
        },
        "geom_type": "Geometry"
    },
    "buildings_master": {
        "columns": {
            "osm_id": "BIGINT",
            "name": "TEXT",
            "building_class": "VARCHAR(100)",
            "building_type": "VARCHAR(100)",
            "levels": "VARCHAR(50)",
            "height": "VARCHAR(50)",
            "roof_shape": "VARCHAR(100)",
            "material": "VARCHAR(100)",
            "area": "DOUBLE PRECISION",
            "latitude": "DOUBLE PRECISION",
            "longitude": "DOUBLE PRECISION"
        },
        "geom_type": "Geometry"
    },
    "landuse_master": {
        "columns": {
            "osm_id": "BIGINT",
            "name": "TEXT",
            "landuse_category": "VARCHAR(100)",
            "landuse_type": "VARCHAR(100)",
            "area": "DOUBLE PRECISION",
            "latitude": "DOUBLE PRECISION",
            "longitude": "DOUBLE PRECISION"
        },
        "geom_type": "Geometry"
    },
    "transit_master": {
        "columns": {
            "osm_id": "BIGINT",
            "name": "TEXT",
            "transit_type": "VARCHAR(100)",
            "subtype": "VARCHAR(100)",
            "latitude": "DOUBLE PRECISION",
            "longitude": "DOUBLE PRECISION"
        },
        "geom_type": "Geometry"
    },
    "natural_master": {
        "columns": {
            "osm_id": "BIGINT",
            "name": "TEXT",
            "natural_type": "VARCHAR(100)",
            "source_key": "VARCHAR(100)",
            "source_value": "VARCHAR(100)",
            "area": "DOUBLE PRECISION",
            "latitude": "DOUBLE PRECISION",
            "longitude": "DOUBLE PRECISION"
        },
        "geom_type": "Geometry"
    }
}

def verify_and_bootstrap_database():
    """
    Bootstraps extensions, operational schemas, and ensures target tables are ready.
    """
    logger.info("Initializing PostGIS extension, schemas, and metadata history table...")
    
    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS metadata;"))
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS features;"))
        
        # History log table
        conn.execute(text("""
            CREATE TABLE IF NOT EXISTS metadata.ingestion_history (
                filename VARCHAR(255) PRIMARY KEY,
                sha256_hash VARCHAR(64) NOT NULL,
                row_count INT NOT NULL,
                status VARCHAR(50) NOT NULL,
                error_message TEXT,
                last_ingested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        """))

    # Table build loop
    for table_name, schema in TABLE_SCHEMAS.items():
        logger.info(f"Verifying target table properties for public.{table_name}...")
        columns = schema["columns"]
        geom_type = schema["geom_type"]

        column_defs = ", ".join([f"{col} {dtype}" for col, dtype in columns.items()])
        create_sql = f"CREATE TABLE IF NOT EXISTS public.{table_name} ({column_defs});"
        
        with engine.begin() as conn:
            conn.execute(text(create_sql))
            
            # Geometry check and creation
            geom_exists = conn.execute(text(f"""
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = '{table_name}' AND column_name = 'geometry';
            """)).fetchone()
            
            if not geom_exists:
                logger.info(f"Adding PostGIS geometry({geom_type}, 4326) column to public.{table_name}...")
                conn.execute(text(f"SELECT AddGeometryColumn('public', '{table_name}', 'geometry', 4326, '{geom_type}', 2);"))

            # Build spatial indexes
            conn.execute(text(f"CREATE INDEX IF NOT EXISTS idx_{table_name}_geom ON public.{table_name} USING GIST(geometry);"))
            
            # Ensure tables with non-null osm_ids have primary key constraints
            pk_exists = conn.execute(text(f"""
                SELECT 1 FROM information_schema.table_constraints 
                WHERE table_name = '{table_name}' AND constraint_type = 'PRIMARY KEY';
            """)).fetchone()
            
            if not pk_exists:
                # We enforce primary key constraints only on transit/POI tables since other tables have sparse OSM IDs
                if table_name in ["poi_master", "transit_master"]:
                    try:
                        logger.info(f"Enforcing Primary Key (osm_id) on public.{table_name}...")
                        conn.execute(text(f"ALTER TABLE public.{table_name} ADD PRIMARY KEY (osm_id);"))
                    except Exception as e:
                        logger.warning(f"Skipped Primary Key constraint for {table_name}: {e}")
                else:
                    # For buildings, landuse, and natural features, we define serial ID PK
                    id_col = table_name.replace("_master", "_id")
                    logger.info(f"Adding surrogate key ({id_col} BIGSERIAL) to public.{table_name}...")
                    try:
                        conn.execute(text(f"ALTER TABLE public.{table_name} ADD COLUMN IF NOT EXISTS {id_col} BIGSERIAL PRIMARY KEY;"))
                    except Exception as e:
                        logger.warning(f"Surrogate Primary Key skipped/exists for {table_name}: {e}")
