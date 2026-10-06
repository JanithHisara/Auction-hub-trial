with open("app/admin/gems/[id]/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Currently: const hideBids = isTenderBase && isRoundActive
# We want it to be: const hideBids = isTenderBase && isRoundActive && (gem.auction as any)?.status !== 'ended' && (gem.auction as any)?.status !== 'completed'

c = c.replace(
    ".select('*, auction:auctions(name, auction_type)')",
    ".select('*, auction:auctions(name, auction_type, status)')"
)

c = c.replace(
    "const hideBids = isTenderBase && isRoundActive",
    "const hideBids = isTenderBase && isRoundActive && (gem.auction as any)?.status !== 'ended' && (gem.auction as any)?.status !== 'completed'"
)

with open("app/admin/gems/[id]/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)
