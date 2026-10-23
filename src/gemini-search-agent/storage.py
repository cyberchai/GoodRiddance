"""Small document store with atomic leases: SQLite locally, Firestore on GCP."""
import json
import os
import sqlite3
from pathlib import Path


class LocalStore:
    def __init__(self, path=None, namespace='demo'):
        self.path = str(path or Path(__file__).parent / 'data/pipeline.sqlite')
        self.ns = namespace
        with self.connect() as db:
            db.execute('CREATE TABLE IF NOT EXISTS docs (ns TEXT, kind TEXT, id TEXT, body TEXT, PRIMARY KEY(ns,kind,id))')

    def connect(self):
        return sqlite3.connect(self.path, timeout=30)

    def get(self, kind, key):
        with self.connect() as db:
            row = db.execute('SELECT body FROM docs WHERE ns=? AND kind=? AND id=?', (self.ns, kind, key)).fetchone()
        return json.loads(row[0]) if row else None

    def put(self, kind, key, value):
        with self.connect() as db:
            db.execute('INSERT OR REPLACE INTO docs VALUES(?,?,?,?)', (self.ns, kind, key, json.dumps(value)))

    def all(self, kind):
        with self.connect() as db:
            return [json.loads(row[0]) for row in db.execute('SELECT body FROM docs WHERE ns=? AND kind=?', (self.ns, kind))]

    def lease(self, owner, now, seconds=1200):
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute("SELECT body FROM docs WHERE ns=? AND kind='system' AND id='lease'", (self.ns,)).fetchone()
            old = json.loads(row[0]) if row else {}
            if old.get('until', 0) > now:
                return False
            db.execute('INSERT OR REPLACE INTO docs VALUES(?,?,?,?)',
                       (self.ns, 'system', 'lease', json.dumps({'owner': owner, 'until': now+seconds})))
        return True

    def release(self, owner):
        with self.connect() as db:
            db.execute('BEGIN IMMEDIATE')
            row = db.execute("SELECT body FROM docs WHERE ns=? AND kind='system' AND id='lease'", (self.ns,)).fetchone()
            if row and json.loads(row[0]).get('owner') == owner:
                db.execute("DELETE FROM docs WHERE ns=? AND kind='system' AND id='lease'", (self.ns,))


class FirestoreStore:
    def __init__(self, namespace='live'):
        from google.cloud import firestore
        self.db = firestore.Client(project=os.environ.get('GOOGLE_CLOUD_PROJECT'))
        self.root = self.db.collection('oyster_pipeline').document(namespace)

    def get(self, kind, key):
        snap = self.root.collection(kind).document(key).get()
        return snap.to_dict() if snap.exists else None

    def put(self, kind, key, value):
        self.root.collection(kind).document(key).set(value)

    def all(self, kind):
        return [s.to_dict() for s in self.root.collection(kind).stream()]

    def lease(self, owner, now, seconds=1200):
        from google.cloud import firestore
        ref = self.root.collection('system').document('lease')
        @firestore.transactional
        def claim(tx):
            snap = ref.get(transaction=tx)
            old = snap.to_dict() or {}
            if old.get('until', 0) > now:
                return False
            tx.set(ref, {'owner': owner, 'until': now+seconds})
            return True
        return claim(self.db.transaction())

    def release(self, owner):
        from google.cloud import firestore
        ref = self.root.collection('system').document('lease')
        @firestore.transactional
        def free(tx):
            snap = ref.get(transaction=tx)
            if snap.exists and snap.to_dict().get('owner') == owner:
                tx.delete(ref)
        free(self.db.transaction())


def store_for(mode):
    return FirestoreStore(mode) if os.getenv('STORAGE', 'sqlite') == 'firestore' else LocalStore(namespace=mode)
