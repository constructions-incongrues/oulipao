import { html } from 'htm/preact';
import type { VNode } from 'preact';
import type { ConstraintPlugin } from '../../../domain/plugin.ts';
import { TRACK_NAMES, type Instance, type MixerAction } from '../types.ts';
import { PluginSlot } from './plugin-slot.ts';

export interface RackProps {
  /** Les instances, dans l'ordre de la chaîne. */
  instances: readonly Instance[];
  /** Les types qu'on peut ajouter. */
  plugins: readonly ConstraintPlugin[];
  lookup: (type: string) => ConstraintPlugin;
  dispatch: (action: MixerAction) => void;
}

/** Une instance du rack : sa marche et ses réglages, ses pistes visées, sa place dans la chaîne. */
function Unit({ instance, position, last, plugin, dispatch }: { instance: Instance; position: number; last: number; plugin: ConstraintPlugin; dispatch: RackProps['dispatch'] }): VNode {
  const { id, targets } = instance;
  const rank = position + 1;
  return html`
    <li class="unit" aria-label=${`Filtre ${rank} : ${plugin.name}`}>
      <span class="rank" aria-hidden="true">${rank}</span>
      <${PluginSlot}
        plugin=${plugin}
        state=${instance}
        onToggle=${() => dispatch({ type: 'toggle-instance', id })}
        onParam=${(key: string, value: number | string) => dispatch({ type: 'set-param', id, key, value })}
      />
      <div class="targets" role="group" aria-label="Pistes visées">
        ${plugin.tracks.map((track) => {
          const on = targets.includes(track);
          return html`<button type="button" class=${`chip ${track}`} aria-pressed=${on}
            disabled=${on && targets.length === 1}
            onClick=${() => dispatch({ type: 'set-targets', id, targets: on ? targets.filter((t) => t !== track) : [...targets, track] })}
          >${TRACK_NAMES[track]}</button>`;
        })}
      </div>
      <div class="unit-actions">
        <button type="button" class="up" aria-label=${`Monter le filtre ${rank}`} disabled=${position === 0}
          onClick=${() => dispatch({ type: 'move-instance', id, position: position - 1 })}>↑</button>
        <button type="button" class="down" aria-label=${`Descendre le filtre ${rank}`} disabled=${position === last}
          onClick=${() => dispatch({ type: 'move-instance', id, position: position + 1 })}>↓</button>
        <button type="button" class="duplicate" onClick=${() => dispatch({ type: 'duplicate-instance', id })}>Dupliquer</button>
        <button type="button" class="remove" onClick=${() => dispatch({ type: 'remove-instance', id })}>Retirer</button>
      </div>
    </li>
  ` as VNode;
}

/**
 * Le rack : les filtres dans l'ordre où le texte les traverse, chacun avec ses réglages et ses
 * pistes ; en bas, un bouton par type pour en ajouter un en fin de chaîne.
 */
export function Rack({ instances, plugins, lookup, dispatch }: RackProps): VNode {
  return html`
    <section class="rack" aria-label="Filtres">
      <h3>Filtres</h3>
      ${instances.length
        ? html`<ol>
            ${instances.map(
              (instance, position) => html`<${Unit} key=${instance.id} instance=${instance} position=${position}
                last=${instances.length - 1} plugin=${lookup(instance.type)} dispatch=${dispatch} />`,
            )}
          </ol>`
        : html`<p class="more">Aucun filtre : le texte passe tel quel.</p>`}
      <div class="add">
        ${plugins.map(
          (plugin) => html`<button type="button" class="add-instance" onClick=${() => dispatch({ type: 'add-instance', plugin: plugin.id })}>+ ${plugin.name}</button>`,
        )}
      </div>
    </section>
  ` as VNode;
}
