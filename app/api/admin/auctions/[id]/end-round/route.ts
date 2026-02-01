import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth'
import { NextResponse } from 'next/server'

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
    
    // Get current gem to check auction type
    const { data: gem } = await supabase
      .from('gems')
      .select('auction_id, auction:auctions(auction_type)')
      .eq('id', id)
      .single()

    // Handle auction join - could be object or array
    const auctionData = gem?.auction as unknown
    const auctionType = Array.isArray(auctionData)
      ? (auctionData[0] as { auction_type: string } | undefined)?.auction_type
      : (auctionData as { auction_type: string } | null)?.auction_type
    const isFreeForm = auctionType === 'variable_increment'

    // For free-form: end round AND set status to 'ended'
    // For fixed increment: just clear round_end_time
    const updateData: { round_end_time: null; status?: string } = { 
      round_end_time: null 
    }
    
    if (isFreeForm) {
      updateData.status = 'ended'
    }

    const { error } = await supabase
      .from('gems')
      .update(updateData)
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Round ended', status: isFreeForm ? 'ended' : undefined })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to end round'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
