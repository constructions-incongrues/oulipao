import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { CATEGORIES } from '../../domain/categories.ts';
import { audibleCategories } from '../../domain/mixing.ts';
import { Rack } from './components/rack.ts';
import { Result } from './components/result.ts';
import { Inspector } from './components/inspector.ts';
import { Source } from './components/source.ts';
import { Strip } from './components/strip.ts';
import type { TracksController, TracksState } from './controller.ts';
import { installedPlugins, pluginById } from './mixer-state.ts';
import { inspectorWindow, summarize } from './view-model.ts';

export interface AppProps {
  state: TracksState;
  controller: Pick<TracksController, 'setInput' | 'edit' | 'run' | 'example' | 'preload' | 'dispatch' | 'select' | 'step' | 'closeInspector' | 'copy'>;
}

/**
 * La page des pistes : la saisie en tête ; puis la table de mixage à gauche et, à droite, le
 * texte résultant et, dessous, l'inspecteur du mot choisi.
 */
export function App({ state, controller }: AppProps): VNode {
  const { mixer, view, stale } = state;
  const audible = view?.audible ?? audibleCategories(mixer.tracks);
  return html`
    <main class="tracks">
      <h1>Potao</h1>
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
      <div class="workspace">
        <section class="mixer" aria-label="Table de mixage">
          ${CATEGORIES.map(
            (category) => html`
              <${Strip}
                category=${category}
                count=${view?.counts[category] ?? 0}
                track=${mixer.tracks[category]}
                onMute=${() => controller.dispatch({ type: 'toggle-mute', category })}
                onSolo=${() => controller.dispatch({ type: 'toggle-solo', category })}
                reminders=${mixer.instances.flatMap((instance, position) =>
                  instance.targets.includes(category)
                    ? [`${position + 1}. ${pluginById(instance.type).title(instance.params)}${instance.enabled ? '' : ' (coupé)'}`]
                    : [],
                )}
              />
            `,
          )}
          <${Rack} instances=${mixer.instances} plugins=${installedPlugins} lookup=${pluginById} dispatch=${controller.dispatch} />
          <p class="more">D'autres contraintes viendront.</p>
        </section>
        <div class="stage">
          ${stale &&
          html`<p class="stale-bar">Texte modifié — <button type="button" class="rerun" onClick=${() => void controller.run()}>remettre en pistes</button></p>`}
          <p class="summary" role="status" aria-live="polite">${view ? summarize(mixer, view) : ''}</p>
          ${view &&
          html`<${Result}
            segments=${view.segments}
            empty=${view.empty}
            marks=${view.marks}
            tracks=${view.tracks}
            selected=${state.selected}
            onSelect=${controller.select}
            changed=${state.changed}
            generation=${state.generation}
            audibleCount=${audible.size}
            stale=${stale}
            copyMessage=${state.copyMessage}
            onCopy=${() => void controller.copy()}
          />`}
          ${view &&
          (state.selected === undefined
            ? html`<p class="inspector-hint">Cliquez un mot pour voir ce que chaque filtre en a fait.</p>`
            : html`<${Inspector}
                window=${inspectorWindow(view, state.selected, 6)}
                word=${view.stages[0]!.words[state.selected]}
                onStep=${controller.step}
                onClose=${controller.closeInspector}
              />`)}
        </div>
      </div>
    </main>
  ` as VNode;
}
