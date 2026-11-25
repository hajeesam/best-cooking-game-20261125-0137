// Broth & Blade — the entry program (Node 22, standard library only).
// The game is the static files under game/ and the four screenshots
// under screenshots/; this program hands them in. It copies both
// folders beside this file to /output and writes /output/dossier.json
// with the kit's make.fun library, which the scorer runs again on
// the same bytes. Nothing here is random or time-dependent, so two
// runs write the same bytes.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for
// /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Copy a folder beside this file into /output when it exists. */
function handIn(name) {
  const from = join(here, name);
  if (existsSync(from)) cpSync(from, join(out, name), { recursive: true });
}

mkdirSync(out, { recursive: true });
handIn('game');
handIn('screenshots');

// The scorer's own caps (reference/gate.json): only text_max_bytes
// shapes the bytes; the others refuse an entry the scorer would
// refuse (more than 4 screenshots or one over 256 KiB; more than
// 993 files in game/ or 48 MiB of game files, in all, or a path
// under game/ over 1000 bytes).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
