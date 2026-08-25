import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

app.use('*', cors())

const BASE_URL = 'https://spider-avik zone.id' // পরে পরিবর্তন করবে

// Health
app.get('/', (c) => c.text('Spider Media API running'))

// Upload
app.post('/upload', async (c) => {
  try {
    const body = await c.req.parseBody()
    const file = body['file']

    if (!file || !(file instanceof File)) {
      return c.json({ error: 'No file uploaded' }, 400)
    }

    const form = new FormData()
    form.append('reqtype', 'fileupload')
    form.append('fileToUpload', file, file.name || 'media.bin')

    const res = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: form
    })

    const catboxUrl = await res.text()
    const filename = catboxUrl.split('/').pop()

    return c.json({
      success: true,
      url: `\( {BASE_URL}/ \){filename}`,
      original_name: file.name
    })
  } catch (err) {
    console.error(err)
    return c.json({ error: 'Upload failed' }, 500)
  }
})

// Proxy (short URL)
app.get('/:filename', async (c) => {
  const filename = c.req.param('filename')

  try {
    const res = await fetch(`https://files.catbox.moe/${filename}`)

    if (!res.ok) {
      return c.text('File not found', 404)
    }

    return new Response(res.body, {
      headers: {
        'Content-Type': res.headers.get('Content-Type') || 'application/octet-stream',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (err) {
    return c.text('File not found', 404)
  }
})

export default app
