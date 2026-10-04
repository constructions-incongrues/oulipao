import assert from 'node:assert/strict';
import { test } from 'node:test';
import { inactivityTimer, realTimers, watchProgress, type Timers } from '../../src/adapters/loading/inactivity.ts';
import { fetchTextSource } from '../../src/adapters/text-sources/fetch-text-source.ts';
import { StalledError } from '../../src/ports/stalled.ts';

/** Des minuteurs à la main : `fire()` déclenche celui qui est armé, comme si le délai était écoulé. */
const manualTimers = () => {
  let pending: (() => void) | undefined;
  let armed = 0;
  const timers: Timers = {
    set: (callback) => {
      pending = callback;
      armed++;
      return armed;
    },
    clear: () => void (pending = undefined),
  };
  return {
    timers,
    get armed() {
      return armed;
    },
    get pending() {
      return pending !== undefined;
    },
    fire: () => {
      const callback = pending;
      pending = undefined;
      callback?.();
    },
  };
};

test('le minuteur arrête un chargement muet et nomme ce qui chargeait', () => {
  const clock = manualTimers();
  const stalls: StalledError[] = [];
  const timer = inactivityTimer((error) => stalls.push(error), { resource: 'des verbes', timers: clock.timers });
  timer.touch();
  clock.fire();
  assert.equal(stalls.length, 1);
  assert.ok(stalls[0] instanceof StalledError);
  assert.equal(stalls[0]!.resource, 'des verbes');
  assert.equal(stalls[0]!.seconds, 30);
});

test('chaque signe de vie réarme le minuteur ; arrêté, il ne se déclenche plus', () => {
  const clock = manualTimers();
  let stalled = false;
  const timer = inactivityTimer(() => (stalled = true), { resource: 'du modèle', timers: clock.timers });
  timer.touch();
  timer.touch();
  timer.touch();
  assert.equal(clock.armed, 3);
  timer.stop();
  assert.equal(clock.pending, false);
  timer.stop(); // deux arrêts de suite : sans effet
  clock.fire();
  assert.equal(stalled, false);
});

test('les vrais minuteurs s’arment et se coupent', async () => {
  let fired = false;
  const handle = realTimers.set(() => (fired = true), 1);
  realTimers.clear(handle);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(fired, false);
});

test('un chargement qui progresse aboutit, et transmet son avancement', async () => {
  const clock = manualTimers();
  const seen: number[] = [];
  const value = await watchProgress(
    async (onProgress) => {
      onProgress(10, 100);
      onProgress(100, 100);
      return 'chargé';
    },
    (loaded) => seen.push(loaded),
    { resource: 'du modèle', timers: clock.timers },
  );
  assert.equal(value, 'chargé');
  assert.deepEqual(seen, [10, 100]);
  assert.equal(clock.pending, false, 'le minuteur est coupé à la fin');
});

test('un chargement qui cesse de progresser rejette avec une StalledError, et la suite est ignorée', async () => {
  const clock = manualTimers();
  let progress: ((loaded: number, total: number) => void) | undefined;
  let finish: (() => void) | undefined;
  const seen: number[] = [];
  const watched = watchProgress(
    (onProgress) => {
      progress = onProgress;
      return new Promise<void>((resolve) => (finish = resolve));
    },
    (loaded) => seen.push(loaded),
    { resource: 'du modèle', timers: clock.timers },
  );
  progress!(5, 100);
  clock.fire();
  await assert.rejects(watched, (error: unknown) => error instanceof StalledError && error.resource === 'du modèle');
  progress!(50, 100); // le téléchargement continue en dessous : ignoré
  finish!();
  assert.deepEqual(seen, [5]);
});

test('un chargement qui échoue rejette avec sa propre erreur', async () => {
  const clock = manualTimers();
  await assert.rejects(watchProgress(() => Promise.reject(new Error('réseau coupé')), () => {}, { resource: 'du modèle', timers: clock.timers }), /réseau coupé/);
  assert.equal(clock.pending, false);
});

test('un échec après l’arrêt du chargement ne remplace pas la StalledError', async () => {
  const clock = manualTimers();
  let fail: ((error: Error) => void) | undefined;
  const watched = watchProgress(() => new Promise<void>((_, reject) => (fail = reject)), () => {}, { resource: 'du modèle', timers: clock.timers });
  clock.fire();
  fail!(new Error('trop tard'));
  await assert.rejects(watched, StalledError);
});

/** Un `fetch` qui sert un corps en flux : `push` envoie un morceau, `end` le termine ; un abandon fait échouer la lecture. */
const streamingFetch = () => {
  let controller: ReadableStreamDefaultController<Uint8Array> | undefined;
  const encoder = new TextEncoder();
  const fetchStub = async (_: unknown, init?: RequestInit) => {
    const body = new ReadableStream<Uint8Array>({ start: (c) => void (controller = c) });
    init?.signal?.addEventListener('abort', () => controller!.error(init.signal!.reason));
    return new Response(body);
  };
  return { fetchStub, push: (text: string) => controller!.enqueue(encoder.encode(text)), end: () => controller!.close() };
};

const withFetch = async (stub: typeof fetch, run: () => Promise<void>) => {
  const original = globalThis.fetch;
  globalThis.fetch = stub;
  try {
    await run();
  } finally {
    globalThis.fetch = original;
  }
};

test('fetchTextSource lit un corps en plusieurs morceaux, en réarmant le minuteur', async () => {
  const clock = manualTimers();
  const stream = streamingFetch();
  await withFetch(stream.fetchStub as typeof fetch, async () => {
    const reading = fetchTextSource('http://localhost/verbes.tsv', { resource: 'des verbes', timers: clock.timers })();
    await new Promise((resolve) => setTimeout(resolve, 0));
    stream.push('aimer\t');
    stream.push('aimons');
    stream.end();
    assert.equal(await reading, 'aimer\taimons');
    assert.ok(clock.armed >= 3);
    assert.equal(clock.pending, false);
  });
});

test('fetchTextSource arrête une lecture muette et nomme le fichier en cours', async () => {
  const clock = manualTimers();
  const stream = streamingFetch();
  await withFetch(stream.fetchStub as typeof fetch, async () => {
    const reading = fetchTextSource('http://localhost/verbes.tsv', { resource: 'des verbes', timers: clock.timers })();
    await new Promise((resolve) => setTimeout(resolve, 0));
    stream.push('aimer');
    await new Promise((resolve) => setTimeout(resolve, 0));
    clock.fire();
    await assert.rejects(reading, (error: unknown) => error instanceof StalledError && error.resource === 'des verbes');
  });
});

test('fetchTextSource sans corps lisible en flux se rabat sur la lecture d’un bloc', async () => {
  await withFetch((async () => ({ ok: true, body: null, text: async () => 'bloc' })) as unknown as typeof fetch, async () => {
    assert.equal(await fetchTextSource('http://localhost/bloc.tsv')(), 'bloc');
  });
});
