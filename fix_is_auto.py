with open("components/auction-room/TenderRoomClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("is_auto: false", "")

# After replacing 'is_auto: false', we might have a trailing comma before it, e.g. `bid_amount: bidAmount,\n            `
# Let's clean up any weird commas. Wait, if we replace "is_auto: false" it becomes empty, the comma before it is fine in JS/TS as trailing commas in objects are allowed.

with open("components/auction-room/TenderRoomClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
