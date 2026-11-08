#!/usr/bin/env python3
"""Check local Markdown links and HTML image/link paths in all project READMEs."""
from html import unescape
from pathlib import Path
import re
import subprocess
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
paths = subprocess.check_output(
    ["rg", "--files", "-g", "README*", "-g", "!**/node_modules/**"],
    cwd=ROOT, text=True,
).splitlines()
failures = []
checked = 0
for name in paths:
    source = ROOT / name
    text = re.sub(r"```.*?```", "", source.read_text(), flags=re.S)
    targets = re.findall(r"!?\[[^\]]*\]\(([^)]+)\)", text)
    targets += re.findall(r"(?:src|href)=[\"']([^\"']+)[\"']", text)
    for raw in targets:
        target = unescape(raw.strip().split(' "')[0].strip("<>"))
        parsed = urlsplit(target)
        if parsed.scheme or parsed.netloc or not parsed.path:
            continue
        path = unquote(parsed.path)
        resolved = ROOT / path.lstrip("/") if path.startswith("/") else source.parent / path
        checked += 1
        if not resolved.exists():
            failures.append(f"{name}: {target}")
if failures:
    print("Missing relative link/image targets:")
    print("\n".join(failures))
    raise SystemExit(1)
print(f"PASS: {checked} local image/link targets resolve across {len(paths)} documents.")
