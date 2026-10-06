import re

with open('components/auction-room/AuctionRoomClient.tsx', 'r') as f:
    content = f.read()

# Replace the value rendering for bidAmount in the input tags
# Look for value={bidAmount} and change to value={bidAmount ? bidAmount.split('.').map((p,i) => i===0 ? p.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : p).join('.') : ''}
new_val = "value={bidAmount ? bidAmount.split('.').map((p,i) => i===0 ? p.replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',') : p).join('.') : ''}"

# We need to also ensure onChange strips commas before setting state, but the onChange already does:
# val = e.target.value.replace(/[^0-9.]/g, '') which naturally strips commas!
# So we only need to change value={bidAmount} to the new_val

content = re.sub(r'value=\{bidAmount\}', new_val, content)

with open('components/auction-room/AuctionRoomClient.tsx', 'w') as f:
    f.write(content)
print("Updated website sealed bid inputs.")
