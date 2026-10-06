import re

with open("components/admin/NfcManagementClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

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

c = re.sub(
    r"  useEffect\(\(\) => \{\s*loadCards\(\)\s*\}, \[page, statusFilter, search, nfcSubTab\]\)",
    fetch_code.strip() + "\n\n  useEffect(() => {\n    loadCards()\n  }, [page, statusFilter, search, nfcSubTab])",
    c
)

c = c.replace(
    "<CreateNfcCardModal\n          onClose={() => setShowCreateForm(false)}\n          onCreated={() => {",
    "<CreateNfcCardModal\n          auctions={auctions}\n          onClose={() => setShowCreateForm(false)}\n          onCreated={() => {"
)

with open("components/admin/NfcManagementClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
