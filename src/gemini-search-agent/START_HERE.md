# Start here

## Show the demo now

Unzip oyster-pipeline.zip, open Terminal in oyster-pipeline, then:

```bash
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```

Open http://localhost:8000. Click Run research now. It runs the full fictional-data
pipeline without more DoorDash calls. Click again to demonstrate a restaurant
adding oysters, plus duplicate-draft protection. Expand Run history to show actions.

## Make it autonomous on GCP

1. Open Google Cloud Console → Cloud Shell.
2. Upload oyster-pipeline.zip through the Cloud Shell menu.
3. Run:

```bash
unzip oyster-pipeline.zip
cd oyster-pipeline
python3 setup_cloud.py
```

4. Choose demo first (optional real Gemini), then run setup again with live when
   ready. The two environments are separate.
5. Supply project ID, Gemini model ID, API key, and for live mode your exported
   DoorDash token. Secret prompts hide what you type. No secrets go into source.
6. Follow the private dashboard proxy command printed at the end; use Cloud Shell
   Web Preview on port 8080.
7. Click Run research now for a first live check. It may pause if an API is limited.

The scheduler now checks every 15 minutes. It starts a new cycle every 72 hours,
and resumes unfinished batches only when any cooldown has expired. It stores
reports in Firestore even with your laptop closed. No email is sent.

Deployment has not been run in your project by the assistant. Successful setup and
a first live run are necessary to confirm your IAM, model, token and API access.
DoorDash token expiry requires renewal; the report will show auth_required.

README.md contains the full workflow, operating limits, testing instructions,
token renewal, cost notes, and how to pause the schedule.
