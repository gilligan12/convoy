import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'
import Avatar from '../components/Avatar'
import AppNav from '../components/AppNav'

const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY
const FOURSQUARE_KEY = import.meta.env.VITE_FOURSQUARE_KEY

/* ── Custom SVG icons ── */
const ICONS = {
  flight: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 16v-2l-8-5V3.5a1.5 1.5 0 00-3 0V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor"/>
    </svg>
  ),
  hotel: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 21V7a2 2 0 012-2h14a2 2 0 012 2v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M9 5V3M15 5V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <rect x="7" y="9" width="4" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
      <rect x="13" y="9" width="4" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M10 21v-5a2 2 0 012-2v0a2 2 0 012 2v5" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  ),
  restaurant: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 3v7a3 3 0 01-3 3h0v8M6 3v5a3 3 0 003 3h0M9 11v10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 3v5M9 3v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M15 3v7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  transport: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="6" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="7.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="16.5" cy="17" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M3 11h18" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M7 6V4M17 6V4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
  activity: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 7v5l3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  note: ({ size = 16, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
}

const ITEM_TYPES = [
  { value: 'activity', label: 'Activity' },
  { value: 'flight', label: 'Flight' },
  { value: 'hotel', label: 'Lodging' },
  { value: 'restaurant', label: 'Dining' },
  { value: 'transport', label: 'Transport' },
  { value: 'note', label: 'Note' },
]

// Section display order for day grouping
const SECTION_ORDER = ['flight', 'hotel', 'transport', 'restaurant', 'activity', 'note']

/* ── Weather API (Open-Meteo) ── */
const WEATHER_CODES = {
  0: { label: 'Clear', icon: 'sun' },
  1: { label: 'Mostly Clear', icon: 'sun' },
  2: { label: 'Partly Cloudy', icon: 'cloud-sun' },
  3: { label: 'Overcast', icon: 'cloud' },
  45: { label: 'Fog', icon: 'fog' },
  48: { label: 'Fog', icon: 'fog' },
  51: { label: 'Light Drizzle', icon: 'drizzle' },
  53: { label: 'Drizzle', icon: 'drizzle' },
  55: { label: 'Heavy Drizzle', icon: 'drizzle' },
  61: { label: 'Light Rain', icon: 'rain' },
  63: { label: 'Rain', icon: 'rain' },
  65: { label: 'Heavy Rain', icon: 'rain' },
  71: { label: 'Light Snow', icon: 'snow' },
  73: { label: 'Snow', icon: 'snow' },
  75: { label: 'Heavy Snow', icon: 'snow' },
  80: { label: 'Showers', icon: 'rain' },
  81: { label: 'Showers', icon: 'rain' },
  82: { label: 'Heavy Showers', icon: 'rain' },
  95: { label: 'Thunderstorm', icon: 'storm' },
  96: { label: 'Thunderstorm', icon: 'storm' },
  99: { label: 'Thunderstorm', icon: 'storm' },
}

function WeatherIcon({ type, size = 16 }) {
  const s = size
  if (type === 'sun') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
  if (type === 'cloud-sun') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <circle cx="10" cy="8" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M10 3v1M5.17 5.17l.71.71M3 8h1M5.17 10.83l.71-.71" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M8 15.5A3.5 3.5 0 1114.47 13H15a3 3 0 010 6H8a2.5 2.5 0 010-5v1.5z" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  )
  if (type === 'cloud') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M8 17.5A3.5 3.5 0 1114.47 15H15.5a3 3 0 010 6H8a2.5 2.5 0 010-5v1.5z" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  )
  if (type === 'rain') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M8 13.5A3.5 3.5 0 1114.47 11H15.5a3 3 0 010 6H8a2.5 2.5 0 010-5v1.5z" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M10 20v1M14 20v1M12 22v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
  if (type === 'drizzle') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M8 13.5A3.5 3.5 0 1114.47 11H15.5a3 3 0 010 6H8a2.5 2.5 0 010-5v1.5z" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M12 20v1" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
  if (type === 'snow') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M8 13.5A3.5 3.5 0 1114.47 11H15.5a3 3 0 010 6H8a2.5 2.5 0 010-5v1.5z" stroke="currentColor" strokeWidth="1.8"/>
      <circle cx="10" cy="21" r="0.8" fill="currentColor"/><circle cx="14" cy="21" r="0.8" fill="currentColor"/><circle cx="12" cy="23" r="0.8" fill="currentColor"/>
    </svg>
  )
  if (type === 'storm') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M8 12.5A3.5 3.5 0 1114.47 10H15.5a3 3 0 010 6H8a2.5 2.5 0 010-5v1.5z" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M13 17l-2 3h3l-2 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  if (type === 'fog') return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none">
      <path d="M6 14h12M4 18h16M8 22h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8 10.5A3.5 3.5 0 1114.47 8H15.5a2.5 2.5 0 010 5H8.5" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.8"/></svg>
}

// Cache geocoding results so we don't re-fetch for the same city
const geoCache = {}

async function geocodeCity(cityName) {
  if (geoCache[cityName]) return geoCache[cityName]
  try {
    // Try Photon first
    const geoRes = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(cityName)}&limit=1&lang=en`)
    if (geoRes.ok) {
      const geoData = await geoRes.json()
      if (geoData.features?.length) {
        const [lon, lat] = geoData.features[0].geometry.coordinates
        geoCache[cityName] = { lat, lon }
        return { lat, lon }
      }
    }
    // Fallback: Open-Meteo's own geocoder
    const fallback = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en`)
    if (fallback.ok) {
      const fbData = await fallback.json()
      if (fbData.results?.length) {
        const { latitude, longitude } = fbData.results[0]
        geoCache[cityName] = { lat: latitude, lon: longitude }
        return { lat: latitude, lon: longitude }
      }
    }
    return null
  } catch {
    return null
  }
}

async function fetchWeatherDetailed(cityName, dateStr) {
  if (!cityName || !dateStr) return null
  try {
    const coords = await geocodeCity(cityName)
    if (!coords) return null
    const { lat, lon } = coords

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr + 'T00:00:00')
    const daysOut = Math.round((target - today) / (1000 * 60 * 60 * 24))

    if (daysOut >= 0 && daysOut <= 16) {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,weathercode,sunrise,sunset,precipitation_sum,precipitation_probability_max,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant,uv_index_max&hourly=temperature_2m,weathercode,precipitation_probability,windspeed_10m&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`
      )
      if (!res.ok) return null
      const data = await res.json()
      if (!data.daily?.time?.length) return null
      const d = data.daily
      return {
        type: 'forecast',
        high: Math.round(d.temperature_2m_max[0]),
        low: Math.round(d.temperature_2m_min[0]),
        feelsHigh: Math.round(d.apparent_temperature_max[0]),
        feelsLow: Math.round(d.apparent_temperature_min[0]),
        code: d.weathercode[0],
        sunrise: d.sunrise?.[0]?.slice(11, 16) || null,
        sunset: d.sunset?.[0]?.slice(11, 16) || null,
        precipitation: d.precipitation_sum?.[0] ?? null,
        precipProb: d.precipitation_probability_max?.[0] ?? null,
        windSpeed: d.windspeed_10m_max?.[0] ?? null,
        windGusts: d.windgusts_10m_max?.[0] ?? null,
        windDir: d.winddirection_10m_dominant?.[0] ?? null,
        uvIndex: d.uv_index_max?.[0] ?? null,
        hourly: data.hourly ? data.hourly.time.map((t, i) => ({
          hour: t.slice(11, 16),
          temp: Math.round(data.hourly.temperature_2m[i]),
          code: data.hourly.weathercode[i],
          precipProb: data.hourly.precipitation_probability[i],
          wind: Math.round(data.hourly.windspeed_10m[i]),
        })) : [],
        city: cityName,
        date: dateStr,
      }
    } else {
      // Historical — less detail available
      const years = []
      for (let y = 1; y <= 5; y++) {
        const dd = new Date(target)
        dd.setFullYear(dd.getFullYear() - y)
        years.push(dd.toISOString().split('T')[0])
      }
      const startDate = years[years.length - 1]
      const endDate = years[0]
      const md = dateStr.slice(5)
      const res = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_sum,windspeed_10m_max&timezone=auto&start_date=${startDate}&end_date=${endDate}`
      )
      if (!res.ok) return null
      const data = await res.json()
      if (!data.daily?.time) return null
      const matchIdxs = data.daily.time.map((t, i) => t.slice(5) === md ? i : -1).filter((i) => i >= 0)
      if (matchIdxs.length === 0) return null
      const avg = (arr, idxs) => Math.round(idxs.reduce((s, i) => s + (arr[i] || 0), 0) / idxs.length)
      const codes = matchIdxs.map((i) => data.daily.weathercode[i])
      const modeCode = codes.sort((a, b) => codes.filter((v) => v === a).length - codes.filter((v) => v === b).length).pop()
      return {
        type: 'historical',
        high: avg(data.daily.temperature_2m_max, matchIdxs),
        low: avg(data.daily.temperature_2m_min, matchIdxs),
        code: modeCode,
        precipitation: parseFloat((matchIdxs.reduce((s, i) => s + (data.daily.precipitation_sum[i] || 0), 0) / matchIdxs.length).toFixed(1)),
        windSpeed: avg(data.daily.windspeed_10m_max, matchIdxs),
        yearData: matchIdxs.map((i) => ({
          year: data.daily.time[i].slice(0, 4),
          high: Math.round(data.daily.temperature_2m_max[i]),
          low: Math.round(data.daily.temperature_2m_min[i]),
          code: data.daily.weathercode[i],
        })),
        city: cityName,
        date: dateStr,
        hourly: [],
      }
    }
  } catch {
    return null
  }
}

async function fetchWeatherForDay(cityName, dateStr) {
  if (!cityName || !dateStr) return null
  try {
    const coords = await geocodeCity(cityName)
    if (!coords) return null
    const { lat, lon } = coords

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateStr + 'T00:00:00')
    const daysOut = Math.round((target - today) / (1000 * 60 * 60 * 24))

    if (daysOut >= 0 && daysOut <= 16) {
      // Forecast
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`
      )
      if (!res.ok) return null
      const data = await res.json()
      if (!data.daily?.time?.length) return null
      return {
        high: Math.round(data.daily.temperature_2m_max[0]),
        low: Math.round(data.daily.temperature_2m_min[0]),
        code: data.daily.weathercode[0],
        type: 'forecast',
      }
    } else {
      // Historical average — last 5 years for same date
      const years = []
      for (let y = 1; y <= 5; y++) {
        const d = new Date(target)
        d.setFullYear(d.getFullYear() - y)
        years.push(d.toISOString().split('T')[0])
      }
      const startDate = years[years.length - 1]
      const endDate = years[0]
      const md = dateStr.slice(5) // "MM-DD"
      const res = await fetch(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${startDate}&end_date=${endDate}`
      )
      if (!res.ok) return null
      const data = await res.json()
      if (!data.daily?.time) return null
      const matchIdxs = data.daily.time
        .map((t, i) => t.slice(5) === md ? i : -1)
        .filter((i) => i >= 0)
      if (matchIdxs.length === 0) return null
      const avgHigh = Math.round(matchIdxs.reduce((s, i) => s + data.daily.temperature_2m_max[i], 0) / matchIdxs.length)
      const avgLow = Math.round(matchIdxs.reduce((s, i) => s + data.daily.temperature_2m_min[i], 0) / matchIdxs.length)
      const codes = matchIdxs.map((i) => data.daily.weathercode[i])
      const modeCode = codes.sort((a, b) => codes.filter((v) => v === a).length - codes.filter((v) => v === b).length).pop()
      return {
        high: avgHigh,
        low: avgLow,
        code: modeCode,
        type: 'historical',
      }
    }
  } catch {
    return null
  }
}

function celsiusToF(c) { return Math.round(c * 9 / 5 + 32) }

/* ── Day Weather Badge ── */
// Weather result cache
const weatherCache = {}
let weatherQueue = Promise.resolve()

function queueWeatherFetch(city, dateStr) {
  const key = `${city}|${dateStr}`
  if (weatherCache[key] !== undefined) return Promise.resolve(weatherCache[key])
  // Chain requests to avoid rate limiting
  weatherQueue = weatherQueue.then(() =>
    new Promise((resolve) => setTimeout(resolve, 150))
  ).then(() =>
    fetchWeatherForDay(city, dateStr).then((w) => {
      weatherCache[key] = w
      return w
    })
  )
  return weatherQueue
}

function DayWeather({ city, dateStr, useFahrenheit, onClick }) {
  const [weather, setWeather] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const fetchedRef = useRef('')

  useEffect(() => {
    const key = `${city}|${dateStr}`
    if (!city || !dateStr || fetchedRef.current === key) return
    fetchedRef.current = key

    // Check cache first
    if (weatherCache[key] !== undefined) {
      setWeather(weatherCache[key])
      setLoaded(true)
      return
    }

    queueWeatherFetch(city, dateStr).then((w) => {
      setWeather(w)
      setLoaded(true)
    })
  }, [city, dateStr])

  if (!city || !loaded) return null
  if (!weather) return null

  const info = WEATHER_CODES[weather.code] || { label: 'Unknown', icon: 'sun' }
  const high = useFahrenheit ? celsiusToF(weather.high) : weather.high
  const low = useFahrenheit ? celsiusToF(weather.low) : weather.low
  const unit = useFahrenheit ? '°F' : '°C'

  return (
    <button
      type="button"
      onClick={() => onClick?.({ city, dateStr })}
      className="inline-flex items-center gap-1.5 bg-[#1C3829]/5 hover:bg-[#1C3829]/10 rounded-full px-2.5 py-1 ml-2 transition-colors cursor-pointer"
    >
      <div className="text-[#1C3829]/50">
        <WeatherIcon type={info.icon} size={14} />
      </div>
      <span className="text-[10px] font-medium text-[#1C3829]/50">
        {high}° / {low}{unit}
      </span>
      {weather.type === 'historical' && (
        <span className="text-[8px] text-[#1C3829]/25" title="5-year historical average">avg</span>
      )}
    </button>
  )
}

