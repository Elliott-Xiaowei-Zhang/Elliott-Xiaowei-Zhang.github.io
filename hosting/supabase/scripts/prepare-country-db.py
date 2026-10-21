#!/usr/bin/env python3
"""Bundle a public, country-only PDDL dataset without any visitor data."""
import base64
import hashlib
from pathlib import Path
import subprocess
import urllib.request

RELEASE = "2026-10-20"
SOURCE = "https://github.com/sapics/ip-location-db/releases/download/latest/user-country.mmdb"
EXPECTED_SHA256 = "aab2c58a9ea95f26405d00a7cb60bd25d1e2aece7b55ab5ae03d77eeec172295"
request = urllib.request.Request(SOURCE, headers={"User-Agent": "HomepageCountryDatabaseBuilder", "Cache-Control": "no-cache"})
with urllib.request.urlopen(request, timeout=60) as response:
    database = response.read(16_000_000)
if hashlib.sha256(database).hexdigest() != EXPECTED_SHA256:
    raise SystemExit("Database checksum differs from the pinned upstream release")
compressed = subprocess.run([
    "node", "-e",
    "const z=require('node:zlib');const chunks=[];process.stdin.on('data',x=>chunks.push(x));"
    "process.stdin.on('end',()=>process.stdout.write(z.brotliCompressSync(Buffer.concat(chunks),"
    "{params:{[z.constants.BROTLI_PARAM_QUALITY]:11}})));"
], input=database, stdout=subprocess.PIPE, check=True).stdout
output = Path(__file__).resolve().parents[1] / "functions/visitors/country-data.mjs"
payload = base64.b64encode(compressed).decode("ascii")
output.write_text(
    f"// sapics user-country {RELEASE}, PDDL: https://github.com/sapics/ip-location-db\n"
    f"// Source: {SOURCE}\n"
    f"// SHA-256 (decompressed): {hashlib.sha256(database).hexdigest()}\n"
    "export const compressedCountryDatabase =\n" +
    repr(payload) + ";\n",
    encoding="utf-8",
)
print(f"Bundled public country database: {len(database)} bytes; source module: {output.stat().st_size} bytes")
