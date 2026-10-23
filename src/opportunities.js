import { bop, restaurant, shellTotals, weeklyShells } from './shellData'

const nycBoroughs = ['New York', 'Brooklyn', 'Queens', 'Bronx', 'Staten Island']

// Grants and press the agent applies to for the restaurant. The programs and
// outlets are real (linked); the statuses are mock. Ready ones have a copy of
// their application form for the Gemini agent to fill, and `criteria`:
// GoodRiddance's own sample eligibility rules, not the programs' official ones.
// Each `check` returns the evidence that the restaurant meets it, or null.
export const opportunities = [
  {
    id: 'rise-awards',
    name: 'NYSRA RISE Awards',
    kind: 'Award',
    detail: 'Community Impact nomination · closes Oct 23',
    url: 'https://www.nysra.org/education-events/rise-awards/',
    status: 'ready',
    deadline: '2026-10-23',
    about: 'The New York State Restaurant Association’s Restaurant Industry Spotlight on Excellence awards. Community Impact honors an individual or group who made a significant impact on their own community or the restaurant community during the past year. You may nominate your own business.',
    criteria: [
      { label: 'Restaurant in New York State', check: ({ restaurant: r }) => r.state === 'NY' && `${r.city}, ${r.state}` },
      { label: 'A community effort this year', check: ({ totals }) => totals.pickups > 0 && `${totals.pickups} shell pickups for ${bop.name} in 12 weeks` },
    ],
    form: {
      fields: [
        { id: 'nominee', label: 'Nominee', type: 'text', maxWords: 12 },
        {
          id: 'category', label: 'Award category', type: 'select',
          options: ['Favorite Restaurant (Regional)', 'Front of House Team', 'Back of House Team', 'Favorite Mixologist', 'MVP', 'Innovation Award', 'Community Impact', 'Favorite Social Media', 'Rising Star', 'Caterer of the Year', 'Women in Hospitality Award'],
        },
        { id: 'business', label: 'Business name and address', type: 'text', maxWords: 20 },
        { id: 'impact', label: 'What impact did they make in the past year?', type: 'textarea', maxWords: 120 },
        { id: 'why', label: 'Why do they deserve a RISE Award?', type: 'textarea', maxWords: 80 },
        { id: 'contact', label: 'Your name, email and phone', type: 'text', maxWords: 20 },
      ],
    },
  },
  {
    id: 'amny',
    name: 'amNY',
    kind: 'Press',
    detail: 'Story pitch about your shell recycling',
    url: 'https://www.amny.com/contact-us/',
    status: 'ready',
    about: 'A story pitch to amNY’s newsroom, a free New York City daily, sent through its contact page. Pitches should be short, local and newsworthy.',
    criteria: [
      { label: 'NYC restaurant', check: ({ restaurant: r }) => nycBoroughs.includes(r.city) && `${r.city}, ${r.state}` },
      { label: 'Numbers to back the story', check: ({ totals }) => totals.lb >= 1000 && `${totals.lb.toLocaleString()} lb of shell recycled in 12 weeks` },
    ],
    form: {
      fields: [
        { id: 'subject', label: 'Subject line', type: 'text', maxWords: 14 },
        { id: 'pitch', label: 'Pitch', type: 'textarea', maxWords: 150 },
        { id: 'availability', label: 'Interview and photo availability', type: 'text', maxWords: 30 },
        { id: 'contact', label: 'Contact', type: 'text', maxWords: 20 },
      ],
    },
  },
  {
    id: 'bop-spotlight',
    name: 'Billion Oyster Project spotlight',
    kind: 'Press',
    detail: 'Monthly restaurant feature',
    url: 'https://www.billionoysterproject.org/restaurants',
    status: 'Accepted',
  },
  {
    id: 'ny-food-waste-grant',
    name: 'NY Food Waste Mitigation Grant',
    kind: 'Grant',
    detail: 'Up to 50% of shell-bin costs · GoodRiddance applied for you',
    url: 'https://esd.ny.gov/business-food-waste-mitigation-grant-program',
    status: 'In review',
  },
  {
    id: 'eater-ny',
    name: 'Eater NY',
    kind: 'Press',
    detail: 'Tip about your shell recycling',
    url: 'https://ny.eater.com/contact',
    status: 'Submitted',
  },
  {
    id: 'qwoted',
    name: 'Qwoted',
    kind: 'Press',
    detail: 'Reporters looking for food-waste sources',
    url: 'https://www.qwoted.com/for-smb-personal-brands/',
    status: '2 reporter matches',
  },
]

// Each criterion with the restaurant's evidence for it (null when it isn't met).
export function eligibility(opportunity) {
  const facts = { restaurant, totals: shellTotals(weeklyShells) }
  return (opportunity.criteria ?? []).map((c) => ({ label: c.label, evidence: c.check(facts) || null }))
}

export function isEligible(opportunity) {
  return eligibility(opportunity).every((c) => c.evidence)
}
