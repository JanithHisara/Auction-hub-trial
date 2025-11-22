'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, ArrowRight, Loader2, UserPlus, ShieldCheck } from 'lucide-react'

export default function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const validatePassword = (pwd: string): string | null => {
    if (pwd.length < 8) return 'Minimum 8 characters required'
    if (!/[A-Z]/.test(pwd)) return 'Uppercase character required'
    if (!/[a-z]/.test(pwd)) return 'Lowercase character required'
    if (!/[0-9]/.test(pwd)) return 'Numeric character required'
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('Credentials mismatch')
      return
    }

    const passwordError = validatePassword(password)
    if (passwordError) {
      setError(passwordError)
      return
    }

    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      if (data.user) {
        router.push('/login?registered=true')
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-panel border border-[var(--border)] rounded-xl p-8 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute top-0 left-0 w-16 h-16 bg-[var(--gold)]/10 rounded-br-full" />
          
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-[var(--surface-elevated)] border border-[var(--border)] mb-4">
              <UserPlus className="w-6 h-6 text-[var(--gold)]" />
            </div>
            <h1 className="text-2xl font-bold font-mono text-[var(--text-primary)] mb-2">
              NEW REGISTRATION
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">Create secure access credentials</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded text-sm font-mono flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                Identity / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors font-mono text-sm"
                  placeholder="name@domain.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                Set Security Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors font-mono text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div className="mt-2 flex gap-1 flex-wrap">
                 {/* Password strength indicators could go here */}
                 <span className="text-[10px] text-[var(--text-muted)] font-mono">REQ: 8+ CHARS • UPPER • LOWER • NUM</span>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-mono font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
                Confirm Security Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <ShieldCheck className="h-4 w-4 text-[var(--text-muted)]" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold)] transition-colors font-mono text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--gold)] text-black font-bold font-mono py-3 rounded hover:bg-[var(--gold-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-4"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  INITIALIZING...
                </>
              ) : (
                <>
                  CREATE IDENTITY
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center pt-6 border-t border-[var(--border)]">
             <Link href="/login" className="text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors">
                RETURN TO LOGIN
             </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
