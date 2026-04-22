#!/usr/bin/env python3
"""Apply TaByApp rewrite from container's version"""
import urllib.request, json, gzip, base64, sys

# Read current page.js
c = open('app/page.js').read()

# Find boundaries  
start = c.index("function TaByApp({ onSwitchMode }) {")
end = c.index("function DIOApp({ onSwitchMode }) {")
old_taby = c[start:end]

print(f"Old TaByApp: {len(old_taby)} chars, {len(old_taby.splitlines())} lines")

# Download new TaByApp from container's committed version on GitHub
url = "https://raw.githubusercontent.com/filip703/Hooks-inv/main/app/page.js"
try:
    # Actually we can't get container version from github since it hasn't been pushed
    # Instead, check if we already have scoring features
    if 'saveHoleScore' in c:
        print("Already has scoring - skipping")
        sys.exit(0)
except:
    pass

print("TaByApp needs update but can't download from container")
print("Container commit e95507f needs to be pushed first")
print("Run: git push from container or start new session")
sys.exit(1)
