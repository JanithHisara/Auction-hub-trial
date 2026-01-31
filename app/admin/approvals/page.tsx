import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AuctionRegistration, RegistrationApprovalStatus } from '@/types/database'
import RegistrationStatusActions from '@/components/admin/RegistrationStatusActions'
import LocalTime from '@/components/ui/LocalTime'

async function getData(status?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()
  
  if (userData?.role !== 'admin') redirect('/')

  const adminClient = createAdminClient()

  // Get all auctions for this admin
  const { data: auctions } = await adminClient
    .from('auctions')
    .select('id, name')
    .eq('admin_id', user.id)

  if (!auctions?.length) {
    return { registrations: [], counts: { all: 0, pending: 0, approved: 0, rejected: 0 }, auctions: [] }
  }

  const auctionIds = auctions.map(a => a.id)

  // Get registrations with optional filter
  let query = adminClient
    .from('auction_registrations')
    .select('*, user:users!auction_registrations_user_id_fkey(email, anonymous_name), auction:auctions(id, name)')
    .in('auction_id', auctionIds)
    .order('registered_at', { ascending: false })

  if (status && ['pending', 'approved', 'rejected'].includes(status)) {
    query = query.eq('approval_status', status)
  }

  const { data: registrations } = await query

  // Get counts by status
  const { data: allRegs } = await adminClient
    .from('auction_registrations')
    .select('approval_status')
    .in('auction_id', auctionIds)

  const counts = {
    all: allRegs?.length || 0,
    pending: allRegs?.filter(r => r.approval_status === 'pending').length || 0,
    approved: allRegs?.filter(r => r.approval_status === 'approved').length || 0,
    rejected: allRegs?.filter(r => r.approval_status === 'rejected').length || 0,
  }

  return { registrations: registrations || [], counts, auctions }
}


const statusColors: Record<RegistrationApprovalStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
}

type RegistrationWithDetails = AuctionRegistration & { 
  user: { email: string; anonymous_name?: string }
  auction: { id: string; name: string }
}

export default async function ApprovalsPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const { registrations, counts } = await getData(status)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Registration Approvals</h1>
          <p className="text-[var(--text-secondary)]">Manage registration requests across all auctions</p>
        </div>
        {counts.pending > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/40 rounded-lg">
            <span className="text-amber-400 font-bold">{counts.pending}</span>
            <span className="text-amber-400/80 text-sm">pending approval{counts.pending !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2">
        <FilterTab href="/admin/approvals" active={!status} label="All" count={counts.all} />
        <FilterTab href="/admin/approvals?status=pending" active={status === 'pending'} label="Pending" count={counts.pending} color="amber" />
        <FilterTab href="/admin/approvals?status=approved" active={status === 'approved'} label="Approved" count={counts.approved} color="emerald" />
        <FilterTab href="/admin/approvals?status=rejected" active={status === 'rejected'} label="Rejected" count={counts.rejected} color="red" />
      </div>

      {/* Registrations List */}
      <div className="card-glass rounded-xl overflow-hidden">
        {registrations.length > 0 ? (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[var(--border)]">
                    <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase">User</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase">Auction</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase">Registered</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase">Status</th>
                    <th className="text-right py-3 px-4 text-xs font-medium text-[var(--text-muted)] uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {registrations.map((reg: RegistrationWithDetails) => (
                    <tr key={reg.id} className="hover:bg-[var(--surface-elevated)]">
                      <td className="py-3 px-4">
                        <p className="text-white font-medium">{reg.user?.anonymous_name || 'Anonymous'}</p>
                        <p className="text-xs text-[var(--text-muted)]">{reg.user?.email}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Link 
                          href={`/admin/auctions/${reg.auction.id}`}
                          className="text-[var(--gold)] hover:underline font-medium"
                        >
                          {reg.auction.name}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-[var(--text-secondary)] text-sm">
                        <LocalTime date={reg.registered_at} />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${statusColors[reg.approval_status]}`}>
                          {reg.approval_status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <RegistrationStatusActions 
                          auctionId={reg.auction.id} 
                          registrationId={reg.id} 
                          currentStatus={reg.approval_status}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-[var(--border)]">
              {registrations.map((reg: RegistrationWithDetails) => (
                <div key={reg.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-white font-medium">{reg.user?.anonymous_name || 'Anonymous'}</p>
                      <p className="text-xs text-[var(--text-muted)]">{reg.user?.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${statusColors[reg.approval_status]}`}>
                      {reg.approval_status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[var(--gold)]">📅 {reg.auction.name}</span>
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    Registered: <LocalTime date={reg.registered_at} format="short" />
                  </div>
                  <RegistrationStatusActions 
                    auctionId={reg.auction.id} 
                    registrationId={reg.id} 
                    currentStatus={reg.approval_status}
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <p className="text-4xl mb-4">✅</p>
            <p>{status === 'pending' ? 'No pending registrations' : 'No registrations found'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function FilterTab({ 
  href, 
  active, 
  label, 
  count, 
  color 
}: { 
  href: string
  active: boolean
  label: string
  count: number
  color?: string
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
        active 
          ? 'bg-white/10 text-white border-white/20' 
          : 'text-[var(--text-secondary)] border-[var(--border)] hover:bg-white/5'
      } ${color === 'amber' && count > 0 ? 'border-amber-500/50' : ''}`}
    >
      {label} 
      <span className={`ml-1 ${color === 'amber' && count > 0 ? 'text-amber-400 font-bold' : 'opacity-60'}`}>
        ({count})
      </span>
    </Link>
  )
}
