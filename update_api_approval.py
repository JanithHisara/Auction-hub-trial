import re

with open("app/api/admin/nfc-cards/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Replace the auction registration block
new_block = """
    if (auction_id && nfc_type === 'temporary') {
      const { randomUUID } = require('crypto')
      const token = randomUUID()
      
      // Check if already registered
      const { data: existingReg } = await adminClient
        .from('auction_registrations')
        .select('id')
        .eq('auction_id', auction_id)
        .eq('user_id', user_id)
        .limit(1)
        
      if (!existingReg || existingReg.length === 0) {
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
      }
    }
"""

c = re.sub(
    r"if \(auction_id && nfc_type === 'temporary'\) \{.*?(?=return NextResponse\.json)",
    new_block.strip() + "\n\n    ",
    c,
    flags=re.DOTALL
)

with open("app/api/admin/nfc-cards/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
