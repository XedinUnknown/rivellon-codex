"""Headless smoke test with a mocked window.claude runtime (Playwright + Chromium).

  pip install playwright && playwright install chromium     (or point CHROMIUM at an existing binary)
  python3 tools/build.py && python3 tests/harness.py

The mock implements the subset of the artifact runtime the page uses:
  window.claude.use('db')   -> { collection(c).onSnapshot(cb), doc('c/id').set/update/delete }
  window.claude.use('user') -> { can('data.write') -> true }
Stores: party (tests/fixtures/party.json), items (tests/fixtures/items.json), ref (data/ref/*.json).
Writes are recorded in window.__writes and applied to window.__store, and snapshots are re-fired.
"""
import json, glob, os, pathlib
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
ref = {pathlib.Path(f).stem: json.load(open(f)) for f in glob.glob(str(root / 'data/ref/*.json'))}
party = json.load(open(root / 'tests/fixtures/party.json'))
items = json.load(open(root / 'tests/fixtures/items.json'))

MOCK = """
window.__writes=[];
const store={party:%s, ref:%s, items:%s};
const subs={party:[],ref:[],items:[]};
const snapOf=c=>({docs:Object.entries(store[c]).map(([id,b])=>({id,exists:true,data:()=>JSON.parse(JSON.stringify(b))}))});
const fire=c=>setTimeout(()=>subs[c].forEach(cb=>cb(snapOf(c))),30);
window.claude={use:async(n)=> n==='db' ? {
  collection:(c)=>({onSnapshot:(cb)=>{subs[c].push(cb); setTimeout(()=>cb(snapOf(c)),50); return ()=>{};}}),
  doc:(p)=>({
    set:async(b)=>{const [c,id]=p.split('/'); store[c][id]=b; window.__writes.push(['set',p]); fire(c);},
    update:async(b)=>{const [c,id]=p.split('/'); const d=store[c][id]; if(!d) throw {code:'invalid_argument'};
      for(const [k,v] of Object.entries(b)){ if(v&&typeof v==='object'&&!Array.isArray(v)&&d[k]&&typeof d[k]==='object') Object.assign(d[k],v); else d[k]=v; }
      window.__writes.push(['update',p,JSON.stringify(b)]); fire(c);},
    delete:async()=>{const [c,id]=p.split('/'); delete store[c][id]; window.__writes.push(['delete',p]); fire(c);}})
} : {can:async()=>true}};
window.__store=store;
""" % (json.dumps(party), json.dumps(ref), json.dumps(items))

with sync_playwright() as pw:
    kw = {'executable_path': os.environ['CHROMIUM']} if os.environ.get('CHROMIUM') else {}
    b = pw.chromium.launch(**kw)
    pg = b.new_page(viewport={'width': 1280, 'height': 1000})
    errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.add_init_script(MOCK)
    pg.goto((root / 'dist/rivellon-codex.html').as_uri()); pg.wait_for_timeout(800)
    for tab in ['party', 'items', 'skills', 'status', 'summons', 'special', 'crafting', 'gear', 'reference']:
        pg.click(f'[data-tab="{tab}"]'); pg.wait_for_timeout(150)
        pg.screenshot(path=str(root / f'tests/out-{tab}.png'))
    # open first character, swap the main hand through the picker
    pg.click('[data-tab="party"]'); pg.click('[data-open]'); pg.wait_for_timeout(150)
    pg.click('.tile[data-pick="main"]'); pg.wait_for_timeout(150)
    print('picker open:', pg.locator('.picker').count() == 1)
    print('save state:', pg.inner_text('#savestate'))
    print('page errors:', errs or 'none')
    b.close()
