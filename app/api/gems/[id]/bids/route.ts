import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import Decimal from 'decimal.js'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: bids, error } = await supabase
      .from('bids')
      .select('*, user:users(anonymous_name)')
      .eq('gem_id', id)
      .order('bid_amount', { ascending: false })

    if (error) throw error

    return NextResponse.json(bids)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get bids'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAuth()
    const supabase = await createClient()
    const body = await request.json().catch(() => ({}))
    
    // Get gem with auction info
    const { data: gem } = await supabase
      .from('gems')
      .select('*, auction:auctions(auction_type)')
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (!gem) {
      return NextResponse.json({ error: 'Auction not found or not active' }, { status: 404 })
    }

    const auctionType = (gem.auction as { auction_type: string } | null)?.auction_type || 'tender_base_fixed_bid'

    // Check if auction hasn't ended
    const now = new Date()
    const endTime = new Date(gem.end_time)
    if (now >= endTime) {
      return NextResponse.json({ error: 'Auction has ended' }, { status: 400 })
    }

    // Get highest current bid
    const { data: highestBidData } = await supabase
      .from('bids')
      .select('bid_amount')
      .eq('gem_id', id)
      .order('bid_amount', { ascending: false })
      .limit(1)
      .single()

    const currentHighestBid = highestBidData?.bid_amount || gem.starting_price

    let bidAmount: number

    if (auctionType === 'progressive_elimination_auction') {
      // Progressive elimination: user accepts current price
      bidAmount = gem.current_price || gem.starting_price

      // Check if user already accepted this price
      const { data: existingBid } = await supabase
        .from('bids')
        .select('id')
        .eq('gem_id', id)
        .eq('user_id', user.id)
        .eq('bid_amount', bidAmount)
        .single()

      if (existingBid) {
        return NextResponse.json({ error: 'You have already accepted this price' }, { status: 400 })
      }
    } else {
      // Tender base / fixed bid: user submits custom amount (one bid only)
      
      // Check if bidding round is active
      if (!gem.round_end_time) {
        return NextResponse.json({ error: 'Bidding has not started yet' }, { status: 400 })
      }
      
      const roundEndTime = new Date(gem.round_end_time)
      if (now >= roundEndTime) {
        return NextResponse.json({ error: 'Bidding time has ended' }, { status: 400 })
      }
      
      // Check if user already placed a bid (one bid only rule)
      const { data: existingBid } = await supabase
        .from('bids')
        .select('id')
        .eq('gem_id', id)
        .eq('user_id', user.id)
        .single()

      if (existingBid) {
        return NextResponse.json({ error: 'You have already placed a bid for this item' }, { status: 400 })
      }

      if (!body.bid_amount || (typeof body.bid_amount !== 'number' && typeof body.bid_amount !== 'string')) {
        return NextResponse.json({ error: 'Bid amount is required' }, { status: 400 })
      }

      // Use Decimal.js for precise number handling
      try {
        bidAmount = new Decimal(body.bid_amount).toNumber()
      } catch {
        return NextResponse.json({ error: 'Invalid bid amount' }, { status: 400 })
      }

      // For tender base: bid must be >= starting price (hidden bids, so no increment from current)
      if (bidAmount < gem.starting_price) {
        return NextResponse.json({ 
          error: `Bid must be at least ${gem.starting_price}`,
          minBid: gem.starting_price 
        }, { status: 400 })
      }
    }

    // Create bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        gem_id: id,
        user_id: user.id,
        bid_amount: bidAmount,
      })
      .select()
      .single()

    if (bidError) throw bidError

    return NextResponse.json(bid)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to place bid'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
