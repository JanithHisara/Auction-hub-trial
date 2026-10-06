with open('app/api/admin/nfc-cards/route.ts', 'r', encoding='utf-8') as f:
    c = f.read()

# Add nfc_type filter extraction
c = c.replace("const statusFilter = searchParams.get('status') || ''", "const statusFilter = searchParams.get('status') || ''\n    const nfcTypeFilter = searchParams.get('nfc_type') || ''")

# Add nfc_type query filter
old_filter = """if (statusFilter === 'active') {
      query = query.eq('is_active', true)
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false)
    }"""

new_filter = """if (statusFilter === 'active') {
      query = query.eq('is_active', true)
    } else if (statusFilter === 'inactive') {
      query = query.eq('is_active', false)
    }

    if (nfcTypeFilter) {
      query = query.eq('nfc_type', nfcTypeFilter)
    }"""

c = c.replace(old_filter, new_filter)

with open('app/api/admin/nfc-cards/route.ts', 'w', encoding='utf-8') as f:
    f.write(c)
