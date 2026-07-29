import pandas as pd
from shapely import wkt
from shapely.errors import WKTReadingError
from ingestion.logger import logger

class SchemaValidator:
    """
    Validates CSV schema structures, columns, and spatial WKT geometry integrity.
    """
    SCHEMAS = {
        "poi_master.csv": {
            "required_cols": {"osm_id", "main_category", "geometry", "latitude", "longitude"},
            "numeric_cols": {"osm_id", "latitude", "longitude"}
        },
        "roads_master.csv": {
            "required_cols": {"osm_id", "road_class", "geometry"},
            "numeric_cols": {"osm_id"}
        },
        "buildings_master.csv": {
            "required_cols": {"osm_id", "building_class", "area", "geometry", "latitude", "longitude"},
            "numeric_cols": {"osm_id", "area", "latitude", "longitude"}
        },
        "landuse_master.csv": {
            "required_cols": {"osm_id", "landuse_category", "geometry", "latitude", "longitude"},
            "numeric_cols": {"osm_id", "latitude", "longitude"}
        },
        "transit_master.csv": {
            "required_cols": {"osm_id", "transit_type", "geometry", "latitude", "longitude"},
            "numeric_cols": {"osm_id", "latitude", "longitude"}
        },
        "natural_master.csv": {
            "required_cols": {"osm_id", "natural_type", "geometry", "latitude", "longitude"},
            "numeric_cols": {"osm_id", "latitude", "longitude"}
        }
    }

    @staticmethod
    def validate(file_path, file_type):
        """
        Validates columns presence, numerical conversions, coordinate limits, and Shapely parsing.
        """
        logger.info(f"Validating file {file_path.name} against schema {file_type}...")
        try:
            df = pd.read_csv(file_path)
        except Exception as e:
            return None, [f"Failed to read CSV file: {e}"]

        schema = SchemaValidator.SCHEMAS.get(file_type)
        if not schema:
            return df, [f"No schema validator defined for {file_type}"]

        warnings = []

        # 1. Required Columns Presence Check
        missing_cols = schema["required_cols"] - set(df.columns)
        if missing_cols:
            return None, [f"Missing required columns: {missing_cols}"]

        # 2. Type enforcement (coerce numerical keys)
        for col in schema["numeric_cols"]:
            invalid_numeric = df[df[col].notnull() & pd.to_numeric(df[col], errors='coerce').isnull()]
            if not invalid_numeric.empty:
                warnings.append(f"Column '{col}' contains {len(invalid_numeric)} non-numeric rows. They will be ignored.")
                # Filter out values that cannot convert
                df = df[df[col].isnull() | pd.to_numeric(df[col], errors='coerce').notnull()].copy()

        # Coerce osm_id to nullable integer Int64 format to prevent float decimal string representation
        if "osm_id" in df.columns:
            df["osm_id"] = pd.to_numeric(df["osm_id"], errors='coerce').round().astype("Int64")

        # 3. Geometry Validation
        invalid_geom_count = 0
        valid_indices = []
        for idx, row in df.iterrows():
            geom_str = row.get("geometry")
            if pd.isnull(geom_str):
                invalid_geom_count += 1
                continue
            
            try:
                parsed_geom = wkt.loads(str(geom_str))
                if parsed_geom.is_empty:
                    invalid_geom_count += 1
                else:
                    valid_indices.append(idx)
            except WKTReadingError:
                invalid_geom_count += 1
                
        if invalid_geom_count > 0:
            warnings.append(f"Skipped {invalid_geom_count} rows with invalid WKT geometry strings.")
            df = df.loc[valid_indices].copy()

        # 4. Lat/Lng boundary coordinate checks
        if "latitude" in df.columns and "longitude" in df.columns:
            invalid_coords = df[
                df["latitude"].notnull() & df["longitude"].notnull() & (
                    (df["latitude"] < -90) | (df["latitude"] > 90) |
                    (df["longitude"] < -180) | (df["longitude"] > 180)
                )
            ]
            if not invalid_coords.empty:
                warnings.append(f"Skipped {len(invalid_coords)} rows with out-of-bounds geocoordinates.")
                df = df[
                    df["latitude"].isnull() | df["longitude"].isnull() | (
                        (df["latitude"] >= -90) & (df["latitude"] <= 90) &
                        (df["longitude"] >= -180) & (df["longitude"] <= 180)
                    )
                ].copy()

        # Enforce string name types to prevent conversion exceptions
        if "name" in df.columns:
            df["name"] = df["name"].fillna("").astype(str)

        return df, warnings
