// Mesure chaque étiqueteur du registre sur les textes de référence.
// Usage : node scripts/mesurer.js [--erreurs]
import { readdirSync, readFileSync } from 'node:fs';
import { lister, etiqueter } from '../src/taggers/index.js';
import { predicatAmbigu } from '../src/taggers/lexique.js';
import { comparer } from '../src/compare.js';
import '../src/taggers/tous.js';

const dossier = new URL('../reference/', import.meta.url);
const references = readdirSync(dossier).filter((f) => f.endsWith('.json')).sort()
  .map((f) => [f, JSON.parse(readFileSync(new URL(f, dossier), 'utf8'))]);
const estAmbigu = await predicatAmbigu();
const pc = (a, b) => `${a}/${b} (${(100 * a / b).toFixed(1)} %)`;

for (const nom of lister()) {
  console.log(`\n## ${nom}`);
  for (const [fichier, ref] of references) {
    const r = comparer(await etiqueter(nom, ref.texte), ref, { estAmbigu });
    console.log(`${fichier} : tous les mots ${pc(r.corrects, r.total)} ; mots de contenu ${pc(r.contenu.corrects, r.contenu.total)} ; formes ambiguës ${r.ambigus}`);
    if (process.argv.includes('--erreurs')) {
      console.log('  ' + r.erreurs.map((e) => `${e.mot} [${e.attendu}→${e.obtenu}]`).join(', '));
    }
  }
}
