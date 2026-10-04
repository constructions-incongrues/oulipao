import assert from 'node:assert/strict';
import { test } from 'node:test';
import { html } from 'htm/preact';
import { renderToString } from 'preact-render-to-string';
import { SEED } from '../../support/chain.ts';
import { morphology, tag } from '../../support/morphology.ts';
import { elements } from '../../support/vnode.ts';
import { Notebook } from '../../../src/ui/tracks/components/notebook.ts';
import { Result } from '../../../src/ui/tracks/components/result.ts';
import { createTracksController, type NotebookDependencies } from '../../../src/ui/tracks/controller.ts';
import { initialState } from '../../../src/ui/tracks/mixer-state.ts';
import { entryClipboard, parseNotebook, serializeNotebook, type NotebookEntry } from '../../../src/ui/tracks/notebook.ts';
import { composeMention, ruleBody } from '../../../src/ui/tracks/view-model.ts';

// La mention des passes

test('mention : passes identiques fondues en ×n, chaînes différentes liées par « · puis »', () => {
  assert.equal(composeMention(['S+7 sur les noms', 'S+7 sur les noms'], 'S+7 sur les noms'), '\n\n— S+7 sur les noms ×3 (Oulipao)');
  assert.equal(composeMention(['S+7 sur les noms'], 'lipogramme en e'), '\n\n— S+7 sur les noms · puis lipogramme en e (Oulipao)');
  assert.equal(composeMention(['S+7 sur les noms'], ''), '\n\n— S+7 sur les noms (Oulipao)');
  assert.equal(composeMention(['A', 'B', 'B', 'A'], 'A'), '\n\n— A · puis B ×2 · puis A ×2 (Oulipao)');
  assert.equal(composeMention([], ''), '');
  assert.equal(composeMention([], 'S+7 sur les noms'), '\n\n— S+7 sur les noms (Oulipao)');
  assert.equal(ruleBody('\n\n— S+7 sur les noms · pistes coupées : adjectifs (Oulipao)'), 'S+7 sur les noms · pistes coupées : adjectifs');
  assert.equal(ruleBody(''), '');
});

// Le carnet

const entry = (id: string, extra: Partial<NotebookEntry> = {}): NotebookEntry => ({
  id,
  keptAt: '2026-10-04T20:00:00.000Z',
  result: 'Le village.',
  mention: '\n\n— S+7 sur les noms ×2 (Oulipao)',
  source: { text: 'L’oncle.', tagged: tag('L’oncle.') },
  mixer: initialState,
  ...extra,
});
const lineage = { parent: 'b', ancestor: 'La ferme.', passes: ['S+7 sur les noms'] };

test('carnet : la filiation fait l’aller-retour ; un ancien carnet et une filiation abîmée se lisent', () => {
  const kept = entry('c', { lineage });
  assert.deepEqual(parseNotebook(serializeNotebook([kept])).entries, [kept]);
  assert.equal(parseNotebook(serializeNotebook([entry('a')])).entries[0]!.lineage, undefined);
  const damaged = JSON.stringify({ version: 1, entries: [{ ...entry('d'), lineage: { parent: '', ancestor: 3 } }] });
  const read = parseNotebook(damaged);
  assert.equal(read.rejected, 0);
  assert.equal(read.entries[0]!.lineage, undefined);
});

test('carnet : la copie d’une deuxième génération commence par l’ancêtre', () => {
  assert.equal(entryClipboard(entry('c', { lineage })), 'La ferme.\n\nL’oncle.\n\nLe village.\n\n— S+7 sur les noms ×2 (Oulipao)');
  assert.equal(entryClipboard(entry('a')), 'L’oncle.\n\nLe village.\n\n— S+7 sur les noms ×2 (Oulipao)');
});

