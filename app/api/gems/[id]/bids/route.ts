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
      .select('*, user:users(email)')
      .eq('gem_id', id)
      .order('bid_amount', { ascending: false })

    if (error) throw error

    return NextResponse.json(bids)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    const body = await request.json()

    // Verify gem exists and is active
    const { data: gem } = await supabase
      .from('gems')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .single()

    if (!gem) {
      return NextResponse.json({ error: 'Auction not found or not active' }, { status: 404 })
    }

    // Check if auction hasn't ended
    const now = new Date()
    const endTime = new Date(gem.end_time)
    if (now >= endTime) {
      return NextResponse.json({ error: 'Auction has ended' }, { status: 400 })
    }

    // Get current highest bid
    const { data: highestBid } = await supabase
      .from('bids')
      .select('bid_amount')
      .eq('gem_id', id)
      .order('bid_amount', { ascending: false })
      .limit(1)
      .single()

    const currentHighest = highestBid?.bid_amount || gem.starting_price
    const minBid = currentHighest + gem.min_bid_increment

    if (body.bid_amount < minBid) {
      return NextResponse.json(
        { error: `Minimum bid is ${minBid}` },
        { status: 400 }
      )
    }

    // Create bid
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        gem_id: id,
        user_id: user.id,
        bid_amount: body.bid_amount,
      })
      .select()
      .single()

    if (bidError) throw bidError

    return NextResponse.json(bid)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

