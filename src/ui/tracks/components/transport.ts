import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { TEMPO_MAX, TEMPO_MIN, type VoiceSource } from '../../../ports/monitoring-preferences.ts';
import type { Voice } from '../../../ports/speech.ts';
import { Control } from './control.ts';

export interface TransportProps {
  playing: boolean;
  tempo: number;
  voice?: string;
  /** Ce que dit la voix : le résultat, ou l'original (la discrépance). */
  source: VoiceSource;
  /** Les voix françaises du système ; aucune : l'écoute est impossible. */
  voices: readonly Voice[];
  onToggle: () => void;
  onTempo: (tempo: number) => void;
  onVoice: (voice: string) => void;
  onSource: (source: VoiceSource) => void;
}

/** Le transport de l'écoute, dans l'en-tête de la grille : lancer ou arrêter (barre d'espace), le tempo, la voix. */
export function Transport({ playing, tempo, voice, source, voices, onToggle, onTempo, onVoice, onSource }: TransportProps): VNode {
  const none = voices.length === 0;
  return html`
    <section class="transport" aria-label="Écoute">
      <span class="play-key">
        <button type="button" class="key play" aria-pressed=${playing} disabled=${none} aria-keyshortcuts=${none ? undefined : 'Space'} onClick=${onToggle}>${playing ? 'Arrêter' : 'Écouter'}</button>
        ${!none && html`<kbd class="shortcut" aria-hidden="true">Espace</kbd>`}
      </span>
      ${none
        ? html`<p class="transport-note">Aucune voix française n’est installée sur ce système : l’écoute est impossible.</p>`
        : html`<label class="silk">Tempo <${Control} parameter=${{ kind: 'integer', key: 'tempo', label: 'Tempo', min: TEMPO_MIN, max: TEMPO_MAX }} value=${tempo}
              onParam=${(_: string, value: number | string) => onTempo(Number(value))} /></label>
            <label class="silk">Voix <${Control} parameter=${{ kind: 'choice', key: 'voice', label: 'Voix', options: voices.map(({ id, name }) => ({ value: id, label: name })) }}
              value=${voice ?? voices[0]!.id} onParam=${(_: string, value: number | string) => onVoice(String(value))} /></label>
            <label class="silk">La voix dit <${Control} parameter=${{ kind: 'choice', key: 'source', label: 'La voix dit', options: [{ value: 'result', label: 'le résultat' }, { value: 'original', label: 'l’original' }] }}
              value=${source} onParam=${(_: string, value: number | string) => onSource(value as VoiceSource)} /></label>`}
    </section>
  ` as VNode;
}
