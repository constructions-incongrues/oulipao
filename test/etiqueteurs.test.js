import { test } from 'node:test';
import assert from 'node:assert/strict';
import { etiqueter } from '../src/taggers/index.js';
import '../src/taggers/contextuel.js';
import '../src/taggers/lexique.js';
// L'étiqueteur neuronal (111 Mo à charger) n'est pas testé ici : scripts/mesurer.js l'exerce.

const TEXTE = "L'homme qu'il a vu aujourd'hui dit-il vite, là-haut, jusqu'au camion. Y a-t-elle pensé ?";

for (const nom of ['lexique (consultation seule)', 'fr-compromise (règles contextuelles)']) {
  test(`${nom} respecte le contrat du registre sur un texte à élisions et clitiques`, async () => {
    const sortie = await etiqueter(nom, TEXTE); // le registre lève si le contrat est rompu
    assert.equal(sortie.find((s) => s.mot === 'homme').categorie, 'nom');
  });
}

test('lexique : « vite » est un adverbe, un mot inconnu en minuscules un nom', async () => {
  const sortie = await etiqueter('lexique (consultation seule)', 'Le zorglub court vite.');
  assert.deepEqual(sortie.map((s) => s.categorie), ['autre', 'nom', 'verbe', 'adverbe']);
});
