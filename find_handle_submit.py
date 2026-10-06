import re

with open("app/admin/auctions/new/tender/page.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Extract from handleSubmit to the end of validations
matches = re.search(r'(const handleSubmit = async.*?if \(!formData\.password)', c, re.DOTALL)
if matches:
    print(matches.group(1))
