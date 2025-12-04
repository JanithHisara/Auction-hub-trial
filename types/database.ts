export type UserRole = 'user' | 'admin'
export type GemStatus = 'draft' | 'active' | 'ended' | 'completed'
export type AuctionStatus = 'draft' | 'upcoming' | 'registration_open' | 'live' | 'ended' | 'completed'
export type PaymentStatus = 'pending' | 'completed' | 'failed'

export interface User {
  id: string
  email: string
  role: UserRole
  created_at: string
  anonymous_name?: string
}

// New: Auction (parent container)
export interface Auction {
  id: string
  admin_id: string
  name: string
  description: string | null
  banner_image_url: string | null
  
  // Timing
  registration_start: string
  registration_end: string
  auction_start: string
  auction_end: string
  
  // Settings
  status: AuctionStatus
  max_participants: number | null
  entry_fee: number
  
  // Metadata
  created_at: string
  published_at: string | null
  
  // Computed/joined fields
  items_count?: number
  registered_count?: number
  is_registered?: boolean
}

// New: Auction Registration with secure token
export interface AuctionRegistration {
  id: string
  auction_id: string
  user_id: string
  access_token: string
  registered_at: string
  email_sent_at: string | null
  first_access_at: string | null
  last_access_at: string | null
  access_count: number
  is_active: boolean
  
  // Joined
  auction?: Auction
  user?: User
}

// Gem (auction item) - now belongs to an auction
export interface Gem {
  id: string
  auction_id: string | null
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
  current_price: number
  round_end_time: string | null
  increment_interval: number
  
  // Computed
  current_bid?: number
  bid_count?: number
  images?: GemImage[]
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
  points_earned: number
  created_at: string
  user?: {
    email: string
    anonymous_name?: string
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

// New: User Rewards/Engagement
export interface UserRewards {
  id: string
  user_id: string
  total_points: number
  current_streak: number
  longest_streak: number
  badges: Badge[]
  auctions_participated: number
  total_bids_placed: number
  auctions_won: number
  last_bid_at: string | null
  created_at: string
  updated_at: string
}

export interface Badge {
  id: string
  name: string
  icon: string
  description: string
  earned_at: string
}

// Utility types for API responses
export interface AuctionWithItems extends Auction {
  items: Gem[]
}

export interface AuctionAccessPayload {
  auction_id: string
  user_id: string
  access_token: string
}
