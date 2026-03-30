'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface Props {
  auctionId: string
  userId?: string
  children: React.ReactNode
}

export default function AuctionLobbyClient({ auctionId, userId, children }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [notification, setNotification] = useState<{ type: 'approved' | 'live' | 'round_ended' | 'next_round'; message: string } | null>(null)

  useEffect(() => {
    const channel = supabase
      .channel(`lobby-${auctionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auctionId}`,
        },
        (payload) => {
          const updated = payload.new as { status?: string }
          if (updated.status === 'live') {
            setNotification({ type: 'live', message: 'The auction is now LIVE! Refreshing...' })
            setTimeout(() => router.refresh(), 1500)
          } else {
            router.refresh()
          }
        }
      )

    if (userId) {
      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auction_registrations',
          filter: `auction_id=eq.${auctionId}`,
        },
        (payload) => {
          const updated = payload.new as { user_id?: string; approval_status?: string }
          if (updated.user_id === userId) {
            if (updated.approval_status === 'approved') {
              setNotification({ type: 'approved', message: 'Your registration has been approved! Refreshing...' })
            }
            setTimeout(() => router.refresh(), 1500)
          }
        }
      )
    }

    // Listen for gem updates (round changes)
    channel.on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'gems',
      },
      (payload) => {
        const updated = payload.new as { auction_id?: string; round_end_time?: string | null; current_price?: number; status?: string }
        if (updated.auction_id === auctionId) {
          if (updated.status === 'active' && updated.round_end_time === null) {
            setNotification({ type: 'round_ended', message: 'Round has ended. Waiting for next round...' })
            setTimeout(() => setNotification(null), 5000)
          }
          if (updated.round_end_time && updated.current_price) {
            setNotification({ type: 'next_round', message: 'New round has started!' })
            setTimeout(() => setNotification(null), 5000)
          }
          router.refresh()
        }
      }
    )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [auctionId, userId, router, supabase])

  return (
    <>
      {notification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-bounce-in">
          <div className={`px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-2 ${
            notification.type === 'approved'
              ? 'bg-emerald-500 text-white'
              : notification.type === 'live'
                ? 'bg-red-500 text-white'
                : notification.type === 'round_ended'
                  ? 'bg-amber-500 text-white'
                  : 'bg-blue-500 text-white'
          }`}>
            <span>{
              notification.type === 'approved' ? '✅' :
              notification.type === 'live' ? '🔴' :
              notification.type === 'round_ended' ? '⏰' : '🔔'
            }</span>
            {notification.message}
          </div>
        </div>
      )}
      {children}
    </>
  )
}
