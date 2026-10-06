import re

with open('components/admin/NfcManagementClient.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Fix state
c = re.sub(
    r'(const \[showCreateUser, setShowCreateUser\] = useState\(false\))',
    r"\1\n    const [nfcType, setNfcType] = useState<'permanent' | 'temporary'>('permanent')",
    c
)

# Fix API payload
c = re.sub(
    r"nfc_uid: nfcUid\.trim\(\),\s*user_id: userId,\s*label: label\.trim\(\) \|\| null,",
    r"nfc_uid: nfcUid.trim(),\n              user_id: userId,\n              label: label.trim() || null,\n              nfc_type: nfcType,",
    c
)

# Fix form UI
radio_ui = """<div>
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
            </div>
            
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">
                NFC UID *
              </label>"""

c = re.sub(
    r'<div>\s*<label className="block text-sm font-medium text-\[var\(--text-secondary\)\] mb-1\.5">\s*NFC UID \*',
    radio_ui,
    c
)

with open('components/admin/NfcManagementClient.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
