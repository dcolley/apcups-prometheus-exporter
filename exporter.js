import express from 'express'
const app = express()
import { ApcUpsImporter } from './importer.js'

// https://stackoverflow.com/questions/30585540/process-send-is-conditionally-defined-in-node-js
process.send = process.send || function () {};

const PORT = 3000

const config ={
  hostname: '192.168.0.85',
  port: 3551,
  prefix: 'apc_ups'
}

let worker = new ApcUpsImporter(config)

app.get('/', (req, res) => {
  console.debug('/', req.params)
  res.set("Content-Type","text/plain; version=0.0.4")
    .send('nothing to see here... try /metrics')
})

app.get('/metrics', async (req, res) => {
  console.debug('/metrics')
  try {
    let data = await worker.read()
    res.set("Content-Type","text/plain; version=0.0.4")
    res.send(data)
  } catch (err) {
    res.status(500).send(err)
  }
})

app.listen(PORT, (err) => {
  if (err) console.log("Error in server setup")
  console.log(`Server listening on http://localhost:${PORT}`)
  process.send('ready')
})
