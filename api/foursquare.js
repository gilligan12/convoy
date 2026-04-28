export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const path = url.pathname.replace(/^\/api\/foursquare/, '')
  const query = url.search

  const targetUrl = `https://places-api.foursquare.com${path}${query}`

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization || '',
        'X-Places-Api-Version': req.headers['x-places-api-version'] || '2025-06-17',
        'Accept': 'application/json',
      },
    })

    const data = await response.text()
    res.setHeader('Content-Type', 'application/json')
    res.status(response.status).send(data)
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' })
  }
}
