with open("components/admin/NfcManagementClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "const activeAuctions = data.auctions.filter((a: any) => ['open', 'close', 'register', 'live'].includes(a.status.toLowerCase()))",
    "const activeAuctions = data.auctions.filter((a: any) => ['registration_open', 'live'].includes(a.status.toLowerCase()))"
)

with open("components/admin/NfcManagementClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
