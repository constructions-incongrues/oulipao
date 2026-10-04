import assert from 'node:assert/strict';
import { test } from 'node:test';
import { applyS7 } from '../../../src/domain/s7/engine.ts';
import { dieRoll, s7Plugin } from '../../../src/domain/s7/plugin.ts';
import { AUXILIARY, LOADING } from '../../../src/domain/verb.ts';
import { morphology, tag, verbs } from '../../support/morphology.ts';

const m = morphology();

test('déclaration : sur la piste des noms, Décalage borné à ±99, Parmi, Tirage et Graine ; S+7 réaccordé et fixe à l’ouverture', () => {
  assert.deepEqual(s7Plugin.tracks, ['noun', 'adjective', 'verb']);
  assert.deepEqual(s7Plugin.defaultTargets, ['noun']);
  assert.deepEqual(s7Plugin.parameters.map((p) => p.label), ['Décalage', 'Parmi', 'Tirage', 'Graine']);
  assert.deepEqual(s7Plugin.defaults, { offset: 7, mode: 'reagree', draw: 'fixed', seed: 1 });
  assert.deepEqual(s7Plugin.parse({ offset: -99 }), { offset: -99, mode: 'reagree', draw: 'fixed', seed: 1 });
  assert.throws(() => s7Plugin.parse({ seed: 0 }));
  assert.throws(() => s7Plugin.parse({ draw: 'pile ou face' }));
  assert.throws(() => s7Plugin.parse({ offset: 100 }));
  assert.throws(() => s7Plugin.parse({ offset: 1.5 }));
  assert.throws(() => s7Plugin.parse({ mode: 'au hasard' }));
});

test('titre, libellé, aide et neutralité selon le réglage', () => {
  assert.equal(s7Plugin.title({ offset: -3 }), 'S−3');
  assert.equal(s7Plugin.label({ offset: 7, mode: 'same-gender' }), 'S+7, parmi les noms du même genre');
  assert.equal(s7Plugin.help({ offset: 7 }), 'Chaque nom devient le 7e nom qui le suit dans le dictionnaire ; la phrase est réaccordée.');
  assert.equal(s7Plugin.help({ offset: -1, mode: 'same-gender' }), 'Chaque nom devient le 1er nom de même genre qui le précède dans le dictionnaire.');
  assert.equal(s7Plugin.help({ offset: 0 }), 'S+0 : aucun changement.');
  // sur les adjectifs, seuls ou avec les noms
  assert.equal(s7Plugin.help({ offset: 3 }, new Set(['adjective'])), 'Chaque adjectif devient le 3e adjectif qui le suit dans le dictionnaire, au même genre et au même nombre.');
  assert.match(s7Plugin.help({ offset: 3 }, new Set(['noun', 'adjective'])), /réaccordée\. Chaque adjectif devient le 3e adjectif/);
  assert.equal(s7Plugin.acts({ offset: 0 }), false);
  assert.equal(s7Plugin.acts({ offset: 2 }), true);
});

test('apply : la sortie du moteur, et ce qu’il a fait de chaque nom', () => {
  const text = 'La vieille ferme et la Zorglub.';
  const tagged = tag(text, { Zorglub: 'noun' });
  const result = s7Plugin.apply(text, tagged, { offset: 1, mode: 'reagree' }, { morphology: m }, new Set(['noun']));
  const engine = applyS7(text, tagged, { offset: 1, mode: 'reagree' }, m);
  assert.deepEqual(result.words, engine.words);
  assert.equal(result.tail, engine.tail);
  assert.deepEqual(result.marks, [
    { index: 2, original: 'ferme', replacement: 'fermoir' },
    { index: 5, original: 'Zorglub', reason: 'absent du dictionnaire' },
  ]);
  const odd = s7Plugin.apply('La ferme.', tag('La ferme.'), { offset: 99, mode: 'same-gender' }, { morphology: m }, new Set(['noun']));
  assert.ok(odd.marks.every((mark) => mark.replacement !== undefined || mark.reason === 'aucun nom au bon genre et au bon nombre'));
});

test('portée par mot : un nom au pas bouché garde son groupe, un nom verrouillé prend son décalage', () => {
  const text = 'Le chat et la vieille horloge.';
  const tagged = tag(text);
  const run = (values: object, scope?: { skip: number[]; overrides: { index: number; values: object }[] }) =>
    s7Plugin.apply(text, tagged, values as never, { morphology: m }, new Set(['noun', 'adjective']), scope as never);
  const outputs = (result: ReturnType<typeof run>) => result.words.map((w) => w.output);
  const s1 = outputs(run({ offset: 1 }));
  const s2 = outputs(run({ offset: 2 }));
  // « horloge » (5) bouché : « la vieille horloge » reste ; « chat » suit le S+1.
  const closed = run({ offset: 1 }, { skip: [4, 5], overrides: [] });
  assert.deepEqual(outputs(closed).slice(3), ['la', 'vieille', 'horloge']);
  assert.equal(outputs(closed)[1], s1[1]);
  assert.deepEqual(closed.marks.find((mark) => mark.index === 5), { index: 5, original: 'horloge', reason: 'pas bouché' });
  // « chat » (1) verrouillé à 2 : lui seul passe en S+2.
  const locked = outputs(run({ offset: 1 }, { skip: [], overrides: [{ index: 1, values: { offset: 2 } }] }));
  assert.equal(locked[1], s2[1]);
  assert.notEqual(locked[1], s1[1]);
  assert.equal(locked[5], s1[5]);
  // Un verrou hors bornes est refusé comme un réglage.
  assert.throws(() => run({ offset: 1 }, { skip: [], overrides: [{ index: 1, values: { offset: 120 } }] }));
});

