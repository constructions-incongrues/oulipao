import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { CATEGORIES } from '../../domain/categories.ts';
import { audibleCategories } from '../../domain/mixing.ts';
import { PluginSlot } from './components/plugin-slot.ts';
import { Result } from './components/result.ts';
import { Score } from './components/score.ts';
import { Strip } from './components/strip.ts';
import type { TracksController, TracksState } from './controller.ts';

export interface AppProps {
  state: TracksState;
  controller: Pick<TracksController, 'setInput' | 'run' | 'dispatch' | 'copy'>;
}

/** La page des pistes : saisie, table de mixage, partition, texte résultant. */
export function App({ state, controller }: AppProps): VNode {
  const { mixer, view, status } = state;
  return html`
    <main class="tracks">
      <h1>Potao — pistes</h1>
      <p>Le texte collé reste dans ce navigateur : il n'est envoyé nulle part.</p>
      <label for="input">Texte</label>
      <textarea id="input" placeholder="Collez un texte en français…" value=${state.input}
        onInput=${(event: Event) => controller.setInput((event.currentTarget as HTMLTextAreaElement).value)}></textarea>
      <div class="controls">
        <button type="button" class="run" disabled=${status === 'loading'} onClick=${() => void controller.run()}>Mettre en pistes</button>
        <span class=${`status ${status}`} role="status" aria-live="polite">${state.message}</span>
      </div>
      ${view &&
      html`
        <div class="workspace">
        <section class="mixer" aria-label="Table de mixage">
          ${CATEGORIES.map(
            (category) => html`
              <${Strip}
                category=${category}
                count=${view.counts[category]}
                track=${mixer.tracks[category]}
                onMute=${() => controller.dispatch({ type: 'toggle-mute', category })}
                onSolo=${() => controller.dispatch({ type: 'toggle-solo', category })}
              >
                ${category === 'noun'
                  ? html`<${PluginSlot}
                      plugin=${mixer.plugin}
                      onToggle=${() => controller.dispatch({ type: 'toggle-plugin' })}
                      onOffset=${(offset: number) => controller.dispatch({ type: 'set-offset', offset })}
                      onMode=${(mode: 'reagree' | 'same-gender') => controller.dispatch({ type: 'set-mode', mode })}
                    />`
                  : html`<${PluginSlot} />`}
              <//>
            `,
          )}
        </section>
        <div class="stage">
        <p class="summary">
          ${mixer.plugin.enabled ? `${view.replaced} noms remplacés sur ${view.nouns}.` : 'Plugin coupé : texte d’origine.'}
        </p>
        <${Score} layout=${view.layout} audible=${audibleCategories(mixer.tracks)} />
        <${Result} text=${view.result} copied=${state.copied} onCopy=${() => void controller.copy()} />
        </div>
        </div>
      `}
    </main>
  ` as VNode;
}
