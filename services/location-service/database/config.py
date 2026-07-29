"""
Database credentials configuration.
Values are read from the .env file at project root.
"""
import os
from dotenv import load_dotenv
from pathlib import Path

# Resolve .env from project root (two levels up from backend/database/)
_PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(dotenv_path=_PROJECT_ROOT / ".env")

DB_HOST     = os.getenv("DB_HOST",     "localhost")
DB_PORT     = int(os.getenv("DB_PORT", "5432"))
DB_NAME     = os.getenv("DB_NAME",     "location_intelligence")
DB_USER     = os.getenv("DB_USER",     "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "NewPassword123")

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    from urllib.parse import quote_plus
    DATABASE_URL = f"postgresql://{DB_USER}:{quote_plus(DB_PASSWORD)}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
else:
    # Defensive parsing for passwords containing special characters (like '@')
    if DATABASE_URL.startswith("postgresql://"):
        try:
            url_body = DATABASE_URL[len("postgresql://"):]
            if "@" in url_body:
                parts = url_body.rsplit("@", 1)
                if len(parts) == 2:
                    userinfo, hostinfo = parts[0], parts[1]
                    if ":" in userinfo:
                        username, password = userinfo.split(":", 1)
                        from urllib.parse import unquote, quote_plus
                        DATABASE_URL = f"postgresql://{username}:{quote_plus(unquote(password))}@{hostinfo}"
        except Exception:
            pass
