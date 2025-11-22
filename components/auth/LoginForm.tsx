'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Mail, ArrowRight, Loader2, Shield } from 'lucide-react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single()

        if (userData?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/')
        }
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Failed to login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-panel border border-[var(--border)] rounded-xl p-8 relative overflow-hidden">
          {/* Decorative Corner */}
          <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--gold)]/10 rounded-bl-full" />
          
          <div className="text-center mb-8 relative z-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded bg-[var(--surface-elevated)] border border-[var(--border)] mb-4">
              <Shield className="w-6 h-6 text-[var(--gold)]" />
            </div>
            <h1 className="text-2xl font-bold font-mono text-[var(--text-primary)] mb-2">
              AUTHORIZED ACCESS
            </h1>
            <p className="text-sm text-[var(--text-secondary)]">Enter credentials to proceed</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
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
                Security Key
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
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[var(--gold)] text-black font-bold font-mono py-3 rounded hover:bg-[var(--gold-light)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AUTHENTICATING...
                </>
              ) : (
                <>
                  ACCESS TERMINAL
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center pt-6 border-t border-[var(--border)]">
             <Link href="/register" className="text-xs font-mono text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors">
                REQUEST NEW ACCESS CREDENTIALS
             </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
