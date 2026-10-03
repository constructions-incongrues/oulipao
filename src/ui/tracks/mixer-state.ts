import { CATEGORIES } from '../../domain/categories.ts';
import type { Tracks } from '../../domain/mixing.ts';
import type { ConstraintPlugin } from '../../domain/plugin.ts';
import { lipogramPlugin } from '../../domain/lipogram/plugin.ts';
import { s7Plugin } from '../../domain/s7/plugin.ts';
import { MixerActionSchema, type MixerAction, type MixerState } from './types.ts';

/** Les contraintes installées sur la table, dans l'ordre de la chaîne à l'ouverture. */
export const installedPlugins: readonly ConstraintPlugin[] = [s7Plugin, lipogramPlugin];

/** Coupés à l'ouverture : le lipogramme s'essaie après le S+7, on le met en marche soi-même. */
const OFF_AT_OPEN = new Set(['lipogram']);

/** Un plugin installé, par son identifiant ; lève s'il n'est pas installé. */
export function pluginById(id: string): ConstraintPlugin {
  const plugin = installedPlugins.find((candidate) => candidate.id === id);
  if (!plugin) throw new Error(`plugin inconnu : ${id}`);
  return plugin;
}

/** À l'ouverture : toutes les pistes s'entendent ; chaque plugin est à ses réglages d'ouverture. */
export const initialState: MixerState = {
  tracks: Object.fromEntries(CATEGORIES.map((category) => [category, { muted: false, solo: false }])) as Tracks,
  plugins: Object.fromEntries(installedPlugins.map((plugin) => [plugin.id, { enabled: !OFF_AT_OPEN.has(plugin.id), params: plugin.defaults }])),
  order: installedPlugins.map((plugin) => plugin.id),
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
    case 'toggle-plugin': {
      const current = state.plugins[pluginById(checked.id).id]!;
      return { ...state, plugins: { ...state.plugins, [checked.id]: { ...current, enabled: !current.enabled } } };
    }
    case 'set-param': {
      const plugin = pluginById(checked.id);
      if (!plugin.parameters.some((parameter) => parameter.key === checked.key)) throw new Error(`paramètre inconnu : ${checked.key}`);
      const current = state.plugins[plugin.id]!;
      const params = plugin.parse({ ...current.params, [checked.key]: checked.value });
      return { ...state, plugins: { ...state.plugins, [plugin.id]: { ...current, params } } };
    }
    case 'move-plugin': {
      pluginById(checked.id);
      const order = state.order.filter((id) => id !== checked.id);
      order.splice(Math.min(checked.position, order.length), 0, checked.id);
      return { ...state, order };
    }
  }
}
