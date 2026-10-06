import re

with open("components/admin/NfcManagementClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "const res = await fetch('/api/admin/auctions')",
    "const res = await fetch('/api/admin/auctions-list')"
)

with open("components/admin/NfcManagementClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
