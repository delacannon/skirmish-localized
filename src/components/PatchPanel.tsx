import { useRef, useState, type DragEvent } from 'react';
import { patchDisk, type PatchManifest, type PatchResult } from './patcher';

const VERSION = '2026.11.08';
type Lang = 'en' | 'ca';

/** Every UI string of the panel, in the language of the patch picked. */
const TEXT = {
  en: {
    label: 'English',
    intro: 'Play Skirmish in English.',
    own: 'You need your own copy of the game, installed on a hard disk.',
    patch: 'Patch',
    version: 'Version',
    appliesTo: 'Applies to',
    needs: 'Needs',
    needsInstall: 'Unmodified install in an SK folder',
    tested: 'Tested',
    testedHow: 'On emulator only',
    drop: 'Drop disk image here',
    dropHint: '.hdi / .nhd, or click to choose',
    patching: (n: string) => `Patching ${n}…`,
    wait: 'Please wait',
    local: 'Stays on your computer: nothing is uploaded. Your original image is not changed.',
    patched: 'Patched',
    saved: 'saved to your downloads.',
    already: 'Already patched',
    mount: 'Mount this image as it is.',
    notImage: (n: string) => `${n} is not a .hdi or .nhd hard-disk image.`,
    notOriginal: 'Nothing was written: this is not the original disk (an image already patched to the other language does not work: start from the original).',
    statusPatched: 'patched',
    statusAlready: 'already patched',
    thenMount: 'Then mount it',
    np21: 'HardDisk → IDE #0 → Open…, then Emulate → Reset',
    t98: 'mount as first hard disk (.nhd), then reset',
    note: 'The patch adds four new files (INVI0–3.TXT) to the SK folder. Start a new game. The title logo stays in Japanese.',
    kofi: '♥ Support on Ko-fi',
  },
  ca: {
    label: 'Català',
    intro: 'Juga a Skirmish en català.',
    own: 'Cal la teva pròpia còpia del joc, instal·lada en un disc dur.',
    patch: 'Pedaç',
    version: 'Versió',
    appliesTo: 'Per a',
    needs: 'Cal',
    needsInstall: 'Instal·lació sense modificar a la carpeta SK',
    tested: 'Provat',
    testedHow: 'Només en emulador',
    drop: 'Deixa aquí la imatge de disc',
    dropHint: '.hdi / .nhd, o fes clic per triar-la',
    patching: (n: string) => `Aplicant el pedaç a ${n}…`,
    wait: 'Espera un moment',
    local: 'Tot passa al teu ordinador: no es puja res. La imatge original no es modifica.',
    patched: 'Fet',
    saved: 's’ha desat a les baixades.',
    already: 'Ja té el pedaç',
    mount: 'Munta aquesta imatge tal com és.',
    notImage: (n: string) => `${n} no és una imatge de disc dur .hdi o .nhd.`,
    notOriginal: 'No s’ha escrit res: aquest no és el disc original (una imatge ja traduïda a l’altra llengua no serveix: comença des de l’original).',
    statusPatched: 'aplicat',
    statusAlready: 'ja aplicat',
    thenMount: 'Després, munta-la',
    np21: 'HardDisk → IDE #0 → Open…, i després Emulate → Reset',
    t98: 'munta-la com a primer disc dur (.nhd) i reinicia',
    note: 'El pedaç afegeix quatre fitxers nous (INVI0–3.TXT) a la carpeta SK. Comença una partida nova. El logotip del títol queda en japonès.',
    kofi: '♥ Dona suport a Ko-fi',
  },
} as const;

const LANGS: Lang[] = ['en', 'ca'];
const baseOf = (lang: Lang) => `${import.meta.env.BASE_URL}patch/${lang}/`;
const IMAGE = /\.(hdi|nhd)$/i;

type Status =
  | { kind: 'idle' }
  | { kind: 'working'; name: string }
  | { kind: 'done'; name: string; results: PatchResult[] }
  | { kind: 'already'; results: PatchResult[] }
  | { kind: 'failed'; message: string; results: PatchResult[] };

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`cannot load ${url}`);
  return new Uint8Array(await res.arrayBuffer());
}

function save(data: Uint8Array, name: string): void {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([data as BlobPart]));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 60000);
}