test('carnet : l’ancêtre et le parent avant le résultat, et rien de plus sans filiation', () => {
  const props = { onExport: () => {}, onImport: () => {}, onCopy: () => {}, onReopen: () => {}, onRemove: () => {}, onEdit: () => {}, message: '', today: new Date(2026, 9, 4) };
  const out = renderToString(html`<${Notebook} entries=${[entry('c', { lineage }), entry('a')]} ...${props} />`);
  assert.match(out, /<p class="kept-origin"><span class="silk">Ancêtre<\/span> La ferme\.<\/p>\s*<p class="kept-origin"><span class="silk">Parent<\/span> L’oncle\.<\/p>\s*<p class="kept-text">Le village\.<\/p>/);
  assert.equal(out.match(/kept-origin/g)!.length, 2);
});

// Les touches

test('Result : « Itérer » et « Figer » après « Garder », désactivés comme elle et pendant l’étiquetage', () => {
  const calls: string[] = [];
  const base = {
    segments: [{ text: 'Le village.', index: 0 }], marks: new Map(), tracks: ['noun'], onSelect: () => {}, changed: new Set(), generation: 0,
    audibleCount: 5, copyMessage: '', onCopy: () => {}, onKeep: () => {}, onIterate: () => calls.push('iterate'), onFreeze: () => calls.push('freeze'),
  };
  const keys = (props: object) => elements(html`<${Result} ...${base} ...${props} />`).filter((element) => element.type === 'button' && /iterate|freeze/.test(String(element.props['class'])));
  const [iterate, freeze] = keys({ empty: false, stale: false });
  assert.equal(iterate!.props['children'], 'Itérer');
  assert.equal(freeze!.props['children'], 'Figer');
  assert.equal(iterate!.props['disabled'], false);
  (iterate!.props['onClick'] as () => void)();
  (freeze!.props['onClick'] as () => void)();
  assert.deepEqual(calls, ['iterate', 'freeze']);
  assert.ok(keys({ empty: true, stale: false }).every((key) => key.props['disabled']));
  assert.ok(keys({ empty: false, stale: true }).every((key) => key.props['disabled']));
  assert.ok(keys({ empty: false, stale: false, busy: true }).every((key) => key.props['disabled']));
  const without = elements(html`<${Result} ...${base} onIterate=${undefined} onFreeze=${undefined} empty=${false} stale=${false} />`);
  assert.equal(without.filter((element) => /iterate|freeze/.test(String(element.props['class']))).length, 0);
});

// Les gestes

/** Un carnet factice en mémoire, aux identifiants prévisibles ; `full` fait échouer l'écriture. */
function fakeNotebook() {
  let data: string | null = null;
  let ids = 0;
  const box = { full: false };
  const notebook: NotebookDependencies = {
    storage: {
      read: () => data,
      write: (text) => {
        if (box.full) throw new Error('stockage plein');
        data = text;
      },
    },
    now: () => new Date(2026, 9, 4, 21),
    newId: () => `t${++ids}`,
    confirm: () => true,
    download: () => {},
  };
  return { notebook, box };
}

async function setup() {
  const fake = fakeNotebook();
  const tagged: string[] = [];
  const controller = createTracksController({
    tagger: { name: 'factice', tag: (text) => (tagged.push(text), tag(text)) },
    loadMorphology: async () => morphology(),
    loadVerbs: async () => {
      throw new Error('pas de verbes ici');
    },
    preload: async () => {},
    copy: async () => {},
    notebook: fake.notebook,
  });
  for (const action of SEED) controller.dispatch(action);
  controller.setInput('La ferme.');
  await controller.run();
  return { controller, tagged, box: fake.box };
}

test('itérer : garde le texte, met en pistes son résultat avec la même chaîne, et la filiation suit', async () => {
  const { controller, tagged } = await setup();
  const first = controller.state.view!.result;
  await controller.iterate();
  assert.equal(controller.state.notebook.length, 1);
  assert.equal(controller.state.notebook[0]!.lineage, undefined);
  assert.equal(controller.state.input, first);
  assert.equal(tagged.at(-1), first);
  assert.deepEqual(controller.state.mixer.instances.map((instance) => instance.id), ['s7-1', 'lipogram-1']);
  assert.deepEqual(controller.state.lineage, { parent: 't1', ancestor: 'La ferme.', passes: ['S+7 sur les noms'] });
  await controller.iterate();
  const third = controller.state.view!.result;
  controller.keep();
  const [kept] = controller.state.notebook;
  assert.equal(controller.state.notebook.length, 3);
  assert.equal(kept!.result, third);
  assert.deepEqual(kept!.lineage, { parent: 't2', ancestor: 'La ferme.', passes: ['S+7 sur les noms', 'S+7 sur les noms'] });
  assert.equal(kept!.mention, '\n\n— S+7 sur les noms ×3 (Oulipao)');
});

