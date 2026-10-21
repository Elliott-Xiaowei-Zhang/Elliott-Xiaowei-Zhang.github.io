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


if __name__ == "__main__":
    unittest.main()
