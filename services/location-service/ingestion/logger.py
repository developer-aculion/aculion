import logging
import sys
from ingestion.config import LOGS_DIR

def setup_logger(name="supabase_etl"):
    logger = logging.getLogger(name)
    logger.setLevel(logging.INFO)
    
    if logger.handlers:
        return logger

    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [%(filename)s:%(lineno)d]: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # Console output handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)

    # File output handler
    log_file = LOGS_DIR / "ingestion.log"
    file_handler = logging.FileHandler(log_file, encoding="utf-8")
    file_handler.setLevel(logging.INFO)
    file_handler.setFormatter(formatter)
    logger.addHandler(file_handler)

    return logger

logger = setup_logger()
