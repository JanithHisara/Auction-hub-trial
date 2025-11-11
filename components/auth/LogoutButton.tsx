'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--gold-dark)] transition-colors rounded-lg hover:bg-[var(--gold-light)]/20"
    >
      Logout
    </button>
  )
}

