'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, MessageCircle } from 'lucide-react'
import Link from 'next/link'

interface Notification {
  id: string
  message: string
  sender_name: string
  auction_id: string
  timestamp: number
}

export default function GlobalChatNotifier({ userId, role }: { userId?: string; role?: string | null }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('global-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages'
        },
        async (payload) => {
          const newMsg = payload.new
          
          // Don't notify if we sent it
          if (newMsg.sender_id === userId) return

          // Fetch sender details and conversation details to verify we should see this
          const { data: conv } = await supabase
            .from('chat_conversations')
            .select('auction_id, user_id, assigned_admin_id')
            .eq('id', newMsg.conversation_id)
            .single()

          if (!conv) return

          // Determine if we should be notified
          const isParticipant = conv.user_id === userId || conv.assigned_admin_id === userId
          const isGlobalAdmin = role === 'admin' || role === 'super_admin'
          // If we aren't a participant and we aren't a global admin, skip
          if (!isParticipant && !isGlobalAdmin) return

          // Fetch sender name via API to bypass RLS
          let senderName = 'Unknown User'
          try {
            const res = await fetch('/api/chat/user-profile?id=' + newMsg.sender_id)
            const data = await res.json()
            if (data.name) senderName = data.name
          } catch (e) {
            console.error(e)
          }

          const id = Math.random().toString(36).substr(2, 9)
          setNotifications(prev => [...prev, {
            id,
            message: newMsg.message,
            sender_name: senderName,
            auction_id: conv.auction_id,
            timestamp: Date.now()
          }])

          // Auto dismiss after 5 seconds
          setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id))
          }, 5000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, role, supabase])

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {notifications.map(notif => {
        // Link logic: Admins click to go to auction admin page, users to their room
        const linkHref = (role === 'admin' || role === 'super_admin' || role === 'moderator') 
          ? '/admin/chat'
          : '/auctions/' + notif.auction_id

        return (
          <div key={notif.id} className="bg-[var(--surface-elevated)] border border-[var(--gold)]/30 rounded-xl p-4 shadow-xl pointer-events-auto animate-in slide-in-from-right-8 fade-in duration-300">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--gold)]/10 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-[var(--gold)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{notif.sender_name}</p>
                <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mt-0.5">{notif.message}</p>
                <Link href={linkHref} className="text-xs text-[var(--gold)] hover:underline mt-2 inline-block">
                  View Chat
                </Link>
              </div>
              <button 
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="text-[var(--text-muted)] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}