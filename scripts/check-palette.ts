// Vérifie la palette de DESIGN.md : contrastes WCAG 2.2 (4,5:1) et écart entre pistes en
// daltonisme (ΔE 20, simulations de Machado 2009). Échoue en nommant chaque paire fautive.
// Usage : npm run check:palette [-- chemin/vers/DESIGN.md]
import { readFileSync } from 'node:fs';
import { checkPalette, paletteFromDesign } from '../src/domain/palette.ts';

const path = process.argv[2] ?? new URL('../DESIGN.md', import.meta.url);
const problems = checkPalette(paletteFromDesign(readFileSync(path, 'utf8')));
for (const { theme, message } of problems) console.error(`${theme} : ${message}`);
if (problems.length) {
  console.error(`${problems.length} problème(s) dans la palette.`);
  process.exit(1);
}
console.log('Palette conforme : contrastes ≥ 4,5:1 et pistes distinctes (ΔE ≥ 20) dans toutes les visions.');
