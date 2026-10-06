with open("components/admin/NfcManagementClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

fetch_cards_code = """  const fetchCards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: page.toString() })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (nfcSubTab) params.set('nfc_type', nfcSubTab)

      const res = await fetch(`/api/admin/nfc-cards?${params}`)
      if (!res.ok) throw new Error('Failed to load NFC cards')
      const data = await res.json()
      setCards(data.nfcCards)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      setError('Failed to load NFC cards')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, nfcSubTab])

  useEffect(() => { fetchCards() }, [fetchCards])

  useEffect(() => { setPage(1) }, [search, statusFilter, nfcSubTab])"""

c = c.replace("  useEffect(() => { setPage(1) }, [search, statusFilter, nfcSubTab])", fetch_cards_code, 1)

with open("components/admin/NfcManagementClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
