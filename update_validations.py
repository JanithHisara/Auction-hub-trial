import re

with open("app/admin/auctions/new/tender/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

old_val = """      if (regEnd <= regStart) {
        throw new Error('Registration end time must be after registration start time')
      }
      if (aucStart <= regEnd) {
        throw new Error('Auction start time must be after registration end time')
      }
      if (aucEnd <= aucStart) {
        throw new Error('Auction end time must be after auction start time')
      }"""

new_val = """      if (aucEnd <= aucStart) {
        throw new Error('Auction end time must be after auction start time')
      }
      if (aucStart < regStart) {
        throw new Error('Auction start time cannot be before registration start time')
      }"""

c = c.replace(old_val, new_val)

with open("app/admin/auctions/new/tender/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

