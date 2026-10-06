import re

with open("lib/email/resend.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Remove headers block from resend.emails.send calls
c = re.sub(r",\s*headers:\s*\{\s*'List-Unsubscribe': `<mailto:\$\{replyTo \|\| 'unsubscribe@auctionhub\.com'\}><`,\s*\}", "", c)
# Wait, the regex needs to be more robust
c = re.sub(r",\s*headers:\s*\{\s*'List-Unsubscribe': `<mailto:\$\{replyTo \|\| 'unsubscribe@auctionhub\.com'\}>`,\s*\}", "", c)

with open("lib/email/resend.ts", "w", encoding="utf-8") as f:
    f.write(c)
