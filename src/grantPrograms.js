import { bop, formatDate, lbPerShell, toKey } from './shellData'

// Shell-recycling grants and incentives the agent checks. Terms are from each
// program's official pages (linked below).
export const programs = [
  {
    id: 'md-shell-grant',
    name: 'Maryland Shell Recycling Grant Program',
    kind: 'Cash grant',
    state: 'MD',
    stateName: 'Maryland',
    award: '$5 per bushel, up to $2,000 a year, subject to available funding',
    applicant: 'restaurant',
    howToApply: 'Donate through a Maryland-authorized shell collector, which records donations and administers the grant.',
    links: [
      { label: 'Oyster Recovery Partnership interest form', url: 'https://secure.everyaction.com/ASWWDSmOBUiBwtzv9XtP3w2' },
      { label: 'Statute (Md. Natural Resources § 4-1019.1)', url: 'https://mgaleg.maryland.gov/mgawebsite/Laws/StatuteText?article=gnr&enactments=false&section=4-1019.1' },
    ],
  },
  {
    id: 'la-shell-credit',
    name: 'Louisiana Restaurant Oyster Shell Recycling Tax Credit',
    kind: 'Refundable tax credit',
    state: 'LA',
    stateName: 'Louisiana',
    award: '$1 per 50 lb, up to $2,000 per restaurant (statewide cap $100,000 a year, tax years 2024–2028)',
    applicant: 'restaurant',
    howToApply: 'Donate through an approved program such as CRCL, keep its official donation receipts, and claim on the Louisiana income-tax return.',
    links: [
      { label: 'Join CRCL’s shell recycling program', url: 'https://connect.crcl.org/node/26' },
      { label: 'Claim instructions', url: 'https://www.crcl.org/program/osrp-tax-credit/' },
      { label: 'Louisiana law', url: 'https://www.legis.la.gov/legis/Law.aspx?d=1336310' },
    ],
  },
  {
    id: 'ny-food-waste-grant',
    name: 'New York Business Food Waste Mitigation Grant',
    kind: 'Infrastructure grant',
    state: 'NY',
    stateName: 'New York',
    award: '$50,000–$750,000, reimbursing up to 50% of eligible project costs for recycling infrastructure and equipment',
    applicant: 'nonprofit',
    deadline: '2026-10-09',
    howToApply: 'A municipality or nonprofit applies, and can apply on behalf of a business. Restaurants can’t apply directly.',
    links: [
      { label: 'Program and application instructions', url: 'https://esd.ny.gov/business-food-waste-mitigation-grant-program' },
      { label: 'CFA application portal', url: 'https://apps.cio.ny.gov/apps/cfa/' },
    ],
  },
]

// Whether `restaurant` can pursue `program`, decided by location first.
export function assess(program, restaurant) {
  if (program.state !== restaurant.state) {
    return {
      eligible: false,
      reason: `Only for ${program.stateName} restaurants. ${restaurant.name} is in ${restaurant.city}, ${restaurant.state}.`,
    }
  }
  const viaPartner = program.applicant === 'nonprofit'
  const deadlinePassed = Boolean(program.deadline) && program.deadline < toKey(new Date())
  return {
    eligible: true,
    viaPartner,
    deadlinePassed,
    reason: viaPartner
      ? `${restaurant.name} is in ${program.stateName}. ${bop.name}, a nonprofit, can apply on its behalf.`
      : `${restaurant.name} is in ${program.stateName} and can apply directly.`,
  }
}

// The application the agent fills in from the restaurant profile.
export function draftApplication(program, restaurant, assessment) {
  const shellsPerYear = restaurant.oystersPerWeek * 52
  const lbPerYear = Math.round(shellsPerYear * lbPerShell)
  return {
    sendTo: assessment.viaPartner ? `${bop.name} (lead applicant)` : program.name,
    timing: assessment.deadlinePassed
      ? `This round closed ${formatDate(program.deadline, { month: 'short', day: 'numeric', year: 'numeric' })}. Approving queues it for the next round.`
      : 'Ready to send as soon as you approve.',
    fields: [
      ['Applicant', assessment.viaPartner ? `${bop.name}, on behalf of ${restaurant.name}` : restaurant.name],
      ['Business', `${restaurant.name}, ${restaurant.street}, ${restaurant.city}, ${restaurant.state} ${restaurant.zip}`],
      ['Project', 'Sealed shell bins and walk-in storage so oyster shells stay out of the trash until pickup'],
      ['Shells diverted', `About ${shellsPerYear.toLocaleString()} shells (${lbPerYear.toLocaleString()} lb) a year`],
      ['Equipment requested', '4 × 64-gallon sealed shell bins, walk-in shelving for bin storage'],
      ['Estimated cost', '$6,400, with up to 50% ($3,200) reimbursed'],
      ['Contact', `${restaurant.manager}, ${restaurant.name}`],
    ],
  }
}
