import re

with open("components/gems/GemForm.tsx", "r", encoding="utf-8") as f:
    c = f.read()

# Remove validation:
# if (formData.end_time) {
#   const end = new Date(formData.end_time)
#   const originalEnd = gem?.end_time ? new Date(gem.end_time) : null
#   if (end < now && (!originalEnd || end.getTime() !== originalEnd.getTime())) {
#     throw new Error('End time must be in the future')
#   }
# }
pattern1 = r"if \(formData\.end_time\)\s*\{\s*const end = new Date\(formData\.end_time\)\s*const originalEnd = gem\?\.end_time \? new Date\(gem\.end_time\) : null\s*if \(end < now.*?throw new Error\('End time must be in the future'\)\s*\}\s*\}"
c = re.sub(pattern1, "", c, flags=re.DOTALL)

# Remove validation:
# if (formData.end_time) {
#   const end = new Date(formData.end_time)
#   if (end < aucStart || end > aucEnd) {
#     throw new Error(`Item end time must be between...`)
#   }
# }
pattern2 = r"if \(formData\.end_time\)\s*\{\s*const end = new Date\(formData\.end_time\)\s*if \(end < aucStart \|\| end > aucEnd\)\s*\{\s*throw new Error\(`Item end time must be between.*?`\)\s*\}\s*\}"
c = re.sub(pattern2, "", c, flags=re.DOTALL)

with open("components/gems/GemForm.tsx", "w", encoding="utf-8") as f:
    f.write(c)

