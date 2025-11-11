import { requireAdmin } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin()

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[#f5f4f0] to-[#f0ede8]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--gold-dark)] to-[var(--gold-accent)] bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h1>
          <p className="text-[var(--text-secondary)]">Manage your gem auctions</p>
        </div>

        <nav className="mb-8 border-b border-[var(--border)]">
          <div className="flex gap-6">
            <Link
              href="/admin"
              className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--gold-dark)] border-b-2 border-transparent hover:border-[var(--gold)] transition-colors font-medium"
            >
              Overview
            </Link>
            <Link
              href="/admin/gems"
              className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--gold-dark)] border-b-2 border-transparent hover:border-[var(--gold)] transition-colors font-medium"
            >
              Gems
            </Link>
            <Link
              href="/admin/gems/new"
              className="px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--gold-dark)] border-b-2 border-transparent hover:border-[var(--gold)] transition-colors font-medium"
            >
              New Gem
            </Link>
          </div>
        </nav>

        {children}
      </div>
    </div>
  )
}

