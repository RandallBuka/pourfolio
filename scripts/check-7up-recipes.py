import sqlite3
from pathlib import Path

DB = Path(r"C:\Users\Randa\Desktop\Archive_extracted\Documents\InMyBar.sqlite")
con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
cur = con.cursor()
cur.execute(
    """
    SELECT d.ZNAME, g.ZNAME as generic, i.ZNAME as brand, di.ZUSEPREMIUM, di.ZALLOWGENERIC
    FROM ZDRINKINGREDIENT di
    JOIN ZDRINK d ON d.Z_PK = di.ZDRINK
    LEFT JOIN ZGENERICINGREDIENT g ON g.Z_PK = di.ZGENERICINGREDIENT
    LEFT JOIN ZINGREDIENT i ON i.Z_PK = di.ZINGREDIENT
    WHERE g.ZNAME = '7-Up or Sprite'
    LIMIT 10
    """
)
print("Sample 7-Up or Sprite recipe rows:")
for r in cur.fetchall():
    print(dict(r))

cur.execute(
    """
    SELECT d.ZNAME, d.ZMIXINSTRUCTIONS
    FROM ZDRINK d
    WHERE d.ZNAME LIKE '%Seven%7%' OR d.ZNAME LIKE '%7 and 7%' OR d.ZNAME LIKE '%Beam and 7%'
    """
)
print("\nNamed 7 drinks:")
for r in cur.fetchall():
    print(r["ZNAME"], "->", (r["ZMIXINSTRUCTIONS"] or "")[:100])

con.close()
