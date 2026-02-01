import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { sendWinnerEmail } from '@/lib/email/resend'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAdmin()
    const supabase = await createClient()

    // Get gem with auction info
    const { data: gem } = await supabase
      .from('gems')
      .select(`
        id,
        name,
        admin_id, 
        status, 
        current_price,
        auction_id,
        gem_images(image_url),
        auction:auctions(name)
      `)
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

    // Auto-activate next pending item in the auction
    if (gem.auction_id) {
      const { data: nextPendingItem } = await supabase
        .from('gems')
        .select('id, name')
        .eq('auction_id', gem.auction_id)
        .eq('status', 'pending')
        .order('start_time', { ascending: true })
        .limit(1)
        .single()

      if (nextPendingItem) {
        await supabase
          .from('gems')
          .update({ status: 'active' })
          .eq('id', nextPendingItem.id)
        
        console.log(`Auto-activated next item: ${nextPendingItem.name}`)
      }
    }

    // Get winner's user info for email
    const { data: winnerUser } = await supabase
      .from('users')
      .select('email, anonymous_name')
      .eq('id', winningBid.user_id)
      .single()

    // Send winner notification email
    if (winnerUser?.email) {
      try {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
        const gemImages = gem.gem_images as { image_url: string }[] | null
        const auctionData = gem.auction as { name: string } | null
        
        await sendWinnerEmail({
          to: winnerUser.email,
          userName: winnerUser.anonymous_name || undefined,
          gemName: gem.name,
          gemImageUrl: gemImages?.[0]?.image_url,
          winningAmount: winningBid.bid_amount,
          auctionName: auctionData?.name || 'Auction',
          paymentUrl: `${appUrl}/payment/${gem.id}`,
        })
      } catch (emailError) {
        // Log email error but don't fail the winner selection
        console.error('Failed to send winner email:', emailError)
      }
    }

    return NextResponse.json(winner)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to select winner'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
