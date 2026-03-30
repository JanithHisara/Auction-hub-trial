import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'
import { NextRequest, NextResponse } from 'next/server'
import { sendAuctionLiveEmail } from '@/lib/email/resend'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requirePermission(PERMISSIONS.MANAGE_AUCTIONS)
    const supabase = await createClient()

    let status: string
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      const body = await request.json()
      status = body.status
    } else {
      const formData = await request.formData()
      status = formData.get('status') as string
    }

    const validStatuses = ['draft', 'upcoming', 'registration_open', 'live', 'ended', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { error } = await supabase
      .from('auctions')
      .update({ 
        status,
        published_at: status !== 'draft' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .eq('admin_id', user.id)

    if (error) {
      console.error('Update error:', error)
      return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
    }

    // When auction goes live, notify all approved registered users via email
    if (status === 'live') {
      try {
        const adminDb = createAdminClient()
        const { data: auction } = await adminDb
          .from('auctions')
          .select('name')
          .eq('id', id)
          .single()

        const { data: registrations } = await adminDb
          .from('auction_registrations')
          .select('access_token, user:users!auction_registrations_user_id_fkey(email, anonymous_name, display_name)')
          .eq('auction_id', id)
          .eq('approval_status', 'approved')

        if (registrations?.length && auction) {
          const emailPromises = registrations
            .filter(r => r.user?.email)
            .map(r => 
              sendAuctionLiveEmail({
                to: r.user!.email,
                auctionName: auction.name,
                accessToken: r.access_token,
                userName: r.user!.display_name || r.user!.anonymous_name || undefined,
              }).catch(err => console.error(`Failed to send live email to ${r.user!.email}:`, err))
            )
          await Promise.allSettled(emailPromises)
          console.log(`Sent auction-live emails to ${emailPromises.length} registrants`)
        }
      } catch (emailError) {
        console.error('Failed to send auction-live notification emails:', emailError)
      }
    }

    if (contentType?.includes('application/json')) {
      return NextResponse.json({ success: true, status })
    }
    
    return NextResponse.redirect(new URL(`/admin/auctions/${id}`, request.url))

  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
