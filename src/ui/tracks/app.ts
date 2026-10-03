import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { CATEGORIES, type Category } from '../../domain/categories.ts';
import { audibleCategories } from '../../domain/mixing.ts';
import { Chain } from './components/chain.ts';
import { Inspector } from './components/inspector.ts';
import { Result } from './components/result.ts';
import { Source } from './components/source.ts';
import { StepGrid } from './components/step-grid.ts';
import { ThemeToggle } from './components/theme-toggle.ts';
import type { TracksController, TracksState } from './controller.ts';
import { installedPlugins, pluginById } from './mixer-state.ts';
import { gridSteps, inspectorLocks, inspectorWindow, summarize } from './view-model.ts';

/** Le dépôt du code d'Oulipao, ouvert sous licence MIT. */
export const SOURCE_URL = 'https://github.com/constructions-incongrues/oulipao';

export interface AppProps {
  state: TracksState;
  controller: Pick<
    TracksController,
    'setInput' | 'edit' | 'run' | 'example' | 'preload' | 'loadVerbs' | 'dispatch' | 'select' | 'step' | 'closeInspector' | 'copy' | 'showPage'
  >;
  /** Bascule le thème clair ou sombre ; posé par le montage, qui seul touche au document. */
  onTheme?: () => void;
}

/**
 * La page des pistes, de haut en bas : le texte résultant (collé en haut de l'écran quand on
 * descend), la saisie, la chaîne de contraintes, la grille des pistes, puis l'inspecteur.
 */
export function App({ state, controller, onTheme = () => {} }: AppProps): VNode {
  const { mixer, view, stale } = state;
  const audible = view?.audible ?? audibleCategories(mixer.tracks);
  const words = view?.stages[0]!.words ?? [];
  const steps = view ? gridSteps(mixer, view.tracks, words) : [];
  const reminders = Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      mixer.instances.flatMap((instance, position) =>
        instance.targets.includes(category) ? [`${position + 1}. ${pluginById(instance.type).title(instance.params)}${instance.enabled ? '' : ' (coupé)'}`] : [],
      ),
    ]),
  ) as Record<Category, string[]>;
  const selected = state.selected;
  return html`
    <main class="tracks">
      <header class="bar">
        <h1>Oulipao</h1>
        <span class="silk">Ouvroir de littérature potentielle assistée par ordinateur</span>
        <a class="key source-link" href=${SOURCE_URL}>Code source</a>
        <${ThemeToggle} onToggle=${onTheme} />
      </header>
      <div class="pin-sentinel" aria-hidden="true"></div>
      ${view &&
      html`<${Result}
        segments=${view.segments}
        empty=${view.empty}
        marks=${view.marks}
        tracks=${view.tracks}
        selected=${selected}
        onSelect=${controller.select}
        changed=${state.changed}
        generation=${state.generation}
        audibleCount=${audible.size}
        stale=${stale}
        pinned=${state.pinned}
        copyMessage=${state.copyMessage}
        onCopy=${() => void controller.copy()}
      />`}
      <${Source}
        input=${state.input}
        words=${view ? Object.values(view.counts).reduce((a, b) => a + b, 0) : 0}
        editing=${state.editing}
        started=${view !== undefined}
        tagging=${state.tagging}
        message=${state.inputMessage}
        model=${state.model}
        onInput=${controller.setInput}
        onEdit=${controller.edit}
        onRun=${() => void controller.run()}
        onExample=${() => void controller.example()}
        onLoad=${() => void controller.preload()}
      />
      ${stale &&
      html`<p class="stale-bar">Texte modifié — <button type="button" class="key rerun" onClick=${() => void controller.run()}>remettre en pistes</button></p>`}
      <p class="summary" role="status" aria-live="polite">${view ? summarize(mixer, view) : ''}</p>
      ${state.verbs.status === 'error' &&
      html`<p class="loading error" role="alert">${state.verbs.error} <button type="button" class="load" onClick=${() => void controller.loadVerbs()}>Relancer</button></p>`}
      <${Chain} instances=${mixer.instances} plugins=${installedPlugins} lookup=${pluginById} dispatch=${controller.dispatch} />
      <${StepGrid}
        steps=${steps}
        tracks=${mixer.tracks}
        audible=${audible}
        reminders=${reminders}
        perPage=${state.perPage}
        page=${state.page}
        selected=${selected}
        generation=${state.generation}
        onToggleStep=${(index: number) => controller.dispatch({ type: 'toggle-step', index })}
        onInspect=${controller.select}
        onMute=${(category: Category) => controller.dispatch({ type: 'toggle-mute', category })}
        onSolo=${(category: Category) => controller.dispatch({ type: 'toggle-solo', category })}
        onPage=${controller.showPage}
      />
      ${view &&
      (selected === undefined
        ? html`<p class="inspector-hint">Cliquez un mot pour voir ce que chaque contrainte en a fait.</p>`
        : html`<${Inspector}
            window=${inspectorWindow(view, selected, 6)}
            word=${words[selected]}
            step=${steps[selected]?.state}
            locks=${inspectorLocks(mixer, selected, view.tracks[selected]!)}
            onLock=${(id: string, key: string, value: number | undefined) =>
              controller.dispatch(value === undefined ? { type: 'clear-lock', id, index: selected, key } : { type: 'set-lock', id, index: selected, key, value })}
            onClose=${controller.closeInspector}
          />`)}
    </main>
  ` as VNode;
}
