import re

with open("app/api/auctions/[id]/register/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Remove the import
c = c.replace("import { sendAuctionRegistrationConfirmEmail } from '@/lib/email/resend'\n", "")

# Remove the email dispatch
dispatch_logic = """
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
"""
c = c.replace(dispatch_logic, "")

with open("app/api/auctions/[id]/register/route.ts", "w", encoding="utf-8") as f:
    f.write(c)

with open("lib/email/resend.ts", "r", encoding="utf-8") as f:
    rc = f.read()

# Remove sendAuctionRegistrationConfirmEmail block
match = re.search(r"export interface AuctionRegistrationConfirmEmailParams \{.*?\n\}\n\nexport async function sendAuctionRegistrationConfirmEmail\(.*?return data\n\}\n", rc, re.DOTALL)
if match:
    rc = rc.replace(match.group(0), "")
    with open("lib/email/resend.ts", "w", encoding="utf-8") as f:
        f.write(rc)
