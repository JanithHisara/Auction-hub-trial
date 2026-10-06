with open("components/auction-room/TenderRoomClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace('<MediaRenderer src="/placeholder.png" alt="No image" fill className="object-cover opacity-50" />', '<img src="/placeholder.png" alt="No image" className="object-cover opacity-50 w-full h-full" />')

with open("components/auction-room/TenderRoomClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
