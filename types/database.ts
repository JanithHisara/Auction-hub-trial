export type UserRole = 'user' | 'admin'

export type GemStatus = 'draft' | 'active' | 'ended' | 'completed'

export type PaymentStatus = 'pending' | 'completed' | 'failed'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
}

export interface Gem {
  id: string
  admin_id: string
  name: string
  description: string
  starting_price: number
  min_bid_increment: number
  start_time: string
  end_time: string
  status: GemStatus
  carat_weight: number | null
  cut: string | null
  color: string | null
  clarity: string | null
  provenance: string | null
  created_at: string
  published_at: string | null
}

export interface GemImage {
  id: string
  gem_id: string
  image_url: string
  display_order: number
  created_at: string
}

export interface GemCertificate {
  id: string
  gem_id: string
  certificate_url: string
  certificate_type: string | null
  created_at: string
}

export interface Bid {
  id: string
  gem_id: string
  user_id: string
  bid_amount: number
  created_at: string
  user?: {
    email: string
  }
}

export interface Payment {
  id: string
  gem_id: string
  user_id: string
  bid_id: string
  amount: number
  status: PaymentStatus
  payment_method: string | null
  transaction_id: string | null
  created_at: string
}

export interface AuctionWinner {
  id: string
  gem_id: string
  user_id: string
  winning_bid_id: string
  selected_at: string
  admin_id: string
}

