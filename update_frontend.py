import re

with open("components/admin/NfcManagementClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# 1. Update NfcCardForm props to accept auctions
c = c.replace(
    "function NfcCardForm({\n  onClose,\n  onCreated,\n}: {\n  onClose: () => void\n  onCreated: () => void\n}) {",
    "function NfcCardForm({\n  onClose,\n  onCreated,\n  auctions,\n}: {\n  onClose: () => void\n  onCreated: () => void\n  auctions: any[]\n}) {"
)

# 2. Add selectedAuction state in NfcCardForm
c = c.replace(
    "const [label, setLabel] = useState('')",
    "const [label, setLabel] = useState('')\n  const [selectedAuction, setSelectedAuction] = useState('')"
)

# 3. Add auction_id to the fetch call
c = c.replace(
    "nfc_type: nfcType,",
    "nfc_type: nfcType,\n              auction_id: selectedAuction || undefined,"
)

# 4. Add the select dropdown for auction
auction_dropdown = """
          {nfcType === 'temporary' && (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                Assign to Auction
              </label>
              <select
                value={selectedAuction}
                onChange={e => setSelectedAuction(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)]/50"
              >
                <option value="">-- No Auction (Skip Registration) --</option>
                {auctions.map(a => (
                  <option key={a.id} value={a.id}>{a.title} ({a.status})</option>
                ))}
              </select>
            </div>
          )}
"""
c = c.replace(
    "<div>\n            <label className=\"block text-sm font-medium text-[var(--text-secondary)] mb-1.5\">\n              Label\n            </label>",
    auction_dropdown.strip() + "\n\n          <div>\n            <label className=\"block text-sm font-medium text-[var(--text-secondary)] mb-1.5\">\n              Label\n            </label>"
)

# 5. Add auctions fetching to NfcManagementClient
# find states in NfcManagementClient
state_insert = "const [auctions, setAuctions] = useState<any[]>([])"
c = c.replace(
    "const [users, setUsers] = useState<any[]>([])",
    "const [users, setUsers] = useState<any[]>([])\n  " + state_insert
)

fetch_auctions_code = """
  useEffect(() => {
    async function loadAuctions() {
      try {
        const res = await fetch('/api/admin/auctions')
        if (res.ok) {
          const data = await res.json()
          const activeAuctions = data.auctions.filter((a: any) => ['open', 'close', 'register', 'live'].includes(a.status.toLowerCase()))
          setAuctions(activeAuctions)
        }
      } catch (err) {
        console.error('Failed to load auctions:', err)
      }
    }
    loadAuctions()
  }, [])
"""

c = c.replace(
    "useEffect(() => {\n    loadCards()",
    fetch_auctions_code.strip() + "\n\n  useEffect(() => {\n    loadCards()"
)

# 6. Pass auctions to NfcCardForm
c = c.replace(
    "<NfcCardForm\n          onClose={() => setShowCreateForm(false)}\n          onCreated={() => {",
    "<NfcCardForm\n          auctions={auctions}\n          onClose={() => setShowCreateForm(false)}\n          onCreated={() => {"
)

with open("components/admin/NfcManagementClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
