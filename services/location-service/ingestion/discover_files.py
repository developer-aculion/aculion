import hashlib
from pathlib import Path
from sqlalchemy import text
from ingestion.config import PROCESSED_DATA_DIR
from ingestion.database import engine
from ingestion.logger import logger

def calculate_sha256(file_path: Path) -> str:
    """
    Computes SHA256 checksum hash of a file for incremental load tracking.
    """
    sha256 = hashlib.sha256()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            sha256.update(chunk)
    return sha256.hexdigest()

def get_ingestion_status(filename: str) -> tuple:
    """
    Queries PostgreSQL metadata history to check the last ingested checksum.
    """
    query = text("""
        SELECT sha256_hash, status 
        FROM metadata.ingestion_history 
        WHERE filename = :filename;
    """)
    try:
        with engine.connect() as conn:
            row = conn.execute(query, {"filename": filename}).fetchone()
            if row:
                return row[0], row[1]
    except Exception:
        # History table might not exist yet during initial pipeline bootstrap
        pass
    return None, None

def scan_and_discover_files() -> list:
    """
    Scans data/processed/ to build a list of target files and checks if they require importing.
    """
    logger.info(f"Scanning target directory: {PROCESSED_DATA_DIR}")
    csv_files = list(PROCESSED_DATA_DIR.glob("*.csv"))
    
    discovered = []
    for file_path in csv_files:
        filename = file_path.name
        checksum = calculate_sha256(file_path)
        last_hash, last_status = get_ingestion_status(filename)
        
        needs_ingestion = True
        if last_hash == checksum and last_status == "Success":
            needs_ingestion = False
            
        discovered.append({
            "file_path": file_path,
            "filename": filename,
            "checksum": checksum,
            "needs_ingestion": needs_ingestion
        })
        
        state = "New/Modified (Ingestion Required)" if needs_ingestion else "Unchanged (Skip Ingest)"
        logger.info(f"File discovered: {filename} [{state}]")
        
    return discovered
