"""
Generate Pourfolio seed data from legacy InMyBar SQLite catalog.
Adds ingredients/drinks whose names are not already in Pourfolio seeds.
"""
from __future__ import annotations

import re
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DB = Path(r"C:\Users\Randa\Desktop\Archive_extracted\Documents\InMyBar.sqlite")
ING_TS = ROOT / "src" / "data" / "ingredients.ts"
DRINKS_TS = ROOT / "src" / "data" / "drinks.ts"
OUT_ING = ROOT / "src" / "data" / "seeds" / "inmybarIngredients.ts"
OUT_DRINKS = ROOT / "src" / "data" / "seeds" / "inmybarDrinks.ts"

VALID_CATEGORIES = {"Spirits", "Liqueurs", "Mixers", "Juices", "Fruits", "Garnishes", "Other"}
DRINK_TYPES = {"Cocktail", "Shot", "Martini", "Themed", "Ordinary Drink", "Punch", "Other"}

DEFAULT_ABV_BY_GENERIC: dict[str, float] = {
    "Vodka": 40,
    "Gin": 40,
    "Rum": 40,
    "Light Rum": 40,
    "Dark Rum": 40,
    "Bourbon": 45,
    "Rye Whiskey": 45,
    "Whiskey": 43,
    "Scotch": 43,
    "Tequila": 40,
    "Brandy": 40,
    "Cognac": 40,
    "Liqueur": 25,
    "Vermouth": 18,
    "Bitters": 44,
    "Wine": 12,
    "Red Wine": 13,
    "White Wine": 12,
    "Champagne": 12,
    "Prosecco": 11,
    "Beer": 5,
    "Soda": 0,
    "Juice": 0,
}

# When recipes use a generic type, keep this brand in the catalog (genericName still maps for matching)
CANONICAL_BRAND_BY_GENERIC: dict[str, str] = {
    "cola": "Coca Cola",
}

ALCOHOLIC_IMB_CATEGORIES = {"Spirits", "Beer and Wine"}
NON_ALCOHOLIC_NAME_RE = re.compile(
    r"virgin|non[- ]?alcoholic|mocktail| alcohol[- ]?free|0\.0%|0% abv",
    re.I,
)
ALCOHOLIC_NAME_RE = re.compile(
    r"whiskey|whisky|vodka|\bgin\b|rum|tequila|bourbon|scotch|brandy|cognac|"
    r"liqueur|vermouth|bitters|\bwine\b|beer|champagne|prosecco|cava|\bport\b|"
    r"sherry|absinthe|schnapps|mead|spirit|aperitif|amaro|grain alcohol|everclear",
    re.I,
)
NA_MIXER_RE = re.compile(r"ginger beer|root beer|ginger ale|club soda|tonic|cola|soda|juice|syrup|water|cream|milk|sugar|salt|pepper|mint|lime|lemon|orange|cherry|olive|egg|ice|nutmeg|cinnamon|grenadine", re.I)


def normalize(s: str | None) -> str:
    return re.sub(r"\s+", " ", (s or "").strip().lower())


def slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower())
    return s.strip("-") or "item"


def ts_str(s: str | None) -> str:
    if s is None:
        return ""
    return (
        s.replace("\\", "\\\\")
        .replace("'", "\\'")
        .replace("\n", " ")
        .replace("\r", " ")
    )


def parse_seed_ingredient_names() -> set[str]:
    text = ING_TS.read_text(encoding="utf-8")
    names: set[str] = set()
    for m in re.finditer(r"name:\s*'((?:\\'|[^'])*)'", text):
        names.add(normalize(m.group(1).replace("\\'", "'")))
    return names


def parse_seed_drink_names() -> set[str]:
    text = DRINKS_TS.read_text(encoding="utf-8")
    names: set[str] = set()
    for m in re.finditer(r"(?:shot|cocktail)\(\s*'[^']+'\s*,\s*'((?:\\'|[^'])*)'", text):
        names.add(normalize(m.group(1).replace("\\'", "'")))
    return names


