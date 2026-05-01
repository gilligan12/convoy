import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Logo from './Logo'
import Avatar from './Avatar'

export default function AppNav({ backTo, showFriends = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const name = user?.user_metadata?.full_name
  const avatarUrl = user?.user_metadata?.avatar_url

  return (
    <nav className="sticky top-0 z-40 bg-white/92 backdrop-blur-md border-b border-[#1C3829]/8 px-6 sm:px-10 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {backTo && (
          <button onClick={() => navigate(backTo)} className="text-[#1C3829]/40 hover:text-[#1C3829] transition-colors">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        )}
        <Logo size="md" variant="dark" />
      </div>
      <div className="flex items-center gap-4">
        {showFriends && (
          <>
            <Link
              to="/vault"
              className="flex items-center gap-1.5 text-sm text-[#1C3829]/50 hover:text-[#1C3829] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M12 2l8 4v6c0 5.25-3.5 8.5-8 10-4.5-1.5-8-4.75-8-10V6l8-4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Vault
            </Link>
            <Link
              to="/friends"
              className="flex items-center gap-1.5 text-sm text-[#1C3829]/50 hover:text-[#1C3829] transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              Friends
            </Link>
          </>
        )}
        <Link
          to="/profile"
          className="hidden sm:flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <Avatar url={avatarUrl} name={name} size="sm" />
          <span className="text-sm text-[#4A6356]">{name || user?.email}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm text-[#1C3829]/50 hover:text-[#1C3829] transition-colors"
        >
          Log out
        </button>
      </div>
    </nav>
  )
}
