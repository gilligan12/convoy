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

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase.rpc('get_calendar_data', { p_token: token })

    if (error || !data) {
      return res.status(404).send('Trip not found')
    }

    const tripName = data.trip_name || 'Trip'
    const items = data.items || []

    const events = items.map((item) => {
      const uid = `${item.id}@convoy`
      const summary = (item.title || 'Untitled').replace(/,/g, '\\,')
      const location = (item.location || '').replace(/,/g, '\\,')
      const description = (item.description || '').replace(/\n/g, '\\n').replace(/,/g, '\\,')

      let dtstart = ''
      let dtend = ''

      if (item.date) {
        const d = item.date.replace(/-/g, '')
        if (item.start_time) {
          const t = item.start_time.replace(/:/g, '').padEnd(6, '0')
          dtstart = `DTSTART:${d}T${t}`
          if (item.end_time) {
            const te = item.end_time.replace(/:/g, '').padEnd(6, '0')
            dtend = `DTEND:${d}T${te}`
          } else {
            const h = parseInt(item.start_time.split(':')[0])
            const m = item.start_time.split(':')[1]
            const eh = String(Math.min(h + 1, 23)).padStart(2, '0')
            dtend = `DTEND:${d}T${eh}${m}00`
          }
        } else {
          dtstart = `DTSTART;VALUE=DATE:${d}`
          const nextDay = new Date(item.date + 'T00:00:00')
          nextDay.setDate(nextDay.getDate() + 1)
          const nd = nextDay.toISOString().split('T')[0].replace(/-/g, '')
          dtend = `DTEND;VALUE=DATE:${nd}`
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
    res.setHeader('Cache-Control', 'public, max-age=300')
    res.status(200).send(ics)
  } catch (err) {
    res.status(500).send('Server error: ' + err.message)
  }
}
