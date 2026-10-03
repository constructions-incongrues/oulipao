// Page d'essai : coller un texte, voir chaque mot coloré par catégorie, choisir l'étiqueteur.
import { CATEGORIES } from './categories.js';
import { tokenize } from './tokenize.js';
import { lister, etiqueter } from './taggers/index.js';
import './taggers/tous.js'; // enregistre les étiqueteurs disponibles

const $ = (id) => document.getElementById(id);

$('legende').append(...CATEGORIES.flatMap((c) => {
  const s = document.createElement('span');
  s.className = c;
  s.textContent = c;
  return [s, ' '];
}));

for (const nom of lister()) $('etiqueteur').add(new Option(nom, nom));

async function lancer() {
  const texte = $('texte').value;
  const etat = $('etat');
  etat.className = '';
  etat.textContent = 'Étiquetage en cours…';
  try {
    const debut = performance.now();
    const sortie = await etiqueter($('etiqueteur').value, texte);
    const mots = tokenize(texte);
    const fragment = document.createDocumentFragment();
    let fin = 0;
    mots.forEach((m, i) => {
      fragment.append(texte.slice(fin, m.debut));
      const span = document.createElement('span');
      span.className = sortie[i].categorie;
      span.title = sortie[i].categorie;
      span.textContent = m.mot;
      fragment.append(span);
      fin = m.fin;
    });
    fragment.append(texte.slice(fin));
    $('sortie').replaceChildren(fragment);
    etat.textContent = `${mots.length} mots, ${Math.round(performance.now() - debut)} ms`;
  } catch (e) {
    etat.className = 'erreur';
    etat.textContent = e.message;
  }
}

$('lancer').addEventListener('click', lancer);
$('etiqueteur').addEventListener('change', () => { if ($('texte').value) lancer(); });
