"""Interactive deployment from Google Cloud Shell. Credentials go through stdin only."""
import getpass
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tarfile
import time
import urllib.request

ROOT=Path(__file__).resolve().parent
os.chdir(ROOT)


def command(*args, capture=False, input_text=None, check=True):
    result=subprocess.run(['gcloud',*args],text=True,input=input_text,
                          stdout=subprocess.PIPE if capture else None,check=check)
    return result.stdout.strip() if capture and result.returncode==0 else result


def linux_binary():
    version='v0.2.6'
    name=f'dd-cli-{version}-linux-amd64.tar.gz'
    base=f'https://github.com/doordash-oss/doordash-cli/releases/download/{version}/'
    print('Downloading official DoorDash Linux release and published SHA256…')
    with urllib.request.urlopen(base+name,timeout=90) as r:
        blob=r.read()
    with urllib.request.urlopen(base+name+'.sha256',timeout=30) as r:
        text=r.read().decode()
    expected=re.search(r'\b[0-9a-fA-F]{64}\b',text)
    if not expected or hashlib.sha256(blob).hexdigest()!=expected.group(0).lower():
        raise RuntimeError('DoorDash SHA256 verification failed; refusing installation')
    # Extract only the executable bytes; never trust tar member paths or links.
    with tarfile.open(fileobj=io.BytesIO(blob),mode='r:gz') as archive:
        members=[m for m in archive.getmembers() if m.isfile() and Path(m.name).name=='dd-cli']
        if len(members)!=1:
            raise RuntimeError('Unexpected DoorDash archive structure')
        binary=archive.extractfile(members[0]).read()
    if not binary.startswith(b'\x7fELF'):
        raise RuntimeError('Expected a Linux ELF executable')
    (ROOT/'vendor/dd-cli').write_bytes(binary)
    (ROOT/'vendor/dd-cli').chmod(0o755)
    print('Verified Linux binary installed in vendor/dd-cli.')


def secret(name, prompt, runtime, project):
    existing=command('secrets','describe',name,'--project',project,'--format=value(name)',capture=True,check=False)
    value=getpass.getpass(prompt+(' (Enter to reuse existing): ' if isinstance(existing,str) else ': '))
    if not value and not isinstance(existing,str):
        raise RuntimeError('Secret is required')
    if value:
        if isinstance(existing,str):
            command('secrets','versions','add',name,'--data-file=-','--project',project,input_text=value)
        else:
            command('secrets','create',name,'--replication-policy=automatic','--data-file=-','--project',project,input_text=value)
    command('secrets','add-iam-policy-binding',name,'--project',project,
            '--member=serviceAccount:'+runtime,'--role=roles/secretmanager.secretAccessor','--quiet')


