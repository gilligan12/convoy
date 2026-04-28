export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname.replace(/^\/api\/claude/, '')
  const targetUrl = `https://api.anthropic.com${path}`

  try {
    // Read body
    const chunks = []
    for await (const chunk of req) chunks.push(chunk)
    const body = Buffer.concat(chunks).toString()

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': req.headers['x-api-key'] || '',
        'anthropic-version': req.headers['anthropic-version'] || '2023-06-01',
      },
      body,
    })

    const data = await response.text()
    res.setHeader('Content-Type', 'application/json')
    res.status(response.status).send(data)
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' })
  }
}
