// Aurora Vault Heist — the entry builder. Copies game/ and screenshots/
// beside this file into the output directory and writes dossier.json for
// it, using the kit's buildDossier. Node standard library only, no network.
//
//   MAKEFUN_OUTPUT_DIR=out1 node main.ts
//
// The output directory itself is never removed (the grader may bind-mount
// it); only its previous contents are cleared before the fresh copy.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Clear what the output directory holds, leaving the directory itself.
mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(join(outDir, entry), { recursive: true, force: true });
}

// The entry: the playable game and its screenshots.
cpSync(join(here, 'game'), join(outDir, 'game'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// The dossier, exactly as the kit's builder writes it.
const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log('wrote ' + outDir + ' (dossier ' + dossier.length + ' bytes)');
