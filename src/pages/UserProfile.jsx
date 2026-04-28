import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'
import Avatar from '../components/Avatar'
import AppNav from '../components/AppNav'
import { getStampConfig } from '../data/countryStamps'

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length === 1 ? parts[0].charAt(0).toUpperCase() : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/* ── Passport Stamp Component ── */
function PassportStamp({ country, size = 'md' }) {
  const cfg = getStampConfig(country)
  const s = size === 'sm' ? 80 : size === 'lg' ? 140 : 110

  return (
    <div
      className="relative flex-shrink-0 select-none"
      style={{ width: s, height: s }}
      title={country}
    >
      <svg width={s} height={s} viewBox="0 0 100 100" fill="none">
        {/* Outer ring */}
        <circle cx="50" cy="50" r="46" stroke={cfg.color} strokeWidth="2.5" opacity="0.8" />
        <circle cx="50" cy="50" r="42" stroke={cfg.color} strokeWidth="0.8" opacity="0.3" />

        {/* Dashed decorative ring */}
        <circle cx="50" cy="50" r="39" stroke={cfg.color} strokeWidth="0.5" strokeDasharray="3 2" opacity="0.25" />

        {/* Top arc text path */}
        <path id={`arc-${country}`} d="M 15,50 A 35,35 0 0,1 85,50" fill="none" />
        <text fill={cfg.color} opacity="0.7" fontSize="5.5" fontWeight="700" letterSpacing="2.5" fontFamily="'DM Sans', sans-serif">
          <textPath href={`#arc-${country}`} startOffset="50%" textAnchor="middle">
            {cfg.label}
          </textPath>
        </text>

        {/* Center icon */}
        <text x="50" y="54" textAnchor="middle" dominantBaseline="middle" fontSize="18" fill={cfg.accent} opacity="0.6">
          {cfg.icon}
        </text>

        {/* Bottom arc text path */}
        <path id={`arc2-${country}`} d="M 20,58 A 35,35 0 0,0 80,58" fill="none" />
        <text fill={cfg.color} opacity="0.35" fontSize="3.8" fontWeight="500" letterSpacing="1.5" fontFamily="'DM Sans', sans-serif">
          <textPath href={`#arc2-${country}`} startOffset="50%" textAnchor="middle">
            {cfg.subtext}
          </textPath>
        </text>

        {/* Corner dots */}
        <circle cx="50" cy="8" r="1.2" fill={cfg.accent} opacity="0.4" />
        <circle cx="50" cy="92" r="1.2" fill={cfg.accent} opacity="0.4" />
      </svg>

      {/* Vintage texture overlay */}
      <div className="absolute inset-0 rounded-full opacity-[0.04] pointer-events-none"
        style={{ background: `radial-gradient(circle, transparent 40%, ${cfg.color} 100%)` }}
      />
    </div>
  )
}

