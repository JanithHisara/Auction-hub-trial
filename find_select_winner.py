import os

for root, dirs, files in os.walk("components/admin"):
    for file in files:
        if file.endswith(".tsx"):
            with open(os.path.join(root, file), "r", encoding="utf-8") as f:
                if "select-winner" in f.read():
                    print(f"Found in {file}")
