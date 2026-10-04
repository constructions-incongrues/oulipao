import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { visibleParameters, type ConstraintPlugin } from '../../../domain/plugin.ts';
import { TRACK_NAMES, type Instance, type MixerAction } from '../types.ts';
import type { Recipe } from '../recipes.ts';
import { Browser } from './browser.ts';
import { GateSchema, ModulatorSchema } from '../../../domain/modulation/schema.ts';
import { gateStatement, modulatedLabel, modulatorStatement } from '../modulation-statement.ts';
import { Control } from './control.ts';
import { GateField } from './gate-field.ts';
import { ModulatorField } from './modulator-field.ts';
import { Shape } from './shape.ts';

export interface ChainProps {
  /** Les instances, dans l'ordre de la chaîne. */
  instances: readonly Instance[];
  /** Les types qu'on peut ajouter. */
  plugins: readonly ConstraintPlugin[];
  /** Les recettes proposées dans le navigateur. */
  recipes?: readonly Recipe[];
  /** Le jour du branchement d'une recette ; aujourd'hui, sauf en test. */
  now?: () => Date;
  lookup: (type: string) => ConstraintPlugin;
  dispatch: (action: MixerAction) => void;
  /** Ce que la chaîne a fait au texte, en une phrase annoncée (« S+7 sur les noms : 19 noms remplacés sur 20. ») ; vide sans texte. */
  status?: string;
}

/**
 * La position où placer une instance lâchée avant ou après une autre, comptée dans la chaîne
 * privée de l'instance déplacée (c'est ce qu'attend `move-instance`).
 */
export function dropPosition(ids: readonly string[], dragged: string, target: string, before: boolean): number {
  const rest = ids.filter((id) => id !== dragged);
  const at = rest.indexOf(target);
  return before ? at : at + 1;
}

const DRAG_MARKS = ['dragging', 'drop-before', 'drop-after'];
const clearMarks = (row: Element) => row.closest('.slots')?.querySelectorAll('.slot').forEach((slot) => slot.classList.remove(...DRAG_MARKS));

/** L'aide d'une instance : celle de son type, ou la règle de ses modulateurs et de sa porte, qui la remplace. */
function help(instance: Instance, plugin: ConstraintPlugin): string {
  const { modulators = {}, gate, targets, params } = instance;
  const context = { earlier: false, folded: false };
  const rules = [
    ...Object.entries(modulators).map(([key, modulator]) => modulatorStatement(plugin, key, modulator, targets, context)),
    ...(gate ? [gateStatement(gate, targets, context)] : []),
  ];
  if (!rules.length) return plugin.help(params, new Set(targets));
  const sentence = rules.join(' ; ');
  return `${sentence[0]!.toUpperCase()}${sentence.slice(1)}.`;
}

