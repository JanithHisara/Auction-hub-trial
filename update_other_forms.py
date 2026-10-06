import re

for filename in ["app/admin/auctions/new/progressive/page.tsx", "app/admin/auctions/new/incremental/page.tsx"]:
    with open(filename, "r", encoding="utf-8") as f:
        c = f.read()

    # Remove the auction type selection section completely
    type_section_regex = r"\{/\* Type \*/\}.*?\{/\* Schedule \*/\}"
    c = re.sub(type_section_regex, "{/* Schedule */}", c, flags=re.DOTALL)

    # Also fix the initial state
    c = re.sub(
        r"auction_type: '(.*?)',",
        r"auction_type: '\1' as const,",
        c
    )

    with open(filename, "w", encoding="utf-8") as f:
        f.write(c)

