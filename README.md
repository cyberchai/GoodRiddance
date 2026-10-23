# GoodRiddance

Manhattan restaurants with oysters on their DoorDash delivery menus.

**Live:** https://good-riddance-894711667409.us-east4.run.app

## How it fits together

- `data/oyster-restaurants.json` — the dataset, scraped from public DoorDash store pages.
- **Firestore** (`ruthai26nyc-2612`, `us-east4`) — where the data lives. `npm run seed`
  loads the JSON into the `restaurants` collection and the `meta/oysterDataset` doc.
- `server/index.js` — Express server on **Cloud Run** that serves the built React app and
  `GET /api/restaurants` from Firestore.
- `src/` — the GoodRiddance restaurant workspace (menu, recurring pickup, analytics). Its
  Oysters page (`#oysters`) reads `/api/restaurants`.
- `src/customer/` — the customer-side concept prototype at **`/customer`** (see below).

## Customer prototype (`/customer`)

A clickable phone-sized concept of Good Riddance inside a delivery app's customer screens,
built from `GOOD_RIDDANCE_CUSTOMER_SPEC.md`. Mock data only (`src/customer/customerData.js`):
no backend, payments, maps or push notifications.

```bash
npm install
npm run dev      # then open http://localhost:5173/customer
```

Demo path: tap **Recycles waste** → open **Pearl & Pier** → tap the **Shell recycling partner**
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