/* ── Extract countries from trip destinations ── */
function extractCountries(trips, dayLocations) {
  const countries = new Set()
  // Map common cities to countries
  const cityCountryMap = {
    'paris': 'France', 'lyon': 'France', 'nice': 'France', 'marseille': 'France', 'bordeaux': 'France',
    'rome': 'Italy', 'venice': 'Italy', 'florence': 'Italy', 'milan': 'Italy', 'naples': 'Italy', 'amalfi': 'Italy',
    'london': 'United Kingdom', 'edinburgh': 'United Kingdom',
    'barcelona': 'Spain', 'madrid': 'Spain', 'seville': 'Spain', 'ibiza': 'Spain', 'mallorca': 'Spain',
    'lisbon': 'Portugal', 'porto': 'Portugal',
    'amsterdam': 'Netherlands',
    'berlin': 'Germany', 'munich': 'Germany',
    'vienna': 'Austria',
    'prague': 'Czech Republic',
    'athens': 'Greece', 'santorini': 'Greece', 'mykonos': 'Greece', 'crete': 'Greece',
    'dubrovnik': 'Croatia', 'split': 'Croatia', 'hvar': 'Croatia', 'korčula': 'Croatia', 'hvar town': 'Croatia',
    'istanbul': 'Turkey', 'cappadocia': 'Turkey',
    'budapest': 'Hungary',
    'dublin': 'Ireland',
    'copenhagen': 'Denmark',
    'stockholm': 'Sweden',
    'oslo': 'Norway',
    'helsinki': 'Finland',
    'reykjavík': 'Iceland',
    'tokyo': 'Japan', 'kyoto': 'Japan', 'osaka': 'Japan',
    'bangkok': 'Thailand', 'phuket': 'Thailand', 'chiang mai': 'Thailand',
    'bali': 'Indonesia',
    'singapore': 'Singapore',
    'hong kong': 'China', 'shanghai': 'China', 'beijing': 'China',
    'seoul': 'South Korea',
    'dubai': 'UAE', 'abu dhabi': 'UAE',
    'new york': 'USA', 'los angeles': 'USA', 'miami': 'USA', 'san francisco': 'USA', 'chicago': 'USA', 'las vegas': 'USA', 'charlotte': 'USA', 'nashville': 'USA', 'austin': 'USA', 'seattle': 'USA', 'boston': 'USA', 'denver': 'USA', 'honolulu': 'USA', 'washington dc': 'USA',
    'toronto': 'Canada', 'vancouver': 'Canada', 'montréal': 'Canada',
    'mexico city': 'Mexico', 'cancún': 'Mexico', 'tulum': 'Mexico',
    'sydney': 'Australia', 'melbourne': 'Australia',
    'auckland': 'New Zealand', 'queenstown': 'New Zealand',
    'buenos aires': 'Argentina',
    'rio de janeiro': 'Brazil', 'são paulo': 'Brazil',
    'bogotá': 'Colombia', 'cartagena': 'Colombia', 'medellín': 'Colombia',
    'lima': 'Peru', 'cusco': 'Peru',
    'cape town': 'South Africa',
    'marrakech': 'Morocco',
    'cairo': 'Egypt',
    'havana': 'Cuba',
  }

  for (const trip of trips) {
    if (trip.destination) {
      const cities = trip.destination.split('→').map((c) => c.trim().toLowerCase())
      for (const city of cities) {
        if (cityCountryMap[city]) countries.add(cityCountryMap[city])
      }
    }
  }

  // Also check day locations
  if (dayLocations) {
    for (const loc of Object.values(dayLocations)) {
      const key = loc.toLowerCase()
      if (cityCountryMap[key]) countries.add(cityCountryMap[key])
    }
  }

  return [...countries].sort()
}

