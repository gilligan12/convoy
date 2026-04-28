import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo'

export default function JoinTrip() {
  const { token } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState('joining') // joining | success | error
  const [error, setError] = useState('')
  const [tripId, setTripId] = useState(null)

  useEffect(() => {
    if (!token || !user) return

    async function join() {
      const { data, error } = await supabase.rpc('join_trip_by_token', { p_token: token })

      if (error) {
        setError(error.message)
        setStatus('error')
      } else {
        setTripId(data)
        setStatus('success')
        setTimeout(() => navigate(`/trip/${data}`), 1500)
      }
    }
    join()
  }, [token, user])

  return (
    <div className="min-h-screen bg-[#F5EFE0] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="flex justify-center mb-6">
          <Logo size="md" variant="dark" />
        </div>

        {status === 'joining' && (
          <div>
            <div className="w-6 h-6 border-2 border-[#1C3829]/20 border-t-[#1C3829] rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm text-[#4A6356]">Joining trip...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="w-12 h-12 rounded-full bg-[#1C3829]/10 flex items-center justify-center mx-auto mb-4">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M4 10l4 4 8-8" stroke="#1C3829" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#1a2b20] mb-1">You're in!</p>
            <p className="text-xs text-[#7A8F82]">Redirecting to the trip...</p>
          </div>
        )}

        {status === 'error' && (
          <div>
            <p className="text-sm text-red-600 mb-4">{error || 'Invalid or expired invite link'}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary px-6 py-2.5 rounded-full text-sm font-semibold"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
