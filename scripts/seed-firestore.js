// Replaces the Firestore data with data/oyster-restaurants.json.
// Authenticates with your active gcloud account; to use another one:
//   CLOUDSDK_CORE_ACCOUNT=you@example.com npm run seed
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const project = process.env.GCP_PROJECT ?? 'ruthai26nyc-2612'
const root = `projects/${project}/databases/(default)/documents`
const api = `https://firestore.googleapis.com/v1/${root}`
const { restaurants, ...meta } = JSON.parse(
  readFileSync(new URL('../data/oyster-restaurants.json', import.meta.url)),
)
const token = execFileSync('gcloud', ['auth', 'print-access-token'], {
  encoding: 'utf8',
}).trim()

function toValue(v) {
  if (v == null) return { nullValue: null }
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } }
  switch (typeof v) {
    case 'boolean':
      return { booleanValue: v }
    case 'number':
      return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
    case 'string':
      return { stringValue: v }
    default:
      return { mapValue: { fields: toFields(v) } }
  }
}

function toFields(obj) {
  return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, toValue(v)]))
}

function restaurantDocName(r) {
  return `${root}/restaurants/${r.id}`
}

async function call(path, init = {}) {
  const res = await fetch(`${api}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`)
  return res.json()
}

const existing = await call('/restaurants?pageSize=300&mask.fieldPaths=id')
const keep = new Set(restaurants.map(restaurantDocName))
const stale = (existing.documents ?? []).map((d) => d.name).filter((name) => !keep.has(name))

await call(':commit', {
  method: 'POST',
  body: JSON.stringify({
    writes: [
      { update: { name: `${root}/meta/oysterDataset`, fields: toFields(meta) } },
      ...restaurants.map((r) => ({
        update: { name: restaurantDocName(r), fields: toFields(r) },
      })),
      ...stale.map((name) => ({ delete: name })),
    ],
  }),
})

console.log(
  `Seeded ${restaurants.length} restaurants into ${project}` +
    (stale.length ? `, removed ${stale.length} stale` : ''),
)
