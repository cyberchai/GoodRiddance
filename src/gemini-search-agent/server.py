import csv
import io
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, Response
from pipeline import Pipeline
from storage import store_for

app=FastAPI(title='ShellCycle drafts-only pipeline')
MODE=os.getenv('MODE','demo')

def workflow():
    return Pipeline(store_for(MODE),MODE)

@app.middleware('http')
async def browser_protection(request:Request, call_next):
    # The cloud service must also be private through Cloud Run IAM.
    # Custom mutation headers plus no CORS prevent simple cross-origin browser POSTs.
    # Do not compare Origin to Host: Cloud Shell's authenticated preview rewrites Host.
    if request.method=='POST':
        if request.url.path in ('/run','/tick') and request.headers.get('x-shellcycle-action') not in ('run','tick'):
            return Response('Missing action header',status_code=403)
    response=await call_next(request)
    response.headers['X-Content-Type-Options']='nosniff'
    response.headers['Cache-Control']='no-store'
    return response

@app.get('/')
def dashboard():
    return FileResponse(Path(__file__).parent/'dashboard.html')

@app.get('/health')
def health():
    return {'status':'ok','mode':MODE,'drafts_only':True}

@app.get('/report')
def report():
    return workflow().report()

@app.post('/tick')
def scheduled_tick():
    return workflow().tick()

@app.post('/run')
def manual_run():
    # Force starts a new cycle early, but never bypasses a lease or cooldown.
    return workflow().tick(force=True)

@app.get('/export.csv')
def export_csv():
    out=io.StringIO()
    fields=['restaurant','demo','status','oysters','email','source','subject','draft','checked_at']
    writer=csv.DictWriter(out,fieldnames=fields)
    writer.writeheader()
    for r in workflow().report()['restaurants']:
        row={'restaurant':r['name'],'demo':r['demo'],'status':r['status'],
             'oysters':r.get('analysis',{}).get('status','unknown'),
             'email':r.get('contact',{}).get('email') or '', 'source':r.get('contact',{}).get('source_url',''),
             'subject':r.get('draft',{}).get('subject',''),'draft':r.get('draft',{}).get('body',''),
             'checked_at':r.get('checked_at','')}
        writer.writerow({k:("'"+v if isinstance(v,str) and v.startswith(('=','+','-','@')) else v) for k,v in row.items()})
    return Response(out.getvalue(),media_type='text/csv',headers={'Content-Disposition':'attachment; filename="shellcycle-report.csv"'})
