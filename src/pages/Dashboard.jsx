import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate, Link } from 'react-router-dom'
import Logo from '../components/Logo'
import Avatar from '../components/Avatar'
import AppNav from '../components/AppNav'
/* ── Photon geocoder (OpenStreetMap) ── */
async function searchCities(query) {
  if (!query || query.length < 2) return []
  try {
    const res = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=6&lang=en`
    )
    if (!res.ok) return []
    const data = await res.json()
    const validTypes = new Set([
      'city', 'town', 'village', 'locality', 'borough',
      'suburb', 'district', 'county', 'state', 'country',
      'island', 'region', 'hamlet',
    ])
    return data.features
      .filter((f) => validTypes.has(f.properties.type))
      .map((f) => {
        const p = f.properties
        const parts = [p.state, p.country].filter(Boolean)
        return {
          name: p.name,
          detail: parts.join(', '),
          key: `${p.osm_id}-${p.type}`,
        }
      })
      // deduplicate by name + detail
      .filter((v, i, a) => a.findIndex((x) => x.name === v.name && x.detail === v.detail) === i)
  } catch {
    return []
  }
}

const UNS = 'https://images.unsplash.com/photo-'

const DEFAULT_COVERS = [
  { id: '1499856871958-5b9627545d1a', label: 'Paris' },
  { id: '1523906834658-6e24ef2386f9', label: 'Venice' },
  { id: '1516483638261-f4dbaf036963', label: 'Coastal' },
  { id: '1533105079780-92b9be482077', label: 'Santorini' },
  { id: '1476514525535-07fb3b4ae5f1', label: 'Mountains' },
  { id: '1493976040374-85c8e12f0c0e', label: 'Kyoto' },
  { id: '1540959733332-eab4deabeeaf', label: 'Tokyo' },
  { id: '1488646953014-85cb44e25828', label: 'Beach' },
]

function defaultCoverUrl(id, w = 800, h = 500) {
  return `${UNS}${id}?auto=format&fit=crop&w=${w}&h=${h}&q=80`
}

function formatDateRange(start, end) {
  const opts = { month: 'short', day: 'numeric' }
  const yearOpts = { ...opts, year: 'numeric' }
  const toLocal = (d) => new Date(d + 'T00:00:00')
  if (!start && !end) return 'Dates not set'
  if (start && !end) return `From ${toLocal(start).toLocaleDateString('en-US', yearOpts)}`
  if (!start && end) return `Until ${toLocal(end).toLocaleDateString('en-US', yearOpts)}`
  const s = toLocal(start)
  const e = toLocal(end)
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-US', opts)} – ${e.toLocaleDateString('en-US', yearOpts)}`
  }
  return `${s.toLocaleDateString('en-US', yearOpts)} – ${e.toLocaleDateString('en-US', yearOpts)}`
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase()
}

/* ── Custom Date Picker ── */
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function DatePicker({ value, onChange, label, minDate }) {
  const [open, setOpen] = useState(false)
  const [viewDate, setViewDate] = useState(() => {
    if (value) return new Date(value + 'T00:00:00')
    return new Date()
  })
  const ref = useRef(null)

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const selectedStr = value || ''
  const minStr = minDate || ''

  function pad(n) { return String(n).padStart(2, '0') }
  function toStr(y, m, d) { return `${y}-${pad(m + 1)}-${pad(d)}` }

  function selectDay(day) {
    const str = toStr(year, month, day)
    if (minStr && str < minStr) return
    onChange(str)
    setOpen(false)
  }

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1))
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1))
  }

  const displayValue = value
    ? new Date(value + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-[#1a2b20] mb-1">{label}</label>
      <button
        type="button"
        onClick={() => {
          if (!open && value) setViewDate(new Date(value + 'T00:00:00'))
          setOpen(!open)
        }}
        className="w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 text-left flex items-center justify-between"
      >
        {displayValue ? (
          <span className="text-[#1a2b20]">{displayValue}</span>
        ) : (
          <span className="text-[#1C3829]/30">Pick a date</span>
        )}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#1C3829]/30 flex-shrink-0">
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2" />
          <path d="M2 6.5h12" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5.5 1.5v3M10.5 1.5v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-2 left-0 bg-white rounded-2xl border border-[#1C3829]/10 shadow-xl shadow-[#1C3829]/10 p-4 w-[280px]">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 rounded-full hover:bg-[#1C3829]/5 flex items-center justify-center text-[#1C3829]/50 hover:text-[#1C3829] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M8.5 3.5L5 7l3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span
              className="text-sm font-semibold text-[#1a2b20] tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '16px' }}
            >
              {MONTHS[month]} {year}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 rounded-full hover:bg-[#1C3829]/5 flex items-center justify-center text-[#1C3829]/50 hover:text-[#1C3829] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5.5 3.5L9 7l-3.5 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-[#1C3829]/35 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7">
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />
              const str = toStr(year, month, day)
              const isSelected = str === selectedStr
              const isToday = year === today.getFullYear() && month === today.getMonth() && day === today.getDate()
              const isDisabled = minStr && str < minStr

              return (
                <button
                  key={str}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  className={`w-8 h-8 mx-auto rounded-full text-xs font-medium flex items-center justify-center transition-all
                    ${isSelected
                      ? 'bg-[#1C3829] text-[#F5EFE0]'
                      : isToday
                        ? 'bg-[#1C3829]/8 text-[#1C3829] font-semibold'
                        : isDisabled
                          ? 'text-[#1C3829]/15 cursor-not-allowed'
                          : 'text-[#1a2b20] hover:bg-[#1C3829]/8'
                    }`}
                >
                  {day}
                </button>
              )
            })}
          </div>

          {/* Clear */}
          {value && (
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="mt-3 w-full text-center text-xs text-[#1C3829]/40 hover:text-[#1C3829] transition-colors"
            >
              Clear date
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Unsplash search ── */
const UNSPLASH_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY

async function searchUnsplash(query) {
  if (!UNSPLASH_KEY || !query) return null
  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' travel')}&per_page=8&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.results.map((p) => ({
      id: p.id,
      url: p.urls.regular,
      thumb: p.urls.small,
      alt: p.alt_description || query,
      credit: p.user?.name,
      city: query,
    }))
  } catch {
    return null
  }
}

