"""Split the Info-sheet extraction (info.json from extract_info.py) into one JSON document per table: data/ref/<table>.json

  python3 -I tools/extract_info.py "Divinity_ Original Sin 2 - Info (Shared).xlsx" /tmp/info.json
  python3 tools/make_refdocs.py /tmp/info.json

Each document is { source, extracted, rows: [...] } (or { ..., data: {...} } for non-list tables like runes),
which is exactly what lives in the database collection "ref" (one doc per table, each under 256 KiB).
"""
import json, sys, pathlib, datetime

T = json.load(open(sys.argv[1]))
src = T['_meta']['source']
dest = pathlib.Path(__file__).resolve().parent.parent / 'data/ref'
dest.mkdir(parents=True, exist_ok=True)
for k, v in T.items():
    if k.startswith('_'): continue
    doc = {'source': src, 'extracted': datetime.date.today().isoformat()}
    if isinstance(v, list): doc['rows'] = v
    else: doc['data'] = v
    if k == 'rarity': doc['sheetNotes'] = T['_sheetNotes']['rarityHeader']
    s = json.dumps(doc, ensure_ascii=False)
    assert len(s.encode()) < 250 * 1024, (k, len(s.encode()))
    (dest / f'{k}.json').write_text(s, encoding='utf-8')
    print(f'{k:16} {len(s.encode()):>8} bytes')
