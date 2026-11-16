"""Build static JSON datasets for the school/institution picker in address-picker.js.

Reads the source masterlists in resources/:
  - resources/ched institutions.txt
  - resources/Masterlist-of-Schools-Based-on-School-Year-ELEMENTARY-SY-2017-2018_2.pdf
and writes compact JSON files to clergy/static/clergy/data/:
  - ched_institutions.json
  - elementary_schools.json
"""

from __future__ import annotations

import json
import pathlib
import re

import fitz

ROOT = pathlib.Path(__file__).resolve().parent.parent
RESOURCES_DIR = ROOT / "resources"
DATA_DIR = ROOT / "clergy" / "static" / "clergy" / "data"

CHED_SRC = RESOURCES_DIR / "ched institutions.txt"
ELEM_PDF = RESOURCES_DIR / "Masterlist-of-Schools-Based-on-School-Year-ELEMENTARY-SY-2017-2018_2.pdf"
CITIES_JSON = DATA_DIR / "cities.json"

CHED_OUT = DATA_DIR / "ched_institutions.json"
ELEM_OUT = DATA_DIR / "elementary_schools.json"


def _region_sort_key(region: str) -> tuple[int, str]:
    match = re.match(r"^(\d+)([A-Za-z]*)\b", region.strip())
    if match:
        return (int(match.group(1)), match.group(2))
    return (999, region)


def _clean_pdf_cell(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(value.replace("\r\n", "\n").replace("-\n", "-").split())


def build_ched_json() -> dict:
    raw_lines = CHED_SRC.read_text(encoding="utf-8", errors="replace").splitlines()
    seen: set[tuple[str, str, str]] = set()
    rows: list[tuple[str, str, str]] = []

    for line in raw_lines:
        if not line.strip():
            continue
        parts = line.split("\t")
        region = parts[0].strip()
        name = " ".join(parts[1].split())
        inst_type = parts[2].strip() if len(parts) >= 3 and parts[2].strip() else "Type not specified"
        if inst_type == "PRIVATE HEI":
            inst_type = "Private HEI"
        key = (region, name, inst_type)
        if key in seen:
            continue
        seen.add(key)
        rows.append(key)

    regions = sorted({r for r, _, _ in rows}, key=_region_sort_key)
    region_idx = {r: i for i, r in enumerate(regions)}

    rows.sort(key=lambda x: (region_idx[x[0]], x[1].casefold(), x[2].casefold()))
    payload = {
        "regions": regions,
        "items": [
            {"n": name, "r": region_idx[region], "t": inst_type}
            for region, name, inst_type in rows
        ],
    }
    CHED_OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return payload


def build_elementary_json() -> dict:
    cities = json.loads(CITIES_JSON.read_text(encoding="utf-8"))
    ilocos_sur_map = {
        c["name"].casefold(): c["name"]
        for c in cities
        if c.get("province_code") == "0129"
    }

    doc = fitz.open(ELEM_PDF)
    records = []
    for page in doc:
        for table in page.find_tables().tables:
            for row in table.extract():
                c0 = (row[0] or "").strip()
                if not c0.isdigit():
                    continue
                raw_muni = _clean_pdf_cell(row[9])
                canonical_muni = ilocos_sur_map.get(raw_muni.casefold(), raw_muni.title())
                records.append({
                    "no": int(c0),
                    "id": _clean_pdf_cell(row[1]),
                    "name": _clean_pdf_cell(row[2]),
                    "municipality": canonical_muni,
                    "sub_class": _clean_pdf_cell(row[19]),
                })

    municipalities = sorted({r["municipality"] for r in records}, key=str.casefold)
    muni_idx = {m: i for i, m in enumerate(municipalities)}
    records.sort(key=lambda r: (muni_idx[r["municipality"]], r["name"].casefold(), r["id"]))

    payload = {
        "region": "Region I",
        "province": "Ilocos Sur",
        "municipalities": municipalities,
        "items": [
            {
                "n": r["name"],
                "m": muni_idx[r["municipality"]],
                "id": r["id"],
                "s": r["sub_class"],
            }
            for r in records
        ],
    }
    ELEM_OUT.write_text(json.dumps(payload, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return payload


def main() -> None:
    ched = build_ched_json()
    elem = build_elementary_json()
    print(f"Wrote {CHED_OUT.relative_to(ROOT)}: {len(ched['items'])} institutions across {len(ched['regions'])} regions")
    print(f"Wrote {ELEM_OUT.relative_to(ROOT)}: {len(elem['items'])} schools across {len(elem['municipalities'])} municipalities")


if __name__ == "__main__":
    main()
