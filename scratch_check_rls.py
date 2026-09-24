import os, psycopg2
from dotenv import load_dotenv

load_dotenv('e:/Aculion/aculion-platform/aculion/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
cur = conn.cursor()

cur.execute("""
SELECT tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
""")
for r in cur.fetchall():
    print(r)
