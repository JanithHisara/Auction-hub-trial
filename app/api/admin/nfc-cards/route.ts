import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PERMISSIONS } from '@/lib/permissions'

export async function GET(request: NextRequest) {
  try {
    const user = await requirePermission(PERMISSIONS.MANAGE_DEVICES)

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const statusFilter = searchParams.get('status') || ''
    const nfcTypeFilter = searchParams.get('nfc_type') || ''
    const page = parseInt(searchParams.get('page') || '1')
    const limit = 20
    const offset = (page - 1) * limit

    const adminClient = createAdminClient()

    let query = adminClient
      .from('nfc_cards')
      .select(`
        id, nfc_uid, user_id, is_active, label, nfc_type, created_at, updated_at,
        users:users!user_id (id, email, display_name),
        created_by_user:users!created_by (id, email, display_name)
      `, { count: 'exact' })

    if (search) {
      query = query.or(`nfc_uid.ilike.%${search}%,label.ilike.%${search}%`)
    }

    if (statusFilter === 'active') {
      query = query.eq('is_active', true)
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (nfcTypeFilter) {
      query = query.eq('nfc_type', nfcTypeFilter)
    }
