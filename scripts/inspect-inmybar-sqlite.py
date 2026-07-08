import sqlite3
import sys
from pathlib import Path

candidates = [
    Path(r"C:\Users\Randa\Desktop\Archive_extracted\Documents\InMyBar.sqlite"),
    Path(r"C:\Users\Randa\Desktop\Archive_extracted\Documents 1\InMyBar.sqlite"),
    Path(r"C:\Users\Randa\Desktop\Archive_extracted\InMyBar.app\InMyBar.sqlite"),
]

for db in candidates:
    if not db.exists():
        print("MISSING:", db)
        continue
    print("\n===", db, "size", db.stat().st_size, "===")
    con = sqlite3.connect(db)
    cur = con.cursor()
    cur.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
    tables = [r[0] for r in cur.fetchall()]
    print("TABLES:", tables)
    for t in tables:
        cur.execute(f"PRAGMA table_info({t})")
        cols = [r[1] for r in cur.fetchall()]
        cur.execute(f"SELECT COUNT(*) FROM {t}")
        count = cur.fetchone()[0]
        print(f"  {t} ({count} rows): {cols}")
    con.close()
