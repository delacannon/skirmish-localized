import { useState } from 'react';
import { PatchBody } from './PatchPanel';

/** Right panel, two tabs: translation patch (English / Catalan), about the game; starts collapsed where it would cover the box. */
export function InfoPanel() {
  const [open, setOpen] = useState(() => !matchMedia('(max-width: 1100px)').matches);
  const [tab, setTab] = useState<'patch' | 'info'>('patch');

  if (!open) {
    return (
      <button className="side-open right" onClick={() => setOpen(true)}>
        EN / CA Patch · Info
      </button>
    );
  }

  return (
    <aside className="side-panel right" aria-label="About the game">
      <header className="side-header">
        <div>
          <h2>スカーミッシュ</h2>
          <p>Skirmish · AIL 1994</p>
        </div>
        <button aria-label="Close info panel" title="Close" onClick={() => setOpen(false)}>
          ×
        </button>
      </header>
      <div className="panel-tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'patch'} onClick={() => setTab('patch')}>
          Patch EN / CA
        </button>
        <button role="tab" aria-selected={tab === 'info'} onClick={() => setTab('info')}>
          Info
        </button>
      </div>
      {tab === 'patch' ? (
        <PatchBody />
      ) : (
        <div className="patch-body">
          <p>
            The court summoner of the Kingdom of Noten botches a hero summoning and pulls in two high-school students at
            once: cocky Ryouta and sharp-tongued Natsumi. Only one can become the hero, so they compete, alone or with a
            friend, recruiting companions and fighting the Demon Emperor's armies in turn-based skirmishes. Slapstick, puns
            and parody throughout.
          </p>
          <dl className="patch-applies">
            <dt>Publisher</dt>
            <dd>AIL, 1994</dd>
            <dt>Genre</dt>
            <dd>Comedy fantasy strategy RPG</dd>
            <dt>Platform</dt>
            <dd>NEC PC-9801, hard-disk install</dd>
            <dt>Players</dt>
            <dd>1 or 2</dd>
          </dl>
          <p className="patch-note">Back and spine are placeholders: only the front scan is known.</p>
          <a className="patch-kofi" href="https://ko-fi.com/alammo" target="_blank" rel="noreferrer">
            ♥ Support on Ko-fi
          </a>
        </div>
      )}
    </aside>
  );
}