test('portée par mot : un adjectif au pas bouché reste tel quel', () => {
  const text = 'Un petit chat.';
  const tagged = tag(text);
  const apply = (skip: number[]) => s7Plugin.apply(text, tagged, { offset: 1 }, { morphology: m }, new Set(['adjective']), { skip, overrides: [] });
  assert.notEqual(apply([]).words[1]!.output, 'petit');
  assert.equal(apply([1]).words[1]!.output, 'petit');
  // et l'inspecteur dit pourquoi, comme pour un nom ou un verbe bouché
  assert.deepEqual(apply([1]).marks.find((mark) => mark.index === 1), { index: 1, original: 'petit', reason: 'pas bouché' });
});

test('S+7 sur les verbes : au même temps et à la même personne, le pronom suit', () => {
  const text = 'nous aimions et je chante, il est.';
  const tagged = tag(text, { aimions: 'verb', chante: 'verb' });
  const apply = (resources: { verbs?: ReturnType<typeof verbs> }, scope = { skip: [] as number[], overrides: [] as { index: number; values: { offset: number } }[] }) => {
    const result = s7Plugin.apply(text, tagged, { offset: 1 }, { morphology: m, ...resources }, new Set(['verb']), scope);
    return { ...result, text: result.words.map((w) => w.gap + w.output).join('') + result.tail };
  };
  const shifted = apply({ verbs: verbs() });
  assert.equal(shifted.text, 'nous chantions et je dors, il est.');
  assert.deepEqual(shifted.marks, [
    { index: 1, original: 'aimions', replacement: 'chantions' },
    { index: 4, original: 'chante', replacement: 'dors' },
    { index: 6, original: 'est', reason: AUXILIARY },
  ]);
  // Verrou à S−2 sur « chante », pas bouché sur « aimions ».
  const scoped = apply({ verbs: verbs() }, { skip: [1], overrides: [{ index: 4, values: { offset: -2 } }] });
  assert.equal(scoped.text, "nous aimions et j'adore, il est.");
  assert.deepEqual(scoped.marks[0], { index: 1, original: 'aimions', reason: 'pas bouché' });
  // Pas encore de verbes : chaque verbe attend.
  assert.deepEqual(apply({}).marks.map((mark) => mark.reason), [LOADING, LOADING, LOADING]);
  assert.match(s7Plugin.help({ offset: 7 }, new Set(['verb'])), /^Chaque verbe devient le 7e verbe/);
  assert.match(s7Plugin.help({ offset: 7 }, new Set(['noun', 'verb'])), /réaccordée\. Chaque verbe/);
});

test('le dé : une face de 1 à 6, la même pour la même graine et la même position, à peu près équitable', () => {
  const faces = Array.from({ length: 600 }, (_, index) => dieRoll(2461318, index));
  const counts = [1, 2, 3, 4, 5, 6].map((face) => faces.filter((f) => f === face).length);
  assert.ok(counts.every((n) => n >= 60 && n <= 140), `répartition : ${counts}`);
  assert.equal(dieRoll(2461318, 7), dieRoll(2461318, 7));
  const other = Array.from({ length: 10 }, (_, index) => dieRoll(2461319, index));
  assert.notDeepEqual(other, faces.slice(0, 10)); // une autre graine relance le dé
});

test('S+dé : chaque nom prend le décalage de son dé, un verrou garde le sien ; titre et aide', () => {
  const text = 'Le chat et la vieille horloge.';
  const tagged = tag(text);
  const run = (values: object, overrides: { index: number; values: object }[] = []) =>
    s7Plugin.apply(text, tagged, values as never, { morphology: m }, new Set(['noun']), { skip: [], overrides } as never).words.map((w) => w.output);
  const dice = { draw: 'dice', seed: 2461318 };
  const fixed = (offset: number) => run({ offset });
  const out = run(dice);
  assert.equal(out[1], fixed(dieRoll(2461318, 1))[1]);
  assert.equal(out[5], fixed(dieRoll(2461318, 5))[5]);
  assert.deepEqual(run(dice), out); // même graine, même texte
  const locked = run(dice, [{ index: 1, values: { offset: 9 } }]);
  assert.equal(locked[1], fixed(9)[1]);
  assert.equal(s7Plugin.title(dice), 'S+dé');
  assert.equal(s7Plugin.label(dice), 'S+dé');
  assert.ok(s7Plugin.acts({ ...dice, offset: 0 }));
  assert.match(s7Plugin.help(dice), /tiré au dé, de 1 à 6/);
});
