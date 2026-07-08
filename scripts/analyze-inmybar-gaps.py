"""Analyze InMyBar vs Pourfolio seed gaps."""
import json
import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = Path(r"C:\Users\Randa\Desktop\Archive_extracted\Documents\InMyBar.sqlite")
ING_TS = ROOT / "src" / "data" / "ingredients.ts"
DRINKS_TS = ROOT / "src" / "data" / "drinks.ts"


def normalize(s: str | None) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def seed_ingredient_names() -> set[str]:
    text = ING_TS.read_text(encoding="utf-8")
    names = set()
    for m in re.finditer(r"name:\s*'((?:\\'|[^'])*)'", text):
        names.add(normalize(m.group(1).replace("\\'", "'")))
    return names


def seed_drink_names() -> set[str]:
    text = DRINKS_TS.read_text(encoding="utf-8")
    names = set()
    for m in re.finditer(r"(?:shot|cocktail)\(\s*'[^']+'\s*,\s*'((?:\\'|[^'])*)'", text):
        names.add(normalize(m.group(1).replace("\\'", "'")))
    return names


def main():
    seed_ings = seed_ingredient_names()
    seed_drinks = seed_drink_names()
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    cur = con.cursor()

    cur.execute(
        """
        SELECT DISTINCT i.ZNAME AS brand_name, i.ZUSERCREATED AS user_created
        FROM Z_1AVAILABLEINGREDIENTS link
        JOIN ZINGREDIENT i ON i.Z_PK = link.Z_10AVAILABLEINGREDIENTS
        WHERE i.ZHIDEINGREDIENT = 0 OR i.ZHIDEINGREDIENT IS NULL
        """
    )
    on_bar = [dict(r) for r in cur.fetchall()]
    on_bar_missing = [r for r in on_bar if normalize(r["brand_name"]) not in seed_ings]

    cur.execute(
        """
        SELECT ZNAME, ZUSERCREATED FROM ZINGREDIENT
        WHERE (ZHIDEINGREDIENT = 0 OR ZHIDEINGREDIENT IS NULL)
        """
    )
    all_ings = [dict(r) for r in cur.fetchall()]
    all_missing = [r for r in all_ings if normalize(r["ZNAME"]) not in seed_ings]

    cur.execute("SELECT ZNAME, ZUSERCREATED FROM ZDRINK WHERE ZHIDEDRINK = 0 OR ZHIDEDRINK IS NULL")
    all_drinks = [dict(r) for r in cur.fetchall()]
    drinks_missing = [r for r in all_drinks if normalize(r["ZNAME"]) not in seed_drinks]

    user_ings = [r for r in all_ings if r["ZUSERCREATED"] and normalize(r["ZNAME"]) not in seed_ings]
    user_drinks = [r for r in all_drinks if r["ZUSERCREATED"] and normalize(r["ZNAME"]) not in seed_drinks]

    print(json.dumps({
        "seedIngredients": len(seed_ings),
        "seedDrinks": len(seed_drinks),
        "inmybarIngredientsTotal": len(all_ings),
        "inmybarDrinksTotal": len(all_drinks),
        "missingOnBars": len(on_bar_missing),
        "missingAllIngredients": len(all_missing),
        "missingUserIngredients": len(user_ings),
        "missingAllDrinks": len(drinks_missing),
        "missingUserDrinks": len(user_drinks),
    }, indent=2))

    con.close()


if __name__ == "__main__":
    main()
