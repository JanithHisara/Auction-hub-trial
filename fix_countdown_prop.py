with open("components/auction-room/TenderRoomClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("<AuctionCountdown endTime={auction.auction_end}", "<AuctionCountdown roundEndTime={auction.auction_end}")

with open("components/auction-room/TenderRoomClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
