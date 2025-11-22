import { createClient } from '@/lib/supabase/server'
import { requireAuth, getUserRole } from '@/lib/auth'
import { NextResponse } from 'next/server'

// Create new route to increment price (Admin only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const role = await getUserRole()
    
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()
    
    // Get current gem state
    const { data: gem } = await supabase
      .from('gems')
      .select('*')
      .eq('id', id)
      .single()

    if (!gem) {
        return NextResponse.json({ error: 'Gem not found' }, { status: 404 })
    }

    // Check how many users bidded for the CURRENT price
    // Note: We use the current_price to check participation in the CURRENT round
    const { count: currentLevelBidders } = await supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })
      .eq('gem_id', id)
      .eq('bid_amount', gem.current_price)

    // Only allow increment if more than 1 user accepted the current price
    // OR if it is the starting round (where current_price might equal starting_price and no bids yet, 
    // but usually admin starts round then users bid. 
    // If this is "Next Round", we expect bidders.
    // If bidders <= 1, we should probably not increment and instead show a warning or end auction.
    // However, user requested "price should only increment if there are more than one user has bidded".
    
    if ((currentLevelBidders || 0) <= 1) {
        return NextResponse.json({ 
            error: 'Cannot increment price. Wait for more bidders or end the auction.' 
        }, { status: 400 })
    }

    const newPrice = Number(gem.current_price) + Number(gem.min_bid_increment)
    const now = new Date()
    const nextRoundEnd = new Date(now.getTime() + (gem.increment_interval * 1000))
    
    // Update gem price AND next round time
    const { error } = await supabase
      .from('gems')
      .update({ 
          current_price: newPrice,
          round_end_time: nextRoundEnd.toISOString() 
      })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Price incremented', current_price: newPrice })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