def map_category(raw: str | None) -> str:
    mapping = {
        "Spirits": "Spirits",
        "Mixers": "Mixers",
        "Juices": "Juices",
        "Beer and Wine": "Spirits",
        "Fruits and Vegetables": "Fruits",
        "Spices": "Garnishes",
    }
    if raw in mapping:
        return mapping[raw]
    if raw in VALID_CATEGORIES:
        return raw
    return "Other"


def is_alcoholic(item: dict, raw_category: str | None = None) -> bool:
    name = item.get("name") or ""
    generic = item.get("genericName") or ""
    type_ = item.get("type") or ""
    category = item.get("category") or ""

    if category in {"Spirits", "Liqueurs"}:
        return True
    if raw_category in ALCOHOLIC_IMB_CATEGORIES:
        return True

    if NON_ALCOHOLIC_NAME_RE.search(name) or NON_ALCOHOLIC_NAME_RE.search(generic):
        return False

    default_abv = DEFAULT_ABV_BY_GENERIC.get(generic)
    if default_abv is not None:
        return default_abv > 0

    combined = f"{name} {generic} {type_}"
    if ALCOHOLIC_NAME_RE.search(combined):
        if NA_MIXER_RE.search(name) and not ALCOHOLIC_NAME_RE.search(type_):
            if category in {"Juices", "Mixers", "Fruits", "Garnishes", "Other"}:
                return False
        return True

    return False


def parse_recipe_refs_from_drinks_ts(path: Path) -> tuple[dict[str, str], set[str]]:
    if not path.exists():
        return {}, set()
    text = path.read_text(encoding="utf-8")
    used_generics: dict[str, str] = {}
    used_brands: set[str] = set()
    for m in re.finditer(
        r"ing\(\s*'((?:\\'|[^'])*)'\s*,\s*'((?:\\'|[^'])*)'([^)]*)\)",
        text,
    ):
        generic = m.group(1).replace("\\'", "'")
        opts = m.group(3)
        brand_m = re.search(r"brandName:\s*'((?:\\'|[^'])*)'", opts)
        is_premium = "mode: 'premium'" in opts
        brand = brand_m.group(1).replace("\\'", "'") if brand_m else None

        if is_premium:
            used_brands.add(normalize(brand or generic))
        else:
            used_generics[normalize(generic)] = generic
            if brand:
                used_brands.add(normalize(brand))
    return used_generics, used_brands


def collect_recipe_refs(drinks: list[dict], *drink_files: Path) -> tuple[dict[str, str], set[str]]:
    used_generics: dict[str, str] = {}
    used_brands: set[str] = set()
    for path in drink_files:
        g, b = parse_recipe_refs_from_drinks_ts(path)
        used_generics.update(g)
        used_brands |= b
    for drink in drinks:
        for ri in drink.get("ingredients", []):
            if ri.get("mode") == "premium":
                brand = (ri.get("brandName") or ri.get("genericName") or "").strip()
                if brand:
                    used_brands.add(normalize(brand))
                continue
            raw = (ri.get("genericName") or "").strip()
            if raw:
                used_generics[normalize(raw)] = raw
            if ri.get("brandName"):
                used_brands.add(normalize(ri["brandName"]))
    return used_generics, used_brands


def is_used_in_recipes(item: dict, used_generics: dict[str, str], used_brands: set[str]) -> bool:
    name = normalize(item.get("name"))
    generic = normalize(item.get("genericName"))
    if name in used_brands:
        return True
    if name in used_generics:
        return True
    if generic in used_generics and name == generic:
        return True
    if generic in used_generics:
        canonical = CANONICAL_BRAND_BY_GENERIC.get(generic)
        if canonical and name == normalize(canonical):
            return True
    return False


def brands_exist_for_generic(ingredients: list[dict], generic_key: str) -> bool:
    for item in ingredients:
        if normalize(item.get("genericName")) == generic_key and normalize(item.get("name")) != generic_key:
            return True
    return False


def prune_redundant_generic_entries(ingredients: list[dict]) -> list[dict]:
    """Drop name==genericName rows when at least one brand row exists for that generic."""
    pruned: list[dict] = []
    for item in ingredients:
        name = normalize(item.get("name"))
        generic = normalize(item.get("genericName"))
        if name == generic and brands_exist_for_generic(ingredients, generic):
            continue
        pruned.append(item)
    return pruned


