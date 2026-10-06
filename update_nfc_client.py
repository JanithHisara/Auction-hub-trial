import re

with open('components/admin/NfcManagementClient.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# 1. interface NfcCard
old_interface = '''interface NfcCard {
  created_by_user?: { display_name: string | null; email: string } | null
  id: string
  nfc_uid: string
  user_id: string
  is_active: boolean
  label: string | null'''

new_interface = '''interface NfcCard {
  created_by_user?: { display_name: string | null; email: string } | null
  id: string
  nfc_uid: string
  user_id: string
  is_active: boolean
  label: string | null
  nfc_type?: 'permanent' | 'temporary' '''
c = c.replace(old_interface, new_interface)

# 2. Add nfcType to CreateNfcModal
old_modal_start = '''function CreateNfcModal({ onClose }: { onClose: () => void }) {
    const [nfcUid, setNfcUid] = useState('')
    const [label, setLabel] = useState('')
    const [userSearch, setUserSearch] = useState('')
    const [users, setUsers] = useState<UserOption[]>([])
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)
    const [userId, setUserId] = useState('')
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showCreateUser, setShowCreateUser] = useState(false)'''

new_modal_start = '''function CreateNfcModal({ onClose }: { onClose: () => void }) {
    const [nfcUid, setNfcUid] = useState('')
    const [label, setLabel] = useState('')
    const [userSearch, setUserSearch] = useState('')
    const [users, setUsers] = useState<UserOption[]>([])
    const [selectedUser, setSelectedUser] = useState<UserOption | null>(null)
    const [userId, setUserId] = useState('')
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showCreateUser, setShowCreateUser] = useState(false)
    const [nfcType, setNfcType] = useState<'permanent' | 'temporary'>('permanent')'''
c = c.replace(old_modal_start, new_modal_start)

# 3. Add nfc_type to body
c = c.replace('''nfc_uid: nfcUid.trim(),
            user_id: userId,
            label: label.trim() || null,''', '''nfc_uid: nfcUid.trim(),
            user_id: userId,
            label: label.trim() || null,
            nfc_type: nfcType,''')

# 4. Add Radio Buttons in the form
old_form_start = '''<form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">'''
new_form_start = '''<form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
              NFC Card Type
            </label>
            <div className="flex gap-4 mb-4">
              <label className="flex items-center gap-2 text-white">
                <input type="radio" checked={nfcType === 'permanent'} onChange={() => { setNfcType('permanent'); setShowCreateUser(false); }} className="accent-[var(--gold)]" />
                Permanent (Self-Registered)
              </label>
              <label className="flex items-center gap-2 text-white">
                <input type="radio" checked={nfcType === 'temporary'} onChange={() => setNfcType('temporary')} className="accent-[var(--gold)]" />
                Temporary (Admin Created)
              </label>
            </div>
            
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">'''
c = c.replace(old_form_start, new_form_start)

# 5. Hide Create New User if Permanent
c = c.replace('{!selectedUser && (', '{!selectedUser && nfcType === \'temporary\' && (')

# 6. Require all info in InlineCreateUserModal
old_req = '''if (!displayName.trim()) { setError('Name is required'); return }
    if (!password.trim()) { setError('Password is required'); return }'''
new_req = '''if (!displayName.trim()) { setError('Name is required'); return }
    if (!email.trim()) { setError('Email is required'); return }
    if (!phone.trim()) { setError('Phone is required'); return }
    if (!password.trim()) { setError('Password is required'); return }'''
c = c.replace(old_req, new_req)

c = c.replace('<label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email</label>', '<label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Email *</label>')
c = c.replace('<label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Phone Number</label>', '<label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">Phone Number *</label>')

# 7. Render card type badge
c = c.replace('''<div className="text-sm font-mono font-medium text-white">{card.nfc_uid}</div>''', '''<div className="flex gap-2 items-center"><div className="text-sm font-mono font-medium text-white">{card.nfc_uid}</div><span className="text-[10px] px-1.5 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)]">{card.nfc_type === 'temporary' ? 'Temp' : 'Perm'}</span></div>''')

# 8. Quick Delete UI
# We need to add state to NfcManagementClient at top
qd_state = '''const [activeTab, setActiveTab] = useState<'nfc' | 'devices' | 'places'>('nfc')

  const [quickDeleteUid, setQuickDeleteUid] = useState('')
  const [quickDeleting, setQuickDeleting] = useState(false)
  const [quickDeleteMsg, setQuickDeleteMsg] = useState<{text: string, type: 'success'|'error'} | null>(null)

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
      setQuickDeleteMsg({text: Temporary card  successfully deleted., type: 'success'})
      setQuickDeleteUid('')
      fetchCards(currentPage)
    } catch (err) {
      setQuickDeleteMsg({text: err instanceof Error ? err.message : 'Error', type: 'error'})
    } finally {
      setQuickDeleting(false)
    }
  }'''

c = c.replace('''const [activeTab, setActiveTab] = useState<'nfc' | 'devices' | 'places'>('nfc')''', qd_state)

qd_ui = '''{activeTab === 'nfc' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <h2 className="text-xl font-bold text-white">NFC Cards</h2>
            <div className="flex gap-3 items-center w-full sm:w-auto">
              <form onSubmit={handleQuickDelete} className="flex gap-2">
                <input
                  type="text"
                  placeholder="NFC UID to delete..."
                  value={quickDeleteUid}
                  onChange={e => setQuickDeleteUid(e.target.value)}
                  className="px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-sm text-white focus:border-[var(--gold)]"
                />
                <button type="submit" disabled={quickDeleting || !quickDeleteUid} className="p-2 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-lg transition-colors disabled:opacity-50" title="Delete Temporary Card">
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
              <button
                onClick={() => setIsCreateModalOpen(true)}'''

c = c.replace('''{activeTab === 'nfc' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <h2 className="text-xl font-bold text-white">NFC Cards</h2>
            <button
              onClick={() => setIsCreateModalOpen(true)}''', qd_ui)

with open('components/admin/NfcManagementClient.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

print("Updated Client")
