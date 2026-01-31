'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Auction, Gem, Bid, UserRewards, AuctionRegistration, User } from '@/types/database'
import { Check, Loader2, Trophy } from 'lucide-react'

interface WinnerInfo {
  gem_id: string
  user_id: string
  gem_name?: string
}

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

export default function AuctionRoomClient({ auction, items: initialItems, user, rewards: initialRewards }: Props) {
  const [items, setItems] = useState(initialItems)
  const [selectedItem, setSelectedItem] = useState(initialItems[0] || null)
  const [bidAmount, setBidAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPointsPopup, setShowPointsPopup] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [rewards, setRewards] = useState(initialRewards)
  const [newBidHighlight, setNewBidHighlight] = useState<string | null>(null)
  const [hasAcceptedPrice, setHasAcceptedPrice] = useState(false)
  const [winners, setWinners] = useState<WinnerInfo[]>([])
  const [showWinnerPopup, setShowWinnerPopup] = useState(false)
  const [wonItem, setWonItem] = useState<{ name: string; amount: number } | null>(null)
  const supabase = createClient()
  const bidsContainerRef = useRef<HTMLDivElement>(null)

  const isFixedIncrement = auction.auction_type === 'fixed_increment'

  // Calculate current bid and next minimum
  const currentBid = selectedItem?.bids?.length 
    ? Math.max(...selectedItem.bids.map(b => b.bid_amount))
    : selectedItem?.starting_price || 0
  const minBid = currentBid + (selectedItem?.min_bid_increment || 100)
  const fixedPrice = selectedItem?.current_price || selectedItem?.starting_price || 0

  // Check if user has accepted current fixed price
  useEffect(() => {
    if (isFixedIncrement && selectedItem) {
      const userBid = selectedItem.bids?.find(
        b => b.user_id === user.id && b.bid_amount === fixedPrice
      )
      setHasAcceptedPrice(!!userBid)
    }
  }, [selectedItem, fixedPrice, user.id, isFixedIncrement])

  // Fetch existing winners on load
  useEffect(() => {
    const fetchWinners = async () => {
      const itemIds = items.map(i => i.id)
      if (itemIds.length === 0) return

      const { data: existingWinners } = await supabase
        .from('auction_winners')
        .select('gem_id, user_id')
        .in('gem_id', itemIds)

      if (existingWinners?.length) {
        const winnersWithNames = existingWinners.map(w => ({
          ...w,
          gem_name: items.find(i => i.id === w.gem_id)?.name
        }))
        setWinners(winnersWithNames)
      }
    }
    fetchWinners()
  }, [items, supabase])

  // Subscribe to realtime updates for bids, items, and auction
  useEffect(() => {
    const channel = supabase
      .channel(`auction-${auction.id}`)
      // Listen for new bids
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

          if (selectedItem?.id === newBid.gem_id) {
            setSelectedItem(prev => prev ? {
              ...prev,
              bids: [bidWithUser, ...prev.bids].sort((a, b) => b.bid_amount - a.bid_amount) as Bid[],
            } : prev)
          }

          setNewBidHighlight(newBid.id)
          setTimeout(() => setNewBidHighlight(null), 2000)

          if (newBid.user_id === user.id && newBid.points_earned > 0) {
            setPointsEarned(newBid.points_earned)
            setShowPointsPopup(true)
            setTimeout(() => setShowPointsPopup(false), 2000)
            
            setRewards(prev => prev ? {
              ...prev,
              total_points: prev.total_points + newBid.points_earned,
              total_bids_placed: prev.total_bids_placed + 1,
            } : null)
          }
        }
      )
      // Listen for item updates (status, price changes)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'gems',
          filter: `auction_id=eq.${auction.id}`,
        },
        (payload) => {
          const updatedGem = payload.new as Gem
          
          setItems(prev => prev.map(item => {
            if (item.id === updatedGem.id) {
              return {
                ...item,
                status: updatedGem.status,
                current_price: updatedGem.current_price,
                round_end_time: updatedGem.round_end_time,
              }
            }
            return item
          }))

          if (selectedItem?.id === updatedGem.id) {
            setSelectedItem(prev => prev ? {
              ...prev,
              status: updatedGem.status,
              current_price: updatedGem.current_price,
              round_end_time: updatedGem.round_end_time,
            } : prev)
            
            // Reset accepted price status when price changes (new round)
            if (isFixedIncrement && updatedGem.current_price !== selectedItem.current_price) {
              setHasAcceptedPrice(false)
            }
          }
        }
      )
      // Listen for auction updates
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auctions',
          filter: `id=eq.${auction.id}`,
        },
        (payload) => {
          const updatedAuction = payload.new as Auction
          // Could trigger UI updates for auction status changes
          if (updatedAuction.status === 'ended' || updatedAuction.status === 'completed') {
            // Auction has ended - could show a message or redirect
            window.location.reload()
          }
        }
      )
      // Listen for winner announcements
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'auction_winners',
        },
        (payload) => {
          const newWinner = payload.new as { gem_id: string; user_id: string }
          
          // Check if this winner is for one of our items
          const wonGem = items.find(i => i.id === newWinner.gem_id)
          if (!wonGem) return
          
          // Add to winners list
          setWinners(prev => [...prev, { ...newWinner, gem_name: wonGem.name }])
          
          // Show popup if current user is the winner
          if (newWinner.user_id === user.id) {
            const winningBid = wonGem.bids?.length 
              ? Math.max(...wonGem.bids.map(b => b.bid_amount))
              : wonGem.starting_price
            setWonItem({ name: wonGem.name, amount: winningBid })
            setShowWinnerPopup(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [auction.id, items, selectedItem, user.id, supabase, isFixedIncrement])

  // Variable increment bid handler
  const handleVariableBid = async (e: React.FormEvent) => {
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
        throw new Error(error.error || 'Failed to place bid')
      }

      setBidAmount('')
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to place bid'
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Fixed increment bid handler
  const handleFixedBid = async () => {
    if (!selectedItem || isSubmitting || hasAcceptedPrice) return

    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/gems/${selectedItem.id}/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to accept price')
      }

      setHasAcceptedPrice(true)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to accept price'
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const quickBid = (multiplier: number) => {
    setBidAmount(Math.round(minBid * multiplier).toString())
  }

  // Check if current user won the selected item
  const isWinnerOfSelectedItem = selectedItem && winners.some(
    w => w.gem_id === selectedItem.id && w.user_id === user.id
  )

  return (
    <div className="auction-room min-h-screen">
      {/* Points Popup */}
      {showPointsPopup && (
        <div className="points-popup text-4xl z-50" style={{ top: '30%', left: '50%', transform: 'translateX(-50%)' }}>
          +{pointsEarned} Points! 🎉
        </div>
      )}

      {/* Winner Popup */}
      {showWinnerPopup && wonItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f18] border-2 border-[var(--gold)] rounded-2xl p-8 max-w-md mx-4 text-center animate-bounce-in">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-black text-[var(--gold)] mb-2">You Won!</h2>
            <p className="text-xl text-white mb-4">{wonItem.name}</p>
            <div className="p-4 bg-[var(--surface)] rounded-xl mb-6">
              <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Winning Bid</p>
              <p className="text-3xl font-black text-emerald-400">{formatCurrency(wonItem.amount)}</p>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Congratulations! You&apos;ll receive payment instructions shortly.
            </p>
            <button
              onClick={() => setShowWinnerPopup(false)}
              className="btn-gold px-8 py-3 text-lg"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="live-badge flex-shrink-0">
              <span className="live-dot" />
              <span className="hidden sm:inline">LIVE</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold text-white truncate">{auction.name}</h1>
            <span className={`hidden sm:inline px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
              isFixedIncrement ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {isFixedIncrement ? 'Fixed Price Rounds' : 'Free Bidding'}
            </span>
          </div>
          
          {rewards && (
            <div className="flex items-center">
              <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--surface)] rounded-full">
                <span className="text-base sm:text-xl">🔥</span>
                <span className="font-bold text-[var(--gold)] text-sm sm:text-base">{rewards.total_points}</span>
                <span className="text-xs sm:text-sm text-[var(--text-muted)] hidden sm:inline">pts</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="grid lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Items List - horizontal scroll on mobile */}
          <div className="lg:col-span-1 space-y-3 sm:space-y-4">
            <h2 className="text-base sm:text-lg font-bold text-white">Items ({items.length})</h2>
            <div className="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[calc(100vh-200px)] pb-2 lg:pb-0 lg:pr-2 -mx-3 px-3 lg:mx-0 lg:px-0">
              {items.map((item) => {
                const itemHighestBid = item.bids?.length 
                  ? Math.max(...item.bids.map(b => b.bid_amount))
                  : item.starting_price
                const isSelected = selectedItem?.id === item.id
                const isItemEnded = item.status === 'ended' || item.status === 'completed'
                const userWonThisItem = winners.some(w => w.gem_id === item.id && w.user_id === user.id)

                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`flex-shrink-0 w-[140px] lg:w-full p-3 lg:p-4 rounded-xl text-left transition-all relative ${
                        userWonThisItem
                          ? 'bg-emerald-500/20 border-2 border-emerald-500/50'
                          : isSelected 
                            ? 'bg-[var(--gold)]/20 border-2 border-[var(--gold)]' 
                            : isItemEnded
                              ? 'bg-[var(--surface)]/50 border border-amber-500/30 opacity-75'
                              : 'bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--gold)]/50'
                      }`}
                    >
                      {userWonThisItem ? (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-emerald-500/30 border border-emerald-500/50 rounded text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <Trophy className="w-3 h-3" /> WON
                        </div>
                      ) : isItemEnded && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded text-[10px] font-bold text-amber-400">
                          ENDED
                        </div>
                      )}
                      <div className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-3">
                        <div className={`w-12 h-12 lg:w-14 lg:h-14 rounded-lg overflow-hidden bg-[var(--background-secondary)] flex-shrink-0 ${isItemEnded ? 'grayscale opacity-60' : ''}`}>
                          {item.gem_images?.[0]?.image_url ? (
                            <img 
                              src={item.gem_images[0].image_url}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xl lg:text-2xl opacity-30">💎</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 text-center lg:text-left">
                          <h3 className="font-bold text-white truncate text-xs lg:text-base">{item.name}</h3>
                          <p className={`font-mono text-xs lg:text-sm ${isItemEnded ? 'text-amber-400' : 'text-[var(--gold)]'}`}>
                            {formatCurrency(itemHighestBid)}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {isItemEnded ? 'Finished' : `${item.bids?.length || 0} bids`}
                          </p>
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
                <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
                  {selectedItem.gem_images?.[0]?.image_url ? (
                    <img 
                      src={selectedItem.gem_images[0].image_url}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[var(--surface)] to-[var(--background)] flex items-center justify-center">
                      <span className="text-6xl sm:text-8xl opacity-20">💎</span>
                    </div>
                  )}
                  
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4 sm:p-6">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs sm:text-sm text-[var(--text-muted)] uppercase tracking-wider">
                          {isFixedIncrement ? 'Round Price' : 'Current Bid'}
                        </p>
                        <p className="text-2xl sm:text-4xl font-black text-[var(--gold)] font-mono animate-number-pop">
                          {formatCurrency(isFixedIncrement ? fixedPrice : currentBid)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs sm:text-sm text-[var(--text-muted)]">Started at</p>
                        <p className="text-sm sm:text-lg text-white">{formatCurrency(selectedItem.starting_price)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Item Details & Bid Form */}
                <div className="p-4 sm:p-6">
                  <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">{selectedItem.name}</h2>
                  <p className="text-sm text-[var(--text-secondary)] mb-4 sm:mb-6 line-clamp-2">{selectedItem.description}</p>

                  {/* Check if item bidding has ended */}
                  {(selectedItem.status === 'ended' || selectedItem.status === 'completed') ? (
                    <div className="space-y-4">
                      {isWinnerOfSelectedItem ? (
                        /* User won this item */
                        <div className="p-6 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-xl text-center">
                          <div className="flex items-center justify-center gap-2 mb-3">
                            <Trophy className="w-10 h-10 text-[var(--gold)]" />
                          </div>
                          <h3 className="text-2xl font-bold text-emerald-400 mb-2">You Won!</h3>
                          <p className="text-[var(--text-secondary)] text-sm mb-4">
                            Congratulations! This item is yours.
                          </p>
                          <div className="p-4 bg-[var(--surface)] rounded-lg mb-4">
                            <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Your Winning Bid</p>
                            <p className="text-3xl font-black text-emerald-400">{formatCurrency(currentBid)}</p>
                          </div>
                          <p className="text-sm text-[var(--gold)]">
                            Check your email for payment instructions
                          </p>
                        </div>
                      ) : (
                        /* Item ended but user didn't win */
                        <div className="p-6 bg-amber-500/10 border-2 border-amber-500/30 rounded-xl text-center">
                          <div className="text-4xl mb-3">🔔</div>
                          <h3 className="text-xl font-bold text-amber-400 mb-2">Bidding Finished</h3>
                          <p className="text-[var(--text-secondary)] text-sm mb-4">
                            This item&apos;s auction has ended.
                          </p>
                          <div className="p-4 bg-[var(--surface)] rounded-lg">
                            <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Final Price</p>
                            <p className="text-3xl font-black text-[var(--gold)]">{formatCurrency(currentBid)}</p>
                          </div>
                        </div>
                      )}
                      {!isWinnerOfSelectedItem && !winners.some(w => w.gem_id === selectedItem.id) && (
                        <p className="text-center text-xs text-[var(--text-muted)]">
                          Winner will be announced shortly
                        </p>
                      )}
                    </div>
                  ) : isFixedIncrement ? (
                    /* Fixed Increment UI */
                    <div className="space-y-4">
                      {/* Check if round has started */}
                      {!selectedItem.round_end_time ? (
                        /* Waiting for round to start */
                        <div className="p-6 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl text-center">
                          <div className="text-4xl mb-3">⏳</div>
                          <h3 className="text-xl font-bold text-blue-400 mb-2">Waiting for Round</h3>
                          <p className="text-[var(--text-secondary)] text-sm mb-4">
                            The auction host will start the bidding round shortly.
                          </p>
                          <div className="p-4 bg-[var(--surface)] rounded-lg">
                            <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Starting Price</p>
                            <p className="text-3xl font-black text-[var(--gold)]">{formatCurrency(fixedPrice)}</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-[var(--text-muted)]">Round Price</span>
                              <span className="text-2xl font-bold text-[var(--gold)]">{formatCurrency(fixedPrice)}</span>
                            </div>
                            <p className="text-xs text-[var(--text-muted)]">
                              Accept this price to stay in the auction. Price increases each round.
                            </p>
                          </div>

                          {hasAcceptedPrice ? (
                            <div className="flex items-center justify-center gap-3 py-4 px-6 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
                              <Check className="w-6 h-6 text-emerald-400" />
                              <span className="font-bold text-emerald-400">Price Accepted!</span>
                            </div>
                          ) : (
                            <button
                              onClick={handleFixedBid}
                              disabled={isSubmitting}
                              className="btn-gold w-full py-4 text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <span>Accepting...</span>
                                </>
                              ) : (
                                <span>Accept {formatCurrency(fixedPrice)}</span>
                              )}
                            </button>
                          )}

                          <p className="text-center text-xs text-[var(--text-muted)]">
                            🎁 Earn 10 points for each round you accept!
                          </p>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Variable Increment UI */
                    <form onSubmit={handleVariableBid} className="space-y-4">
                      <div>
                        <label className="block text-sm text-[var(--text-muted)] mb-2">
                          Your Bid (min: {formatCurrency(minBid)})
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={bidAmount}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9]/g, '')
                              setBidAmount(val)
                            }}
                            placeholder={minBid.toString()}
                            className="w-full pl-8 pr-4 py-4 text-2xl font-bold bg-[var(--surface)] border-2 border-[var(--border)] rounded-xl focus:border-[var(--gold)] text-white"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => quickBid(1)}
                          className="flex-1 py-2 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors"
                        >
                          Min
                        </button>
                        <button
                          type="button"
                          onClick={() => quickBid(1.25)}
                          className="flex-1 py-2 px-4 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm font-bold text-[var(--text-secondary)] hover:border-[var(--gold)] transition-colors"
                        >
                          +25%
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
                        className="btn-gold w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Placing Bid...</span>
                          </>
                        ) : (
                          <span>Place Bid {bidAmount ? formatCurrency(parseFloat(bidAmount)) : ''}</span>
                        )}
                      </button>

                      <p className="text-center text-xs text-[var(--text-muted)]">
                        🎁 Earn 10 points per bid!
                      </p>
                    </form>
                  )}
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
            <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
              {isFixedIncrement ? 'Accepted This Round' : 'Bid History'}
            </h2>
            <div 
              ref={bidsContainerRef}
              className="bid-ticker max-h-[40vh] lg:max-h-[calc(100vh-200px)] overflow-y-auto"
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
                        {idx === 0 && !isFixedIncrement && (
                          <span className="text-xs px-2 py-0.5 bg-[var(--gold)]/20 text-[var(--gold)] rounded-full">Leading</span>
                        )}
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
                  {isFixedIncrement ? 'No one has accepted yet' : 'No bids yet. Be the first!'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
