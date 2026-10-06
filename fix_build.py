import re

with open('components/admin/NfcManagementClient.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

bad_str = "setQuickDeleteMsg({text: Temporary card  successfully deleted., type: 'success'})"
good_str = "setQuickDeleteMsg({text: `Temporary card ${quickDeleteUid} successfully deleted.`, type: 'success'})"

c = c.replace(bad_str, good_str)

with open('components/admin/NfcManagementClient.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
