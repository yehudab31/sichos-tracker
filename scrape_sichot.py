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
from bs4 import BeautifulSoup

# Force UTF-8 output on Windows
if sys.stdout.encoding != 'utf-8':
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

# ---------------------------------------------------------------------------
# Fetch
# ---------------------------------------------------------------------------

def fetch_volume(vol_num: int) -> str:
    resp = requests.get(BASE_URL.format(vol_num), headers=HEADERS, timeout=20)
    resp.raise_for_status()
    resp.encoding = 'utf-8'
    return resp.text


# ---------------------------------------------------------------------------
# Parse
# ---------------------------------------------------------------------------

# Very permissive page-ref pattern:
#   ח + (any non-whitespace 1-6 chars) + whitespace + ע + (any 1-2 chars) + digits + (title)
# This handles all quote/geresh variants across volumes and operating systems.
PAGE_REF_RE = re.compile(
    r'(ח\S{1,6})\s+ע\S{0,2}\s*(\d+)\s*\(([^)\n]{2,60})\)',
    re.UNICODE
)

# Stop processing when we see an הוספות section header
HOSAFOT_RE = re.compile(r'^הוספות[\s\-–]', re.UNICODE)


def parse_volume(html: str, vol_num: int) -> list[dict]:
    """
    Returns list of dicts: {title, page_ref, page_start, vol_num, pdf_url}
    Only processes the main sicha section (stops before הוספות).
    """
    soup = BeautifulSoup(html, "html.parser")

    # ── Step 1: find the position in the raw HTML where הוספות begins.
    # We'll use this to truncate both text and HTML searches.
    raw = html

    # Find "הוספות" section — look for it as a standalone heading.
    # Multiple possible markers in different volumes:
    hosafot_html_pos = len(raw)
    for marker in ["הוספות - ", "הוספות (", ">הוספות<"]:
        idx = raw.find(marker)
        if idx != -1 and idx < hosafot_html_pos:
            hosafot_html_pos = idx

    main_html = raw[:hosafot_html_pos]
    main_soup = BeautifulSoup(main_html, "html.parser")
    main_text = main_soup.get_text("\n")

    # ── Step 2: extract all Google Drive PDF links from the main section HTML.
    # We record (char_position_in_main_html, url) pairs.
    pdf_positions: list[tuple[int, str]] = []
    for a in main_soup.find_all("a", href=True):
        href = a["href"]
        if "drive.google.com" in href:
            # Use the link text to only take the "שיחה" link (not מתורגם)
            link_text = a.get_text(strip=True)
            if link_text in ("שיחה", ""):
                pos = main_html.find(href)
                if pos != -1:
                    pdf_positions.append((pos, href))

    # ── Step 3: find all page-ref matches in main_text.
    sichos: list[dict] = []
    seen: set[int] = set()   # deduplicate by page number

    for m in PAGE_REF_RE.finditer(main_text):
        vol_label = m.group(1)
        page_num  = int(m.group(2))
        raw_title = m.group(3).strip()

        # Skip duplicates (nested tags often produce the same match twice)
        if page_num in seen:
            continue
        seen.add(page_num)

        # Skip if this looks like an index/footnote entry (very high page number
        # for an early volume, e.g. ח"א ע' 700 would be wrong for vol 1)
        # Simple sanity check: page must be >= 1
        if page_num < 1:
            continue

        # ── Step 4: find the nearest PDF link *after* this match.
        # Approximate the position in main_html by finding the page-ref string.
        ref_str = f"{vol_label} ע"   # partial match — enough to locate it
        ref_pos = main_html.find(ref_str + m.group(0)[len(vol_label):len(vol_label)+6])
        if ref_pos == -1:
            ref_pos = main_html.find(str(page_num))   # fallback

        pdf_url = None
        for p_pos, p_url in pdf_positions:
            if p_pos > ref_pos:
                pdf_url = p_url
                break

        sichos.append({
            "title":      raw_title,
            "page_ref":   f"{vol_label} ע' {page_num}",
            "page_start": page_num,
            "vol_num":    vol_num,
            "pdf_url":    pdf_url,
        })

    # Sort by page number (ensures correct page-count calculation)
    sichos.sort(key=lambda s: s["page_start"])
    return sichos


# ---------------------------------------------------------------------------
# Page counts
# ---------------------------------------------------------------------------

def compute_page_counts(all_sichos: list[dict]) -> list[dict]:
    result = []
    for i, s in enumerate(all_sichos):
        if (i + 1 < len(all_sichos)
                and all_sichos[i + 1]["vol_num"] == s["vol_num"]):
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
            sid       = f"{vol_num}-{idx + 1}"
            title     = ts_str(s["display_title"])
            page_ref  = ts_str(s["page_ref"])
            pdf_part  = f", pdfUrl: '{ts_str(s['pdf_url'])}'" if s.get("pdf_url") else ""
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

    # Compute page counts across the flat list
    flat  = [s for vol in all_vols_raw for s in vol]
    flat  = compute_page_counts(flat)

    it = iter(flat)
    vols_counted = []
    for raw_vol in all_vols_raw:
        vols_counted.append([next(it) for _ in raw_vol])

    # Add ordinal labels
    vols_labeled = add_ordinal_labels(vols_counted)

    # Write TypeScript
    ts = generate_typescript(vols_labeled)
    with open("sampleData.ts", "w", encoding="utf-8") as f:
        f.write(ts)

    total      = sum(len(v) for v in vols_labeled)
    total_pdfs = sum(1 for v in vols_labeled for s in v if s.get("pdf_url"))
    print(f"\nDone!  {total} sichos total, {total_pdfs} with PDF links → sampleData.ts")


if __name__ == "__main__":
    main()
