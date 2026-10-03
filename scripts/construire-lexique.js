// Dérive data/lexique-potao.tsv du lexique Grammalecte v7.7 (MPL 2.0).
// Entrée : data/brut/lexique-grammalecte-fr-v7.7.txt, à télécharger depuis
//   https://grammalecte.net/dic/lexique-grammalecte-fr-v7.7.zip  (voir docs/lexiques.md)
// Sortie : une ligne « forme<TAB>codes », codes ∈ n v a r o (nom, verbe, adjectif, adverbe,
// autre), sans doublon, dans l'ordre de préférence fixé AVANT toute mesure :
//   mot grammatical > auxiliaire être/avoir > adverbe > nom > verbe > adjectif > autre.
// Le lexique ne donne pas de fréquence par lecture (seulement par forme) : cet ordre est un
// choix a priori, pas un réglage sur les textes de référence.
// Usage : node scripts/construire-lexique.js
import { createReadStream, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

const entree = new URL('../data/brut/lexique-grammalecte-fr-v7.7.txt', import.meta.url);
const sortie = new URL('../data/lexique-potao.tsv', import.meta.url);

// rang de préférence -> code
function lectures(etiquettes) {
  const t = new Set(etiquettes.split(' '));
  const a = (x) => t.has(x);
  const r = [];
  const adverbe = a('adv') || a('negadv') || a('loc.adv');
  if (adverbe) r.push([2, 'r']);
  if (a('mg') && !adverbe) r.push([0, 'o']);
  if (a('nom')) r.push([3, 'n']);
  if (a('adj')) r.push([5, 'a']);
  const verbe = [...t].find((x) => /^v[0-3]/.test(x));
  if (verbe) r.push([verbe.startsWith('v0') ? 1 : 4, 'v']);
  if (!r.length) r.push([6, 'o']); // noms propres, interjections, nombres, etc.
  return r;
}

const formes = new Map();
let nomsAvecGenre = 0;
const lemmesNoms = new Set();
const lignes = createInterface({ input: createReadStream(entree), crlfDelay: Infinity });
for await (const ligne of lignes) {
  const c = ligne.split('\t');
  if (c.length < 20 || c[0] === 'id') continue;
  const [, , forme, lemme, etiquettes] = c;
  if (/(^| )nom( |$)/.test(etiquettes) && /(^| )(mas|fem|epi)( |$)/.test(etiquettes)) {
    nomsAvecGenre++;
    lemmesNoms.add(lemme);
  }
  let f = formes.get(forme);
  if (!f) formes.set(forme, (f = new Map()));
  for (const [rang, code] of lectures(etiquettes)) {
    if (!f.has(code) || f.get(code) > rang) f.set(code, rang);
  }
}

const corps = [...formes].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([forme, f]) =>
  `${forme}\t${[...f].sort((x, y) => x[1] - y[1]).map(([code]) => code).join('')}`);
const entete = [
  '# This Source Code Form is subject to the terms of the Mozilla Public',
  '# License, v. 2.0. If a copy of the MPL was not distributed with this',
  '# file, You can obtain one at http://mozilla.org/MPL/2.0/.',
  '#',
  '# Dérivé du « Lexique des formes fléchies du français », Grammalecte v7.7 (Olivier R.,',
  '# https://grammalecte.net/). Modifié le 2026-10-03 pour Potao : réduit à forme + catégories.',
];
writeFileSync(sortie, [...entete, ...corps].join('\n') + '\n');
const ambigues = [...formes.values()].filter((f) => f.size > 1).length;
console.log(JSON.stringify({ formes: formes.size, ambigues, lignesNomAvecGenre: nomsAvecGenre, lemmesNomAvecGenre: lemmesNoms.size }));
