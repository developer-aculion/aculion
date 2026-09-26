import os, psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

cur.execute("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = 'process_previous_hour';")
print("=== process_previous_hour ===")
print(cur.fetchone()[0])
