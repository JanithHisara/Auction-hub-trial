import re

with open("app/api/admin/nfc-cards/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Add import
import_stmt = "import { sendAuctionAccessEmail } from '@/lib/email/resend'"
if "sendAuctionAccessEmail" not in c:
    c = c.replace("import { PERMISSIONS } from '@/lib/permissions'", "import { PERMISSIONS } from '@/lib/permissions'\n" + import_stmt)

# Update targetUser select to include email
c = c.replace(
    ".select('id')\n      .eq('id', user_id)",
    ".select('id, email')\n      .eq('id', user_id)"
)

# Replace the registration block
registration_block_old = """      if (!existingReg || existingReg.length === 0) {
        const { error: regError } = await adminClient.from('auction_registrations').insert({
          auction_id,
          user_id,
          access_token: token,
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          is_active: true
        })
        if (regError) {
          console.error("Auction registration error:", regError)
        }
      }"""

registration_block_new = """      if (!existingReg || existingReg.length === 0) {
        const { error: regError } = await adminClient.from('auction_registrations').insert({
          auction_id,
          user_id,
          access_token: token,
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          is_active: true
        })
        if (regError) {
          console.error("Auction registration error:", regError)
        } else if (targetUser.email) {
          // Fetch auction details for the email
          const { data: auction } = await adminClient
            .from('auctions')
            .select('name, description, auction_start')
            .eq('id', auction_id)
            .single()

          if (auction) {
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
                to: targetUser.email,
                auctionName: auction.name,
                auctionDate,
                auctionDescription: auction.description,
                accessToken: token,
              })
            } catch (emailErr) {
              console.error('Failed to send confirm email:', emailErr)
            }
          }
        }
      }"""

c = c.replace(registration_block_old, registration_block_new)

with open("app/api/admin/nfc-cards/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
