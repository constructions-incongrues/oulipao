import { CATEGORIES } from '../../domain/categories.ts';
import type { Tracks } from '../../domain/mixing.ts';
import type { ConstraintPlugin } from '../../domain/plugin.ts';
import { s7Plugin } from '../../domain/s7/plugin.ts';
import { MixerActionSchema, type MixerAction, type MixerState } from './types.ts';

/** La contrainte branchée sur la table. Une seule pour l'instant. */
export const installedPlugin: ConstraintPlugin = s7Plugin;

/** À l'ouverture : toutes les pistes s'entendent ; le plugin est en marche, à ses réglages d'ouverture. */
export const initialState: MixerState = {
  tracks: Object.fromEntries(CATEGORIES.map((category) => [category, { muted: false, solo: false }])) as Tracks,
  plugin: { enabled: true, params: installedPlugin.defaults },
};

/** Applique un geste à l'état de la table ; refuse un geste non conforme, ou un réglage que le plugin refuse. */
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
    case 'set-param': {
      if (!installedPlugin.parameters.some((parameter) => parameter.key === checked.key)) throw new Error(`paramètre inconnu : ${checked.key}`);
      const params = installedPlugin.parse({ ...state.plugin.params, [checked.key]: checked.value });
      return { ...state, plugin: { ...state.plugin, params } };
    }
  }
}
