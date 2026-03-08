'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  CreditCard,
  Cpu,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Pencil,
} from 'lucide-react'

// ---- Types ----

interface NfcCard {
  id: string
  nfc_uid: string
  user_id: string
  auction_id: string | null
  is_active: boolean
  label: string | null
  created_at: string
  updated_at: string
  users: { id: string; email: string; display_name: string | null }
  auctions: { id: string; name: string; status: string } | null
}

interface Device {
  id: string
  device_id: string
  name: string | null
  status: string
  firmware_version: string | null
  hardware_version: string | null
  last_seen_at: string | null
  created_at: string
}

interface UserOption {
  id: string
  email: string
  display_name: string | null
}

interface AuctionOption {
  id: string
  name: string
  status: string
}

// ---- Component ----

export default function NfcManagementClient() {
  const [activeTab, setActiveTab] = useState<'nfc' | 'devices'>('nfc')

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-[var(--border)] pb-2">
        <button
          onClick={() => setActiveTab('nfc')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'nfc'
              ? 'bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30'
              : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface)]'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          NFC Cards
        </button>
        <button
          onClick={() => setActiveTab('devices')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'devices'
              ? 'bg-[var(--gold)]/15 text-[var(--gold)] border border-[var(--gold)]/30'
              : 'text-[var(--text-secondary)] hover:text-white hover:bg-[var(--surface)]'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Devices
        </button>
      </div>

      {activeTab === 'nfc' ? <NfcCardsTab /> : <DevicesTab />}
    </div>
  )
}

// ---- NFC Cards Tab ----

