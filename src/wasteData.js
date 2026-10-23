// Sample data for the menu waste scan and recurring pickups.
// Every number here is a sample estimate, not a measurement. Edit freely.

export const haulingRatePerLb = 0.18 // sample trash-hauling cost per lb, used for "estimated savings"

// What each material is, where it usually goes, and defaults for newly added dishes.
export const materials = {
  'Oyster shells': { short: 'Shells', route: 'Recycle', defaultLbPerOrder: 2, why: 'Shells are cured for a year, then used to build oyster reefs in New York Harbor.' },
  'Shellfish scraps': { short: 'Shells', route: 'Compost', defaultLbPerOrder: 0.3, why: 'Shrimp shells and heads can go to commercial compost if the collector accepts seafood.' },
  'Food scraps': { short: 'Scraps', route: 'Compost', defaultLbPerOrder: 0.4, why: 'Prep trimmings and plate scraps can be composted instead of going to landfill.' },
  'Used cooking oil': { short: 'Oil', route: 'Biofuel', defaultLbPerOrder: 0.2, why: 'Used fryer oil can be collected and processed into biofuel instead of going down the drain.' },
  'Cardboard & paper': { short: 'Cardboard', route: 'Recycle', why: 'Clean, dry cardboard from ingredient deliveries can be recycled.' },
  'Aluminum cans & foil': { short: 'Cans', route: 'Recycle', why: 'Empty, rinsed cans and foil trays can be recycled.' },
}

// Partners that pick up each material. The first match is the suggested one.
export const partners = {
  bop: { name: 'Billion Oyster Project', type: 'Shell recycling', initials: 'BO', container: 'bucket',
    accepts: ['Oyster shells'],
    blurb: 'Collects shells from NYC restaurants, cures them on Governors Island, and uses them to build oyster reefs in New York Harbor. Confirm current participation requirements.' },
  compost: { name: 'Neighborhood compost collective · fictional', type: 'Commercial organics', initials: 'NC', container: 'bin',
    accepts: ['Food scraps', 'Shellfish scraps', 'Oyster shells'],
    blurb: 'Collects food scraps for composting. Confirm whether seafood and shells are accepted.' },
  oil: { name: 'Brooklyn cooking-oil collector · fictional', type: 'Used oil for biofuel', initials: 'BC', container: 'drum',
    accepts: ['Used cooking oil'],
    blurb: 'Collects used fryer oil in sealed drums for processing into biofuel.' },
  coop: { name: 'Brooklyn materials co-op · fictional', type: 'Packaging recycling', initials: 'MC', container: 'bin',
    accepts: ['Cardboard & paper', 'Aluminum cans & foil'],
    blurb: 'Pools packaging recycling across nearby kitchens. Confirm accepted materials first.' },
}

// What the waste scan found for each starting dish (keyed by menu item id).
// Dishes left out (sourdough, salad) have no byproduct worth a separate pickup.
export const wasteProfiles = {
  1: { material: 'Oyster shells', lbPerOrder: 2.2, ordersPerWeek: 40, why: materials['Oyster shells'].why,
    donation: { eligible: false, note: 'Not eligible: raw shellfish can’t be donated as food' } },
  2: { material: 'Food scraps', lbPerOrder: 0.4, ordersPerWeek: 30, why: 'Salmon trimmings and vegetable prep scraps can be composted.',
    donation: { eligible: true, note: 'Unserved cooked portions may be donated if held at a safe temperature' } },
  3: { material: 'Shellfish scraps', lbPerOrder: 0.3, ordersPerWeek: 35, why: materials['Shellfish scraps'].why,
    donation: { eligible: false, note: 'Shells aren’t food. Unserved cooked shrimp may qualify' } },
  5: { material: 'Used cooking oil', lbPerOrder: 0.2, ordersPerWeek: 30, why: materials['Used cooking oil'].why,
    donation: { eligible: false, note: 'Not food, so donation doesn’t apply' } },
}

// A waste profile for a dish added or edited in the menu form.
export function wasteForMaterial(material, previous) {
  if (!material) return null
  if (previous?.material === material) return previous
  return { material, lbPerOrder: materials[material].defaultLbPerOrder, ordersPerWeek: 20, why: materials[material].why, donation: null }
}

export function partnersFor(material) {
  return Object.entries(partners).filter(([, p]) => p.accepts.includes(material)).map(([id, p]) => ({ id, ...p }))
}

export function weeklyLb(items, material) {
  return items.filter(i => i.waste?.material === material).reduce((sum, i) => sum + i.waste.lbPerOrder * i.waste.ordersPerWeek, 0)
}

export function monthlySavings(lbPerWeek) {
  return lbPerWeek * 52 / 12 * haulingRatePerLb
}

// ---- Dates (kept as local "YYYY-MM-DD" strings so time zones don't shift days)

export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const jsDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// The first pickup day strictly after `afterKey` (today if not given).
export function nextPickupDate(days, afterKey) {
  const start = afterKey ? fromKey(afterKey) : new Date()
  for (let i = 1; i <= 7; i++) {
    const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    if (days.includes(jsDays[day.getDay()])) return toKey(day)
  }
  return null
}

export function formatDate(key) {
  return fromKey(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

export const timeWindows = ['7:00–9:00 AM', '9:00–11:00 AM', '12:00–2:00 PM', '3:00–5:00 PM', '6:00–8:00 PM']

// One pickup already running, so the page isn't empty. Oyster shells are left for the demo.
export const samplePickups = [
  { id: 'sample-compost', material: 'Food scraps', partnerId: 'compost', frequency: 'Weekly', days: ['Tue', 'Fri'],
    window: '9:00–11:00 AM', containers: 2, address: '87 Atlantic Avenue, Brooklyn, NY 11201', instructions: 'Bins are by the back entrance.', status: 'active' },
]

// Past pickups for the History tab (sample).
export const pickupHistory = [
  { date: '2026-10-20', partnerId: 'compost', material: 'Food scraps', lb: 6.5, status: 'Completed', driver: 'Andre' },
  { date: '2026-10-16', partnerId: 'compost', material: 'Food scraps', lb: 5.8, status: 'Completed', driver: 'Priya' },
  { date: '2026-10-13', partnerId: 'compost', material: 'Food scraps', lb: null, status: 'Skipped', driver: null },
  { date: '2026-10-09', partnerId: 'compost', material: 'Food scraps', lb: 6.2, status: 'Completed', driver: 'Marcus' },
  { date: '2026-10-06', partnerId: 'compost', material: 'Food scraps', lb: 7.1, status: 'Completed', driver: 'Andre' },
  { date: '2026-10-02', partnerId: 'compost', material: 'Food scraps', lb: 5.4, status: 'Completed', driver: 'Lena' },
  { date: '2026-09-29', partnerId: 'compost', material: 'Food scraps', lb: 6.0, status: 'Completed', driver: 'Priya' },
  { date: '2026-09-25', partnerId: 'compost', material: 'Food scraps', lb: 6.8, status: 'Completed', driver: 'Marcus' },
  { date: '2026-09-22', partnerId: 'compost', material: 'Food scraps', lb: null, status: 'Skipped', driver: null },
  { date: '2026-09-18', partnerId: 'compost', material: 'Food scraps', lb: 5.9, status: 'Completed', driver: 'Lena' },
]
