'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { Loader2, Play, SkipForward, Trophy } from 'lucide-react'

interface AdminControlsProps {
  gemId: string
  currentPrice: number
  minIncrement: number
  status: string
  roundEndTime: string | null
}

export default function AdminControls({ gemId, currentPrice, minIncrement, status, roundEndTime }: AdminControlsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showNextRoundModal, setShowNextRoundModal] = useState(false)
  const [customIncrement, setCustomIncrement] = useState(minIncrement.toString())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])
  const [useCustomIncrement, setUseCustomIncrement] = useState(false)

  const handleAction = async (action: 'start' | 'increment' | 'end', increment?: number) => {
    setLoading(true)
    try {
      let endpoint = ''
      let body: Record<string, unknown> = {}

      if (action === 'start') {
        endpoint = `/api/admin/auctions/${gemId}/start-round`
      } else if (action === 'increment') {
        endpoint = `/api/admin/auctions/${gemId}/increment`
        if (increment !== undefined) {
          body = { increment }
        }
      } else if (action === 'end') {
        endpoint = `/api/admin/auctions/${gemId}/select-winner`
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body) 
      })

      if (!res.ok) {
        const error = await res.json()
        alert(error.error || 'Action failed')
      } else {
        setShowNextRoundModal(false)
        router.refresh()
      }
    } catch (e) {
      console.error(e)
      alert('Action failed')
    } finally {
      setLoading(false)
    }
  }

  const handleNextRound = () => {
    const increment = useCustomIncrement ? parseFloat(customIncrement) : minIncrement
    if (isNaN(increment) || increment <= 0) {
      alert('Please enter a valid increment amount')
      return
    }
    handleAction('increment', increment)
  }

  return (
    <>
      <div className="card-glass rounded-xl p-6 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">Auction Controls</h3>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-[var(--surface)] rounded-xl">
            <div className="text-xs text-[var(--text-muted)] uppercase mb-1">Current Price</div>
            <div className="text-2xl font-bold text-[var(--gold)]">{formatCurrency(currentPrice)}</div>
          </div>
          <div className="p-4 bg-[var(--surface)] rounded-xl">
            <div className="text-xs text-[var(--text-muted)] uppercase mb-1">Default Increment</div>
            <div className="text-2xl font-bold text-white">{formatCurrency(minIncrement)}</div>
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
              onClick={() => setShowNextRoundModal(true)}
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

      {/* Next Round Modal - Portal to document.body */}
      {mounted && showNextRoundModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a24] border border-[var(--border)] rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <SkipForward className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Start Next Round</h3>
                <p className="text-sm text-[var(--text-secondary)]">Configure the price increment</p>
              </div>
            </div>

            {/* Price Preview */}
            <div className="p-4 bg-[var(--surface)] rounded-xl mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[var(--text-muted)]">Current Price</span>
                <span className="text-xl font-bold text-white">{formatCurrency(currentPrice)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[var(--text-muted)]">Increment</span>
                <span className="text-xl font-bold text-blue-400">
                  +{formatCurrency(useCustomIncrement ? parseFloat(customIncrement) || 0 : minIncrement)}
                </span>
              </div>
              <div className="border-t border-[var(--border)] pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[var(--text-muted)]">New Price</span>
                  <span className="text-2xl font-bold text-[var(--gold)]">
                    {formatCurrency(currentPrice + (useCustomIncrement ? parseFloat(customIncrement) || 0 : minIncrement))}
                  </span>
                </div>
              </div>
            </div>

            {/* Increment Options */}
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg cursor-pointer hover:border-[var(--gold)]/50">
                <input
                  type="radio"
                  checked={!useCustomIncrement}
                  onChange={() => setUseCustomIncrement(false)}
                  className="w-4 h-4 text-[var(--gold)]"
                />
                <div>
                  <p className="text-white font-medium">Default Increment</p>
                  <p className="text-sm text-[var(--text-muted)]">{formatCurrency(minIncrement)}</p>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg cursor-pointer hover:border-[var(--gold)]/50">
                <input
                  type="radio"
                  checked={useCustomIncrement}
                  onChange={() => setUseCustomIncrement(true)}
                  className="w-4 h-4 text-[var(--gold)] mt-1"
                />
                <div className="flex-1">
                  <p className="text-white font-medium mb-2">Custom Increment</p>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={customIncrement}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '')
                        setCustomIncrement(val)
                        setUseCustomIncrement(true)
                      }}
                      placeholder="Enter amount"
                      className="w-full pl-8 pr-4 py-2 bg-[var(--background)] border border-[var(--border)] rounded-lg text-white focus:border-[var(--gold)]"
                    />
                  </div>
                </div>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowNextRoundModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-white font-medium hover:bg-[var(--surface-elevated)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleNextRound}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-blue-500 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Starting...</span>
                  </>
                ) : (
                  <>
                    <SkipForward className="w-4 h-4" />
                    <span>Start Round</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
