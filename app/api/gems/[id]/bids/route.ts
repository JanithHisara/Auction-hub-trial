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
    // Select anonymous_name instead of email
    const { data: bids, error } = await supabase
      .from('bids')
      .select('*, user:users(anonymous_name)')
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

    // Check registration
    const { data: registration } = await supabase
      .from('auction_registrations')
      .select('id')
      .eq('gem_id', id)
      .eq('user_id', user.id)
      .single()

    if (!registration) {
      return NextResponse.json({ error: 'You must register for this auction to bid' }, { status: 403 })
    }

    // Check if auction hasn't ended
    const now = new Date()
    const endTime = new Date(gem.end_time)
    if (now >= endTime) {
      return NextResponse.json({ error: 'Auction has ended' }, { status: 400 })
    }

    // Check if user already bid for THIS round price
    const { data: existingBid } = await supabase
      .from('bids')
      .select('id')
      .eq('gem_id', id)
      .eq('user_id', user.id)
      .eq('bid_amount', gem.current_price)
      .single()

    if (existingBid) {
      return NextResponse.json({ error: 'You have already accepted this price' }, { status: 400 })
    }

    // Create bid at CURRENT price
    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        gem_id: id,
        user_id: user.id,
        bid_amount: gem.current_price,
      })
      .select()
      .single()

    if (bidError) throw bidError

    return NextResponse.json(bid)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
