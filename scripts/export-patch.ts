/**
 * Builds public/patch/<lang>/ (manifest.json + one BPS per changed file) from Kizuato Studio's last
 * Skirmish build, then applies it to the original disk image as a check.
 * Files the translation adds (not in the original SK folder) get `create: true` and a BPS from empty.
 *
 * Usage: node scripts/export-patch.ts   (env SKIRMISH_PROJECT, SKIRMISH_HDI to override paths)
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { bpsEncode, crc32, hex32 } from "../../../kizuato-re/engine/src/patch/bps.ts";
import { patchDisk } from "../src/components/patcher.ts";
const PROJ = process.env.SKIRMISH_PROJECT ?? join(homedir(), "kizuato-re/project-skirmish");
const OUT = join(import.meta.dirname, "../public/patch");
const ORIG = process.env.SKIRMISH_HDI ?? join(homedir(), "skirmish-re/orig/Skirmish.hdi");
const META = {
  en: { title: "Skirmish — English translation", credits: ["Skirmish EN", "Original game © 1994 AIL.", "Made with Kizuato Studio"] },
  ca: { title: "Skirmish — traducció al català", credits: ["Skirmish CA", "Joc original © 1994 AIL.", "Fet amb Kizuato Studio"] },
} as const;
const version = "2026.11.08";
for (const lang of ["en", "ca"] as const) {
  const B = join(PROJ, "build", lang), out = join(OUT, lang);
  rmSync(out, { recursive: true, force: true }); mkdirSync(out, { recursive: true });
  const changed: string[] = JSON.parse(readFileSync(join(B, "changed.json"), "utf8"));
  const files = [], pmap = new Map<string, Uint8Array>();
  for (const rel of changed) {
    const srcPath = join(PROJ, "game", rel), create = !existsSync(srcPath);
    const src = create ? new Uint8Array(0) : new Uint8Array(readFileSync(srcPath)), tgt = new Uint8Array(readFileSync(join(B, "game", rel)));
    if (src.length === tgt.length && crc32(src) === crc32(tgt)) { console.log(lang, rel, "unchanged"); continue; }
    const name = `${rel.replace(/\//g, "_")}.bps`, bps = bpsEncode(src, tgt, `Skirmish ${lang} ${rel}`);
    writeFileSync(join(out, name), bps); pmap.set(name, bps);
    files.push({ path: rel, patch: name, ...(create ? { create: true } : {}), source: { size: src.length, crc32: hex32(crc32(src)) }, target: { size: tgt.length, crc32: hex32(crc32(tgt)) } });
  }
  const m = { format: "kizuato-re-patch/1" as const, game: "Skirmish", lang, version, created: new Date().toISOString(), title: META[lang].title,
    requires: "your own copy of Skirmish (AIL 1994, PC-98), hard-disk image (.hdi) with the SK folder", credits: [...META[lang].credits], files };
  writeFileSync(join(out, "manifest.json"), JSON.stringify(m, null, 1));
  // verify against the original disk
  const { disk, results } = patchDisk(m, new Uint8Array(readFileSync(ORIG)), pmap);
  console.log(lang, files.length, "files", disk ? "VERIFY OK" : "VERIFY FAIL", results.filter((r) => r.status !== "patched"));
}
