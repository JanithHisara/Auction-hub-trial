import re

with open("components/admin/NfcManagementClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# 1. Fix CreateNfcCardModal definition
c = c.replace(
    "function CreateNfcCardModal({\n  onClose,\n  onCreated,\n}: {\n  onClose: () => void\n  onCreated: () => void\n}) {",
    "function CreateNfcCardModal({\n  onClose,\n  onCreated,\n  auctions,\n}: {\n  onClose: () => void\n  onCreated: () => void\n  auctions: any[]\n}) {"
)

# 2. Add auctions state to NfcManagementClient (the main component)
c = c.replace(
    "const [nfcSubTab, setNfcSubTab] = useState<'permanent' | 'temporary'>('permanent')",
    "const [nfcSubTab, setNfcSubTab] = useState<'permanent' | 'temporary'>('permanent')\n  const [auctions, setAuctions] = useState<any[]>([])"
)

# 3. Fetch auctions in NfcManagementClient
fetch_code = """
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
    "useEffect(() => {\n    loadCards()\n  }, [page, statusFilter, search, nfcSubTab])",
    fetch_code.strip() + "\n\n  useEffect(() => {\n    loadCards()\n  }, [page, statusFilter, search, nfcSubTab])"
)

# 4. Pass auctions to CreateNfcCardModal
c = c.replace(
    "<CreateNfcCardModal\n          onClose={() => setShowCreateForm(false)}\n          onCreated={() => {",
    "<CreateNfcCardModal\n          auctions={auctions}\n          onClose={() => setShowCreateForm(false)}\n          onCreated={() => {"
)

with open("components/admin/NfcManagementClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
