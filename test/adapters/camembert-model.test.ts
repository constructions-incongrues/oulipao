import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createCamembertClassifier, MODEL_REVISION, type TransformersLibrary } from '../../src/adapters/taggers/camembert-model.ts';

test('les poids et le tokenizer sont demandés à la révision figée, pas à la branche main', async () => {
  const requests: { kind: string; model: string; options?: Record<string, unknown> }[] = [];
  const tokenizer = Object.assign(async () => ({ input_ids: { data: [5] } }), { decode: () => 'chat' });
  const model = Object.assign(async () => ({ logits: { dims: [1, 1, 2], data: [0, 1] } }), { config: { id2label: { 0: 'DET', 1: 'NC' } } });
  const library: TransformersLibrary = {
    AutoTokenizer: { from_pretrained: async (name, options) => (requests.push({ kind: 'tokenizer', model: name, options: options as Record<string, unknown> }), tokenizer) },
    AutoModelForTokenClassification: { from_pretrained: async (name, options) => (requests.push({ kind: 'model', model: name, options: options as Record<string, unknown> }), model) },
  };
  const classifier = createCamembertClassifier(async () => library);
  await classifier.load();
  assert.match(MODEL_REVISION, /^[0-9a-f]{40}$/);
  assert.deepEqual(requests.map((request) => [request.kind, request.options?.['revision']]), [['tokenizer', MODEL_REVISION], ['model', MODEL_REVISION]]);
  assert.ok(requests.every((request) => request.model === 'Xenova/french-camembert-postag-model'));
  // Le classifieur sert ensuite les étiquettes du modèle chargé.
  assert.deepEqual(await classifier.classify('chat'), [{ piece: 'chat', label: 'NC' }]);
});
