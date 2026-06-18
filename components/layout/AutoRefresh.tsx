'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AutoRefresh() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    // Do not auto-refresh on admin pages to avoid disrupting admin inputs/actions
    if (pathname?.startsWith('/admin')) {
      return
    }

    // Subscribe to Postgres changes on tables that can be changed by admins
    const channel = supabase
      .channel('global-admin-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'gems' },
        () => {
          if (document.visibilityState === 'visible') {
            router.refresh()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auctions' },
        () => {
          if (document.visibilityState === 'visible') {
            router.refresh()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'auction_registrations' },
        () => {
          if (document.visibilityState === 'visible') {
            router.refresh()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bids' },
        () => {
          if (document.visibilityState === 'visible') {
            router.refresh()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bidder_holds' },
        () => {
          if (document.visibilityState === 'visible') {
            router.refresh()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'gem_eliminations' },
        () => {
          if (document.visibilityState === 'visible') {
            router.refresh()
          }
        }
      )
      .subscribe()

    // Slow fallback polling (every 30 seconds) just in case realtime connection drops/fails
    const handleFallbackRefresh = () => {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }
    const interval = setInterval(handleFallbackRefresh, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(interval)
    }
  }, [router, supabase, pathname])

  return null
}
