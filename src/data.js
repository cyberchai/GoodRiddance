// Reads the oyster restaurants from Firestore via the server's API.
export async function loadRestaurants() {
  const res = await fetch('/api/restaurants')
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
