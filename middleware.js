import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

export const config = {
  matcher: '/join/:token*',
}

export default async function middleware(request) {
  const url = new URL(request.url)
  const token = url.pathname.split('/join/')[1]?.split('/')[0]?.split('?')[0]

  if (!token || !supabaseUrl || !supabaseKey) {
    return
  }

  // Check if this is a bot/crawler requesting the page (for OG preview)
  const ua = request.headers.get('user-agent') || ''
  const isBot = /facebookexternalhit|Twitterbot|WhatsApp|Slackbot|TelegramBot|LinkedInBot|Discordbot|iMessageLinkFetcher|Googlebot|bingbot|applebot/i.test(ua)

  if (!isBot) {
    // Regular user — let the SPA handle it
    return
  }

  // Bot/crawler — fetch trip data and return OG-enriched HTML
  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: preview } = await supabase.rpc('get_trip_preview', { p_token: token })

    if (!preview) return

    const trip = preview
    const ownerName = trip.owner_name || 'Someone'
    const title = `${ownerName} invited you to join ${trip.name}`
    const description = trip.destination
      ? `Join the trip to ${trip.destination} on Convoy`
      : `Join this trip on Convoy — plan together, travel smarter`
    const image = trip.cover_url || `${url.origin}/favicon.svg`
    const tripUrl = `${url.origin}/join/${token}`

    // Date info
    let dateStr = ''
    if (trip.start_date && trip.end_date) {
      const s = new Date(trip.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const e = new Date(trip.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      dateStr = ` · ${s} – ${e}`
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <meta name="description" content="${description}${dateStr}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${tripUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}${dateStr}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:site_name" content="Convoy" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}${dateStr}" />
  <meta name="twitter:image" content="${image}" />
  <meta http-equiv="refresh" content="0;url=${tripUrl}" />
</head>
<body>
  <p>Redirecting to <a href="${tripUrl}">Convoy</a>...</p>
</body>
</html>`

    return new Response(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=300',
      },
    })
  } catch {
    return
  }
}