def parse_existing_catalog_names() -> set[str]:
    text = ING_TS.read_text(encoding="utf-8")
    names: set[str] = set()
    for m in re.finditer(r"name:\s*'((?:\\'|[^'])*)'", text):
        names.add(normalize(m.group(1).replace("\\'", "'")))
    return names


def build_generic_category_map() -> dict[str, str]:
    con = sqlite3.connect(DB)
    cur = con.cursor()
    cur.execute(
        """
        SELECT g.ZNAME AS generic_name, c.ZNAME AS category
        FROM ZINGREDIENT i
        JOIN ZGENERICINGREDIENT g ON g.Z_PK = i.ZGENERICINGREDIENT
        LEFT JOIN ZINGREDIENTCATEGORY c ON c.Z_PK = i.ZCATEGORY
        WHERE g.ZNAME IS NOT NULL
        """
    )
    mapping: dict[str, str] = {}
    for generic_name, category in cur.fetchall():
        key = normalize(generic_name)
        if key and key not in mapping:
            mapping[key] = map_category(category)
    con.close()
    return mapping


def infer_generic_category(generic_name: str, category_map: dict[str, str]) -> str:
    key = normalize(generic_name)
    if key in category_map:
        return category_map[key]
    lower = generic_name.lower()
    if "juice" in lower:
        return "Juices"
    if any(w in lower for w in ("syrup", "sour", "mix", "soda", "cola", "beer", "water", "cream", "milk")):
        return "Mixers"
    if any(w in lower for w in ("lime", "lemon", "orange", "cherry", "mint", "olive", "fruit")):
        return "Fruits" if "juice" not in lower else "Juices"
    return "Other"


def is_alcoholic_generic(generic_name: str, category: str) -> bool:
    item = {"name": generic_name, "genericName": generic_name, "category": category}
    return is_alcoholic(item, None)


def ensure_recipe_generic_entries(
    ingredients: list[dict],
    used_generics: dict[str, str],
    used_brands: set[str],
    existing_catalog: set[str],
    category_map: dict[str, str],
) -> tuple[list[dict], int]:
    present = {normalize(i["name"]) for i in ingredients} | existing_catalog
    used_ids = {i["id"] for i in ingredients}
    added = 0

    for key, generic in sorted(used_generics.items(), key=lambda kv: kv[1].lower()):
        if not key or key in present or key in used_brands:
            continue
        if brands_exist_for_generic(ingredients, key):
            continue
        if CANONICAL_BRAND_BY_GENERIC.get(key):
            continue
        category = infer_generic_category(generic, category_map)
        if is_alcoholic_generic(generic, category):
            continue

        base_id = f"gen-{slugify(generic)}"
        ing_id = base_id
        n = 2
        while ing_id in used_ids:
            ing_id = f"{base_id}-{n}"
            n += 1
        used_ids.add(ing_id)

        ingredients.append(
            {
                "id": ing_id,
                "name": generic,
                "genericName": generic,
                "category": category,
            }
        )
        present.add(key)
        added += 1

    return ingredients, added


def filter_unused_non_alcoholic(
    ingredients: list[dict],
    drinks: list[dict],
    category_map: dict[str, str],
) -> tuple[list[dict], int, int]:
    used_generics, used_brands = collect_recipe_refs(drinks, DRINKS_TS)
    existing_catalog = parse_existing_catalog_names()
    kept: list[dict] = []
    removed = 0
    for item in ingredients:
        raw_category = item.pop("_rawCategory", None)
        if is_alcoholic(item, raw_category) or is_used_in_recipes(item, used_generics, used_brands):
            kept.append(item)
        else:
            removed += 1
    kept, added = ensure_recipe_generic_entries(kept, used_generics, used_brands, existing_catalog, category_map)
    kept = prune_redundant_generic_entries(kept)
    return kept, removed, added


def map_drink_type(raw: str | None) -> str:
    if not raw:
        return "Cocktail"
    if raw in DRINK_TYPES:
        return raw
    if raw.lower() == "martini":
        return "Martini"
    if "shot" in raw.lower():
        return "Shot"
    return "Other"


