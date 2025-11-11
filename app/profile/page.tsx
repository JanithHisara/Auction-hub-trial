import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'

export default async function ProfilePage() {
  const user = await requireAuth()
  const supabase = await createClient()

  const { data: userData } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: bids } = await supabase
    .from('bids')
    .select('id')
    .eq('user_id', user.id)

  const bidCount = bids?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[#f5f4f0] to-[#f0ede8] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Profile</h1>

          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">Email</label>
              <p className="text-[var(--text-primary)] text-lg mt-1">{userData?.email}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">Role</label>
              <p className="text-[var(--text-primary)] text-lg mt-1 capitalize">{userData?.role}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">Member Since</label>
              <p className="text-[var(--text-primary)] text-lg mt-1">
                {userData?.created_at ? formatDate(userData.created_at) : 'N/A'}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-[var(--text-secondary)]">Total Bids</label>
              <p className="text-[var(--text-primary)] text-lg mt-1">{bidCount}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

