"""
Convert legacy InMyBar iOS SQLite export to a Pourfolio import backup JSON.
Usage: python scripts/convert-inmybar-to-pourfolio.py [path/to/InMyBar.sqlite]
"""
from __future__ import annotations

import json
import re
import sqlite3
import sys
import time
import random
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DB = Path(r"C:\Users\Randa\Desktop\Archive_extracted\Documents\InMyBar.sqlite")
DEFAULT_OUT = Path(r"C:\Users\Randa\Desktop\pourfolio-import-from-inmybar.json")
INGREDIENTS_TS = ROOT / "src" / "data" / "ingredients.ts"

VALID_CATEGORIES = {"Spirits", "Liqueurs", "Mixers", "Juices", "Fruits", "Garnishes", "Other"}


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower())
    return s.strip("-")


def parse_seed_names() -> dict[str, str]:
    text = INGREDIENTS_TS.read_text(encoding="utf-8")
    names: list[str] = []
    for m in re.finditer(r"name:\s*'((?:\\'|[^'])*)'", text):
        names.append(m.group(1).replace("\\'", "'"))
    for m in re.finditer(r'name:\s*"([^"]*)"', text):
        names.append(m.group(1))

    seed_by_norm: dict[str, str] = {}
    for name in names:
        seed_by_norm[normalize(name)] = f"brand-{slugify(name)}" if name not in (
            "Egg White", "Heavy Cream", "Milk", "Champagne", "Prosecco", "Beer", "Wine", "Red Wine", "White Wine"
        ) else f"gen-{slugify(name)}"
    # Re-read properly from SEED structure - generic ingredients use gen- prefix
    for g in ("Egg White", "Heavy Cream", "Milk", "Champagne", "Prosecco", "Beer", "Wine", "Red Wine", "White Wine"):
        if g in names:
            seed_by_norm[normalize(g)] = f"gen-{slugify(g)}"
    for name in names:
        norm = normalize(name)
        if norm not in seed_by_norm:
            seed_by_norm[norm] = f"brand-{slugify(name)}"
    return seed_by_norm


def normalize(s: str | None) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def new_id() -> str:
    return f"{int(time.time() * 1000)}-{random.randint(0, 36**7):07x}"[:24]


def map_category(raw: str | None) -> str:
    if raw in VALID_CATEGORIES:
        return raw
    return "Other"


def load_bar_data(db_path: Path):
    con = sqlite3.connect(db_path)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute("SELECT Z_PK, ZNAME FROM ZBARPROFILE ORDER BY Z_PK")
    bars = [dict(r) for r in cur.fetchall()]
    cur.execute(
        """
        SELECT
          bp.Z_PK AS bar_pk,
          bp.ZNAME AS bar_name,
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
    rows = [dict(r) for r in cur.fetchall()]
    con.close()
    return bars, rows


def convert(db_path: Path, out_path: Path) -> dict:
    seed_by_norm = parse_seed_names()
    bars_meta, rows = load_bar_data(db_path)

    ingredient_id_by_norm: dict[str, str] = {}
    custom_ingredients: list[dict] = []

    def resolve_ingredient(row: dict) -> str:
        brand = (row["brand_name"] or "").strip()
        norm = normalize(brand)
        if norm in ingredient_id_by_norm:
            return ingredient_id_by_norm[norm]

        seed_id = seed_by_norm.get(norm)
        if seed_id:
            ingredient_id_by_norm[norm] = seed_id
            return seed_id

        ing_id = new_id()
        ingredient_id_by_norm[norm] = ing_id
        custom_ingredients.append(
            {
                "id": ing_id,
                "name": brand,
                "genericName": (row["generic_name"] or brand).strip() or brand,
                "company": (row["company"] or "").strip() or None,
                "country": (row["country"] or "").strip() or None,
                "flavor": (row["flavor"] or "").strip() or None,
                "type": (row["spirit_type"] or "").strip() or None,
                "category": map_category(row["category"]),
                "isCustom": True,
            }
        )
        return ing_id

    pourfolio_bars = []
    for bar in bars_meta:
        bar_pk = bar["Z_PK"]
        bar_rows = [r for r in rows if r["bar_pk"] == bar_pk]
        ids: list[str] = []
        seen: set[str] = set()
        for row in bar_rows:
            ing_id = resolve_ingredient(row)
            if ing_id not in seen:
                seen.add(ing_id)
                ids.append(ing_id)
        pourfolio_bars.append(
            {
                "id": new_id(),
                "name": bar["ZNAME"],
                "ingredientIds": ids,
            }
        )

    state = {
        "bars": pourfolio_bars,
        "activeBarId": pourfolio_bars[0]["id"] if pourfolio_bars else "default",
        "favorites": [],
        "shoppingList": [],
        "customIngredients": [{k: v for k, v in ing.items() if v is not None} for ing in custom_ingredients],
        "customDrinks": [],
        "hiddenDrinks": [],
        "hiddenIngredients": [],
        "ingredientOverrides": {},
        "drinkOverrides": {},
        "barItemMeta": {},
        "shoppingChecked": [],
        "trash": {"ingredients": [], "drinks": []},
        "syncUpdatedAt": int(time.time() * 1000),
    }

    backup = {
        "version": 1,
        "exportedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "app": "pourfolio",
        "state": state,
    }

    out_path.write_text(json.dumps(backup, indent=2), encoding="utf-8")

    stats = {
        "bars": [{"name": b["name"], "ingredients": len(b["ingredientIds"])} for b in pourfolio_bars],
        "customIngredients": len(custom_ingredients),
        "matchedToSeed": len(ingredient_id_by_norm) - len(custom_ingredients),
        "output": str(out_path),
    }
    return stats


def main():
    db_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_DB
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else DEFAULT_OUT
    if not db_path.exists():
        print("Database not found:", db_path)
        sys.exit(1)
    stats = convert(db_path, out_path)
    print(json.dumps(stats, indent=2))


if __name__ == "__main__":
    main()
