// Mock data for the oyster-shell workflow. Restaurant numbers are sample
// estimates; Billion Oyster Project facts are from billionoysterproject.org.

export const restaurant = {
  name: 'Harbor & Hearth',
  street: '87 Atlantic Avenue',
  city: 'Brooklyn',
  state: 'NY',
  zip: '11201',
  manager: 'Restaurant Owner',
  oystersPerWeek: 1400,
  oysterItems: [
    { name: 'East Coast Oysters', detail: 'Half dozen · cucumber mignonette, lemon', price: 24 },
    { name: 'Oysters Rockefeller', detail: 'Six baked oysters · spinach, parmesan', price: 26 },
  ],
}

export const lbPerShell = 0.15 // sample: weight of one oyster's two shell halves
export const oystersPerShell = [10, 20] // BOP: each shell can become home for 10–20 oysters

export const bop = {
  name: 'Billion Oyster Project',
  dropoff: 'BOP shell transfer station, Fulton Fish Market Co-op, Hunts Point',
  curing: 'Governors Island',
  url:'https://www.billionoysterproject.org/restaurants',
}

export const journey = [
  { icon: 'menu', title: 'Served', text: 'Shells go into sealed BOP bins instead of the trash.' },
  { icon: 'truck', title: 'Picked up', text: 'A BOP route truck or a DoorDash Dasher collects the bins.' },
  { icon: 'pin', title: 'Hunts Point', text: 'Shells gather at BOP’s transfer station at the Fulton Fish Market Co-op.' },
  { icon: 'clock', title: 'Governors Island', text: 'Once a month they move to BOP’s curing site and cure for about a year.' },
  { icon: 'shore', title: 'New York Harbor', text: 'Cured shells are seeded with larvae and built into living reefs.' },
]

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
