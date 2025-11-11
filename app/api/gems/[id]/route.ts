import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: gem, error } = await supabase
      .from('gems')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error

    const { data: images } = await supabase
      .from('gem_images')
      .select('*')
      .eq('gem_id', id)
      .order('display_order')

    const { data: certificates } = await supabase
      .from('gem_certificates')
      .select('*')
      .eq('gem_id', id)

    return NextResponse.json({
      ...gem,
      images: images || [],
      certificates: certificates || [],
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAdmin()
    const supabase = await createClient()
    const body = await request.json()

    // Verify admin owns this gem
    const { data: existingGem } = await supabase
      .from('gems')
      .select('admin_id')
      .eq('id', id)
      .single()

    if (existingGem?.admin_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { data: gem, error } = await supabase
      .from('gems')
      .update({
        name: body.name,
        description: body.description,
        starting_price: body.starting_price,
        min_bid_increment: body.min_bid_increment,
        start_time: body.start_time,
        end_time: body.end_time,
        carat_weight: body.carat_weight,
        cut: body.cut,
        color: body.color,
        clarity: body.clarity,
        provenance: body.provenance,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Update images if provided
    if (body.images) {
      await supabase.from('gem_images').delete().eq('gem_id', id)
      if (body.images.length > 0) {
        const images = body.images.map((url: string, index: number) => ({
          gem_id: id,
          image_url: url,
          display_order: index,
        }))
        await supabase.from('gem_images').insert(images)
      }
    }

    // Update certificates if provided
    if (body.certificates) {
      await supabase.from('gem_certificates').delete().eq('gem_id', id)
      if (body.certificates.length > 0) {
        const certificates = body.certificates.map((cert: { url: string; type?: string }) => ({
          gem_id: id,
          certificate_url: cert.url,
          certificate_type: cert.type || null,
        }))
        await supabase.from('gem_certificates').insert(certificates)
      }
    }

    return NextResponse.json(gem)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await requireAdmin()
    const supabase = await createClient()
    const body = await request.json()

    // Verify admin owns this gem
    const { data: existingGem } = await supabase
      .from('gems')
      .select('admin_id, status')
      .eq('id', id)
      .single()

    if (existingGem?.admin_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const updates: any = {}
    if (body.status) updates.status = body.status
    if (body.status === 'active' && existingGem.status === 'draft') {
      updates.published_at = new Date().toISOString()
    }

    const { data: gem, error } = await supabase
      .from('gems')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(gem)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

