import re

with open('components/admin/NfcManagementClient.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

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
              NFC Card UID *"""

c = re.sub(
    r'<div>\s*<label className="block text-sm font-medium text-\[var\(--text-secondary\)\] mb-1\.5">\s*NFC Card UID \*',
    radio_ui,
    c
)

with open('components/admin/NfcManagementClient.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
