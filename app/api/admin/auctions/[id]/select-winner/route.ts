import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAdmin()
    const supabase = await createClient()

    // Verify admin owns this gem
    const { data: gem } = await supabase
      .from('gems')
      .select('admin_id, status, current_price')
      .eq('id', id)
      .single()

    if (!gem || gem.admin_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Allow ending active auctions too, to select winner immediately
    if (gem.status !== 'ended' && gem.status !== 'active') {
      return NextResponse.json({ error: 'Auction must be active or ended' }, { status: 400 })
    }

    // Find the winner automatically
    // Criteria:
    // 1. Highest Bid Amount (which should be current_price in this model)
    // 2. Earliest created_at timestamp (First to bid)
    const { data: winningBid } = await supabase
      .from('bids')
      .select('id, user_id, bid_amount, created_at')
      .eq('gem_id', id)
      .order('bid_amount', { ascending: false })
      .order('created_at', { ascending: true }) // First come, first served
      .limit(1)
      .single()

    if (!winningBid) {
      return NextResponse.json({ error: 'No bids found for this auction' }, { status: 404 })
    }

    // Create auction winner record
    const { data: winner, error: winnerError } = await supabase
      .from('auction_winners')
      .insert({
        gem_id: id,
        user_id: winningBid.user_id,
        winning_bid_id: winningBid.id,
        admin_id: user.id,
      })
      .select()
      .single()

    if (winnerError) {
        // Check for unique constraint violation (already selected)
        if (winnerError.code === '23505') {
             return NextResponse.json({ message: 'Winner already selected' }, { status: 200 })
        }
        throw winnerError
    }

    // Update gem status to completed
    await supabase
      .from('gems')
      .update({ status: 'completed' })
      .eq('id', id)

    return NextResponse.json(winner)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
