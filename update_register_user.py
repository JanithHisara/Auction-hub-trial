import re

with open("app/api/admin/auctions/[id]/register-user/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Add import
import_stmt = "import { sendAuctionAccessEmail } from '@/lib/email/resend'"
if "sendAuctionAccessEmail" not in c:
    c = c.replace("import { PERMISSIONS } from '@/lib/permissions'", "import { PERMISSIONS } from '@/lib/permissions'\n" + import_stmt)

# Update select
c = c.replace(
    ".select('id, name, max_participants')",
    ".select('id, name, description, auction_start, max_participants')"
)

# Add email sending logic after regError
email_logic = """
    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 })
    }

    if (user.email) {
      try {
        const auctionDate = new Date(auction.auction_start).toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
        
        await sendAuctionAccessEmail({
          to: user.email,
          auctionName: auction.name,
          auctionDate,
          auctionDescription: auction.description,
          accessToken: registration.access_token,
        })
      } catch (emailErr) {
        console.error('Failed to send confirm email:', emailErr)
      }
    }
"""

c = c.replace("""
    if (regError) {
      return NextResponse.json({ error: regError.message }, { status: 500 })
    }
""", email_logic)

with open("app/api/admin/auctions/[id]/register-user/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
