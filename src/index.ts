import { Hono } from 'hono'

type Bindings = {
  MY_BUCKET: R2Bucket
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

export default app
