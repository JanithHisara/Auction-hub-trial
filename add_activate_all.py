with open("components/admin/TenderStatusActions.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Add a function to activate all items
activate_all_func = """  const handleActivateAll = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/auctions/${auctionId}/activate-all-items`, {
        method: 'POST',
      })
      if (!res.ok) throw new Error('Failed to activate items')
      router.refresh()
    } catch (error) {
      confirm(error instanceof Error ? error.message : 'Failed to activate items', { isAlert: true, confirmText: 'OK', title: 'Error' })
    } finally {
      setIsLoading(false)
    }
  }

  // Warnings based on current state"""

c = c.replace("  // Warnings based on current state", activate_all_func)

# Add the button to the render output
render_return = """    <>
      {currentStatus !== 'completed' && currentStatus !== 'ended' && currentStatus !== 'draft' && (
        <button
          onClick={handleActivateAll}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-white font-medium bg-emerald-500/20 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all text-emerald-400"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Activate All Items</span>
        </button>
      )}

      <button"""

c = c.replace("    <>\n      <button", render_return)

with open("components/admin/TenderStatusActions.tsx", "w", encoding="utf-8") as f:
    f.write(c)

