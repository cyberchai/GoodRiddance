import { join } from 'node:path'
import express from 'express'
import { Firestore } from '@google-cloud/firestore'

// On Cloud Run this authenticates as the service's runtime service account.
const db = new Firestore()
const app = express()

// Express 5 forwards a rejected promise to the default error handler.
app.get('/api/restaurants', async (req, res) => {
  const [meta, restaurants] = await Promise.all([
    db.doc('meta/oysterDataset').get(),
    db.collection('restaurants').get(),
  ])
  res.set('Cache-Control', 'public, max-age=60')
  res.json({
    title: meta.get('title'),
    source: meta.get('source'),
    checkedWithoutOysters: meta.get('checkedWithoutOysters') ?? [],
    restaurants: restaurants.docs.map((doc) => doc.data()),
  })
})

app.use(express.static(join(import.meta.dirname, '../dist')))

const port = process.env.PORT ?? 8080
app.listen(port, () => console.log(`Listening on :${port}`))
