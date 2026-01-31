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
    
    // Set round_end_time to now (ending the round immediately)
    const { error } = await supabase
      .from('gems')
      .update({ round_end_time: null })
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ message: 'Round ended' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to end round'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