export default function UserProfile() {
  const { username } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [profile, setProfile] = useState(null)
  const [allTrips, setAllTrips] = useState([]) // all their trips (for passport)
  const [visibleTrips, setVisibleTrips] = useState([]) // trips visible to viewer
  const [sharedTrips, setSharedTrips] = useState([])
  const [countries, setCountries] = useState([])
  const [totalCities, setTotalCities] = useState(0)
  const [friendship, setFriendship] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  const isOwnProfile = profile?.id === user?.id
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    async function load() {
      // Get profile by username
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .ilike('username', username)
        .single()

      if (!prof || profErr) {
        navigate('/dashboard')
        return
      }
      setProfile(prof)

      // Get all their trip memberships
      const { data: theirMemberships } = await supabase
        .from('trip_members')
        .select('trip_id')
        .eq('user_id', prof.id)

      const theirTripIds = (theirMemberships || []).map((m) => m.trip_id)

      // Fetch all their trips (we can read trips we're members of via RLS)
      let fetchedTrips = []
      if (theirTripIds.length > 0) {
        // For own profile, RLS allows seeing all own trips
        // For others, we can only see trips we're also a member of
        const { data } = await supabase
          .from('trips')
          .select('*')
          .in('id', theirTripIds)
          .order('start_date', { ascending: false })
        fetchedTrips = data || []
      }

      if (prof.id === user.id) {
        // Own profile — show everything
        setAllTrips(fetchedTrips)
        setVisibleTrips(fetchedTrips)
        setFriendship('self')

        // Passport: only completed trips (end_date < today)
        const completedTrips = fetchedTrips.filter((t) => t.end_date && t.end_date < today)
        const allDayLocs = {}
        for (const t of completedTrips) {
          if (t.day_locations) Object.assign(allDayLocs, t.day_locations)
        }
        setCountries(extractCountries(completedTrips, allDayLocs))

        // Stats
        const allCities = new Set()
        for (const t of fetchedTrips) {
          if (t.destination) t.destination.split('→').forEach((c) => allCities.add(c.trim()))
        }
        setTotalCities(allCities.size)
      } else {
        // Other user — check friendship
        const { data: fData } = await supabase
          .from('friendships')
          .select('*')
          .or(
            `and(requester_id.eq.${user.id},addressee_id.eq.${prof.id}),and(requester_id.eq.${prof.id},addressee_id.eq.${user.id})`
          )

        const f = (fData || [])[0]

        if (!f) setFriendship('none')
        else if (f.status === 'accepted') setFriendship('accepted')
        else if (f.status === 'pending' && f.requester_id === user.id) setFriendship('pending_sent')
        else if (f.status === 'pending' && f.addressee_id === user.id) setFriendship('pending_received')
        else setFriendship('none')

        const isFriend = f?.status === 'accepted'

        // Passport stamps — always visible, but only from completed trips
        // We need their trips for this. If we're friends or share trips, we have some via RLS.
        // For complete passport, use a fallback: just use what RLS gives us
        const completedTrips = fetchedTrips.filter((t) => t.end_date && t.end_date < today)
        const allDayLocs = {}
        for (const t of completedTrips) {
          if (t.day_locations) Object.assign(allDayLocs, t.day_locations)
        }
        setCountries(extractCountries(completedTrips, allDayLocs))
        setAllTrips(fetchedTrips)

        if (isFriend) {
          // Show their trips to friends
          setVisibleTrips(fetchedTrips)

          // Find shared trips (trips where both are members)
          const { data: myMemberships } = await supabase
            .from('trip_members')
            .select('trip_id')
            .eq('user_id', user.id)
          const myTripIds = new Set((myMemberships || []).map((m) => m.trip_id))
          const shared = fetchedTrips.filter((t) => myTripIds.has(t.id))
          setSharedTrips(shared)
        }

        const allCities = new Set()
        for (const t of fetchedTrips) {
          if (t.destination) t.destination.split('→').forEach((c) => allCities.add(c.trim()))
        }
        setTotalCities(allCities.size)
      }

      setLoading(false)
    }
    load()
  }, [username, user.id])

  async function sendRequest() {
    setActionLoading(true)
    await supabase.from('friendships').insert({ requester_id: user.id, addressee_id: profile.id })
    setFriendship('pending_sent')
    setActionLoading(false)
  }

  async function acceptRequest() {
    setActionLoading(true)
    const { data } = await supabase
      .from('friendships')
      .select('id')
      .eq('requester_id', profile.id)
      .eq('addressee_id', user.id)
      .single()
    if (data) {
      await supabase.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', data.id)
    }
    setFriendship('accepted')
    setActionLoading(false)
    // Reload to show trips
    window.location.reload()
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

  if (!profile) return null

  return (
    <div className="min-h-screen bg-[#F5EFE0]">

      <AppNav backTo="/dashboard" />

      <main className="max-w-3xl mx-auto px-6 sm:px-10 py-10">

        {/* Profile header */}
        <div className="flex items-center gap-5 mb-8">
          <Avatar url={profile.avatar_url} name={profile.full_name} size="xl" />
          <div className="flex-1">
            <h1
              className="text-2xl font-semibold text-[#1a2b20] tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              {profile.full_name || 'Unknown'}
            </h1>
            {profile.username && <p className="text-sm text-[#7A8F82]">@{profile.username}</p>}

            {/* Stats */}
            <div className="flex items-center gap-4 mt-2">
              <span className="text-xs text-[#4A6356]"><strong className="text-[#1a2b20]">{countries.length}</strong> {countries.length === 1 ? 'country' : 'countries'}</span>
              <span className="text-xs text-[#4A6356]"><strong className="text-[#1a2b20]">{totalCities}</strong> {totalCities === 1 ? 'city' : 'cities'}</span>
              <span className="text-xs text-[#4A6356]"><strong className="text-[#1a2b20]">{allTrips.length}</strong> {allTrips.length === 1 ? 'trip' : 'trips'}</span>
            </div>
          </div>

          {/* Friendship button */}
          {!isOwnProfile && (
            <div>
              {friendship === 'none' && (
                <button onClick={sendRequest} disabled={actionLoading} className="btn-primary px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50">
                  Add Friend
                </button>
              )}
              {friendship === 'pending_sent' && (
                <span className="text-xs text-[#7A8F82] bg-[#1C3829]/5 px-4 py-2 rounded-full">Request Sent</span>
              )}
              {friendship === 'pending_received' && (
                <button onClick={acceptRequest} disabled={actionLoading} className="btn-primary px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-50">
                  Accept Request
                </button>
              )}
              {friendship === 'accepted' && (
                <span className="text-xs text-[#4A6356] bg-[#1C3829]/5 px-4 py-2 rounded-full font-medium">Friends</span>
              )}
            </div>
          )}

          {isOwnProfile && (
            <button onClick={() => navigate('/profile')} className="text-xs text-[#1C3829]/40 hover:text-[#1C3829] border border-[#1C3829]/15 px-4 py-2 rounded-full transition-colors">
              Edit Profile
            </button>
          )}
        </div>

        {/* Passport */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-5">
            <h2
              className="text-xl font-semibold text-[#1a2b20] tracking-tight"
              style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
            >
              Passport
            </h2>
            <span className="text-[10px] text-[#7A8F82] bg-[#1C3829]/5 px-2 py-0.5 rounded-full">{countries.length} stamps</span>
          </div>

          {countries.length > 0 ? (
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
              {countries.map((c) => (
                <PassportStamp key={c} country={c} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white/50 rounded-2xl border border-[#1C3829]/8">
              <p className="text-sm text-[#7A8F82] italic">No stamps yet — trips will add them automatically</p>
            </div>
          )}
        </div>

        {/* Trips section — visible to self and friends */}
        {(isOwnProfile || friendship === 'accepted') && (() => {
          const upcoming = visibleTrips.filter((t) => !t.end_date || t.end_date >= today)
          const past = visibleTrips.filter((t) => t.end_date && t.end_date < today)

          function TripCard({ trip }) {
            const isPast = trip.end_date && trip.end_date < today
            const dateRange = trip.start_date
              ? `${new Date(trip.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}${trip.end_date ? ` – ${new Date(trip.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}` : ''}`
              : ''
            return (
              <div
                onClick={() => navigate(`/trip/${trip.id}`)}
                className="group bg-white rounded-xl border border-[#1C3829]/8 overflow-hidden hover:shadow-md hover:shadow-[#1C3829]/5 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                {trip.cover_url ? (
                  <div className="h-28 overflow-hidden relative">
                    <img src={trip.cover_url} alt="" className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isPast ? 'grayscale-[30%]' : ''}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                    {trip.destination && (
                      <p className="absolute bottom-2 left-3 text-[#F5EFE0]/80 text-[9px] font-medium tracking-wide uppercase z-10">{trip.destination}</p>
                    )}
                  </div>
                ) : (
                  <div className="h-20 bg-[#1C3829]/5 flex items-center justify-center">
                    <span className="text-[#1C3829]/15 text-2xl">✦</span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-[#1a2b20]" style={{ fontFamily: "'Playfair Display', serif" }}>{trip.name}</h3>
                  {dateRange && <p className="text-[10px] text-[#7A8F82] mt-1">{dateRange}</p>}
                </div>
              </div>
            )
          }

          return (
            <>
              {/* Shared trips */}
              {!isOwnProfile && sharedTrips.length > 0 && (
                <div className="mb-8">
                  <h2
                    className="text-xl font-semibold text-[#1a2b20] tracking-tight mb-4"
                    style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                  >
                    Trips Together
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {sharedTrips.map((t) => <TripCard key={t.id} trip={t} />)}
                  </div>
                </div>
              )}

              {/* Upcoming trips */}
              {upcoming.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h2
                      className="text-xl font-semibold text-[#1a2b20] tracking-tight"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      Upcoming
                    </h2>
                    <span className="text-[10px] text-[#7A8F82] bg-[#1C3829]/5 px-2 py-0.5 rounded-full">{upcoming.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {upcoming.map((t) => <TripCard key={t.id} trip={t} />)}
                  </div>
                </div>
              )}

              {/* Past trips */}
              {past.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <h2
                      className="text-xl font-semibold text-[#1a2b20] tracking-tight"
                      style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
                    >
                      Past Trips
                    </h2>
                    <span className="text-[10px] text-[#7A8F82] bg-[#1C3829]/5 px-2 py-0.5 rounded-full">{past.length}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {past.map((t) => <TripCard key={t.id} trip={t} />)}
                  </div>
                </div>
              )}

              {visibleTrips.length === 0 && (
                <div className="text-center py-10 bg-white/50 rounded-2xl border border-[#1C3829]/8">
                  <p className="text-sm text-[#7A8F82] italic">No trips yet</p>
                </div>
              )}
            </>
          )
        })()}

        {/* Not friends message */}
        {!isOwnProfile && friendship !== 'accepted' && friendship !== null && (
          <div className="text-center py-12 bg-white/50 rounded-2xl border border-[#1C3829]/8">
            <p className="text-sm text-[#7A8F82]">
              {friendship === 'pending_sent' ? 'Friend request pending — trips will be visible once accepted' : 'Add as a friend to see their trips'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
