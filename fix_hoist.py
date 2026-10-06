import re

with open('components/admin/NfcManagementClient.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

bad_func = """  async function handleQuickDelete(e: React.FormEvent) {
    e.preventDefault()
    if (!quickDeleteUid.trim()) return
    setQuickDeleting(true)
    setQuickDeleteMsg(null)
    try {
      const res = await fetch('/api/admin/nfc-cards/quick-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfc_uid: quickDeleteUid.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      setQuickDeleteMsg({text: `Temporary card ${quickDeleteUid} successfully deleted.`, type: 'success'})
      setQuickDeleteUid('')
      fetchCards(currentPage)
    } catch (err) {
      setQuickDeleteMsg({text: err instanceof Error ? err.message : 'Error', type: 'error'})
    } finally {
      setQuickDeleting(false)
    }
  }"""

c = c.replace(bad_func, "")

# Insert it after fetchCards
fetch_cards_func = """  const fetchCards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: page.toString() })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
        
      const res = await fetch(`/api/admin/nfc-cards?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch cards')
      
      setCards(data.nfcCards || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching NFC cards')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])"""

good_func = """
  async function handleQuickDelete(e: React.FormEvent) {
    e.preventDefault()
    if (!quickDeleteUid.trim()) return
    setQuickDeleting(true)
    setQuickDeleteMsg(null)
    try {
      const res = await fetch('/api/admin/nfc-cards/quick-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfc_uid: quickDeleteUid.trim() })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      setQuickDeleteMsg({text: `Temporary card ${quickDeleteUid} successfully deleted.`, type: 'success'})
      setQuickDeleteUid('')
      fetchCards()
    } catch (err) {
      setQuickDeleteMsg({text: err instanceof Error ? err.message : 'Error', type: 'error'})
    } finally {
      setQuickDeleting(false)
    }
  }"""

c = c.replace(fetch_cards_func, fetch_cards_func + "\n" + good_func)

with open('components/admin/NfcManagementClient.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