function NfcCardsTab() {
  const [cards, setCards] = useState<NfcCard[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingCard, setEditingCard] = useState<NfcCard | null>(null)

  const fetchCards = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: page.toString() })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

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
  }, [page, search, statusFilter])

  useEffect(() => { fetchCards() }, [fetchCards])
  useEffect(() => { setPage(1) }, [search, statusFilter])

  async function handleToggleActive(card: NfcCard) {
    try {
      const res = await fetch(`/api/admin/nfc-cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !card.is_active }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_active: !c.is_active } : c))
      setSuccess(`Card ${card.nfc_uid} ${card.is_active ? 'deactivated' : 'activated'}`)
    } catch {
      setError('Failed to update card status')
    }
  }

  async function handleDelete(card: NfcCard) {
    if (!confirm(`Delete NFC card mapping for ${card.nfc_uid}?`)) return
    try {
      const res = await fetch(`/api/admin/nfc-cards/${card.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setCards(prev => prev.filter(c => c.id !== card.id))
      setTotal(prev => prev - 1)
      setSuccess(`Card ${card.nfc_uid} deleted`)
    } catch {
      setError('Failed to delete card')
    }
  }

  function handleCreated(card: NfcCard) {
    setCards(prev => [card, ...prev])
    setTotal(prev => prev + 1)
    setShowCreateForm(false)
    setSuccess('NFC card mapping created')
  }

  function handleUpdated(card: NfcCard) {
    setCards(prev => prev.map(c => c.id === card.id ? card : c))
    setEditingCard(null)
    setSuccess('NFC card updated')
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="px-4 py-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400 text-sm flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search by NFC UID or label..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)]/50"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--gold)] text-black rounded-lg text-sm font-medium hover:bg-[var(--gold-light)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Mapping
        </button>
      </div>

      <div className="text-sm text-[var(--text-secondary)]">
        {total} card{total !== 1 ? 's' : ''} found
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--surface)]">
                <th className="text-left px-4 py-3 text-sm font-semibold text-white">NFC Card</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-white">User</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-white hidden md:table-cell">Auction</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-white">Status</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-white">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--gold)] mx-auto" />
                  </td>
                </tr>
              ) : cards.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-[var(--text-secondary)]">
                    No NFC cards found
                  </td>
                </tr>
              ) : (
                cards.map((card) => (
                  <tr key={card.id} className="border-t border-[var(--border)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-[var(--gold)] shrink-0" />
                        <div>
                          <div className="text-sm font-mono font-medium text-white">{card.nfc_uid}</div>
                          {card.label && (
                            <div className="text-xs text-[var(--text-secondary)]">{card.label}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="text-sm font-medium text-white">
                          {card.users.display_name || 'Unknown'}
                        </div>
                        <div className="text-xs text-[var(--text-secondary)]">{card.users.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {card.auctions ? (
                        <div>
                          <div className="text-sm text-white">{card.auctions.name}</div>
                          <AuctionStatusBadge status={card.auctions.status} />
                        </div>
                      ) : (
                        <span className="text-xs text-[var(--text-secondary)]">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggleActive(card)} title={card.is_active ? 'Deactivate' : 'Activate'}>
                        {card.is_active ? (
                          <ToggleRight className="w-6 h-6 text-emerald-400 mx-auto" />
                        ) : (
                          <ToggleLeft className="w-6 h-6 text-[var(--text-secondary)] mx-auto" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => setEditingCard(card)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-white rounded-lg hover:bg-white/5 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(card)}
                          className="p-1.5 text-[var(--text-secondary)] hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-white disabled:opacity-30 hover:bg-[var(--surface-hover)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-white disabled:opacity-30 hover:bg-[var(--surface-hover)] transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <CreateNfcCardModal
          onClose={() => setShowCreateForm(false)}
          onCreated={handleCreated}
        />
      )}

      {editingCard && (
        <EditNfcCardModal
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}

// ---- Create Modal ----

function CreateNfcCardModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (card: NfcCard) => void
}) {
  const [nfcUid, setNfcUid] = useState('')
  const [label, setLabel] = useState('')
  const [userId, setUserId] = useState('')
  const [auctionId, setAuctionId] = useState('')
  const [users, setUsers] = useState<UserOption[]>([])
  const [auctions, setAuctions] = useState<AuctionOption[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingAuctions, setLoadingAuctions] = useState(false)

  useEffect(() => {
    async function loadAuctions() {
      setLoadingAuctions(true)
      try {
        const res = await fetch('/api/admin/auctions-list')
        if (res.ok) {
          const data = await res.json()
          setAuctions(data.auctions || [])
        }
      } catch { /* ignore */ } finally {
        setLoadingAuctions(false)
      }
    }
    loadAuctions()
  }, [])

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!userSearch || userSearch.length < 2) { setUsers([]); return }
      setLoadingUsers(true)
      try {
        const res = await fetch(`/api/admin/users?search=${encodeURIComponent(userSearch)}&limit=10`)
        if (res.ok) {
          const data = await res.json()
          setUsers((data.users || []).map((u: UserOption & { anonymous_name?: string }) => ({
            id: u.id,
            email: u.email,
            display_name: u.display_name,
          })))
        }
      } catch { /* ignore */ } finally {
        setLoadingUsers(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [userSearch])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nfcUid || !userId) {
      setError('NFC UID and User are required')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/nfc-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nfc_uid: nfcUid.trim(),
          user_id: userId,
          auction_id: auctionId || null,
          label: label.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create')
      }

      const data = await res.json()
      onCreated(data.nfcCard)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create NFC card mapping')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedUser = users.find(u => u.id === userId)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--gold)]/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[var(--gold)]" />
            </div>
            <h3 className="text-lg font-bold text-white">New NFC Card Mapping</h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              NFC Card UID *
            </label>
            <input
              type="text"
              value={nfcUid}
              onChange={e => setNfcUid(e.target.value)}
              placeholder="e.g. 04A3B21C7F8890"
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white font-mono placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)]/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Label (optional)
            </label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Card #12"
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              User *
            </label>
            {selectedUser ? (
              <div className="flex items-center justify-between px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg">
                <div>
                  <div className="text-sm text-white">{selectedUser.display_name || selectedUser.email}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{selectedUser.email}</div>
                </div>
                <button type="button" onClick={() => { setUserId(''); setUserSearch('') }} className="text-[var(--text-secondary)] hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search users by email or name..."
                  className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)]/50"
                />
                {loadingUsers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[var(--gold)]" />
                )}
                {users.length > 0 && !userId && (
                  <div className="absolute z-10 w-full mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl max-h-48 overflow-y-auto">
                    {users.map(u => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => { setUserId(u.id); setUserSearch('') }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors"
                      >
                        <div className="text-sm text-white">{u.display_name || u.email}</div>
                        <div className="text-xs text-[var(--text-secondary)]">{u.email}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              Auction
            </label>
            {loadingAuctions ? (
              <div className="px-4 py-2.5 text-sm text-[var(--text-secondary)]">Loading auctions...</div>
            ) : (
              <select
                value={auctionId}
                onChange={e => setAuctionId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)]/50"
              >
                <option value="">No auction assigned</option>
                {auctions.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !nfcUid || !userId}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--gold)] text-black rounded-lg text-sm font-medium hover:bg-[var(--gold-light)] transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Create Mapping
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Edit Modal ----

function EditNfcCardModal({
  card,
  onClose,
  onUpdated,
}: {
  card: NfcCard
  onClose: () => void
  onUpdated: (card: NfcCard) => void
}) {
  const [auctionId, setAuctionId] = useState(card.auction_id || '')
  const [label, setLabel] = useState(card.label || '')
  const [auctions, setAuctions] = useState<AuctionOption[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingAuctions, setLoadingAuctions] = useState(false)

  useEffect(() => {
    async function loadAuctions() {
      setLoadingAuctions(true)
      try {
        const res = await fetch('/api/admin/auctions-list')
        if (res.ok) {
          const data = await res.json()
          setAuctions(data.auctions || [])
        }
      } catch { /* ignore */ } finally {
        setLoadingAuctions(false)
      }
    }
    loadAuctions()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/nfc-cards/${card.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          auction_id: auctionId || null,
          label: label.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update')
      }

      const data = await res.json()
      onUpdated(data.nfcCard)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Pencil className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Edit NFC Card</h3>
              <p className="text-xs text-[var(--text-secondary)] font-mono">{card.nfc_uid}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4 px-4 py-3 bg-white/5 rounded-lg">
          <div className="text-xs text-[var(--text-secondary)] mb-1">Mapped User</div>
          <div className="text-sm text-white">{card.users.display_name || card.users.email}</div>
          <div className="text-xs text-[var(--text-secondary)]">{card.users.email}</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Label</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Card #12"
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)]/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Auction</label>
            {loadingAuctions ? (
              <div className="px-4 py-2.5 text-sm text-[var(--text-secondary)]">Loading...</div>
            ) : (
              <select
                value={auctionId}
                onChange={e => setAuctionId(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)]/50"
              >
                <option value="">No auction assigned</option>
                {auctions.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.status})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--gold)] text-black rounded-lg text-sm font-medium hover:bg-[var(--gold-light)] transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Devices Tab ----

function DevicesTab() {
  const [devices, setDevices] = useState<Device[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const fetchDevices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ page: page.toString() })
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)

      const res = await fetch(`/api/admin/devices?${params}`)
      if (!res.ok) throw new Error('Failed to load devices')
      const data = await res.json()
      setDevices(data.devices)
      setTotal(data.total)
      setTotalPages(data.totalPages)
    } catch {
      setError('Failed to load devices')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter])

  useEffect(() => { fetchDevices() }, [fetchDevices])
  useEffect(() => { setPage(1) }, [search, statusFilter])

  function handleCreated(device: Device) {
    setDevices(prev => [device, ...prev])
    setTotal(prev => prev + 1)
    setShowCreateForm(false)
    setSuccess('Device registered')
  }

  function formatLastSeen(dateStr: string | null) {
    if (!dateStr) return 'Never'
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return new Date(dateStr).toLocaleDateString()
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm flex items-center justify-between">
          {error}
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}
      {success && (
        <div className="px-4 py-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-emerald-400 text-sm flex items-center justify-between">
          {success}
          <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search by device ID or name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)]/50"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-white focus:outline-none focus:border-[var(--gold)]/50"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[var(--gold)] text-black rounded-lg text-sm font-medium hover:bg-[var(--gold-light)] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Register Device
        </button>
      </div>

      <div className="text-sm text-[var(--text-secondary)]">
        {total} device{total !== 1 ? 's' : ''} found
      </div>

      <div className="rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--surface)]">
                <th className="text-left px-4 py-3 text-sm font-semibold text-white">Device</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-white hidden md:table-cell">Firmware</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-white">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-white hidden md:table-cell">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--gold)] mx-auto" />
                  </td>
                </tr>
              ) : devices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-[var(--text-secondary)]">
                    No devices registered
                  </td>
                </tr>
              ) : (
                devices.map(device => (
                  <tr key={device.id} className="border-t border-[var(--border)] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <div className="text-sm font-mono font-medium text-white">{device.device_id}</div>
                          {device.name && (
                            <div className="text-xs text-[var(--text-secondary)]">{device.name}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {device.firmware_version || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DeviceStatusBadge status={device.status} />
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-[var(--text-secondary)]">
                        {formatLastSeen(device.last_seen_at)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-[var(--text-secondary)]">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-white disabled:opacity-30 hover:bg-[var(--surface-hover)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-white disabled:opacity-30 hover:bg-[var(--surface-hover)] transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showCreateForm && (
        <CreateDeviceModal
          onClose={() => setShowCreateForm(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}

// ---- Create Device Modal ----

function CreateDeviceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (device: Device) => void
}) {
  const [deviceId, setDeviceId] = useState('')
  const [name, setName] = useState('')
  const [firmwareVersion, setFirmwareVersion] = useState('')
  const [hardwareVersion, setHardwareVersion] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!deviceId.trim()) { setError('Device ID is required'); return }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId.trim(),
          name: name.trim() || null,
          firmware_version: firmwareVersion.trim() || null,
          hardware_version: hardwareVersion.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to register device')
      }

      const data = await res.json()
      onCreated(data.device)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register device')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-lg font-bold text-white">Register Device</h3>
          </div>
          <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Device ID *</label>
            <input
              type="text"
              value={deviceId}
              onChange={e => setDeviceId(e.target.value)}
              placeholder="e.g. DEV_001"
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white font-mono placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)]/50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Handheld #3"
              className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)]/50"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Firmware Version</label>
              <input
                type="text"
                value={firmwareVersion}
                onChange={e => setFirmwareVersion(e.target.value)}
                placeholder="e.g. 1.0.0"
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)]/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Hardware Version</label>
              <input
                type="text"
                value={hardwareVersion}
                onChange={e => setHardwareVersion(e.target.value)}
                placeholder="e.g. 1.0"
                className="w-full px-4 py-2.5 bg-[var(--background)] border border-[var(--border)] rounded-lg text-sm text-white placeholder:text-[var(--text-secondary)] focus:outline-none focus:border-[var(--gold)]/50"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !deviceId.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--gold)] text-black rounded-lg text-sm font-medium hover:bg-[var(--gold-light)] transition-colors disabled:opacity-50"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Register
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Badge Components ----

function AuctionStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    live: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    registration_open: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    upcoming: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    ended: 'bg-white/5 text-[var(--text-secondary)] border-white/10',
    completed: 'bg-white/5 text-[var(--text-secondary)] border-white/10',
    draft: 'bg-white/5 text-[var(--text-secondary)] border-white/10',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${colors[status] || colors.draft}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function DeviceStatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    inactive: 'bg-white/5 text-[var(--text-secondary)] border-white/10',
    maintenance: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colors[status] || colors.inactive}`}>
      {status}
    </span>
  )
}
