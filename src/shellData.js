// Mock data for the oyster-shell workflow. Restaurant numbers are sample
// estimates; Billion Oyster Project facts are from billionoysterproject.org.

// The restaurant's menu. `shellsPerWeek` (sample) marks the items whose shells go to BOP.
export const menuCategories = ['Raw bar', 'Starters', 'Mains', 'Sides', 'Drinks']
export const menu = [
  { id: 'east-coast', category: 'Raw bar', name: 'East Coast Oysters', detail: 'Half dozen · cucumber mignonette, lemon', price: 24, shellsPerWeek: 720 },
  { id: 'west-coast', category: 'Raw bar', name: 'West Coast Oysters', detail: 'Half dozen · shallot vinegar', price: 26, shellsPerWeek: 300 },
  { id: 'platter', category: 'Raw bar', name: 'Oyster Platter', detail: 'A dozen, chef’s selection', price: 45, shellsPerWeek: 230 },
  { id: 'shrimp', category: 'Raw bar', name: 'Shrimp Cocktail', detail: 'Five jumbo shrimp · cocktail sauce', price: 19 },
  { id: 'rockefeller', category: 'Starters', name: 'Oysters Rockefeller', detail: 'Six baked oysters · spinach, parmesan', price: 26, shellsPerWeek: 150 },
  { id: 'calamari', category: 'Starters', name: 'Crispy Calamari', detail: 'Cherry peppers, lemon aioli', price: 18 },
  { id: 'little-gem', category: 'Starters', name: 'Little Gem Salad', detail: 'Parmesan, green goddess', price: 14 },
  { id: 'salmon', category: 'Mains', name: 'Grilled Atlantic Salmon', detail: 'Herb potatoes, lemon butter', price: 32 },
  { id: 'lobster-roll', category: 'Mains', name: 'Lobster Roll', detail: 'Brown-butter brioche, fries', price: 34 },
  { id: 'fish-chips', category: 'Mains', name: 'Fish & Chips', detail: 'Beer-battered cod, tartar sauce', price: 27 },
  { id: 'fries', category: 'Sides', name: 'Fries', detail: 'Old Bay salt', price: 8 },
  { id: 'broccolini', category: 'Sides', name: 'Charred Broccolini', detail: 'Chili, garlic', price: 10 },
  { id: 'muscadet', category: 'Drinks', name: 'Muscadet', detail: 'Glass', price: 14 },
  { id: 'lager', category: 'Drinks', name: 'Draft Lager', detail: '16 oz', price: 9 },
]
export const oysterItems = menu.filter((item) => item.shellsPerWeek)

export const restaurant = {
  name: 'Harbor & Hearth',
  street: '87 Atlantic Avenue',
  city: 'Brooklyn',
  state: 'NY',
  zip: '11201',
  lat: 40.6912,
  lng: -73.9973,
  manager: 'Restaurant Owner',
  role: 'Restaurant manager',
  oystersPerWeek: oysterItems.reduce((sum, item) => sum + item.shellsPerWeek, 0),
}

export const lbPerShell = 0.15 // sample: weight of one oyster's two shell halves
export const oystersPerShell = [10, 20] // BOP: each shell can become home for 10–20 oysters

export const bop = {
  name: 'Billion Oyster Project',
  dropoff: 'BOP shell transfer station, Fulton Fish Market Co-op, Hunts Point',
  curing: 'Governors Island',
}

export const carriers = {
  bop: {
    name: 'Billion Oyster Project truck',
    short: 'BOP truck',
    icon: 'truck',
    container: '64-gal bin',
    detail: 'Free. BOP’s route truck collects bins from partner restaurants four times a week.',
  },
  dasher: {
    name: 'DoorDash Dasher',
    short: 'Dasher',
    icon: 'people',
    container: '5-gal bucket',
    detail: 'On demand. A Dasher drives sealed buckets to BOP’s transfer station when the truck route doesn’t fit.',
  },
}

