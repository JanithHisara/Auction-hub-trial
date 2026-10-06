import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { NextRequest, NextResponse } from 'next/server'
import { sendAuctionAccessEmail } from '@/lib/email/resend'
import { randomUUID } from 'crypto'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  try {
    const { id: auctionId, registrationId } = await params
    const { approval_status } = await request.json()

    const user = await requirePermission(PERMISSIONS.MANAGE_REGISTRATIONS)
    const supabase = await createClient()

    if (!['approved', 'rejected'].includes(approval_status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
    }

    const { data: registration, error: regError } = await supabase
      .from('auction_registrations')
      .select('*, user:users!auction_registrations_user_id_fkey(email, anonymous_name), auction:auctions(name, description, auction_start)')
      .eq('id', registrationId)
      .eq('auction_id', auctionId)
      .single()

    if (regError || !registration) {
      return NextResponse.json({ message: 'Registration not found' }, { status: 404 })
    }

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

    // Generate access_token if not already present (user self-registered without token)
    const accessToken = registration.access_token || randomUUID()

    const { error: updateError } = await supabase
      .from('auction_registrations')
      .update({
        approval_status,
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        access_token: accessToken,
      })
      .eq('id', registrationId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ message: 'Failed to update' }, { status: 500 })
    }

    // Send email only when approved
    if (approval_status === 'approved') {
      const userRaw = registration.user as unknown
      const userObj = Array.isArray(userRaw) ? (userRaw as Array<{email?: string; anonymous_name?: string}>)[0] : (userRaw as {email?: string; anonymous_name?: string} | null)
      const userEmail = userObj?.email

      if (userEmail) {
        try {
          const auctionRaw = registration.auction as unknown
          const auctionObj = Array.isArray(auctionRaw)
            ? (auctionRaw as Array<{name: string; description?: string | null; auction_start: string}>)[0]
            : (auctionRaw as {name: string; description?: string | null; auction_start: string} | null)

          if (!auctionObj) throw new Error('Auction data missing')

          const auctionDate = new Date(auctionObj.auction_start).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })

          console.log('[Email] Sending registration confirm to:', userEmail, 'for auction:', auctionObj.name)

          await sendAuctionAccessEmail({
            to: userEmail,
            auctionName: auctionObj.name,
            auctionDate,
            auctionDescription: auctionObj.description,
            accessToken,
          })

          await supabase
            .from('auction_registrations')
            .update({ email_sent_at: new Date().toISOString() })
            .eq('id', registrationId)

          console.log('[Email] Registration confirm sent successfully to:', userEmail)
        } catch (emailError) {
          console.error('[Email] Send error:', emailError)
        }
      } else {
        console.log('[Email] Skipping - no email address for user')
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
