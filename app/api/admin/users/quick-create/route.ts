import { NextRequest, NextResponse } from 'next/server'
import { requirePermission } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { PERMISSIONS } from '@/lib/permissions'

export async function POST(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.MANAGE_DEVICES)

    const body = await request.json()
    const { display_name, email, phone } = body

    if (!display_name) {
      return NextResponse.json({ error: 'Display name is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Check for duplicate email if provided
    if (email) {
      const { data: existingUser } = await adminClient
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return NextResponse.json(
          { error: 'A user with this email already exists' },
          { status: 409 },
        )
      }
    }

    // Generate a unique anonymous name
    const anonymousName = `Bidder-${Math.floor(100000 + Math.random() * 900000)}`

    // Create user in the public.users table directly (no auth account needed for NFC-only users)
    const { data: user, error } = await adminClient
      .from('users')
      .insert({
        email: email || `nfc-${Date.now()}@placeholder.local`,
        display_name,
        phone: phone || null,
        role: 'user',
        anonymous_name: anonymousName,
      })
      .select('id, email, display_name, phone, role, anonymous_name')
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A user with this information already exists' },
          { status: 409 },
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
}
