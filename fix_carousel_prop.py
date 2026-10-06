with open("components/auction-room/TenderRoomClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("<ImageCarousel images={gem.gem_images.map((img: any) => img.image_url)} />", "<ImageCarousel media={gem.gem_images.map((img: any) => ({ url: img.image_url }))} />")

with open("components/auction-room/TenderRoomClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
