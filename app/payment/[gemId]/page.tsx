import { requireAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { notFound, redirect } from 'next/navigation'
import PaymentForm from '@/components/payment/PaymentForm'

export default async function PaymentPage({ params }: { params: Promise<{ gemId: string }> }) {
  const { gemId } = await params
  const user = await requireAuth()
  const supabase = await createClient()

  // Verify user is the winner
  const { data: winner } = await supabase
    .from('auction_winners')
    .select('*, bid:bids(id, bid_amount), gem:gems(*)')
    .eq('gem_id', gemId)
    .eq('user_id', user.id)
    .single()

  if (!winner) {
    redirect('/')
  }

  // Check if payment already processed
  const { data: payment } = await supabase
    .from('payments')
    .select('*')
    .eq('gem_id', gemId)
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .single()

  if (payment) {
    redirect(`/gems/${gemId}`)
  }

  const gem = winner.gem as any
  const bid = winner.bid as any

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--background)] via-[#f5f4f0] to-[#f0ede8] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-[var(--border)] rounded-2xl p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">Complete Payment</h1>

          <div className="mb-8 p-6 bg-[var(--gold-light)]/10 border border-[var(--gold-light)] rounded-lg">
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">{gem.name}</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Winning Bid:</span>
                <span className="text-[var(--gold-dark)] font-bold text-xl">{formatCurrency(bid.bid_amount)}</span>
              </div>
            </div>
          </div>

          <PaymentForm gemId={gemId} amount={bid.bid_amount} />
        </div>
      </div>
    </div>
  )
}

