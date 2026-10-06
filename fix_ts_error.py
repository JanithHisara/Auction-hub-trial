import re

with open("app/api/auctions/[id]/register/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace("""
    try {
      await sendAuctionRegistrationConfirmEmail({
        to: user.email,
        userName: user.user_metadata?.display_name || undefined,
        auctionName: auction.name
      })
    } catch (emailErr) {
      console.error('Failed to send confirm email:', emailErr)
    }
""", """
    if (user.email) {
      try {
        await sendAuctionRegistrationConfirmEmail({
          to: user.email,
          userName: user.user_metadata?.display_name || undefined,
          auctionName: auction.name
        })
      } catch (emailErr) {
        console.error('Failed to send confirm email:', emailErr)
      }
    }
""")

with open("app/api/auctions/[id]/register/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
