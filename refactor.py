import re

with open("components/admin/NfcManagementClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Clean up NfcManagementClient wrapper
# Remove handleQuickDelete and quickDelete states from wrapper
content = re.sub(
    r"const \[quickDeleteUid, setQuickDeleteUid\].*?function handleQuickDelete.*?\}\n  \}",
    "",
    content,
    flags=re.DOTALL
)

# Remove the fetchCards from the wrapper
content = re.sub(
    r"const fetchCards = useCallback.*?\}, \[page, search, statusFilter\]\)",
    "",
    content,
    flags=re.DOTALL
)

# Remove the UI elements from wrapper
content = re.sub(
    r"\{quickDeleteMsg && \(.*?</div>\s*\)\}",
    "",
    content,
    flags=re.DOTALL
)
content = re.sub(
    r"<form onSubmit=\{handleQuickDelete\} className=\"flex gap-2\">.*?</form>",
    "",
    content,
    flags=re.DOTALL
)
# Change the wrapper's header back
content = re.sub(
    r"\{activeTab === 'nfc' && \(.*?</button>\s*</div>\s*</div>",
    "{activeTab === 'nfc' ? <NfcCardsTab /> : activeTab === 'devices' ? <DevicesTab /> : <AuctionPlacesTab />}",
    content,
    flags=re.DOTALL
)

# 2. Add nfcSubTab to NfcCardsTab
nfc_cards_tab_start = """function NfcCardsTab() {
    const [cards, setCards] = useState<NfcCard[]>([])"""
nfc_cards_tab_new = """function NfcCardsTab() {
    const [nfcSubTab, setNfcSubTab] = useState<'permanent' | 'temporary'>('permanent')
    const [showQuickDelete, setShowQuickDelete] = useState(false)
    const [quickDeleteUid, setQuickDeleteUid] = useState('')
    const [quickDeleting, setQuickDeleting] = useState(false)
    const [cards, setCards] = useState<NfcCard[]>([])"""
content = content.replace(nfc_cards_tab_start, nfc_cards_tab_new)

# 3. Add nfcSubTab to fetchCards inside NfcCardsTab
old_fetch = """const params = new URLSearchParams({ page: page.toString() })
        if (search) params.set('search', search)
        if (statusFilter) params.set('status', statusFilter)"""
new_fetch = """const params = new URLSearchParams({ page: page.toString() })
        if (search) params.set('search', search)
        if (statusFilter) params.set('status', statusFilter)
        params.set('nfc_type', nfcSubTab)"""
content = content.replace(old_fetch, new_fetch)

# Add dependency
content = content.replace("}, [page, search, statusFilter])", "}, [page, search, statusFilter, nfcSubTab])")
content = content.replace("useEffect(() => { setPage(1) }, [search, statusFilter])", "useEffect(() => { setPage(1) }, [search, statusFilter, nfcSubTab])")

# 4. Add Quick Delete Handler inside NfcCardsTab
quick_delete_handler = """
  async function handleQuickDelete(e: React.FormEvent) {
    e.preventDefault()
    if (!quickDeleteUid.trim()) return
    setQuickDeleting(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/admin/nfc-cards/quick-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfc_uid: quickDeleteUid.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      setSuccess(`Temporary card ${quickDeleteUid} successfully deleted.`)
      setQuickDeleteUid('')
      setShowQuickDelete(false)
      fetchCards()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting card')
    } finally {
      setQuickDeleting(false)
    }
  }
"""
content = content.replace("useEffect(() => { fetchCards() }, [fetchCards])", "useEffect(() => { fetchCards() }, [fetchCards])" + quick_delete_handler)

# 5. UI updates in NfcCardsTab
old_ui = """return (
      <div className="space-y-4">
        {error && (
          <div className="flex items-center justify-between px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-lg">"""
          
new_ui = """return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between border-b border-[var(--border)] pb-4">
          <div className="flex gap-2">
            <button
              onClick={() => { setNfcSubTab('permanent'); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${nfcSubTab === 'permanent' ? 'border-[var(--gold)] text-[var(--gold)]' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
            >
              Permanent Cards
            </button>
            <button
              onClick={() => { setNfcSubTab('temporary'); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${nfcSubTab === 'temporary' ? 'border-[var(--gold)] text-[var(--gold)]' : 'border-transparent text-[var(--text-secondary)] hover:text-white'}`}
            >
              Temporary Cards
            </button>
          </div>
          
          <div className="flex gap-3 items-center">
            {nfcSubTab === 'temporary' && (
              <button
                onClick={() => setShowQuickDelete(true)}
                className="px-4 py-2 bg-red-500/20 text-red-500 rounded-lg text-sm font-medium hover:bg-red-500/30 transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete Card
              </button>
            )}
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-gold flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" /> Add Card
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-lg">"""
content = content.replace(old_ui, new_ui)

# 6. Add the Modal UI
modal_ui = """{showCreateForm && <CreateNfcModal onClose={() => setShowCreateForm(false)} onCreated={() => fetchCards()} />}
        
        {showQuickDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Delete Temporary Card</h3>
                <button onClick={() => setShowQuickDelete(false)} className="text-[var(--text-secondary)] hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleQuickDelete} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                    NFC Card UID
                  </label>
                  <input
                    type="text"
                    value={quickDeleteUid}
                    onChange={e => setQuickDeleteUid(e.target.value)}
                    placeholder="Enter UID to delete..."
                    className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white font-mono placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)]/50"
                    required
                  />
                </div>
                <div className="flex gap-3 justify-end pt-2">
                  <button type="button" onClick={() => setShowQuickDelete(false)} className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white">Cancel</button>
                  <button type="submit" disabled={quickDeleting || !quickDeleteUid} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50">
                    {quickDeleting ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}"""

content = content.replace("{showCreateForm && <CreateNfcModal onClose={() => setShowCreateForm(false)} onCreated={() => fetchCards()} />}", modal_ui)

# Wait! The earlier wrapper clean up needs to be precise. 
# Let's write the whole content back
with open("components/admin/NfcManagementClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Updated NfcManagementClient.tsx")
