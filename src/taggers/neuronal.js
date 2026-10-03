// Étiqueteur neuronal : CamemBERT affiné pour l'étiquetage (Xenova/french-camembert-postag-model,
// poids quantifiés ~111 Mo), exécuté localement par Transformers.js (WASM dans le navigateur,
// onnxruntime sous Node). Le texte n'est envoyé nulle part ; seuls la bibliothèque et les poids
// sont téléchargés (CDN jsDelivr et Hugging Face), puis mis en cache par le navigateur.
// ponytail: bibliothèque et poids servis par des tiers ; à héberger soi-même si on retient
// cette approche — la licence du modèle n'est pas déclarée, à clarifier avant.
import { enregistrer } from './index.js';
import { tokenize } from '../tokenize.js';

const MODELE = 'Xenova/french-camembert-postag-model';
const BIBLIOTHEQUE = typeof window === 'undefined'
  ? '@huggingface/transformers'
  : 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0';

// Jeu d'étiquettes du French Treebank -> nos cinq catégories. NPP (nom propre) va dans « autre ».
const CATEGORIE = {
  NC: 'nom',
  V: 'verbe', VIMP: 'verbe', VINF: 'verbe', VPP: 'verbe', VPR: 'verbe', VS: 'verbe',
  ADJ: 'adjectif', ADJWH: 'adjectif',
  ADV: 'adverbe', ADVWH: 'adverbe',
};

let charge;
function charger() {
  charge ??= (async () => {
    const { AutoTokenizer, AutoModelForTokenClassification } = await import(BIBLIOTHEQUE);
    const [tokenizer, modele] = await Promise.all([
      AutoTokenizer.from_pretrained(MODELE),
      AutoModelForTokenClassification.from_pretrained(MODELE, { dtype: 'q8' }),
    ]);
    return { tokenizer, modele };
  })();
  return charge;
}

// Étiquette chaque sous-mot d'une phrase et retrouve sa position dans le texte.
async function etiqueterPhrase({ tokenizer, modele }, phrase, decalage) {
  const entree = await tokenizer(phrase);
  const { logits } = await modele(entree);
  const ids = Array.from(entree.input_ids.data, Number);
  const k = logits.dims[2];
  const pieces = [];
  let position = 0;
  ids.forEach((id, i) => {
    const piece = tokenizer.decode([id], { skip_special_tokens: true }).trim();
    if (!piece) return;
    const debut = phrase.indexOf(piece, position);
    if (debut < 0) return; // sous-mot normalisé introuvable tel quel : on l'ignore
    position = debut + piece.length;
    let meilleur = 0;
    for (let j = 1; j < k; j++) if (logits.data[i * k + j] > logits.data[i * k + meilleur]) meilleur = j;
    pieces.push({ debut: decalage + debut, etiquette: modele.config.id2label[meilleur] });
  });
  return pieces;
}

export async function etiqueterParModele(texte) {
  const outils = await charger();
  // Une phrase à la fois : le modèle accepte 512 sous-mots au plus.
  const pieces = [];
  for (const m of texte.matchAll(/[^.!?…]+[.!?…]*\s*/g)) {
    pieces.push(...await etiqueterPhrase(outils, m[0], m.index));
  }
  let p = 0;
  // Un mot prend l'étiquette de son premier sous-mot.
  return tokenize(texte).map(({ mot, debut, fin }) => {
    while (p < pieces.length && pieces[p].debut < debut) p++;
    const piece = pieces[p];
    const etiquette = piece && piece.debut < fin ? piece.etiquette : undefined;
    return { mot, categorie: CATEGORIE[etiquette] ?? 'autre' };
  });
}

enregistrer('CamemBERT (modèle neuronal local)', etiqueterParModele);
