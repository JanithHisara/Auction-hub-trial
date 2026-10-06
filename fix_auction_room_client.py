import re

with open("app/auction-room/[token]/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Replace the `<AuctionRoomClient ... />` completely
# The regex needs to match from `<AuctionRoomClient` to `/>`

replacement = """<>
        {result.auction.auction_type === 'progressive_elimination_auction' && (
          <ProgressiveRoomClient 
            auction={result.auction}
            items={result.items}
            user={result.user}
            registration={result.registration}
            rewards={result.rewards}
            token={token}
            initialIsHeld={result.isHeld}
            adminPhone={result.adminPhone}
            initialEliminations={result.eliminations}
            totalRegisteredBidders={result.totalRegisteredBidders}
            initialEliminationCounts={result.eliminationCounts}
          />
        )}
        {result.auction.auction_type === 'tender_base_fixed_bid' && (
          <TenderRoomClient 
            auction={result.auction}
            items={result.items}
            user={result.user}
            registration={result.registration}
            rewards={result.rewards}
            token={token}
            initialIsHeld={result.isHeld}
            adminPhone={result.adminPhone}
            initialEliminations={result.eliminations}
            totalRegisteredBidders={result.totalRegisteredBidders}
            initialEliminationCounts={result.eliminationCounts}
          />
        )}
        {result.auction.auction_type === 'incremental_approval_auction' && (
          <IncrementalRoomClient 
            auction={result.auction}
            items={result.items}
            user={result.user}
            registration={result.registration}
            rewards={result.rewards}
            token={token}
            initialIsHeld={result.isHeld}
            adminPhone={result.adminPhone}
            initialEliminations={result.eliminations}
            totalRegisteredBidders={result.totalRegisteredBidders}
            initialEliminationCounts={result.eliminationCounts}
          />
        )}
      </>"""

c = re.sub(r"<AuctionRoomClient\s.*?/>", replacement, c, flags=re.DOTALL)

with open("app/auction-room/[token]/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
