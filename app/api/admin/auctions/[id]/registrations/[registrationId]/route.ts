import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendAuctionAccessEmail } from '@/lib/email/resend'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  try {
    const { id: auctionId, registrationId } = await params
    const { approval_status } = await request.json()
    const supabase = await createClient()

    // Verify admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })
    }

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 })
    }

    // Validate status
    if (!['approved', 'rejected'].includes(approval_status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
    }

    // Get registration with user and auction info (use explicit FK name)
    const { data: registration, error: regError } = await supabase
      .from('auction_registrations')
      .select('*, user:users!auction_registrations_user_id_fkey(email, anonymous_name), auction:auctions(name, auction_start)')
      .eq('id', registrationId)
      .eq('auction_id', auctionId)
      .single()

    if (regError || !registration) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 })
    }

    // Check max participants before approving
    if (approval_status === 'approved') {
      const { data: auction } = await supabase
        .from('auctions')
        .select('max_participants')
        .eq('id', auctionId)
        .single()

      if (auction?.max_participants) {
        const { count } = await supabase
          .from('auction_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('auction_id', auctionId)
          .eq('approval_status', 'approved')

        if (count && count >= auction.max_participants) {
          return NextResponse.json({ message: 'Max participants reached' }, { status: 400 })
        }
      }
    }

    // Update registration status
    const { error: updateError } = await supabase
      .from('auction_registrations')
      .update({
        approval_status,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
      })
      .eq('id', registrationId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ message: 'Failed to update' }, { status: 500 })
    }

    // Send email only when approved
    if (approval_status === 'approved' && registration.user?.email) {
      try {
        const auctionDate = new Date(registration.auction.auction_start).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        await sendAuctionAccessEmail({
          to: registration.user.email,
          auctionName: registration.auction.name,
          auctionDate,
          accessToken: registration.access_token,
        })

        // Update email_sent_at
        await supabase
          .from('auction_registrations')
          .update({ email_sent_at: new Date().toISOString() })
          .eq('id', registrationId)

      } catch (emailError) {
        console.error('Email send error:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Registration ${approval_status}`,
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
