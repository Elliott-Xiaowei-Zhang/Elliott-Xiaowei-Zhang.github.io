"""Publish real aggregate totals alongside the static homepage, without counting a visit."""

import argparse
from datetime import datetime, timezone, timedelta
import json
from pathlib import Path
import re
import sys
import urllib.request


def checked_stats(value):
    def count(number):
        return type(number) is int and 0 <= number <= 9007199254740991
    if not isinstance(value, dict) or not count(value.get("total")):
        raise ValueError("Invalid total")
    countries = value.get("countries")
    if not isinstance(countries, list) or len(countries) > 300:
        raise ValueError("Invalid countries")
    seen = set()
    for row in countries:
        if (not isinstance(row, dict) or not re.fullmatch(r"[A-Z]{2}", str(row.get("country", "")))
                or row["country"] in seen or not count(row.get("visitors")) or not row["visitors"]):
            raise ValueError("Invalid country total")
        seen.add(row["country"])
    if sum(row["visitors"] for row in countries) != value["total"]:
        raise ValueError("Inconsistent totals")
    return {"total": value["total"], "since": value.get("since"),
            "countries": [{"country": row["country"], "visitors": row["visitors"]} for row in countries]}


def checked_snapshot(value, now):
    result = checked_stats(value)
    updated = datetime.fromisoformat(value["updatedAt"].replace("Z", "+00:00"))
    if updated.tzinfo is None or updated > now + timedelta(minutes=5):
        raise ValueError("Invalid snapshot date")
    return {**result, "updatedAt": updated.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")}


def fetch_json(url):
    if not url.startswith("https://"):
        raise ValueError("HTTPS required")
    request = urllib.request.Request(url, headers={
        "User-Agent": "HomepageVisitorSnapshot/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(request, timeout=12) as response:
        body = response.read(262145)
        if len(body) > 262144:
            raise ValueError("Response too large")
        return json.loads(body)


def refresh_snapshot(output, endpoint, published_url, fetcher=fetch_json, now=None):
    now = now or datetime.now(timezone.utc)
    try:
        totals = checked_stats(fetcher(endpoint))
        result = {**totals, "updatedAt": now.isoformat(timespec="seconds").replace("+00:00", "Z")}
    except Exception as error:
        print(f"Live totals unavailable ({type(error).__name__}); preserving the latest saved totals.", file=sys.stderr)
        candidates = []
        try:
            candidates.append(checked_snapshot(json.loads(output.read_text(encoding="utf-8")), now))
        except (OSError, ValueError, TypeError, KeyError):
            pass
        # Each CI checkout starts from source. Keep the last published snapshot
        # if it is newer, rather than rolling the counter back during an outage.
        try:
            candidates.append(checked_snapshot(fetcher(published_url), now))
        except Exception:
            pass
        if not candidates:
            raise RuntimeError("No valid visitor snapshot available") from error
        result = max(candidates, key=lambda item: item["updatedAt"])
    temporary = output.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temporary.replace(output)
    print(f"Saved visitor totals: {result['total']} (updated {result['updatedAt']})")
    return result


def main():
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--published-url", default="https://elliott-xiaowei-zhang.github.io/visitor-snapshot.json")
    args = parser.parse_args()
    settings = (root / "site-settings.js").read_text(encoding="utf-8")
    match = re.search(r"endpoint:\s*['\"]([^'\"]+)['\"]", settings)
    if not match:
        raise SystemExit("No statistics endpoint configured")
    refresh_snapshot(root / "visitor-snapshot.json", match[1], args.published_url)


if __name__ == "__main__":
    main()
