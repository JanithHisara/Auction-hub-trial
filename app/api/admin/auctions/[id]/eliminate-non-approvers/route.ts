import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requirePermission(PERMISSIONS.CONTROL_BIDDING)

    const supabase = await createClient()

    // Get the gem info
    const { data: gem } = await supabase
      .from('gems')
      .select('id, current_price, starting_price, status, auction_id, auction:auctions(auction_type)')
      .eq('id', id)
      .single()

    if (!gem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const auctionType = (gem.auction as unknown as { auction_type: string } | null)?.auction_type
    if (auctionType !== 'incremental_approval_auction') {
      return NextResponse.json(
        { error: 'This action is only available for Incremental Approval Auctions' },
        { status: 400 }
      )
    }

    if (gem.status !== 'active') {
      return NextResponse.json({ error: 'Item must be active to eliminate non-approvers' }, { status: 400 })
    }

    const currentPrice = gem.current_price || gem.starting_price

    // Call the Postgres function to eliminate non-approvers
    const { data: eliminatedCount, error } = await supabase
      .rpc('eliminate_non_approvers', {
        p_gem_id: id,
        p_price: currentPrice,
      })

    if (error) throw error

    return NextResponse.json({
      message: 'Non-approvers eliminated',
      eliminated_count: eliminatedCount,
      at_price: currentPrice,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to eliminate non-approvers'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
