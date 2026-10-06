with open("components/auction-room/TenderRoomClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("auction_id: auction.id,", "")

with open("components/auction-room/TenderRoomClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
