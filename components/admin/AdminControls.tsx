'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Play, SkipForward, Trophy } from 'lucide-react'

interface AdminControlsProps {
  gemId: string
  currentPrice: number
  status: string
  roundEndTime: string | null
}

export default function AdminControls({ gemId, currentPrice, status, roundEndTime }: AdminControlsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAction = async (action: 'start' | 'increment' | 'end') => {
    setLoading(true)
    try {
      let endpoint = ''

      if (action === 'start') {
        endpoint = `/api/admin/auctions/${gemId}/start-round`
      } else if (action === 'increment') {
        endpoint = `/api/admin/auctions/${gemId}/increment`
      } else if (action === 'end') {
        endpoint = `/api/admin/auctions/${gemId}/select-winner`
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) 
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Action failed')
      } else {
        router.refresh()
      }
    } catch (e) {
      console.error(e)
      alert('Action failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card-glass rounded-xl p-6 mb-6">
      <h3 className="text-lg font-bold text-white mb-4">Auction Controls</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-[var(--surface)] rounded-xl">
          <div className="text-xs text-[var(--text-muted)] uppercase mb-1">Current Price</div>
          <div className="text-2xl font-bold text-[var(--gold)]">{formatCurrency(currentPrice)}</div>
        </div>
        <div className="p-4 bg-[var(--surface)] rounded-xl">
          <div className="text-xs text-[var(--text-muted)] uppercase mb-1">Status</div>
          <div className="text-2xl font-bold text-white uppercase">{status}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {status === 'active' && !roundEndTime && (
          <button
            onClick={() => handleAction('start')}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Start First Round
          </button>
        )}

        {status === 'active' && roundEndTime && (
          <button
            onClick={() => handleAction('increment')}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SkipForward className="w-4 h-4" />}
            Next Round
          </button>
        )}

        {(status === 'active' || status === 'ended') && (
          <button
            onClick={() => handleAction('end')}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trophy className="w-4 h-4" />}
            End & Select Winner
          </button>
        )}
      </div>
    </div>
  )
}
