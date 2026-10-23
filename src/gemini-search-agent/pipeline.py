"""Resumable, sequential drafts-only workflow. No sending capability exists."""
import hashlib
import json
import os
import time
import uuid
from pathlib import Path
from providers import AuthenticationRequired, Cooldown, DemoData, DoorDash, Gemini, OfflineAI

POINTS = [
    {'name':'Lower Manhattan', 'lat':40.718, 'lng':-74.005},
    {'name':'Midtown Manhattan', 'lat':40.758, 'lng':-73.9855},
    {'name':'Upper Manhattan', 'lat':40.8075, 'lng':-73.9626},
]
INTERVAL = 72 * 3600


def fingerprint(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True).encode()).hexdigest()


class Pipeline:
    def __init__(self, store, mode='demo', provider=None, ai=None, clock=time.time):
        if mode not in ('demo','live'):
            raise ValueError('MODE must be demo or live')
        self.store, self.mode, self.clock = store, mode, clock
        self.provider = provider or (DemoData() if mode=='demo' else DoorDash())
        self.ai = ai

    def event(self, run, action, detail, rid=None):
        run['events'].append({'at':self.clock(),'action':action,'detail':detail,'restaurant_id':rid})
        # Bounded run documents stay comfortably below Firestore's document limit.
        run['events'] = run['events'][-500:]
        run['counts'][action] = run['counts'].get(action,0)+1

    def save(self, state, run):
        self.store.put('runs',run['id'],run)
        self.store.put('system','schedule',state)

    def excluded(self, r):
        path = Path(__file__).parent/'data/exclusions.json'
        data = json.loads(path.read_text()) if path.exists() else {}
        return (r['id'] in data.get('store_ids',[]) or r['name'].casefold() in
                [x.casefold() for x in data.get('names',[])])

    def tick(self, force=False, max_steps=None):
        owner = uuid.uuid4().hex
        if not self.store.lease(owner,self.clock()):
            return {'status':'busy','message':'Another worker holds the lease'}
        try:
            state = self.store.get('system','schedule') or {'cycle':0,'next_cycle_at':0,'cooldown_until':0}
            if self.mode=='live':
                state['cooldown_until']=max(state.get('cooldown_until',0),float(os.getenv('DD_NOT_BEFORE','0')))
            if self.clock() < state.get('cooldown_until',0):
                return {'status':'cooldown','retry_at':state['cooldown_until']}
            if state.get('auth_required') and not force:
                return {'status':'auth_required','message':'Refresh DoorDash secret, redeploy, then use Run research now'}
            if force:
                state['auth_required']=False
            run = self.store.get('runs',state['active_run']) if state.get('active_run') else None
            if run is None:
                if not force and self.clock() < state.get('next_cycle_at',0):
                    return {'status':'not_due','next_cycle_at':state['next_cycle_at']}
                state['cycle'] += 1
                existing = sorted(self.store.all('restaurants'),key=lambda r:r.get('checked_at',0))
                # Budget bounded per cycle; least recently checked are revisited first.
                revisit_limit = min(100,max(1,int(os.getenv('REVISIT_LIMIT','30'))))
                selected = existing[:revisit_limit]
                queue = [{'kind':'search','point':p,'attempts':0} for p in (POINTS if self.mode=='live' else POINTS[:1])]
                queue += [{'kind':'restaurant','id':r['id'],'attempts':0} for r in selected]
                run = {'id':uuid.uuid4().hex,'cycle':state['cycle'],'mode':self.mode,'started_at':self.clock(),
                       'status':'running','events':[],'counts':{},'queue':queue,
                       'scheduled_ids':[r['id'] for r in selected], 'deferred_revisits':max(0,len(existing)-len(selected)),
                       'scope':'Sampled DoorDash searches across 3 Manhattan centers; not an exhaustive census',
                       'manual':force}
                state['active_run'] = run['id']
                state['next_cycle_at'] = run['started_at']+INTERVAL
                self.event(run,'cycle_started','Drafts only; no messages will be sent')
                self.save(state,run)
            run['status']='running'
            max_steps = max_steps or min(10,max(1,int(os.getenv('MAX_STEPS','3'))))
            started = time.monotonic()
            try:
                if self.ai is None:
                    self.ai = Gemini() if (self.mode=='live' or os.getenv('AI_MODE')=='gemini') else OfflineAI()
                for _ in range(max_steps):
                    if not run['queue'] or time.monotonic()-started > 420:
                        break
                    task=run['queue'][0]
                    try:
                        if task['kind']=='search':
                            candidates=self.provider.search(task['point'],run['cycle'])
                            for candidate in candidates:
                                rid=candidate['id']
                                if not rid.replace('-','').isalnum():
                                    continue
                                old=self.store.get('restaurants',rid)
                                r=old or {**candidate,'first_seen':self.clock(),'status':'needs_menu'}
                                r['last_seen']=self.clock()
                                self.store.put('restaurants',rid,r)
                                if not old:
                                    self.event(run,'discovered',candidate['name'],rid)
                                if rid not in run['scheduled_ids']:
                                    run['scheduled_ids'].append(rid)
                                    run['queue'].append({'kind':'restaurant','id':rid,'attempts':0})
                            self.event(run,'search_completed',task['point']['name']+f': {len(candidates)} candidates')
                        else:
                            self.process_restaurant(task['id'],run)
                        run['queue'].pop(0)
                        self.save(state,run)
                    except AuthenticationRequired:
                        state['auth_required']=True
                        run['status']='auth_required'
                        self.event(run,'auth_required','Refresh DoorDash token secret, redeploy, then manually resume')
                        self.save(state,run)
                        return {'status':run['status'],'run_id':run['id']}
                    except Cooldown as exc:
                        state['cooldown_until']=self.clock()+exc.seconds
                        run['status']='paused_rate_limit'
                        self.event(run,'rate_limited',f'{exc.service}; no calls before {state["cooldown_until"]}')
                        self.save(state,run)
                        return {'status':run['status'],'retry_at':state['cooldown_until'],'run_id':run['id']}
                    except Exception as exc:
                        # No exception payloads from external SDKs: avoid accidental credential logging.
                        task['attempts']+=1
                        code=getattr(exc,'code',None)
                        detail=f'{type(exc).__name__}'+(f' (code {code})' if isinstance(code,(int,str)) else '')
                        self.event(run,'error',detail,task.get('id'))
                        if task['attempts']>=2:
                            run['queue'].pop(0)
                            self.event(run,'task_failed','Two attempts failed; retry in next discovery cycle',task.get('id'))
                        else:
                            # Persist the failed task and pause; never immediately hammer either API.
                            state['cooldown_until']=self.clock()+3600
                            run['status']='paused_error'
                        self.save(state,run)
                        return {'status':run['status'],'run_id':run['id'],'message':detail}
            except Exception as exc:
                run['status']='configuration_error'
                self.event(run,'configuration_error','Check Gemini key/model and service configuration: '+type(exc).__name__)
                state['cooldown_until']=self.clock()+3600
                self.save(state,run)
                return {'status':run['status'],'run_id':run['id']}
            if not run['queue']:
                run['status']='completed_with_errors' if run['counts'].get('task_failed') else 'completed'
                run['finished_at']=self.clock()
                state['active_run']=None
                state['cooldown_until']=0
                self.event(run,'cycle_completed','All scheduled tasks processed')
            self.save(state,run)
            return {'status':run['status'],'run_id':run['id'],'pending_tasks':len(run['queue']),
                    'next_cycle_at':state['next_cycle_at']}
        finally:
            self.store.release(owner)

    def process_restaurant(self,rid,run):
        r=self.store.get('restaurants',rid)
        if self.excluded(r):
            r['status']='excluded'
            r.pop('draft',None)
            self.store.put('restaurants',rid,r)
            self.event(run,'excluded','Existing partner or excluded prospect',rid)
            return
        # Checkpoint each stage so retries after Gemini failures do not refetch DoorDash.
        if r.get('menu_cycle') != run['cycle']:
            menu=self.provider.menu(rid,run['cycle'])
            canonical=sorted(menu['items'],key=lambda i:(i['name'],i['description']))
            menu['items']=canonical
            if len(json.dumps(menu).encode())>250_000:
                raise ValueError('Menu exceeds demo storage budget; do not truncate and infer absence')
            digest=fingerprint(menu)
            if digest != r.get('menu_hash'):
                r['previous_analysis']=r.get('analysis')
                r['previous_complete']=r.get('menu',{}).get('complete',False)
                r['menu']=menu
                r['menu_hash']=digest
                r.pop('analysis',None)
                r.pop('draft',None)
            r['menu_cycle']=run['cycle']
            r['checked_at']=self.clock()
            self.store.put('restaurants',rid,r)
            self.event(run,'menu_checked',str(len(menu['items']))+' items',rid)
        if not r.get('analysis') or r.get('analysis_engine') != self.ai.label:
            previous=r.get('previous_analysis') or {}
            result=self.ai.analyze(r['menu'])
            r['analysis']=result
            r['analysis_engine']=self.ai.label
            r['change']='baseline'
            if previous:
                r['change']='menu_updated'
                if result['status']=='yes' and previous.get('status')=='no' and r.get('previous_complete'):
                    r['change']='newly_observed_oyster_offering'
                elif result['status']=='yes' and previous.get('status')!='yes':
                    r['change']='oysters_observed_prior_absence_unknown'
            observation={'id':run['id']+'-'+rid,'restaurant_id':rid,'at':self.clock(), 'menu_hash':r['menu_hash'],
                         'analysis':result,'change':r['change'],'engine':self.ai.label,'scope':r['menu']['scope']}
            self.store.put('observations',observation['id'],observation)
            self.store.put('restaurants',rid,r)
            self.event(run,'analyzed',r['change']+': '+result['status'],rid)
        if r['analysis']['status']!='yes':
            r['status']='no_oysters_observed' if r['analysis']['status']=='no' else 'needs_review'
            r.pop('draft',None)
            self.store.put('restaurants',rid,r)
            return
        if not r.get('contact') or self.clock()-r.get('contact_checked_at',0)>7*86400:
            # Fictional records never trigger web research, even with real Gemini analysis.
            r['contact']=(OfflineAI() if self.mode=='demo' else self.ai).research(r)
            r['contact_checked_at']=self.clock()
            self.store.put('restaurants',rid,r)
            self.event(run,'contact_researched','Email found' if r['contact'].get('email') else 'No verified email found',rid)
        contact=r['contact']
        if contact.get('location')!='manhattan':
            r['status']='needs_location_review'
            r.pop('draft',None)
        else:
            draft_key=fingerprint({'menu':r['menu_hash'],'name':r['name'],'engine':self.ai.label})
            if not r.get('draft') or r['draft'].get('key')!=draft_key:
                draft=self.ai.draft(r,r['analysis'],contact)
                r['draft']={**draft,'key':draft_key,'created_at':self.clock(),'engine':self.ai.label,
                            'status':'draft_only','review_required':True}
                self.event(run,'draft_created','Saved for review; not sent',rid)
            else:
                self.event(run,'draft_reused','Unchanged menu; existing draft retained',rid)
            r['status']='draft_ready' if contact.get('email') else 'draft_needs_email'
        self.store.put('restaurants',rid,r)

    def report(self):
        restaurants=self.store.all('restaurants')
        return {'mode':self.mode,'drafts_only':True,'schedule':self.store.get('system','schedule') or {},
                'restaurants':sorted(restaurants,key=lambda r:r['name']),
                'runs':sorted(self.store.all('runs'),key=lambda r:r['started_at'],reverse=True)[:50],
                'totals':{'candidates':len(restaurants),
                          'oyster_matches':sum(r.get('analysis',{}).get('status')=='yes' for r in restaurants),
                          'contacts':sum(bool(r.get('contact',{}).get('email')) for r in restaurants),
                          'drafts':sum(bool(r.get('draft')) for r in restaurants), 'sent':0}}