/* ── Tag Input with live geocoding autocomplete + drag-to-reorder ── */
function TagInput({ tags, onChange, placeholder }) {
  const [input, setInput] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [activeIdx, setActiveIdx] = useState(-1)
  const [showDropdown, setShowDropdown] = useState(false)
  const [searching, setSearching] = useState(false)
  const [dragIdx, setDragIdx] = useState(null)
  const [dropIdx, setDropIdx] = useState(null)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)

  // Debounced geocoding search
  useEffect(() => {
    if (input.length < 2) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    setSearching(true)
    const timer = setTimeout(async () => {
      const results = await searchCities(input)
      setSuggestions(results)
      setShowDropdown(results.length > 0)
      setActiveIdx(-1)
      setSearching(false)
    }, 300)
    return () => { clearTimeout(timer); setSearching(false) }
  }, [input])

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function addCity(name) {
    if (name) {
      onChange([...tags, name])
    }
    setInput('')
    setShowDropdown(false)
    setActiveIdx(-1)
    inputRef.current?.focus()
  }

  function handleKeyDown(e) {
    if (showDropdown && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => (i < suggestions.length - 1 ? i + 1 : 0))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => (i > 0 ? i - 1 : suggestions.length - 1))
        return
      }
      if (e.key === 'Enter' && activeIdx >= 0) {
        e.preventDefault()
        addCity(suggestions[activeIdx].name)
        return
      }
      if (e.key === 'Escape') {
        setShowDropdown(false)
        setActiveIdx(-1)
        return
      }
    }
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault()
      addCity(input.trim())
    }
    if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1))
    }
  }

  // Drag-and-drop handlers
  function handleDragStart(e, i) {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }

  function handleDragOver(e, i) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragIdx !== null && i !== dragIdx) {
      setDropIdx(i)
    }
  }

  function handleDragLeave() {
    setDropIdx(null)
  }

  function handleDrop(e, i) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === i) {
      setDragIdx(null)
      setDropIdx(null)
      return
    }
    const next = [...tags]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(i, 0, moved)
    onChange(next)
    setDragIdx(null)
    setDropIdx(null)
  }

  function handleDragEnd() {
    setDragIdx(null)
    setDropIdx(null)
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex flex-wrap items-center gap-1.5 border border-[#1C3829]/15 rounded-xl px-3 py-2.5 bg-[#F5EFE0]/50 focus-within:ring-2 focus-within:ring-[#1C3829]/30 focus-within:border-transparent min-h-[44px]">
        {tags.map((tag, i) => (
          <span key={tag + i} className="inline-flex items-center">
            {/* Drop indicator — left side */}
            {dropIdx === i && dragIdx !== null && dragIdx > i && (
              <span className="w-0.5 h-5 bg-[#1C3829] rounded-full mr-1 animate-pulse" />
            )}
            <span
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              className={`inline-flex items-center gap-1 bg-[#1C3829] text-[#F5EFE0] text-xs font-medium pl-1.5 pr-1.5 py-1 rounded-full cursor-grab active:cursor-grabbing select-none transition-opacity ${
                dragIdx === i ? 'opacity-40' : ''
              }`}
            >
              {/* Order number */}
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[9px] font-bold flex-shrink-0">
                {i + 1}
              </span>
              <span className="px-0.5">{tag}</span>
              <button
                type="button"
                onClick={() => onChange(tags.filter((_, j) => j !== i))}
                className="w-4 h-4 rounded-full hover:bg-white/20 flex items-center justify-center text-[#F5EFE0]/70 hover:text-[#F5EFE0] transition-colors"
              >
                &times;
              </button>
            </span>
            {/* Drop indicator — right side */}
            {dropIdx === i && dragIdx !== null && dragIdx < i && (
              <span className="w-0.5 h-5 bg-[#1C3829] rounded-full ml-1 animate-pulse" />
            )}
            {/* Arrow between tags */}
            {i < tags.length - 1 && (
              <span className="text-[#1C3829]/25 text-sm select-none mx-0.5">→</span>
            )}
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.replace(',', ''))}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (suggestions.length > 0) setShowDropdown(true) }}
          placeholder={tags.length === 0 ? placeholder : 'Add city...'}
          className="flex-1 min-w-[100px] text-sm bg-transparent outline-none placeholder:text-[#1C3829]/30"
          autoComplete="off"
        />
        {searching && (
          <div className="w-4 h-4 border-2 border-[#1C3829]/15 border-t-[#1C3829]/50 rounded-full animate-spin flex-shrink-0" />
        )}
      </div>

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#1C3829]/10 shadow-lg shadow-[#1C3829]/8 overflow-hidden py-1">
          {suggestions.map((s, i) => (
            <button
              key={s.key}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addCity(s.name)}
              className={`w-full text-left px-4 py-2.5 flex items-center gap-2 transition-colors ${
                i === activeIdx
                  ? 'bg-[#1C3829]/8'
                  : 'hover:bg-[#1C3829]/5'
              }`}
            >
              <span className="text-sm text-[#1a2b20] font-medium">{s.name}</span>
              {s.detail && (
                <span className="text-xs text-[#7A8F82]">{s.detail}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Create Trip Modal ── */
function CreateTripModal({ open, onClose, onCreated, userId }) {
  const [name, setName] = useState('')
  const [destinations, setDestinations] = useState([])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [coverUrl, setCoverUrl] = useState(defaultCoverUrl(DEFAULT_COVERS[0].id, 1200, 800))
  const [coverThumb, setCoverThumb] = useState(defaultCoverUrl(DEFAULT_COVERS[0].id, 200, 150))
  const [searchPhotos, setSearchPhotos] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Search Unsplash for ALL destinations, merge results
  useEffect(() => {
    if (destinations.length === 0) {
      setSearchPhotos(null)
      return
    }
    let cancelled = false
    setSearchLoading(true)

    const photosPerCity = Math.max(2, Math.floor(8 / destinations.length))

    Promise.all(
      destinations.map((city) => searchUnsplash(city))
    ).then((allResults) => {
      if (cancelled) return
      // Take photosPerCity from each city, interleave, cap at 8
      const merged = []
      const seen = new Set()
      for (let round = 0; round < photosPerCity; round++) {
        for (const results of allResults) {
          if (!results || round >= results.length) continue
          const p = results[round]
          if (!seen.has(p.id)) {
            seen.add(p.id)
            merged.push(p)
          }
          if (merged.length >= 8) break
        }
        if (merged.length >= 8) break
      }
      setSearchPhotos(merged.length > 0 ? merged : null)
      setSearchLoading(false)
      // Auto-select first result if no cover was manually picked
      if (merged.length > 0 && !seen.has('manual')) {
        setCoverUrl(merged[0].url)
        setCoverThumb(merged[0].thumb)
      }
    })

    return () => { cancelled = true }
  }, [destinations])

  function selectCover(url, thumb) {
    setCoverUrl(url)
    setCoverThumb(thumb)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const destinationStr = destinations.join(' → ') || null

    const { error } = await supabase.from('trips').insert({
      owner_id: userId,
      name,
      destination: destinationStr,
      start_date: startDate || null,
      end_date: endDate || null,
      cover_url: coverUrl,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setName('')
      setDestinations([])
      setStartDate('')
      setEndDate('')
      setCoverUrl(defaultCoverUrl(DEFAULT_COVERS[0].id, 1200, 800))
      setCoverThumb(defaultCoverUrl(DEFAULT_COVERS[0].id, 200, 150))
      setSearchPhotos(null)
      setLoading(false)
      onCreated()
    }
  }

  if (!open) return null

  const inputClass =
    'w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent'

  // Photo grid: Unsplash results or defaults
  const photos = searchPhotos
    ? searchPhotos.map((p) => ({ key: p.id, thumb: p.thumb, full: p.url, alt: p.alt, city: p.city }))
    : DEFAULT_COVERS.map((c) => ({
        key: c.id,
        thumb: defaultCoverUrl(c.id, 200, 150),
        full: defaultCoverUrl(c.id, 1200, 800),
        alt: c.label,
        city: c.label,
      }))

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#1C3829]/10 overflow-hidden max-h-[90vh] overflow-y-auto">

        {/* Cover preview */}
        <div className="relative h-40 overflow-hidden bg-[#1C3829]/10">
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover transition-all duration-300"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {destinations.length > 0 && (
            <p className="absolute bottom-3 left-4 text-[#F5EFE0]/80 text-xs font-medium tracking-wide uppercase z-10">
              {destinations.join(' → ')}
            </p>
          )}
          <button
            onClick={onClose}
            type="button"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/30 backdrop-blur-sm text-white/80 hover:text-white flex items-center justify-center text-lg transition-colors"
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
              placeholder="e.g. Summer in Europe"
              className={inputClass}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-1">
              Destinations
              <span className="font-normal text-[#1C3829]/40 ml-1">
                (press Enter after each city)
              </span>
            </label>
            <TagInput
              tags={destinations}
              onChange={setDestinations}
              placeholder="e.g. Paris"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <DatePicker
              label="Start date"
              value={startDate}
              onChange={setStartDate}
            />
            <DatePicker
              label="End date"
              value={endDate}
              onChange={setEndDate}
              minDate={startDate}
            />
          </div>

          {/* Cover photo picker */}
          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-2">
              Cover photo
              {searchPhotos && destinations.length > 0 && (
                <span className="font-normal text-[#1C3829]/40 ml-1">
                  results for {destinations.join(', ')}
                </span>
              )}
            </label>

            {searchLoading ? (
              <div className="flex items-center justify-center py-6">
                <div className="w-5 h-5 border-2 border-[#1C3829]/20 border-t-[#1C3829] rounded-full animate-spin" />
                <span className="text-xs text-[#1C3829]/40 ml-2">Searching photos...</span>
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {photos.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => selectCover(p.full, p.thumb)}
                    className={`relative aspect-[4/3] rounded-lg overflow-hidden transition-all ${
                      coverThumb === p.thumb
                        ? 'ring-2 ring-[#1C3829] ring-offset-2'
                        : 'opacity-55 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={p.thumb}
                      alt={p.alt}
                      className="w-full h-full object-cover"
                    />
                    {p.city && (
                      <span className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1 text-[8px] text-white/80 font-medium tracking-wide truncate">
                        {p.city}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Create trip'}
          </button>
        </form>
      </div>
    </div>
  )
}

/* ── Trip Card ── */
function TripCard({ trip }) {
  const navigate = useNavigate()
  const memberCount = trip.trip_members?.length || 1

  return (
    <div
      onClick={() => navigate(`/trip/${trip.id}`)}
      className="group bg-white rounded-2xl border border-[#1C3829]/8 overflow-hidden hover:shadow-xl hover:shadow-[#1C3829]/8 hover:-translate-y-1 transition-all duration-300 cursor-pointer"
    >
      <div className="relative h-40 overflow-hidden">
        {trip.cover_url ? (
          <img
            src={trip.cover_url}
            alt={trip.destination || trip.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-[#1C3829]/10 flex items-center justify-center">
            <span className="text-3xl">🗺️</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        {trip.destination && (
          <p className="absolute bottom-3 left-4 text-[#F5EFE0]/90 text-xs font-medium tracking-wide uppercase z-10">
            {trip.destination}
          </p>
        )}
      </div>

      <div className="p-5">
        <h3
          className="text-[#1a2b20] font-semibold text-base mb-1"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          {trip.name}
        </h3>
        <p className="text-[#7A8F82] text-xs mb-4">
          {formatDateRange(trip.start_date, trip.end_date)}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-1.5">
            {(trip.trip_members || []).slice(0, 4).map((m, i) => (
              <Avatar key={i} url={m.profiles?.avatar_url} name={m.profiles?.full_name} size="sm" border />
            ))}
            {memberCount > 4 && (
              <div className="w-7 h-7 rounded-full bg-[#1C3829]/10 border-2 border-white flex items-center justify-center text-[10px] text-[#1C3829] font-medium">
                +{memberCount - 4}
              </div>
            )}
          </div>
          <span className="text-[#7A8F82] text-xs">
            {memberCount} {memberCount === 1 ? 'traveler' : 'travelers'}
          </span>
        </div>
      </div>
    </div>
  )
}

/* ── Dashboard ── */
export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loadingTrips, setLoadingTrips] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const firstName =
    user?.user_metadata?.full_name?.split(' ')[0] || 'traveler'

  const fetchTrips = useCallback(async () => {
    // Step 1: get trips (RLS filters to user's trips)
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Trips query:', { data, error, userId: user?.id })

    if (error) {
      console.error('Failed to fetch trips:', error.message)
      setTrips([])
      setLoadingTrips(false)
      return
    }

    if (!data || data.length === 0) {
      setTrips([])
      setLoadingTrips(false)
      return
    }

    // Step 2: get members for those trips
    const tripIds = data.map((t) => t.id)
    const { data: members } = await supabase
      .from('trip_members')
      .select('trip_id, user_id, role, profiles:user_id(full_name, avatar_url)')
      .in('trip_id', tripIds)

    // Attach members to trips
    const tripsWithMembers = data.map((trip) => ({
      ...trip,
      trip_members: (members || []).filter((m) => m.trip_id === trip.id),
    }))

    setTrips(tripsWithMembers)
    setLoadingTrips(false)
  }, [user?.id])

  useEffect(() => {
    fetchTrips()
  }, [fetchTrips])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#F5EFE0]">

      <AppNav showFriends />

      <main className="max-w-5xl mx-auto px-6 sm:px-10 py-10">

        <div className="mb-10">
          <h1
            className="text-3xl sm:text-4xl font-semibold text-[#1a2b20] tracking-tight mb-1"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            {getGreeting()}, {firstName}.
          </h1>
          <p className="text-[#4A6356] text-sm">Plan your next adventure.</p>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-sm font-semibold text-[#1a2b20] tracking-wide uppercase"
            style={{ letterSpacing: '0.12em', fontSize: '11px' }}
          >
            Your trips
          </h2>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary px-5 py-2.5 rounded-full text-sm font-semibold"
          >
            + New trip
          </button>
        </div>

        {loadingTrips && (
          <div className="text-center py-24">
            <div className="inline-block w-6 h-6 border-2 border-[#1C3829]/20 border-t-[#1C3829] rounded-full animate-spin" />
          </div>
        )}

        {!loadingTrips && trips.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#1C3829]/5 mb-6">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="12" stroke="#1C3829" strokeWidth="1" opacity="0.2" />
                <path d="M8 22C12 10 22 8 26 14" stroke="#1C3829" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2.5 3" opacity="0.35" />
                <circle cx="8" cy="22" r="1.5" fill="#1C3829" opacity="0.3" />
                <circle cx="26" cy="14" r="2" fill="#1C3829" opacity="0.6" />
              </svg>
            </div>
            <h3
              className="text-2xl sm:text-3xl font-semibold text-[#1a2b20] mb-2 tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
            >
              Where to next?
            </h3>
            <p className="text-sm text-[#4A6356] mb-8 max-w-xs mx-auto">
              Create your first trip and start building your itinerary.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="btn-primary px-7 py-3 rounded-full text-sm font-semibold"
            >
              + Create your first trip
            </button>
          </div>
        )}

        {!loadingTrips && trips.length > 0 && (() => {
          const today = new Date().toISOString().split('T')[0]
          const current = trips.filter((t) => t.start_date && t.end_date && t.start_date <= today && t.end_date >= today)
          const upcoming = trips.filter((t) => !t.start_date || t.start_date > today)
          const past = trips.filter((t) => t.end_date && t.end_date < today && !(t.start_date <= today && t.end_date >= today))

          function TripSection({ title, items, badge }) {
            if (items.length === 0) return null
            return (
              <div className="mb-10">
                <div className="flex items-center gap-2 mb-4">
                  <h2
                    className="text-xl font-semibold text-[#1a2b20] tracking-tight"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    {title}
                  </h2>
                  {badge && (
                    <span className="text-[10px] font-semibold text-[#1C3829]/40 bg-[#1C3829]/5 px-2 py-0.5 rounded-full">
                      {items.length}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {items.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                </div>
              </div>
            )
          }

          return (
            <>
              <TripSection title="Happening Now" items={current} />
              <TripSection title="Upcoming" items={upcoming} badge />
              <TripSection title="Past Trips" items={past} badge />
            </>
          )
        })()}
      </main>

      <CreateTripModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => {
          setShowCreate(false)
          fetchTrips()
        }}
        userId={user?.id}
      />
    </div>
  )
}
