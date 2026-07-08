import sqlite3
from pathlib import Path

DB = Path(r"C:\Users\Randa\Desktop\Archive_extracted\Documents\InMyBar.sqlite")
con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
cur = con.cursor()

for term in ["7-Up", "Sprite", "Coca Cola", "Cola", "7-Up or Sprite"]:
    cur.execute(
        """
        SELECT i.ZNAME, g.ZNAME, c.ZNAME
        FROM ZINGREDIENT i
        LEFT JOIN ZGENERICINGREDIENT g ON g.Z_PK = i.ZGENERICINGREDIENT
        LEFT JOIN ZINGREDIENTCATEGORY c ON c.Z_PK = i.ZCATEGORY
        WHERE i.ZNAME LIKE ? OR g.ZNAME LIKE ?
        ORDER BY i.ZNAME
        LIMIT 15
        """,
        (f"%{term}%", f"%{term}%"),
    )
    rows = cur.fetchall()
    print(f"\n=== {term!r} ({len(rows)} shown) ===")
    for r in rows:
        print(f"  brand={r[0]!r} generic={r[1]!r} cat={r[2]!r}")

cur.execute(
    """
    SELECT DISTINCT g.ZNAME
    FROM ZDRINKINGREDIENT di
    JOIN ZGENERICINGREDIENT g ON g.Z_PK = di.ZGENERICINGREDIENT
    WHERE g.ZNAME LIKE '%7%' OR g.ZNAME LIKE '%Cola%' OR g.ZNAME LIKE '%Sprite%'
    ORDER BY 1
    """
)
print("\n=== Recipe generic refs ===")
for r in cur.fetchall():
    print(f"  {r[0]!r}")

con.close()
