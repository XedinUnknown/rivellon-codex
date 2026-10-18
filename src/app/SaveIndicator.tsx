import { tryReconnect } from '../state/storage';
import { setUi, useApp } from '../state/store';
import { DEFAULT_SLOT } from '../storage/slots';

export function SaveIndicator() {
  const backend = useApp((s) => s.backend);
  const canWrite = useApp((s) => s.canWrite);
  const save = useApp((s) => s.save);
  const fileWaiting = useApp((s) => s.fileWaiting);
  const slot = useApp((s) => s.slot);
  const where =
    backend?.kind === 'file' ? ` to ${backend.name}` : backend?.kind === 'browser' ? " in this browser's storage" : '';
  const [cls, txt, tip] = !backend
    ? fileWaiting
      ? ['off', 'Reconnect file', `This page needs permission to use ${fileWaiting} again. Click to reconnect.`]
      : ['off', 'Not syncing', 'Nothing you change here is saved. Click to choose storage.']
    : !canWrite
      ? ['off', 'Read-only', 'You can view the party but not change it.']
      : save.error
        ? [
            'error',
            'Not saved',
            `The last save failed: ${save.error}. Your change is still on screen; edit again to retry.`,
          ]
        : save.busy
          ? [
              'pending',
              'Saving…',
              `Changes save on their own${where} a moment after you stop typing. No save button needed.`,
            ]
          : [
              'ok',
              'All changes saved',
              `Everything you change saves on its own${where}, a moment after you stop typing.${backend.kind === 'claude' ? ' Claude reads the same database.' : ''}`,
            ];
  const sl = !window.claude && slot !== DEFAULT_SLOT ? slot : '';
  return (
    <button
      type="button"
      className={`savestate ${cls}`}
      id="savestate"
      aria-haspopup="dialog"
      title={`${sl ? `Slot “${sl}”. ` : ''}${tip}${backend ? ' Click for storage options.' : ''}`}
      onClick={async () => {
        if (await tryReconnect()) return;
        setUi((u) => {
          u.storageOpen = true;
        });
      }}
    >
      <span className="dot" />
      <span className="stxt" role="status" aria-live="polite">
        {txt}
        {sl ? ` · ${sl}` : ''}
      </span>
    </button>
  );
}
