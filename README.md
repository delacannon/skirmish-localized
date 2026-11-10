# Skirmish EN / CA

3D box viewer for **Skirmish** (スカーミッシュ, AIL, 1994, PC-98) with the English and Catalan translation patches.

**[Open the site](https://delacannon.github.io/skirmish-localized/)** (18+)

- 3D box: drag to orbit, wheel to zoom, `L` to switch lighting
- Translation patch, English or Catalan: drop your own hard-disk image (`.hdi` / `.nhd`) with the `SK` folder on the page, a patched copy is saved. Nothing is uploaded and your original is not changed
- The patch also creates four new files (`SK/INVI0.TXT` … `INVI3.TXT`)

The patch contains no game data: you need your own copy of the game.

Front cover from a 373×512 scan (Lanczos upscale); back and spine in `public/covers/` are text placeholders.

## Run it

```sh
pnpm install --ignore-workspace
pnpm dev
```

The built site lives on the `gh-pages` branch.

## Rebuild the patch

From the last Kizuato Studio build of `~/kizuato-re/project-skirmish` (both languages), verified against the original disk:

```sh
pnpm patch:export
```
