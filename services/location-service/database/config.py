"""
Database credentials configuration.
Values are read from environment variables or .env file.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Try loading from current directory, service root, or monorepo root
load_dotenv()
_SERVICE_DIR = Path(__file__).resolve().parent.parent
if (_SERVICE_DIR / ".env").exists():
    load_dotenv(dotenv_path=_SERVICE_DIR / ".env")
_PROJECT_ROOT = _SERVICE_DIR.parent.parent
if (_PROJECT_ROOT / ".env").exists():
    load_dotenv(dotenv_path=_PROJECT_ROOT / ".env")

DB_HOST     = os.getenv("DB_HOST",     "localhost")
DB_PORT     = int(os.getenv("DB_PORT", "5432"))
DB_NAME     = os.getenv("DB_NAME",     "location_intelligence")
DB_USER     = os.getenv("DB_USER",     "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "NewPassword123")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    from urllib.parse import quote_plus
    DATABASE_URL = f"postgresql+psycopg2://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
else:
    # Normalize postgres:// and postgresql:// to postgresql+psycopg2:// for explicit driver resolution
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL[len("postgres://"):]
    elif DATABASE_URL.startswith("postgresql://"):
        DATABASE_URL = "postgresql+psycopg2://" + DATABASE_URL[len("postgresql://"):]

    # Defensive parsing for passwords containing special characters (like '@')
    if DATABASE_URL.startswith("postgresql+psycopg2://"):
        try:
            url_body = DATABASE_URL[len("postgresql+psycopg2://"):]
            if "@" in url_body:
                parts = url_body.rsplit("@", 1)
                if len(parts) == 2:
                    userinfo, hostinfo = parts[0], parts[1]
                    if ":" in userinfo:
                        username, password = userinfo.split(":", 1)
                        from urllib.parse import unquote, quote_plus
                        DATABASE_URL = f"postgresql+psycopg2://{username}:{quote_plus(unquote(password))}@{hostinfo}"
        except Exception:
            pass
