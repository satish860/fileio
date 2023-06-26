import { Hono } from 'hono'
import { getXataClient } from './xata'

type Bindings = {
  MY_BUCKET: R2Bucket
  XATA_API_KEY: string
}


const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => c.text('Hello Hono!'))

app.put('/upload/:key', async (c, next) => {
  const key = c.req.param('key')
  if (!key) return c.text('Key is required!', 400)
  await c.env.MY_BUCKET.put(key, c.req.body)
  return c.text(`Put ${key} successfully!`)
})

app.get('/download/:key', async (c, next) => {
  const key = c.req.param('key')
  if (!key) return c.text('Key is required!', 400)
  const data = await c.env.MY_BUCKET.get(key)
  if (!data) return c.text('Not found!', 404)
  const headers = new Headers();
  data.writeHttpMetadata(headers);
  headers.set('etag', data.httpEtag);
  for (const [name, value] of headers.entries()) {
    c.header(name, value);
  }
  return c.body(data.body)
})

app.get('/generatekey/:userid', async (c) => {
  const xata = getXataClient(c.env.XATA_API_KEY)
  const userid = c.req.param('userid')
  const apiKeyLength = 16; // Length of the API key in bytes
  const keyBuffer = new Uint8Array(apiKeyLength);
  crypto.getRandomValues(keyBuffer);
  const apiKey = Array.from(keyBuffer).map(byte => byte.toString(16).padStart(2, '0')).join('');
  const record = await xata.db.ApiKey.create({
    ApiKey: apiKey,
    userId: userid,
  });
  return c.text(apiKey)
})

export default app
