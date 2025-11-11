import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth'
import GemForm from '@/components/gems/GemForm'
import { notFound } from 'next/navigation'

export default async function EditGemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const user = await requireAdmin()
  const supabase = await createClient()

  const { data: gem } = await supabase
    .from('gems')
    .select('*')
    .eq('id', id)
    .eq('admin_id', user.id)
    .single()

  if (!gem) {
    notFound()
  }

  const { data: images } = await supabase
    .from('gem_images')
    .select('*')
    .eq('gem_id', id)
    .order('display_order')

  const { data: certificates } = await supabase
    .from('gem_certificates')
    .select('*')
    .eq('gem_id', id)

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gold mb-8">Edit Gem</h2>
      <GemForm gem={{ ...gem, images: images || [], certificates: certificates || [] }} />
    </div>
  )
}

