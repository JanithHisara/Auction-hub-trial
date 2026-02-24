'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Auction, Gem, Bid, UserRewards, AuctionRegistration, User } from '@/types/database'
import { Check, Loader2, Trophy } from 'lucide-react'
import Decimal from 'decimal.js'

interface WinnerInfo {
  gem_id: string
  user_id: string
  gem_name?: string
  winning_amount?: number
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

export default function AuctionRoomClient({ auction: initialAuction, items: initialItems, user, rewards: initialRewards }: Props) {
  const [auction, setAuction] = useState(initialAuction)
  const [items, setItems] = useState(initialItems)
  const [selectedItem, setSelectedItem] = useState(initialItems[0] || null)
  const [bidAmount, setBidAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPointsPopup, setShowPointsPopup] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [rewards, setRewards] = useState(initialRewards)
  const [newBidHighlight, setNewBidHighlight] = useState<string | null>(null)
  const [hasAcceptedPrice, setHasAcceptedPrice] = useState(false)
  const [hasPlacedBid, setHasPlacedBid] = useState(false) // For free-form one-bid rule
  const [userBidAmount, setUserBidAmount] = useState<number | null>(null) // User's own bid
  const [winners, setWinners] = useState<WinnerInfo[]>([])
  const [showWinnerPopup, setShowWinnerPopup] = useState(false)
  const [wonItem, setWonItem] = useState<{ name: string; amount: number } | null>(null)
  const [registeredCount, setRegisteredCount] = useState(0) // For % calculation
  const [biddingCountdown, setBiddingCountdown] = useState('') // For free-form countdown
  const [biddingTimeExpired, setBiddingTimeExpired] = useState(false) // Track when timer hits 0
  const supabase = createClient()
  const bidsContainerRef = useRef<HTMLDivElement>(null)
  const selectedItemIdRef = useRef<string | null>(selectedItem?.id || null)

  // Keep ref in sync with state
  useEffect(() => {
    selectedItemIdRef.current = selectedItem?.id || null
  }, [selectedItem?.id])

  // Keep selectedItem in sync with items array (for realtime updates)
  useEffect(() => {
    if (selectedItem) {
      const updatedItem = items.find(i => i.id === selectedItem.id)
      if (updatedItem && (
        updatedItem.round_end_time !== selectedItem.round_end_time ||
        updatedItem.status !== selectedItem.status ||
        updatedItem.current_price !== selectedItem.current_price
      )) {
        setSelectedItem(updatedItem)
      }
    }
  }, [items, selectedItem])

  const isFixedIncrement = auction.auction_type === 'progressive_elimination_auction'
  const isFreeForm = !isFixedIncrement
  const isBiddingActive = isFreeForm && selectedItem?.round_end_time && new Date(selectedItem.round_end_time) > new Date()

  // Calculate current bid and next minimum
  const currentBid = selectedItem?.bids?.length 
    ? Math.max(...selectedItem.bids.map(b => b.bid_amount))
    : selectedItem?.starting_price || 0
  const minBid = isFreeForm 
    ? selectedItem?.starting_price || 0  // Free-form: just starting price
    : currentBid + (selectedItem?.min_bid_increment || 100)
  const fixedPrice = selectedItem?.current_price || selectedItem?.starting_price || 0

  // For fixed increment: count how many accepted current price
  const currentPriceBidders = isFixedIncrement && selectedItem?.bids
    ? selectedItem.bids.filter(b => b.bid_amount === fixedPrice).length
    : 0
  const bidderPercentage = registeredCount > 0 
    ? Math.round((currentPriceBidders / registeredCount) * 100) 
    : 0

  // Fetch registered count for percentage calculation (using RPC to bypass RLS)
  useEffect(() => {
    const fetchRegisteredCount = async () => {
      const { data: count } = await supabase
        .rpc('get_auction_registration_count', { auction_uuid: auction.id })
      
      setRegisteredCount(count || 0)
    }
    fetchRegisteredCount()
  }, [auction.id, supabase])

  // Check if user has placed bid (for free-form) or accepted price (for fixed)
  useEffect(() => {
    if (selectedItem) {
      if (isFixedIncrement) {
        const userBid = selectedItem.bids?.find(
          b => b.user_id === user.id && b.bid_amount === fixedPrice
        )
        setHasAcceptedPrice(!!userBid)
      } else {
        // Free-form: check if user already placed any bid
        const userBid = selectedItem.bids?.find(b => b.user_id === user.id)
        setHasPlacedBid(!!userBid)
        setUserBidAmount(userBid?.bid_amount || null)
      }
    }
  }, [selectedItem, fixedPrice, user.id, isFixedIncrement])

  // Countdown timer for free-form bidding
  useEffect(() => {
    if (!isFreeForm || !selectedItem?.round_end_time) {
      setBiddingCountdown('')
      setBiddingTimeExpired(false)
      return
    }

    const updateCountdown = () => {
      const now = new Date().getTime()
      const end = new Date(selectedItem.round_end_time!).getTime()
      const distance = end - now

      if (distance <= 0) {
        setBiddingCountdown('00:00')
        setBiddingTimeExpired(true) // Mark as expired to update UI
        return
      }

      setBiddingTimeExpired(false)
      const hours = Math.floor(distance / (1000 * 60 * 60))
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((distance % (1000 * 60)) / 1000)

      if (hours > 0) {
        setBiddingCountdown(`${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      } else {
        setBiddingCountdown(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [isFreeForm, selectedItem?.round_end_time])

  // Fetch existing winners on load (with winning amount from bid)
  useEffect(() => {
    const fetchWinners = async () => {
      const itemIds = items.map(i => i.id)
      if (itemIds.length === 0) return

      const { data: existingWinners } = await supabase
        .from('auction_winners')
        .select('gem_id, user_id, winning_bid:bids(bid_amount)')
        .in('gem_id', itemIds)

      if (existingWinners?.length) {
        const winnersWithNames = existingWinners.map(w => {
          // winning_bid could be object or array depending on relationship type
          const winningBid = w.winning_bid as unknown
          const bidAmount = Array.isArray(winningBid) 
            ? (winningBid[0] as { bid_amount: number } | undefined)?.bid_amount
            : (winningBid as { bid_amount: number } | null)?.bid_amount
          return {
            gem_id: w.gem_id,
            user_id: w.user_id,
            gem_name: items.find(i => i.id === w.gem_id)?.name,
            winning_amount: bidAmount
          }
        })
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
          
          // For free-form auctions, only process own bids (others are hidden)
          if (isFreeForm && newBid.user_id !== user.id) {
            return // Don't show other users' bids in free-form
          }
          
          const { data: bidUser } = await supabase
            .from('users')
            .select('anonymous_name, email')
            .eq('id', newBid.user_id)
            .single()

          const bidWithUser: Bid = { 
            ...newBid, 
            user: bidUser ? { email: bidUser.email || '', anonymous_name: bidUser.anonymous_name } : undefined 
          }

          // For fixed increment, update bids list as normal
          if (isFixedIncrement) {
            setItems(prev => prev.map(item => {
              if (item.id === newBid.gem_id) {
                return {
                  ...item,
                  bids: [bidWithUser, ...item.bids].sort((a, b) => b.bid_amount - a.bid_amount) as Bid[],
                }
              }
              return item
            }))

            if (selectedItemIdRef.current === newBid.gem_id) {
              setSelectedItem(prev => prev ? {
                ...prev,
                bids: [bidWithUser, ...prev.bids].sort((a, b) => b.bid_amount - a.bid_amount) as Bid[],
              } : prev)
            }

            setNewBidHighlight(newBid.id)
            setTimeout(() => setNewBidHighlight(null), 2000)
          }

          // For own bids (both free-form and fixed), update state
          if (newBid.user_id === user.id) {
            if (isFreeForm) {
              setHasPlacedBid(true)
              setUserBidAmount(newBid.bid_amount)
            }
            
            if (newBid.points_earned > 0) {
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
        }
      )
      // Listen for item updates (status, price changes, round_end_time)
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
          
          // Update items array
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

          // Update selectedItem using ref to avoid stale closure
          if (selectedItemIdRef.current === updatedGem.id) {
            setSelectedItem(prev => {
              if (!prev) return prev
              
              // Reset accepted price status when price changes (new round) - for fixed increment
              if (prev.current_price !== updatedGem.current_price) {
                setHasAcceptedPrice(false)
              }
              
              // Reset bidding expired state when round_end_time changes (new round started)
              if (prev.round_end_time !== updatedGem.round_end_time) {
                setBiddingTimeExpired(false)
              }
              
              return {
                ...prev,
                status: updatedGem.status,
                current_price: updatedGem.current_price,
                round_end_time: updatedGem.round_end_time,
              }
            })
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
          // Update auction state in real-time
          setAuction(prev => ({
            ...prev,
            status: updatedAuction.status,
            auction_start: updatedAuction.auction_start,
            auction_end: updatedAuction.auction_end,
          }))
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
        async (payload) => {
          const newWinner = payload.new as { gem_id: string; user_id: string; winning_bid_id: string }
          
          // Check if this winner is for one of our items
          const wonGem = items.find(i => i.id === newWinner.gem_id)
          if (!wonGem) return
          
          // Fetch the winning bid amount
          let winningAmount = wonGem.starting_price
          if (newWinner.winning_bid_id) {
            const { data: winningBid } = await supabase
              .from('bids')
              .select('bid_amount')
              .eq('id', newWinner.winning_bid_id)
              .single()
            if (winningBid) {
              winningAmount = winningBid.bid_amount
            }
          }
          
          // Add to winners list with winning amount
          setWinners(prev => [...prev, { 
            gem_id: newWinner.gem_id, 
            user_id: newWinner.user_id, 
            gem_name: wonGem.name,
            winning_amount: winningAmount
          }])
          
          // Show popup if current user is the winner
          if (newWinner.user_id === user.id) {
            setWonItem({ name: wonGem.name, amount: winningAmount })
            setShowWinnerPopup(true)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [auction.id, items, user.id, supabase, isFixedIncrement, isFreeForm])

  // Free-form bid handler
  const handleVariableBid = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || isSubmitting || hasPlacedBid) return

    // Use Decimal.js for precise number handling
    const amount = new Decimal(bidAmount || '0').toNumber()
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

      // Immediately update UI state (don't wait for realtime)
      setHasPlacedBid(true)
      setUserBidAmount(amount)
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

  // Check if current user won the selected item and get winning amount
  const winnerInfo = selectedItem && winners.find(
    w => w.gem_id === selectedItem.id && w.user_id === user.id
  )
  const isWinnerOfSelectedItem = !!winnerInfo
  const selectedItemWinningAmount = winnerInfo?.winning_amount || currentBid

  // Status badge config
  const statusConfig: Record<string, { color: string; text: string; icon: string }> = {
    draft: { color: 'bg-gray-500/20 text-gray-400', text: 'DRAFT', icon: '📝' },
    upcoming: { color: 'bg-blue-500/20 text-blue-400', text: 'UPCOMING', icon: '📅' },
    registration_open: { color: 'bg-amber-500/20 text-amber-400', text: 'REGISTRATION', icon: '📋' },
    live: { color: 'bg-red-500/20 text-red-400', text: 'LIVE', icon: '' },
    ended: { color: 'bg-amber-500/20 text-amber-400', text: 'ENDED', icon: '🔔' },
    completed: { color: 'bg-purple-500/20 text-purple-400', text: 'COMPLETED', icon: '✅' },
  }

  const currentStatus = statusConfig[auction.status] || statusConfig.live
  const isAuctionLive = auction.status === 'live'

  return (
    <div className="auction-room min-h-screen">
      {/* Status Overlay - shown when auction is not live */}
      {!isAuctionLive && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#1a1a2e] to-[#0f0f18] border-2 border-[var(--border)] rounded-2xl p-8 max-w-md mx-4 text-center">
            {auction.status === 'ended' || auction.status === 'completed' ? (
              <>
                <div className="text-6xl mb-4">🏁</div>
                <h2 className="text-3xl font-black text-[var(--gold)] mb-2">Auction Ended</h2>
                <p className="text-[var(--text-secondary)] mb-6">
                  This auction has finished. Thank you for participating!
                </p>
                <a href="/my-auctions" className="btn-gold px-8 py-3 text-lg inline-block">
                  View My Auctions
                </a>
              </>
            ) : auction.status === 'registration_open' ? (
              <>
                <div className="text-6xl mb-4">⏳</div>
                <h2 className="text-3xl font-black text-white mb-2">Waiting to Start</h2>
                <p className="text-[var(--text-secondary)] mb-4">
                  The auction will begin shortly. Stay on this page for automatic updates.
                </p>
                <div className="p-4 bg-[var(--surface)] rounded-xl mb-4">
                  <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Scheduled Start</p>
                  <p className="text-xl font-bold text-[var(--gold)]">
                    {new Date(auction.auction_start).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-emerald-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-sm">Listening for updates...</span>
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">📅</div>
                <h2 className="text-3xl font-black text-white mb-2">Auction Not Available</h2>
                <p className="text-[var(--text-secondary)] mb-6">
                  This auction is currently {auction.status.replace('_', ' ')}.
                </p>
                <a href="/" className="btn-outline px-6 py-2 inline-block">
                  Back to Home
                </a>
              </>
            )}
          </div>
        </div>
      )}

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
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold flex-shrink-0 ${currentStatus.color}`}>
              {isAuctionLive && <span className="live-dot" />}
              {currentStatus.icon && <span>{currentStatus.icon}</span>}
              <span className="hidden sm:inline">{currentStatus.text}</span>
            </div>
            <h1 className="text-base sm:text-xl font-bold text-white truncate">{auction.name}</h1>
            <span className={`hidden sm:inline px-3 py-1 rounded-full text-xs font-bold flex-shrink-0 ${
              isFixedIncrement ? 'bg-purple-500/20 text-purple-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}>
              {isFixedIncrement ? 'Progressive Elimination Auction' : 'Tender Base / Fixed Bid'}
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
                // For free-form: only show starting price. For fixed: show current round price
                const displayPrice = isFreeForm 
                  ? item.starting_price
                  : (item.current_price || item.starting_price)
                const isSelected = selectedItem?.id === item.id
                const isItemEnded = item.status === 'ended' || item.status === 'completed'
                const userWonThisItem = winners.some(w => w.gem_id === item.id && w.user_id === user.id)
                // Check if user has placed a bid on this item (for free-form)
                const userBidOnItem = isFreeForm && item.bids?.some(b => b.user_id === user.id)
                // Check if bidding has started for this item (free-form)
                const biddingStarted = !!item.round_end_time
                const biddingActive = biddingStarted && new Date(item.round_end_time!) > new Date()

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
                      ) : isItemEnded ? (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded text-[10px] font-bold text-amber-400">
                          ENDED
                        </div>
                      ) : userBidOnItem && (
                        <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> BID
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
                            {formatCurrency(displayPrice)}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">
                            {isItemEnded 
                              ? 'Finished' 
                              : isFreeForm 
                                ? (!biddingStarted 
                                    ? '⏳ Not started' 
                                    : userBidOnItem 
                                      ? 'Bid placed' 
                                      : biddingActive 
                                        ? '🔴 Open' 
                                        : 'Closed')
                                : `${item.bids?.filter(b => b.bid_amount === (item.current_price || item.starting_price)).length || 0} accepted`
                            }
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
                          {isFixedIncrement ? 'Round Price' : 'Starting Price'}
                        </p>
                        <p className="text-2xl sm:text-4xl font-black text-[var(--gold)] font-mono animate-number-pop">
                          {formatCurrency(isFixedIncrement ? fixedPrice : selectedItem.starting_price)}
                        </p>
                      </div>
                      {isFixedIncrement && (
                        <div className="text-right">
                          <p className="text-xs sm:text-sm text-[var(--text-muted)]">Bidders</p>
                          <p className="text-sm sm:text-lg text-white">{bidderPercentage}% ({currentPriceBidders}/{registeredCount})</p>
                        </div>
                      )}
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
                            <p className="text-3xl font-black text-emerald-400">{formatCurrency(selectedItemWinningAmount)}</p>
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
                              className="btn-gold w-full py-4 text-lg flex items-center justify-center gap-2"
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
                    /* Free-form Bidding UI */
                    <div className="space-y-4">
                      {/* Check if bidding round has started and is active */}
                      {!selectedItem.round_end_time ? (
                        /* Waiting for bidding to start */
                        <div className="p-6 bg-blue-500/10 border-2 border-blue-500/30 rounded-xl text-center">
                          <div className="text-4xl mb-3">⏳</div>
                          <h3 className="text-xl font-bold text-blue-400 mb-2">Bidding Not Started</h3>
                          <p className="text-[var(--text-secondary)] text-sm mb-4">
                            The auction host will start the bidding shortly.
                          </p>
                          <div className="p-4 bg-[var(--surface)] rounded-lg">
                            <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Starting Price</p>
                            <p className="text-3xl font-black text-[var(--gold)]">{formatCurrency(selectedItem.starting_price)}</p>
                          </div>
                          <div className="flex items-center justify-center gap-2 text-emerald-400 mt-4">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-sm">Waiting for start...</span>
                          </div>
                        </div>
                      ) : biddingTimeExpired ? (
                        /* Bidding time expired - waiting for winner */
                        <div className="p-6 bg-purple-500/10 border-2 border-purple-500/30 rounded-xl text-center">
                          <div className="text-4xl mb-3">🏆</div>
                          <h3 className="text-xl font-bold text-purple-400 mb-2">Bidding Ended</h3>
                          {hasPlacedBid ? (
                            <>
                              <div className="p-4 bg-[var(--surface)] rounded-lg mb-4">
                                <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Your Bid</p>
                                <p className="text-2xl font-black text-emerald-400">{formatCurrency(userBidAmount || 0)}</p>
                              </div>
                              <p className="text-[var(--text-secondary)] text-sm mb-4">
                                Your bid has been submitted successfully.
                              </p>
                            </>
                          ) : (
                            <p className="text-[var(--text-secondary)] text-sm mb-4">
                              You did not place a bid for this item.
                            </p>
                          )}
                          <div className="flex items-center justify-center gap-2 text-purple-400">
                            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                            <span className="text-sm">Waiting for winner announcement...</span>
                          </div>
                        </div>
                      ) : hasPlacedBid ? (
                        /* User already placed their one bid - bidding still active */
                        <div className="space-y-4">
                          {/* Countdown timer */}
                          {biddingCountdown && biddingCountdown !== '00:00' && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-center">
                              <p className="text-xs text-amber-400 uppercase mb-1">Bidding ends in</p>
                              <p className="text-3xl font-mono font-bold text-amber-400">{biddingCountdown}</p>
                            </div>
                          )}
                          <div className="flex items-center justify-center gap-3 py-6 px-6 bg-emerald-500/20 border border-emerald-500/40 rounded-xl">
                            <Check className="w-8 h-8 text-emerald-400" />
                            <div className="text-center">
                              <span className="font-bold text-emerald-400 text-xl block">Bid Placed!</span>
                              <span className="text-emerald-300 text-lg">{formatCurrency(userBidAmount || 0)}</span>
                            </div>
                          </div>
                          <p className="text-center text-sm text-[var(--text-muted)]">
                            Your bid has been submitted. Winner will be announced when bidding ends.
                          </p>
                          <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                            <p className="text-xs text-[var(--text-muted)] uppercase mb-1 text-center">Note</p>
                            <p className="text-sm text-[var(--text-secondary)] text-center">
                              Bids are sealed. You cannot see other participants&apos; bids.
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Bid form for new bidders */
                        <form onSubmit={handleVariableBid} className="space-y-4">
                          <fieldset disabled={isSubmitting} className="border-0 p-0 m-0 min-w-0 space-y-4">
                          {/* Countdown timer */}
                          {biddingCountdown && (
                            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                              <p className="text-xs text-red-400 uppercase mb-1">Time remaining</p>
                              <p className="text-3xl font-mono font-bold text-red-400">{biddingCountdown}</p>
                            </div>
                          )}
                          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                            <p className="text-sm text-blue-300 text-center">
                              ⚠️ You can only place <strong>one bid</strong>. Make it count!
                            </p>
                          </div>
                          
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
                              <span>Place Bid {bidAmount ? formatCurrency(new Decimal(bidAmount).toNumber()) : ''}</span>
                            )}
                          </button>

                          <p className="text-center text-xs text-[var(--text-muted)]">
                            🔒 Sealed bid - others cannot see your bid
                          </p>
                          </fieldset>
                        </form>
                      )}
                    </div>
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

          {/* Bid History / Status Panel */}
          <div className="lg:col-span-1">
            {isFixedIncrement ? (
              /* Fixed Increment: Show bidders list and percentage */
              <>
                <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                  Accepted This Round
                </h2>
                
                {/* Participation stats */}
                <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)] mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[var(--text-muted)]">Participation</span>
                    <span className="text-xl font-bold text-[var(--gold)]">{bidderPercentage}%</span>
                  </div>
                  <div className="w-full bg-[var(--background)] rounded-full h-3 mb-2">
                    <div 
                      className="bg-gradient-to-r from-[var(--gold)] to-amber-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${bidderPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)]">
                    {currentPriceBidders} of {registeredCount} registered bidders
                  </p>
                </div>

                <div 
                  ref={bidsContainerRef}
                  className="bid-ticker max-h-[40vh] lg:max-h-[calc(100vh-300px)] overflow-y-auto"
                >
                  {selectedItem?.bids?.filter(b => b.bid_amount === fixedPrice).length ? (
                    selectedItem.bids
                      .filter(b => b.bid_amount === fixedPrice)
                      .map((bid) => (
                        <div 
                          key={bid.id} 
                          className={`bid-item ${newBidHighlight === bid.id ? 'animate-bid-flash' : ''}`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-emerald-400" />
                              <span className="text-white font-medium">
                                {bid.user?.anonymous_name || 'Anonymous'}
                              </span>
                            </div>
                          </div>
                          <span className="text-xs text-[var(--text-muted)]">
                            {new Date(bid.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                  ) : (
                    <div className="p-8 text-center text-[var(--text-muted)]">
                      <span className="text-4xl block mb-2">⏳</span>
                      No one has accepted yet
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Free-form: Sealed bids - show info panel */
              <>
                <h2 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4">
                  Auction Info
                </h2>
                <div className="space-y-4">
                  <div className="p-6 bg-[var(--surface)] rounded-xl border border-[var(--border)] text-center">
                    <span className="text-5xl block mb-3">🔒</span>
                    <h3 className="text-lg font-bold text-white mb-2">Sealed Bids</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      All bids are private. You cannot see other participants&apos; bids.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border)]">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">📋</span>
                      <span className="font-bold text-white">Rules</span>
                    </div>
                    <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        One bid per item
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        Bids are hidden from others
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-emerald-400">✓</span>
                        Highest bid wins
                      </li>
                    </ul>
                  </div>

                  {hasPlacedBid && (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
                      <div className="flex items-center gap-2 mb-1">
                        <Check className="w-4 h-4 text-emerald-400" />
                        <span className="font-bold text-emerald-400">Your Bid</span>
                      </div>
                      <p className="text-2xl font-black text-emerald-300">{formatCurrency(userBidAmount || 0)}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
