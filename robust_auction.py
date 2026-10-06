import re

with open("app/api/admin/auctions/[id]/registrations/[registrationId]/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

replacement = """
    if (approval_status === 'approved' && userEmail) {
      try {
        const auctionRaw = registration.auction as any;
        const auctionObj = Array.isArray(auctionRaw) ? auctionRaw[0] : auctionRaw;

        const auctionDate = new Date(auctionObj.auction_start).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })

        await sendAuctionAccessEmail({
          to: userEmail,
          auctionName: auctionObj.name,
          auctionDate,
          auctionDescription: auctionObj.description,
          accessToken: registration.access_token,
        })
"""

c = re.sub(
    r"    if \(approval_status === 'approved' && userEmail\) \{\s*try \{\s*const auctionDate = new Date\(registration\.auction\.auction_start\)\.toLocaleDateString\('en-US', \{\s*weekday: 'long',\s*month: 'long',\s*day: 'numeric',\s*year: 'numeric',\s*hour: '2-digit',\s*minute: '2-digit',\s*\}\)\s*await sendAuctionAccessEmail\(\{\s*to: userEmail,\s*auctionName: registration\.auction\.name,\s*auctionDate,\s*auctionDescription: registration\.auction\.description,\s*accessToken: registration\.access_token,\s*\}\)",
    replacement.strip(),
    c
)

with open("app/api/admin/auctions/[id]/registrations/[registrationId]/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
