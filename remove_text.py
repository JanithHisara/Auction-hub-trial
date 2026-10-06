import re

with open('components/admin/NfcManagementClient.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace('Permanent (Self-Registered)', 'Permanent')
c = c.replace('Temporary (Admin Created)', 'Temporary')

with open('components/admin/NfcManagementClient.tsx', 'w', encoding='utf-8') as f:
    f.write(c)
