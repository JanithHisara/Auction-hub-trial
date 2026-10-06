import re

with open("components/gems/GemForm.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Remove validation:
# if (formData.start_time) {
#   const start = new Date(formData.start_time)
#   if (start < aucStart || start > aucEnd) {
#     throw new Error(`Item start time must be between...`)
#   }
# }
pattern = r"if \(formData\.start_time\)\s*\{\s*const start = new Date\(formData\.start_time\)\s*if \(start < aucStart \|\| start > aucEnd\)\s*\{\s*throw new Error\(`Item start time must be between.*?`\)\s*\}\s*\}"
c = re.sub(pattern, "", c, flags=re.DOTALL)

with open("components/gems/GemForm.tsx", "w", encoding="utf-8") as f:
    f.write(c)
