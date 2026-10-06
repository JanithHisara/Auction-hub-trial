import re

with open("lib/email/resend.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Fix call
c = c.replace(
    "html: generateAuctionEmailHtml({\n      auctionName,\n      auctionDate,\n      auctionUrl,\n      userName,\n    }),",
    "html: generateAuctionEmailHtml({\n      auctionName,\n      auctionDate,\n      auctionUrl,\n      auctionDescription,\n      userName,\n    }),"
)

# Fix signature (destructuring)
c = c.replace(
    "function generateAuctionEmailHtml({\n  auctionName,\n  auctionDate,\n  auctionUrl,\n  userName,\n}: {",
    "function generateAuctionEmailHtml({\n  auctionName,\n  auctionDate,\n  auctionUrl,\n  auctionDescription,\n  userName,\n}: {"
)

# Fix signature (types)
c = c.replace(
    "}: {\n  auctionName: string\n  auctionDate: string\n  auctionUrl: string\n  userName?: string\n}) {",
    "}: {\n  auctionName: string\n  auctionDate: string\n  auctionUrl: string\n  auctionDescription?: string | null\n  userName?: string\n}) {"
)

with open("lib/email/resend.ts", "w", encoding="utf-8") as f:
    f.write(c)