def format_amount(amount: str | None, unit: str | None) -> str:
    a = (amount or "").strip()
    u = (unit or "").strip()
    if a and u:
        return f"{a} {u}"
    if a:
        return a
    if u:
        return u
    return "1 oz"


def premium_recipe_ingredient(
    brand: str,
    amount: str,
    *,
    optional: bool = False,
    allow_generic: bool = False,
) -> dict:
    return {
        "genericName": brand,
        "brandName": brand,
        "amount": amount,
        "mode": "premium",
        "allowGenericSubstitution": allow_generic,
        "optional": optional,
    }


def resolve_recipe_ingredient(
    ing: dict,
    drink_name: str,
    instructions: str,
) -> dict | None:
    generic = (ing["generic_name"] or ing["brand_name"] or "").strip()
    brand = (ing["brand_name"] or "").strip()
    if not generic and not brand:
        return None

    amount = format_amount(ing["amount"], ing["unit"])
    optional = bool(ing["optional"])
    allow_generic = bool(ing["allow_generic"])
    use_premium = bool(ing["use_premium"])
    generic_norm = normalize(generic)

    if use_premium and brand:
        return premium_recipe_ingredient(
            brand, amount, optional=optional, allow_generic=allow_generic
        )

    if generic_norm == "7-up or sprite":
        return premium_recipe_ingredient("7-Up", amount, optional=optional)

    if generic_norm == "cherry 7-up or cherry soda":
        return premium_recipe_ingredient(
            "Cherry 7-Up or Cherry Soda", amount, optional=optional
        )

    return {
        "genericName": generic,
        "amount": amount,
        "allowGenericSubstitution": allow_generic,
        "optional": optional,
        "mode": "generic",
    }


def build_ingredients(existing: set[str]) -> tuple[list[dict], set[str]]:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute(
        """
        SELECT
          i.ZNAME AS brand_name,
          i.ZCOMPANY AS company,
          i.ZCOUNTRY AS country,
          i.ZFLAVOR AS flavor,
          g.ZNAME AS generic_name,
          c.ZNAME AS category,
          t.ZNAME AS spirit_type
        FROM ZINGREDIENT i
        LEFT JOIN ZGENERICINGREDIENT g ON g.Z_PK = i.ZGENERICINGREDIENT
        LEFT JOIN ZINGREDIENTCATEGORY c ON c.Z_PK = i.ZCATEGORY
        LEFT JOIN ZINGREDIENTTYPE t ON t.Z_PK = i.ZTYPE
        WHERE (i.ZHIDEINGREDIENT = 0 OR i.ZHIDEINGREDIENT IS NULL)
        ORDER BY i.ZNAME COLLATE NOCASE
        """
    )
    rows = cur.fetchall()
    con.close()

    used_ids: set[str] = set()
    items: list[dict] = []
    for row in rows:
        name = (row["brand_name"] or "").strip()
        if not name or normalize(name) in existing:
            continue
        existing.add(normalize(name))

        base_id = f"brand-{slugify(name)}"
        ing_id = base_id
        n = 2
        while ing_id in used_ids:
            ing_id = f"{base_id}-{n}"
            n += 1
        used_ids.add(ing_id)

        generic = (row["generic_name"] or name).strip() or name
        item: dict = {
            "id": ing_id,
            "name": name,
            "genericName": generic,
            "category": map_category(row["category"]),
        }
        if row["company"]:
            item["company"] = row["company"].strip()
        if row["country"]:
            item["country"] = row["country"].strip()
        if row["flavor"]:
            item["flavor"] = row["flavor"].strip()
        if row["spirit_type"]:
            item["type"] = row["spirit_type"].strip()
        item["_rawCategory"] = row["category"]
        items.append(item)
    return items, existing


