'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import LogoutButton from '@/components/auth/LogoutButton'
import { LayoutDashboard, User, Gavel, LogOut, Menu, X, Shield } from 'lucide-react'

interface NavbarProps {
  user: any
  role: string | null
}

export default function Navbar({ user, role }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  if (pathname?.startsWith('/monitor')) {
    return null
  }

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b border-[var(--border)] bg-[#0a0a0a]/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center">
              <div className="absolute inset-0 bg-[var(--gold)] rounded-sm rotate-45 group-hover:rotate-90 transition-transform duration-500 opacity-20" />
              <div className="absolute inset-0 border border-[var(--gold)] rounded-sm rotate-45 group-hover:rotate-0 transition-transform duration-500" />
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--gold)]" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg sm:text-xl font-bold tracking-tighter text-[var(--foreground)] leading-none group-hover:text-[var(--gold)] transition-colors">
                LUX<span className="text-[var(--gold)]">BID</span>
              </span>
              <span className="text-[9px] sm:text-[10px] tracking-[0.2em] text-[var(--text-secondary)] uppercase">
                Reserve
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {user ? (
              <>
                {role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 px-4 py-2 text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 rounded border border-transparent hover:border-[var(--gold)]/20 transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    ADMIN
                  </Link>
                )}
                <Link
                  href="/my-bids"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 rounded border border-transparent hover:border-[var(--gold)]/20 transition-all"
                >
                  <Gavel className="w-4 h-4" />
                  MY BIDS
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 rounded border border-transparent hover:border-[var(--gold)]/20 transition-all"
                >
                  <User className="w-4 h-4" />
                  PROFILE
                </Link>
                <div className="w-px h-6 bg-[var(--border)] mx-2" />
                <LogoutButton />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors px-4 py-2"
                >
                  LOGIN
                </Link>
                <Link
                  href="/register"
                  className="px-6 py-2 bg-[var(--gold)] text-black font-bold font-mono text-sm rounded hover:bg-[var(--gold-light)] transition-colors clip-path-slant"
                  style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
                >
                  ACCESS
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-[var(--gold)] hover:bg-[var(--gold)]/10 rounded transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-[var(--border)] py-4 space-y-2 bg-[#0a0a0a]/95 backdrop-blur-xl absolute left-0 right-0 px-4 border-b">
            {user ? (
              <>
                {role === 'admin' && (
                  <Link
                    href="/admin"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 rounded border border-transparent hover:border-[var(--gold)]/20 transition-all"
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    ADMIN TERMINAL
                  </Link>
                )}
                <Link
                  href="/my-bids"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 rounded border border-transparent hover:border-[var(--gold)]/20 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <Gavel className="w-4 h-4" />
                  MY BIDS
                </Link>
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-3 text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 rounded border border-transparent hover:border-[var(--gold)]/20 transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  <User className="w-4 h-4" />
                  PROFILE
                </Link>
                <div className="border-t border-[var(--border)] my-2" />
                <div className="px-4 py-2">
                  <LogoutButton />
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="block px-4 py-3 text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5 rounded transition-all"
                  onClick={() => setIsOpen(false)}
                >
                  LOGIN
                </Link>
                <Link
                  href="/register"
                  className="block px-4 py-3 text-center bg-[var(--gold)] text-black font-bold font-mono text-sm rounded hover:bg-[var(--gold-light)] transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  REQUEST ACCESS
                </Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