/* ── Wind direction label ── */
function windDirLabel(deg) {
  if (deg == null) return ''
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

/* ── Weather Detail Modal ── */
/* ── Restaurant Detail Modal ── */
async function fetchRestaurantDetails(fsqId) {
  if (!FOURSQUARE_KEY || !fsqId) return null
  try {
    const res = await fetch(`/api/foursquare/places/${fsqId}`, {
      headers: {
        Authorization: `Bearer ${FOURSQUARE_KEY}`,
        'X-Places-Api-Version': '2025-06-17',
        Accept: 'application/json',
      },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

function RestaurantDetailModal({ open, onClose, item }) {
  const [place, setPlace] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !item) return
    setLoading(true)
    setPlace(null)

    const lines = (item.description || '').split('\n')
    const getField = (key) => { const l = lines.find((l) => l.startsWith(key + ':')); return l ? l.slice(key.length + 1).trim() : '' }
    const fsqId = getField('FoursquareID')

    if (!fsqId) {
      // No Foursquare ID — show what we have from the item
      setPlace({
        name: item.title,
        location: { formatted_address: item.location },
        website: getField('Website'),
        tel: getField('Phone'),
        categories: getField('Cuisine') ? [{ name: getField('Cuisine') }] : [],
        _fromItem: true,
      })
      setLoading(false)
      return
    }

    fetchRestaurantDetails(fsqId).then((data) => {
      if (data) {
        setPlace(data)
      } else {
        setPlace({
          name: item.title,
          location: { formatted_address: item.location },
          website: getField('Website'),
          tel: getField('Phone'),
          categories: getField('Cuisine') ? [{ name: getField('Cuisine') }] : [],
          _fromItem: true,
        })
      }
      setLoading(false)
    })
  }, [open, item])

  if (!open) return null

  const meal = (() => {
    if (!item?.start_time) return ''
    const h = parseInt(item.start_time.split(':')[0])
    if (h < 11) return 'Breakfast'
    if (h < 15) return 'Lunch'
    if (h < 17) return 'Afternoon'
    return 'Dinner'
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1C3829] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto text-[#F5EFE0]">

        {loading && (
          <div className="p-16 text-center">
            <div className="w-6 h-6 border-2 border-[#F5EFE0]/20 border-t-[#F5EFE0]/60 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs opacity-40">Loading restaurant...</p>
          </div>
        )}

        {!loading && place && (() => {
          const cats = (place.categories || []).map((c) => c.short_name || c.name)
          const addr = place.location?.formatted_address || place.location?.address || ''
          const lat = place.latitude
          const lon = place.longitude
          const mapUrl = lat && lon ? `https://www.google.com/maps/search/?api=1&query=${lat},${lon}` : null
          const socials = place.social_media || {}

          return (
            <>
              {/* Header */}
              <div className="p-6 pb-0 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <ICONS.restaurant size={14} className="opacity-50" />
                    {cats[0] && <span className="text-[10px] font-medium opacity-40">{cats[0]}</span>}
                    {meal && <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full ml-auto">{meal}</span>}
                  </div>
                  <h3
                    className="text-2xl font-semibold tracking-tight leading-tight"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {place.name}
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-[#F5EFE0]/40 hover:text-[#F5EFE0] transition-colors text-lg ml-3"
                >
                  &times;
                </button>
              </div>

              {/* Categories */}
              {cats.length > 0 && (
                <div className="px-6 mt-3 flex flex-wrap gap-1.5">
                  {cats.map((c, i) => (
                    <span key={i} className="text-[10px] bg-white/8 px-2.5 py-1 rounded-full opacity-60">{c}</span>
                  ))}
                </div>
              )}

              {/* Reservation time */}
              {(item?.start_time || item?.end_time) && (
                <div className="mx-6 mt-5 rounded-xl bg-white/5 border border-white/5 p-4">
                  <p className="text-[9px] font-semibold tracking-wider uppercase opacity-30 mb-2">Reservation</p>
                  <p className="text-sm font-medium opacity-80">
                    {item.start_time && formatTime(item.start_time)}
                    {item.start_time && item.end_time && ' – '}
                    {item.end_time && formatTime(item.end_time)}
                  </p>
                  {item.date && (
                    <p className="text-xs opacity-40 mt-1">{formatDate(item.date)}</p>
                  )}
                </div>
              )}

              {/* Details grid */}
              <div className="mx-6 mt-3 rounded-xl bg-white/5 border border-white/5 p-4">
                <p className="text-[9px] font-semibold tracking-wider uppercase opacity-30 mb-3">Details</p>
                <div className="space-y-3">
                  {addr && (
                    <div className="flex items-start gap-3">
                      <svg width="14" height="14" viewBox="0 0 10 10" fill="none" className="opacity-30 flex-shrink-0 mt-0.5">
                        <path d="M5 1C3.34 1 2 2.34 2 4c0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4a1 1 0 110-2 1 1 0 010 2z" fill="currentColor"/>
                      </svg>
                      <div>
                        <p className="text-xs opacity-70">{addr}</p>
                        {mapUrl && (
                          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] opacity-30 hover:opacity-60 underline transition-opacity mt-0.5 inline-block">
                            Open in Maps →
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {place.tel && (
                    <div className="flex items-center gap-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-30 flex-shrink-0">
                        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      <a href={`tel:${place.tel}`} className="text-xs opacity-70 hover:opacity-100 transition-opacity">{place.tel}</a>
                    </div>
                  )}
                  {place.website && (
                    <div className="flex items-center gap-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-30 flex-shrink-0">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                      <a href={place.website} target="_blank" rel="noopener noreferrer" className="text-xs opacity-70 hover:opacity-100 underline transition-opacity truncate">
                        {place.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                      </a>
                    </div>
                  )}
                  {socials.facebook_id && (
                    <div className="flex items-center gap-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-30 flex-shrink-0">
                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3V2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                      </svg>
                      <a href={`https://facebook.com/${socials.facebook_id}`} target="_blank" rel="noopener noreferrer" className="text-xs opacity-70 hover:opacity-100 underline transition-opacity">
                        Facebook
                      </a>
                    </div>
                  )}
                  {socials.instagram && (
                    <div className="flex items-center gap-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-30 flex-shrink-0">
                        <rect x="2" y="2" width="20" height="20" rx="5" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>
                      </svg>
                      <a href={`https://instagram.com/${socials.instagram}`} target="_blank" rel="noopener noreferrer" className="text-xs opacity-70 hover:opacity-100 underline transition-opacity">
                        @{socials.instagram}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4" />
            </>
          )
        })()}
      </div>
    </div>
  )
}

function WeatherDetailModal({ open, onClose, city, dateStr, useFahrenheit }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!open || !city || !dateStr) return
    setLoading(true)
    setData(null)
    fetchWeatherDetailed(city, dateStr).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [open, city, dateStr])

  if (!open) return null

  const t = (c) => useFahrenheit ? celsiusToF(c) : c
  const unit = useFahrenheit ? '°F' : '°C'
  const dateDisplay = dateStr ? new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1C3829] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto text-[#F5EFE0]">

        {loading && (
          <div className="p-16 text-center">
            <div className="w-6 h-6 border-2 border-[#F5EFE0]/20 border-t-[#F5EFE0]/60 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs opacity-40">Loading weather...</p>
          </div>
        )}

        {!loading && !data && (
          <div className="p-12 text-center">
            <p className="text-sm opacity-50 mb-4">Weather data unavailable</p>
            <button onClick={onClose} className="text-xs opacity-40 hover:opacity-70 transition-opacity">Close</button>
          </div>
        )}

        {!loading && data && (
          <>
            {/* Header */}
            <div className="p-6 pb-2 flex items-start justify-between">
              <div>
                <p className="text-xs opacity-40 mb-1">{dateDisplay}</p>
                <h3
                  className="text-2xl font-semibold tracking-tight"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {city}
                </h3>
                {data.type === 'historical' && (
                  <p className="text-[10px] opacity-30 mt-1">5-year historical average</p>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-[#F5EFE0]/40 hover:text-[#F5EFE0] transition-colors text-lg"
              >
                &times;
              </button>
            </div>

            {/* Main temp + condition */}
            <div className="px-6 py-6 text-center">
              <div className="inline-flex items-center gap-3 mb-2">
                <div className="opacity-60">
                  <WeatherIcon type={(WEATHER_CODES[data.code] || {}).icon || 'sun'} size={40} />
                </div>
                <p
                  className="text-5xl font-bold tracking-tight"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                >
                  {t(data.high)}°
                </p>
              </div>
              <p className="text-sm opacity-50">
                {(WEATHER_CODES[data.code] || {}).label || 'Unknown'}
              </p>
              <p className="text-xs opacity-35 mt-1">
                High {t(data.high)}{unit} · Low {t(data.low)}{unit}
              </p>
              {data.feelsHigh != null && (
                <p className="text-[10px] opacity-25 mt-0.5">
                  Feels like {t(data.feelsHigh)}° / {t(data.feelsLow)}°
                </p>
              )}
            </div>

            {/* Detail grid */}
            <div className="mx-6 rounded-xl bg-white/5 border border-white/5 p-4">
              <div className="grid grid-cols-2 gap-4">
                {data.precipProb != null && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-30 font-medium">Rain Chance</p>
                    <p className="text-sm font-medium opacity-80 mt-0.5">{data.precipProb}%</p>
                  </div>
                )}
                {data.precipitation != null && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-30 font-medium">Precipitation</p>
                    <p className="text-sm font-medium opacity-80 mt-0.5">{data.precipitation} mm</p>
                  </div>
                )}
                {data.windSpeed != null && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-30 font-medium">Wind</p>
                    <p className="text-sm font-medium opacity-80 mt-0.5">
                      {Math.round(data.windSpeed)} km/h {data.windDir != null ? windDirLabel(data.windDir) : ''}
                    </p>
                  </div>
                )}
                {data.windGusts != null && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-30 font-medium">Gusts</p>
                    <p className="text-sm font-medium opacity-80 mt-0.5">{Math.round(data.windGusts)} km/h</p>
                  </div>
                )}
                {data.uvIndex != null && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-30 font-medium">UV Index</p>
                    <p className="text-sm font-medium opacity-80 mt-0.5">
                      {data.uvIndex.toFixed(0)} {data.uvIndex >= 8 ? '(Very High)' : data.uvIndex >= 6 ? '(High)' : data.uvIndex >= 3 ? '(Moderate)' : '(Low)'}
                    </p>
                  </div>
                )}
                {data.sunrise && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-30 font-medium">Sunrise</p>
                    <p className="text-sm font-medium opacity-80 mt-0.5">{formatTime(data.sunrise)}</p>
                  </div>
                )}
                {data.sunset && (
                  <div>
                    <p className="text-[9px] uppercase tracking-wider opacity-30 font-medium">Sunset</p>
                    <p className="text-sm font-medium opacity-80 mt-0.5">{formatTime(data.sunset)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Hourly forecast (only for forecast, not historical) */}
            {data.hourly.length > 0 && (
              <div className="mx-6 mt-3 rounded-xl bg-white/5 border border-white/5 p-4">
                <p className="text-[9px] font-semibold tracking-wider uppercase opacity-30 mb-3">Hourly Forecast</p>
                <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                  {data.hourly.filter((_, i) => i % 3 === 0).map((h) => {
                    const hInfo = WEATHER_CODES[h.code] || { icon: 'sun' }
                    const hour = parseInt(h.hour.split(':')[0])
                    const ampm = hour >= 12 ? 'PM' : 'AM'
                    const h12 = hour % 12 || 12
                    return (
                      <div key={h.hour} className="flex flex-col items-center gap-1 min-w-[44px] py-1">
                        <span className="text-[9px] opacity-35">{h12}{ampm}</span>
                        <div className="opacity-50">
                          <WeatherIcon type={hInfo.icon} size={14} />
                        </div>
                        <span className="text-[10px] font-medium opacity-70">{t(h.temp)}°</span>
                        {h.precipProb > 0 && (
                          <span className="text-[8px] opacity-30">{h.precipProb}%</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Historical year breakdown */}
            {data.yearData?.length > 0 && (
              <div className="mx-6 mt-3 rounded-xl bg-white/5 border border-white/5 p-4">
                <p className="text-[9px] font-semibold tracking-wider uppercase opacity-30 mb-3">Past Years</p>
                <div className="space-y-2">
                  {data.yearData.map((yr) => {
                    const yInfo = WEATHER_CODES[yr.code] || { icon: 'sun', label: '' }
                    return (
                      <div key={yr.year} className="flex items-center justify-between">
                        <span className="text-xs opacity-40">{yr.year}</span>
                        <div className="flex items-center gap-2">
                          <div className="opacity-40"><WeatherIcon type={yInfo.icon} size={12} /></div>
                          <span className="text-xs font-medium opacity-60">
                            {t(yr.high)}° / {t(yr.low)}{unit}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="p-4" />
          </>
        )}
      </div>
    </div>
  )
}

/* ── Photon geocoder for city search ── */
async function searchCities(query) {
  if (!query || query.length < 2) return []
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`
    )
    if (!res.ok) return []
    const data = await res.json()
    const validTypes = new Set([
      'city', 'town', 'village', 'locality', 'state', 'country', 'island', 'region',
    ])
    return data.features
      .filter((f) => validTypes.has(f.properties.type))
      .map((f) => {
        const p = f.properties
        const parts = [p.state, p.country].filter(Boolean)
        return { name: p.name, detail: parts.join(', '), key: `${p.osm_id}-${p.type}` }
      })
      .filter((v, i, a) => a.findIndex((x) => x.name === v.name && x.detail === v.detail) === i)
  } catch {
    return []
  }
}

/* ── Inline Day Location Picker ── */
function DayLocationPicker({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const wrapperRef = useRef(null)

  useEffect(() => {
    if (!editing) return
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setEditing(false)
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [editing])

  useEffect(() => {
    if (input.length < 2) { setSuggestions([]); return }
    setSearching(true)
    const timer = setTimeout(async () => {
      const results = await searchCities(input)
      setSuggestions(results)
      setSearching(false)
    }, 300)
    return () => { clearTimeout(timer); setSearching(false) }
  }, [input])

  function selectCity(name) {
    onSave(name)
    setEditing(false)
    setInput('')
    setSuggestions([])
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setEditing(true); setInput(value || '') }}
        className="inline-flex items-center gap-1.5 mt-0.5 group"
      >
        {value ? (
          <>
            <svg width="13" height="13" viewBox="0 0 10 10" fill="none" className="text-[#1C3829]/35 flex-shrink-0">
              <path d="M5 1C3.34 1 2 2.34 2 4c0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4a1 1 0 110-2 1 1 0 010 2z" fill="currentColor"/>
            </svg>
            <span className="text-sm text-[#4A6356] group-hover:text-[#1C3829] transition-colors">{value}</span>
          </>
        ) : (
          <span className="text-xs text-[#1C3829]/25 italic group-hover:text-[#1C3829]/50 transition-colors">+ Add location</span>
        )}
      </button>
    )
  }

  return (
    <div ref={wrapperRef} className="relative inline-block ml-2">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && input.trim()) { e.preventDefault(); selectCity(input.trim()) }
            if (e.key === 'Escape') { setEditing(false); setSuggestions([]) }
          }}
          placeholder="City..."
          autoFocus
          className="w-36 border border-[#1C3829]/15 rounded-lg px-2.5 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20"
        />
        {searching && (
          <div className="w-3 h-3 border border-[#1C3829]/20 border-t-[#1C3829]/50 rounded-full animate-spin" />
        )}
        {value && (
          <button
            type="button"
            onClick={() => { onSave(''); setEditing(false) }}
            className="text-[10px] text-red-400 hover:text-red-600 transition-colors"
          >
            Clear
          </button>
        )}
      </div>
      {suggestions.length > 0 && (
        <div className="absolute z-50 left-0 mt-1 w-56 bg-white rounded-lg border border-[#1C3829]/10 shadow-lg overflow-hidden py-0.5">
          {suggestions.map((s) => (
            <button
              key={s.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectCity(s.name)}
              className="w-full text-left px-3 py-2 flex items-center gap-2 hover:bg-[#1C3829]/5 transition-colors"
            >
              <span className="text-xs text-[#1a2b20] font-medium">{s.name}</span>
              {s.detail && <span className="text-[10px] text-[#7A8F82]">{s.detail}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── AI Day Summary ── */
const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

function hashItems(items) {
  const str = items.map((i) => `${i.type}|${i.title}|${i.start_time}|${i.end_time}|${i.location}`).sort().join(';;')
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0
  }
  return String(h)
}

async function generateDaySummary(dayItems, location, dateStr) {
  if (!ANTHROPIC_KEY || dayItems.length === 0) return null

  const itemDescriptions = dayItems.map((item) => {
    const time = item.start_time ? formatTime(item.start_time) : ''
    const endTime = item.end_time ? ` - ${formatTime(item.end_time)}` : ''
    return `- ${item.type}: ${item.title}${time ? ` at ${time}${endTime}` : ''}${item.location ? ` (${item.location})` : ''}`
  }).join('\n')

  const d = new Date(dateStr + 'T00:00:00')
  const dayLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  try {
    const res = await fetch('/api/claude/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role: 'user',
          content: `Write a 1-2 sentence factual summary of this travel day. Be direct and informative — state what's happening and when. No flowery language, no poetry, no metaphors. Just the key facts in plain English. No emojis.

Day: ${dayLabel}
Location: ${location || 'Unknown'}
Plans:
${itemDescriptions}

Summary:`,
        }],
      }),
    })

    if (!res.ok) return null
    const data = await res.json()
    return data.content?.[0]?.text?.trim() || null
  } catch {
    return null
  }
}

function DaySummary({ items, location, dateStr, tripId, cachedSummaries, onSummaryGenerated }) {
  const [summary, setSummary] = useState(null)
  const [generating, setGenerating] = useState(false)
  const fetchedRef = useRef('')

  const dayItems = items.filter((i) => !i._checkoutMarker && i.type !== 'hotel')

  useEffect(() => {
    if (dayItems.length === 0) { setSummary(null); return }

    const currentHash = hashItems(dayItems)
    const key = dateStr
    const cached = cachedSummaries?.[key]

    // Use cache if hash matches
    if (cached && cached.hash === currentHash) {
      setSummary(cached.summary)
      return
    }

    // Prevent duplicate fetches
    const fetchKey = `${dateStr}|${currentHash}`
    if (fetchedRef.current === fetchKey) return
    fetchedRef.current = fetchKey

    // Generate new summary
    setGenerating(true)
    generateDaySummary(dayItems, location, dateStr).then((text) => {
      if (text) {
        setSummary(text)
        // Cache it
        const updated = { ...cachedSummaries, [key]: { summary: text, hash: currentHash } }
        onSummaryGenerated(updated)
      }
      setGenerating(false)
    })
  }, [dayItems.length, dateStr])

  if (dayItems.length === 0) return null

  if (generating) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 border border-[#1C3829]/15 border-t-[#1C3829]/40 rounded-full animate-spin" />
        <span className="text-[10px] text-[#1C3829]/25 italic">Generating...</span>
      </div>
    )
  }

  if (!summary) return null

  return (
    <p className="text-xs text-[#4A6356] leading-relaxed">
      {summary}
    </p>
  )
}

/* ── Editable Day Notes ── */
function DayNotes({ value, onSave }) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(value || '')
  const textareaRef = useRef(null)

  useEffect(() => { setText(value || '') }, [value])

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px'
    }
  }, [editing])

  function handleBlur() {
    setEditing(false)
    if (text.trim() !== (value || '')) {
      onSave(text.trim())
    }
  }

  if (editing) {
    return (
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          e.target.style.height = 'auto'
          e.target.style.height = e.target.scrollHeight + 'px'
        }}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === 'Escape') handleBlur() }}
        className="w-full text-xs text-[#1a2b20] bg-transparent border-none outline-none resize-none leading-relaxed placeholder:text-[#1C3829]/20"
        placeholder="Add notes for this day..."
        rows={2}
      />
    )
  }

  if (!value) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="text-[10px] text-[#1C3829]/20 italic hover:text-[#1C3829]/40 transition-colors"
      >
        + Add notes
      </button>
    )
  }

  return (
    <p
      onClick={() => setEditing(true)}
      className="text-xs text-[#1a2b20]/70 leading-relaxed cursor-text whitespace-pre-line hover:text-[#1a2b20] transition-colors"
    >
      {value}
    </p>
  )
}

/* ── Custom Time Picker — single scrollable list ── */
const TIME_SLOTS = (() => {
  const slots = []
  for (let h = 0; h < 24; h++) {
    for (const m of ['00', '15', '30', '45']) {
      const h12 = h % 12 || 12
      const ampm = h >= 12 ? 'PM' : 'AM'
      slots.push({
        value: `${String(h).padStart(2, '0')}:${m}`,
        label: `${h12}:${m} ${ampm}`,
      })
    }
  }
  return slots
})()

function TimePicker({ value, onChange, label }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const listRef = useRef(null)

  const displayText = value
    ? TIME_SLOTS.find((s) => s.value === value)?.label || value
    : null

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Auto-scroll to selected or nearest time on open
  useEffect(() => {
    if (!open || !listRef.current) return
    const target = value || '09:00'
    const idx = TIME_SLOTS.findIndex((s) => s.value >= target)
    if (idx >= 0) {
      const el = listRef.current.children[idx]
      if (el) el.scrollIntoView({ block: 'center' })
    }
  }, [open, value])

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-[#1a2b20] mb-1">{label}</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 text-left flex items-center justify-between"
      >
        {displayText ? (
          <span className="text-[#1a2b20]">{displayText}</span>
        ) : (
          <span className="text-[#1C3829]/30">Set time</span>
        )}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#1C3829]/30 flex-shrink-0">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M7 4v3l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-white rounded-xl border border-[#1C3829]/10 shadow-xl shadow-[#1C3829]/10 overflow-hidden">
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full text-center py-2 text-[10px] text-[#1C3829]/30 hover:text-[#1C3829] hover:bg-[#1C3829]/3 transition-colors border-b border-[#1C3829]/5"
            >
              Clear
            </button>
          )}
          <div ref={listRef} className="max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {TIME_SLOTS.map((slot) => {
              const isSelected = value === slot.value
              const isHour = slot.value.endsWith(':00')
              return (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => { onChange(slot.value); setOpen(false) }}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    isSelected
                      ? 'bg-[#1C3829] text-[#F5EFE0] font-semibold'
                      : isHour
                        ? 'text-[#1a2b20] font-medium hover:bg-[#1C3829]/5'
                        : 'text-[#1a2b20]/60 hover:bg-[#1C3829]/5'
                  }`}
                >
                  {slot.label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── File attachment helpers ── */
async function uploadAttachment(file, itemId, userId) {
  const ext = file.name.split('.').pop()
  const path = `${userId}/${itemId}/${Date.now()}.${ext}`

  const { error: uploadErr } = await supabase.storage
    .from('attachments')
    .upload(path, file)
  if (uploadErr) throw uploadErr

  const { data: { publicUrl } } = supabase.storage
    .from('attachments')
    .getPublicUrl(path)

  const { error: dbErr } = await supabase.from('attachments').insert({
    item_id: itemId,
    file_name: file.name,
    file_url: publicUrl,
    file_type: file.type,
    file_size: file.size,
    uploaded_by: userId,
  })
  if (dbErr) throw dbErr

  return { file_name: file.name, file_url: publicUrl, file_type: file.type, file_size: file.size }
}

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(fileType) {
  if (!fileType) return 'doc'
  if (fileType.startsWith('image/')) return 'img'
  if (fileType === 'application/pdf') return 'pdf'
  return 'doc'
}

/* ── Listing link metadata extraction (Airbnb, Booking, VRBO, etc.) ── */
async function fetchListingMeta(url) {
  if (!url) return null
  try {
    // Use allorigins proxy to bypass CORS
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
    const res = await fetch(proxyUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    })
    if (!res.ok) return null
    const html = await res.text()

    // Parse OG meta tags from HTML
    const get = (prop) => {
      const match = html.match(new RegExp(`<meta[^>]*property=["']${prop}["'][^>]*content=["']([^"']*)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${prop}["']`, 'i'))
      return match ? match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"') : null
    }
    const getName = (name) => {
      const match = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'))
      return match ? match[1].replace(/&amp;/g, '&').replace(/&quot;/g, '"') : null
    }

    const ogTitle = get('og:title')
    const ogDesc = get('og:description')
    const ogImage = get('og:image')
    const metaDesc = getName('description')

    // Try JSON-LD structured data first (most reliable for Airbnb)
    let ldName = null
    let ldDesc = null
    let ldImage = null
    const ldMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)
    if (ldMatch) {
      try {
        const ld = JSON.parse(ldMatch[1])
        ldName = ld.name || null
        ldDesc = ld.description || null
        if (Array.isArray(ld.image) && ld.image.length) ldImage = ld.image[0]
        else if (typeof ld.image === 'string') ldImage = ld.image
      } catch {}
    }

    // Also try listingTitle from embedded JSON
    if (!ldName) {
      const ltMatch = html.match(/"listingTitle":"([^"]+)"/)
      if (ltMatch) ldName = ltMatch[1]
    }

    if (!ogTitle && !ogDesc && !ldName) return null

    let propertyName = ''
    let location = ''
    let rating = null
    let details = ''
    let platform = 'Listing'

    if (url.includes('airbnb')) {
      platform = 'Airbnb'

      // Property name: JSON-LD is most reliable, then og:description, then parse from page
      propertyName = ldName || ''
      if (!propertyName || propertyName.toLowerCase().includes('airbnb')) {
        propertyName = ogDesc || ''
      }
      if (!propertyName || propertyName.toLowerCase().includes('airbnb')) {
        const quotedMatch = (metaDesc || '').match(/"([^"]+)"/)
        if (quotedMatch) propertyName = quotedMatch[1]
      }
      if (!propertyName || propertyName.toLowerCase().includes('airbnb')) {
        propertyName = 'Airbnb Rental'
      }

      // Try to get location + rating + details from og:title if it has the listing format
      const ogParts = (ogTitle || '').split(' · ')
      if (ogParts.length > 1 && ogParts[0].includes(' in ')) {
        const locMatch = ogParts[0].match(/in\s+(.+)$/i)
        if (locMatch) location = locMatch[1]
        const ratingPart = ogParts.find((p) => p.includes('★'))
        if (ratingPart) {
          const r = ratingPart.match(/★?([\d.]+)/)
          if (r) rating = r[1]
        }
        details = ogParts.filter((p) => !p.includes('★') && p !== ogParts[0]).join(' · ')
      } else {
        // og:title is generic — try parsing location from the name
        const nameLocMatch = propertyName.match(/in\s+(\w[\w\s]+)/)
        if (nameLocMatch) location = nameLocMatch[1].trim()
      }
    } else if (url.includes('booking.com')) {
      platform = 'Booking.com'
      propertyName = ogTitle || ogDesc || 'Booking.com Property'
    } else if (url.includes('vrbo') || url.includes('homeaway')) {
      platform = 'VRBO'
      propertyName = ogTitle || ogDesc || 'VRBO Rental'
    } else if (url.includes('hotels.com')) {
      platform = 'Hotels.com'
      propertyName = ogTitle || ogDesc || 'Hotel'
    } else {
      propertyName = ogTitle || ogDesc || 'Lodging'
    }

    return {
      name: propertyName,
      ogTitle: ogTitle || '',
      location,
      rating,
      details,
      image: ogImage,
      description: metaDesc || '',
      url,
      platform,
    }
  } catch {
    return null
  }
}

/* ── Foursquare restaurant search ── */
async function searchRestaurants(query, cityName) {
  if (!FOURSQUARE_KEY) return []
  const searchTerm = query || 'restaurant'

  // Geocode the city to lat/lng for accurate results (Foursquare's `near` is unreliable for small cities)
  let llParam = ''
  if (cityName) {
    const coords = await geocodeCity(cityName)
    if (coords) {
      llParam = `&ll=${coords.lat},${coords.lon}&radius=15000`
    }
  }

  try {
    const url = `/api/foursquare/places/search?query=${encodeURIComponent(searchTerm)}${llParam}&limit=8`
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${FOURSQUARE_KEY}`,
        'X-Places-Api-Version': '2025-06-17',
        Accept: 'application/json',
      },
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || []).map((p) => ({
      id: p.fsq_place_id,
      name: p.name,
      address: p.location?.formatted_address || [p.location?.address, p.location?.locality].filter(Boolean).join(', '),
      city: p.location?.locality || '',
      cuisine: p.categories?.[0]?.short_name || p.categories?.[0]?.name || '',
      phone: p.tel || '',
      website: p.website || '',
    }))
  } catch {
    return []
  }
}

/* ── Foursquare lodging search (new Places API) ── */
async function searchLodging(query) {
  if (!FOURSQUARE_KEY || !query || query.length < 3) return []
  try {
    const res = await fetch(
      `/api/foursquare/places/search?query=${encodeURIComponent(query)}&limit=6`,
      {
        headers: {
          Authorization: `Bearer ${FOURSQUARE_KEY}`,
          'X-Places-Api-Version': '2025-06-17',
          Accept: 'application/json',
        },
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.results || [])
      .filter((p) => {
        const cats = (p.categories || []).map((c) => c.name.toLowerCase())
        return cats.some((c) => ['hotel', 'hostel', 'resort', 'motel', 'bed & breakfast', 'inn', 'lodge', 'vacation rental', 'lodging'].some((k) => c.includes(k)))
          || query.toLowerCase().includes('hotel')
          || query.toLowerCase().includes('resort')
          || query.toLowerCase().includes('hostel')
      })
      .map((p) => ({
        id: p.fsq_place_id,
        name: p.name,
        address: p.location?.formatted_address || [p.location?.address, p.location?.locality].filter(Boolean).join(', '),
        city: p.location?.locality || '',
        country: p.location?.country || '',
        category: p.categories?.[0]?.name || 'Lodging',
        phone: p.tel || '',
        website: p.website || '',
        email: p.email || '',
      }))
  } catch {
    return []
  }
}

/* ── Flight lookup via AeroDataBox ── */
async function fetchFlightRaw(flightNumber, date) {
  if (!RAPIDAPI_KEY || !flightNumber || !date) return null
  const num = flightNumber.replace(/\s+/g, '').toUpperCase()
  try {
    const res = await fetch(
      `https://aerodatabox.p.rapidapi.com/flights/number/${num}/${date}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': 'aerodatabox.p.rapidapi.com',
        },
      }
    )
    if (!res.ok) return null
    const data = await res.json()
    if (!Array.isArray(data) || data.length === 0) return null
    return data.find((f) => {
      const depLocal = f.departure?.scheduledTime?.local
      return depLocal && depLocal.startsWith(date)
    }) || data[0]
  } catch {
    return null
  }
}

async function lookupFlight(flightNumber, date) {
  const raw = await fetchFlightRaw(flightNumber, date)
  return raw ? parseFlight(raw) : null
}

function parseFlight(f) {
  const dep = f.departure || {}
  const arr = f.arrival || {}
  const depAirport = dep.airport || {}
  const arrAirport = arr.airport || {}

  const depTime = dep.scheduledTime?.local?.slice(11, 16) || null
  const arrTime = arr.scheduledTime?.local?.slice(11, 16) || null
  const depDate = dep.scheduledTime?.local?.slice(0, 10) || null
  const revisedDep = dep.revisedTime?.local?.slice(11, 16) || null
  const revisedArr = arr.revisedTime?.local?.slice(11, 16) || null

  const status = f.status || 'Unknown'
  const airline = f.airline?.name || ''
  const aircraft = f.aircraft?.model || ''
  const flightNum = f.number || ''

  const title = `${depAirport.iata || '?'} → ${arrAirport.iata || '?'}`
  const subtitle = `${airline} ${flightNum}`.trim()

  const details = [
    `Flight: ${flightNum.replace(/\s/g, '')}`,
    aircraft && `Aircraft: ${aircraft}`,
    dep.terminal && `Dep Terminal: ${dep.terminal}`,
    arr.terminal && `Arr Terminal: ${arr.terminal}`,
    dep.gate && `Gate: ${dep.gate}`,
    status && `Status: ${status}`,
    revisedDep && revisedDep !== depTime && `Revised departure: ${revisedDep}`,
    revisedArr && revisedArr !== arrTime && `Revised arrival: ${revisedArr}`,
  ].filter(Boolean).join('\n')

  return {
    title,
    subtitle,
    location: `${depAirport.name || depAirport.iata || ''} → ${arrAirport.name || arrAirport.iata || ''}`,
    date: depDate,
    startTime: depTime,
    endTime: arrTime,
    description: `${subtitle}\n${details}`,
    status,
    depCity: depAirport.municipalityName || '',
    arrCity: arrAirport.municipalityName || '',
    airline,
    aircraft,
    depTerminal: dep.terminal || '',
    arrTerminal: arr.terminal || '',
  }
}

/* ── Extract flight number from stored description ── */
function extractFlightNum(description) {
  if (!description) return null
  // Try "Flight: AA100" format first
  const explicit = description.match(/Flight:\s*([A-Z]{2}\d{1,5})/i)
  if (explicit) return explicit[1]
  // Fallback: extract from first line like "American Airlines AA 100"
  const firstLine = description.split('\n')[0] || ''
  const match = firstLine.match(/\b([A-Z]{2})\s*(\d{1,5})\b/)
  return match ? match[1] + match[2] : null
}

/* ── Format local time string from API ── */
function fmtLocalTime(timeObj) {
  if (!timeObj?.local) return null
  return timeObj.local.slice(11, 16)
}
function fmtLocalDate(timeObj) {
  if (!timeObj?.local) return null
  const d = new Date(timeObj.local)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

/* ── Flight Detail Modal ── */
function FlightDetailModal({ open, onClose, item }) {
  const [flight, setFlight] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !item) return
    setLoading(true)
    setError('')
    setFlight(null)

    const flightNum = extractFlightNum(item.description)
    const date = item.date

    if (!flightNum || !date) {
      setError('Could not determine flight number')
      setLoading(false)
      return
    }

    fetchFlightRaw(flightNum, date).then((raw) => {
      if (!raw) {
        setError('Flight data unavailable')
      } else {
        setFlight(raw)
      }
      setLoading(false)
    })
  }, [open, item])

  if (!open) return null

  const dep = flight?.departure || {}
  const arr = flight?.arrival || {}
  const depAirport = dep.airport || {}
  const arrAirport = arr.airport || {}
  const dist = flight?.greatCircleDistance || {}
  const ac = flight?.aircraft || {}
  const al = flight?.airline || {}
  const status = flight?.status || ''

  const statusColor =
    status === 'Landed' ? 'bg-green-500/15 text-green-600 border-green-500/20' :
    status === 'EnRoute' ? 'bg-blue-500/15 text-blue-600 border-blue-500/20' :
    status === 'Cancelled' ? 'bg-red-500/15 text-red-600 border-red-500/20' :
    status === 'Delayed' ? 'bg-amber-500/15 text-amber-700 border-amber-500/20' :
    'bg-[#1C3829]/5 text-[#1C3829]/60 border-[#1C3829]/10'

  // Check if times differ (delay / ahead of schedule)
  const depScheduled = fmtLocalTime(dep.scheduledTime)
  const depRevised = fmtLocalTime(dep.revisedTime)
  const depRunway = fmtLocalTime(dep.runwayTime)
  const arrScheduled = fmtLocalTime(arr.scheduledTime)
  const arrRevised = fmtLocalTime(arr.revisedTime)
  const arrPredicted = fmtLocalTime(arr.predictedTime)
  const arrRunway = fmtLocalTime(arr.runwayTime)

  const depActual = depRunway || depRevised
  const arrActual = arrRunway || arrPredicted || arrRevised
  const depChanged = depActual && depActual !== depScheduled
  const arrChanged = arrActual && arrActual !== arrScheduled

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1C3829] rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto text-[#F5EFE0]">

        {loading && (
          <div className="p-16 text-center">
            <div className="w-6 h-6 border-2 border-[#F5EFE0]/20 border-t-[#F5EFE0]/60 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs opacity-40">Loading flight data...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-12 text-center">
            <p className="text-sm opacity-50 mb-4">{error}</p>
            <button onClick={onClose} className="text-xs opacity-40 hover:opacity-70 transition-opacity">Close</button>
          </div>
        )}

        {flight && !loading && (
          <>
            {/* Header */}
            <div className="p-6 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ICONS.flight size={18} />
                <div>
                  <p className="text-sm font-semibold">{al.name} {flight.number}</p>
                  {flight.callSign && <p className="text-[10px] opacity-30">Callsign: {flight.callSign}</p>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${statusColor}`}>
                  {status}
                </span>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-[#F5EFE0]/40 hover:text-[#F5EFE0] transition-colors text-lg"
                >
                  &times;
                </button>
              </div>
            </div>

            {/* Route visualization */}
            <div className="px-6 py-8">
              <div className="flex items-start justify-between">
                <div className="text-center flex-1">
                  <p
                    className="text-4xl font-bold tracking-tight"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {depAirport.iata}
                  </p>
                  <p className="text-xs opacity-60 mt-1">{depAirport.municipalityName}</p>
                  <p className="text-[10px] opacity-30 mt-0.5">{depAirport.name}</p>
                  {dep.terminal && <p className="text-[10px] opacity-40 mt-1">Terminal {dep.terminal}</p>}
                  {dep.gate && <p className="text-[10px] opacity-40">Gate {dep.gate}</p>}
                </div>

                <div className="flex-1 flex flex-col items-center pt-2">
                  <div className="flex items-center w-full px-2">
                    <div className="w-2 h-2 rounded-full bg-[#F5EFE0]/40" />
                    <div className="flex-1 border-t border-dashed border-[#F5EFE0]/15 mx-1" />
                    <span className="text-xs opacity-25 mx-1">✈</span>
                    <div className="flex-1 border-t border-dashed border-[#F5EFE0]/15 mx-1" />
                    <div className="w-2 h-2 rounded-full bg-[#F5EFE0]/60" />
                  </div>
                  {dist.mile && (
                    <p className="text-[10px] opacity-25 mt-2">
                      {Math.round(dist.mile).toLocaleString()} mi · {Math.round(dist.km).toLocaleString()} km
                    </p>
                  )}
                </div>

                <div className="text-center flex-1">
                  <p
                    className="text-4xl font-bold tracking-tight"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {arrAirport.iata}
                  </p>
                  <p className="text-xs opacity-60 mt-1">{arrAirport.municipalityName}</p>
                  <p className="text-[10px] opacity-30 mt-0.5">{arrAirport.name}</p>
                  {arr.terminal && <p className="text-[10px] opacity-40 mt-1">Terminal {arr.terminal}</p>}
                  {arr.gate && <p className="text-[10px] opacity-40">Gate {arr.gate}</p>}
                </div>
              </div>
            </div>

            {/* Times */}
            <div className="mx-6 rounded-xl bg-white/5 border border-white/5">
              <div className="grid grid-cols-2 divide-x divide-white/5">
                {/* Departure times */}
                <div className="p-4">
                  <p className="text-[9px] font-semibold tracking-wider uppercase opacity-30 mb-3">Departure</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] opacity-40">Scheduled</span>
                      <span className={`text-sm font-medium ${depChanged ? 'line-through opacity-30' : 'opacity-80'}`}>
                        {depScheduled && formatTime(depScheduled)}
                      </span>
                    </div>
                    {depRevised && depRevised !== depScheduled && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] opacity-40">Revised</span>
                        <span className="text-sm font-medium text-amber-300">{formatTime(depRevised)}</span>
                      </div>
                    )}
                    {depRunway && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] opacity-40">Actual</span>
                        <span className="text-sm font-medium text-green-300">{formatTime(depRunway)}</span>
                      </div>
                    )}
                    {dep.scheduledTime && (
                      <p className="text-[10px] opacity-25 mt-1">{fmtLocalDate(dep.scheduledTime)}</p>
                    )}
                  </div>
                </div>

                {/* Arrival times */}
                <div className="p-4">
                  <p className="text-[9px] font-semibold tracking-wider uppercase opacity-30 mb-3">Arrival</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] opacity-40">Scheduled</span>
                      <span className={`text-sm font-medium ${arrChanged ? 'line-through opacity-30' : 'opacity-80'}`}>
                        {arrScheduled && formatTime(arrScheduled)}
                      </span>
                    </div>
                    {arrRevised && arrRevised !== arrScheduled && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] opacity-40">Revised</span>
                        <span className="text-sm font-medium text-amber-300">{formatTime(arrRevised)}</span>
                      </div>
                    )}
                    {arrPredicted && arrPredicted !== arrScheduled && !arrRunway && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] opacity-40">Predicted</span>
                        <span className="text-sm font-medium text-blue-300">{formatTime(arrPredicted)}</span>
                      </div>
                    )}
                    {arrRunway && (
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] opacity-40">Actual</span>
                        <span className="text-sm font-medium text-green-300">{formatTime(arrRunway)}</span>
                      </div>
                    )}
                    {arr.scheduledTime && (
                      <p className="text-[10px] opacity-25 mt-1">{fmtLocalDate(arr.scheduledTime)}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Aircraft & details */}
            <div className="mx-6 mt-3 rounded-xl bg-white/5 border border-white/5 p-4">
              <p className="text-[9px] font-semibold tracking-wider uppercase opacity-30 mb-3">Aircraft & Details</p>
              <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
                {ac.model && (
                  <div>
                    <p className="text-[10px] opacity-30">Aircraft</p>
                    <p className="text-xs font-medium opacity-70">{ac.model}</p>
                  </div>
                )}
                {ac.reg && (
                  <div>
                    <p className="text-[10px] opacity-30">Registration</p>
                    <p className="text-xs font-medium opacity-70">{ac.reg}</p>
                  </div>
                )}
                {depAirport.countryCode && (
                  <div>
                    <p className="text-[10px] opacity-30">Origin</p>
                    <p className="text-xs font-medium opacity-70">{depAirport.countryCode}</p>
                  </div>
                )}
                {arrAirport.countryCode && (
                  <div>
                    <p className="text-[10px] opacity-30">Destination</p>
                    <p className="text-xs font-medium opacity-70">{arrAirport.countryCode}</p>
                  </div>
                )}
                {depAirport.timeZone && (
                  <div>
                    <p className="text-[10px] opacity-30">Dep Timezone</p>
                    <p className="text-xs font-medium opacity-70">{depAirport.timeZone.split('/').pop().replace('_', ' ')}</p>
                  </div>
                )}
                {arrAirport.timeZone && (
                  <div>
                    <p className="text-[10px] opacity-30">Arr Timezone</p>
                    <p className="text-xs font-medium opacity-70">{arrAirport.timeZone.split('/').pop().replace('_', ' ')}</p>
                  </div>
                )}
                {flight.codeshareStatus && (
                  <div>
                    <p className="text-[10px] opacity-30">Codeshare</p>
                    <p className="text-xs font-medium opacity-70">{flight.codeshareStatus === 'IsOperator' ? 'Operating carrier' : flight.codeshareStatus}</p>
                  </div>
                )}
                {al.icao && (
                  <div>
                    <p className="text-[10px] opacity-30">ICAO</p>
                    <p className="text-xs font-medium opacity-70">{al.icao}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Last updated */}
            <div className="px-6 py-4 text-center">
              {flight.lastUpdatedUtc && (
                <p className="text-[10px] opacity-20">
                  Last updated: {new Date(flight.lastUpdatedUtc).toLocaleString('en-US', {
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
                  })}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return null
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
  })
}

function formatTime(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':')
  const hr = parseInt(h)
  const ampm = hr >= 12 ? 'PM' : 'AM'
  return `${hr % 12 || 12}:${m} ${ampm}`
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase()
}

function formatDateRange(start, end) {
  const opts = { month: 'short', day: 'numeric' }
  const yearOpts = { ...opts, year: 'numeric' }
  if (!start && !end) return 'Dates not set'
  if (start && !end) return `From ${new Date(start + 'T00:00:00').toLocaleDateString('en-US', yearOpts)}`
  if (!start && end) return `Until ${new Date(end + 'T00:00:00').toLocaleDateString('en-US', yearOpts)}`
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', yearOpts)}`
  }
  return `${s.toLocaleDateString('en-US', yearOpts)} – ${e.toLocaleDateString('en-US', yearOpts)}`
}

/* ── Get all dates between start and end ── */
function getDateRange(startStr, endStr) {
  if (!startStr || !endStr) return []
  const dates = []
  const curr = new Date(startStr + 'T00:00:00')
  const end = new Date(endStr + 'T00:00:00')
  while (curr <= end) {
    dates.push(curr.toISOString().split('T')[0])
    curr.setDate(curr.getDate() + 1)
  }
  return dates
}

/* ── Add Item Modal ── */
/* ── Edit Trip Modal ── */
function EditTripModal({ open, onClose, onSaved, trip }) {
  const [name, setName] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Destination tags state
  const [destTags, setDestTags] = useState([])
  const [destInput, setDestInput] = useState('')
  const [destSuggestions, setDestSuggestions] = useState([])
  const [destSearching, setDestSearching] = useState(false)
  const [destActiveIdx, setDestActiveIdx] = useState(-1)
  const [showDestDropdown, setShowDestDropdown] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)
  const [dropIdx, setDropIdx] = useState(null)
  const destInputRef = useRef(null)
  const destWrapperRef = useRef(null)

  useEffect(() => {
    if (open && trip) {
      setName(trip.name || '')
      setDestTags(trip.destination ? trip.destination.split(' → ') : [])
      setStartDate(trip.start_date || '')
      setEndDate(trip.end_date || '')
      setDestination(trip.destination || '')
      setError('')
    }
  }, [open, trip])

  // Debounced city search
  useEffect(() => {
    if (destInput.length < 2) { setDestSuggestions([]); setShowDestDropdown(false); return }
    setDestSearching(true)
    const timer = setTimeout(async () => {
      const results = await searchCities(destInput)
      setDestSuggestions(results)
      setShowDestDropdown(results.length > 0)
      setDestActiveIdx(-1)
      setDestSearching(false)
    }, 300)
    return () => { clearTimeout(timer); setDestSearching(false) }
  }, [destInput])

  useEffect(() => {
    function handleClick(e) {
      if (destWrapperRef.current && !destWrapperRef.current.contains(e.target)) setShowDestDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function addDestCity(cityName) {
    if (cityName) setDestTags((prev) => [...prev, cityName])
    setDestInput('')
    setShowDestDropdown(false)
    setDestActiveIdx(-1)
    destInputRef.current?.focus()
  }

  function handleDestKeyDown(e) {
    if (showDestDropdown && destSuggestions.length > 0) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setDestActiveIdx((i) => (i < destSuggestions.length - 1 ? i + 1 : 0)); return }
      if (e.key === 'ArrowUp') { e.preventDefault(); setDestActiveIdx((i) => (i > 0 ? i - 1 : destSuggestions.length - 1)); return }
      if (e.key === 'Enter' && destActiveIdx >= 0) { e.preventDefault(); addDestCity(destSuggestions[destActiveIdx].name); return }
      if (e.key === 'Escape') { setShowDestDropdown(false); return }
    }
    if (e.key === 'Enter' && destInput.trim()) { e.preventDefault(); addDestCity(destInput.trim()) }
    if (e.key === 'Backspace' && !destInput && destTags.length) setDestTags((prev) => prev.slice(0, -1))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const destinationStr = destTags.join(' → ') || null
    const { error } = await supabase.from('trips').update({
      name,
      destination: destinationStr,
      start_date: startDate || null,
      end_date: endDate || null,
    }).eq('id', trip.id)

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setLoading(false)
      onSaved()
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this trip? This cannot be undone.')) return
    await supabase.from('trips').delete().eq('id', trip.id)
    onSaved('deleted')
  }

  if (!open || !trip) return null

  const inputClass =
    'w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#1C3829]/10 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1C3829]/8 flex items-center justify-between">
          <h3
            className="text-lg font-semibold text-[#1a2b20]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Edit trip
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-full hover:bg-[#1C3829]/5 flex items-center justify-center text-[#1C3829]/40 hover:text-[#1C3829] transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-1">Trip name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-1">
              Destinations
              <span className="font-normal text-[#1C3829]/40 ml-1">(press Enter after each city)</span>
            </label>
            <div ref={destWrapperRef} className="relative">
              <div className="flex flex-wrap items-center gap-1.5 border border-[#1C3829]/15 rounded-xl px-3 py-2.5 bg-[#F5EFE0]/50 focus-within:ring-2 focus-within:ring-[#1C3829]/30 focus-within:border-transparent min-h-[44px]">
                {destTags.map((tag, i) => (
                  <span key={tag + i} className="inline-flex items-center">
                    <span
                      draggable
                      onDragStart={(e) => { setDragIdx(i); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', '') }}
                      onDragOver={(e) => { e.preventDefault(); if (dragIdx !== null && i !== dragIdx) setDropIdx(i) }}
                      onDragLeave={() => setDropIdx(null)}
                      onDrop={(e) => { e.preventDefault(); if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDropIdx(null); return } const next = [...destTags]; const [moved] = next.splice(dragIdx, 1); next.splice(i, 0, moved); setDestTags(next); setDragIdx(null); setDropIdx(null) }}
                      onDragEnd={() => { setDragIdx(null); setDropIdx(null) }}
                      className={`inline-flex items-center gap-1 bg-[#1C3829] text-[#F5EFE0] text-xs font-medium pl-1.5 pr-1.5 py-1 rounded-full cursor-grab active:cursor-grabbing select-none transition-opacity ${dragIdx === i ? 'opacity-40' : ''}`}
                    >
                      <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold flex-shrink-0">{i + 1}</span>
                      <span className="px-0.5">{tag}</span>
                      <button type="button" onClick={() => setDestTags(destTags.filter((_, j) => j !== i))} className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center text-[#F5EFE0]/70 hover:text-[#F5EFE0] transition-colors">&times;</button>
                    </span>
                    {i < destTags.length - 1 && <span className="text-[#1C3829]/25 text-sm select-none mx-0.5">→</span>}
                  </span>
                ))}
                <input
                  ref={destInputRef}
                  type="text"
                  value={destInput}
                  onChange={(e) => setDestInput(e.target.value.replace(',', ''))}
                  onKeyDown={handleDestKeyDown}
                  onFocus={() => { if (destSuggestions.length > 0) setShowDestDropdown(true) }}
                  placeholder={destTags.length === 0 ? 'e.g. Paris' : 'Add city...'}
                  className="flex-1 min-w-[100px] text-sm bg-transparent outline-none placeholder:text-[#1C3829]/30"
                  autoComplete="off"
                />
                {destSearching && <div className="w-4 h-4 border-2 border-[#1C3829]/15 border-t-[#1C3829]/50 rounded-full animate-spin flex-shrink-0" />}
              </div>
              {showDestDropdown && (
                <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#1C3829]/10 shadow-lg shadow-[#1C3829]/8 overflow-hidden py-1">
                  {destSuggestions.map((s, i) => (
                    <button
                      key={s.key}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => addDestCity(s.name)}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors ${i === destActiveIdx ? 'bg-[#1C3829]/8' : 'hover:bg-[#1C3829]/5'}`}
                    >
                      <span className="text-sm text-[#1a2b20] font-medium">{s.name}</span>
                      {s.detail && <span className="text-xs text-[#7A8F82]">{s.detail}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#1a2b20] mb-1">Start date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2b20] mb-1">End date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate} className={inputClass} />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save changes'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            className="text-xs text-red-400 hover:text-red-600 transition-colors text-center py-1"
          >
            Delete trip
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Edit Item Modal ── */
function EditItemModal({ open, onClose, onSaved, item }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [link, setLink] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !item) return
    setTitle(item.title || '')
    setLocation(item.location || '')
    setDate(item.date || '')
    setStartTime(item.start_time || '')
    setEndTime(item.end_time || '')
    setError('')

    // Parse existing description to separate link from notes
    const lines = (item.description || '').split('\n')
    const linkLine = lines.find((l) => l.match(/^(Link|Website|https?:\/\/)/i))
    if (linkLine) {
      const url = linkLine.replace(/^(Link|Website):\s*/i, '').trim()
      setLink(url)
      setDescription(lines.filter((l) => l !== linkLine).join('\n'))
    } else {
      setLink('')
      setDescription(item.description || '')
    }
  }, [open, item])

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    // Rebuild description with link
    let finalDesc = description
    if (link.trim()) {
      const existingLines = (finalDesc || '').split('\n').filter((l) => !l.match(/^(Link|Website):\s*/i))
      // Check if description already has link-like fields (from auto-fill)
      const hasLinkField = existingLines.some((l) => l.startsWith('Link:') || l.startsWith('Website:'))
      if (!hasLinkField) {
        existingLines.push(`Link: ${link.trim()}`)
      }
      finalDesc = existingLines.join('\n')
    }

    const { error: err } = await supabase
      .from('itinerary_items')
      .update({
        title,
        description: finalDesc || null,
        location: location || null,
        date: date || null,
        start_time: startTime || null,
        end_time: endTime || null,
      })
      .eq('id', item.id)

    if (err) {
      setError(err.message)
      setSaving(false)
    } else {
      setSaving(false)
      onSaved()
    }
  }

  if (!open || !item) return null

  const inputClass =
    'w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent'

  const typeInfo = ITEM_TYPES.find((t) => t.value === item.type) || ITEM_TYPES[0]
  const Icon = ICONS[item.type]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#1C3829]/10 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1C3829]/8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {Icon && <div className="text-[#1C3829]/40"><Icon size={16} /></div>}
            <h3
              className="text-lg font-semibold text-[#1a2b20]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Edit {typeInfo.label}
            </h3>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-full hover:bg-[#1C3829]/5 flex items-center justify-center text-[#1C3829]/40 hover:text-[#1C3829] transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-1">Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Address or place name"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <TimePicker label="Start time" value={startTime} onChange={setStartTime} />
            <TimePicker label="End time" value={endTime} onChange={setEndTime} />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-1">
              Link
              <span className="font-normal text-[#1C3829]/30 ml-1">optional</span>
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-1">Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className={`${inputClass} resize-none`}
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </div>
    </div>
  )
}

function AddItemModal({ open, onClose, onCreated, tripId, userId, defaultDate, nearCity, tripDestination, allDayLocations }) {
  const [type, setType] = useState('activity')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [date, setDate] = useState(defaultDate || '')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Flight lookup state
  const [flightNumber, setFlightNumber] = useState('')
  const [flightDate, setFlightDate] = useState(defaultDate || '')
  const [flightData, setFlightData] = useState(null)
  const [flightSearching, setFlightSearching] = useState(false)
  const [flightError, setFlightError] = useState('')

  // Lodging state
  const [lodgingMode, setLodgingMode] = useState(null) // 'hotel' | 'airbnb'
  const [lodgingUrl, setLodgingUrl] = useState('')
  const [lodgingData, setLodgingData] = useState(null)
  const [lodgingSearching, setLodgingSearching] = useState(false)
  const [lodgingError, setLodgingError] = useState('')
  const [hotelQuery, setHotelQuery] = useState('')
  const [hotelResults, setHotelResults] = useState([])
  const [hotelSearching, setHotelSearching] = useState(false)
  const [checkIn, setCheckIn] = useState(defaultDate || '')
  const [checkOut, setCheckOut] = useState('')
  const [checkInTime, setCheckInTime] = useState('')
  const [checkOutTime, setCheckOutTime] = useState('')
  const [confirmationNum, setConfirmationNum] = useState('')

  // Dining state
  const [diningQuery, setDiningQuery] = useState('')
  const [diningResults, setDiningResults] = useState([])
  const [diningSearching, setDiningSearching] = useState(false)
  const [diningSelected, setDiningSelected] = useState(null)
  const [diningPopular, setDiningPopular] = useState([])
  const [diningPopularLoaded, setDiningPopularLoaded] = useState(false)

  // Transport state
  const [transportType, setTransportType] = useState('')
  const [locQuery, setLocQuery] = useState('')
  const [locSuggestions, setLocSuggestions] = useState([])
  const [locSearching, setLocSearching] = useState(false)
  const [showLocDropdown, setShowLocDropdown] = useState(false)
  const locRef = useRef(null)
  const [pendingFiles, setPendingFiles] = useState([])
  const fileInputRef = useRef(null)

  useEffect(() => {
    setDate(defaultDate || '')
    setFlightDate(defaultDate || '')
    setCheckIn(defaultDate || '')
  }, [defaultDate])

  // Reset state when switching types
  useEffect(() => {
    if (type !== 'flight') {
      setFlightData(null)
      setFlightNumber('')
      setFlightError('')
    }
    if (type !== 'transport') {
      setPendingFiles([])
      setTransportType('')
      setLocQuery('')
      setLocSuggestions([])
      setShowLocDropdown(false)
    }
    if (type !== 'restaurant') {
      setDiningResults([])
      setDiningQuery('')
      setDiningSelected(null)
      setDiningPopular([])
      setDiningPopularLoaded(false)
    }
    if (type !== 'hotel') {
      setLodgingMode(null)
      setLodgingData(null)
      setLodgingUrl('')
      setLodgingError('')
      setHotelQuery('')
      setHotelResults([])
      setCheckOut('')
      setCheckInTime('')
      setCheckOutTime('')
      setConfirmationNum('')
    }
  }, [type])

  async function handleFlightLookup() {
    if (!flightNumber.trim() || !flightDate) {
      setFlightError('Enter a flight number and date')
      return
    }
    setFlightError('')
    setFlightSearching(true)
    const data = await lookupFlight(flightNumber.trim(), flightDate)
    setFlightSearching(false)

    if (!data) {
      setFlightError('Flight not found. Check the number and date.')
      return
    }

    setFlightData(data)
    // Auto-fill the form fields
    setTitle(data.title)
    setLocation(data.location)
    setDate(data.date || flightDate)
    setStartTime(data.startTime || '')
    setEndTime(data.endTime || '')
    setDescription(data.description || '')
  }

  // Transport location autocomplete
  useEffect(() => {
    if (type !== 'transport' || locQuery.length < 2) { setLocSuggestions([]); setShowLocDropdown(false); return }
    setLocSearching(true)
    const timer = setTimeout(async () => {
      // Search Photon for POIs and places
      try {
        const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(locQuery)}&limit=5&lang=en`)
        if (res.ok) {
          const data = await res.json()
          const results = data.features.map((f) => {
            const p = f.properties
            const parts = [p.street, p.city || p.locality, p.state, p.country].filter(Boolean)
            return { name: p.name, detail: parts.join(', '), key: `${p.osm_id}` }
          }).filter((v, i, a) => a.findIndex((x) => x.name === v.name && x.detail === v.detail) === i)
          setLocSuggestions(results)
          setShowLocDropdown(results.length > 0)
        }
      } catch {}
      setLocSearching(false)
    }, 300)
    return () => { clearTimeout(timer); setLocSearching(false) }
  }, [locQuery, type])

  useEffect(() => {
    function handleClick(e) {
      if (locRef.current && !locRef.current.contains(e.target)) setShowLocDropdown(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  // Determine best city for dining context
  function getDiningCity() {
    // 1. City from the selected date
    if (date && allDayLocations?.[date]) return allDayLocations[date]
    // 2. City from the default date
    if (nearCity) return nearCity
    // 3. Most common day location
    if (allDayLocations) {
      const locs = Object.values(allDayLocations).filter(Boolean)
      if (locs.length > 0) {
        const counts = {}
        locs.forEach((l) => { counts[l] = (counts[l] || 0) + 1 })
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]
      }
    }
    // 4. First trip destination
    return tripDestination || ''
  }

  // Auto-load popular restaurants when dining is selected
  useEffect(() => {
    if (type !== 'restaurant' || diningPopularLoaded) return
    const city = getDiningCity()
    if (!city) return
    setDiningPopularLoaded(true)
    searchRestaurants('', city).then((results) => {
      setDiningPopular(results)
    })
  }, [type, nearCity, tripDestination, diningPopularLoaded, date])

  async function handleDiningSearch() {
    if (!diningQuery.trim()) return
    setDiningSearching(true)
    const city = getDiningCity()
    const results = await searchRestaurants(diningQuery.trim(), city)
    setDiningResults(results)
    setDiningSearching(false)
  }

  function selectDiningResult(r) {
    setDiningSelected(r)
    setTitle(r.name)
    setLocation(r.address)
    const parts = [
      r.website && `Website: ${r.website}`,
      r.cuisine && `Cuisine: ${r.cuisine}`,
      r.phone && `Phone: ${r.phone}`,
      r.id && `FoursquareID: ${r.id}`,
    ].filter(Boolean)
    setDescription(parts.join('\n'))
  }

  async function handleHotelSearch() {
    if (!hotelQuery.trim()) return
    setHotelSearching(true)
    const results = await searchLodging(hotelQuery.trim())
    setHotelResults(results)
    setHotelSearching(false)
  }

  function selectHotelResult(hotel) {
    setLodgingData({
      name: hotel.name,
      location: hotel.city || hotel.address,
      image: null,
      rating: null,
      details: hotel.category,
      url: hotel.website || '',
      platform: 'Hotel',
      address: hotel.address,
      phone: hotel.phone,
    })
    setTitle(hotel.name)
    setLocation(hotel.address || hotel.city)
    const parts = [
      hotel.website && `Link: ${hotel.website}`,
      `Platform: Hotel`,
      hotel.category && `Details: ${hotel.category}`,
      hotel.phone && `Phone: ${hotel.phone}`,
      hotel.email && `Email: ${hotel.email}`,
    ].filter(Boolean)
    setDescription(parts.join('\n'))
    setHotelResults([])
  }

  async function handleLodgingLookup() {
    if (!lodgingUrl.trim()) {
      setLodgingError('Paste a listing URL')
      return
    }
    if (!lodgingUrl.match(/^https?:\/\//)) {
      setLodgingError('Enter a valid URL starting with https://')
      return
    }
    setLodgingError('')
    setLodgingSearching(true)
    const data = await fetchListingMeta(lodgingUrl.trim())
    setLodgingSearching(false)

    if (!data) {
      setLodgingError('Could not fetch listing details. Check the URL.')
      return
    }

    setLodgingData(data)
    setTitle(data.name)
    setLocation(data.location)
    setDescription(
      [
        `Link: ${data.url}`,
        data.platform && `Platform: ${data.platform}`,
        data.rating && `Rating: ${data.rating}`,
        data.details && `Details: ${data.details}`,
        data.description && data.description.slice(0, 300),
      ].filter(Boolean).join('\n')
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Build description with type-specific metadata
    let finalDesc = description
    if (type === 'transport' && transportType) {
      finalDesc = `TransportType: ${transportType}\n${description || ''}`
    }
    if (type === 'hotel') {
      const parts = [description]
      if (checkOut) parts.push(`Check-out: ${checkOut}`)
      if (checkInTime) parts.push(`Check-in time: ${checkInTime}`)
      if (checkOutTime) parts.push(`Check-out time: ${checkOutTime}`)
      if (confirmationNum) parts.push(`Confirmation: ${confirmationNum}`)
      finalDesc = parts.filter(Boolean).join('\n')
    }

    const { data: inserted, error } = await supabase.from('itinerary_items').insert({
      trip_id: tripId,
      created_by: userId,
      type,
      title,
      description: finalDesc || null,
      location: location || null,
      date: type === 'hotel' ? (checkIn || date || null) : (date || null),
      start_time: type === 'hotel' ? (checkInTime || null) : (startTime || null),
      end_time: type === 'hotel' ? (checkOutTime || null) : (endTime || null),
    }).select().single()

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      // Upload pending files for transport items
      if (type === 'transport' && pendingFiles.length > 0 && inserted) {
        try {
          for (const file of pendingFiles) {
            await uploadAttachment(file, inserted.id, userId)
          }
        } catch (uploadErr) {
          console.error('File upload error:', uploadErr)
        }
      }

      setType('activity')
      setTitle('')
      setDescription('')
      setLocation('')
      setDate('')
      setStartTime('')
      setEndTime('')
      setFlightData(null)
      setFlightNumber('')
      setFlightDate('')
      setFlightError('')
      setLodgingData(null)
      setLodgingUrl('')
      setLodgingError('')
      setCheckIn('')
      setCheckOut('')
      setCheckInTime('')
      setCheckOutTime('')
      setConfirmationNum('')
      setPendingFiles([])
      setTransportType('')
      setDiningSelected(null)
      setDiningQuery('')
      setDiningResults([])
      setDiningPopular([])
      setDiningPopularLoaded(false)
      setLoading(false)
      onCreated()
    }
  }

  if (!open) return null

  const inputClass =
    'w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#1C3829]/10 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1C3829]/8 flex items-center justify-between">
          <h3
            className="text-lg font-semibold text-[#1a2b20]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Add to itinerary
          </h3>
          <button
            onClick={onClose}
            type="button"
            className="w-7 h-7 rounded-full hover:bg-[#1C3829]/5 flex items-center justify-center text-[#1C3829]/40 hover:text-[#1C3829] transition-colors text-lg"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          {/* Type selector */}
          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-2">Type</label>
            <div className="flex flex-wrap gap-1.5">
              {ITEM_TYPES.map((t) => {
                const Icon = ICONS[t.value]
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setType(t.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      type === t.value
                        ? 'bg-[#1C3829] text-[#F5EFE0]'
                        : 'bg-[#1C3829]/5 text-[#1C3829]/60 hover:bg-[#1C3829]/10'
                    }`}
                  >
                    <Icon size={14} />
                    {t.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Flight lookup section ── */}
          {type === 'flight' && !flightData && (
            <div className="bg-[#F5EFE0]/70 rounded-xl p-4 border border-[#1C3829]/8">
              <p className="text-xs font-medium text-[#1C3829]/50 mb-3 tracking-wide uppercase">Look up a flight</p>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-2">
                  <input
                    type="text"
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value.toUpperCase())}
                    placeholder="AA 100"
                    className={`${inputClass} bg-white`}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleFlightLookup() } }}
                  />
                </div>
                <div className="col-span-2">
                  <input
                    type="date"
                    value={flightDate}
                    onChange={(e) => setFlightDate(e.target.value)}
                    className={`${inputClass} bg-white`}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleFlightLookup}
                  disabled={flightSearching}
                  className="btn-primary rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {flightSearching ? (
                    <div className="w-4 h-4 border-2 border-[#F5EFE0]/30 border-t-[#F5EFE0] rounded-full animate-spin mx-auto" />
                  ) : (
                    'Find'
                  )}
                </button>
              </div>
              {flightError && (
                <p className="text-xs text-red-500 mt-2">{flightError}</p>
              )}
              <p className="text-[10px] text-[#1C3829]/30 mt-2">Enter flight number (e.g. AA100, BA287, DL47) and departure date</p>
            </div>
          )}

          {/* ── Flight result card ── */}
          {type === 'flight' && flightData && (
            <div className="bg-[#1C3829] rounded-xl p-5 text-[#F5EFE0]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <ICONS.flight size={14} className="opacity-70" />
                  <span className="text-xs font-medium opacity-70">{flightData.subtitle}</span>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  flightData.status === 'Landed' ? 'bg-green-500/20 text-green-300' :
                  flightData.status === 'EnRoute' ? 'bg-blue-500/20 text-blue-300' :
                  flightData.status === 'Cancelled' ? 'bg-red-500/20 text-red-300' :
                  flightData.status === 'Delayed' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-white/10 text-white/60'
                }`}>
                  {flightData.status}
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    {title.split(' → ')[0]}
                  </p>
                  <p className="text-[10px] opacity-50 mt-0.5">{flightData.depCity}</p>
                  {flightData.depTerminal && (
                    <p className="text-[10px] opacity-40 mt-0.5">Terminal {flightData.depTerminal}</p>
                  )}
                </div>
                <div className="flex-1 mx-4">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F5EFE0]/40" />
                    <div className="flex-1 border-t border-dashed border-[#F5EFE0]/20" />
                    <span className="text-[10px] opacity-30">✈</span>
                    <div className="flex-1 border-t border-dashed border-[#F5EFE0]/20" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#F5EFE0]/60" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
                    {title.split(' → ')[1]}
                  </p>
                  <p className="text-[10px] opacity-50 mt-0.5">{flightData.arrCity}</p>
                  {flightData.arrTerminal && (
                    <p className="text-[10px] opacity-40 mt-0.5">Terminal {flightData.arrTerminal}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs opacity-60">
                <span>{startTime && formatTime(startTime)} dep</span>
                {flightData.aircraft && <span>{flightData.aircraft}</span>}
                <span>{endTime && formatTime(endTime)} arr</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  setFlightData(null)
                  setTitle('')
                  setLocation('')
                  setDescription('')
                  setStartTime('')
                  setEndTime('')
                }}
                className="mt-3 text-[10px] text-[#F5EFE0]/30 hover:text-[#F5EFE0]/60 transition-colors"
              >
                Search a different flight
              </button>
            </div>
          )}

          {/* ── Lodging: choose path ── */}
          {type === 'hotel' && !lodgingMode && !lodgingData && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLodgingMode('hotel')}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border border-[#1C3829]/10 hover:border-[#1C3829]/25 hover:bg-[#1C3829]/3 transition-all"
              >
                <span className="text-2xl">🏨</span>
                <span className="text-sm font-semibold text-[#1a2b20]">Hotel</span>
                <span className="text-[10px] text-[#7A8F82] text-center">Search by name</span>
              </button>
              <button
                type="button"
                onClick={() => setLodgingMode('airbnb')}
                className="flex flex-col items-center gap-2 p-5 rounded-xl border border-[#1C3829]/10 hover:border-[#1C3829]/25 hover:bg-[#1C3829]/3 transition-all"
              >
                <span className="text-2xl">🏡</span>
                <span className="text-sm font-semibold text-[#1a2b20]">Airbnb / Rental</span>
                <span className="text-[10px] text-[#7A8F82] text-center">Paste a link</span>
              </button>
            </div>
          )}

          {/* ── Hotel search path ── */}
          {type === 'hotel' && lodgingMode === 'hotel' && !lodgingData && (
            <div className="bg-[#F5EFE0]/70 rounded-xl p-4 border border-[#1C3829]/8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-[#1C3829]/50 tracking-wide uppercase">Search for a hotel</p>
                <button type="button" onClick={() => { setLodgingMode(null); setHotelResults([]) }} className="text-[10px] text-[#1C3829]/30 hover:text-[#1C3829] transition-colors">
                  ← Back
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hotelQuery}
                  onChange={(e) => setHotelQuery(e.target.value)}
                  placeholder="e.g. Marriott Dubrovnik"
                  className="flex-1 border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleHotelSearch() } }}
                />
                <button
                  type="button"
                  onClick={handleHotelSearch}
                  disabled={hotelSearching}
                  className="btn-primary px-4 rounded-xl text-xs font-semibold disabled:opacity-50 flex-shrink-0"
                >
                  {hotelSearching ? (
                    <div className="w-4 h-4 border-2 border-[#F5EFE0]/30 border-t-[#F5EFE0] rounded-full animate-spin" />
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
              {hotelResults.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {hotelResults.map((h) => (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => selectHotelResult(h)}
                      className="w-full text-left p-3 rounded-lg border border-[#1C3829]/8 hover:bg-white transition-colors"
                    >
                      <p className="text-sm font-medium text-[#1a2b20]">{h.name}</p>
                      <p className="text-[10px] text-[#7A8F82] mt-0.5">{h.address}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] bg-[#1C3829]/5 text-[#1C3829]/50 px-1.5 py-0.5 rounded">{h.category}</span>
                        {h.phone && <span className="text-[9px] text-[#7A8F82]">{h.phone}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {hotelResults.length === 0 && hotelQuery && !hotelSearching && (
                <p className="text-[10px] text-[#1C3829]/30 mt-2">Type a hotel name and city, then hit Search</p>
              )}
            </div>
          )}

          {/* ── Airbnb / Rental link path ── */}
          {type === 'hotel' && lodgingMode === 'airbnb' && !lodgingData && (
            <div className="bg-[#F5EFE0]/70 rounded-xl p-4 border border-[#1C3829]/8">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-[#1C3829]/50 tracking-wide uppercase">Paste a listing link</p>
                <button type="button" onClick={() => setLodgingMode(null)} className="text-[10px] text-[#1C3829]/30 hover:text-[#1C3829] transition-colors">
                  ← Back
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={lodgingUrl}
                  onChange={(e) => setLodgingUrl(e.target.value)}
                  placeholder="https://airbnb.com/rooms/..."
                  className="flex-1 border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleLodgingLookup() } }}
                />
                <button
                  type="button"
                  onClick={handleLodgingLookup}
                  disabled={lodgingSearching}
                  className="btn-primary px-4 rounded-xl text-xs font-semibold disabled:opacity-50 flex-shrink-0"
                >
                  {lodgingSearching ? (
                    <div className="w-4 h-4 border-2 border-[#F5EFE0]/30 border-t-[#F5EFE0] rounded-full animate-spin" />
                  ) : (
                    'Fetch'
                  )}
                </button>
              </div>
              {lodgingError && (
                <p className="text-xs text-red-500 mt-2">{lodgingError}</p>
              )}
              <p className="text-[10px] text-[#1C3829]/30 mt-2">Works with Airbnb, Booking.com, VRBO, and more</p>
            </div>
          )}

          {/* ── Lodging result card ── */}
          {type === 'hotel' && lodgingData && (
            <div className="rounded-xl overflow-hidden border border-[#1C3829]/10">
              <div className="p-4 bg-[#1C3829]/5">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-semibold bg-[#1C3829]/10 text-[#1C3829]/60 px-2 py-0.5 rounded-full">
                      {lodgingData.platform}
                    </span>
                    <p className="text-sm font-semibold text-[#1a2b20] mt-2" style={{ fontFamily: "'Playfair Display', serif" }}>
                      {lodgingData.name}
                    </p>
                    {lodgingData.location && (
                      <p className="text-[#7A8F82] text-xs mt-0.5">{lodgingData.location}</p>
                    )}
                  </div>
                  {lodgingData.rating && (
                    <span className="text-xs font-semibold text-[#1C3829]">★ {lodgingData.rating}</span>
                  )}
                </div>
              </div>
              {lodgingData.details && (
                <div className="px-4 py-2 border-t border-[#1C3829]/5">
                  <p className="text-[10px] text-[#7A8F82]">{lodgingData.details}</p>
                </div>
              )}
              <div className="px-4 py-2 border-t border-[#1C3829]/5">
                <a
                  href={lodgingData.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-[#1C3829]/50 hover:text-[#1C3829] transition-colors underline"
                >
                  View on {lodgingData.platform} →
                </a>
                <span className="mx-2 text-[#1C3829]/15">|</span>
                <button
                  type="button"
                  onClick={() => { setLodgingData(null); setLodgingMode(null); setTitle(''); setLocation(''); setDescription('') }}
                  className="text-[10px] text-[#1C3829]/30 hover:text-[#1C3829]/60 transition-colors"
                >
                  Change lodging
                </button>
              </div>
            </div>
          )}

          {/* ── Lodging dates & details ── */}
          {type === 'hotel' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[#1a2b20] mb-1">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className={`w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a2b20] mb-1">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn}
                    className={`w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent`}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <TimePicker label="Check-in time" value={checkInTime} onChange={setCheckInTime} />
                <TimePicker label="Check-out time" value={checkOutTime} onChange={setCheckOutTime} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a2b20] mb-1">Confirmation number</label>
                <input
                  type="text"
                  value={confirmationNum}
                  onChange={(e) => setConfirmationNum(e.target.value)}
                  placeholder="Optional"
                  className={`w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent`}
                />
              </div>
              {!lodgingData && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#1a2b20] mb-1">Property name</label>
                    <input
                      type="text"
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g. Casa Calma, Marriott Downtown"
                      className={`w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a2b20] mb-1">Location</label>
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Address or city"
                      className={`w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent`}
                    />
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium text-[#1a2b20] mb-1">Notes</label>
                <textarea
                  value={type === 'hotel' && lodgingData ? '' : description}
                  onChange={(e) => { if (!lodgingData) setDescription(e.target.value) }}
                  placeholder={lodgingData ? 'Details auto-filled from listing' : 'WiFi password, door code, notes...'}
                  rows={2}
                  disabled={!!lodgingData}
                  className={`w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent resize-none ${lodgingData ? 'opacity-40' : ''}`}
                />
              </div>
            </>
          )}

          {/* ── Dining section ── */}
          {type === 'restaurant' && !diningSelected && (
            <div>
              {/* Search */}
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={diningQuery}
                  onChange={(e) => setDiningQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleDiningSearch() } }}
                  placeholder={`Search restaurants in ${getDiningCity() || 'your destination'}...`}
                  className="flex-1 border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleDiningSearch}
                  disabled={diningSearching}
                  className="btn-primary px-4 rounded-xl text-xs font-semibold disabled:opacity-50 flex-shrink-0"
                >
                  {diningSearching ? (
                    <div className="w-4 h-4 border-2 border-[#F5EFE0]/30 border-t-[#F5EFE0] rounded-full animate-spin" />
                  ) : 'Search'}
                </button>
              </div>

              {/* Search results */}
              {diningResults.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  <p className="text-[10px] font-semibold text-[#1C3829]/35 tracking-wider uppercase mb-2">Results</p>
                  {diningResults.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => selectDiningResult(r)}
                      className="w-full text-left p-3 rounded-lg border border-[#1C3829]/8 hover:bg-[#1C3829]/3 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-[#1a2b20]">{r.name}</p>
                          <p className="text-[10px] text-[#7A8F82] mt-0.5 truncate">{r.address}</p>
                        </div>
                        {r.cuisine && (
                          <span className="text-[9px] bg-[#1C3829]/5 text-[#1C3829]/50 px-2 py-0.5 rounded-full flex-shrink-0">{r.cuisine}</span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Popular in city */}
              {diningResults.length === 0 && diningPopular.length > 0 && !diningSearching && (
                <div>
                  <p className="text-[10px] font-semibold text-[#1C3829]/35 tracking-wider uppercase mb-2">
                    Popular in {getDiningCity()}
                  </p>
                  <div className="space-y-1.5">
                    {diningPopular.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => selectDiningResult(r)}
                        className="w-full text-left p-3 rounded-lg border border-[#1C3829]/8 hover:bg-[#1C3829]/3 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[#1a2b20]">{r.name}</p>
                            <p className="text-[10px] text-[#7A8F82] mt-0.5 truncate">{r.address}</p>
                          </div>
                          {r.cuisine && (
                            <span className="text-[9px] bg-[#1C3829]/5 text-[#1C3829]/50 px-2 py-0.5 rounded-full flex-shrink-0">{r.cuisine}</span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual entry option */}
              <div className="mt-4 pt-3 border-t border-[#1C3829]/8">
                <button
                  type="button"
                  onClick={() => setDiningSelected({ manual: true })}
                  className="text-xs text-[#1C3829]/40 hover:text-[#1C3829] transition-colors"
                >
                  Or enter restaurant details manually →
                </button>
              </div>
            </div>
          )}

          {/* Dining selected — show result + time/date fields */}
          {type === 'restaurant' && diningSelected && (
            <>
              {!diningSelected.manual && (
                <div className="bg-[#1C3829]/5 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1a2b20]" style={{ fontFamily: "'Playfair Display', serif" }}>{diningSelected.name}</p>
                      {diningSelected.address && <p className="text-[10px] text-[#7A8F82] mt-0.5">{diningSelected.address}</p>}
                      <div className="flex items-center gap-2 mt-1.5">
                        {diningSelected.cuisine && <span className="text-[9px] bg-[#1C3829]/8 text-[#1C3829]/50 px-2 py-0.5 rounded-full">{diningSelected.cuisine}</span>}
                        {diningSelected.phone && <span className="text-[9px] text-[#7A8F82]">{diningSelected.phone}</span>}
                      </div>
                      {diningSelected.website && (
                        <a href={diningSelected.website} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#1C3829]/40 hover:text-[#1C3829] underline mt-1 inline-block" onClick={(e) => e.stopPropagation()}>
                          Visit website →
                        </a>
                      )}
                    </div>
                  </div>
                  <button type="button" onClick={() => { setDiningSelected(null); setTitle(''); setLocation(''); setDescription('') }} className="text-[10px] text-[#1C3829]/30 hover:text-[#1C3829]/60 transition-colors mt-2">
                    Change restaurant
                  </button>
                </div>
              )}

              {diningSelected.manual && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#1a2b20] mb-1">Restaurant name</label>
                    <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Restaurant 360" className={inputClass} autoFocus />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a2b20] mb-1">Location</label>
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Address" className={inputClass} />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1a2b20] mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TimePicker label="Reservation time" value={startTime} onChange={setStartTime} />
                <TimePicker label="End time" value={endTime} onChange={setEndTime} />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a2b20] mb-1">Notes</label>
                <textarea
                  value={diningSelected.manual ? description : ''}
                  onChange={(e) => { if (diningSelected.manual) setDescription(e.target.value) }}
                  placeholder={diningSelected.manual ? 'Reservation number, notes...' : 'Details auto-filled'}
                  rows={2}
                  disabled={!diningSelected.manual}
                  className={`${inputClass} resize-none ${!diningSelected.manual ? 'opacity-40' : ''}`}
                />
              </div>
            </>
          )}

          {/* ── Standard form fields (shown for non-flight, non-hotel, non-restaurant) ── */}
          {type !== 'flight' && type !== 'hotel' && type !== 'restaurant' && (
            <>
              {/* Transport sub-type selector */}
              {type === 'transport' && (
                <div>
                  <label className="block text-sm font-medium text-[#1a2b20] mb-2">Transport type</label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { value: 'Ferry', icon: (p) => <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none"><path d="M2 20l1.5-1.5C5 17 7 17 8.5 18.5 10 20 12 20 13.5 18.5 15 17 17 17 18.5 18.5L22 20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M6 12V8h12v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M4 16l1-4h14l1 4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M12 8V5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> },
                      { value: 'Rideshare', icon: (p) => <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none"><rect x="5" y="11" width="14" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.6"/><path d="M5 14h14" stroke="currentColor" strokeWidth="1.2"/><circle cx="8" cy="18" r="1.2" stroke="currentColor" strokeWidth="1.3"/><circle cx="16" cy="18" r="1.2" stroke="currentColor" strokeWidth="1.3"/><path d="M7 11l1.5-4h7L17 11" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M12 4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="12" cy="3.5" r="1" fill="currentColor"/></svg> },
                      { value: 'Taxi', icon: (p) => <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none"><rect x="3" y="10" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 10l2-5h6l2 5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="7.5" cy="18" r="1.2" stroke="currentColor" strokeWidth="1.3"/><circle cx="16.5" cy="18" r="1.2" stroke="currentColor" strokeWidth="1.3"/><path d="M9 5h6" stroke="currentColor" strokeWidth="1.6"/></svg> },
                      { value: 'Car Rental', icon: (p) => <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none"><rect x="3" y="10" width="18" height="8" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M7 10l2-5h6l2 5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="7.5" cy="18" r="1.2" stroke="currentColor" strokeWidth="1.3"/><circle cx="16.5" cy="18" r="1.2" stroke="currentColor" strokeWidth="1.3"/><path d="M3 14h18" stroke="currentColor" strokeWidth="1.2"/></svg> },
                      { value: 'Train', icon: (p) => <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none"><rect x="6" y="3" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M6 14h12M6 9h12" stroke="currentColor" strokeWidth="1.2"/><circle cx="9" cy="17" r="0.8" fill="currentColor"/><circle cx="15" cy="17" r="0.8" fill="currentColor"/><path d="M9 19l-2 3M15 19l2 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> },
                      { value: 'Bus', icon: (p) => <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M4 12h16M4 8h16" stroke="currentColor" strokeWidth="1.2"/><circle cx="7.5" cy="18" r="1.2" stroke="currentColor" strokeWidth="1.3"/><circle cx="16.5" cy="18" r="1.2" stroke="currentColor" strokeWidth="1.3"/></svg> },
                      { value: 'Subway', icon: (p) => <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none"><rect x="6" y="3" width="12" height="14" rx="3" stroke="currentColor" strokeWidth="1.6"/><path d="M6 12h12" stroke="currentColor" strokeWidth="1.2"/><circle cx="9" cy="14.5" r="0.8" fill="currentColor"/><circle cx="15" cy="14.5" r="0.8" fill="currentColor"/><path d="M9 17l-2 4M15 17l2 4M10 21h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> },
                      { value: 'Private Transfer', icon: (p) => <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none"><rect x="2" y="10" width="20" height="7" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M6 10l2-4h8l2 4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="7" cy="17" r="1.2" stroke="currentColor" strokeWidth="1.3"/><circle cx="17" cy="17" r="1.2" stroke="currentColor" strokeWidth="1.3"/><path d="M14 10V6" stroke="currentColor" strokeWidth="1.2"/></svg> },
                      { value: 'Walking', icon: (p) => <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.6"/><path d="M10 9l-3 8M14 9l3 8M9.5 13h5M8.5 21l2-5M15.5 21l-2-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> },
                      { value: 'Boat', icon: (p) => <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none"><path d="M4 18l2-8h12l2 8" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M12 10V4M9 10l3-6 3 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 21c2-2 4-2 6 0s4 2 6 0 4-2 6 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
                      { value: 'Other', icon: (p) => <svg width={p.s} height={p.s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M8 12h8M12 8v8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg> },
                    ].map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTransportType(t.value)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          transportType === t.value
                            ? 'bg-[#1C3829] text-[#F5EFE0]'
                            : 'bg-[#1C3829]/5 text-[#1C3829]/60 hover:bg-[#1C3829]/10'
                        }`}
                      >
                        {t.icon({ s: 14 })}
                        {t.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[#1a2b20] mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={type === 'transport' ? 'e.g. Ferry to Hvar, Uber to airport' : 'What are you doing?'}
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div ref={locRef} className="relative">
                <label className="block text-sm font-medium text-[#1a2b20] mb-1">Location</label>
                <div className="relative">
                  <input
                    type="text"
                    value={type === 'transport' ? locQuery || location : location}
                    onChange={(e) => {
                      if (type === 'transport') {
                        setLocQuery(e.target.value)
                        setLocation(e.target.value)
                      } else {
                        setLocation(e.target.value)
                      }
                    }}
                    onFocus={() => { if (type === 'transport' && locSuggestions.length > 0) setShowLocDropdown(true) }}
                    placeholder={type === 'transport' ? 'Search port, station, address...' : 'Address or place name'}
                    className={inputClass}
                    autoComplete="off"
                  />
                  {locSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-[#1C3829]/15 border-t-[#1C3829]/50 rounded-full animate-spin" />
                  )}
                </div>
                {showLocDropdown && type === 'transport' && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-xl border border-[#1C3829]/10 shadow-lg overflow-hidden py-0.5">
                    {locSuggestions.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          const full = s.detail ? `${s.name}, ${s.detail}` : s.name
                          setLocation(full)
                          setLocQuery(full)
                          setShowLocDropdown(false)
                        }}
                        className="w-full text-left px-4 py-2.5 flex items-start gap-2 hover:bg-[#1C3829]/5 transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 10 10" fill="none" className="text-[#1C3829]/25 flex-shrink-0 mt-0.5">
                          <path d="M5 1C3.34 1 2 2.34 2 4c0 2.25 3 5 3 5s3-2.75 3-5c0-1.66-1.34-3-3-3zm0 4a1 1 0 110-2 1 1 0 010 2z" fill="currentColor"/>
                        </svg>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-[#1a2b20]">{s.name}</p>
                          {s.detail && <p className="text-[10px] text-[#7A8F82] truncate">{s.detail}</p>}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a2b20] mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TimePicker label="Start time" value={startTime} onChange={setStartTime} />
                <TimePicker label="End time" value={endTime} onChange={setEndTime} />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1a2b20] mb-1">Notes</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Booking ref, details, links..."
                  rows={3}
                  className={`${inputClass} resize-none`}
                />
              </div>

              {/* Transport file attachments */}
              {type === 'transport' && (
                <div>
                  <label className="block text-sm font-medium text-[#1a2b20] mb-2">Tickets & Documents</label>

                  {/* File list */}
                  {pendingFiles.length > 0 && (
                    <div className="space-y-2 mb-3">
                      {pendingFiles.map((file, i) => {
                        const fType = getFileIcon(file.type)
                        return (
                          <div key={i} className="flex items-center gap-3 bg-[#1C3829]/5 rounded-lg px-3 py-2.5">
                            <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${
                              fType === 'pdf' ? 'bg-red-500/10 text-red-500' :
                              fType === 'img' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-[#1C3829]/10 text-[#1C3829]/50'
                            }`}>
                              {fType === 'pdf' ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                              ) : fType === 'img' ? (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.8"/><circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/><path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                              ) : (
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 3v6h6M8 13h8M8 17h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-[#1a2b20] truncate">{file.name}</p>
                              <p className="text-[10px] text-[#7A8F82]">{formatFileSize(file.size)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPendingFiles((f) => f.filter((_, j) => j !== i))}
                              className="text-[#1C3829]/30 hover:text-red-500 transition-colors text-lg leading-none"
                            >
                              &times;
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Upload button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      setPendingFiles((prev) => [...prev, ...files])
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#1C3829]/15 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1C3829]/30 hover:bg-[#1C3829]/3 transition-all"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#1C3829]/30">
                      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span className="text-xs text-[#1C3829]/40 font-medium">Upload tickets, receipts, or documents</span>
                    <span className="text-[10px] text-[#1C3829]/25">PDF, images, or docs</span>
                  </button>
                </div>
              )}
            </>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || (type === 'flight' && !flightData && !title) || (type === 'hotel' && !lodgingData && !title) || (type === 'restaurant' && !diningSelected)}
            className="btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Adding...' : type === 'flight' && flightData ? `Add ${flightData.subtitle}` : type === 'hotel' && lodgingData ? `Add ${lodgingData.name}` : type === 'restaurant' && diningSelected && !diningSelected.manual ? `Add ${diningSelected.name}` : 'Add item'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Itinerary Item Card ── */
/* ── Trip Documents Modal ── */
function TripDocsModal({ open, onClose, tripId, userId, docs, onChanged }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [docType, setDocType] = useState('booking')
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  const tripDocTypes = [
    { value: 'booking', label: 'Booking' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'visa', label: 'Visa' },
    { value: 'itinerary', label: 'Itinerary' },
    { value: 'receipt', label: 'Receipt' },
    { value: 'other', label: 'Other' },
  ]

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) { setError('Select a file'); return }
    setError('')
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `${userId}/trips/${tripId}/${Date.now()}.${ext}`

    const { error: upErr } = await supabase.storage.from('documents').upload(path, file)
    if (upErr) { setError(upErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

    const { error: dbErr } = await supabase.from('trip_documents').insert({
      trip_id: tripId,
      uploaded_by: userId,
      doc_type: docType,
      title: title || file.name,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      notes: notes || null,
    })

    if (dbErr) { setError(dbErr.message) }
    else {
      setFile(null)
      setTitle('')
      setNotes('')
      setDocType('booking')
      onChanged()
    }
    setUploading(false)
  }

  async function handleDelete(docId) {
    if (!window.confirm('Delete this document?')) return
    await supabase.from('trip_documents').delete().eq('id', docId)
    onChanged()
  }

  if (!open) return null

  const inputClass = 'w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#1C3829]/10 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1C3829]/8 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1a2b20]" style={{ fontFamily: "'Playfair Display', serif" }}>Trip Documents</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-[#1C3829]/5 flex items-center justify-center text-[#1C3829]/40 hover:text-[#1C3829] transition-colors text-lg">&times;</button>
        </div>

        <div className="p-6">
          {/* Existing docs */}
          {docs.length > 0 && (
            <div className="space-y-2 mb-6">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 bg-[#1C3829]/5 rounded-xl px-4 py-3 group">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#1C3829]/35 flex-shrink-0">
                    <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                    <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1a2b20] truncate">{doc.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] bg-[#1C3829]/8 text-[#1C3829]/50 px-1.5 py-0.5 rounded">{doc.doc_type}</span>
                      <span className="text-[9px] text-[#7A8F82]">{formatFileSize(doc.file_size)}</span>
                    </div>
                  </div>
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="w-6 h-6 rounded-md hover:bg-[#1C3829]/10 flex items-center justify-center text-[#1C3829]/30 hover:text-[#1C3829] transition-colors opacity-0 group-hover:opacity-100">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/></svg>
                  </a>
                  <button onClick={() => handleDelete(doc.id)}
                    className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-[#1C3829]/20 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                    <span className="text-lg leading-none">&times;</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload form */}
          <form onSubmit={handleUpload} className="space-y-3">
            <p className="text-xs font-semibold text-[#1C3829]/40 tracking-wider uppercase">Add document</p>

            <div className="flex flex-wrap gap-1.5">
              {tripDocTypes.map((t) => (
                <button key={t.value} type="button" onClick={() => setDocType(t.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    docType === t.value ? 'bg-[#1C3829] text-[#F5EFE0]' : 'bg-[#1C3829]/5 text-[#1C3829]/50 hover:bg-[#1C3829]/10'
                  }`}>
                  {t.label}
                </button>
              ))}
            </div>

            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Document title (optional)" className={inputClass} />

            {file ? (
              <div className="flex items-center gap-3 bg-[#1C3829]/5 rounded-xl px-4 py-3">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#1C3829]/35"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                <span className="text-xs text-[#1a2b20] truncate flex-1">{file.name}</span>
                <button type="button" onClick={() => { setFile(null); fileRef.current.value = '' }} className="text-[#1C3829]/30 hover:text-red-500 text-lg">&times;</button>
              </div>
            ) : (
              <>
                <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#1C3829]/15 rounded-xl py-3 flex items-center justify-center gap-2 hover:border-[#1C3829]/30 hover:bg-[#1C3829]/3 transition-all">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#1C3829]/30"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-xs text-[#1C3829]/40 font-medium">Choose file</span>
                </button>
              </>
            )}

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button type="submit" disabled={uploading || !file} className="w-full btn-primary py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ── Invite & Members Modal ── */
function InviteModal({ open, onClose, trip, members, userId, onMembersChanged }) {
  const [tab, setTab] = useState('members') // 'members' | 'invite'
  const [friends, setFriends] = useState([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const inviteLink = trip?.invite_token ? `${window.location.origin}/join/${trip.invite_token}` : ''
  const memberIds = new Set(members.map((m) => m.user_id))

  useEffect(() => {
    if (!open || friends.length > 0) return
    setLoadingFriends(true)
    supabase
      .from('friendships')
      .select('*, requester:requester_id(id, full_name, avatar_url, username), addressee:addressee_id(id, full_name, avatar_url, username)')
      .eq('status', 'accepted')
      .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
      .then(({ data }) => {
        const f = (data || []).map((fr) => fr.requester_id === userId ? fr.addressee : fr.requester)
        setFriends(f)
        setLoadingFriends(false)
      })
  }, [open])

  async function addFriend(friendId) {
    setSending(true)
    await supabase.from('trip_members').insert({
      trip_id: trip.id,
      user_id: friendId,
      role: 'editor',
    })
    setSending(false)
    onMembersChanged()
  }

  async function removeMember(memberId) {
    if (!window.confirm('Remove this person from the trip?')) return
    await supabase.from('trip_members').delete().eq('trip_id', trip.id).eq('user_id', memberId)
    onMembersChanged()
  }

  async function changeRole(memberId, newRole) {
    await supabase.from('trip_members').update({ role: newRole }).eq('trip_id', trip.id).eq('user_id', memberId)
    onMembersChanged()
  }

  async function sendEmailInvite() {
    if (!inviteEmail.trim()) return
    setSending(true)
    const { error } = await supabase.from('invitations').insert({
      trip_id: trip.id,
      invited_by: userId,
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
    })
    setSending(false)
    if (error) {
      setMessage(error.message.includes('duplicate') ? 'Already invited' : error.message)
    } else {
      setMessage(`Invitation sent to ${inviteEmail}`)
      setInviteEmail('')
    }
    setTimeout(() => setMessage(''), 3000)
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open || !trip) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#1C3829]/10 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1C3829]/8 flex items-center justify-between">
          <h3
            className="text-lg font-semibold text-[#1a2b20]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Travelers
          </h3>
          <button onClick={onClose} type="button" className="w-7 h-7 rounded-full hover:bg-[#1C3829]/5 flex items-center justify-center text-[#1C3829]/40 hover:text-[#1C3829] transition-colors text-lg">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1C3829]/5 rounded-xl p-1 mx-6 mt-4">
          <button onClick={() => setTab('members')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'members' ? 'bg-[#1C3829] text-[#F5EFE0]' : 'text-[#1C3829]/50'}`}>
            Members ({members.length})
          </button>
          <button onClick={() => setTab('invite')} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${tab === 'invite' ? 'bg-[#1C3829] text-[#F5EFE0]' : 'text-[#1C3829]/50'}`}>
            Invite
          </button>
        </div>

        <div className="p-6">
          {/* Members tab */}
          {tab === 'members' && (
            <div className="space-y-2">
              {members.map((m) => {
                const isOwner = m.role === 'owner'
                const isSelf = m.user_id === userId
                return (
                  <div key={m.user_id} className="flex items-center gap-3 py-2">
                    <Avatar url={m.profiles?.avatar_url} name={m.profiles?.full_name} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a2b20]">
                        {m.profiles?.full_name || 'Unknown'}
                        {isSelf && <span className="text-[10px] text-[#7A8F82] ml-1">(you)</span>}
                      </p>
                    </div>
                    {isOwner ? (
                      <span className="text-[10px] text-[#1C3829]/40 bg-[#1C3829]/5 px-2 py-0.5 rounded-full">Owner</span>
                    ) : (
                      <div className="flex items-center gap-1">
                        <select
                          value={m.role}
                          onChange={(e) => changeRole(m.user_id, e.target.value)}
                          className="text-[10px] text-[#1C3829]/60 bg-[#1C3829]/5 px-2 py-1 rounded-full border-none outline-none cursor-pointer"
                        >
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                        {!isSelf && (
                          <button onClick={() => removeMember(m.user_id)} className="text-[#1C3829]/20 hover:text-red-500 transition-colors text-lg leading-none ml-1">&times;</button>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Invite tab */}
          {tab === 'invite' && (
            <div className="space-y-5">
              {/* Copy link */}
              <div>
                <p className="text-xs font-semibold text-[#1C3829]/40 tracking-wider uppercase mb-2">Share link</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inviteLink}
                    readOnly
                    className="flex-1 border border-[#1C3829]/15 rounded-xl px-3 py-2.5 text-xs bg-[#F5EFE0]/50 text-[#1C3829]/50 truncate"
                  />
                  <button
                    onClick={copyLink}
                    className={`px-4 rounded-xl text-xs font-semibold transition-all flex-shrink-0 ${
                      copied ? 'bg-[#1C3829]/10 text-[#1C3829]' : 'btn-primary'
                    }`}
                  >
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p className="text-[10px] text-[#1C3829]/25 mt-1.5">Anyone with this link can join as a viewer</p>
              </div>

              {/* From friends */}
              <div>
                <p className="text-xs font-semibold text-[#1C3829]/40 tracking-wider uppercase mb-2">Add from friends</p>
                {loadingFriends ? (
                  <div className="w-4 h-4 border-2 border-[#1C3829]/15 border-t-[#1C3829]/40 rounded-full animate-spin mx-auto my-4" />
                ) : (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {friends.filter((f) => !memberIds.has(f.id)).map((f) => (
                      <div key={f.id} className="flex items-center gap-2 py-1.5">
                        <Avatar url={f.avatar_url} name={f.full_name} size="sm" />
                        <span className="text-xs text-[#1a2b20] flex-1 truncate">{f.full_name}</span>
                        <button
                          onClick={() => addFriend(f.id)}
                          disabled={sending}
                          className="text-[10px] font-semibold text-[#1C3829] bg-[#1C3829]/8 hover:bg-[#1C3829]/15 px-3 py-1 rounded-full transition-colors disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                    ))}
                    {friends.filter((f) => !memberIds.has(f.id)).length === 0 && (
                      <p className="text-xs text-[#7A8F82] py-2">All friends are already on this trip</p>
                    )}
                  </div>
                )}
              </div>

              {/* By email */}
              <div>
                <p className="text-xs font-semibold text-[#1C3829]/40 tracking-wider uppercase mb-2">Invite by email</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') sendEmailInvite() }}
                    placeholder="email@example.com"
                    className="flex-1 border border-[#1C3829]/15 rounded-xl px-3 py-2.5 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30"
                  />
                  <button
                    onClick={sendEmailInvite}
                    disabled={sending || !inviteEmail.trim()}
                    className="btn-primary px-4 rounded-xl text-xs font-semibold disabled:opacity-50 flex-shrink-0"
                  >
                    Send
                  </button>
                </div>
                {message && <p className="text-[10px] text-[#4A6356] mt-1.5">{message}</p>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Item Detail Modal (read-only) ── */
function ItemDetailModal({ open, onClose, item, onEdit }) {
  if (!open || !item) return null

  const typeInfo = ITEM_TYPES.find((t) => t.value === item.type) || ITEM_TYPES[0]
  const Icon = ICONS[item.type]
  const lines = (item.description || '').split('\n')
  const getField = (key) => { const l = lines.find((l) => l.startsWith(key + ':')); return l ? l.slice(key.length + 1).trim() : '' }
  const link = getField('Link') || getField('Website')
  const descWithoutMeta = lines.filter((l) => !l.match(/^(Link|Website|FoursquareID|TransportType|Cuisine|Phone|Platform|Rating|Details|Check-out|Check-in time|Check-out time|Confirmation|Image|Flight):/i)).join('\n').trim()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-[#1C3829] rounded-2xl max-w-md w-full shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto text-[#F5EFE0]">

        {/* Header */}
        <div className="p-6 pb-3 flex items-start justify-between">
          <div className="flex items-center gap-2">
            {Icon && <div className="opacity-50"><Icon size={16} /></div>}
            <span className="text-[10px] font-medium opacity-40">{typeInfo.label}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onClose(); onEdit(item) }}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-[#F5EFE0]/40 hover:text-[#F5EFE0] transition-colors"
              title="Edit"
            >
              <svg width="13" height="13" viewBox="0 0 12 12" fill="none">
                <path d="M8.5 1.5l2 2-7 7H1.5V8.5l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full hover:bg-white/10 flex items-center justify-center text-[#F5EFE0]/40 hover:text-[#F5EFE0] transition-colors text-lg"
            >
              &times;
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="px-6 pb-4">
          <h3
            className="text-2xl font-semibold tracking-tight leading-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {item.title}
          </h3>
          {item.location && <p className="text-xs opacity-40 mt-1">{item.location}</p>}
        </div>

        {/* Details grid */}
        <div className="mx-6 rounded-xl bg-white/5 border border-white/5 p-4">
          <div className="space-y-3">
            {item.date && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider opacity-30 font-medium">Date</span>
                <span className="text-xs font-medium opacity-70">{formatDate(item.date)}</span>
              </div>
            )}
            {(item.start_time || item.end_time) && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider opacity-30 font-medium">Time</span>
                <span className="text-xs font-medium opacity-70">
                  {item.start_time && formatTime(item.start_time)}
                  {item.start_time && item.end_time && ' – '}
                  {item.end_time && formatTime(item.end_time)}
                </span>
              </div>
            )}
            {getField('TransportType') && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider opacity-30 font-medium">Type</span>
                <span className="text-xs font-medium opacity-70">{getField('TransportType')}</span>
              </div>
            )}
            {getField('Cuisine') && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider opacity-30 font-medium">Cuisine</span>
                <span className="text-xs font-medium opacity-70">{getField('Cuisine')}</span>
              </div>
            )}
            {getField('Phone') && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider opacity-30 font-medium">Phone</span>
                <a href={`tel:${getField('Phone')}`} className="text-xs font-medium opacity-70 hover:opacity-100 transition-opacity">{getField('Phone')}</a>
              </div>
            )}
            {getField('Confirmation') && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider opacity-30 font-medium">Confirmation</span>
                <span className="text-xs font-medium opacity-70">{getField('Confirmation')}</span>
              </div>
            )}
            {getField('Platform') && (
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider opacity-30 font-medium">Platform</span>
                <span className="text-xs font-medium opacity-70">{getField('Platform')}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {descWithoutMeta && (
          <div className="mx-6 mt-3 rounded-xl bg-white/5 border border-white/5 p-4">
            <p className="text-[9px] font-semibold tracking-wider uppercase opacity-30 mb-2">Notes</p>
            <p className="text-xs opacity-60 leading-relaxed whitespace-pre-line">{descWithoutMeta}</p>
          </div>
        )}

        {/* Link */}
        {link && (
          <div className="mx-6 mt-3 rounded-xl bg-white/5 border border-white/5 p-3">
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs opacity-50 hover:opacity-90 transition-opacity"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              <span className="underline truncate">{link.replace(/^https?:\/\/(www\.)?/, '')}</span>
            </a>
          </div>
        )}

        {/* Attachments */}
        {item._attachments?.length > 0 && (
          <div className="mx-6 mt-3 rounded-xl bg-white/5 border border-white/5 p-4">
            <p className="text-[9px] font-semibold tracking-wider uppercase opacity-30 mb-2">Attachments</p>
            <div className="space-y-1.5">
              {item._attachments.map((a) => (
                <a
                  key={a.id}
                  href={a.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs opacity-50 hover:opacity-80 transition-opacity"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                  <span className="truncate">{a.file_name}</span>
                  {a.file_size && <span className="text-[9px] opacity-40 ml-auto flex-shrink-0">{formatFileSize(a.file_size)}</span>}
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="p-4" />
      </div>
    </div>
  )
}

function ItemCard({ item, onDelete, onFlightClick, onRestaurantClick, onEdit, onDetailClick }) {
  const typeInfo = ITEM_TYPES.find((t) => t.value === item.type) || ITEM_TYPES[0]
  const isFlight = item.type === 'flight' && item.title.includes('→')
  const isHotel = item.type === 'hotel'

  // Check-out marker — compact badge
  if (isHotel && item._checkoutMarker) {
    const checkOutTime = item.end_time ? formatTime(item.end_time) : ''
    return (
      <div className="group flex items-center gap-3 bg-[#1C3829]/8 rounded-lg px-4 py-2.5">
        <ICONS.hotel size={14} className="opacity-70" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#1a2b20]">
            Check-out · {item.title}
          </p>
          {checkOutTime && (
            <p className="text-[10px] text-[#7A8F82]">{checkOutTime}</p>
          )}
        </div>
        <span className="text-[9px] font-medium text-[#1C3829]/40 bg-[#1C3829]/5 px-2 py-0.5 rounded-full">
          Check-out
        </span>
      </div>
    )
  }

  // Parse hotel fields from description
  if (isHotel) {
    const lines = (item.description || '').split('\n')
    const getField = (key) => {
      const line = lines.find((l) => l.startsWith(key + ':'))
      return line ? line.slice(key.length + 1).trim() : ''
    }
    const link = getField('Link')
    const platform = getField('Platform') || 'Hotel'
    const rating = getField('Rating')
    const details = getField('Details')
    const checkOutDate = getField('Check-out')
    const confirmation = getField('Confirmation')
    const image = getField('Image')
    const checkInTime = item.start_time ? formatTime(item.start_time) : ''
    const checkOutTime = item.end_time ? formatTime(item.end_time) : ''
    const checkInStr = item.date ? formatDate(item.date) : ''
    const checkOutStr = checkOutDate ? formatDate(checkOutDate) : ''

    let nights = ''
    if (item.date && checkOutDate) {
      const diff = Math.round((new Date(checkOutDate) - new Date(item.date)) / (1000 * 60 * 60 * 24))
      if (diff > 0) nights = `${diff} night${diff > 1 ? 's' : ''}`
    }

    return (
      <div
        onClick={() => onDetailClick?.(item)}
        className="group relative bg-[#1C3829] rounded-xl overflow-hidden text-[#F5EFE0] hover:shadow-lg hover:shadow-[#1C3829]/20 transition-all cursor-pointer"
      >
        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(item) }}
            className="w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm text-white/60 hover:text-white flex items-center justify-center transition-colors"
            title="Edit"
          >
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-7 7H1.5V8.5l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
            className="w-6 h-6 rounded-full bg-black/30 backdrop-blur-sm text-white/60 hover:text-white flex items-center justify-center transition-colors"
            title="Delete"
          >
            <span className="text-sm">&times;</span>
          </button>
        </div>

        <div className="p-4">
          {/* Unified header: icon + platform label + nights tag */}
          <div className="flex items-center gap-2 mb-3">
            <ICONS.hotel size={12} className="opacity-50" />
            <span className="text-[10px] font-medium opacity-40">{platform}</span>
            <div className="flex items-center gap-2 ml-auto">
              {rating && (
                <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full">★ {rating}</span>
              )}
              {nights && (
                <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full">{nights}</span>
              )}
            </div>
          </div>

          {/* Property name */}
          <h4
            className="text-base font-semibold leading-tight mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {item.title}
          </h4>
          {item.location && (
            <p className="text-[10px] opacity-50 mb-3">{item.location}</p>
          )}

          {/* Check-in / Check-out */}
          <div className="flex items-center justify-between text-xs">
            <div>
              <p className="text-[9px] uppercase tracking-wider opacity-30 font-medium">Check-in</p>
              <p className="font-medium opacity-80">{checkInStr}</p>
              {checkInTime && <p className="text-[10px] opacity-40">{checkInTime}</p>}
            </div>
            <div className="flex-1 mx-3">
              <div className="flex items-center gap-1">
                <div className="w-1 h-1 rounded-full bg-[#F5EFE0]/30" />
                <div className="flex-1 border-t border-dashed border-[#F5EFE0]/15" />
                <div className="w-1 h-1 rounded-full bg-[#F5EFE0]/50" />
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] uppercase tracking-wider opacity-30 font-medium">Check-out</p>
              <p className="font-medium opacity-80">{checkOutStr}</p>
              {checkOutTime && <p className="text-[10px] opacity-40">{checkOutTime}</p>}
            </div>
          </div>

          {/* Footer */}
          {(confirmation || details || link) && (
            <div className="mt-3 pt-2 border-t border-white/8 flex items-center justify-between">
              {confirmation && (
                <span className="text-[10px] opacity-30">Conf: {confirmation}</span>
              )}
              {link && (
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] opacity-30 hover:opacity-70 transition-opacity underline ml-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  View listing →
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (isFlight) {
    const [depCode, arrCode] = item.title.split('→').map((s) => s.trim())
    // Parse description for airline, aircraft, terminals
    const lines = (item.description || '').split('\n')
    const airlineLine = lines[0] || ''
    const getField = (key) => {
      const line = lines.find((l) => l.startsWith(key + ':'))
      return line ? line.slice(key.length + 1).trim() : ''
    }
    const aircraft = getField('Aircraft')
    const depTerminal = getField('Dep Terminal')
    const arrTerminal = getField('Arr Terminal')
    const status = getField('Status')

    return (
      <div
        onClick={() => onFlightClick?.(item)}
        className="group relative bg-[#1C3829] rounded-xl p-4 text-[#F5EFE0] hover:shadow-lg hover:shadow-[#1C3829]/20 transition-all cursor-pointer"
      >
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(item) }}
            className="w-6 h-6 rounded-md hover:bg-white/15 flex items-center justify-center text-[#F5EFE0]/30 hover:text-[#F5EFE0] transition-colors"
            title="Edit"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-7 7H1.5V8.5l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
            className="w-6 h-6 rounded-md hover:bg-red-500/20 flex items-center justify-center text-[#F5EFE0]/30 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>

        {/* Unified header: icon + label + status tag */}
        <div className="flex items-center gap-2 mb-4">
          <ICONS.flight size={12} className="opacity-50" />
          <span className="text-[10px] font-medium opacity-40">{airlineLine}</span>
          {status && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ml-auto ${
              status === 'Landed' ? 'bg-green-500/20 text-green-300' :
              status === 'EnRoute' ? 'bg-blue-500/20 text-blue-300' :
              status === 'Cancelled' ? 'bg-red-500/20 text-red-300' :
              'bg-white/10 text-white/50'
            }`}>
              {status}
            </span>
          )}
        </div>

        {/* Airport codes — fixed height per side, terminal inline */}
        <div className="flex items-center justify-between">
          <div className="text-center min-w-[60px]">
            <p className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {depCode}
            </p>
            <p className="text-xs opacity-60 mt-1">
              {item.start_time && formatTime(item.start_time)}
              {depTerminal && <span className="opacity-50"> · T{depTerminal}</span>}
            </p>
          </div>
          <div className="flex-1 mx-3">
            <div className="flex items-center gap-1">
              <div className="w-1 h-1 rounded-full bg-[#F5EFE0]/30" />
              <div className="flex-1 border-t border-dashed border-[#F5EFE0]/15" />
              <div className="w-1 h-1 rounded-full bg-[#F5EFE0]/50" />
            </div>
            {aircraft && <p className="text-[9px] text-center opacity-20 mt-1">{aircraft}</p>}
          </div>
          <div className="text-center min-w-[60px]">
            <p className="text-xl font-bold tracking-tight" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
              {arrCode}
            </p>
            <p className="text-xs opacity-60 mt-1">
              {item.end_time && formatTime(item.end_time)}
              {arrTerminal && <span className="opacity-50"> · T{arrTerminal}</span>}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Restaurant card
  if (item.type === 'restaurant') {
    const lines = (item.description || '').split('\n')
    const getField = (key) => { const l = lines.find((l) => l.startsWith(key + ':')); return l ? l.slice(key.length + 1).trim() : '' }
    const website = getField('Website')
    const cuisine = getField('Cuisine')
    const phone = getField('Phone')

    // Determine meal type from time
    let meal = ''
    if (item.start_time) {
      const h = parseInt(item.start_time.split(':')[0])
      if (h < 11) meal = 'Breakfast'
      else if (h < 15) meal = 'Lunch'
      else if (h < 17) meal = 'Afternoon'
      else meal = 'Dinner'
    }

    return (
      <div
        onClick={() => onRestaurantClick?.(item)}
        className="group relative bg-[#1C3829] rounded-xl p-4 text-[#F5EFE0] hover:shadow-lg hover:shadow-[#1C3829]/20 transition-all cursor-pointer"
      >
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(item) }}
            className="w-6 h-6 rounded-md hover:bg-white/15 flex items-center justify-center text-[#F5EFE0]/30 hover:text-[#F5EFE0] transition-colors"
            title="Edit"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-7 7H1.5V8.5l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
            className="w-6 h-6 rounded-md hover:bg-red-500/20 flex items-center justify-center text-[#F5EFE0]/30 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>

        {/* Unified header: icon + cuisine label + meal tag */}
        <div className="flex items-center gap-2 mb-3">
          <ICONS.restaurant size={12} className="opacity-50" />
          <span className="text-[10px] font-medium opacity-40">{cuisine || 'Restaurant'}</span>
          {meal && (
            <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full ml-auto">{meal}</span>
          )}
        </div>

        {/* Restaurant name + address */}
        <h4
          className="text-base font-semibold leading-tight mb-1"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          {item.title}
        </h4>
        {item.location && <p className="text-[10px] opacity-40 mb-3">{item.location}</p>}

        {/* Time */}
        {(item.start_time || item.end_time) && (
          <p className="text-xs opacity-50">
            {item.start_time && formatTime(item.start_time)}
            {item.start_time && item.end_time && ' – '}
            {item.end_time && formatTime(item.end_time)}
          </p>
        )}

        {/* Footer */}
        {(website || phone) && (
          <div className="mt-3 pt-2 border-t border-white/8 flex items-center gap-3">
            {website && (
              <a href={website} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] opacity-30 hover:opacity-70 transition-opacity underline">
                Visit website →
              </a>
            )}
            {phone && <span className="text-[10px] opacity-20">{phone}</span>}
          </div>
        )}
      </div>
    )
  }

  const isColored = item.type === 'transport'
  const colorMap = {
    transport: { bg: '#1C3829' },
  }
  const color = colorMap[item.type]

  if (isColored) {
    const attachments = item._attachments || []
    const lines = (item.description || '').split('\n')
    const tTypeField = lines.find((l) => l.startsWith('TransportType:'))
    const tType = tTypeField ? tTypeField.slice(15).trim() : ''
    const descWithoutType = lines.filter((l) => !l.startsWith('TransportType:')).join('\n').trim()

    return (
      <div
        onClick={() => onDetailClick?.(item)}
        className="group relative rounded-xl overflow-hidden text-[#F5EFE0] hover:shadow-lg transition-all cursor-pointer" style={{ backgroundColor: color.bg }}
      >
        <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit?.(item) }}
            className="w-6 h-6 rounded-md hover:bg-white/15 flex items-center justify-center text-[#F5EFE0]/30 hover:text-[#F5EFE0] transition-colors"
            title="Edit"
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-7 7H1.5V8.5l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
            className="w-6 h-6 rounded-md hover:bg-red-500/20 flex items-center justify-center text-[#F5EFE0]/30 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </div>
        <div className="p-4">
          {/* Unified header: icon + label + transport type tag */}
          <div className="flex items-center gap-2 mb-3">
            <ICONS.transport size={12} className="opacity-50" />
            <span className="text-[10px] font-medium opacity-40">Transport</span>
            {tType && (
              <span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded-full ml-auto">{tType}</span>
            )}
          </div>

          {/* Title + details */}
          <h4
            className="text-base font-semibold leading-tight mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {item.title}
          </h4>
          {item.location && (
            <p className="text-[10px] opacity-40 mb-2">{item.location}</p>
          )}
          {(item.start_time || item.end_time) && (
            <p className="text-xs opacity-50">
              {item.start_time && formatTime(item.start_time)}
              {item.start_time && item.end_time && ' – '}
              {item.end_time && formatTime(item.end_time)}
            </p>
          )}
          {descWithoutType && (
            <p className="text-[10px] opacity-30 mt-1.5 leading-relaxed whitespace-pre-line">{descWithoutType}</p>
          )}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && (
          <div className="border-t border-white/8 px-4 py-2.5">
            <p className="text-[9px] font-semibold tracking-wider uppercase opacity-30 mb-2">Attachments</p>
            <div className="flex flex-wrap gap-2">
              {attachments.map((a) => {
                const fType = getFileIcon(a.file_type)
                const isImage = a.file_type?.startsWith('image/')
                return (
                  <a
                    key={a.id}
                    href={a.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/15 rounded-lg px-2.5 py-1.5 transition-colors"
                  >
                    {isImage ? (
                      <img src={a.file_url} alt="" className="w-6 h-6 rounded object-cover flex-shrink-0" />
                    ) : (
                      <div className={`w-6 h-6 rounded flex items-center justify-center flex-shrink-0 ${
                        fType === 'pdf' ? 'bg-red-500/20 text-red-300' : 'bg-white/10'
                      }`}>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                          <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                          <path d="M14 3v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
                        </svg>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[10px] font-medium truncate max-w-[120px]">{a.file_name}</p>
                      {a.file_size && <p className="text-[8px] opacity-40">{formatFileSize(a.file_size)}</p>}
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Activity & Note — light cards
  const isNote = item.type === 'note'

  // Parse link from description for display
  const descLines = (item.description || '').split('\n')
  const itemLink = descLines.find((l) => l.match(/^(Link|Website):\s*https?/i))
  const itemLinkUrl = itemLink ? itemLink.replace(/^(Link|Website):\s*/i, '').trim() : null

  return (
    <div
      onClick={() => onDetailClick?.(item)}
      className={`group rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer ${
        isNote
          ? 'bg-[#FDFAF0] border-[#E8DFC0]/60 hover:shadow-[#E8DFC0]/30'
          : 'bg-white border-[#1C3829]/8 hover:shadow-[#1C3829]/5'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isNote ? 'bg-[#E8DFC0]/40 text-[#8B7D5E]' : 'bg-[#1C3829]/5 text-[#1C3829]/50'
        }`}>
          {(() => { const I = ICONS[item.type]; return I ? <I size={18} /> : null })()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="text-sm font-semibold text-[#1a2b20] leading-tight">{item.title}</h4>
              {item.location && (
                <p className="text-xs text-[#7A8F82] mt-0.5">{item.location}</p>
              )}
            </div>
            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 flex-shrink-0 transition-all">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit?.(item) }}
                className="w-6 h-6 rounded-md hover:bg-[#1C3829]/8 flex items-center justify-center text-[#1C3829]/30 hover:text-[#1C3829] transition-colors"
                title="Edit"
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2-7 7H1.5V8.5l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
                className="w-6 h-6 rounded-md hover:bg-red-50 flex items-center justify-center text-[#1C3829]/30 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <span className="text-lg leading-none">&times;</span>
              </button>
            </div>
          </div>
          {(item.start_time || item.end_time) && (
            <p className="text-xs text-[#4A6356] mt-1.5">
              {item.start_time && formatTime(item.start_time)}
              {item.start_time && item.end_time && ' – '}
              {item.end_time && formatTime(item.end_time)}
            </p>
          )}
          {item.description && (
            <p className="text-xs text-[#7A8F82] mt-1.5 leading-relaxed whitespace-pre-line">{item.description}</p>
          )}
          {itemLinkUrl && (
            <a
              href={itemLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[10px] text-[#1C3829]/40 hover:text-[#1C3829] transition-colors mt-2 underline"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              {itemLinkUrl.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── Trip Detail Page ── */
export default function Trip() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trip, setTrip] = useState(null)
  const [members, setMembers] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showEditTrip, setShowEditTrip] = useState(false)
  const [addItemDate, setAddItemDate] = useState('')
  const [flightDetailItem, setFlightDetailItem] = useState(null)
  const [restaurantDetailItem, setRestaurantDetailItem] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [detailItem, setDetailItem] = useState(null)
  const [showInvite, setShowInvite] = useState(false)
  const [showTripDocs, setShowTripDocs] = useState(false)
  const [tripDocs, setTripDocs] = useState([])
  const [dayLocations, setDayLocations] = useState({})
  const [daySummaries, setDaySummaries] = useState({})
  const [dayNotes, setDayNotes] = useState({})
  const [useFahrenheit, setUseFahrenheit] = useState(true)
  const [weatherDetail, setWeatherDetail] = useState(null) // { city, dateStr }
  const [viewMode, setViewMode] = useState('itinerary') // 'itinerary' | 'timeline'
  const [selectedDays, setSelectedDays] = useState([]) // indices of selected days in timeline

  async function saveDayNote(dateStr, note) {
    const updated = { ...dayNotes, [dateStr]: note }
    if (!note) delete updated[dateStr]
    setDayNotes(updated)
    await supabase.from('trips').update({ day_notes: updated }).eq('id', id)
  }

  async function saveDaySummaries(updated) {
    setDaySummaries(updated)
    await supabase.from('trips').update({ day_summaries: updated }).eq('id', id)
  }

  async function saveDayLocation(dateStr, city) {
    const updated = { ...dayLocations }
    if (city) {
      updated[dateStr] = city
    } else {
      delete updated[dateStr]
    }
    setDayLocations(updated)
    await supabase.from('trips').update({ day_locations: updated }).eq('id', id)
  }

  const fetchTrip = async () => {
    const [tripRes, membersRes, itemsRes] = await Promise.all([
      supabase.from('trips').select('*').eq('id', id).single(),
      supabase.from('trip_members').select('*, profiles:user_id(full_name, avatar_url)').eq('trip_id', id),
      supabase.from('itinerary_items').select('*').eq('trip_id', id).order('date').order('start_time').order('sort_order'),
    ])

    if (tripRes.error) {
      console.error('Trip fetch error:', tripRes.error.message)
      navigate('/dashboard')
      return
    }

    setTrip(tripRes.data)
    setDayLocations(tripRes.data.day_locations || {})
    setDaySummaries(tripRes.data.day_summaries || {})
    setDayNotes(tripRes.data.day_notes || {})
    setMembers(membersRes.data || [])

    // Fetch attachments for transport items
    const allItems = itemsRes.data || []
    const transportIds = allItems.filter((i) => i.type === 'transport').map((i) => i.id)
    if (transportIds.length > 0) {
      const { data: attachments } = await supabase
        .from('attachments')
        .select('*')
        .in('item_id', transportIds)
      // Attach files to their items
      const attachMap = {}
      for (const a of (attachments || [])) {
        if (!attachMap[a.item_id]) attachMap[a.item_id] = []
        attachMap[a.item_id].push(a)
      }
      for (const item of allItems) {
        if (attachMap[item.id]) item._attachments = attachMap[item.id]
      }
    }

    setItems(allItems)

    // Fetch trip documents
    const { data: docs } = await supabase
      .from('trip_documents')
      .select('*')
      .eq('trip_id', id)
      .order('created_at', { ascending: false })
    setTripDocs(docs || [])

    setLoading(false)
  }

  useEffect(() => { fetchTrip() }, [id])

  async function handleDeleteItem(itemId) {
    await supabase.from('itinerary_items').delete().eq('id', itemId)
    setItems((prev) => prev.filter((i) => i.id !== itemId))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1C3829]/20 border-t-[#1C3829] rounded-full animate-spin" />
      </div>
    )
  }

  if (!trip) return null

  // Group items by date
  const dates = trip.start_date && trip.end_date
    ? getDateRange(trip.start_date, trip.end_date)
    : []

  // Items with dates in the range — lodging items span multiple days
  const itemsByDate = {}
  for (const item of items) {
    if (item.type === 'hotel') {
      const coMatch = (item.description || '').match(/Check-out:\s*(\d{4}-\d{2}-\d{2})/)
      const checkOutDate = coMatch ? coMatch[1] : null
      if (item.date && checkOutDate) {
        // Add full card to every night (check-in through day before check-out)
        const stayDates = getDateRange(item.date, checkOutDate)
        const nightDates = stayDates.slice(0, -1)
        for (const d of nightDates.length > 0 ? nightDates : [item.date]) {
          if (!itemsByDate[d]) itemsByDate[d] = []
          itemsByDate[d].push(item)
        }
        // Add a check-out marker on the check-out day
        if (!itemsByDate[checkOutDate]) itemsByDate[checkOutDate] = []
        itemsByDate[checkOutDate].push({ ...item, _checkoutMarker: true })
      } else {
        const key = item.date || 'unscheduled'
        if (!itemsByDate[key]) itemsByDate[key] = []
        itemsByDate[key].push(item)
      }
    } else {
      const key = item.date || 'unscheduled'
      if (!itemsByDate[key]) itemsByDate[key] = []
      itemsByDate[key].push(item)
    }
  }

  // If no date range, just show all items grouped by their dates
  const allDates = dates.length > 0
    ? dates
    : [...new Set(items.map((i) => i.date).filter(Boolean))].sort()

  const unscheduled = itemsByDate['unscheduled'] || []

  return (
    <div className="min-h-screen bg-[#F5EFE0]">

      <AppNav backTo="/dashboard" />

      {/* Hero banner */}
      <div className="relative h-52 sm:h-64 overflow-hidden">
        {trip.cover_url ? (
          <img src={trip.cover_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-[#1C3829]/10" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/20 to-transparent" />
        <div className="absolute bottom-6 left-6 sm:left-10 right-6 sm:right-10 z-10 flex items-end justify-between">
          <div>
            <h1
              className="text-3xl sm:text-4xl font-semibold text-[#F5EFE0] tracking-tight mb-1"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {trip.name}
            </h1>
            {trip.destination && (
              <p className="text-[#F5EFE0]/70 text-sm font-medium tracking-wide uppercase">
                {trip.destination}
              </p>
            )}
          </div>
          <button
            onClick={() => setShowEditTrip(true)}
            className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-[#F5EFE0]/80 hover:text-[#F5EFE0] hover:bg-white/25 px-3.5 py-2 rounded-full text-xs font-medium transition-all"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M8.5 1.5l2 2-7 7H1.5V8.5l7-7z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-6 sm:px-10 py-8">

        {/* Trip meta bar */}
        <div className="flex flex-wrap items-center gap-6 mb-10 pb-8 border-b border-[#1C3829]/8">
          {/* Dates */}
          <div>
            <p className="text-[10px] font-medium text-[#1C3829]/40 tracking-wider uppercase mb-1">Dates</p>
            <p className="text-sm text-[#1a2b20] font-medium">
              {formatDateRange(trip.start_date, trip.end_date)}
            </p>
          </div>

          {/* Members */}
          <div
            onClick={() => setShowInvite(true)}
            className="cursor-pointer group"
          >
            <p className="text-[10px] font-medium text-[#1C3829]/40 tracking-wider uppercase mb-1">Travelers</p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-1.5">
                {members.slice(0, 5).map((m, i) => (
                  <Avatar key={i} url={m.profiles?.avatar_url} name={m.profiles?.full_name} size="sm" border />
                ))}
                {/* Add person button */}
                <div className="w-7 h-7 rounded-full bg-[#1C3829]/5 border-2 border-[#F5EFE0] flex items-center justify-center text-[#1C3829]/30 group-hover:text-[#1C3829] group-hover:bg-[#1C3829]/10 transition-colors">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </div>
              </div>
              <span className="text-xs text-[#7A8F82] group-hover:text-[#1C3829] transition-colors">
                {members.length} {members.length === 1 ? 'traveler' : 'travelers'}
              </span>
            </div>
          </div>

          {/* Trip documents */}
          <div
            onClick={() => setShowTripDocs(true)}
            className="cursor-pointer group"
          >
            <p className="text-[10px] font-medium text-[#1C3829]/40 tracking-wider uppercase mb-1">Documents</p>
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-[#1C3829]/30 group-hover:text-[#1C3829] transition-colors">
                <path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
                <path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
              </svg>
              <span className="text-xs text-[#7A8F82] group-hover:text-[#1C3829] transition-colors">
                {tripDocs.length} {tripDocs.length === 1 ? 'file' : 'files'}
              </span>
            </div>
          </div>

          {/* Temp toggle + Add item */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex bg-[#1C3829]/5 rounded-full p-0.5">
              <button
                type="button"
                onClick={() => setUseFahrenheit(true)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                  useFahrenheit ? 'bg-[#1C3829] text-[#F5EFE0]' : 'text-[#1C3829]/40'
                }`}
              >
                °F
              </button>
              <button
                type="button"
                onClick={() => setUseFahrenheit(false)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                  !useFahrenheit ? 'bg-[#1C3829] text-[#F5EFE0]' : 'text-[#1C3829]/40'
                }`}
              >
                °C
              </button>
            </div>
            <button
              onClick={() => { setAddItemDate(''); setShowAddItem(true) }}
              className="btn-primary px-5 py-2.5 rounded-full text-sm font-semibold"
            >
              + Add item
            </button>
          </div>
        </div>

        {/* View toggle */}
        {allDates.length > 0 && (
          <div className="flex gap-1 bg-[#1C3829]/5 rounded-xl p-1 mb-8 max-w-xs">
            <button
              onClick={() => setViewMode('itinerary')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'itinerary' ? 'bg-[#1C3829] text-[#F5EFE0]' : 'text-[#1C3829]/50 hover:text-[#1C3829]'
              }`}
            >
              Itinerary
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'timeline' ? 'bg-[#1C3829] text-[#F5EFE0]' : 'text-[#1C3829]/50 hover:text-[#1C3829]'
              }`}
            >
              Timeline
            </button>
          </div>
        )}

        {/* ── Timeline View ── */}
        {viewMode === 'timeline' && allDates.length > 0 && (() => {
          // Calculate free time gaps between sorted items
          function getGaps(sortedItems) {
            const gaps = []
            for (let i = 0; i < sortedItems.length - 1; i++) {
              const curr = sortedItems[i]
              const next = sortedItems[i + 1]
              if (curr.end_time && next.start_time && curr.end_time < next.start_time) {
                const [ch, cm] = curr.end_time.split(':').map(Number)
                const [nh, nm] = next.start_time.split(':').map(Number)
                const mins = (nh * 60 + nm) - (ch * 60 + cm)
                if (mins >= 30) {
                  const hrs = Math.floor(mins / 60)
                  const m = mins % 60
                  gaps.push({
                    after: i,
                    label: hrs > 0 ? (m > 0 ? `${hrs}h ${m}m free` : `${hrs}h free`) : `${m}m free`,
                  })
                }
              }
            }
            return gaps
          }

          // Filter to selected days or show all
          const visibleDays = selectedDays.length > 0
            ? selectedDays.map((i) => ({ dateStr: allDates[i], dayIdx: i }))
            : allDates.map((dateStr, i) => ({ dateStr, dayIdx: i }))

          // Card width scales based on how many are visible
          const cardWidth = selectedDays.length === 1 ? '100%'
            : selectedDays.length === 2 ? 'calc(50% - 6px)'
            : selectedDays.length === 3 ? 'calc(33.33% - 8px)'
            : 240

          return (
            <div>
              {/* Day selector pills */}
              <div className="flex gap-1.5 mb-5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDays([])}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-colors ${
                    selectedDays.length === 0
                      ? 'bg-[#1C3829] text-[#F5EFE0]'
                      : 'bg-[#1C3829]/5 text-[#1C3829]/40 hover:text-[#1C3829]'
                  }`}
                >
                  All days
                </button>
                {allDates.map((dateStr, i) => {
                  const dd = new Date(dateStr + 'T00:00:00')
                  const isSelected = selectedDays.includes(i)
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => {
                        setSelectedDays((prev) => {
                          if (prev.includes(i)) return prev.filter((x) => x !== i)
                          return [...prev, i].sort((a, b) => a - b)
                        })
                      }}
                      className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-colors ${
                        isSelected
                          ? 'bg-[#1C3829] text-[#F5EFE0]'
                          : 'bg-[#1C3829]/5 text-[#1C3829]/40 hover:text-[#1C3829]'
                      }`}
                    >
                      {dd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </button>
                  )
                })}
              </div>

              {/* Day cards */}
              <div className={`flex gap-3 ${selectedDays.length > 0 && selectedDays.length <= 3 ? 'flex-wrap' : 'overflow-x-auto pb-4 min-w-max -mx-6 sm:-mx-10 px-6 sm:px-10'}`}>
                {visibleDays.map(({ dateStr, dayIdx }) => {
                  const allDayItems = itemsByDate[dateStr] || []
                  const checkoutItems = allDayItems.filter((i) => i._checkoutMarker)
                  const hotelStays = allDayItems.filter((i) => i.type === 'hotel' && !i._checkoutMarker)
                  const dayItems = allDayItems.filter((i) => i.type !== 'hotel' && !i._checkoutMarker)
                  const loc = dayLocations[dateStr]
                  const prevLoc = dayIdx > 0 ? dayLocations[allDates[dayIdx - 1]] : null
                  const cityChanged = loc && prevLoc && loc !== prevLoc
                  const d = new Date(dateStr + 'T00:00:00')
                  const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
                  const dayNum = d.getDate()

                  // Check if today is the check-in day for any hotel
                  const checkInToday = hotelStays.filter((h) => h.date === dateStr)

                  // Build timeline items: check-out first, then check-in as event, then everything else
                  const timelineItems = []
                  // Add check-in as a synthetic timed item
                  for (const h of checkInToday) {
                    if (h.start_time) {
                      timelineItems.push({ ...h, _synthetic: 'checkin', title: `Check in · ${h.title}` })
                    }
                  }
                  timelineItems.push(...dayItems)

                  const sorted = [...timelineItems].sort((a, b) => (a.start_time || 'zz').localeCompare(b.start_time || 'zz'))
                  const timed = sorted.filter((i) => i.start_time)
                  const untimed = sorted.filter((i) => !i.start_time)
                  const gaps = getGaps(timed)
                  const isEmpty = dayItems.length === 0 && checkoutItems.length === 0 && checkInToday.length === 0

                  // Get the lodging name for this night
                  const stayingAt = hotelStays.length > 0 ? hotelStays[0].title : null

                  return (
                    <div key={dateStr} className="flex flex-col flex-shrink-0" style={{ width: cardWidth, minWidth: selectedDays.length > 0 ? 0 : 240 }}>

                      {/* Day header */}
                      <div className={`rounded-t-xl px-4 py-3 ${
                        cityChanged || (dayIdx === 0 && loc)
                          ? 'bg-[#1C3829] text-[#F5EFE0]'
                          : 'bg-[#1C3829]/5'
                      }`}>
                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-2">
                            <span
                              className={`text-2xl font-bold tracking-tight ${
                                cityChanged || (dayIdx === 0 && loc) ? '' : 'text-[#1a2b20]'
                              }`}
                              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                            >
                              {dayNum}
                            </span>
                            <span className={`text-xs font-medium ${
                              cityChanged || (dayIdx === 0 && loc) ? 'opacity-50' : 'text-[#1C3829]/40'
                            }`}>
                              {dayName}
                            </span>
                          </div>
                          <span className={`text-[10px] font-medium ${
                            cityChanged || (dayIdx === 0 && loc) ? 'opacity-30' : 'text-[#1C3829]/20'
                          }`}>
                            Day {dayIdx + 1}
                          </span>
                        </div>
                        {loc && (
                          <div className="flex items-center gap-1.5 mt-1.5">
                            {cityChanged && (
                              <>
                                <span className={`text-[10px] ${cityChanged ? 'opacity-35 line-through' : 'text-[#7A8F82]'}`}>{prevLoc}</span>
                                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-30 flex-shrink-0">
                                  <path d="M2 5h6M6 3l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </>
                            )}
                            <span className={`text-xs font-semibold ${
                              cityChanged || (dayIdx === 0 && loc) ? '' : 'text-[#4A6356]'
                            }`}>
                              {loc}
                            </span>
                          </div>
                        )}
                      </div>
                      {stayingAt && (
                        <div className="bg-[#1C3829]/[0.06] px-4 py-2 flex items-center gap-1.5 border-x border-[#1C3829]/8">
                          <ICONS.hotel size={10} className="text-[#1C3829]/25 flex-shrink-0" />
                          <span className="text-[10px] text-[#4A6356] truncate">{stayingAt}</span>
                        </div>
                      )}

                      {/* Items stack */}
                      <div className="bg-white border border-t-0 border-[#1C3829]/8 rounded-b-xl flex-1 flex flex-col">

                        {/* Check-outs */}
                        {checkoutItems.map((item) => (
                          <div key={item.id + '-co'} className="flex items-center gap-2 px-3 py-2 border-b border-[#1C3829]/5">
                            <ICONS.hotel size={11} className="text-[#1C3829]/25 flex-shrink-0" />
                            <span className="text-[10px] text-[#1C3829]/40 truncate">Check-out</span>
                            {item.end_time && <span className="text-[9px] text-[#1C3829]/25 ml-auto flex-shrink-0">{formatTime(item.end_time)}</span>}
                          </div>
                        ))}

                        {/* Timed items with gap indicators */}
                        {timed.map((item, i) => {
                          const Icon = ICONS[item.type]
                          const isFlight = item.type === 'flight' && item.title.includes('→')
                          const gap = gaps.find((g) => g.after === i)

                          return (
                            <div key={item.id}>
                              <div className={`flex items-center gap-2.5 px-3 py-2.5 border-b border-[#1C3829]/5 ${
                                item.type === 'flight' || item.type === 'restaurant' || item.type === 'transport' || item._synthetic
                                  ? 'bg-[#1C3829]/3'
                                  : ''
                              }`}>
                                {/* Time */}
                                <span className="text-[10px] font-medium text-[#1C3829]/35 w-12 flex-shrink-0 text-right tabular-nums">
                                  {formatTime(item.start_time)}
                                </span>

                                {/* Type indicator bar */}
                                <div className={`w-0.5 self-stretch rounded-full flex-shrink-0 ${
                                  item.type === 'flight' ? 'bg-[#1C3829]' :
                                  item.type === 'hotel' ? 'bg-[#1C3829]/60' :
                                  item.type === 'restaurant' ? 'bg-[#1C3829]/45' :
                                  item.type === 'transport' ? 'bg-[#1C3829]/35' :
                                  item.type === 'note' ? 'bg-[#C4A35A]/40' :
                                  'bg-[#1C3829]/20'
                                }`} style={{ minHeight: 20 }} />

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    {Icon && <div className="text-[#1C3829]/35 flex-shrink-0"><Icon size={11} /></div>}
                                    <p className="text-xs font-semibold text-[#1a2b20] truncate">{item.title}</p>
                                  </div>
                                  {item.location && (
                                    <p className="text-[9px] text-[#7A8F82] truncate mt-0.5 ml-5">{item.location}</p>
                                  )}
                                </div>

                                {/* End time */}
                                {item.end_time && (
                                  <span className="text-[9px] text-[#1C3829]/20 flex-shrink-0">{formatTime(item.end_time)}</span>
                                )}
                              </div>

                              {/* Free time gap */}
                              {gap && (
                                <div className="flex items-center gap-2 px-3 py-1.5">
                                  <div className="w-12 flex-shrink-0" />
                                  <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1 border-t border-dashed border-[#1C3829]/8" />
                                    <span className="text-[9px] text-[#1C3829]/20 italic whitespace-nowrap">{gap.label}</span>
                                    <div className="flex-1 border-t border-dashed border-[#1C3829]/8" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {/* Untimed items */}
                        {untimed.map((item) => {
                          const Icon = ICONS[item.type]
                          return (
                            <div key={item.id} className="flex items-center gap-2.5 px-3 py-2 border-b border-[#1C3829]/5">
                              <span className="text-[10px] text-[#1C3829]/15 w-12 flex-shrink-0 text-right">—</span>
                              <div className="w-0.5 self-stretch rounded-full bg-[#1C3829]/10 flex-shrink-0" style={{ minHeight: 16 }} />
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                {Icon && <div className="text-[#1C3829]/25 flex-shrink-0"><Icon size={11} /></div>}
                                <p className="text-[10px] text-[#1C3829]/40 truncate">{item.title}</p>
                              </div>
                            </div>
                          )
                        })}

                        {/* Empty state */}
                        {isEmpty && (
                          <div className="flex-1 flex items-center justify-center py-8">
                            <span className="text-[10px] text-[#1C3829]/15 italic">Free day</span>
                          </div>
                        )}

                        {/* Day has items but none timed */}
                        {dayItems.length > 0 && timed.length === 0 && untimed.length === 0 && (
                          <div className="py-3" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* ── Itinerary View (day by day) ── */}
        {viewMode === 'itinerary' && (allDates.length > 0 || unscheduled.length > 0 || items.length === 0) ? (
          <div className="space-y-8">
            {allDates.map((dateStr, dayIdx) => {
              const dayItems = itemsByDate[dateStr] || []
              return (
                <div key={dateStr}>
                  {/* Day header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#1C3829] flex items-center justify-center text-[#F5EFE0] text-xs font-bold flex-shrink-0 mt-0.5">
                      {dayIdx + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p
                          className="text-base font-semibold text-[#1a2b20]"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {formatDate(dateStr)}
                        </p>
                        <button
                          onClick={() => { setAddItemDate(dateStr); setShowAddItem(true) }}
                          className="text-xs text-[#1C3829]/35 hover:text-[#1C3829] transition-colors font-medium"
                        >
                          + Add
                        </button>
                      </div>
                      <div className="flex items-center">
                        <DayLocationPicker
                          value={dayLocations[dateStr] || ''}
                          onSave={(city) => saveDayLocation(dateStr, city)}
                        />
                        <DayWeather
                          city={dayLocations[dateStr]}
                          dateStr={dateStr}
                          useFahrenheit={useFahrenheit}
                          onClick={setWeatherDetail}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Day summary + notes — side by side */}
                  <div className="ml-11 mb-5 grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <p className="text-[9px] font-semibold text-[#1C3829]/25 tracking-wider uppercase mb-1.5">Summary</p>
                      <DaySummary
                        items={dayItems}
                        location={dayLocations[dateStr]}
                        dateStr={dateStr}
                        tripId={id}
                        cachedSummaries={daySummaries}
                        onSummaryGenerated={saveDaySummaries}
                      />
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-[#1C3829]/25 tracking-wider uppercase mb-1.5">Notes</p>
                      <DayNotes
                        value={dayNotes[dateStr]}
                        onSave={(note) => saveDayNote(dateStr, note)}
                      />
                    </div>
                  </div>

                  {/* Day items grouped by type */}
                  {dayItems.length > 0 ? (
                    <div className="ml-11 space-y-5">
                      {SECTION_ORDER.map((sectionType) => {
                        const sectionItems = dayItems.filter((it) => {
                          if (sectionType === 'hotel') return it.type === 'hotel' && !it._checkoutMarker
                          return it.type === sectionType
                        })
                        // Also include check-out markers in hotel section
                        const checkoutItems = sectionType === 'hotel'
                          ? dayItems.filter((it) => it.type === 'hotel' && it._checkoutMarker)
                          : []
                        const allSectionItems = [...checkoutItems, ...sectionItems]
                        if (allSectionItems.length === 0) return null
                        const typeInfo = ITEM_TYPES.find((t) => t.value === sectionType)
                        const Icon = ICONS[sectionType]
                        return (
                          <div key={sectionType}>
                            <div className="flex items-center gap-2.5 mb-3 mt-1">
                              <div className="w-6 h-6 rounded-md bg-[#1C3829]/8 flex items-center justify-center text-[#1C3829]/50">
                                <Icon size={13} />
                              </div>
                              <span className="text-xs font-semibold text-[#1C3829]/50 tracking-wide uppercase">
                                {typeInfo?.label}
                              </span>
                              <div className="flex-1 h-px bg-[#1C3829]/10" />
                            </div>
                            <div className="space-y-2">
                              {allSectionItems.map((item, idx) => (
                                <ItemCard key={item.id + (item._checkoutMarker ? '-co' : '') + idx} item={item} onDelete={handleDeleteItem} onFlightClick={setFlightDetailItem} onRestaurantClick={setRestaurantDetailItem} onEdit={setEditItem} onDetailClick={setDetailItem} />
                              ))}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="ml-11 py-4 text-xs text-[#1C3829]/25 italic">
                      Nothing planned yet
                    </div>
                  )}
                </div>
              )
            })}

            {/* Unscheduled items */}
            {unscheduled.length > 0 && (
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 rounded-full bg-[#1C3829]/10 flex items-center justify-center text-[#1C3829]/40 text-xs font-bold flex-shrink-0">
                    ?
                  </div>
                  <p
                    className="text-base font-semibold text-[#1a2b20]/50"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Unscheduled
                  </p>
                </div>
                <div className="space-y-2 ml-11">
                  {unscheduled.map((item) => (
                    <ItemCard key={item.id} item={item} onDelete={handleDeleteItem} onFlightClick={setFlightDetailItem} onRestaurantClick={setRestaurantDetailItem} onEdit={setEditItem} onDetailClick={setDetailItem} />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {items.length === 0 && allDates.length === 0 && (
              <div className="text-center py-16">
                <p
                  className="text-2xl font-semibold text-[#1a2b20] mb-2 tracking-tight"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
                >
                  Start building your itinerary
                </p>
                <p className="text-sm text-[#4A6356] mb-6">
                  Add flights, hotels, restaurants, and activities.
                </p>
                <button
                  onClick={() => { setAddItemDate(''); setShowAddItem(true) }}
                  className="btn-primary px-6 py-3 rounded-full text-sm font-semibold"
                >
                  + Add your first item
                </button>
              </div>
            )}
          </div>
        ) : null}
      </main>

      <AddItemModal
        open={showAddItem}
        onClose={() => setShowAddItem(false)}
        onCreated={() => { setShowAddItem(false); fetchTrip() }}
        tripId={id}
        userId={user?.id}
        defaultDate={addItemDate}
        nearCity={addItemDate ? dayLocations[addItemDate] : null}
        tripDestination={trip?.destination?.split(' → ')[0]}
        allDayLocations={dayLocations}
      />

      <FlightDetailModal
        open={!!flightDetailItem}
        onClose={() => setFlightDetailItem(null)}
        item={flightDetailItem}
      />

      <ItemDetailModal
        open={!!detailItem}
        onClose={() => setDetailItem(null)}
        item={detailItem}
        onEdit={(item) => { setDetailItem(null); setEditItem(item) }}
      />

      <EditItemModal
        open={!!editItem}
        onClose={() => setEditItem(null)}
        item={editItem}
        onSaved={() => { setEditItem(null); fetchTrip() }}
      />

      <RestaurantDetailModal
        open={!!restaurantDetailItem}
        onClose={() => setRestaurantDetailItem(null)}
        item={restaurantDetailItem}
      />

      <WeatherDetailModal
        open={!!weatherDetail}
        onClose={() => setWeatherDetail(null)}
        city={weatherDetail?.city}
        dateStr={weatherDetail?.dateStr}
        useFahrenheit={useFahrenheit}
      />

      <TripDocsModal
        open={showTripDocs}
        onClose={() => setShowTripDocs(false)}
        tripId={id}
        userId={user?.id}
        docs={tripDocs}
        onChanged={() => fetchTrip()}
      />

      <InviteModal
        open={showInvite}
        onClose={() => setShowInvite(false)}
        trip={trip}
        members={members}
        userId={user?.id}
        onMembersChanged={() => { setShowInvite(false); fetchTrip() }}
      />

      <EditTripModal
        open={showEditTrip}
        onClose={() => setShowEditTrip(false)}
        trip={trip}
        onSaved={(action) => {
          setShowEditTrip(false)
          if (action === 'deleted') {
            navigate('/dashboard')
          } else {
            fetchTrip()
          }
        }}
      />
    </div>
  )
}
