// Mock data for the customer-side prototype. No backend: everything here is sample data.
// Shell weights (shellLb) are rough per-dish estimates and must always be labeled "estimated" in the UI.

export const customer = {
  name: 'Charlotte',
  address: '283 Hayes St',
}

export const partner = {
  id: 'p1',
  name: 'Billion Oyster Project',
  url: 'https://www.billionoysterproject.org/restaurants',
}

export const stores = [
  { id: 's1', name: 'Pearl & Pier', cuisine: 'Seafood', rating: 4.7, reviews: 1200,
    etaMin: 25, fee: 0.99, dashPass: true, badge: true, distanceMi: 0.4, art: 'oysters',
    stats90d: { lbRecycled: 1020, pickups: 36 }, partnerId: 'p1' },
  { id: 's2', name: 'Little Neck Raw Bar', cuisine: 'Seafood', rating: 4.6, reviews: 640,
    etaMin: 32, fee: 1.99, dashPass: true, badge: true, distanceMi: 0.9, art: 'clams',
    stats90d: { lbRecycled: 540, pickups: 24 }, partnerId: 'p1' },
  { id: 's3', name: 'Harbor Chowder Co.', cuisine: 'Soups', rating: 4.5, reviews: 410,
    etaMin: 20, fee: 0.0, dashPass: true, badge: true, distanceMi: 1.3, art: 'chowder',
    stats90d: { lbRecycled: 310, pickups: 18 }, partnerId: 'p1' },
  { id: 's4', name: 'Mott St Dumplings', cuisine: 'Chinese', rating: 4.8, reviews: 2300,
    etaMin: 18, fee: 0.0, dashPass: true, badge: false, distanceMi: 0.7, art: 'dumplings' },
]

// shellReturn: shells from this dish can go in the reusable shell bag (oysters and clams only).
// circular: a dish made with rescued ingredients.
export const menu = [
  { id: 'm1', storeId: 's1', section: 'Raw Bar', name: 'East Coast Oysters, dozen', price: 38, art: 'oysters', popular: true,
    desc: 'Twelve on the half shell with mignonette, cocktail sauce and lemon.', shellReturn: true, shellLb: 4.5 },
  { id: 'm2', storeId: 's1', section: 'Raw Bar', name: 'East Coast Oysters, half dozen', price: 20, art: 'oysters',
    desc: 'Six on the half shell with mignonette and lemon.', shellReturn: true, shellLb: 2.25 },
  { id: 'm3', storeId: 's1', section: 'Raw Bar', name: 'Littleneck Clams, half dozen', price: 16, art: 'clams',
    desc: 'Raw littlenecks, cocktail sauce, horseradish.', shellReturn: true, shellLb: 1.5 },
  { id: 'm4', storeId: 's1', section: 'Soups', name: 'Rescue Chowder', price: 13, art: 'chowder', popular: true,
    desc: 'New England clam chowder with sourdough croutons.',
    circular: { label: 'Made with rescued ingredients', note: 'Uses unsold clams and day-old bread.' } },
  { id: 'm5', storeId: 's1', section: 'Soups', name: 'Lobster Bisque', price: 15, art: 'bisque',
    desc: 'Slow-simmered lobster stock, cream, sherry.' },
  { id: 'm6', storeId: 's1', section: 'Mains', name: 'Fish & Chips', price: 23, art: 'fish',
    desc: 'Beer-battered cod, hand-cut fries, tartar sauce.' },
  { id: 'm7', storeId: 's1', section: 'Mains', name: 'Lobster Roll', price: 32, art: 'lobster',
    desc: 'Maine lobster, lemon mayo, toasted split-top bun.' },
  { id: 'm8', storeId: 's1', section: 'Mains', name: 'Steamed Mussels', price: 24, art: 'mussels',
    desc: 'White wine, garlic and herbs, grilled bread.' },
  { id: 'm9', storeId: 's1', section: 'Sides', name: 'Hand-cut Fries', price: 7, art: 'fries',
    desc: 'Sea salt, malt vinegar aioli.' },
  { id: 'm10', storeId: 's1', section: 'Sides', name: 'Old Bay Coleslaw', price: 6, art: 'salad',
    desc: 'Cabbage, carrot, celery seed dressing.' },

  { id: 'n1', storeId: 's2', section: 'Raw Bar', name: 'Littleneck Clams, dozen', price: 28, art: 'clams', popular: true,
    desc: 'Raw littlenecks, cocktail sauce, lemon.', shellReturn: true, shellLb: 3 },
  { id: 'n2', storeId: 's2', section: 'Raw Bar', name: 'Oyster Sampler, dozen', price: 36, art: 'oysters',
    desc: 'Chef’s choice of East and West Coast oysters.', shellReturn: true, shellLb: 4.5 },
  { id: 'n3', storeId: 's2', section: 'Mains', name: 'Linguine with Clams', price: 25, art: 'pasta',
    desc: 'White wine, garlic, chili flakes, parsley.' },
  { id: 'n4', storeId: 's2', section: 'Sides', name: 'Hand-cut Fries', price: 7, art: 'fries',
    desc: 'Sea salt.' },

  { id: 'h1', storeId: 's3', section: 'Soups', name: 'Rescue Chowder', price: 12, art: 'chowder', popular: true,
    desc: 'Clam chowder with sourdough croutons.',
    circular: { label: 'Made with rescued ingredients', note: 'Uses unsold clams and day-old bread.' } },
  { id: 'h2', storeId: 's3', section: 'Soups', name: 'Manhattan Clam Chowder', price: 11, art: 'bisque',
    desc: 'Tomato broth, potato, celery.' },
  { id: 'h3', storeId: 's3', section: 'Sides', name: 'Oyster Crackers', price: 3, art: 'bread',
    desc: 'A handful, for the soup.' },

  { id: 'd1', storeId: 's4', section: 'Mains', name: 'Pork Soup Dumplings', price: 12, art: 'dumplings', popular: true,
    desc: 'Eight xiao long bao, black vinegar, ginger.' },
  { id: 'd2', storeId: 's4', section: 'Mains', name: 'Chive & Shrimp Dumplings', price: 11, art: 'dumplings',
    desc: 'Pan-fried, chili oil.' },
  { id: 'd3', storeId: 's4', section: 'Sides', name: 'Scallion Pancake', price: 7, art: 'bread',
    desc: 'Flaky, crisp, with soy dipping sauce.' },
]

export const dropOffs = [
  { storeId: 's1', distanceMi: 0.4, hours: 'Open until 11 PM' },
  { storeId: 's2', distanceMi: 0.9, hours: 'Open until 10 PM' },
  { storeId: 's3', distanceMi: 1.3, hours: 'Open until 9 PM' },
]

// One entry per order from a badged store. Profile totals are derived from this list.
export const impactHistory = [
  { date: '2026-10-18', storeId: 's1', event: 'Shell bag returned', lb: 4.5 },
  { date: '2026-10-04', storeId: 's2', event: 'Shell bag returned', lb: 3.6 },
  { date: '2026-09-21', storeId: 's1', event: 'Shell bag returned', lb: 4.5 },
  { date: '2026-09-12', storeId: 's3', event: 'Ordered from a shell recycling partner' },
]

export const shellReturnFee = 1.0

export const categoryRows = [
  ['Grocery', 'Alcohol', 'Pets', 'Beauty', 'Convenience'],
  ['Seafood', 'Sushi', 'Chinese', 'Desserts', 'Subs', 'Cookies'],
]
