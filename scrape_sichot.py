#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Scrapes all 39 volumes of Likkutei Sichos from mafteiach.app
and generates src/data/sampleData.ts for the Sichos Tracker app.

Usage:
    pip install requests beautifulsoup4
    python scrape_sichot.py

Output:
    sampleData.ts  (ready to drop into src/data/)
"""

import re
import time
import sys
import requests
from bs4 import BeautifulSoup, NavigableString, Tag

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "https://www.mafteiach.app/likkutei_sichos/by_volume/{}"
HEADERS  = {"User-Agent": "Mozilla/5.0 (compatible; SichosTracker/1.0)"}

HEB_ORDINALS = ["א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט", "י"]

HEBREW_VOL_LABELS = {
    1:  'ח"א',  2:  'ח"ב',  3:  'ח"ג',  4:  'ח"ד',  5:  'ח"ה',
    6:  'ח"ו',  7:  'ח"ז',  8:  'ח"ח',  9:  'ח"ט',  10: 'ח"י',
    11: 'חי"א', 12: 'חי"ב', 13: 'חי"ג', 14: 'חי"ד', 15: 'חט"ו',
    16: 'חט"ז', 17: 'חי"ז', 18: 'חי"ח', 19: 'חי"ט', 20: 'ח"כ',
    21: 'חכ"א', 22: 'חכ"ב', 23: 'חכ"ג', 24: 'חכ"ד', 25: 'חכ"ה',
    26: 'חכ"ו', 27: 'חכ"ז', 28: 'חכ"ח', 29: 'חכ"ט', 30: 'ח"ל',
    31: 'חל"א', 32: 'חל"ב', 33: 'חל"ג', 34: 'חל"ד', 35: 'חל"ה',
    36: 'חל"ו', 37: 'חל"ז', 38: 'חל"ח', 39: 'חל"ט',
}

# Very permissive — handles all quote/geresh variants across volumes & OSes
PAGE_REF_RE = re.compile(
    r'(ח\S{1,6})\s+ע\S{0,2}\s*(\d+)\s*\(([^)\n]{2,60})\)',
    re.UNICODE
)

# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

def fetch_volume(vol_num: int) -> str:
    resp = requests.get(BASE_URL.format(vol_num), headers=HEADERS, timeout=20)
    resp.raise_for_status()
    resp.encoding = 'utf-8'
    return resp.text


# ---------------------------------------------------------------------------
# Parse — walks DOM in document order so each sicha gets the correct PDF link
# ---------------------------------------------------------------------------

def parse_volume(html: str, vol_num: int) -> list[dict]:
    """
    Walks the DOM tree in document order.
    - When a text node matches PAGE_REF_RE → start a new sicha
    - When an <a> tag with drive.google.com is found → assign to current sicha
      (only the first drive link per sicha, typically the "שיחה" PDF)
    Stops at the first הוספות heading.
    """
    # Truncate HTML at הוספות section boundary
    hosafot_pos = len(html)
    for marker in ["הוספות - ", "הוספות (", ">הוספות<", "הוספות–", "הוספות —"]:
        idx = html.find(marker)
        if idx != -1 and idx < hosafot_pos:
            hosafot_pos = idx
    main_html = html[:hosafot_pos]
    main_soup = BeautifulSoup(main_html, "html.parser")

    sichos: list[dict] = []
    current: dict | None = None
    seen_pages: set[int] = set()
    stop = False

    def visit(node):
        nonlocal current, stop
        if stop:
            return

        if isinstance(node, NavigableString):
            text = str(node).strip()
            # Extra safety: stop if we stumble into הוספות text
            if text.startswith("הוספות"):
                stop = True
                return
            m = PAGE_REF_RE.search(text)
            if m:
                page_num = int(m.group(2))
                if page_num not in seen_pages and page_num >= 1:
                    seen_pages.add(page_num)
                    if current is not None:
                        sichos.append(current)
                    current = {
                        "title":      m.group(3).strip(),
                        "page_ref":   f"{m.group(1)} ע' {page_num}",
                        "page_start": page_num,
                        "vol_num":    vol_num,
                        "pdf_url":    None,
                    }

        elif isinstance(node, Tag):
            if node.name == "a":
                href = node.get("href", "")
                if "drive.google.com" in href and current is not None and current["pdf_url"] is None:
                    # Prefer the "שיחה" link; fall back to any drive link
                    link_text = node.get_text(strip=True)
                    if link_text in ("שיחה", "") or current["pdf_url"] is None:
                        current["pdf_url"] = href
                return  # don't recurse into <a> — href already captured

            for child in node.children:
                visit(child)

    visit(main_soup)
    if current is not None:
        sichos.append(current)

    sichos.sort(key=lambda s: s["page_start"])
    return sichos


# ---------------------------------------------------------------------------
# Page counts
# ---------------------------------------------------------------------------

def compute_page_counts(all_sichos: list[dict]) -> list[dict]:
    result = []
    for i, s in enumerate(all_sichos):
        if i + 1 < len(all_sichos) and all_sichos[i + 1]["vol_num"] == s["vol_num"]:
            count = all_sichos[i + 1]["page_start"] - s["page_start"]
        else:
            count = 8
        result.append({**s, "page_count": max(1, count)})
    return result


# ---------------------------------------------------------------------------
# Ordinal labels  בראשית א, ב, ג …
# ---------------------------------------------------------------------------

def add_ordinal_labels(vols: list[list[dict]]) -> list[list[dict]]:
    counts: dict[str, int] = {}
    for vol in vols:
        for s in vol:
            counts[s["title"]] = counts.get(s["title"], 0) + 1

    seen: dict[str, int] = {}
    result = []
    for vol in vols:
        lv = []
        for s in vol:
            t = s["title"]
            seen[t] = seen.get(t, 0) + 1
            if counts[t] > 1:
                i = seen[t] - 1
                ordinal = HEB_ORDINALS[i] if i < len(HEB_ORDINALS) else str(seen[t])
                display = f"{t} {ordinal}"
            else:
                display = t
            lv.append({**s, "display_title": display})
        result.append(lv)
    return result


# ---------------------------------------------------------------------------
# TypeScript output
# ---------------------------------------------------------------------------

def ts_str(s: str) -> str:
    return s.replace("\\", "\\\\").replace("'", "\\'")


def generate_typescript(vols: list[list[dict]]) -> str:
    lines = [
        "// AUTO-GENERATED by scrape_sichot.py — do not edit by hand.",
        "// Re-run the script to refresh data from mafteiach.app",
        "",
        "export interface Sicha {",
        "  id: string;",
        "  title: string;     // Hebrew label, e.g. 'בראשית א'",
        "  pageRef: string;   // e.g. \"ח\\\"א ע' 1\"",
        "  pageCount: number;",
        "  pdfUrl?: string;   // Google Drive link to the sicha PDF",
        "}",
        "",
        "export interface Volume {",
        "  id: number;",
        "  label: string;",
        "  hebrewLabel: string;",
        "  sichos: Sicha[];",
        "}",
        "",
        "export const SAMPLE_VOLUMES: Volume[] = [",
    ]

    for vi, vol in enumerate(vols):
        vol_num   = vi + 1
        heb_label = HEBREW_VOL_LABELS.get(vol_num, f"ח' {vol_num}")
        lines.append("  {")
        lines.append(f"    id: {vol_num},")
        lines.append(f"    label: 'חלק {vol_num}',")
        lines.append(f"    hebrewLabel: '{ts_str(heb_label)}',")
        lines.append("    sichos: [")
        for idx, s in enumerate(vol):
            sid      = f"{vol_num}-{idx + 1}"
            title    = ts_str(s["display_title"])
            page_ref = ts_str(s["page_ref"])
            pdf_part = f", pdfUrl: '{ts_str(s['pdf_url'])}'" if s.get("pdf_url") else ""
            lines.append(
                f"      {{ id: '{sid}', title: '{title}', "
                f"pageRef: '{page_ref}', pageCount: {s['page_count']}{pdf_part} }},"
            )
        lines.append("    ],")
        lines.append("  },")

    lines.append("];")
    lines.append("")
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    all_vols_raw: list[list[dict]] = []

    for vol_num in range(1, 40):
        print(f"Vol {vol_num:>2}/39 ... ", end="", flush=True)
        try:
            html   = fetch_volume(vol_num)
            sichos = parse_volume(html, vol_num)
            pdfs   = sum(1 for s in sichos if s.get("pdf_url"))
            print(f"{len(sichos):>3} sichos, {pdfs:>3} PDFs")
            all_vols_raw.append(sichos)
        except Exception as e:
            print(f"ERROR: {e}")
            all_vols_raw.append([])
        time.sleep(0.6)

    flat  = [s for vol in all_vols_raw for s in vol]
    flat  = compute_page_counts(flat)

    it = iter(flat)
    vols_counted = []
    for raw_vol in all_vols_raw:
        vols_counted.append([next(it) for _ in raw_vol])

    vols_labeled = add_ordinal_labels(vols_counted)

    ts = generate_typescript(vols_labeled)
    with open("sampleData.ts", "w", encoding="utf-8") as f:
        f.write(ts)

    total      = sum(len(v) for v in vols_labeled)
    total_pdfs = sum(1 for v in vols_labeled for s in v if s.get("pdf_url"))
    print(f"\nDone! {total} sichos, {total_pdfs} with PDF links → sampleData.ts")


if __name__ == "__main__":
    main()
