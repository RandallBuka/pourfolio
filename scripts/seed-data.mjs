/**
 * Fetches all cocktails from TheCocktailDB and writes src/data/cocktaildb.json
 * Run: npm run seed
 */
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const BASE = 'https://www.thecocktaildb.com/api/json/v1/1'

async function fetchJson(url) {
  const res = await fetch(url)
  return res.json()
}

function parseIngredients(drink) {
  const ingredients = []
  for (let i = 1; i <= 15; i++) {
    const name = drink[`strIngredient${i}`]
    const measure = drink[`strMeasure${i}`]
    if (name?.trim()) {
      ingredients.push({
        genericName: name.trim(),
        amount: measure?.trim() || 'to taste',
        allowGenericSubstitution: true,
        optional: false,
        mode: 'generic',
      })
    }
  }
  return ingredients
}

function mapType(category) {
  const c = (category || '').toLowerCase()
  if (c.includes('shot')) return 'Shot'
  if (c.includes('punch')) return 'Punch'
  if (c.includes('ordinary')) return 'Cocktail'
  return 'Cocktail'
}

async function main() {
  console.log('Fetching cocktail index...')
  const { drinks: letters } = await fetchJson(`${BASE}/search.php?f=a`)
  const all = []
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'

  for (const char of alphabet) {
    const data = await fetchJson(`${BASE}/search.php?f=${char}`)
    if (data.drinks) {
      for (const d of data.drinks) {
        if (!all.find((x) => x.idDrink === d.idDrink)) {
          all.push({
            id: `tdb-${d.idDrink}`,
            name: d.strDrink,
            type: mapType(d.strCategory),
            glass: d.strGlass || 'Glass',
            instructions: d.strInstructions || 'Combine ingredients and serve.',
            image: d.strDrinkThumb,
            ingredients: parseIngredients(d),
          })
        }
      }
    }
    process.stdout.write(`\rFetched letter ${char}: ${all.length} drinks`)
    await new Promise((r) => setTimeout(r, 100))
  }

  console.log(`\nTotal: ${all.length} drinks`)
  const outPath = join(__dirname, '../src/data/cocktaildb.json')
  writeFileSync(outPath, JSON.stringify(all, null, 2))
  console.log(`Written to ${outPath}`)
}

main().catch(console.error)
