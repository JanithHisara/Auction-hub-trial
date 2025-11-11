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
    const body = await request.json()

    // Verify admin owns this gem
    const { data: gem } = await supabase
      .from('gems')
      .select('admin_id, status')
      .eq('id', id)
      .single()

    if (!gem || gem.admin_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (gem.status !== 'ended') {
      return NextResponse.json({ error: 'Auction must be ended' }, { status: 400 })
    }

    // Verify bid exists and belongs to this gem
    const { data: bid } = await supabase
      .from('bids')
      .select('user_id')
      .eq('id', body.bid_id)
      .eq('gem_id', id)
      .single()

    if (!bid) {
      return NextResponse.json({ error: 'Bid not found' }, { status: 404 })
    }

    // Create auction winner record
    const { data: winner, error: winnerError } = await supabase
      .from('auction_winners')
      .insert({
        gem_id: id,
        user_id: bid.user_id,
        winning_bid_id: body.bid_id,
        admin_id: user.id,
      })
      .select()
      .single()

    if (winnerError) throw winnerError

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

