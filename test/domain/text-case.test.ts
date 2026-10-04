import assert from 'node:assert/strict';
import { test } from 'node:test';
import { elidesWith } from '../../src/domain/s7/elision.ts';
import { knownForm } from '../../src/domain/known.ts';
import { apostropheOf, matchCase } from '../../src/domain/text-case.ts';
import { morphology } from '../support/morphology.ts';

test('matchCase : le remplaçant prend la majuscule initiale, et seulement elle', () => {
  assert.equal(matchCase('Horloge', 'fermoir'), 'Fermoir');
  assert.equal(matchCase('horloge', 'fermoir'), 'fermoir');
  assert.equal(matchCase('École', 'éclair'), 'Éclair');
  assert.equal(matchCase('HORLOGE', 'fermoir'), 'Fermoir'); // seule l'initiale suit, pas les capitales
});

test('apostropheOf : la typographique si le texte en a une, sinon la droite', () => {
  assert.equal(apostropheOf('L’horloge s’arrête.'), '’');
  assert.equal(apostropheOf("L'horloge."), "'");
  assert.equal(apostropheOf('Sans apostrophe.'), "'");
});

test('elidesWith : voyelle ou h muet, sauf interdiction de la morphologie ou des verbes', () => {
  const morphology = { blocksElision: (form: string) => form === 'héros' };
  const verbs = { blocksElision: (form: string) => form === 'hait' };
  const withVerbs = elidesWith(morphology, verbs);
  assert.equal(withVerbs('arbre'), true);
  assert.equal(withVerbs('homme'), true);
  assert.equal(withVerbs('héros'), false); // h aspiré, dit par la morphologie
  assert.equal(withVerbs('hait'), false); // h aspiré, dit par les verbes
  assert.equal(withVerbs('chat'), false);
  assert.equal(elidesWith(morphology)('hait'), true); // sans verbes chargés, rien ne l'interdit
});

test('knownForm : noms et adjectifs selon le dictionnaire ; adverbes et mots-outils toujours connus', () => {
  const m = morphology();
  assert.equal(knownForm('Ferme', 'noun', m), true);
  assert.equal(knownForm('zorglubette', 'noun', m), false);
  assert.equal(knownForm('vieille', 'adjective', m), true);
  assert.equal(knownForm('zorglubeux', 'adjective', m), false);
  // un adverbe se place dans l'ordre du dictionnaire sans y figurer : son voisin se cherche quand même
  assert.equal(knownForm('jamais', 'adverb', m), true);
  assert.equal(knownForm('le', 'other', m), true);
});
