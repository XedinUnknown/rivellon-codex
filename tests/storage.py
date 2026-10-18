"""Headless test of the local storage options (no window.claude): browser storage, JSON file, export and import.

  python3 tools/build.py && python3 tests/storage.py

The page is served over http so it gets a normal origin. The real file pickers need a person, so they're replaced by
handles into the origin-private file system, which implement the same File System Access interface.
"""
import json, pathlib, tempfile, threading, functools, http.server
from playwright.sync_api import sync_playwright

root = pathlib.Path(__file__).resolve().parent.parent
party = json.load(open(root / 'tests/fixtures/party.json'))
items = json.load(open(root / 'tests/fixtures/items.json'))
tmp = pathlib.Path(tempfile.mkdtemp())
(tmp / 'import.json').write_text(json.dumps({'party': party, 'items': items}))

class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(root / 'dist')))
threading.Thread(target=srv.serve_forever, daemon=True).start()
url = f'http://127.0.0.1:{srv.server_port}/rivellon-codex.html'

PICKERS = """
window.showSaveFilePicker = async () => (await navigator.storage.getDirectory()).getFileHandle('codex.json', {create:true});
window.showOpenFilePicker = async () => [await (await navigator.storage.getDirectory()).getFileHandle('codex.json')];
"""
READ_FILE = "(async()=>{ const h = await (await navigator.storage.getDirectory()).getFileHandle('codex.json'); return (await h.getFile()).text(); })()"
EDIT_FILE = """(async()=>{ const h = await (await navigator.storage.getDirectory()).getFileHandle('codex.json');
  const d = JSON.parse(await (await h.getFile()).text()); d.party.sol.notes = 'from outside';
  const w = await h.createWritable(); await w.write(JSON.stringify(d)); await w.close(); })()"""

failed = 0
def check(name, ok):
    global failed; failed += not ok
    print(('ok    ' if ok else 'FAIL  ') + name)

with sync_playwright() as pw:
    b = pw.chromium.launch(); ctx = b.new_context(accept_downloads=True); ctx.add_init_script(PICKERS)
    pg = ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
    pg.goto(url); pg.wait_for_timeout(500)
    check('starts on browser storage', pg.evaluate('backend.kind') == 'browser' and pg.inner_text('#savestate') == 'All changes saved')
    check('embedded reference tables', pg.inner_text('[data-tab="crafting"] .count') not in ('…', '0'))

    pg.click('[data-tab="party"]'); pg.click('[data-open]'); pg.click('[data-mode="edit"]')
    pg.fill('.member [data-f="level"]', '7'); pg.wait_for_timeout(1200)
    pg.reload(); pg.wait_for_timeout(600)
    check('browser storage survives a reload', pg.evaluate('party[state.who].level') == 7)

    pg.click('#savestate')
    with pg.expect_file_chooser() as fc: pg.click('[data-st="import"]')
    fc.value.set_files(str(tmp / 'import.json')); pg.click('[data-st="import-yes"]'); pg.wait_for_timeout(1200)
    check('import replaces party and items', pg.evaluate('Object.keys(ITEMS).length') == len(items) and pg.evaluate('party.sol.level') == party['sol']['level'])

    with pg.expect_download() as dl: pg.click('[data-st="export"]')
    ex = json.loads(pathlib.Path(dl.value.path()).read_text())
    check('export holds party and items', set(ex) == {'party', 'items'} and set(ex['party']) == set(party) and set(ex['items']) == set(items))

    pg.click('[data-st="new"]'); pg.wait_for_timeout(600)
    check('new file starts with the current data', set(json.loads(pg.evaluate(READ_FILE))['items']) == set(items))
    pg.keyboard.press('Escape'); pg.reload(); pg.wait_for_timeout(800)
    check('file is reopened after a reload', pg.evaluate('backend.kind') == 'file')

    pg.evaluate("party.sol.notes = 'from page'; queueSave('sol', 50)"); pg.wait_for_timeout(800)
    check('edits are written to the file', json.loads(pg.evaluate(READ_FILE))['party']['sol']['notes'] == 'from page')
    pg.wait_for_timeout(1100)   # so the outside write gets a new lastModified
    pg.evaluate(EDIT_FILE); pg.wait_for_timeout(3000)
    check('changes made to the file elsewhere show up', pg.evaluate('party.sol.notes') == 'from outside')

    pg.click('#savestate'); pg.click('[data-st="browser"]'); pg.wait_for_timeout(400)
    check('switching back to browser storage', pg.evaluate('backend.kind') == 'browser' and pg.evaluate('Object.keys(ITEMS).length') == len(items))
    check('no page errors', not errs)
    for e in errs: print('  ', e)
    b.close()
srv.shutdown()
raise SystemExit(1 if failed else 0)
