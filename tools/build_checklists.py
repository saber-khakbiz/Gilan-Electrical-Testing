"""Build the checklist PDFs in documents/ from the HTML sources in documents/src/.

Usage (from the repository root):
    pip install playwright && playwright install chromium
    python tools/build_checklists.py

Each documents/src/<name>.html becomes documents/<name>.pdf (A4, page numbers
in the footer). The text lives only in the HTML sources; edit those, then
run this script again.
"""
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "documents" / "src"
OUT = ROOT / "documents"

FOOTER = (
    '<div style="width:100%;font-family:Arial,sans-serif;font-size:8px;'
    'color:#4b5875;text-align:center;">'
    '<span class="pageNumber"></span> / <span class="totalPages"></span></div>'
)


def main():
    sources = sorted(SRC.glob("*.html"))
    if not sources:
        raise SystemExit("No HTML sources found in " + str(SRC))
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for src in sources:
            page.goto(src.as_uri(), wait_until="networkidle")
            page.evaluate("document.fonts.ready")
            target = OUT / (src.stem + ".pdf")
            page.pdf(
                path=str(target),
                format="A4",
                print_background=True,
                prefer_css_page_size=True,
                display_header_footer=True,
                header_template="<div></div>",
                footer_template=FOOTER,
            )
            print("built", target.relative_to(ROOT), target.stat().st_size // 1024, "KB")
        browser.close()


if __name__ == "__main__":
    main()
