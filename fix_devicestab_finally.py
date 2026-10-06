with open("components/admin/NfcManagementClient.tsx", "r", encoding="utf-8") as f:
    c = f.read()

bad_dep1 = "}, [page, search, statusFilter, nfcSubTab])\n\n  useEffect(() => { fetchDevices() }, [fetchDevices])"
good_dep1 = "}, [page, search, statusFilter])\n\n  useEffect(() => { fetchDevices() }, [fetchDevices])"
c = c.replace(bad_dep1, good_dep1)

bad_dep2 = "useEffect(() => { setPage(1) }, [search, statusFilter, nfcSubTab])\n\n  function handleCreated() {"
good_dep2 = "useEffect(() => { setPage(1) }, [search, statusFilter])\n\n  function handleCreated() {"
c = c.replace(bad_dep2, good_dep2)

with open("components/admin/NfcManagementClient.tsx", "w", encoding="utf-8") as f:
    f.write(c)
