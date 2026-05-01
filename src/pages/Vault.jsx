import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import AppNav from '../components/AppNav'

const DOC_TYPES = [
  { value: 'passport', label: 'Passport', icon: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.4"/><path d="M8 17h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { value: 'id', label: 'ID Card', icon: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><circle cx="8" cy="11" r="2" stroke="currentColor" strokeWidth="1.4"/><path d="M14 10h4M14 13h3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { value: 'visa', label: 'Visa', icon: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M2 9h20" stroke="currentColor" strokeWidth="1.4"/><path d="M6 13h4M6 16h2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg> },
  { value: 'vaccination', label: 'Vaccination', icon: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2v4M12 18v4M9 12H5M19 12h-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/></svg> },
  { value: 'insurance', label: 'Insurance', icon: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 2l8 4v6c0 5.25-3.5 8.5-8 10-4.5-1.5-8-4.75-8-10V6l8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { value: 'global_entry', label: 'Global Entry', icon: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="1.4"/></svg> },
  { value: 'other', label: 'Other', icon: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg> },
]

function formatFileSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function AddDocModal({ open, onClose, onSaved, userId }) {
  const [docType, setDocType] = useState('passport')
  const [title, setTitle] = useState('')
  const [country, setCountry] = useState('')
  const [docNumber, setDocNumber] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef(null)

  async function handleSave(e) {
    e.preventDefault()
    if (!file) { setError('Please select a file'); return }
    setError('')
    setSaving(true)

    const ext = file.name.split('.').pop()
    const path = `${userId}/personal/${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('documents')
      .upload(path, file)

    if (uploadErr) {
      setError('Upload failed: ' + uploadErr.message)
      setSaving(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path)

    const { error: dbErr } = await supabase.from('personal_documents').insert({
      user_id: userId,
      doc_type: docType,
      title,
      file_url: publicUrl,
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      country: country || null,
      doc_number: docNumber || null,
      expiry_date: expiryDate || null,
      notes: notes || null,
    })

    if (dbErr) {
      setError(dbErr.message)
      setSaving(false)
    } else {
      setSaving(false)
      setDocType('passport')
      setTitle('')
      setCountry('')
      setDocNumber('')
      setExpiryDate('')
      setNotes('')
      setFile(null)
      onSaved()
    }
  }

  if (!open) return null

  const inputClass = 'w-full border border-[#1C3829]/15 rounded-xl px-4 py-3 text-sm bg-[#F5EFE0]/50 focus:outline-none focus:ring-2 focus:ring-[#1C3829]/30 focus:border-transparent'
  const showCountry = ['passport', 'visa', 'id'].includes(docType)
  const showDocNum = ['passport', 'visa', 'insurance', 'global_entry', 'id'].includes(docType)
  const showExpiry = ['passport', 'visa', 'insurance', 'global_entry', 'id'].includes(docType)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-6" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#1C3829]/10 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#1C3829]/8 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1a2b20]" style={{ fontFamily: "'Playfair Display', serif" }}>Add Document</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-full hover:bg-[#1C3829]/5 flex items-center justify-center text-[#1C3829]/40 hover:text-[#1C3829] transition-colors text-lg">&times;</button>
        </div>

        <form onSubmit={handleSave} className="p-6 flex flex-col gap-4">
          {/* Doc type */}
          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-2">Document type</label>
            <div className="flex flex-wrap gap-1.5">
              {DOC_TYPES.map((t) => (
                <button key={t.value} type="button" onClick={() => setDocType(t.value)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    docType === t.value ? 'bg-[#1C3829] text-[#F5EFE0]' : 'bg-[#1C3829]/5 text-[#1C3829]/60 hover:bg-[#1C3829]/10'
                  }`}>
                  {t.icon(12)}
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-1">Title</label>
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder={docType === 'passport' ? 'e.g. US Passport' : docType === 'insurance' ? 'e.g. Allianz Travel Insurance' : 'Document name'}
              className={inputClass} />
          </div>

          {showCountry && (
            <div>
              <label className="block text-sm font-medium text-[#1a2b20] mb-1">Country</label>
              <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. United States" className={inputClass} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {showDocNum && (
              <div>
                <label className="block text-sm font-medium text-[#1a2b20] mb-1">
                  {docType === 'insurance' ? 'Policy #' : docType === 'global_entry' ? 'Known Traveler #' : 'Document #'}
                </label>
                <input type="text" value={docNumber} onChange={(e) => setDocNumber(e.target.value)} placeholder="Optional" className={inputClass} />
              </div>
            )}
            {showExpiry && (
              <div>
                <label className="block text-sm font-medium text-[#1a2b20] mb-1">Expiry date</label>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className={inputClass} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} className={`${inputClass} resize-none`} />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-[#1a2b20] mb-2">File</label>
            {file ? (
              <div className="flex items-center gap-3 bg-[#1C3829]/5 rounded-xl px-4 py-3">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-[#1C3829]/40 flex-shrink-0"><path d="M14 3H6a2 2 0 00-2 2v14a2 2 0 002 2h12a2 2 0 002-2V9l-6-6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M14 3v6h6" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/></svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[#1a2b20] truncate">{file.name}</p>
                  <p className="text-[10px] text-[#7A8F82]">{formatFileSize(file.size)}</p>
                </div>
                <button type="button" onClick={() => { setFile(null); fileRef.current.value = '' }} className="text-[#1C3829]/30 hover:text-red-500 text-lg">&times;</button>
              </div>
            ) : (
              <>
                <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                <button type="button" onClick={() => fileRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#1C3829]/15 rounded-xl py-4 flex flex-col items-center gap-1.5 hover:border-[#1C3829]/30 hover:bg-[#1C3829]/3 transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-[#1C3829]/30"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span className="text-xs text-[#1C3829]/40 font-medium">Upload PDF, image, or document</span>
                </button>
              </>
            )}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <button type="submit" disabled={saving} className="btn-primary py-3 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? 'Uploading...' : 'Save Document'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Vault() {
  const { user } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [filter, setFilter] = useState('all')

  async function fetchDocs() {
    const { data } = await supabase
      .from('personal_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    setDocs(data || [])
    setLoading(false)
  }

  useEffect(() => { fetchDocs() }, [])

  async function handleDelete(docId) {
    if (!window.confirm('Delete this document?')) return
    await supabase.from('personal_documents').delete().eq('id', docId)
    setDocs((prev) => prev.filter((d) => d.id !== docId))
  }

  const filtered = filter === 'all' ? docs : docs.filter((d) => d.doc_type === filter)
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-[#F5EFE0]">
      <AppNav backTo="/dashboard" />

      <main className="max-w-3xl mx-auto px-6 sm:px-10 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-[#1a2b20] tracking-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            Document Vault
          </h1>
          <button onClick={() => setShowAdd(true)} className="btn-primary px-5 py-2.5 rounded-full text-sm font-semibold">
            + Add Document
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          <button onClick={() => setFilter('all')}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === 'all' ? 'bg-[#1C3829] text-[#F5EFE0]' : 'bg-[#1C3829]/5 text-[#1C3829]/50 hover:text-[#1C3829]'}`}>
            All ({docs.length})
          </button>
          {DOC_TYPES.map((t) => {
            const count = docs.filter((d) => d.doc_type === t.value).length
            if (count === 0) return null
            return (
              <button key={t.value} onClick={() => setFilter(t.value)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === t.value ? 'bg-[#1C3829] text-[#F5EFE0]' : 'bg-[#1C3829]/5 text-[#1C3829]/50 hover:text-[#1C3829]'}`}>
                {t.label} ({count})
              </button>
            )
          })}
        </div>

        {loading && (
          <div className="text-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-[#1C3829]/20 border-t-[#1C3829] rounded-full animate-spin" />
          </div>
        )}

        {!loading && docs.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#1C3829]/5 flex items-center justify-center mx-auto mb-4">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#1C3829]/25">
                <path d="M12 2l8 4v6c0 5.25-3.5 8.5-8 10-4.5-1.5-8-4.75-8-10V6l8-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-xl font-semibold text-[#1a2b20] mb-2 tracking-tight" style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: 'italic' }}>
              Your vault is empty
            </p>
            <p className="text-sm text-[#4A6356] mb-6">Store your travel documents securely in one place.</p>
            <button onClick={() => setShowAdd(true)} className="btn-primary px-6 py-2.5 rounded-full text-sm font-semibold">
              + Add your first document
            </button>
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="space-y-3">
            {filtered.map((doc) => {
              const typeInfo = DOC_TYPES.find((t) => t.value === doc.doc_type) || DOC_TYPES[DOC_TYPES.length - 1]
              const isExpired = doc.expiry_date && doc.expiry_date < today
              const expiringSoon = doc.expiry_date && !isExpired && doc.expiry_date < new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0]

              return (
                <div key={doc.id} className="group bg-white rounded-xl border border-[#1C3829]/8 p-4 hover:shadow-md hover:shadow-[#1C3829]/5 transition-all">
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isExpired ? 'bg-red-50 text-red-400' : 'bg-[#1C3829]/5 text-[#1C3829]/40'
                    }`}>
                      {typeInfo.icon(20)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-semibold text-[#1a2b20]">{doc.title}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] bg-[#1C3829]/5 text-[#1C3829]/50 px-2 py-0.5 rounded-full">{typeInfo.label}</span>
                            {doc.country && <span className="text-[10px] text-[#7A8F82]">{doc.country}</span>}
                          </div>
                        </div>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                            className="w-7 h-7 rounded-md hover:bg-[#1C3829]/8 flex items-center justify-center text-[#1C3829]/30 hover:text-[#1C3829] transition-colors" title="View">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="1.8"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8"/></svg>
                          </a>
                          <button onClick={() => handleDelete(doc.id)}
                            className="w-7 h-7 rounded-md hover:bg-red-50 flex items-center justify-center text-[#1C3829]/30 hover:text-red-500 transition-colors" title="Delete">
                            <span className="text-lg leading-none">&times;</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2">
                        {doc.doc_number && (
                          <span className="text-xs text-[#7A8F82]">#{doc.doc_number}</span>
                        )}
                        {doc.expiry_date && (
                          <span className={`text-xs ${
                            isExpired ? 'text-red-500 font-medium' : expiringSoon ? 'text-amber-600 font-medium' : 'text-[#7A8F82]'
                          }`}>
                            {isExpired ? 'Expired ' : expiringSoon ? 'Expires ' : 'Exp. '}
                            {new Date(doc.expiry_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        )}
                        <span className="text-[10px] text-[#1C3829]/20">{doc.file_name} · {formatFileSize(doc.file_size)}</span>
                      </div>

                      {doc.notes && <p className="text-xs text-[#7A8F82] mt-2">{doc.notes}</p>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <AddDocModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); fetchDocs() }}
        userId={user?.id}
      />
    </div>
  )
}
