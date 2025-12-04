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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-white mb-2">
              Admin <span className="text-gradient-gold">Dashboard</span>
            </h1>
            <p className="text-[var(--text-secondary)]">Manage auctions, items, and users</p>
          </div>

          {/* Navigation */}
          <nav className="mb-8 overflow-x-auto">
            <div className="flex gap-2 pb-4 border-b border-[var(--border)]">
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
