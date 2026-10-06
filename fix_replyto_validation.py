import re

with open("lib/email/resend.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Add a helper at the top (after resend init) to validate email
helper = """
// Validate that a string looks like a real email before using it
function isValidEmail(val: string | undefined): val is string {
  if (!val) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.replace(/^.*<(.+)>$/, '$1'))
}
"""

if "isValidEmail" not in c:
    c = c.replace(
        "export interface AuctionAccessEmailParams {",
        helper.strip() + "\n\nexport interface AuctionAccessEmailParams {"
    )

# Replace all occurrences of:
#   const replyTo = process.env.RESEND_REPLY_TO
#   ...(replyTo ? { replyTo } : {})
# with:
#   const replyTo = process.env.RESEND_REPLY_TO
#   ...(isValidEmail(replyTo) ? { replyTo } : {})
c = c.replace(
    "...(replyTo ? { replyTo } : {}),",
    "...(isValidEmail(replyTo) ? { replyTo } : {}),"
)

# Also fix the headers that use replyTo without validation
c = c.replace(
    "'List-Unsubscribe': `<mailto:${replyTo || 'unsubscribe@auctionhub.com'}>`,",
    "'List-Unsubscribe': `<mailto:${isValidEmail(replyTo) ? replyTo : 'unsubscribe@auctionhub.com'}>`,",
)

with open("lib/email/resend.ts", "w", encoding="utf-8") as f:
    f.write(c)