def build_drinks(existing_drink_names: set[str], ingredient_names: set[str]) -> list[dict]:
    con = sqlite3.connect(DB)
    con.row_factory = sqlite3.Row
    cur = con.cursor()
    cur.execute(
        """
        SELECT
          d.Z_PK AS drink_pk,
          d.ZNAME AS drink_name,
          d.ZMIXINSTRUCTIONS AS instructions,
          d.ZMIXSTEP1 AS step1,
          d.ZMIXSTEP2 AS step2,
          d.ZMIXSTEP3 AS step3,
          dt.ZNAME AS drink_type,
          gt.ZNAME AS glass
        FROM ZDRINK d
        LEFT JOIN ZDRINKTYPE dt ON dt.Z_PK = d.ZDRINKTYPE
        LEFT JOIN ZGLASSTYPE gt ON gt.Z_PK = d.ZGLASSTYPE
        WHERE (d.ZHIDEDRINK = 0 OR d.ZHIDEDRINK IS NULL)
        ORDER BY d.ZNAME COLLATE NOCASE
        """
    )
    drinks = cur.fetchall()

    cur.execute(
        """
        SELECT
          di.ZDRINK AS drink_pk,
          di.ZDISPLAYORDER AS display_order,
          di.ZOPTIONAL AS optional,
          di.ZALLOWGENERIC AS allow_generic,
          di.ZUSEPREMIUM AS use_premium,
          di.ZAMOUNT AS amount,
          u.ZNAME AS unit,
          g.ZNAME AS generic_name,
          i.ZNAME AS brand_name
        FROM ZDRINKINGREDIENT di
        LEFT JOIN ZGENERICINGREDIENT g ON g.Z_PK = di.ZGENERICINGREDIENT
        LEFT JOIN ZINGREDIENT i ON i.Z_PK = di.ZINGREDIENT
        LEFT JOIN ZUNITOFMEASURE u ON u.Z_PK = di.ZUNITOFMEASURE
        ORDER BY di.ZDRINK, di.ZDISPLAYORDER, di.Z_PK
        """
    )
    ing_rows = cur.fetchall()
    con.close()

    ings_by_drink: dict[int, list] = {}
    for row in ing_rows:
        ings_by_drink.setdefault(row["drink_pk"], []).append(dict(row))

    used_ids: set[str] = set()
    out: list[dict] = []
    for drink in drinks:
        name = (drink["drink_name"] or "").strip()
        if not name or normalize(name) in existing_drink_names:
            continue
        existing_drink_names.add(normalize(name))

        base_id = slugify(name)
        drink_id = base_id
        n = 2
        while drink_id in used_ids:
            drink_id = f"{base_id}-{n}"
            n += 1
        used_ids.add(drink_id)

        steps = [drink["step1"], drink["step2"], drink["step3"]]
        steps = [s.strip() for s in steps if s and str(s).strip()]
        instructions = (drink["instructions"] or "").strip()
        if not instructions and steps:
            instructions = " ".join(steps)
        if not instructions:
            instructions = "Combine ingredients and serve."

        recipe: list[dict] = []
        for ing in ings_by_drink.get(drink["drink_pk"], []):
            entry = resolve_recipe_ingredient(ing, name, instructions)
            if entry:
                recipe.append(entry)

        if not recipe:
            continue

        out.append(
            {
                "id": drink_id,
                "name": name,
                "type": map_drink_type(drink["drink_type"]),
                "glass": (drink["glass"] or "Cocktail glass").strip(),
                "instructions": instructions,
                "ingredients": recipe,
            }
        )
    return out


def render_ingredient(item: dict) -> str:
    parts = [
        f"    id: '{ts_str(item['id'])}'",
        f"    name: '{ts_str(item['name'])}'",
        f"    genericName: '{ts_str(item['genericName'])}'",
    ]
    for key in ("company", "country", "flavor", "type"):
        if item.get(key):
            parts.append(f"    {key}: '{ts_str(item[key])}'")
    parts.append(f"    category: '{ts_str(item['category'])}'")
    return "  {\n" + ",\n".join(parts) + ",\n  }"