test('itérer juste après « Garder » : pas de doublon, l’entrée gardée est le parent', async () => {
  const { controller } = await setup();
  controller.keep();
  await controller.freeze();
  assert.equal(controller.state.notebook.length, 1);
  assert.equal(controller.state.lineage!.parent, 't1');
});

test('figer : chaîne, forme et pistes coupées vidées ; la mention garde la passe d’avant', async () => {
  const { controller } = await setup();
  controller.dispatch({ type: 'toggle-mute', category: 'other' });
  controller.dispatch({ type: 'set-form', form: 'rondel' });
  const shown = controller.state.view!.result;
  await controller.freeze();
  assert.equal(controller.state.input, shown);
  assert.deepEqual(controller.state.mixer.instances, []);
  assert.equal(controller.state.mixer.form, undefined);
  assert.ok(Object.values(controller.state.mixer.tracks).every((track) => !track.muted && !track.solo));
  assert.equal(controller.state.view!.result, shown);
  controller.keep();
  assert.match(controller.state.notebook[0]!.mention, /^\n\n— S\+7 sur les noms · pistes coupées : autres · rondel \(Oulipao\)$/);
  controller.dispatch({ type: 'add-instance', plugin: 'lipogram' });
  controller.keep();
  assert.match(controller.state.notebook[0]!.mention, / · puis lipogramme en e \(Oulipao\)$/);
});

test('stockage plein : le geste s’arrête, rien ne bouge', async () => {
  const { controller, box, tagged } = await setup();
  box.full = true;
  const before = { input: controller.state.input, result: controller.state.view!.result, mixer: controller.state.mixer };
  await controller.iterate();
  assert.deepEqual(controller.state.notebookError, { lead: 'Impossible de garder :', detail: 'stockage plein.' });
  assert.deepEqual({ input: controller.state.input, result: controller.state.view!.result, mixer: controller.state.mixer }, before);
  assert.equal(tagged.length, 1);
  assert.equal(controller.state.lineage, undefined);
});

test('rien à itérer : ni vue, ni texte à jour', async () => {
  const fake = fakeNotebook();
  const controller = createTracksController({ tagger: { name: 'factice', tag }, loadMorphology: async () => morphology(), preload: async () => {}, copy: async () => {}, notebook: fake.notebook });
  await controller.iterate();
  assert.equal(controller.state.notebook.length, 0);
  const { controller: other } = await setup();
  other.setInput('Un autre texte.');
  await other.freeze();
  assert.equal(other.state.notebook.length, 0);
});

test('un texte collé efface la filiation ; rouvrir une deuxième génération la reprend', async () => {
  const { controller } = await setup();
  await controller.iterate();
  controller.keep();
  controller.setInput('La ferme dort.');
  await controller.run();
  assert.equal(controller.state.lineage, undefined);
  controller.keep();
  assert.equal(controller.state.notebook[0]!.lineage, undefined);
  await controller.reopen('t2');
  assert.deepEqual(controller.state.lineage, { parent: 't1', ancestor: 'La ferme.', passes: ['S+7 sur les noms'] });
  await controller.iterate();
  assert.equal(controller.state.notebook.length, 3); // rouverte sans geste : t2 est reprise, pas regardée
  assert.deepEqual(controller.state.lineage, { parent: 't2', ancestor: 'La ferme.', passes: ['S+7 sur les noms', 'S+7 sur les noms'] });
});

test('une entrée gardée puis supprimée n’est pas reprise comme parent', async () => {
  const { controller } = await setup();
  controller.keep();
  controller.remove('t1');
  await controller.iterate();
  assert.equal(controller.state.lineage!.parent, 't2');
});
