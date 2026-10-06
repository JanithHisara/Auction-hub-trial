import os

for root, dirs, files in os.walk("."):
    for file in files:
        if file.endswith(".tsx") or file.endswith(".ts"):
            path = os.path.join(root, file)
            if "node_modules" in path or ".next" in path: continue
            try:
                with open(path, "r", encoding="utf-8") as f:
                    if "Item end time must be between" in f.read():
                        print(f"Found in {path}")
            except:
                pass
