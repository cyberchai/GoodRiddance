# ShellCycle — autonomous drafts-only pipeline

This is a new standalone version. Unzip it into a new folder; it does not overwrite
the previous Streamlit demo or migrate that demo's SQLite database.

## 1. Run the complete demo on your Mac

Python 3.10+ is required. In this extracted folder:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```

Open http://localhost:8000 and click **Run research now**. The browser automatically
continues bounded batches until the cycle completes or pauses. You do not need to
paste menus or choose individual restaurants. Click again for a second demo cycle:
Demo Changing Menu now offers oysters. An unchanged restaurant retains its existing
draft. Demo Mushroom Cafe is excluded as a false positive.

Demo data is fictional and never assigned to real restaurants. Its contacts use
example.invalid. The default demo engine is explicitly labeled local rules/templates,
not AI. Real DoorDash search data from the earlier session is included in
data/oyster_search.json as a reference fixture; it is not passed off as a full menu.

To use real Gemini on the fictional menu/draft workflow, stop the server, set
GEMINI_API_KEY securely in your terminal, set GEMINI_MODEL to a text model you have
access to, and set AI_MODE=gemini before restarting. Fictional contact research stays
synthetic and makes no web searches. The API key is read from the environment only.

## 2. Deploy to your GCP project

Use Google Cloud Shell (terminal icon in Cloud Console). Upload this ZIP with the
Cloud Shell menu, then unzip it and enter oyster-pipeline. Billing and permission to
create service accounts, grant project roles, enable services, build and deploy are
required. Hackathon organizers may need to grant these permissions.

```bash
unzip oyster-pipeline.zip
cd oyster-pipeline
python3 setup_cloud.py
```

The script prompts for:

1. Project ID (not display name).
2. demo or live. Deploy demo first to test the complete cloud/storage/scheduler path.
3. Whether to use Gemini for demo (live always uses Gemini).
4. Model ID available to your API key. Live mode needs Google Search grounding and
   structured-output support; use a text Flash model with those capabilities.
5. Gemini API key, via hidden input.
6. In live mode, DoorDash access token, via hidden input, and remaining cooldown seconds.

The script enables services, creates a default Firestore database if absent, creates
dedicated runtime/build/scheduler service accounts, gives scoped secret access,
builds/deploys a **private** Cloud Run service, and configures Cloud Scheduler.
Live mode downloads the official Linux dd-cli v0.2.6 and verifies the published
SHA256 before extracting only its executable. Cloud Run cannot use your Mac binary.
The Docker build never includes local databases, .env files or virtual environments.

For a headless DoorDash token, run `dd-cli export-token` on the Mac already signed in.
Paste only the token into setup's hidden prompt, not into source files, chats or model
prompts. Honor any active rate limit before calling DoorDash again. Enter its remaining
seconds when setup asks, so the new cloud worker also respects that cooldown.

The setup script makes real GCP changes and may incur cloud/API charges. It does not
send email. Existing resources are reused on reruns. It is designed for a project where
you have the required administrative access. If setup fails, fix the indicated
permission/configuration and rerun; do not make the Cloud Run service public.

## 3. Open the private cloud dashboard

Setup prints a command like:

```bash
gcloud run services proxy shellcycle-demo --region=us-east1 --project=YOUR_PROJECT_ID --port=8080
```

Run it in Cloud Shell, then select **Web Preview → Preview on port 8080**. If the
proxy asks to install a gcloud component, accept its normal installation prompt.
Use shellcycle-live for the live deployment. Google IAM protects the service;
the proxy uses your signed-in identity. Do not publish the backend anonymously.

Click Run research now to demonstrate, or wait for Scheduler's next tick. Demo and
live deployments use separate service names and Firestore namespaces.

## How autonomy and the 3-day schedule work

- Scheduler sends an authenticated POST to /tick every 15 minutes.
- Firestore stores next_cycle_at; a new discovery cycle starts every 72 hours from
  the previous cycle's start (within the 15-minute polling window).
- Each request does at most 3 tasks and runs tasks sequentially. It checkpoints
  the queue after each task. Remaining work resumes on the next tick.
- A rate limit pauses the queue until the full requested wait has elapsed. No
  parallel calls and no retries before that timestamp, even from the demo button.
- A transaction-protected 20-minute lease prevents overlapping workers. Request
  timeout is 15 minutes. A crash can leave the lease until expiry, then processing resumes.
- Transient failures pause for an hour; two task failures defer that task to the
  next discovery cycle and report it as failed. Failures never mean no oysters.
- Expired DoorDash credentials stop scheduled calls and show auth_required. Renew
  the secret and redeploy, then manually resume. Exported tokens do expire; the CLI
  does not provide a verified automatic renewal path in this implementation.
- Manual Run research starts a cycle early, or resumes pending work. It never
  bypasses cooldowns. Manual early cycles also reset the 72-hour cycle anchor.
- Local mode does not install a background scheduler. Use GCP for operation while
  your Mac is closed. Closing the dashboard does not stop the GCP scheduler.

## Live workflow

Search around Lower, Midtown and Upper Manhattan (5 results each by default),
deduplicate store IDs, revisit up to 30 least recently checked restaurants, and
queue newly discovered stores. This is sampled coverage, not an exhaustive census.
Change SEARCH_LIMIT and REVISIT_LIMIT in service configuration to adjust the budget.

Menus are fetched with the commands verified from your CLI help. Only successful,
nonempty menu responses are used. They are cached before Gemini calls, so a later
AI failure does not refetch that menu in the same cycle. Names/descriptions and
completeness are hashed. Unchanged menus reuse their analysis. A prior complete
DoorDash negative followed by a positive is 'newly observed', not proof of an actual
menu launch date or absence from dine-in menus.

Gemini classifies menu evidence, then uses Google Search grounding to find official
restaurant contact/location pages. Python fetches up to 3 public HTTPS pages, and
Gemini extracts address and email evidence. Exact quotes are checked against the
fetched page. Invented or missing emails become null. Branch ambiguity or missing
Manhattan evidence sends the record to needs_location_review, without a draft.
Blocked/JS-only pages can yield no email. Website identity remains AI-assisted and
requires human review before any future sending. Sources and Search suggestions
are retained on the dashboard.

Drafts are generated only for positive oyster evidence and supported Manhattan
location. If email is unavailable, a qualified draft is marked draft_needs_email.
Drafts are explicitly from an independent hackathon team, not Billion Oyster
Project. No SMTP/Gmail/send function is included. Therefore replies, reminder
emails, signup counts and environmental impact are not fabricated.

Before real campaign use, populate data/exclusions.json with existing partner
store IDs/names and redeploy. The bundled list is empty; no full partner roster
was provided. Existing partners are not automatically verified in this MVP.

## Reports and persistence

- Dashboard: prospects, supported evidence, public contacts, current drafts, next
  cycle, cooldown status and run history.
- CSV export: one row per restaurant, including draft text.
- /report: JSON, latest 50 runs plus restaurants and schedule.
- Firestore retains all runs and observations; UI only displays the latest 50 runs.
- Each run has action counts and timestamped events, with a 500-event cap suitable
  for the bounded demo. Run counts reflect that run, not unique lifetime outreach.
- SQLite mode stores data/pipeline.sqlite. GCP mode uses Firestore; no reliance on
  Cloud Run ephemeral disk for persistent state.
- Full observations retain menu hash/classification; current menu items are kept
  per restaurant. This is not a full historical archive of every raw menu.

Stop scheduled work:

```bash
gcloud scheduler jobs pause shellcycle-live-tick --location=us-east1 --project=YOUR_PROJECT_ID
```

To rotate a token/key, rerun setup_cloud.py, choose live, enter the replacement secret
when prompted (Enter reuses an existing secret). It redeploys so environment secrets
refresh. Then Run research now resumes an auth-paused queue.

## Tests and verification limits

```bash
python -m unittest -v test_pipeline.py
```

Offline tests exercise complete runs, a second-cycle oyster addition, deduplication,
72-hour scheduling, persistence across restart, concurrent leases, rate limits,
resume checkpoints, expired-token blocking, source evidence checks and separate
demo/live namespaces. HTTP endpoints are smoke-tested locally; the dashboard has
not been visually verified in a browser in the build environment. Your actual
Gemini key, DoorDash cloud token, Firestore IAM and deployment must be tested in
your project; they cannot be validated without access to your accounts.

Official references:
- https://github.com/doordash-oss/doordash-cli
- https://ai.google.dev/gemini-api/docs/generate-content/google-search
- https://ai.google.dev/gemini-api/docs/structured-output
- https://cloud.google.com/run/docs/triggering/using-scheduler
- https://cloud.google.com/run/docs/configuring/services/secrets
