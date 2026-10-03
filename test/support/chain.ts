import { initialState, reduce } from '../../src/ui/tracks/mixer-state.ts';
import type { MixerAction } from '../../src/ui/tracks/types.ts';

/** La chaîne des tests : un S+7 en marche sur les noms, puis un lipogramme coupé. */
export const SEED: readonly MixerAction[] = [
  { type: 'add-instance', plugin: 's7' },
  { type: 'add-instance', plugin: 'lipogram' },
  { type: 'toggle-instance', id: 'lipogram-1' },
];

export const seededState = SEED.reduce(reduce, initialState);
