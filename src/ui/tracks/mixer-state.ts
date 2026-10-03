import { CATEGORIES } from '../../domain/categories.ts';
import type { Tracks } from '../../domain/mixing.ts';
import { MixerActionSchema, type MixerAction, type MixerState } from './types.ts';

/** À l'ouverture : toutes les pistes s'entendent ; le S+7 est actif, décalage 7, réaccord. */
export const initialState: MixerState = {
  tracks: Object.fromEntries(CATEGORIES.map((category) => [category, { muted: false, solo: false }])) as Tracks,
  plugin: { enabled: true, offset: 7, mode: 'reagree' },
};

/** Applique un geste à l'état de la table ; refuse un geste non conforme au schéma. */
export function reduce(state: MixerState, action: MixerAction): MixerState {
  const checked = MixerActionSchema.parse(action);
  switch (checked.type) {
    case 'toggle-mute': {
      const track = state.tracks[checked.category];
      return { ...state, tracks: { ...state.tracks, [checked.category]: { ...track, muted: !track.muted } } };
    }
    case 'toggle-solo': {
      const track = state.tracks[checked.category];
      return { ...state, tracks: { ...state.tracks, [checked.category]: { ...track, solo: !track.solo } } };
    }
    case 'toggle-plugin':
      return { ...state, plugin: { ...state.plugin, enabled: !state.plugin.enabled } };
    case 'set-offset':
      return { ...state, plugin: { ...state.plugin, offset: checked.offset } };
    case 'set-mode':
      return { ...state, plugin: { ...state.plugin, mode: checked.mode } };
  }
}
