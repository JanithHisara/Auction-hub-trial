import { createClient } from '@/lib/supabase/server'
import { requireAuth } from '@/lib/auth'
import { NextResponse } from 'next/server'

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

    const auctionType = (gem.auction as { auction_type: string } | null)?.auction_type || 'variable_increment'

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

    if (auctionType === 'fixed_increment') {
      // Fixed increment: user accepts current price
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
      // Variable increment: user submits custom amount
      bidAmount = body.bid_amount

      if (!bidAmount || typeof bidAmount !== 'number') {
        return NextResponse.json({ error: 'Bid amount is required' }, { status: 400 })
      }

      const minBid = currentHighestBid + gem.min_bid_increment

      if (bidAmount < minBid) {
        return NextResponse.json({ 
          error: `Bid must be at least ${minBid}`,
          minBid 
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
