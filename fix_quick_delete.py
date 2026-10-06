with open("components/admin/NfcManagementClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

old_func = """  async function handleQuickDelete(e: React.FormEvent) {
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
  }"""

new_func = """  async function handleQuickDelete(e: React.FormEvent) {
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
      
      let data = {}
      const text = await res.text()
      if (text) {
        try {
          data = JSON.parse(text)
        } catch (e) {
          throw new Error(`Server returned non-JSON response: ${text || res.statusText}`)
        }
      }
      
      if (!res.ok) throw new Error(data.error || `Failed to delete (${res.status})`)
      setSuccess(`Temporary card ${quickDeleteUid} successfully deleted.`)
      setQuickDeleteUid('')
      setShowQuickDelete(false)
      fetchCards()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting card')
    } finally {
      setQuickDeleting(false)
    }
  }"""

c = c.replace(old_func, new_func)

with open("components/admin/NfcManagementClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
