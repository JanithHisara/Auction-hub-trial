import re

with open("app/admin/auctions/new/tender/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Remove the auction type selection section completely
type_section_regex = r"\{/\* Type \*/\}.*?\{/\* Schedule \*/\}"
c = re.sub(type_section_regex, "{/* Schedule */}", c, flags=re.DOTALL)

# Also fix the initial state
c = c.replace(
    "auction_type: 'tender_base_fixed_bid',",
    "auction_type: 'tender_base_fixed_bid' as const,"
)

# Rename labels in Schedule for Tender
c = c.replace("Registration Closes *", "End Bidding Time *")
c = c.replace("Auction Starts *", "Bid Start Time *")
c = c.replace("Select registration close time", "Select end bidding time")
c = c.replace("Select auction start time", "Select bid start time")

# We want `registration_end` to be bound to the "End Bidding Time" input
# Wait, currently the form binds `registration_end` to "End Bidding Time".
# BUT we also want `auction_end` to be the exact same value. So when we submit, we force auction_end to be equal to registration_end.
# Let's find the `handleSubmit`
handle_submit_block_regex = r"(const handleSubmit = async \(e: React.FormEvent\) => \{\s*e\.preventDefault\(\)\s*setLoading\(true\)\s*setError\(''\)\s*try \{)"

replacement = r"""\1
      // For Sealed Bid (Tender), auction_end is exactly the same as registration_end (End Bidding Time)
      const dataToSubmit = { ...formData, auction_end: formData.registration_end }
"""
c = re.sub(handle_submit_block_regex, replacement, c)

# Then we must replace `body: JSON.stringify(formData)` with `body: JSON.stringify(dataToSubmit)`
c = c.replace("body: JSON.stringify(formData)", "body: JSON.stringify(dataToSubmit)")

with open("app/admin/auctions/new/tender/page.tsx", "w", encoding="utf-8") as f:
    f.write(c)

