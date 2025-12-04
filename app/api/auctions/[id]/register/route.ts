import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendAuctionAccessEmail } from '@/lib/email/resend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: auctionId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    // Get auction
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auctionId)
      .single()

    if (auctionError || !auction) {
      return NextResponse.json({ message: 'Auction not found' }, { status: 404 })
    }

    // Registration is allowed when admin sets status to 'registration_open'
    if (auction.status !== 'registration_open') {
      return NextResponse.json({ message: 'Registration is not open' }, { status: 400 })
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from('auction_registrations')
      .select('id')
      .eq('auction_id', auctionId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      return NextResponse.json({ message: 'Already registered for this auction' }, { status: 400 })
    }

    // Check max participants
    if (auction.max_participants) {
      const { count } = await supabase
        .from('auction_registrations')
        .select('*', { count: 'exact', head: true })
        .eq('auction_id', auctionId)

      if (count && count >= auction.max_participants) {
        return NextResponse.json({ message: 'Auction is full' }, { status: 400 })
      }
    }

    // Create registration with unique access token
    const { data: registration, error: regError } = await supabase
      .from('auction_registrations')
      .insert({
        auction_id: auctionId,
        user_id: user.id,
      })
      .select()
      .single()

    if (regError) {
      console.error('Registration error:', regError)
      return NextResponse.json({ message: 'Failed to register' }, { status: 500 })
    }

    // Send email with access link
    try {
      const auctionDate = new Date(auction.auction_start).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })

      await sendAuctionAccessEmail({
        to: user.email!,
        auctionName: auction.name,
        auctionDate,
        accessToken: registration.access_token,
      })

      // Update email_sent_at
      await supabase
        .from('auction_registrations')
        .update({ email_sent_at: new Date().toISOString() })
        .eq('id', registration.id)

    } catch (emailError) {
      console.error('Email send error:', emailError)
      // Don't fail registration if email fails
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully registered. Check your email for access link.',
      registration: {
        id: registration.id,
        access_token: registration.access_token,
      },
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
