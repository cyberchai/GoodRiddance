# GoodRiddance

Manhattan restaurants with oysters on their DoorDash delivery menus.

**Live:** https://good-riddance-894711667409.us-east4.run.app

## How it fits together

- `data/oyster-restaurants.json` — the dataset, scraped from public DoorDash store pages.
- **Firestore** (`ruthai26nyc-2612`, `us-east4`) — where the data lives. `npm run seed`
  loads the JSON into the `restaurants` collection and the `meta/oysterDataset` doc.
- `server/index.js` — Express server on **Cloud Run** that serves the built React app and
  `GET /api/restaurants` from Firestore.
- `src/` — the React app, which reads `/api/restaurants`.

## Commands

```bash
npm run dev      # local app; /api is proxied to the deployed service
npm run seed     # push data/oyster-restaurants.json to Firestore
npm run deploy   # build and deploy to Cloud Run
```

`seed` and `deploy` use your active gcloud account, which needs access to
`ruthai26nyc-2612`. To use a different signed-in account for one command:

```bash
CLOUDSDK_CORE_ACCOUNT=you@example.com npm run deploy
```
