import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { CATEGORIES } from '../../domain/categories.ts';
import { audibleCategories } from '../../domain/mixing.ts';
import { PluginSlot } from './components/plugin-slot.ts';
import { Result } from './components/result.ts';
import { EmptyScore, Score } from './components/score.ts';
import { Source } from './components/source.ts';
import { Strip } from './components/strip.ts';
import type { TracksController, TracksState } from './controller.ts';
import { summarize } from './view-model.ts';

export interface AppProps {
  state: TracksState;
  controller: Pick<TracksController, 'setInput' | 'edit' | 'run' | 'example' | 'preload' | 'dispatch' | 'toggleScore' | 'copy'>;
}

/**
 * La page des pistes : la saisie en tête ; puis la table de mixage à gauche et, à droite, le
 * texte résultant au-dessus de la partition.
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
              >
                ${category === 'noun' &&
                html`<${PluginSlot}
                  plugin=${mixer.plugin}
                  onToggle=${() => controller.dispatch({ type: 'toggle-plugin' })}
                  onOffset=${(offset: number) => controller.dispatch({ type: 'set-offset', offset })}
                  onMode=${(mode: 'reagree' | 'same-gender') => controller.dispatch({ type: 'set-mode', mode })}
                />`}
              <//>
            `,
          )}
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
            changed=${state.changed}
            generation=${state.generation}
            audibleCount=${audible.size}
            stale=${stale}
            copyMessage=${state.copyMessage}
            onCopy=${() => void controller.copy()}
          />`}
          <button type="button" class="score-toggle" aria-expanded=${state.scoreOpen} onClick=${controller.toggleScore}>
            ${state.scoreOpen ? 'Masquer la partition' : 'Voir la partition'}
          </button>
          <div class=${`score-frame ${state.scoreOpen ? '' : 'folded'} ${stale ? 'stale' : ''}`.replace(/\s+/g, ' ').trim()}>
            ${view ? html`<${Score} layout=${view.layout} audible=${audible} marks=${view.marks} />` : html`<${EmptyScore} />`}
          </div>
        </div>
      </div>
    </main>
  ` as VNode;
}
