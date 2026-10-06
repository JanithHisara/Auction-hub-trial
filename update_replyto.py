import re

with open("lib/email/resend.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Replace replyTo: undefined logic
c = c.replace(
    "const replyTo = process.env.RESEND_REPLY_TO || undefined",
    "const replyTo = process.env.RESEND_REPLY_TO"
)

# Strip out replyTo if it's undefined by spreading
c = re.sub(
    r"from: fromEmail,\s+to,\s+replyTo,\s+subject:",
    "from: fromEmail,\n      to,\n      ...(replyTo ? { replyTo } : {}),\n      subject:",
    c
)

with open("lib/email/resend.ts", "w", encoding="utf-8") as f:
    f.write(c)
