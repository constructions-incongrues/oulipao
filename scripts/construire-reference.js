// Construit reference/texte-N.json à partir de reference/texte-N.annote.txt.
// Format annoté : chaque mot est suivi de {n|v|a|r|o} (nom, verbe, adjectif, adverbe, autre) ;
// les lignes « # clé: valeur » en tête donnent titre et source. C'est ce fichier qu'on relit
// et corrige à la main ; le JSON est dérivé.  Usage : node scripts/construire-reference.js
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tokenize } from '../src/tokenize.js';

const CODES = { n: 'nom', v: 'verbe', a: 'adjectif', r: 'adverbe', o: 'autre' };
const dossier = new URL('../reference/', import.meta.url);

for (const fichier of readdirSync(dossier).filter((f) => f.endsWith('.annote.txt')).sort()) {
  const lignes = readFileSync(new URL(fichier, dossier), 'utf8').split('\n');
  const meta = {};
  while (lignes[0]?.startsWith('#')) {
    const [, cle, valeur] = lignes.shift().match(/^#\s*(\w+):\s*(.*)$/);
    meta[cle] = valeur;
  }
  const annote = lignes.join('\n').trim();
  const codes = [...annote.matchAll(/\{([nvaro])\}/g)].map((m) => m[1]);
  const texte = annote.replace(/\{[nvaro]\}/g, '');
  if (/[{}]/.test(texte)) throw new Error(`${fichier} : accolade ou code inconnu restant`);
  const mots = tokenize(texte);
  if (mots.length !== codes.length) {
    throw new Error(`${fichier} : ${mots.length} mots mais ${codes.length} annotations`);
  }
  // Chaque annotation doit suivre immédiatement son mot : on revérifie en réannotant.
  let reconstruit = '';
  let fin = 0;
  mots.forEach((m, i) => {
    reconstruit += texte.slice(fin, m.fin) + `{${codes[i]}}`;
    fin = m.fin;
  });
  reconstruit += texte.slice(fin);
  if (reconstruit !== annote) throw new Error(`${fichier} : une annotation n'est pas collée à son mot`);
  const json = {
    titre: meta.titre,
    source: meta.source,
    annotateur: meta.annotateur ?? 'assistant IA (Claude), 2026-10-03, avant tout essai d\'étiqueteur — à relire par le fondateur',
    texte,
    mots: mots.map((m, i) => ({ mot: m.mot, categorie: CODES[codes[i]] })),
  };
  const sortie = fichier.replace('.annote.txt', '.json');
  writeFileSync(new URL(sortie, dossier), JSON.stringify(json, null, 2) + '\n');
  const compte = Object.fromEntries(Object.values(CODES).map((c) => [c, json.mots.filter((m) => m.categorie === c).length]));
  console.log(sortie, mots.length, 'mots', JSON.stringify(compte));
}
