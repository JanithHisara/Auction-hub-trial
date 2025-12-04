'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Auction, Gem, Bid, UserRewards, AuctionRegistration, User } from '@/types/database'

interface Props {
  auction: Auction
  items: (Gem & { gem_images: { image_url: string }[]; bids: Bid[] })[]
  user: User
  registration: AuctionRegistration
  rewards: UserRewards | null
  token: string
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount)
}

export default function AuctionRoomClient({ auction, items: initialItems, user, rewards: initialRewards, token }: Props) {
  const [items, setItems] = useState(initialItems)
  const [selectedItem, setSelectedItem] = useState(initialItems[0] || null)
  const [bidAmount, setBidAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPointsPopup, setShowPointsPopup] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [rewards, setRewards] = useState(initialRewards)
  const [newBidHighlight, setNewBidHighlight] = useState<string | null>(null)
  const supabase = createClient()
  const bidsContainerRef = useRef<HTMLDivElement>(null)

  // Calculate current bid and next minimum
  const currentBid = selectedItem?.bids?.length 
    ? Math.max(...selectedItem.bids.map(b => b.bid_amount))
    : selectedItem?.starting_price || 0
  const minBid = currentBid + (selectedItem?.min_bid_increment || 100)

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel(`auction-${auction.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bids',
          filter: `gem_id=in.(${items.map(i => i.id).join(',')})`,
        },
        async (payload) => {
          const newBid = payload.new as Bid
          
          // Fetch user info for the bid
          const { data: bidUser } = await supabase
            .from('users')
            .select('anonymous_name, email')
            .eq('id', newBid.user_id)
            .single()

          const bidWithUser: Bid = { 
            ...newBid, 
            user: bidUser ? { email: bidUser.email || '', anonymous_name: bidUser.anonymous_name } : undefined 
          }

          setItems(prev => prev.map(item => {
            if (item.id === newBid.gem_id) {
              return {
                ...item,
                bids: [bidWithUser, ...item.bids].sort((a, b) => b.bid_amount - a.bid_amount) as Bid[],
              }
            }
            return item
          }))

          // Update selected item if it's the one that got a new bid
          if (selectedItem?.id === newBid.gem_id) {
            setSelectedItem(prev => prev ? {
              ...prev,
              bids: [bidWithUser, ...prev.bids].sort((a, b) => b.bid_amount - a.bid_amount) as Bid[],
            } : prev)
          }

          // Highlight new bid
          setNewBidHighlight(newBid.id)
          setTimeout(() => setNewBidHighlight(null), 2000)

          // Show points if it's the current user's bid
          if (newBid.user_id === user.id && newBid.points_earned > 0) {
            setPointsEarned(newBid.points_earned)
            setShowPointsPopup(true)
            setTimeout(() => setShowPointsPopup(false), 2000)
            
            // Update rewards
            setRewards(prev => prev ? {
              ...prev,
              total_points: prev.total_points + newBid.points_earned,
              total_bids_placed: prev.total_bids_placed + 1,
            } : null)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [auction.id, items, selectedItem, user.id, supabase])

  const handleBid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || isSubmitting) return

    const amount = parseFloat(bidAmount)
    if (isNaN(amount) || amount < minBid) {
      alert(`Minimum bid is ${formatCurrency(minBid)}`)
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/gems/${selectedItem.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bid_amount: amount }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Failed to place bid')
      }

      setBidAmount('')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to place bid'
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickBid = (multiplier: number) => {
    setBidAmount((minBid * multiplier).toString())
  }

  return (
    <div className="auction-room min-h-screen">
      {/* Points Popup */}
      {showPointsPopup && (
        <div className="points-popup text-4xl z-50" style={{ top: '30%', left: '50%', transform: 'translateX(-50%)' }}>
          +{pointsEarned} Points! 🎉
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="live-badge">
              <span className="live-dot" />
              LIVE
            </div>
            <h1 className="text-xl font-bold text-white truncate">{auction.name}</h1>
          </div>
          
          {/* User Rewards */}
          {rewards && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] rounded-full">
                <span className="text-xl">🔥</span>
                <span className="font-bold text-[var(--gold)]">{rewards.total_points}</span>
                <span className="text-sm text-[var(--text-muted)]">pts</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface)] rounded-full">
                <span className="text-xl">🎯</span>
                <span className="font-bold text-white">{rewards.total_bids_placed}</span>
                <span className="text-sm text-[var(--text-muted)]">bids</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Items List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-bold text-white mb-4">Items ({items.length})</h2>
            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
              {items.map((item) => {
                const itemHighestBid = item.bids?.length 
                  ? Math.max(...item.bids.map(b => b.bid_amount))
                  : item.starting_price
                const isSelected = selectedItem?.id === item.id

                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      isSelected 
                        ? 'bg-[var(--gold)]/20 border-2 border-[var(--gold)]' 
                        : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--gold)]/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-[var(--background-secondary)] flex-shrink-0">
                        {item.gem_images?.[0]?.image_url ? (
                          <img 
                            src={item.gem_images[0].image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">💎</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate">{item.name}</h3>
                        <p className="text-[var(--gold)] font-mono text-sm">{formatCurrency(itemHighestBid)}</p>
                        <p className="text-xs text-[var(--text-muted)]">{item.bids?.length || 0} bids</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Main Bidding Area */}
          <div className="lg:col-span-2">
            {selectedItem ? (
              <div className="card-glass rounded-2xl overflow-hidden">
                {/* Item Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  {selectedItem.gem_images?.[0]?.image_url ? (
                    <img 
                      src={selectedItem.gem_images[0].image_url}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--surface)] to-[var(--background)] flex items-center justify-center">
                      <span className="text-8xl opacity-20">💎</span>
                    </div>
                  )}
                  
                  {/* Current Bid Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm text-[var(--text-muted)] uppercase tracking-wider">Current Bid</p>
                        <p className="text-4xl font-black text-[var(--gold)] font-mono animate-number-pop">
                          {formatCurrency(currentBid)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[var(--text-muted)]">Started at</p>
                        <p className="text-lg text-white">{formatCurrency(selectedItem.starting_price)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item Details & Bid Form */}
                <div className="p-6">
                  <h2 className="text-2xl font-bold text-white mb-2">{selectedItem.name}</h2>
                  <p className="text-[var(--text-secondary)] mb-6 line-clamp-2">{selectedItem.description}</p>

                  {/* Bid Form */}
                  <form onSubmit={handleBid} className="space-y-4">
                    <div>
                      <label className="block text-sm text-[var(--text-muted)] mb-2">
                        Your Bid (min: {formatCurrency(minBid)})
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                        <input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          placeholder={minBid.toString()}
                          min={minBid}
                          step="1"
                          className="w-full pl-8 pr-4 py-4 text-2xl font-bold bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl focus:border-[var(--gold)]"
                        />
                      </div>
                    </div>

                    {/* Quick Bid Buttons */}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => quickBid(1)}
                        className="flex-1 py-2 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors"
                      >
                        Min Bid
                      </button>
                      <button
                        type="button"
                        onClick={() => quickBid(1.5)}
                        className="flex-1 py-2 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors"
                      >
                        +50%
                      </button>
                      <button
                        type="button"
                        onClick={() => quickBid(2)}
                        className="flex-1 py-2 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors"
                      >
                        x2
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !bidAmount}
                      className="btn-gold w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span>{isSubmitting ? 'Placing Bid...' : `Place Bid ${bidAmount ? formatCurrency(parseFloat(bidAmount)) : ''}`}</span>
                    </button>

                    <p className="text-center text-xs text-[var(--text-muted)]">
                      🎁 Earn 10 points per bid!
                    </p>
                  </form>
                </div>
              </div>
            ) : (
              <div className="card-glass rounded-2xl p-12 text-center">
                <span className="text-6xl mb-4 block">👈</span>
                <p className="text-[var(--text-secondary)]">Select an item to start bidding</p>
              </div>
            )}
          </div>

          {/* Bid History */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-bold text-white mb-4">Bid History</h2>
            <div 
              ref={bidsContainerRef}
              className="bid-ticker max-h-[calc(100vh-200px)] overflow-y-auto"
            >
              {selectedItem?.bids?.length ? (
                selectedItem.bids.map((bid, idx) => (
                  <div 
                    key={bid.id} 
                    className={`bid-item ${newBidHighlight === bid.id ? 'animate-bid-flash' : ''} ${idx === 0 ? 'highlight' : ''}`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="bid-amount">{formatCurrency(bid.bid_amount)}</span>
                        {idx === 0 && <span className="text-xs px-2 py-0.5 bg-[var(--gold)]/20 text-[var(--gold)] rounded-full">Leading</span>}
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">
                        {bid.user?.anonymous_name || 'Anonymous'}
                      </p>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {new Date(bid.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-[var(--text-muted)]">
                  <span className="text-4xl block mb-2">🏁</span>
                  No bids yet. Be the first!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

