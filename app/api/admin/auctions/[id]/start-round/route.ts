import { createClient } from '@/lib/supabase/server'
import { requireAuth, getUserRole } from '@/lib/auth'
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
    
    // Get gem
    const { data: gem } = await supabase
      .from('gems')
      .select('increment_interval')
      .eq('id', id)
      .single()

    if (!gem) {
        return NextResponse.json({ error: 'Gem not found' }, { status: 404 })
    }

    const now = new Date()
    const roundEnd = new Date(now.getTime() + (gem.increment_interval * 1000))

    // Update round_end_time
    const { error } = await supabase
      .from('gems')
      .update({ round_end_time: roundEnd.toISOString() })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Round started', round_end_time: roundEnd })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

