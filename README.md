# GoodRiddance

Connects NYC restaurants to Billion Oyster Project: schedule shell pickups (a BOP truck or a
DoorDash Dasher) to BOP's transfer station, keep donation receipts, and approve grant
applications that a Gemini agent drafts for programs the restaurant is eligible for. The
restaurant and pickups are mocks; the NYC network list is real DoorDash data, and the
Gemini agents are live.

**Live:** https://good-riddance-894711667409.us-east4.run.app

## How it fits together

- `data/oyster-restaurants.json` — the dataset. `npm run refresh` rebuilds it from DoorDash
  with the DoorDash CLI, `dd-cli` (run `dd-cli login` once first), and caches each
  successful fetch in `data/dd-cli-cache.json`. If dd-cli is missing, signed out, rate
  limited or finds no oyster restaurants, it reuses that cache, or copies
  `data/mock-restaurants.json` when there is none and the NYC network page says "Mock data".
- **Firestore** (`ruthai26nyc-2612`, `us-east4`) — where the data lives. `npm run seed`
  loads the JSON into the `restaurants` collection and the `meta/oysterDataset` doc.
- `server/index.js` — Express server on **Cloud Run** that serves the built React app,
  `GET /api/restaurants` from Firestore, and `POST /api/agent/:name`, one Gemini turn for an
  agent defined in `server/agents.js`.
- `src/` — the merchant portal: Menu, Pickups, Grants, NYC network and GoodRiddance pages. Mock
  data lives in `src/shellData.js` (restaurant, pickups, BOP facts) and `src/opportunities.js`
  (grants and press, their application forms and sample eligibility rules). NYC network reads
  `/api/restaurants`.

## Gemini agents

- **Grants** (`apply`): when the owner opens Grants, an agent starts on each application the
  restaurant is eligible for. It reads the form and the restaurant's shell data through tools,
  fills every field with a cited source, and hands the draft over for approval. Its steps
  play out on the page. If a live run fails, the owner can play a recorded real run instead,
  labelled as recorded (`src/agentRecordings.js`).
- **NYC network** (`invite`): "Invite to recycle" writes an email to that restaurant from its
  DoorDash menu and Harbor & Hearth's results.

The server calls Gemini on Vertex AI as Cloud Run's service account, so no API key is needed.
The model is `gemini-3.8-flash` unless `GEMINI_MODEL` is set. The server holds each agent's
prompt, tools and limits; the browser runs the tools (`src/agent.js`, `src/grantAgent.js`).
The agent API isn't on the deployed service until you deploy, so to try a change locally run
the server yourself (it uses your gcloud application-default login):

```bash
GOOGLE_CLOUD_PROJECT=ruthai26nyc-2612 npm start   # API on :8080
API_PROXY_TARGET=http://localhost:8080 npm run dev # app, using that API
```

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
