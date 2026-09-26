import os
import psycopg2
from dotenv import load_dotenv

load_dotenv('e:/Aculion/aculion-platform/aculion/.env')
conn = psycopg2.connect(os.getenv('DATABASE_URL'))
conn.autocommit = True
cur = conn.cursor()

tables = ['traffic_day', 'traffic_hour', 'traffic_overview', 'traffic_overview_history']

for table in tables:
    policy_name = f"Allow public select on {table}"
    cur.execute(f'DROP POLICY IF EXISTS "{policy_name}" ON {table};')
    cur.execute(f'CREATE POLICY "{policy_name}" ON {table} FOR SELECT TO public USING (true);')
    print(f"Applied policy on {table}")

cur.execute("""
SELECT tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('traffic_day', 'traffic_hour', 'traffic_overview', 'traffic_overview_history');
""")
for r in cur.fetchall():
    print(r)
