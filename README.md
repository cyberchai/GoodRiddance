# GoodRiddance

Connects NYC restaurants to Billion Oyster Project: schedule shell pickups (a BOP truck or a
DoorDash Dasher) to BOP's transfer station, keep donation receipts, and approve grant
applications that a Gemini agent drafts for programs the restaurant is eligible for. The
restaurant, pickups and agent are mocks; the NYC network list is real DoorDash data.

**Live:** https://good-riddance-894711667409.us-east4.run.app

## How it fits together

- `data/oyster-restaurants.json` — the dataset. `npm run refresh` rebuilds it from DoorDash
  with the DoorDash CLI, `dd-cli` (run `dd-cli login` once first), and caches each
  successful fetch in `data/dd-cli-cache.json`. If dd-cli is missing, signed out, rate
  limited or finds no oyster restaurants, it reuses that cache, or copies
  `data/mock-restaurants.json` when there is none and the NYC network page says "Mock data".
- **Firestore** (`ruthai26nyc-2612`, `us-east4`) — where the data lives. `npm run seed`
  loads the JSON into the `restaurants` collection and the `meta/oysterDataset` doc.
- `server/index.js` — Express server on **Cloud Run** that serves the built React app and
  `GET /api/restaurants` from Firestore.
- `src/` — the merchant portal: Overview, Pickups, Grants and NYC network pages. Mock data
  lives in `src/shellData.js` (restaurant, pickups, BOP facts) and `src/grantPrograms.js`
  (grant programs and the location-based eligibility check). NYC network reads `/api/restaurants`.

## Commands

```bash
npm run dev      # local app; /api is proxied to the deployed service
npm run refresh  # rebuild data/oyster-restaurants.json with dd-cli (mock data if it fails)
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