def render_drink(d: dict) -> str:
    dtype = d["type"]
    fn = "shot" if dtype == "Shot" else "cocktail"
    ing_lines = []
    for ing in d["ingredients"]:
        opts = []
        if ing.get("brandName"):
            opts.append(f"brandName: '{ts_str(ing['brandName'])}'")
        if ing.get("optional"):
            opts.append("optional: true")
        if not ing.get("allowGenericSubstitution", True):
            opts.append("allowGenericSubstitution: false")
        if ing.get("mode") == "premium":
            opts.append("mode: 'premium'")
        opt_str = ", { " + ", ".join(opts) + " }" if opts else ""
        ing_lines.append(f"    ing('{ts_str(ing['genericName'])}', '{ts_str(ing['amount'])}'{opt_str}),")

    if fn == "shot":
        if len(ing_lines) == 1:
            body = ing_lines[0]
        else:
            body = "\n".join(ing_lines)
        return (
            f"  {fn}('{ts_str(d['id'])}', '{ts_str(d['name'])}', [\n{body}\n  ], "
            f"'{ts_str(d['instructions'])}'),"
        )

    return (
        f"  cocktail('{ts_str(d['id'])}', '{ts_str(d['name'])}', [\n"
        + "\n".join(ing_lines)
        + f"\n  ], '{ts_str(d['glass'])}', '{ts_str(d['instructions'])}', '{ts_str(dtype)}'),"
    )


def write_ingredients_file(items: list[dict]) -> None:
    OUT_ING.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "import type { Ingredient } from '../../types'",
        "import { enrichWithUsState } from '../ingredientStates'",
        "",
        "/** Imported from legacy InMyBar catalog — merged into SEED_INGREDIENTS */",
        "export const INMYBAR_SEED_INGREDIENTS: Ingredient[] = [",
    ]
    for item in items:
        lines.append(render_ingredient(item) + ",")
    lines.append("].map((item) => enrichWithUsState(item))")
    lines.append("")
    OUT_ING.write_text("\n".join(lines), encoding="utf-8")


def write_drinks_file(drinks: list[dict]) -> None:
    OUT_DRINKS.parent.mkdir(parents=True, exist_ok=True)
    lines = [
        "import type { Drink } from '../../types'",
        "",
        "function ing(",
        "  genericName: string,",
        "  amount: string,",
        "  opts: Partial<import('../../types').RecipeIngredient> = {}",
        "): import('../../types').RecipeIngredient {",
        "  return {",
        "    genericName,",
        "    amount,",
        "    allowGenericSubstitution: true,",
        "    optional: false,",
        "    mode: 'generic',",
        "    ...opts,",
        "  }",
        "}",
        "",
        "function shot(",
        "  id: string,",
        "  name: string,",
        "  ingredients: import('../../types').RecipeIngredient[],",
        "  instructions = 'Pour ingredients into a shot glass. Drink in one gulp.'",
        "): Drink {",
        "  return { id, name, type: 'Shot', glass: 'Shot/Shooter Glass', instructions, ingredients }",
        "}",
        "",
        "function cocktail(",
        "  id: string,",
        "  name: string,",
        "  ingredients: import('../../types').RecipeIngredient[],",
        "  glass: string,",
        "  instructions: string,",
        "  type: import('../../types').DrinkType = 'Cocktail',",
        "): Drink {",
        "  return { id, name, type, glass, instructions, ingredients }",
        "}",
        "",
        "/** Imported from legacy InMyBar catalog — merged into SEED_DRINKS */",
        "export const INMYBAR_SEED_DRINKS: Drink[] = [",
    ]
    for drink in drinks:
        lines.append(render_drink(drink))
    lines.append("]")
    lines.append("")
    OUT_DRINKS.write_text("\n".join(lines), encoding="utf-8")


def main() -> None:
    seed_ings = parse_seed_ingredient_names()
    seed_drinks = parse_seed_drink_names()
    category_map = build_generic_category_map()
    ingredients, _ = build_ingredients(set(seed_ings))
    drinks = build_drinks(set(seed_drinks), set(seed_ings))
    before = len(ingredients)
    ingredients, removed, added = filter_unused_non_alcoholic(ingredients, drinks, category_map)
    write_ingredients_file(ingredients)
    write_drinks_file(drinks)
    print(
        f"Wrote {len(ingredients)} ingredients -> {OUT_ING} "
        f"(removed {removed} unused non-alcoholic brands of {before}, added {added} recipe generics)"
    )
    print(f"Wrote {len(drinks)} drinks -> {OUT_DRINKS}")


if __name__ == "__main__":
    main()
