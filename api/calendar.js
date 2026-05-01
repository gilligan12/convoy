import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`)
  const token = url.searchParams.get('token')

  if (!token) {
    return res.status(400).send('Missing token')
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).send('Server config error')
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  // Look up trip by invite_token (reusing the same token for calendar access)
  const { data: trip } = await supabase
    .rpc('get_trip_preview', { p_token: token })

  if (!trip) {
    return res.status(404).send('Trip not found')
  }

  // Get trip ID from token
  const { data: tripRow } = await supabase
    .from('trips')
    .select('id')
    .eq('invite_token', token)
    .single()

  if (!tripRow) {
    return res.status(404).send('Trip not found')
  }

  // Fetch itinerary items — need a security definer function for this
  const { data: items } = await supabase
    .rpc('get_trip_items_for_calendar', { p_trip_id: tripRow.id })

  const events = (items || []).map((item) => {
    const uid = `${item.id}@convoy`
    const summary = item.title || 'Untitled'
    const location = item.location || ''
    const description = (item.description || '').replace(/\n/g, '\\n')

    let dtstart = ''
    let dtend = ''

    if (item.date) {
      const d = item.date.replace(/-/g, '')
      if (item.start_time) {
        const t = item.start_time.replace(/:/g, '') + '00'
        dtstart = `DTSTART:${d}T${t}`
        if (item.end_time) {
          const te = item.end_time.replace(/:/g, '') + '00'
          dtend = `DTEND:${d}T${te}`
        } else {
          // Default 1 hour duration
          const h = parseInt(item.start_time.split(':')[0])
          const m = item.start_time.split(':')[1]
          const eh = String(h + 1).padStart(2, '0')
          dtend = `DTEND:${d}T${eh}${m}00`
        }
      } else {
        // All-day event
        dtstart = `DTSTART;VALUE=DATE:${d}`
        dtend = `DTEND;VALUE=DATE:${d}`
      }
    }

    if (!dtstart) return null

    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      dtstart,
      dtend,
      `SUMMARY:${summary}`,
      location ? `LOCATION:${location}` : null,
      description ? `DESCRIPTION:${description}` : null,
      'END:VEVENT',
    ].filter(Boolean).join('\r\n')
  }).filter(Boolean)

  const tripName = trip.name || 'Trip'

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Convoy//Trip Planner//EN',
    `X-WR-CALNAME:${tripName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8')
  res.setHeader('Content-Disposition', `inline; filename="${tripName.replace(/[^a-zA-Z0-9 ]/g, '')}.ics"`)
  res.setHeader('Cache-Control', 'public, max-age=300') // Cache 5 min so calendar apps get updates
  res.status(200).send(ics)
}
