import importlib.util
import json
from pathlib import Path
import tempfile
from datetime import datetime, timezone
import unittest

spec = importlib.util.spec_from_file_location("snapshot", Path(__file__).resolve().parents[1] / "scripts/update-visitor-snapshot.py")
snapshot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(snapshot)


class SnapshotTests(unittest.TestCase):
    def test_refresh_gets_real_totals_and_failure_keeps_newest_published_snapshot(self):
        now = datetime(2026, 10, 21, 10, tzinfo=timezone.utc)
        totals = {"total": 2, "since": None, "countries": [{"country": "CN", "visitors": 2}]}
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "visitor-snapshot.json"
            result = snapshot.refresh_snapshot(output, "live", "published", lambda url: totals, now)
            self.assertEqual(result["total"], 2)
            self.assertEqual(json.loads(output.read_text())["updatedAt"], "2026-10-21T10:00:00Z")
            published = {"total": 3, "since": None, "countries": [{"country": "CN", "visitors": 3}],
                         "updatedAt": "2026-10-21T10:01:00Z"}

            def outage(url):
                if url == "live":
                    raise OSError("unreachable")
                return published

            preserved = snapshot.refresh_snapshot(output, "live", "published", outage, now)
            self.assertEqual(preserved, published)

    def test_invalid_aggregates_are_rejected(self):
        for value in [{"total": True}, {"total": 7, "countries": [{"country": "CN", "visitors": 3}]},
                      {"total": 6, "countries": [{"country": "CN", "visitors": 3}] * 2}]:
            with self.assertRaises(ValueError):
                snapshot.checked_stats(value)

    def test_recent_snapshot_keeps_only_public_visit_hours_and_survives_outage(self):
        now = datetime(2026, 10, 21, 10, tzinfo=timezone.utc)
        totals = {"total": 1, "since": None, "countries": [{"country": "CN", "visitors": 1}]}
        visits = {"visits": [{"country": "CN", "hour": "2026-10-21T09:00:00Z", "id": "private"}]}
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "visitor-snapshot.json"
            first = snapshot.refresh_snapshot(
                output, "totals", "published",
                lambda url: {"totals": totals, "recent": visits}[url], now, recent_endpoint="recent",
            )
            self.assertEqual(first["recent"]["visits"], [{"country": "CN", "hour": "2026-10-21T09:00:00Z"}])
            later = snapshot.refresh_snapshot(
                output, "totals", "published", lambda url: {"totals": totals}[url],
                now.replace(hour=11), recent_endpoint="recent",
            )
            self.assertEqual(later["recent"], first["recent"])
        with self.assertRaises(ValueError):
            snapshot.checked_visit_hours({"visits": [{"country": "CN", "hour": "2026-10-21T09:42:00Z"}]})


if __name__ == "__main__":
    unittest.main()
