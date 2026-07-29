from sqlalchemy import create_engine
from ingestion.config import DATABASE_URL, SUPABASE_URL, SUPABASE_KEY
from ingestion.logger import logger

# Initialize thread-safe SQLAlchemy database engine
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=5,
    pool_pre_ping=True,
    future=True
)

# Initialize Supabase Python Client with fallback if library is not present
supabase_client = None

try:
    if SUPABASE_URL and SUPABASE_KEY:
        from supabase import create_client
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase Client initialized successfully via Python SDK.")
    else:
        logger.warning("Supabase URL or Key missing in env settings. Supabase client skipped.")
except ImportError:
    logger.warning("The 'supabase' library is not installed in the environment. Supabase Python SDK client is disabled.")
