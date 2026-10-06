import os

new_func = '''function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined || isNaN(Number(amount))) return 'Rs. 0';
  const val = Number(amount);
  if (val >= 1_000_000_000) {
    return 'Rs. ' + (val / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  } else if (val >= 1_000_000) {
    return 'Rs. ' + (val / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  } else if (val >= 1_000) {
    return 'Rs. ' + (val / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  } else {
    return 'Rs. ' + val.toString();
  }
}'''

old_func_sig = 'function formatCurrency(amount: number) {'

for root, _, files in os.walk('.'):
    if 'node_modules' in root or '.next' in root:
        continue
    for file in files:
        if file.endswith('.tsx') or file.endswith('.ts'):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            if old_func_sig in content:
                # Find the old function block
                start = content.find(old_func_sig)
                end = content.find('}', start)
                
                # Check if it contains the bug (amount.toString)
                if 'amount.toString' in content[start:end+100] or '1_000_000' in content[start:end+100]:
                    # Extract the whole function (matching braces)
                    brace_count = 0
                    for i in range(start, len(content)):
                        if content[i] == '{': brace_count += 1
                        elif content[i] == '}': 
                            brace_count -= 1
                            if brace_count == 0:
                                end = i + 1
                                break
                    
                    old_block = content[start:end]
                    content = content.replace(old_block, new_func)
                    
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Fixed {path}")
