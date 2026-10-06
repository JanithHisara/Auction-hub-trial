with open('components/auction-room/AuctionRoomClient.tsx', 'r') as f:
    content = f.read()

new_val = "value={bidAmount ? bidAmount.split('.').map((p,i) => i===0 ? p.replace(/\\\\B(?=(\\\\d{3})+(?!\\\\d))/g, ',') : p).join('.') : ''}"

content = content.replace("value={bidAmount}", new_val)

with open('components/auction-room/AuctionRoomClient.tsx', 'w') as f:
    f.write(content)
print("Updated website sealed bid inputs using string replace.")
