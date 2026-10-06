import re

with open("app/api/admin/nfc-cards/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Replace the destructured body to include auction_id
c = c.replace(
    "const { nfc_uid, user_id, label, nfc_type } = body",
    "const { nfc_uid, user_id, label, nfc_type, auction_id } = body"
)

# After inserting the nfc_card, if auction_id is present, insert into auction_registrations
insert_code = """
    const { data: nfcCard, error } = await adminClient
      .from('nfc_cards')
      .insert({
        nfc_uid,
        user_id,
        label: label || null,
        nfc_type: nfc_type || 'permanent',
        is_active: true,
      })
      .select(`
        id, nfc_uid, user_id, is_active, label, nfc_type, created_at, updated_at,
        users:users!user_id (id, email, display_name),
        created_by_user:users!created_by (id, email, display_name)
      `)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (auction_id && nfc_type === 'temporary') {
      const crypto = require('crypto')
      const token = crypto.randomBytes(32).toString('hex')
      
      // Check if already registered
      const { data: existingReg } = await adminClient
        .from('auction_registrations')
        .select('id')
        .eq('auction_id', auction_id)
        .eq('user_id', user_id)
        .limit(1)
        
      if (!existingReg || existingReg.length === 0) {
        await adminClient.from('auction_registrations').insert({
          auction_id,
          user_id,
          access_token: token,
          is_active: true
        })
      }
    }
"""

c = re.sub(
    r"const \{ data: nfcCard, error \} = await adminClient.*?\.single\(\).*?if \(error\) \{\s*return NextResponse\.json\(\{ error: error\.message \}, \{ status: 500 \}\)\s*\}",
    insert_code.strip(),
    c,
    flags=re.DOTALL
)

with open("app/api/admin/nfc-cards/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
