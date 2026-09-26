import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(r"e:/Aculion/aculion-platform/aculion/.env")
DATABASE_URL = os.getenv("DATABASE_URL")
conn = psycopg2.connect(DATABASE_URL)
cur = conn.cursor()

def print_fn(name):
    cur.execute("SELECT pg_get_functiondef(oid) FROM pg_proc WHERE proname = %s;", (name,))
    rows = cur.fetchall()
    print(f"=== Function: {name} (count: {len(rows)}) ===")
    for r in rows:
        print(r[0])
        print("-" * 50)
    print()

print_fn("process_previous_hour")
print_fn("process_traffic_hour")

# Cron details
cur.execute("SELECT jobid, jobname, schedule, active, command FROM cron.job;")
print("=== Cron Jobs ===")
for r in cur.fetchall():
    print(r)
print()

cur.execute("""
SELECT jobid, runid, status, return_message, start_time, end_time 
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 30;
""")
print("=== Cron Run Details ===")
for r in cur.fetchall():
    print(r)
print()
