import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.MANAGE_DEVICES)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const auctionFilter = searchParams.get('auction_id') || ''
    const statusFilter = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    const adminClient = createAdminClient()

    let query = adminClient
      .from('nfc_cards')
      .select(`
        id, nfc_uid, user_id, auction_id, is_active, label, created_at, updated_at,
        users!inner (id, email, display_name),
        auctions (id, name, status)
      `, { count: 'exact' })

    if (search) {
      query = query.or(`nfc_uid.ilike.%${search}%,label.ilike.%${search}%`)
    }

    if (auctionFilter) {
      query = query.eq('auction_id', auctionFilter)
    }

    if (statusFilter === 'active') {
      query = query.eq('is_active', true)
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false)
    }

    const { data: nfcCards, count, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      nfcCards,
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.MANAGE_DEVICES)

    const body = await request.json()
    const { nfc_uid, user_id, auction_id, label } = body

    if (!nfc_uid || !user_id) {
      return NextResponse.json(
        { error: 'NFC UID and User ID are required' },
        { status: 400 },
      )
    }

    const adminClient = createAdminClient()

    // Verify user exists
    const { data: user } = await adminClient
      .from('users')
      .select('id')
      .eq('id', user_id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify auction exists if provided
    if (auction_id) {
      const { data: auction } = await adminClient
        .from('auctions')
        .select('id')
        .eq('id', auction_id)
        .single()

      if (!auction) {
        return NextResponse.json({ error: 'Auction not found' }, { status: 404 })
      }
    }

    // Check for duplicate nfc_uid + auction_id combination
    if (auction_id) {
      const { data: existing } = await adminClient
        .from('nfc_cards')
        .select('id')
        .eq('nfc_uid', nfc_uid)
        .eq('auction_id', auction_id)
        .limit(1)

      if (existing && existing.length > 0) {
        return NextResponse.json(
          { error: 'This NFC card is already mapped to this auction' },
          { status: 409 },
        )
      }
    }

    const { data: nfcCard, error } = await adminClient
      .from('nfc_cards')
      .insert({
        nfc_uid,
        user_id,
        auction_id: auction_id || null,
        label: label || null,
        is_active: true,
      })
      .select(`
        id, nfc_uid, user_id, auction_id, is_active, label, created_at, updated_at,
        users!inner (id, email, display_name),
        auctions (id, name, status)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ nfcCard }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
}
