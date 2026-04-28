import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import Logo from '../components/Logo'
import AppNav from '../components/AppNav'

/* ── Avatar Crop Modal ── */
function AvatarCropModal({ open, onClose, imageFile, onSave }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const containerRef = useRef(null)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)

  const PREVIEW_SIZE = 240

  // Load image
  useEffect(() => {
    if (!open || !imageFile) return
    setImgLoaded(false)
    setZoom(1)
    setOffset({ x: 0, y: 0 })

    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      // Auto-zoom to fit the shorter side
      const minDim = Math.min(img.width, img.height)
      const initialZoom = PREVIEW_SIZE / minDim
      setZoom(initialZoom)
      // Center the image
      setOffset({
        x: (PREVIEW_SIZE - img.width * initialZoom) / 2,
        y: (PREVIEW_SIZE - img.height * initialZoom) / 2,
      })
      setImgLoaded(true)
    }
    img.src = URL.createObjectURL(imageFile)
    return () => URL.revokeObjectURL(img.src)
  }, [open, imageFile])

  // Draw preview
  useEffect(() => {
    if (!imgLoaded || !canvasRef.current || !imgRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE)

    ctx.save()
    // Clip to circle
    ctx.beginPath()
    ctx.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(
      imgRef.current,
      offset.x, offset.y,
      imgRef.current.width * zoom,
      imgRef.current.height * zoom
    )
    ctx.restore()

    // Draw circle border
    ctx.beginPath()
    ctx.arc(PREVIEW_SIZE / 2, PREVIEW_SIZE / 2, PREVIEW_SIZE / 2 - 1, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(28, 56, 41, 0.15)'
    ctx.lineWidth = 2
    ctx.stroke()
  }, [imgLoaded, zoom, offset])

  // Drag handlers
  function handlePointerDown(e) {
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!dragging) return
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }

  function handlePointerUp() {
    setDragging(false)
  }

  // Zoom with scroll wheel
  function handleWheel(e) {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.02 : 0.02
    setZoom((z) => Math.max(0.1, Math.min(5, z + delta)))
  }

  async function handleSave() {
    if (!imgRef.current) return
    setSaving(true)

    // Render final crop at 400x400 for quality
    const outputSize = 400
    const scale = outputSize / PREVIEW_SIZE
    const c = document.createElement('canvas')
    c.width = outputSize
    c.height = outputSize
    const ctx = c.getContext('2d')

    ctx.beginPath()
    ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2)
    ctx.clip()

    ctx.drawImage(
      imgRef.current,
      offset.x * scale, offset.y * scale,
      imgRef.current.width * zoom * scale,
      imgRef.current.height * zoom * scale
    )

    c.toBlob(async (blob) => {
      if (blob) await onSave(blob)
      setSaving(false)
    }, 'image/jpeg', 0.9)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-[#1C3829]/10 overflow-hidden">
        <div className="p-6 border-b border-[#1C3829]/8 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1a2b20]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Adjust Photo
          </h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-[#1C3829]/5 flex items-center justify-center text-[#1C3829]/40 hover:text-[#1C3829] transition-colors text-lg">&times;</button>
        </div>

        <div className="p-6 flex flex-col items-center gap-5">
          {/* Preview */}
          <div
            ref={containerRef}
            className="relative cursor-grab active:cursor-grabbing"
            style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onWheel={handleWheel}
          >
            <canvas
              ref={canvasRef}
              width={PREVIEW_SIZE}
              height={PREVIEW_SIZE}
              className="rounded-full"
            />
            {!imgLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-[#1C3829]/20 border-t-[#1C3829] rounded-full animate-spin" />
              </div>
            )}
          </div>

          <p className="text-[10px] text-[#1C3829]/30">Drag to reposition · Scroll to zoom</p>

          {/* Zoom slider */}
          <div className="w-full flex items-center gap-3">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#1C3829]/25 flex-shrink-0">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M4 6h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-[#1C3829]"
            />
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-[#1C3829]/25 flex-shrink-0">
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              <path d="M4 6h4M6 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !imgLoaded}
            className="w-full btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Photo'}
          </button>
        </div>
      </div>
    </div>
  )
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export default function Profile() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [usernameError, setUsernameError] = useState('')

  useEffect(() => {
    async function fetchProfile() {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) {
        setFullName(data.full_name || '')
        setUsername(data.username || '')
        setAvatarUrl(data.avatar_url || '')
        setEmail(data.email || user.email || '')
      }
      setLoading(false)
    }
    fetchProfile()
  }, [user])

  async function validateUsername(val) {
    if (!val) { setUsernameError(''); return true }
    if (val.length < 3) { setUsernameError('At least 3 characters'); return false }
    if (!/^[a-zA-Z0-9_]+$/.test(val)) { setUsernameError('Letters, numbers, and underscores only'); return false }

    const { data } = await supabase
      .from('profiles')
      .select('id')
      .ilike('username', val)
      .neq('id', user.id)
      .limit(1)

    if (data && data.length > 0) {
      setUsernameError('Username taken')
      return false
    }
    setUsernameError('')
    return true
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    setMessage('')

    if (username && !(await validateUsername(username))) return

    setSaving(true)

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName || null,
        username: username || null,
      })
      .eq('id', user.id)

    if (error) {
      setError(error.message)
    } else {
      // Also update auth metadata so the nav shows the new name
      await supabase.auth.updateUser({
        data: { full_name: fullName },
      })
      setMessage('Profile saved')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const [cropFile, setCropFile] = useState(null)
  const [showCrop, setShowCrop] = useState(false)

  function handleFileSelect(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB')
      return
    }
    setCropFile(file)
    setShowCrop(true)
    e.target.value = ''
  }

  async function handleCroppedSave(blob) {
    setUploading(true)
    setError('')

    const path = `${user.id}/avatar.jpg`

    const { error: uploadErr } = await supabase.storage
      .from('avatars')
      .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })

    if (uploadErr) {
      setError('Upload failed: ' + uploadErr.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path)

    const url = `${publicUrl}?t=${Date.now()}`

    const { error: dbErr } = await supabase
      .from('profiles')
      .update({ avatar_url: url })
      .eq('id', user.id)

    if (dbErr) {
      setError('Failed to save avatar')
    } else {
      setAvatarUrl(url)
      await supabase.auth.updateUser({
        data: { avatar_url: url },
      })
    }
    setUploading(false)
    setShowCrop(false)
    setCropFile(null)
  }

  async function handleRemoveAvatar() {
    setAvatarUrl('')
    await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id)
    await supabase.auth.updateUser({ data: { avatar_url: null } })
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const inputClass =
    'w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5EFE0] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1C3829]/20 border-t-[#1C3829] rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5EFE0]">

      <AppNav backTo="/dashboard" />

      <main className="max-w-lg mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <h1
            className="text-3xl font-semibold text-[#1a2b20] tracking-tight"
            style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}
          >
            Your Profile
          </h1>
          {username && (
            <button
              onClick={() => navigate(`/u/${username}`)}
              className="text-xs text-[#1C3829]/40 hover:text-[#1C3829] border border-[#1C3829]/15 px-4 py-2 rounded-full transition-colors"
            >
              View public profile
            </button>
          )}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-5 mb-8">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover border-2 border-[#1C3829]/10"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-[#1C3829]/10 flex items-center justify-center text-xl text-[#1C3829] font-semibold border-2 border-[#1C3829]/10">
                {getInitials(fullName)}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="text-white/0 group-hover:text-white/90 text-xs font-medium transition-all">
                {uploading ? '...' : 'Edit'}
              </span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a2b20]">{fullName || 'Your name'}</p>
            {username && <p className="text-xs text-[#7A8F82]">@{username}</p>}
            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[10px] text-[#1C3829]/50 hover:text-[#1C3829] transition-colors font-medium"
              >
                Upload photo
              </button>
              {avatarUrl && (
                <>
                  <span className="text-[#1C3829]/15">|</span>
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="text-[10px] text-red-400 hover:text-red-600 transition-colors font-medium"
                  >
                    Remove
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl border border-[#1C3829]/10 shadow-sm p-6">
          <form onSubmit={handleSave} className="flex flex-col gap-5">

            <div>
              <label className="block text-sm font-medium text-[#1a2b20] mb-1">Full name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2b20] mb-1">Username</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-[#1C3829]/30">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase()
                    setUsername(val)
                    setUsernameError('')
                  }}
                  onBlur={() => { if (username) validateUsername(username) }}
                  placeholder="username"
                  className={`${inputClass} pl-8`}
                />
              </div>
              {usernameError && (
                <p className="text-xs text-red-500 mt-1">{usernameError}</p>
              )}
              {username && !usernameError && (
                <p className="text-[10px] text-[#7A8F82] mt-1">Friends can find you @{username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2b20] mb-1">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className={`${inputClass} opacity-50 cursor-not-allowed`}
              />
              <p className="text-[10px] text-[#7A8F82] mt-1">Email cannot be changed</p>
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}
            {message && (
              <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-2">{message}</p>
            )}

            <button
              type="submit"
              disabled={saving || !!usernameError}
              className="btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </form>
        </div>
      </main>

      <AvatarCropModal
        open={showCrop}
        onClose={() => { setShowCrop(false); setCropFile(null) }}
        imageFile={cropFile}
        onSave={handleCroppedSave}
      />
    </div>
  )
}
