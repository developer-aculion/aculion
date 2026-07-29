"""
SQLAlchemy database engine for the FastAPI backend.
Connects to the local PostgreSQL/PostGIS instance.
"""
from urllib.parse import quote_plus
from sqlalchemy import create_engine

from database.config import DATABASE_URL

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    future=True,
)
