'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface RealtimeGemStatusProps {
  gemId: string
  onStatusChange?: (status: string) => void
}

export default function RealtimeGemStatus({ gemId, onStatusChange }: RealtimeGemStatusProps) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel(`gem:${gemId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gems',
          filter: `id=eq.${gemId}`,
        },
        (payload) => {
          const newStatus = (payload.new as any).status
          if (onStatusChange) {
            onStatusChange(newStatus)
          }
          // Refresh page if status changes to ended or completed
          if (newStatus === 'ended' || newStatus === 'completed') {
            router.refresh()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gemId, router, onStatusChange])

  return null
}

