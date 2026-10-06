import re

with open("app/api/admin/nfc-cards/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

# I will add console.error to the insert if it fails
insert_replacement = """
      if (!existingReg || existingReg.length === 0) {
        const { error: regError } = await adminClient.from('auction_registrations').insert({
          auction_id,
          user_id,
          access_token: token,
          is_active: true
        })
        if (regError) {
          console.error("Auction registration error:", regError)
        }
      }
"""

c = re.sub(
    r"      if \(!existingReg \|\| existingReg\.length === 0\) \{\s*await adminClient\.from\('auction_registrations'\)\.insert\(\{\s*auction_id,\s*user_id,\s*access_token: token,\s*is_active: true\s*\}\)\s*\}",
    insert_replacement.strip(),
    c
)

with open("app/api/admin/nfc-cards/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
