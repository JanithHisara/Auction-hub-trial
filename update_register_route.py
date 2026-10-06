import re

with open("app/api/auctions/[id]/register/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Add import
import_stmt = "import { sendAuctionRegistrationConfirmEmail } from '@/lib/email/resend'"
if import_stmt not in c:
    c = c.replace("import { NextResponse } from 'next/server'", f"import {{ NextResponse }} from 'next/server'\n{import_stmt}")

# Add email sending logic after insert
logic = """
    if (regError) {
      console.error('Registration error:', regError)
      return NextResponse.json({ message: 'Failed to register' }, { status: 500 })
    }

    try {
      await sendAuctionRegistrationConfirmEmail({
        to: user.email,
        userName: user.user_metadata?.display_name || undefined,
        auctionName: auction.name
      })
    } catch (emailErr) {
      console.error('Failed to send confirm email:', emailErr)
    }

    return NextResponse.json({
"""

c = c.replace("""
    if (regError) {
      console.error('Registration error:', regError)
      return NextResponse.json({ message: 'Failed to register' }, { status: 500 })
    }

    return NextResponse.json({
""".strip(), logic.strip())

with open("app/api/auctions/[id]/register/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