def main():
    if not shutil.which('gcloud'):
        raise RuntimeError('Run this script in Google Cloud Shell, which includes gcloud.')
    project=input('Your GCP project ID: ').strip()
    if not re.fullmatch(r'[a-z][a-z0-9-]{4,61}[a-z0-9]',project):
        raise ValueError('Enter the project ID, not project display name.')
    mode=input('Deployment mode [demo/live] (default demo): ').strip() or 'demo'
    if mode not in ('demo','live'):
        raise ValueError('Choose demo or live')
    use_gemini=mode=='live' or input('Use real Gemini on fictional demo menus? [y/N]: ').strip().lower()=='y'
    model=input('Text Gemini model ID from AI Studio (supports Google Search for live mode): ').strip() if use_gemini else ''
    if use_gemini and not re.fullmatch(r'[a-zA-Z0-9._-]+',model):
        raise ValueError('Enter a model ID without models/ prefix')
    region='us-east1'
    service='shellcycle-'+mode
    runtime=f'{service}-runtime@{project}.iam.gserviceaccount.com'
    scheduler=f'{service}-scheduler@{project}.iam.gserviceaccount.com'
    command('config','set','project',project)
    command('services','enable','run.googleapis.com','cloudbuild.googleapis.com','artifactregistry.googleapis.com',
            'firestore.googleapis.com','secretmanager.googleapis.com','cloudscheduler.googleapis.com',
            'generativelanguage.googleapis.com','iam.googleapis.com','--project',project)
    databases=json.loads(command('firestore','databases','list','--project',project,'--format=json',capture=True))
    if not any(d.get('name','').endswith('/(default)') for d in databases):
        command('firestore','databases','create','--database=(default)','--location='+region,
                '--type=firestore-native','--project',project)
    for suffix in ('runtime','scheduler','build'):
        email=f'{service}-{suffix}@{project}.iam.gserviceaccount.com'
        accounts=json.loads(command('iam','service-accounts','list','--project',project,'--format=json',capture=True))
        if not any(a['email']==email for a in accounts):
            command('iam','service-accounts','create',f'{service}-{suffix}','--project',project)
    command('projects','add-iam-policy-binding',project,'--member=serviceAccount:'+runtime,
            '--role=roles/datastore.user','--condition=None','--quiet')
    builder=f'{service}-build@{project}.iam.gserviceaccount.com'
    command('projects','add-iam-policy-binding',project,'--member=serviceAccount:'+builder,
            '--role=roles/run.builder','--condition=None','--quiet')
    secrets=[]
    if use_gemini:
        secret('shellcycle-gemini-key','Paste Gemini API key',runtime,project)
        secrets.append('GEMINI_API_KEY=shellcycle-gemini-key:latest')
    if mode=='live':
        linux_binary()
        print('Use dd-cli export-token on your logged-in Mac. Paste only the access token, not the whole output.')
        secret('shellcycle-doordash-token','Paste DoorDash access token',runtime,project)
        secrets.append('DD_CLI_ACCESS_TOKEN=shellcycle-doordash-token:latest')
    env=f'MODE={mode},STORAGE=firestore,GOOGLE_CLOUD_PROJECT={project},MAX_STEPS=3,SEARCH_LIMIT=5,REVISIT_LIMIT=30'
    env+=f',AI_MODE={"gemini" if use_gemini else "offline"}'
    if model:
        env+=',GEMINI_MODEL='+model
    if mode=='live':
        remaining=int(input('Seconds remaining on any current DoorDash cooldown (0 if none): ').strip() or '0')
        env+=',DD_NOT_BEFORE='+str(int(time.time())+max(0,remaining))
    deploy=['run','deploy',service,'--source=.', '--region='+region,'--project='+project,
            '--service-account='+runtime,'--no-allow-unauthenticated','--max-instances=1','--concurrency=1',
            '--build-service-account=projects/'+project+'/serviceAccounts/'+builder,
            '--timeout=900','--memory=1Gi','--cpu=1','--set-env-vars='+env,'--quiet']
    if secrets:
        deploy+=['--set-secrets='+','.join(secrets)]
    command(*deploy)
    url=command('run','services','describe',service,'--region='+region,'--project='+project,
                '--format=value(status.url)',capture=True)
    command('run','services','add-iam-policy-binding',service,'--region='+region,'--project='+project,
            '--member=serviceAccount:'+scheduler,'--role=roles/run.invoker','--quiet')
    jobs=json.loads(command('scheduler','jobs','list','--location='+region,'--project='+project,'--format=json',capture=True))
    job=service+'-tick'
    verb='update' if any(j.get('name','').endswith('/'+job) for j in jobs) else 'create'
    header_flag='--update-headers=X-ShellCycle-Action=tick' if verb=='update' else '--headers=X-ShellCycle-Action=tick'
    command('scheduler','jobs',verb,'http',job,'--location='+region,'--project='+project,
            '--schedule=*/15 * * * *','--time-zone=Etc/UTC','--uri='+url+'/tick',
            '--http-method=POST',header_flag,'--oidc-service-account-email='+scheduler,'--oidc-token-audience='+url,
            '--attempt-deadline=900s','--max-retry-attempts=0','--quiet')
    print('\nDEPLOYED privately. Scheduler polls every 15 minutes; discovery starts every 72 hours.')
    print('Dashboard proxy command (run in Cloud Shell, then use Web Preview on port 8080):')
    print(f'gcloud run services proxy {service} --region={region} --project={project} --port=8080')
    print('The initial cycle starts at the next scheduler tick, or click Run research now.')
    print(f'Stop automation: gcloud scheduler jobs pause {job} --location={region} --project={project}')
    print('Cloud resources and Gemini/Search may incur charges. Project billing alerts are not spending caps.')


if __name__=='__main__':
    try:
        main()
    except (Exception,KeyboardInterrupt) as exc:
        print('\nSetup stopped:',type(exc).__name__,str(exc),file=sys.stderr)
        print('Fix the indicated access/configuration issue and rerun; existing resources are reused.',file=sys.stderr)
        sys.exit(1)
