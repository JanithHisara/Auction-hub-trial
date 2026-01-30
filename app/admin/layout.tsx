import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'
import { LayoutDashboard, Calendar, Gem, Plus } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Background */}
      <div className="fixed inset-0 bg-grid-pattern opacity-20" />
      
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-black text-white mb-1 sm:mb-2">
              Auxtion<span className="text-gradient-gold">Hub</span> Admin
            </h1>
            <p className="text-sm sm:text-base text-[var(--text-secondary)]">Manage auctions, items, and users</p>
          </div>

          {/* Navigation */}
          <nav className="mb-6 sm:mb-8 -mx-4 px-4 overflow-x-auto">
            <div className="flex gap-2 pb-3 sm:pb-4 border-b border-[var(--border)] min-w-max">
              <NavLink href="/admin" icon={<LayoutDashboard className="w-4 h-4" />}>
                Overview
              </NavLink>
              <NavLink href="/admin/auctions" icon={<Calendar className="w-4 h-4" />}>
                Auctions
              </NavLink>
              <NavLink href="/admin/gems" icon={<Gem className="w-4 h-4" />}>
                Items
              </NavLink>
              <NavLink href="/admin/auctions/new" icon={<Plus className="w-4 h-4" />} highlight>
                New Auction
              </NavLink>
              <NavLink href="/admin/approve" icon={<LayoutDashboard className="w-4 h-4" />}>
                Approve
              </NavLink>
            </div>
          </nav>

          {/* Content */}
          {children}
        </div>
      </div>
    </div>
  )
}

function NavLink({ 
  href, 
  children, 
  icon, 
  highlight = false 
}: { 
  href: string
  children: React.ReactNode
  icon?: React.ReactNode
  highlight?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
        highlight 
          ? 'bg-[var(--gold)] text-black hover:bg-[var(--gold-light)]' 
          : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface)]'
      }`}
    >
      {icon}
      {children}
    </Link>
  )
}
