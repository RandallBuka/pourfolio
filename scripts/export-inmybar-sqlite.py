import json
import sqlite3
from pathlib import Path

DB = Path(r"C:\Users\Randa\Desktop\Archive_extracted\Documents\InMyBar.sqlite")
OUT = Path(r"C:\Users\Randa\Desktop\Archive_extracted\inmybar-export.json")

con = sqlite3.connect(DB)
con.row_factory = sqlite3.Row
cur = con.cursor()

cur.execute("SELECT Z_PK, ZNAME, ZALLOWGENERIC FROM ZBARPROFILE ORDER BY Z_PK")
bars = [dict(r) for r in cur.fetchall()]

cur.execute(
    """
    SELECT
      bp.Z_PK AS bar_pk,
      bp.ZNAME AS bar_name,
      i.Z_PK AS ingredient_pk,
      i.ZNAME AS brand_name,
      i.ZCOMPANY AS company,
      i.ZCOUNTRY AS country,
      i.ZFLAVOR AS flavor,
      i.ZUSERCREATED AS user_created,
      g.ZNAME AS generic_name,
      c.ZNAME AS category,
      t.ZNAME AS spirit_type
    FROM Z_1AVAILABLEINGREDIENTS link
    JOIN ZBARPROFILE bp ON bp.Z_PK = link.Z_1BARPROFILES
    JOIN ZINGREDIENT i ON i.Z_PK = link.Z_10AVAILABLEINGREDIENTS
    LEFT JOIN ZGENERICINGREDIENT g ON g.Z_PK = i.ZGENERICINGREDIENT
    LEFT JOIN ZINGREDIENTCATEGORY c ON c.Z_PK = i.ZCATEGORY
    LEFT JOIN ZINGREDIENTTYPE t ON t.Z_PK = i.ZTYPE
    ORDER BY bp.Z_PK, i.ZNAME
    """
)
ingredients_by_bar: dict[int, list] = {}
for row in cur.fetchall():
    bar_pk = row["bar_pk"]
    ingredients_by_bar.setdefault(bar_pk, []).append(
        {
            "brandName": row["brand_name"],
            "genericName": row["generic_name"],
            "company": row["company"],
            "country": row["country"],
            "flavor": row["flavor"],
            "category": row["category"],
            "spiritType": row["spirit_type"],
            "userCreated": bool(row["user_created"]),
        }
    )

cur.execute(
    """
    SELECT ZNAME, ZFAVORITE, ZUSERCREATED
    FROM ZDRINK
    WHERE ZFAVORITE = 1 OR ZUSERCREATED = 1
    ORDER BY ZNAME
    """
)
drinks = [dict(r) for r in cur.fetchall()]

export = {
    "source": "InMyBar iOS (Core Data SQLite)",
    "database": str(DB),
    "bars": [],
    "summary": {},
}

for bar in bars:
    pk = bar["Z_PK"]
    items = ingredients_by_bar.get(pk, [])
    user_items = [i for i in items if i["userCreated"]]
    export["bars"].append(
        {
            "name": bar["ZNAME"],
            "allowGeneric": bool(bar["ZALLOWGENERIC"]),
            "ingredientCount": len(items),
            "userCreatedCount": len(user_items),
            "ingredients": items,
        }
    )

export["summary"] = {
    "barCount": len(bars),
    "totalBarIngredients": sum(len(v) for v in ingredients_by_bar.values()),
    "userCreatedIngredients": sum(
        1 for items in ingredients_by_bar.values() for i in items if i["userCreated"]
    ),
    "favoriteOrCustomDrinks": len(drinks),
}

OUT.write_text(json.dumps(export, indent=2), encoding="utf-8")

print(json.dumps(export["summary"], indent=2))
print("\nBARS:")
for bar in export["bars"]:
    print(f"  - {bar['name']}: {bar['ingredientCount']} ingredients ({bar['userCreatedCount']} custom)")

print(f"\nWrote {OUT}")

con.close()
