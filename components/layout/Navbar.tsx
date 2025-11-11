'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'

interface NavbarProps {
  user: any
  role: string | null
}

export default function Navbar({ user, role }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[var(--border)] shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[var(--gold-accent)] to-[var(--gold-dark)] flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] bg-clip-text text-transparent">
              Auction
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-[var(--gold-light)]/20 transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6 text-[var(--text-primary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-[var(--border)] py-4 space-y-2">
            {user ? (
              <>
                {role === 'admin' && (
                  <Link
                    href="/admin"
                    className="block px-4 py-3 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--gold-dark)] hover:bg-[var(--gold-light)]/20 rounded-lg transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/my-bids"
                  className="block px-4 py-3 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--gold-dark)] hover:bg-[var(--gold-light)]/20 rounded-lg transition-colors"
                >
                  My Bids
                </Link>
                <Link
                  href="/profile"
                  className="block px-4 py-3 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--gold-dark)] hover:bg-[var(--gold-light)]/20 rounded-lg transition-colors"
                >
                  Profile
                </Link>
                <div className="border-t border-[var(--border)] my-2" />
                <div className="px-4 py-3">
                  <LogoutButton />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-3 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--gold-dark)] hover:bg-[var(--gold-light)]/20 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-3 text-center bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] text-white rounded-lg font-semibold shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}