export const timeWindows = ['6:00–8:00 AM', '8:00–10:00 AM', '10:00 AM–12:00 PM', '12:00–2:00 PM']
export const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const defaultSchedule = {
  carrier: 'bop',
  days: ['Mon', 'Wed', 'Fri'],
  window: '8:00–10:00 AM',
  containers: 2,
  instructions: 'Bins are inside the back door, next to the walk-in.',
}

const scheduleKey = 'goodriddance-shell-schedule'

export function readSchedule() {
  try {
    const saved = JSON.parse(localStorage.getItem(scheduleKey))
    return Object.hasOwn(carriers, saved?.carrier) && saved.days?.length ? { ...defaultSchedule, ...saved } : defaultSchedule
  } catch {
    return defaultSchedule
  }
}

export function writeSchedule(schedule) {
  try {
    localStorage.setItem(scheduleKey, JSON.stringify(schedule))
    return true
  } catch {
    return false
  }
}

// ---- Dates, kept as local "YYYY-MM-DD" strings so time zones don't shift days

const jsDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function toKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function fromKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// The next (step 1) or previous (step -1) `count` dates that fall on `days`, not counting today.
function scheduledDates(days, count, step) {
  const dates = []
  const today = new Date()
  for (let i = step; dates.length < count && Math.abs(i) <= 28; i += step) {
    const day = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i)
    if (days.includes(jsDays[day.getDay()])) dates.push(toKey(day))
  }
  return dates
}

export function upcomingPickups(days, count) {
  return scheduledDates(days, count, 1)
}

export function daysAgo(n) {
  const today = new Date()
  return toKey(new Date(today.getFullYear(), today.getMonth(), today.getDate() - n))
}

export function formatDate(key, options = { weekday: 'short', month: 'short', day: 'numeric' }) {
  return fromKey(key).toLocaleDateString('en-US', options)
}

// Sample past pickups on the default schedule, most recent first, dated back from today.
// Each one produces a donation receipt for the restaurant's records.
const samplePickups = [
  { carrier: 'bop', driver: 'Boris', lb: 71 },
  { carrier: 'bop', driver: 'Boris', lb: 68 },
  { carrier: 'dasher', driver: 'Priya', lb: 34 },
  { carrier: 'bop', driver: 'Boris', lb: 74 },
  { carrier: 'bop', driver: 'Boris', lb: 66 },
  { carrier: 'bop', driver: 'Boris', lb: 72 },
  { carrier: 'bop', driver: 'Boris', lb: 69 },
  { carrier: 'bop', driver: 'Boris', lb: 70 },
]
export const pickupHistory = scheduledDates(defaultSchedule.days, samplePickups.length, -1)
  .map((date, i) => ({ date, ...samplePickups[i], receipt: `GR-${date.replaceAll('-', '')}` }))

// Monday of the week `weeksAgo` weeks before this one.
function weekStart(weeksAgo) {
  const daysSinceMonday = (new Date().getDay() + 6) % 7
  return daysAgo(daysSinceMonday + 7 * weeksAgo)
}

// Sample totals for the last 12 full weeks, oldest first: pounds weighed at BOP's
// transfer station and how many of the week's three pickups a Dasher made.
const sampleWeeks = [
  { lb: 188, dasher: 0 }, { lb: 196, dasher: 0 }, { lb: 201, dasher: 1 }, { lb: 192, dasher: 0 },
  { lb: 207, dasher: 0 }, { lb: 214, dasher: 0 }, { lb: 199, dasher: 0 }, { lb: 210, dasher: 1 },
  { lb: 218, dasher: 0 }, { lb: 205, dasher: 0 }, { lb: 211, dasher: 0 }, { lb: 213, dasher: 1 },
]
export const dasherLbPerPickup = 34 // sample: a Dasher carries buckets, not full bins
export const weeklyShells = sampleWeeks.map((week, i) => ({ ...week, pickups: 3, weekOf: weekStart(sampleWeeks.length - i) }))
