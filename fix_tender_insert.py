import re

with open("app/admin/auctions/new/tender/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Fix validations
old_val = """      if (aucEnd <= aucStart) {
        throw new Error('Auction end time must be after auction start time')
      }
      if (aucStart < regStart) {
        throw new Error('Auction start time cannot be before registration start time')
      }"""

new_val = """      if (regEnd <= aucStart) {
        throw new Error('End bidding time must be after bid start time')
      }
      if (aucStart < regStart) {
        throw new Error('Bid start time cannot be before registration start time')
      }"""

c = c.replace(old_val, new_val)

# Fix insert
old_insert = "auction_end: new Date('2099-12-31T23:59:59Z').toISOString()"
new_insert = "auction_end: toUTCISO(formData.registration_end)"

c = c.replace(old_insert, new_insert)

with open("app/admin/auctions/new/tender/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

