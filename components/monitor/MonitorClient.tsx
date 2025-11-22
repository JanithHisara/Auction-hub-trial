'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'

interface MonitorStats {
  totalRegistered: number
  uniqueBidders: number
  currentPrice: number
  percentageLeft: number
  status: string
  endTime: string
  roundEndTime: string | null
}

export default function MonitorClient({ gemId }: { gemId: string }) {
  const [stats, setStats] = useState<MonitorStats | null>(null)
  const [timeLeft, setTimeLeft] = useState<string | null>(null)
  const supabase = createClient()

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/gems/${gemId}/monitor`)
      if (res.ok) {
        setStats(await res.json())
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchStats()
    
    // Realtime subscriptions
    const channel = supabase
      .channel('monitor')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bids', filter: `gem_id=eq.${gemId}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'auction_registrations', filter: `gem_id=eq.${gemId}` }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gems', filter: `id=eq.${gemId}` }, () => fetchStats())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [gemId])

  useEffect(() => {
    if (!stats?.roundEndTime) {
      setTimeLeft(null)
      return
    }

    const interval = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(stats.roundEndTime!).getTime()
      const distance = end - now

      if (distance < 0) {
        setTimeLeft('00:00')
        clearInterval(interval)
        return
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
    }, 1000)

    return () => clearInterval(interval)
  }, [stats?.roundEndTime])

  if (!stats) return <div className="flex items-center justify-center h-screen bg-black text-white animate-pulse">Loading Monitor...</div>

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 flex flex-col font-sans">
      <header className="mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-4xl font-bold text-center uppercase tracking-[0.2em] text-[var(--gold)]">
          Live Auction Monitor
        </h1>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 flex-1 max-w-7xl mx-auto w-full">
        {/* Left: Price */}
        <div className="flex flex-col items-center justify-center bg-zinc-900 rounded-3xl p-8 sm:p-12 border border-zinc-800 shadow-2xl shadow-[var(--gold)]/5">
          <h2 className="text-xl sm:text-2xl text-zinc-400 uppercase tracking-wider mb-6 sm:mb-10">Current Price</h2>
          <div className="text-6xl sm:text-8xl lg:text-9xl font-bold text-[var(--gold)] tabular-nums tracking-tight">
            {formatCurrency(stats.currentPrice)}
          </div>
          
          {timeLeft && (
            <div className="mt-8 sm:mt-12 flex flex-col items-center gap-2">
              <div className="text-sm text-zinc-500 uppercase tracking-widest">Next Round In</div>
              <div className="text-4xl sm:text-5xl font-mono font-bold text-white tabular-nums">
                {timeLeft}
              </div>
            </div>
          )}

          <div className="mt-8 sm:mt-12 flex items-center gap-3 px-6 py-3 bg-zinc-800 rounded-full">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-lg sm:text-xl text-zinc-300 font-medium">
              {stats.uniqueBidders} Active Bidders
            </span>
          </div>
        </div>

        {/* Right: Progress */}
        <div className="flex flex-col items-center justify-center bg-zinc-900 rounded-3xl p-8 sm:p-12 border border-zinc-800 shadow-2xl shadow-[var(--gold)]/5">
           <h2 className="text-xl sm:text-2xl text-zinc-400 uppercase tracking-wider mb-8 sm:mb-12">Participation Rate</h2>
           
           <div className="relative w-full max-w-lg">
              <div className="h-10 sm:h-12 w-full bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
                 <div 
                   className="h-full bg-gradient-to-r from-[var(--gold-dark)] via-[var(--gold)] to-[var(--gold-accent)] transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(255,215,0,0.3)]"
                   style={{ width: `${stats.percentageLeft}%` }}
                 />
              </div>
              <div className="flex justify-between mt-4 text-lg sm:text-xl font-medium text-zinc-500 px-2">
                 <span>0%</span>
                 <span className="text-white">{stats.percentageLeft}%</span>
                 <span>100%</span>
              </div>
           </div>

           <div className="mt-12 sm:mt-16 text-center">
              <div className="flex items-baseline justify-center gap-2 mb-3">
                <span className="text-5xl sm:text-7xl font-bold text-white">{stats.uniqueBidders}</span>
                <span className="text-2xl sm:text-4xl text-zinc-600">/</span>
                <span className="text-3xl sm:text-5xl text-zinc-500">{stats.totalRegistered}</span>
              </div>
              <div className="text-zinc-500 uppercase tracking-wider text-sm sm:text-base font-medium">
                Registered Users Participating
              </div>
           </div>
        </div>
      </div>
      
      {/* Footer Status */}
      <div className="mt-8 sm:mt-12 text-center">
         <div className="inline-flex items-center gap-3 px-6 py-2 bg-zinc-900 rounded-full border border-zinc-800">
            <span className="text-zinc-500 uppercase tracking-widest text-lg">Status</span>
            <span className={`text-lg font-bold uppercase ${stats.status === 'active' ? 'text-green-500' : 'text-red-500'}`}>
              {stats.status}
            </span>
         </div>
      </div>
    </div>
  )
}
