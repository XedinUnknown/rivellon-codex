"""Build the single-file page: src/template.html + src/app.js + data/nexus.json + data/icons.json + data/ref/*.json -> dist/rivellon-codex.html

Usage (from the repo root):  python3 tools/build.py      (needs: pip install openpyxl pillow)

The game data is not committed: it's extracted from your own copies of the source spreadsheets in data/source/ (see
data/source/README.md) whenever a spreadsheet is newer than what was extracted.

The template has four placeholders:
  __JS__     replaced by src/app.js
  __DATA__   replaced by data/nexus.json   (inside <script id="data" type="application/json">)
  __ICONS__  replaced by data/icons.json   (inside <script id="icons" type="application/json">)
  __REF__    replaced by data/ref/*.json as { table: doc }   (inside <script id="ref" type="application/json">)
"</" is escaped in the JSON so it can't close the surrounding <script> tag.
The embedded reference tables are what the page uses outside claude.ai; on claude.ai the database collection "ref"
overrides them once it loads, so the tables can still be updated there without a rebuild.
"""
import json, pathlib, subprocess, sys, tempfile

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'data/source'
nexus_xlsx, info_xlsx = src / 'DOS2_DE_Eng.xlsx', src / 'DOS2_Info_Shared.xlsx'
stale = lambda out, xlsx: xlsx.exists() and (not out.exists() or out.stat().st_mtime < xlsx.stat().st_mtime)
run = lambda *a: subprocess.run([sys.executable, '-I', *map(str, a)], check=True, cwd=root)
if stale(root / 'data/nexus.json', nexus_xlsx):
    run('tools/extract_nexus.py', nexus_xlsx, 'data/nexus.json', 'data/nexus-icons.json')
if stale(root / 'data/ref/recipes.json', info_xlsx):
    with tempfile.TemporaryDirectory() as tmp:
        run('tools/extract_info.py', info_xlsx, f'{tmp}/info.json')
        run('tools/make_refdocs.py', f'{tmp}/info.json')
missing = [p for p in ('data/nexus.json', 'data/ref/recipes.json') if not (root / p).exists()]
if missing:
    sys.exit(f"missing {', '.join(missing)}: put the spreadsheets in data/source/ (see data/source/README.md)")
t = (root / 'src/template.html').read_text(encoding='utf-8')
j = (root / 'src/app.js').read_text(encoding='utf-8')
nexus = json.loads((root / 'data/nexus.json').read_text(encoding='utf-8'))
icons_file = root / 'data/nexus-icons.json'
if icons_file.exists(): nexus['icons'] = json.loads(icons_file.read_text(encoding='utf-8'))
d = json.dumps(nexus, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
i = (root / 'data/icons.json').read_text(encoding='utf-8').replace('</', '<\\/')
r = json.dumps({f.stem: json.loads(f.read_text(encoding='utf-8')) for f in sorted((root / 'data/ref').glob('*.json'))},
               ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
out = t.replace('__JS__', j).replace('__DATA__', d).replace('__ICONS__', i).replace('__REF__', r)
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist/rivellon-codex.html').write_text(out, encoding='utf-8')
print(f"dist/rivellon-codex.html  {len(out.encode())/1024:.0f} KB")
