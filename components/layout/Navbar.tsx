import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from '@/components/auth/LogoutButton'
import { getUserRole } from '@/lib/auth'

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const role = await getUserRole()

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--gold-accent)] to-[var(--gold-dark)] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] bg-clip-text text-transparent">
              Gem Auction
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                {role === 'admin' && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--gold-dark)] transition-colors px-4 py-2 rounded-lg hover:bg-[var(--gold-light)]/20"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/my-bids"
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--gold-dark)] transition-colors px-4 py-2 rounded-lg hover:bg-[var(--gold-light)]/20"
                >
                  My Bids
                </Link>
                <Link
                  href="/profile"
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--gold-dark)] transition-colors px-4 py-2 rounded-lg hover:bg-[var(--gold-light)]/20"
                >
                  Profile
                </Link>
                <div className="w-px h-6 bg-[var(--border)] mx-2" />
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--gold-dark)] transition-colors px-4 py-2 rounded-lg hover:bg-[var(--gold-light)]/20"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-5 py-2.5 bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white rounded-lg hover:shadow-lg hover:shadow-[var(--gold)]/30 transition-all duration-200 font-semibold text-sm shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