/** Une ligne de la chaîne : poignée, numéro, nom, réglages, pistes visées, marche, gestes. */
function Row({ instance, position, ids, plugin, dispatch }: { instance: Instance; position: number; ids: readonly string[]; plugin: ConstraintPlugin; dispatch: ChainProps['dispatch'] }): VNode {
  const { id, targets, enabled, params, modulators = {}, gate } = instance;
  // Un paramètre principal modulé donne son nom à l'instance : « S+lettres ».
  const name = modulators[Object.keys(modulators)[0] ?? ''] ? modulatedLabel(plugin, params, modulators).split(',')[0]! : (plugin.nameOf?.(params) ?? plugin.name);
  const rank = position + 1;
  const last = ids.length - 1;
  // Glisser-déposer natif : seule la poignée rend la ligne déplaçable, les champs restent utilisables.
  const onDragStart = (event: DragEvent) => {
    event.dataTransfer?.setData('text/plain', id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    (event.currentTarget as HTMLElement).classList.add('dragging');
  };
  const onDragOver = (event: DragEvent) => {
    event.preventDefault();
    const row = event.currentTarget as HTMLElement;
    const box = row.getBoundingClientRect();
    const before = event.clientY < box.top + box.height / 2;
    row.classList.toggle('drop-before', before);
    row.classList.toggle('drop-after', !before);
  };
  const onDrop = (event: DragEvent) => {
    event.preventDefault();
    const row = event.currentTarget as HTMLElement;
    const dragged = event.dataTransfer?.getData('text/plain') ?? '';
    const before = row.classList.contains('drop-before');
    clearMarks(row);
    if (dragged && dragged !== id && ids.includes(dragged)) {
      dispatch({ type: 'move-instance', id: dragged, position: dropPosition(ids, dragged, id, before) });
    }
  };
  const release = (event: Event) => {
    const row = event.currentTarget as HTMLElement;
    clearMarks(row);
    row.removeAttribute('draggable');
  };
  return html`
    <li class=${`slot ${enabled ? 'on' : 'off'}`} aria-label=${`Contrainte ${rank} : ${name}`}
      onDragStart=${onDragStart} onDragOver=${onDragOver} onDragLeave=${(event: DragEvent) => (event.currentTarget as HTMLElement).classList.remove('drop-before', 'drop-after')}
      onDrop=${onDrop} onDragEnd=${release} onPointerUp=${release}>
      <span class="grip" aria-hidden="true" title="Glisser pour réordonner"
        onPointerDown=${(event: PointerEvent) => ((event.currentTarget as HTMLElement).closest('.slot') as HTMLElement).setAttribute('draggable', 'true')}></span>
      <span class="pos mono" aria-hidden="true">${rank}</span>
      <span class="name">${name}</span>
      <span class="param">
        ${visibleParameters(plugin, params).map(
          // Modulé, le champ fixe s'estompe : il ne sert plus qu'aux mots sans valeur modulée (pas de voisin, prononciations en route).
          (parameter) => html`<label class=${modulators[parameter.key] ? 'silk fixed-modulated' : 'silk'}
            title=${modulators[parameter.key] ? 'Modulé : cette valeur ne sert qu’aux mots sans valeur modulée' : undefined}>${parameter.label}<${Control} parameter=${parameter} value=${params[parameter.key]}
            onParam=${(key: string, value: number | string) => dispatch({ type: 'set-param', id, key, value })} /></label>
            ${parameter.kind === 'integer' && parameter.lockable &&
            html`<${ModulatorField} label=${parameter.label} modulator=${modulators[parameter.key]} onModulator=${(modulator: unknown) => {
              if (modulator === undefined) return dispatch({ type: 'clear-modulator', id, key: parameter.key });
              const parsed = ModulatorSchema.safeParse(modulator);
              if (parsed.success) dispatch({ type: 'set-modulator', id, key: parameter.key, modulator: parsed.data });
            }} />`}`,
        )}
        ${plugin.targetable !== false &&
        html`<${GateField} gate=${gate} onGate=${(next: unknown) => {
          if (next === undefined) return dispatch({ type: 'clear-gate', id });
          const parsed = GateSchema.safeParse(next);
          if (parsed.success) dispatch({ type: 'set-gate', id, gate: parsed.data });
        }} />`}
      </span>
      ${plugin.targetable === false
        ? // Une mise en page agit sur tout le texte : pas de pistes à choisir.
          html`<span class="targets"><span class="silk">Tout le texte</span></span>`
        : html`<span class="targets" role="group" aria-label="Pistes visées">
            <span class="silk" aria-hidden="true">Pistes visées</span>
            ${plugin.tracks.map((track) => {
              const on = targets.includes(track);
              return html`<button type="button" class=${`chip ${track}`} aria-pressed=${on} disabled=${on && targets.length === 1}
                onClick=${() => dispatch({ type: 'set-targets', id, targets: on ? targets.filter((t) => t !== track) : [...targets, track] })}
              ><${Shape} track=${track} />${TRACK_NAMES[track]}</button>`;
            })}
          </span>`}
      <button type="button" class="key power" aria-pressed=${enabled} aria-label=${`${plugin.title(params)} ${enabled ? 'actif' : 'coupé'}`}
        onClick=${() => dispatch({ type: 'toggle-instance', id })}>${enabled ? 'Actif' : 'Coupé'}</button>
      <span class="slot-keys">
        <button type="button" class="key up" aria-label=${`Monter la contrainte ${rank}`} disabled=${position === 0}
          onClick=${() => dispatch({ type: 'move-instance', id, position: position - 1 })}>↑</button>
        <button type="button" class="key down" aria-label=${`Descendre la contrainte ${rank}`} disabled=${position === last}
          onClick=${() => dispatch({ type: 'move-instance', id, position: position + 1 })}>↓</button>
        <button type="button" class="key duplicate" onClick=${() => dispatch({ type: 'duplicate-instance', id })}>Dupliquer</button>
        <button type="button" class="key remove" onClick=${() => dispatch({ type: 'remove-instance', id })}>Retirer</button>
      </span>
      <p class="help">${enabled ? help(instance, plugin) : 'Contrainte coupée : le texte passe tel quel.'}</p>
    </li>
  ` as VNode;
}

/**
 * La chaîne, au-dessus des pistes : les contraintes dans l'ordre où le texte les traverse, une ligne
 * de même largeur chacune ; en dessous, le navigateur qui en ajoute en fin de chaîne.
 */
export function Chain({ instances, plugins, recipes = [], now, lookup, dispatch, status = '' }: ChainProps): VNode {
  const ids = instances.map((instance) => instance.id);
  return html`
    <section class="chain" aria-labelledby="chain-title">
      <h2 class="silk" id="chain-title">Contraintes</h2>
      <p class="summary" role="status" aria-live="polite">${status}</p>
      ${instances.length
        ? html`<ol class="slots">
            ${instances.map(
              (instance, position) => html`<${Row} key=${instance.id} instance=${instance} position=${position} ids=${ids}
                plugin=${lookup(instance.type)} dispatch=${dispatch} />`,
            )}
          </ol>`
        : !status && html`<p class="more">Aucune contrainte : le texte passe tel quel.</p>`}
      <${Browser} recipes=${recipes} plugins=${plugins} dispatch=${dispatch} now=${now} />
    </section>
  ` as VNode;
}
