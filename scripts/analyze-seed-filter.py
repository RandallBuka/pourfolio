"""Analyze inmybar seed filter stats."""
from __future__ import annotations

import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("gen", ROOT / "scripts" / "generate-inmybar-seeds.py")
gen = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gen)

seed_ings = gen.parse_seed_ingredient_names()
# Exclude inmybar names already in file
ingredients, _ = gen.build_ingredients(set(seed_ings))
drinks = gen.build_drinks(set(), set(seed_ings))
used_g, used_b = gen.collect_recipe_refs(drinks, gen.DRINKS_TS)

alc = na = na_used = na_unused = 0
by_cat: dict[str, dict[str, int]] = {}
unused_samples: list[str] = []

for item in ingredients:
    raw = item.get("_rawCategory")
    cat = item.get("category", "?")
    alc_flag = gen.is_alcoholic(item, raw)
    used = gen.is_used_in_recipes(item, used_g, used_b)
    bucket = by_cat.setdefault(cat, {"alc": 0, "na": 0, "na_unused": 0})
    if alc_flag:
        alc += 1
        bucket["alc"] += 1
    else:
        na += 1
        bucket["na"] += 1
        if not gen.is_used_in_recipes(item, used_g, used_b):
            na_unused += 1
            bucket["na_unused"] += 1
            if len(unused_samples) < 25:
                unused_samples.append(f"{item['name']} ({item['genericName']})")
        else:
            na_used += 1

print(f"Total inmybar candidates: {len(ingredients)}")
print(f"Alcoholic: {alc}")
print(f"Non-alcoholic: {na} (used {na_used}, unused {na_unused})")
print(f"Recipe refs: {len(used_g)} generics, {len(used_b)} brands")
for cat, c in sorted(by_cat.items()):
    print(f"  {cat}: alc={c['alc']} na={c['na']} na_unused={c['na_unused']}")
print("Sample unused non-alcoholic:")
for name in unused_samples:
    print(f"  - {name}")
