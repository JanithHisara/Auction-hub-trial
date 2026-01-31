import { createClient } from '@/lib/supabase/server'
import { getUserRole } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const role = await getUserRole()
    
    if (role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createClient()
    const body = await request.json().catch(() => ({}))
    
    // Get gem with default interval
    const { data: gem } = await supabase
      .from('gems')
      .select('increment_interval')
      .eq('id', id)
      .single()

    if (!gem) {
        return NextResponse.json({ error: 'Gem not found' }, { status: 404 })
    }

    // Use custom duration if provided, otherwise use default increment_interval
    const durationSeconds = body.duration || gem.increment_interval
    
    const now = new Date()
    const roundEnd = new Date(now.getTime() + (durationSeconds * 1000))

    // Update round_end_time
    const { error } = await supabase
      .from('gems')
      .update({ round_end_time: roundEnd.toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Round started', round_end_time: roundEnd })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start round'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

