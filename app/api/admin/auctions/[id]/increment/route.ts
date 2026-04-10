import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { NextResponse } from 'next/server'
import Decimal from 'decimal.js'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await requirePermission(PERMISSIONS.CONTROL_BIDDING)

    const supabase = await createClient()
    
    const { data: gem } = await supabase
      .from('gems')
      .select('*')
      .eq('id', id)
      .single()

    if (!gem) {
        return NextResponse.json({ error: 'Gem not found' }, { status: 404 })
    }

    // Count unique bidders at current price level (>= to include device bids that may exceed exact price)
    const { data: currentLevelBids } = await supabase
      .from('bids')
      .select('user_id')
      .eq('gem_id', id)
      .gte('bid_amount', gem.current_price)

    const uniqueBidders = new Set((currentLevelBids || []).map(b => b.user_id)).size

    if (uniqueBidders <= 1) {
        return NextResponse.json({ 
            error: 'Cannot increment price. Wait for more bidders or end the auction.' 
        }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const incrementAmount = body.increment || gem.min_bid_increment
    const durationSeconds = body.duration || gem.increment_interval
    
    const newPrice = new Decimal(gem.current_price).plus(new Decimal(incrementAmount)).toNumber()
    const now = new Date()
    const nextRoundEnd = new Date(now.getTime() + (durationSeconds * 1000))
    
    const { error } = await supabase
      .from('gems')
      .update({ 
          current_price: newPrice,
          round_end_time: nextRoundEnd.toISOString() 
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Price incremented', current_price: newPrice })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to increment'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
