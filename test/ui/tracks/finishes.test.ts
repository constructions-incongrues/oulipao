import assert from 'node:assert/strict';
import { test } from 'node:test';
import { downloadText, type DownloadHost } from '../../../src/ui/tracks/download.ts';
import { debounced, realSchedule } from '../../../src/ui/tracks/schedule.ts';

test('un appel au repos : seul le dernier d’une rafale part', async () => {
  const calls: string[] = [];
  const send = debounced((value: string) => calls.push(value), 5);
  send('L');
  send('Lu');
  send('Luc');
  assert.deepEqual(calls, []);
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.deepEqual(calls, ['Luc']);
});

test('un appel programmé puis annulé ne part pas', async () => {
  let fired = false;
  const cancel = realSchedule(() => (fired = true), 1);
  cancel();
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.equal(fired, false);
});

test('l’export : le lien est cliqué, puis l’adresse révoquée seulement après', () => {
  const events: string[] = [];
  let later: (() => void) | undefined;
  const host: DownloadHost = {
    createObjectURL: () => (events.push('créée'), 'blob:carnet'),
    revokeObjectURL: (url) => void events.push(`révoquée ${url}`),
    link: (href, name) => ({ click: () => void events.push(`clic ${href} ${name}`) }),
  };
  downloadText(host, 'oulipao-carnet-2026-10-04.json', '{}', (callback) => ((later = callback), () => {}));
  assert.deepEqual(events, ['créée', 'clic blob:carnet oulipao-carnet-2026-10-04.json']);
  later!();
  assert.deepEqual(events.at(-1), 'révoquée blob:carnet');
});
