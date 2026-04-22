#!/usr/bin/env python3
"""
Assemble page.js from base64 chunks posted to .b64_page.txt
The container will post chunks, and this script assembles them.
"""
import base64, os, sys

INPUT = '/Users/filiphector/Hooks-inv/.b64_page.txt'
OUTPUT = '/Users/filiphector/Hooks-inv/app/page.js'

if not os.path.exists(INPUT):
    print(f"No input: {INPUT}")
    sys.exit(1)

b64 = open(INPUT).read().strip().replace('\n', '').replace(' ', '')
print(f"b64 size: {len(b64)} chars")

try:
    data = base64.b64decode(b64)
    with open(OUTPUT, 'wb') as f:
        f.write(data)
    print(f"Written {len(data)} bytes to {OUTPUT}")
    print(f"Lines: {data.count(b10 := bytes([10]))}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
