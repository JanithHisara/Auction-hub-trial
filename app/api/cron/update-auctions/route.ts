import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Simple cron endpoint to update auction statuses
  // In production, this should be called by a scheduled job
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = await createClient()
    const now = new Date().toISOString()

    // Update active auctions that have passed their end time to 'ended'
    const { error } = await supabase
      .from('gems')
      .update({ status: 'ended' })
      .eq('status', 'active')
      .lt('end_time', now)

    if (error) throw error

    return NextResponse.json({ success: true, message: 'Auctions updated' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

