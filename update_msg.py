with open('components/admin/NfcManagementClient.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Insert the success/error message for Quick Delete
search_str = '''<h2 className="text-xl font-bold text-white">NFC Cards</h2>'''
replace_str = '''<h2 className="text-xl font-bold text-white">NFC Cards</h2>
            {quickDeleteMsg && (
              <div className={px-3 py-1.5 rounded-lg text-sm }>
                {quickDeleteMsg.text}
              </div>
            )}'''
c = c.replace(search_str, replace_str)

with open('components/admin/NfcManagementClient.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
