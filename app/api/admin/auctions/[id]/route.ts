import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getAdminUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (userData?.role !== 'admin') return null
  return user
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const { data: auction, error } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !auction) {
      return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
    }

    return NextResponse.json(auction)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get auction'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await getAdminUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()
    const body = await request.json()

    const { data: auction, error } = await supabase
      .from('auctions')
      .update({
        name: body.name,
        description: body.description || null,
        banner_image_url: body.banner_image_url || null,
        auction_type: body.auction_type,
        registration_start: body.registration_start,
        registration_end: body.registration_end,
        auction_start: body.auction_start,
        auction_end: body.auction_end,
        max_participants: body.max_participants ? parseInt(body.max_participants) : null,
        entry_fee: parseFloat(body.entry_fee) || 0,
      })
      .eq('id', id)
      .eq('admin_id', user.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(auction)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update auction'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
