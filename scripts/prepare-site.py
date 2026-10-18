"""Stage only website files; no framework or third-party packages required."""

import argparse
from pathlib import Path
import shutil


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--with-visitors", action="store_true",
                        help="Enable the included same-origin visitor API for Cloudflare hosting.")
    args = parser.parse_args()
    root = Path(__file__).resolve().parent.parent
    output = root / "dist"
    if output.is_symlink():
        raise SystemExit("Refusing to replace a symlink at dist/.")
    if output.exists():
        shutil.rmtree(output)
    output.mkdir()
    files = ["index.html", "style.css", "app.js", "data.json", "visitors.js", "visitor-client.js",
             "site-settings.js", "favicon.svg", ".nojekyll"]
    for name in files:
        shutil.copy2(root / name, output / name)
    shutil.copytree(root / "assets", output / "assets",
                    ignore=shutil.ignore_patterns(".DS_Store", "._*"))
    if args.with_visitors:
        (output / "site-settings.js").write_text(
            "export const visitorStatistics = { enabled: true };\n", encoding="utf-8")
    print("Website files staged in dist/ ({})".format(
        "visitor API enabled" if args.with_visitors else "static GitHub Pages mode"))


if __name__ == "__main__":
    main()
