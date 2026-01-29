import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get item details
    const { data: item } = await supabase
      .from('gems')
      .select(`
        id,
        name,
        description,
        starting_price,
        current_price,
        min_bid_increment,
        status,
        end_time,
        round_end_time,
        gem_images (image_url),
        auction:auctions (name)
      `)
      .eq('id', id)
      .single()

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    const isFinished = item.status === 'ended' || item.status === 'completed'

    // Get bid statistics
    const { count: bidCount } = await supabase
      .from('bids')
      .select('*', { count: 'exact', head: true })
      .eq('gem_id', id)

    // Get unique bidders count
    const { data: uniqueBiddersData } = await supabase
      .from('bids')
      .select('user_id')
      .eq('gem_id', id)

    const uniqueBidders = new Set(uniqueBiddersData?.map(b => b.user_id) || []).size

    // Get highest bid
    const { data: highestBidData } = await supabase
      .from('bids')
      .select('bid_amount')
      .eq('gem_id', id)
      .order('bid_amount', { ascending: false })
      .limit(1)
      .single()

    const highestBid = highestBidData?.bid_amount || item.current_price || item.starting_price

    // Get recent bids (without user info - just amounts and times for live display)
    const { data: recentBids } = await supabase
      .from('bids')
      .select('id, bid_amount, created_at, user_id')
      .eq('gem_id', id)
      .order('created_at', { ascending: false })
      .limit(10)

    let topBidders: { anonymous_name: string; bid_amount: number }[] = []

    // Only get bidder details if auction has ended
    if (isFinished) {
      const { data: topBidsWithUsers } = await supabase
        .from('bids')
        .select('bid_amount, user:users(anonymous_name)')
        .eq('gem_id', id)
        .order('bid_amount', { ascending: false })
        .limit(10)

      topBidders = (topBidsWithUsers || []).map(b => ({
        anonymous_name: (b.user as { anonymous_name: string })?.anonymous_name || 'Anonymous',
        bid_amount: b.bid_amount,
      }))
    }

    return NextResponse.json({
      item: {
        id: item.id,
        name: item.name,
        description: item.description,
        starting_price: item.starting_price,
        current_price: item.current_price,
        min_bid_increment: item.min_bid_increment,
        status: item.status,
        end_time: item.end_time,
        round_end_time: item.round_end_time,
        gem_images: item.gem_images,
        auction: item.auction,
      },
      bidCount: bidCount || 0,
      uniqueBidders,
      highestBid,
      recentBids: recentBids || [],
      isFinished,
      topBidders,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
