import sys
from pathlib import Path
from sqlalchemy import text

# Add backend directory to path to enable package import
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database.connection import engine

try:
    with engine.connect() as conn:
        version = conn.execute(text("SELECT version();")).fetchone()[0]
        print("PostgreSQL Version:", version)
        
        postgis = conn.execute(text("SELECT PostGIS_Version();")).fetchone()[0]
        print("PostGIS Version:", postgis)
except Exception as e:
    print("Database connection test failed:", e)
