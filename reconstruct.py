#!/usr/bin/env python3
"""Reconstruct page.js from base64 chunks"""
import gzip, base64, os
chunks_dir = os.path.expanduser("~/Hooks-inv/.b64_chunks")
os.makedirs(chunks_dir, exist_ok=True)
# Chunks will be appended below
b64_data = ""
