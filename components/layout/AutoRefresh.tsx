'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AutoRefresh() {
  const router = useRouter()
  const pathname = usePathname()
  
  // EXTREMELY IMPORTANT: Do not run global refresh on the live auction room!
  // The AuctionRoomClient already handles real-time updates instantly via local state.
  // Running router.refresh() at the same time causes severe race conditions where stale server data overwrites fresh client data.
  if (pathname?.includes('/auction-room/')) {
    return null
  }

  const supabase = createClient()

  useEffect(() => {
    const triggerRefresh = () => {
      router.refresh()
    }

    // Subscribe to Postgres changes on tables that can be changed by admins
    const channel = supabase
      .channel('global-admin-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gems' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auctions' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_registrations' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids' }, triggerRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bidder_holds' }, triggerRefresh)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'gem_eliminations' }, triggerRefresh)
      .subscribe()

    // Refresh immediately when the user returns to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerRefresh()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Slow fallback polling (every 30 seconds) just in case realtime connection drops/fails
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        triggerRefresh()
      }
    }, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [router, supabase, pathname])

  return null
}
