import base64, os, json, sys
dest = "/Users/filiphector/Hooks-inv/public/icons"
os.makedirs(dest, exist_ok=True)
# Read icon data from stdin or from data file
data_file = os.path.join(dest, "icons_data.json")
if os.path.exists(data_file):
    with open(data_file) as f:
        icons = json.load(f)
    for name, b64 in icons.items():
        with open(os.path.join(dest, f"{name}.png"), "wb") as f:
            f.write(base64.b64decode(b64))
        print(f"  OK: {name}.png")
    print(f"\nDone! {len(icons)} icons installed to {dest}")
    os.remove(data_file)
else:
    print(f"ERROR: {data_file} not found!")
    print("Please ensure icons_data.json is in the icons directory")
