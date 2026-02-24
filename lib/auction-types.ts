import type { AuctionType } from '@/types/database'

/** Display labels for auction types */
export const AUCTION_TYPE_LABELS: Record<AuctionType, string> = {
  progressive_elimination_auction: 'Progressive Elimination Auction',
  tender_base_fixed_bid: 'Tender Base / Fixed Bid',
}

/** Short labels for compact UI (e.g. badges, monitor) */
export const AUCTION_TYPE_SHORT_LABELS: Record<AuctionType, string> = {
  progressive_elimination_auction: 'Progressive Elimination',
  tender_base_fixed_bid: 'Tender / Fixed Bid',
}

export function getAuctionTypeLabel(type: AuctionType, short = false): string {
  return short ? AUCTION_TYPE_SHORT_LABELS[type] : AUCTION_TYPE_LABELS[type]
}