async function run(file: File, lang: Lang): Promise<Status> {
  const base = baseOf(lang);
  const manifest = (await (await fetch(`${base}manifest.json`)).json()) as PatchManifest;
  const entries = await Promise.all(
    manifest.files.map(async (f) => [f.patch, await fetchBytes(`${base}${f.patch}`)] as const),
  );
  const { disk, results } = patchDisk(manifest, new Uint8Array(await file.arrayBuffer()), new Map(entries));
  if (!disk) return { kind: 'failed', message: TEXT[lang].notOriginal, results };
  if (results.every((r) => r.status === 'already')) return { kind: 'already', results };
  const name = file.name.replace(/(\.[^.]+)$/, `-${manifest.lang}$1`);
  save(disk, name);
  return { kind: 'done', name, results };
}

function ResultList({ results, lang }: { results: PatchResult[]; lang: Lang }) {
  const t = TEXT[lang];
  return (
    <ul className="patch-results">
      {results.map(({ path, status, error }) => (
        <li key={path} className={status}>
          {path.split('/').pop()}
          <span>{status === 'error' ? error : status === 'already' ? t.statusAlready : t.statusPatched}</span>
        </li>
      ))}
    </ul>
  );
}

/** The translation patch (English or Catalan): one tab of the right panel. */
export function PatchBody() {
  const [lang, setLang] = useState<Lang>(() => (navigator.language.startsWith('ca') ? 'ca' : 'en'));
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const t = TEXT[lang];

  const patch = async (file: File | undefined) => {
    if (!file) return;
    if (!IMAGE.test(file.name)) {
      setStatus({ kind: 'failed', message: t.notImage(file.name), results: [] });
      return;
    }
    setStatus({ kind: 'working', name: file.name });
    await new Promise((resolve) => setTimeout(resolve, 20)); // let "Patching…" paint
    try {
      setStatus(await run(file, lang));
    } catch (e) {
      setStatus({ kind: 'failed', message: (e as Error).message, results: [] });
    }
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    void patch(e.dataTransfer.files[0]);
  };

  const working = status.kind === 'working';
  return (
    <div className="patch-body" lang={lang}>
      <div className="patch-langs" role="radiogroup" aria-label="Language">
        {LANGS.map((id) => (
          <button
            key={id}
            role="radio"
            aria-checked={lang === id}
            disabled={working}
            onClick={() => {
              setLang(id);
              setStatus({ kind: 'idle' });
            }}
          >
            {TEXT[id].label}
          </button>
        ))}
      </div>
      <p>
        {t.intro} {t.own}
      </p>
      <dl className="patch-applies">
        <dt>{t.patch}</dt>
        <dd>
          {t.version} {VERSION}
        </dd>
        <dt>{t.appliesTo}</dt>
        <dd>
          Skirmish (スカーミッシュ)
          <br />
          AIL, 1994, PC-98
        </dd>
        <dt>{t.needs}</dt>
        <dd>
          {t.needsInstall}
          <br />
          RPG.EXE: 198,998 bytes, CRC32 556FACC2
        </dd>
        <dt>{t.tested}</dt>
        <dd>{t.testedHow}</dd>
      </dl>
      <button
        className={over ? 'patch-drop over' : 'patch-drop'}
        disabled={working}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
      >
        {working ? t.patching(status.name) : t.drop}
        <small>{working ? t.wait : t.dropHint}</small>
      </button>
      <input
        ref={input}
        type="file"
        accept=".hdi,.nhd"
        hidden
        onChange={(e) => {
          void patch(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
      <p className="patch-note">{t.local}</p>

      {status.kind === 'done' && (
        <div className="patch-status done" role="status">
          <b>{t.patched}</b> {status.name} {t.saved}
          <ResultList results={status.results} lang={lang} />
        </div>
      )}
      {status.kind === 'already' && (
        <div className="patch-status" role="status">
          <b>{t.already}</b> {t.mount}
          <ResultList results={status.results} lang={lang} />
        </div>
      )}
      {status.kind === 'failed' && (
        <div className="patch-status failed" role="alert">
          {status.message}
          <ResultList results={status.results} lang={lang} />
        </div>
      )}

      <h3>{t.thenMount}</h3>
      <ul>
        <li>
          <b>np21w:</b> {t.np21}
        </li>
        <li>
          <b>T98-Next:</b> {t.t98}
        </li>
      </ul>

      <p className="patch-note">{t.note}</p>

      <a className="patch-kofi" href="https://ko-fi.com/alammo" target="_blank" rel="noreferrer">
        {t.kofi}
      </a>
    </div>
  );
}
