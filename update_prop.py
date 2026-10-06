import re

with open("components/admin/NfcManagementClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

c = c.replace(
    "<CreateNfcCardModal\n          onClose={() => setShowCreateForm(false)}\n          onCreated={handleCreated}",
    "<CreateNfcCardModal\n          auctions={auctions}\n          onClose={() => setShowCreateForm(false)}\n          onCreated={handleCreated}"
)

with open("components/admin/NfcManagementClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
