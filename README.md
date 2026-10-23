# GoodRiddance

Connects NYC restaurants to Billion Oyster Project: schedule shell pickups (a BOP truck or a
DoorDash Dasher) to BOP's transfer station, keep donation receipts, and approve grant
applications that a Gemini agent drafts for programs the restaurant is eligible for. The
restaurant, pickups and agent are mocks; the NYC network list is real DoorDash data.

This repo holds two clickable prototypes that share one app:

| Side | Open it at | For |
|---|---|---|
| **Restaurant** | `/` | Restaurant owners: shell pickups, donation receipts, grant applications, NYC network |
| **Customer** | `/customer` | People ordering delivery: find restaurants that recycle, return oyster and clam shells, see their impact |

A **Restaurant view | Customer view** switch in the bottom-right corner jumps between them.

**Live:** https://good-riddance-894711667409.us-east4.run.app
(customer side: https://good-riddance-894711667409.us-east4.run.app/customer, once merged to `main`)

## How it fits together

- `data/oyster-restaurants.json` — the dataset, scraped from public DoorDash store pages.
- **Firestore** (`ruthai26nyc-2612`, `us-east4`) — where the data lives. `npm run seed`
  loads the JSON into the `restaurants` collection and the `meta/oysterDataset` doc.
- `server/index.js` — Express server on **Cloud Run** that serves the built React app and
  `GET /api/restaurants` from Firestore.
- `src/` — the merchant portal: Overview, Pickups, Grants and NYC network pages. Mock data
  lives in `src/shellData.js` (restaurant, pickups, BOP facts) and `src/grantPrograms.js`
  (grant programs and the location-based eligibility check). NYC network reads `/api/restaurants`.
- `src/customer/` — the customer-side concept prototype at **`/customer`** (see below).
- `src/main.jsx` — picks which side to load from the URL path.
- `src/ViewSwitch.jsx` — the floating "Restaurant view | Customer view" pill for jumping between the two sides in a demo.

## Customer side (`/customer`)

A clickable, phone-sized concept of Good Riddance inside a delivery app's customer screens,
built from `GOOD_RIDDANCE_CUSTOMER_SPEC.md`. On a computer it shows inside a phone frame;
on a phone it fills the screen. Mock data only: no backend, payments, maps or push
notifications.

```bash
npm install
npm run dev      # then open http://localhost:5173/customer
```

### Screens

- **Home** — the usual delivery-app home (address, search, categories, filter chips), plus a
  **Recycles waste** filter chip, an "Oyster season, shells included" banner and an
  "NYC shell recyclers" row.
- **Store page** — Pearl & Pier with a **Shell recycling partner** badge. Tapping it shows
  the store's shell stats from pickup records.
- **Menu item** — oyster and clam dishes explain that their shells are recycled; Rescue
  Chowder shows a "Made with rescued ingredients" label.
- **Checkout** — an opt-in **Return your shells (+$1.00)** toggle, shown only when the cart
  has oysters or clams. Off by default.
- **Delivered + receipt** — a "Shell bag included" card and an estimated impact line.
- **Return flow** — a next-day reminder, then **Hand to my next driver** or **Drop off
  nearby** (map and list of partner restaurants).
- **Me → My impact** — bags returned, estimated pounds of shells, orders from stores that
  recycle, milestones and history.

### Files

- `src/customer/CustomerApp.jsx` — all customer screens and the demo state.
- `src/customer/customerData.js` — sample stores, menus, drop-off spots and impact history.
  Shell weights are rough estimates and are labeled that way in the app.
- `src/customer/customer.css` — styles. `cx-` classes are the core app; `gr-` classes are
  the new Good Riddance parts.
- `src/customer/Art.jsx`, `src/customer/CxIcon.jsx` — drawn food placeholders and icons.

### Demo path

Tap **Recycles waste** → open **Pearl & Pier** → tap the **Shell recycling partner**
badge → add **East Coast Oysters, dozen** → **View cart** → turn on **Return your shells** →
**Place order** → **Done** → **Prototype: skip to the next day** → tap the notification →
pick a return option → **Simulate return** → see the totals in **Me → My impact**.
"Reset demo data" at the bottom of the Me tab starts over.

Teal (`#1C6C74`) marks every Good Riddance element; the rest of the UI is the core app.

## Commands

```bash
npm run dev      # local app; /api is proxied to the deployed service
npm run seed     # push data/oyster-restaurants.json to Firestore
npm run deploy   # build and deploy to Cloud Run
```

**Pushes to `main` deploy automatically**: the `deploy-main` Cloud Build trigger runs
`cloudbuild.yaml` (build the Dockerfile, deploy to Cloud Run). `npm run deploy` is only
needed for a manual deploy.

`seed` and `deploy` use your active gcloud account, which needs access to
`ruthai26nyc-2612`. To use a different signed-in account for one command:

```bash
CLOUDSDK_CORE_ACCOUNT=you@example.com npm run deploy
```
