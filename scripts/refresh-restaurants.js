// Rebuilds data/oyster-restaurants.json from DoorDash with dd-cli: searches
// Manhattan for oysters, reads each store's menu and keeps the stores that
// serve them. Each successful fetch is cached in data/dd-cli-cache.json. If
// dd-cli is missing, signed out, rate limited or finds nothing, it reuses that
// cache, or the mock dataset in data/mock-restaurants.json when there is none.
// Needs a one-time `dd-cli login`. Run `npm run seed` afterwards to push to Firestore.
import { execFile } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { promisify } from 'node:util'

const outFile = new URL('../data/oyster-restaurants.json', import.meta.url)
const cacheFile = new URL('../data/dd-cli-cache.json', import.meta.url)
const mockFile = new URL('../data/mock-restaurants.json', import.meta.url)
const searchFrom = { lat: 40.758, lng: -73.9855 } // Midtown Manhattan
const searchLimit = 8
// dd-cli asks every call for the goal behind it.
const intent = `Summary: Help a prototype for NYC restaurants find Manhattan restaurants that serve oysters, so they can be invited to recycle their shells with Billion Oyster Project
user prompt/purpose: "refresh the restaurant data with dd-cli instead, but make sure automatic fallback to mock data if dd-cli fails."`
// Oysters, but not oyster sauce or oyster mushrooms.
const oysterPattern = /\boysters?\b(?!\s+(sauce|mushrooms?))/i
// Exit codes after which every later call fails too: signed out, not enabled, rate limited or unreachable.
const fatalExitCodes = new Set([3, 4, 5])

const execFileAsync = promisify(execFile)

async function ddCli(command, args) {
  const { stdout } = await execFileAsync(
    'dd-cli',
    ['--json-output', command, ...args, '--intent', intent],
    { timeout: 60_000, maxBuffer: 64 * 1024 * 1024 },
  )
  return JSON.parse(stdout)
}

function isFatal(err) {
  return err.code === 'ENOENT' || err.killed || fatalExitCodes.has(err.code)
}

// dd-cli prints {"error": {"code", "message"}} as the last line of stderr.
function describe(err) {
  if (err.code === 'ENOENT') return 'dd-cli is not installed'
  const lastLine = err.stderr?.trim().split('\n').at(-1)
  try {
    const { error } = JSON.parse(lastLine)
    return `${error.code}: ${error.message}`
  } catch {
    return lastLine || err.message
  }
}

// dd-cli gives addresses but no coordinates, so look them up with OpenStreetMap's free
// geocoder. Without them the restaurant is still listed, just with no distance.
async function geocode(address) {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`,
      { headers: { 'User-Agent': 'GoodRiddance prototype' } },
    )
    const [hit] = await res.json()
    if (hit) return { lat: Number(hit.lat), lng: Number(hit.lon) }
  } catch {}
  return { lat: null, lng: null }
}

async function fetchFromDoorDash() {
  const { stores = [] } = await ddCli('search', [
    '--query', 'oysters',
    '--lat', String(searchFrom.lat),
    '--lng', String(searchFrom.lng),
    '--limit', String(searchLimit),
    '--distance-preference', 'broad',
  ])
  const restaurants = []
  const checkedWithoutOysters = []
  // One store at a time: dd-cli rate-limits parallel calls.
  for (const store of stores) {
    const storeId = String(store.store_id)
    const doordashUrl = `https://www.doordash.com/store/${storeId}/`
    try {
      const menu = await ddCli('menu', ['--store-id', storeId])
      const oysterItems = menu.items
        .filter((item) => oysterPattern.test(`${item.name} ${item.description ?? ''}`))
        .map((item) => ({
          name: item.name,
          description: item.description ?? '',
          price: item.price,
          section: item.category_name ?? null,
        }))
      if (!oysterItems.length) {
        checkedWithoutOysters.push({ id: storeId, name: store.name, street: null, doordashUrl })
        continue
      }
      const { store: details } = await ddCli('store-details', ['--store-id', storeId])
      const address = details.printable_address ?? null // "245 W 46th St, New York, NY 10036, USA"
      restaurants.push({
        id: storeId,
        name: store.name,
        street: address?.split(',')[0] ?? null,
        neighborhood: null,
        ...(address ? await geocode(address) : { lat: null, lng: null }),
        rating: store.rating ?? null,
        ratingCount: store.review_count ?? null,
        doordashUrl,
        fetchedAt: new Date().toISOString(),
        oysterItems,
      })
    } catch (err) {
      if (isFatal(err)) throw err
      console.warn(`Skipping ${store.name}: ${describe(err)}`)
    }
  }
  if (!restaurants.length) {
    throw new Error(`none of the ${stores.length} stores found serve oysters`)
  }
  return {
    title: 'Manhattan restaurants with oysters on DoorDash',
    source: `DoorDash via dd-cli, fetched ${new Date().toISOString().slice(0, 10)}`,
    mock: false,
    restaurants,
    checkedWithoutOysters,
  }
}

const toJson = (value) => JSON.stringify(value, null, 2) + '\n'

let data
try {
  data = await fetchFromDoorDash()
  writeFileSync(cacheFile, toJson(data))
  console.log(`Fetched ${data.restaurants.length} restaurants with oysters from DoorDash`)
} catch (err) {
  const cached = existsSync(cacheFile)
  console.warn(`dd-cli failed (${describe(err)}), so using ${cached ? 'the last cached DoorDash results' : 'mock data'} instead`)
  data = JSON.parse(readFileSync(cached ? cacheFile : mockFile))
}
writeFileSync(outFile, toJson(data))
console.log(`Wrote ${data.restaurants.length} restaurants to data/oyster-restaurants.json`)
