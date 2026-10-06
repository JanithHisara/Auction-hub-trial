with open("app/api/admin/auctions/[id]/registrations/[registrationId]/route.ts", "r", encoding="utf-8") as f:
    c = f.read()

# Replace the supabase.from email_sent_at update with adminDb
c = c.replace(
    "        await supabase\n          .from('auction_registrations')\n          .update({ email_sent_at: new Date().toISOString() })\n          .eq('id', registrationId)",
    "        await adminDb\n          .from('auction_registrations')\n          .update({ email_sent_at: new Date().toISOString() })\n          .eq('id', registrationId)"
)

with open("app/api/admin/auctions/[id]/registrations/[registrationId]/route.ts", "w", encoding="utf-8") as f:
    f.write(c)
