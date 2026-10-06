import re

with open("lib/email/resend.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Fix subject and replyTo
c = re.sub(
    r"const replyTo = process\.env\.RESEND_REPLY_TO \|\| undefined\s*const \{ data, error \} = await resend\.emails\.send\(\{\s*from: fromEmail,\s*to,\s*replyTo,\s*subject: `Your Access Pass: \$\{auctionName\}`,",
    "const replyTo = process.env.RESEND_REPLY_TO\n\n  const { data, error } = await resend.emails.send({\n    from: fromEmail,\n    to,\n    ...(replyTo ? { replyTo } : {}),\n    subject: `Registration Confirmed: ${auctionName}`,",
    c
)

# Fix HTML title
c = re.sub(
    r"<title>Your Access Pass</title>", 
    "<title>Registration Confirmed</title>",
    c
)

# Fix text fallback
c = re.sub(
    r"text: `Your Auction Access Pass\\n\\n\$\{userName \? `Hi \$\{userName\},` : 'Hello,'\}\\n\\nYou've been approved for \\n\$\{auctionName\}\.\\nDate: \$\{auctionDate\}\\n\\nEnter your auction room: \$\{auctionUrl\}\\n\\nThis link is unique to you\. Do not \\nshare it with others\.\\n\\nImportant:\\n- You must be logged into your account to enter\\n- This link is personal and \\nnon-transferable\\n- Join on time - late entry may limit bidding\\n\\nAuctionhub - Premium gem auctions`,",
    "text: `Registration Confirmed\\n\\n${userName ? `Hi ${userName},` : 'Hello,'}\\n\\nYour registration for ${auctionName} has been approved!\\nDate: ${auctionDate}\\n\\n${auctionDescription ? `Details: ${auctionDescription}\\n\\n` : ''}Enter your auction room: ${auctionUrl}\\n\\nThis link is unique to you. Do not share it with others.\\n\\nImportant:\\n- You must be logged into your account to enter\\n- This link is personal and non-transferable\\n- Join on time - late entry may limit bidding\\n\\nAuctionhub - Premium gem auctions`,",
    c
)

with open("lib/email/resend.ts", "w", encoding="utf-8") as f:
    f.write(c)
