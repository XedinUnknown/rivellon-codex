"""Build the single-file page: src/template.html + src/app.js + data/nexus.json + data/icons.json + data/ref/*.json -> dist/rivellon-codex.html

Usage (from the repo root):  python3 tools/build.py

The template has four placeholders:
  __JS__     replaced by src/app.js
  __DATA__   replaced by data/nexus.json   (inside <script id="data" type="application/json">)
  __ICONS__  replaced by data/icons.json   (inside <script id="icons" type="application/json">)
  __REF__    replaced by data/ref/*.json as { table: doc }   (inside <script id="ref" type="application/json">)
"</" is escaped in the JSON so it can't close the surrounding <script> tag.
The embedded reference tables are what the page uses outside claude.ai; on claude.ai the database collection "ref"
overrides them once it loads, so the tables can still be updated there without a rebuild.
"""
import json, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
t = (root / 'src/template.html').read_text(encoding='utf-8')
j = (root / 'src/app.js').read_text(encoding='utf-8')
d = (root / 'data/nexus.json').read_text(encoding='utf-8').replace('</', '<\\/')
i = (root / 'data/icons.json').read_text(encoding='utf-8').replace('</', '<\\/')
r = json.dumps({f.stem: json.loads(f.read_text(encoding='utf-8')) for f in sorted((root / 'data/ref').glob('*.json'))},
               ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
out = t.replace('__JS__', j).replace('__DATA__', d).replace('__ICONS__', i).replace('__REF__', r)
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist/rivellon-codex.html').write_text(out, encoding='utf-8')
print(f"dist/rivellon-codex.html  {len(out.encode())/1024:.0f} KB")
