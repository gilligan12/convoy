import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import AppNav from '../components/AppNav'

function getInitial(name) {
  return (name || '?').charAt(0).toUpperCase()
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function Avatar({ url, name, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' }
  const cls = sizes[size] || sizes.md
  if (url) {
    return <img src={url} alt={name} className={`${cls} rounded-full object-cover border border-[#1C3829]/10 flex-shrink-0`} />
  }
  return (
    <div className={`${cls} rounded-full bg-[#1C3829]/10 flex items-center justify-center text-[#1C3829] font-semibold flex-shrink-0`}>
      {getInitials(name)}
    </div>
  )
}

function PersonCard({ person, children }) {
  const navigate = useNavigate()
  const clickable = !!person.username

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl border border-[#1C3829]/8 p-4 hover:shadow-md hover:shadow-[#1C3829]/5 transition-all">
      <div
        onClick={clickable ? () => navigate(`/u/${person.username}`) : undefined}
        className={`flex items-center gap-3 flex-1 min-w-0 ${clickable ? 'cursor-pointer' : ''}`}
      >
        <Avatar url={person.avatar_url} name={person.full_name} />
        <div className="min-w-0">
          <p className={`text-sm font-semibold text-[#1a2b20] ${clickable ? 'hover:underline' : ''}`}>{person.full_name || 'Unknown'}</p>
          {person.username ? (
            <p className="text-xs text-[#7A8F82]">@{person.username}</p>
          ) : (
            <p className="text-xs text-[#7A8F82] truncate">{person.email}</p>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function Friends() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('friends') // 'friends' | 'requests' | 'search'
  const [friends, setFriends] = useState([])
  const [incoming, setIncoming] = useState([])
  const [outgoing, setOutgoing] = useState([])
  const [loading, setLoading] = useState(true)

  // Search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  const [actionLoading, setActionLoading] = useState(null) // id of item being acted on

  async function fetchFriends() {
    const { data } = await supabase
      .from('friendships')
      .select('*, requester:requester_id(id, full_name, email, avatar_url, username), addressee:addressee_id(id, full_name, email, avatar_url, username)')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)

    const accepted = []
    const inc = []
    const out = []

    for (const f of (data || [])) {
      if (f.status === 'accepted') {
        const friend = f.requester_id === user.id ? f.addressee : f.requester
        accepted.push({ ...friend, friendshipId: f.id, since: f.updated_at })
      } else if (f.status === 'pending') {
        if (f.addressee_id === user.id) {
          inc.push({ ...f.requester, friendshipId: f.id, sentAt: f.created_at })
        } else {
          out.push({ ...f.addressee, friendshipId: f.id, sentAt: f.created_at })
        }
      }
    }

    setFriends(accepted)
    setIncoming(inc)
    setOutgoing(out)
    setLoading(false)
  }

  useEffect(() => { fetchFriends() }, [])

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError('')
    setSearchResults([])

    const q = searchQuery.trim().toLowerCase()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url, username')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%,username.ilike.%${q}%`)
      .neq('id', user.id)
      .limit(10)

    setSearching(false)
    if (error) {
      setSearchError('Search failed')
      return
    }

    // Filter out existing friends and pending requests
    const existingIds = new Set([
      ...friends.map((f) => f.id),
      ...incoming.map((f) => f.id),
      ...outgoing.map((f) => f.id),
    ])
    setSearchResults((data || []).filter((p) => !existingIds.has(p.id)))
  }

  async function sendRequest(profileId) {
    setActionLoading(profileId)
    await supabase.from('friendships').insert({
      requester_id: user.id,
      addressee_id: profileId,
    })
    await fetchFriends()
    setSearchResults((prev) => prev.filter((p) => p.id !== profileId))
    setActionLoading(null)
  }

  async function acceptRequest(friendshipId) {
    setActionLoading(friendshipId)
    await supabase.from('friendships').update({ status: 'accepted', updated_at: new Date().toISOString() }).eq('id', friendshipId)
    await fetchFriends()
    setActionLoading(null)
  }

  async function declineRequest(friendshipId) {
    setActionLoading(friendshipId)
    await supabase.from('friendships').delete().eq('id', friendshipId)
    await fetchFriends()
    setActionLoading(null)
  }

  async function removeFriend(friendshipId) {
    if (!window.confirm('Remove this friend?')) return
    setActionLoading(friendshipId)
    await supabase.from('friendships').delete().eq('id', friendshipId)
    await fetchFriends()
    setActionLoading(null)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const requestCount = incoming.length

  return (
    <div className="min-h-screen bg-[#F5EFE0]">

      <AppNav backTo="/dashboard" />

      <main className="max-w-2xl mx-auto px-6 sm:px-10 py-10">

        <h1
          className="text-3xl font-semibold text-[#1a2b20] tracking-tight mb-8"
          style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
        >
          Friends
        </h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#1C3829]/5 rounded-xl p-1 mb-8">
          {[
            { key: 'friends', label: 'Friends', count: friends.length },
            { key: 'requests', label: 'Requests', count: requestCount },
            { key: 'search', label: 'Add Friend' },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors relative ${
                tab === t.key
                  ? 'bg-[#1C3829] text-[#F5EFE0]'
                  : 'text-[#1C3829]/50 hover:text-[#1C3829]'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span className={`ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full ${
                  tab === t.key ? 'bg-white/20' : 'bg-[#1C3829]/10'
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-[#1C3829]/20 border-t-[#1C3829] rounded-full animate-spin" />
          </div>
        )}

        {/* Friends list */}
        {!loading && tab === 'friends' && (
          <div>
            {friends.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-[#1C3829]/5 flex items-center justify-center mx-auto mb-4">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#1C3829]/25">
                    <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                    <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                    <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <p
                  className="text-xl font-semibold text-[#1a2b20] mb-2 tracking-tight"
                  style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}
                >
                  No friends yet
                </p>
                <p className="text-sm text-[#4A6356] mb-6">Search for people to connect with.</p>
                <button
                  onClick={() => setTab('search')}
                  className="btn-primary px-6 py-2.5 rounded-full text-sm font-semibold"
                >
                  Find friends
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {friends.map((f) => (
                  <PersonCard key={f.id} person={f}>
                    <button
                      onClick={() => removeFriend(f.friendshipId)}
                      disabled={actionLoading === f.friendshipId}
                      className="text-xs text-[#1C3829]/30 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                    >
                      Remove
                    </button>
                  </PersonCard>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Requests */}
        {!loading && tab === 'requests' && (
          <div className="space-y-6">
            {/* Incoming */}
            <div>
              <h3 className="text-xs font-semibold text-[#1C3829]/40 tracking-wider uppercase mb-3">
                Incoming Requests {incoming.length > 0 && `(${incoming.length})`}
              </h3>
              {incoming.length === 0 ? (
                <p className="text-sm text-[#7A8F82] py-4">No pending requests</p>
              ) : (
                <div className="space-y-2">
                  {incoming.map((f) => (
                    <PersonCard key={f.friendshipId} person={f}>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptRequest(f.friendshipId)}
                          disabled={actionLoading === f.friendshipId}
                          className="btn-primary px-4 py-1.5 rounded-full text-xs font-semibold disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => declineRequest(f.friendshipId)}
                          disabled={actionLoading === f.friendshipId}
                          className="text-xs text-[#1C3829]/40 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
                        >
                          Decline
                        </button>
                      </div>
                    </PersonCard>
                  ))}
                </div>
              )}
            </div>

            {/* Outgoing */}
            {outgoing.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-[#1C3829]/40 tracking-wider uppercase mb-3">
                  Sent Requests ({outgoing.length})
                </h3>
                <div className="space-y-2">
                  {outgoing.map((f) => (
                    <PersonCard key={f.friendshipId} person={f}>
                      <button
                        onClick={() => declineRequest(f.friendshipId)}
                        disabled={actionLoading === f.friendshipId}
                        className="text-xs text-[#1C3829]/30 hover:text-red-500 transition-colors px-3 py-1.5"
                      >
                        Cancel
                      </button>
                    </PersonCard>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Search / Add friend */}
        {!loading && tab === 'search' && (
          <div>
            <div className="flex gap-2 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSearch() }}
                placeholder="Search by name, username, or email..."
                className="flex-1 border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent"
                autoFocus
              />
              <button
                onClick={handleSearch}
                disabled={searching}
                className="btn-primary px-5 rounded-xl text-sm font-semibold disabled:opacity-50"
              >
                {searching ? (
                  <div className="w-4 h-4 border-2 border-[#F5EFE0]/30 border-t-[#F5EFE0] rounded-full animate-spin" />
                ) : (
                  'Search'
                )}
              </button>
            </div>

            {searchError && (
              <p className="text-sm text-red-500 mb-4">{searchError}</p>
            )}

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((p) => (
                  <PersonCard key={p.id} person={p}>
                    <button
                      onClick={() => sendRequest(p.id)}
                      disabled={actionLoading === p.id}
                      className="btn-primary px-4 py-1.5 rounded-full text-xs font-semibold disabled:opacity-50"
                    >
                      {actionLoading === p.id ? 'Sending...' : 'Add Friend'}
                    </button>
                  </PersonCard>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery && !searching && (
              <div className="text-center py-12">
                <p className="text-sm text-[#7A8F82]">No users found. Try a different name or email.</p>
              </div>
            )}

            {!searchQuery && (
              <div className="text-center py-12">
                <p className="text-sm text-[#7A8F82]">Search for people by their name or email address.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
