import re

with open("app/api/auctions/[id]/register/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

import_stmt = "import { sendAuctionRegistrationConfirmEmail } from '@/lib/email/resend'"
if import_stmt not in c:
    c = c.replace("import { NextRequest, NextResponse } from 'next/server'", f"import {{ NextRequest, NextResponse }} from 'next/server'\n{import_stmt}")

with open("app/api/auctions/[id]/register/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
