with open("app/api/admin/auctions/[id]/select-winner/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Switch the winner user lookup to adminDb
c = c.replace(
    "    // Get winner's user info for email\n    const { data: winnerUser } = await supabase\n      .from('users')\n      .select('email, anonymous_name')",
    "    // Get winner's user info for email (use adminDb to bypass RLS)\n    const { data: winnerUser } = await adminDb\n      .from('users')\n      .select('email, anonymous_name')"
)

with open("app/api/admin/auctions/[id]/select-winner/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
