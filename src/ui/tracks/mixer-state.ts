import { CATEGORIES } from '../../domain/categories.ts';
import type { Tracks } from '../../domain/mixing.ts';
import type { ConstraintPlugin } from '../../domain/plugin.ts';
import { installedPlugins } from '../../domain/registry.ts';
import { RECIPES, validRecipes, type Recipe } from './recipes.ts';
import { MixerActionSchema, type Instance, type MixerAction, type MixerState } from './types.ts';

// Le registre vit dans le domaine (`registry.ts`) ; réexporté ici pour les appelants de l'interface.
export { installedPlugins };

/** Les recettes proposées : celles qui tiennent avec les types installés. */
export const recipes: readonly Recipe[] = validRecipes(RECIPES, installedPlugins);

/** Une recette proposée, par son identifiant ; lève si elle n'existe pas. */
export function recipeById(id: string): Recipe {
  const recipe = recipes.find((candidate) => candidate.id === id);
  if (!recipe) throw new Error(`recette inconnue : ${id}`);
  return recipe;
}

/** Un type de contrainte installé, par son identifiant ; lève s'il n'est pas installé. */
export function pluginById(id: string): ConstraintPlugin {
  const plugin = installedPlugins.find((candidate) => candidate.id === id);
  if (!plugin) throw new Error(`plugin inconnu : ${id}`);
  return plugin;
}

/** Une instance neuve d'un type : ses réglages et ses pistes par défaut. */
const freshInstance = (plugin: ConstraintPlugin, id: string, enabled = true): Instance => ({
  id,
  type: plugin.id,
  enabled,
  params: plugin.defaults,
  targets: [...plugin.defaultTargets],
});

/** Un identifiant libre pour une nouvelle instance d'un type : « s7-2 », « s7-3 »… */
function nextId(instances: readonly Instance[], type: string): string {
  const taken = new Set(instances.map((instance) => instance.id));
  let n = 1;
  while (taken.has(`${type}-${n}`)) n++;
  return `${type}-${n}`;
}

/** À l'ouverture : toutes les pistes s'entendent, aucune contrainte sur la chaîne. */
export const initialState: MixerState = {
  tracks: Object.fromEntries(CATEGORIES.map((category) => [category, { muted: false, solo: false }])) as Tracks,
  instances: [],
};

/** L'instance d'identifiant donné ; lève si elle n'existe pas. */
function instanceOf(state: MixerState, id: string): Instance {
  const instance = state.instances.find((candidate) => candidate.id === id);
  if (!instance) throw new Error(`instance inconnue : ${id}`);
  return instance;
}

const replace = (state: MixerState, next: Instance): MixerState => ({
  ...state,
  instances: state.instances.map((instance) => (instance.id === next.id ? next : instance)),
});

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
    case 'toggle-instance': {
      const instance = instanceOf(state, checked.id);
      return replace(state, { ...instance, enabled: !instance.enabled });
    }
    case 'set-param': {
      const instance = instanceOf(state, checked.id);
      const plugin = pluginById(instance.type);
      if (!plugin.parameters.some((parameter) => parameter.key === checked.key)) throw new Error(`paramètre inconnu : ${checked.key}`);
      return replace(state, { ...instance, params: plugin.parse({ ...instance.params, [checked.key]: checked.value }) });
    }
    case 'set-targets': {
      const instance = instanceOf(state, checked.id);
      const plugin = pluginById(instance.type);
      if (plugin.targetable === false) throw new Error(`${plugin.name} agit sur tout le texte : pas de pistes à choisir`);
      const refused = checked.targets.filter((track) => !plugin.tracks.includes(track));
      if (refused.length) throw new Error(`${plugin.name} ne traite pas : ${refused.join(', ')}`);
      // Dans l'ordre des pistes de la table, sans doublon.
      return replace(state, { ...instance, targets: CATEGORIES.filter((track) => checked.targets.includes(track)) });
    }
    case 'add-instance': {
      const plugin = pluginById(checked.plugin);
      return { ...state, instances: [...state.instances, freshInstance(plugin, nextId(state.instances, plugin.id))] };
    }
    case 'add-recipe': {
      const recipe = recipeById(checked.recipe);
      const options = recipe.choice?.options.map((option) => option.value);
      if (options ? !options.includes(checked.choice ?? '') : checked.choice !== undefined) throw new Error(`${recipe.name} : choix refusé`);
      const [year, month, day] = checked.today.split('-').map(Number) as [number, number, number];
      const instances = [...state.instances];
      for (const step of recipe.build(checked.choice, new Date(year, month - 1, day))) {
        const plugin = pluginById(step.type);
        instances.push({
          id: nextId(instances, plugin.id),
          type: plugin.id,
          enabled: true,
          params: plugin.parse(step.params),
          targets: CATEGORIES.filter((track) => step.targets.includes(track)),
        });
      }
      // Une recette qui pose une forme (Éclipse) remplace la forme courante.
      return { ...state, instances, ...(recipe.form && { form: recipe.form }) };
    }
    case 'duplicate-instance': {
      // Le double porte les verrous de l'original ; il va en fin de chaîne.
      const instance = instanceOf(state, checked.id);
      return { ...state, instances: [...state.instances, { ...instance, id: nextId(state.instances, instance.type) }] };
    }
    case 'remove-instance': {
      instanceOf(state, checked.id);
      return { ...state, instances: state.instances.filter((instance) => instance.id !== checked.id) };
    }
    case 'move-instance': {
      const instance = instanceOf(state, checked.id);
      const instances = state.instances.filter((candidate) => candidate.id !== checked.id);
      instances.splice(Math.min(checked.position, instances.length), 0, instance);
      return { ...state, instances };
    }
    case 'toggle-step': {
      const closed = state.closed ?? [];
      return { ...state, closed: closed.includes(checked.index) ? closed.filter((index) => index !== checked.index) : [...closed, checked.index] };
    }
    case 'set-lock': {
      const instance = instanceOf(state, checked.id);
      const plugin = pluginById(instance.type);
      const parameter = plugin.parameters.find((candidate) => candidate.key === checked.key);
      if (parameter?.kind !== 'integer' || !parameter.lockable) throw new Error(`paramètre non verrouillable : ${checked.key}`);
      // Le verrou passe par la même validation qu'un réglage : hors bornes, il est refusé.
      plugin.parse({ ...instance.params, [checked.key]: checked.value });
      const others = (instance.locks ?? []).filter((lock) => lock.index !== checked.index || lock.key !== checked.key);
      return replace(state, { ...instance, locks: [...others, { index: checked.index, key: checked.key, value: checked.value }] });
    }
    case 'clear-lock': {
      const instance = instanceOf(state, checked.id);
      const locks = (instance.locks ?? []).filter((lock) => lock.index !== checked.index || lock.key !== checked.key);
      return replace(state, { ...instance, locks });
    }
    case 'reset-steps':
      return { ...state, closed: [], instances: state.instances.map((instance) => ({ ...instance, locks: [] })) };
    case 'set-form':
      return { ...state, form: checked.form };
  }
}
