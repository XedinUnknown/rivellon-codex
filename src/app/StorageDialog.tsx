// Where party and items are saved: claude.ai database, browser storage (per slot) or a JSON file; export/import.
import { type ReactNode, useEffect, useRef, useState } from 'react';
import type { Items } from '../domain/types';
import {
  browserStorageAvailable,
  createSlot,
  deleteSlot,
  exportData,
  fileStorageAvailable,
  inClaude,
  newFile,
  normalizeParty,
  openFile,
  pickSlot,
  reconnectFile,
  switchToBrowserStorage,
} from '../state/storage';
import { importData, setUi, sync, useApp } from '../state/store';
import { parseData } from '../storage/localDb';
import { DEFAULT_SLOT, slotList } from '../storage/slots';
import type { DataFile } from '../storage/types';
import { X } from '../ui/lucide';

function Row({
  title,
  current,
  desc,
  children,
}: {
  title: string;
  current?: boolean;
  desc: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className={`srow${current ? ' cur' : ''}`}>
      <div style={{ flex: 1, minWidth: 220 }}>
        <b>{title}</b>
        {current && <span className="tag"> in use</span>}
        <div className="note">{desc}</div>
      </div>
      <div className="sact">{children}</div>
    </div>
  );
}

export function StorageDialog() {
  const open = useApp((s) => s.ui.storageOpen);
  const backend = useApp((s) => s.backend);
  const canWrite = useApp((s) => s.canWrite);
  const fileWaiting = useApp((s) => s.fileWaiting);
  const slot = useApp((s) => s.slot);
  const busy = useApp((s) => s.save.busy);
  const itemCount = useApp((s) => Object.keys(s.items).length);
  const [msg, setMsg] = useState('');
  const [importing, setImporting] = useState<{ name: string; data: DataFile } | null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [slotName, setSlotName] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    setMsg('');
    setImporting(null);
    setConfirmDel(false);
    box.current?.querySelector<HTMLElement>('select, button.btn')?.focus();
  }, [open]);
  if (!open) return null;
  const close = () => {
    setUi((u) => {
      u.storageOpen = false;
    });
    document.getElementById('savestate')?.focus();
  };
  const k = backend?.kind;
  /** Run a storage action; switching is refused while a save is pending. */
  const run = async (fn: () => Promise<string>, switching = true) => {
    if (switching && sync.busy()) return setMsg('Still saving; try again in a moment.');
    try {
      const m = await fn();
      if (m) setMsg(m);
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return; // picker cancelled
      setMsg(`That didn't work: ${(e as Error)?.message ?? e}`);
    }
  };
  const doExport = () => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(
      new Blob([`${JSON.stringify(exportData(), null, 2)}\n`], { type: 'application/json' }),
    );
    a.download = `rivellon-codex-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled on the dialog
    // biome-ignore lint/a11y/noStaticElementInteractions: clicking the backdrop closes the dialog
    <div className="popwrap" onClick={(e) => e.target === e.currentTarget && close()}>
      <div
        className="pop"
        role="dialog"
        aria-modal="true"
        aria-labelledby="st-h"
        ref={box}
        onKeyDown={(e) => e.key === 'Escape' && close()}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <h3 id="st-h" style={{ flex: 1 }}>
            Storage
          </h3>
          <button type="button" className="x" aria-label="Close" onClick={close}>
            <X />
          </button>
        </div>
        <p className="note">Where your party and items are saved. Reference data is built into the page.</p>
        {inClaude() ? (
          <Row
            title="claude.ai database"
            current={k === 'claude'}
            desc="Kept with this artifact on claude.ai. Every view of the artifact, and Claude, sees the same party and items."
          />
        ) : (
          <>
            <Row
              title="Slot"
              desc="Each slot is a separate save with its own storage choice, as if the page were opened from a different address."
            >
              <select
                aria-label="Slot"
                value={slot}
                onChange={(e) => {
                  setConfirmDel(false);
                  void run(() => pickSlot(e.target.value));
                }}
              >
                {slotList().map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="New slot name"
                aria-label="New slot name"
                maxLength={40}
                style={{ width: '11em' }}
                value={slotName}
                onChange={(e) => setSlotName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== 'Enter') return;
                  e.preventDefault();
                  void run(async () => {
                    const m = await createSlot(slotName);
                    if (m.startsWith('Created')) setSlotName('');
                    return m;
                  });
                }}
              />
              <button
                type="button"
                className="btn"
                onClick={() =>
                  void run(async () => {
                    const m = await createSlot(slotName);
                    if (m.startsWith('Created')) setSlotName('');
                    return m;
                  })
                }
              >
                Create
              </button>
              {slot !== DEFAULT_SLOT && (
                <button
                  type="button"
                  className="btn"
                  title="Deletes this slot's browser storage and forgets its file (the file itself stays)"
                  onClick={() => {
                    if (!confirmDel) return setConfirmDel(true);
                    setConfirmDel(false);
                    void run(deleteSlot);
                  }}
                >
                  {confirmDel ? `Really delete “${slot}”?` : 'Delete slot'}
                </button>
              )}
            </Row>
            <Row
              title="Browser storage"
              current={k === 'browser'}
              desc={
                browserStorageAvailable()
                  ? 'Kept by this browser on this device. Other browsers, and this page opened from a different address, have their own separate copy.'
                  : 'Not available in this browser.'
              }
            >
              {browserStorageAvailable() && k !== 'browser' && (
                <button type="button" className="btn" onClick={() => void run(switchToBrowserStorage)}>
                  Use
                </button>
              )}
            </Row>
            <Row
              title="JSON file"
              current={k === 'file'}
              desc={
                !fileStorageAvailable() ? (
                  "Needs Chrome or Edge: this browser can't keep a file open for saving. Use Export and Import to move data instead."
                ) : k === 'file' ? (
                  <>
                    <span style={{ display: 'block' }}>
                      Saving to <b>{backend?.name}</b>
                    </span>
                    Changes made to the file outside this page show up here within a few seconds.
                  </>
                ) : (
                  'Saves to a file you choose, which you can back up, sync or open on another computer. On Windows the file must be on a Windows drive: Chrome refuses \\\\wsl.localhost paths.'
                )
              }
            >
              {fileStorageAvailable() && (
                <>
                  {fileWaiting && (
                    <button type="button" className="btn" onClick={() => void run(reconnectFile)}>
                      Reconnect {fileWaiting}
                    </button>
                  )}
                  <button type="button" className="btn" onClick={() => void run(openFile)}>
                    Open file…
                  </button>
                  <button
                    type="button"
                    className="btn"
                    title="Create a file holding the party and items shown now"
                    onClick={() => void run(newFile)}
                  >
                    New file…
                  </button>
                </>
              )}
            </Row>
          </>
        )}
        <Row
          title="Export and import"
          desc="Export downloads the party and items as a JSON file. Import replaces the party and items in the storage in use with a file's contents — use both to move data between storage options."
        >
          <button type="button" className="btn" onClick={doExport}>
            Export
          </button>
          {backend && canWrite && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (fileInput.current) {
                  fileInput.current.value = '';
                  fileInput.current.click();
                }
              }}
            >
              Import…
            </button>
          )}
        </Row>
        <input
          ref={fileInput}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try {
              setImporting({ name: f.name, data: parseData(await f.text()) });
              setMsg('');
            } catch (err) {
              setImporting(null);
              setMsg(`Could not import ${f.name}: ${(err as Error).message}`);
            }
          }}
        />
        {importing && (
          <Row
            title={`Replace with ${importing.name}?`}
            current
            desc={`The party and all ${itemCount} items shown now are replaced by the file's party and ${Object.keys(importing.data.items).length} items. Export first to keep a copy.`}
          >
            <button
              type="button"
              className="btn"
              data-import="yes"
              onClick={() => {
                importData(normalizeParty(importing.data.party), importing.data.items as Items);
                setImporting(null);
                setMsg('Imported. Saving…');
              }}
            >
              Replace
            </button>
            <button type="button" className="btn" onClick={() => setImporting(null)}>
              Cancel
            </button>
          </Row>
        )}
        {busy && <p className="note">Saving… switch storage once it finishes.</p>}
        {msg && (
          <p className="note" role="status">
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
