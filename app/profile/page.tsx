import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'

export default async function ProfilePage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: rewards } = await supabase
    .from('user_rewards')
    .select('*')
    .eq('user_id', user.id)
    .single()

  const { count: bidCount } = await supabase
    .from('bids')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const { count: registrationCount } = await supabase
    .from('auction_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  return (
    <div className="min-h-screen bg-[var(--background)] relative">
      <div className="fixed inset-0 bg-grid-pattern opacity-30" />
      
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-black text-white mb-8">Profile</h1>

        <div className="grid gap-6">
          {/* User Info */}
          <div className="card-glass rounded-2xl p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--gold)] to-[var(--gold-dark)] flex items-center justify-center text-3xl">
                👤
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">
                  {userData?.anonymous_name || 'Anonymous Bidder'}
                </h2>
                <p className="text-[var(--text-muted)]">{userData?.email}</p>
                <div className="flex items-center gap-4 mt-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    userData?.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {userData?.role?.toUpperCase()}
                  </span>
                  <span className="text-xs text-[var(--text-muted)]">
                    Member since {userData?.created_at ? formatDate(userData.created_at) : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-4 gap-4">
            <StatCard icon="🎯" label="Total Bids" value={bidCount || 0} />
            <StatCard icon="🎫" label="Auctions Joined" value={registrationCount || 0} />
            <StatCard icon="⭐" label="Points" value={rewards?.total_points || 0} accent />
            <StatCard icon="🏆" label="Wins" value={rewards?.auctions_won || 0} />
          </div>

          {/* Rewards */}
          {rewards && (
            <div className="card-glass rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>🏅</span> Rewards & Achievements
              </h3>
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[var(--surface)] rounded-xl text-center">
                  <div className="text-3xl mb-2">🔥</div>
                  <p className="text-2xl font-bold text-[var(--gold)]">{rewards.current_streak}</p>
                  <p className="text-xs text-[var(--text-muted)]">Current Streak</p>
                </div>
                <div className="p-4 bg-[var(--surface)] rounded-xl text-center">
                  <div className="text-3xl mb-2">📈</div>
                  <p className="text-2xl font-bold text-white">{rewards.longest_streak}</p>
                  <p className="text-xs text-[var(--text-muted)]">Longest Streak</p>
                </div>
                <div className="p-4 bg-[var(--surface)] rounded-xl text-center">
                  <div className="text-3xl mb-2">🎪</div>
                  <p className="text-2xl font-bold text-white">{rewards.auctions_participated}</p>
                  <p className="text-xs text-[var(--text-muted)]">Auctions</p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Links */}
          <div className="card-glass rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Quick Links</h3>
            <div className="flex flex-wrap gap-3">
              <Link href="/my-auctions" className="btn-outline text-sm">
                My Auctions
              </Link>
              <Link href="/my-bids" className="btn-outline text-sm">
                My Bids
              </Link>
              <Link href="/" className="btn-gold text-sm">
                <span>Browse Auctions</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, accent = false }: { icon: string; label: string; value: number; accent?: boolean }) {
  return (
    <div className="card-glass rounded-xl p-4 text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <p className={`text-2xl font-bold ${accent ? 'text-[var(--gold)]' : 'text-white'}`}>{value}</p>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
    </div>
  )
}
