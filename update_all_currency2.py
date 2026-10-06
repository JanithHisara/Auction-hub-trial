import os
import re

old_func_pattern = re.compile(
    r'function formatCurrency\(amount:\s*number\)\s*\{\s*return\s*\'Rs\.\s*\'\s*\+\s*new\s*Intl\.NumberFormat\(\'en-US\',\s*\{\s*minimumFractionDigits:\s*0,\s*maximumFractionDigits:\s*0\s*\}\)\.format\(amount\)\s*\}',
    re.MULTILINE | re.DOTALL
)

new_func = '''function formatCurrency(amount: number) {
  if (amount >= 1_000_000_000) {
    return 'Rs. ' + (amount / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (amount >= 1_000_000) {
    return 'Rs. ' + (amount / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (amount >= 1_000) {
    return 'Rs. ' + (amount / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return 'Rs. ' + amount.toString();
  }
}'''

for root, _, files in os.walk('.'):
    if 'node_modules' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if old_func_pattern.search(content):
                content = old_func_pattern.sub(new_func, content)
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                print(f"Updated {path}")
