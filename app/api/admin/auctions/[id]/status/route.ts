import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { redirect } from 'next/navigation'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Check admin
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

    // Get form data
    const formData = await request.formData()
    const status = formData.get('status') as string

    const validStatuses = ['draft', 'upcoming', 'registration_open', 'live', 'ended', 'completed']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ message: 'Invalid status' }, { status: 400 })
    }

    // Update auction
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
      return NextResponse.json({ message: 'Failed to update' }, { status: 500 })
    }

    // Redirect back to auction page
    return NextResponse.redirect(new URL(`/admin/auctions/${id}`, request.url))

  } catch (error) {
    console.error('Status update error:', error)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}

