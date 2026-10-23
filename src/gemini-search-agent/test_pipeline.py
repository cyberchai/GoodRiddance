import json
from pathlib import Path
import tempfile
import unittest
from pipeline import Pipeline, INTERVAL
from providers import AuthenticationRequired, Cooldown, DemoData, OfflineAI, parse_dd, validate_analysis, validate_contact
from storage import LocalStore


class PipelineTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory()
        self.path=Path(self.tmp.name)/'test.sqlite'
        self.store=LocalStore(self.path,'test')
        self.t=1000000
        self.p=Pipeline(self.store,'demo',clock=lambda:self.t)

    def tearDown(self):
        self.tmp.cleanup()

    def complete(self,force=False):
        result=self.p.tick(force=force,max_steps=10)
        self.assertIn(result['status'],('completed','completed_with_errors'))
        return result

    def test_full_demo_and_second_cycle(self):
        self.complete()
        first=self.p.report()
        self.assertEqual(first['totals']['candidates'],3)
        self.assertEqual(first['totals']['drafts'],1)
        self.assertEqual(first['totals']['sent'],0)
        self.complete(force=True)
        second=self.p.report()
        self.assertEqual(second['totals']['drafts'],2)
        changed=next(r for r in second['restaurants'] if r['id']=='demo-change')
        self.assertEqual(changed['change'],'newly_observed_oyster_offering')
        unchanged=next(r for r in second['restaurants'] if r['id']=='demo-raw')
        original=next(r for r in first['restaurants'] if r['id']=='demo-raw')
        self.assertEqual(unchanged['draft'],original['draft'])

    def test_72_hour_gate_and_restart(self):
        self.complete()
        self.assertEqual(self.p.tick()['status'],'not_due')
        reloaded=Pipeline(LocalStore(self.path,'test'),'demo',clock=lambda:self.t)
        self.assertEqual(reloaded.report()['totals']['drafts'],1)
        self.t+=INTERVAL
        self.assertEqual(reloaded.tick(max_steps=10)['status'],'completed')

    def test_lease_prevents_duplicate_workers(self):
        self.assertTrue(self.store.lease('first',self.t))
        self.assertEqual(self.p.tick(force=True)['status'],'busy')
        self.store.release('other')
        self.assertEqual(self.p.tick(force=True)['status'],'busy')
        self.store.release('first')
        self.complete()

    def test_rate_limit_persists_and_force_cannot_override(self):
        class Limited(DemoData):
            calls=0
            def search(self,point,cycle):
                self.calls+=1
                if self.calls==1:
                    raise Cooldown(2738)
                return super().search(point,cycle)
        dd=Limited()
        self.p.provider=dd
        self.assertEqual(self.p.tick()['status'],'paused_rate_limit')
        self.assertEqual(self.p.tick(force=True)['status'],'cooldown')
        self.assertEqual(dd.calls,1)
        self.t+=2738
        self.complete()
        self.assertEqual(dd.calls,2)

    def test_resume_without_repeating_menu(self):
        class Counted(DemoData):
            calls=0
            def menu(self,rid,cycle):
                self.calls+=1
                return super().menu(rid,cycle)
        class Flaky(OfflineAI):
            calls=0
            def analyze(self,menu):
                self.calls+=1
                if self.calls==1:
                    raise RuntimeError('temporary AI failure')
                return super().analyze(menu)
        dd=Counted()
        self.p.provider,self.p.ai=dd,Flaky()
        self.assertEqual(self.p.tick(max_steps=10)['status'],'paused_error')
        self.assertEqual(dd.calls,1)
        self.t+=3600
        self.complete()
        self.assertEqual(dd.calls,3)

    def test_auth_requires_manual_resume(self):
        class Expired(DemoData):
            def search(self,*args):
                raise AuthenticationRequired()
        self.p.provider=Expired()
        self.assertEqual(self.p.tick()['status'],'auth_required')
        self.t+=INTERVAL
        self.assertEqual(self.p.tick()['status'],'auth_required')
        self.p.provider=DemoData()
        self.complete(force=True)

    def test_cli_error_not_negative_menu(self):
        with self.assertRaises(Cooldown) as ctx:
            parse_dd('',json.dumps({'error':{'code':'rate_limited','message':'Retry after 2738 seconds'}}),1)
        self.assertEqual(ctx.exception.seconds,2738)
        with self.assertRaises(ValueError):
            parse_dd('{"success":false}','',0)

    def test_evidence_and_incomplete_menu(self):
        menu=[{'name':'Oyster mushrooms','description':''}]
        with self.assertRaises(ValueError):
            validate_analysis({'status':'yes','evidence':['Raw oysters'],'reason':''},menu,True)
        r=validate_analysis({'status':'no','evidence':[],'reason':''},menu,False)
        self.assertEqual(r['status'],'unknown')

    def test_contact_requires_actual_email_quote(self):
        c={'official_site_match':True,'location':'manhattan','address':'10 Example St',
           'address_quote':'10 Example St','source_url':'https://example.com/contact',
           'email':'fake@example.com','email_quote':'fake@example.com','reason':''}
        checked=validate_contact(c,[{'url':c['source_url'],'text':'10 Example St; hello@example.com'}])
        self.assertIsNone(checked['email'])

    def test_mode_namespaces_are_separate(self):
        self.complete()
        live=LocalStore(self.path,'live')
        self.assertEqual(live.all('restaurants'),[])


if __name__=='__main__':
    unittest.main()
