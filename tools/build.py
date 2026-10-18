"""Build the single-file page: src/template.html + src/app.js + data/nexus.json + data/icons.json -> dist/rivellon-codex.html

Usage (from the repo root):  python3 tools/build.py

The template has three placeholders:
  __JS__     replaced by src/app.js
  __DATA__   replaced by data/nexus.json   (inside <script id="data" type="application/json">)
  __ICONS__  replaced by data/icons.json   (inside <script id="icons" type="application/json">)
"</" is escaped in the JSON so it can't close the surrounding <script> tag.
The reference tables in data/ref/ are NOT embedded: the page loads them from the database (collection "ref").
"""
import pathlib

root = pathlib.Path(__file__).resolve().parent.parent
t = (root / 'src/template.html').read_text(encoding='utf-8')
j = (root / 'src/app.js').read_text(encoding='utf-8')
d = (root / 'data/nexus.json').read_text(encoding='utf-8').replace('</', '<\\/')
i = (root / 'data/icons.json').read_text(encoding='utf-8').replace('</', '<\\/')
out = t.replace('__JS__', j).replace('__DATA__', d).replace('__ICONS__', i)
(root / 'dist').mkdir(exist_ok=True)
(root / 'dist/rivellon-codex.html').write_text(out, encoding='utf-8')
print(f"dist/rivellon-codex.html  {len(out.encode())/1024:.0f} KB")
