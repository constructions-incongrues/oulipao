import { originalWordsAtStep, wordsAtStep } from '../../domain/monitoring.ts';
import { tokenize } from '../../domain/tokenizer.ts';
import { DEFAULT_PREFERENCES, MonitoringPreferencesSchema, tempoTiming, type MonitoringPreferencesStorage, type VoiceSource } from '../../ports/monitoring-preferences.ts';
import type { Speech } from '../../ports/speech.ts';
import type { TracksState } from './controller.ts';

/** Ce dont l'écoute a besoin de l'extérieur. */
export interface ListeningDependencies {
  /** La voix ; absente : pas d'écoute. */
  speech?: Speech;
  /** Les réglages gardés ; absents : réglages par défaut, perdus au rechargement. */
  preferences?: MonitoringPreferencesStorage;
  /** Attend un blanc, en millisecondes. */
  sleep: (ms: number) => Promise<void>;
}

/** Ce que la page prête à l'écoute : son état. */
export interface ListeningHost {
  readonly state: TracksState;
  update(patch: Partial<TracksState>): void;
}

export interface ListeningController {
  play(): void;
  stop(): void;
  toggle(): void;
  setTempo(tempo: number): void;
  setVoice(voice: string): void;
  setSource(source: VoiceSource): void;
}

/** Les réglages de l'écoute au démarrage : tempo, voix et source gardés, voix du système. */
export function initialListening({ speech, preferences }: ListeningDependencies): Pick<TracksState, 'playing' | 'tempo' | 'voice' | 'source' | 'voices'> {
  const saved = preferences?.load() ?? DEFAULT_PREFERENCES;
  return { playing: false, tempo: saved.tempo, voice: saved.voice, source: saved.source, voices: speech?.voices() ?? [] };
}

/** L'écoute : lire la page affichée en boucle, l'arrêter, régler tempo et voix. */
export function createListeningController(host: ListeningHost, { speech, preferences, sleep }: ListeningDependencies): ListeningController {
  // Le numéro de l'écoute en cours : arrêter le change, et la boucle d'avant s'éteint d'elle-même.
  let playback = 0;

  /**
   * À chaque pas, l'écoute relit l'état (vue, page, tempo, voix), dit les mots du pas ou se tait,
   * attend un blanc, puis passe au suivant : elle lit tout le texte, la grille suit sa page, et elle
   * reprend au début après le dernier mot. Une page choisie à la main la fait repartir de son premier
   * pas. Un réglage changé s'entend donc au pas suivant, sans revenir au début.
   */
  const listen = async (token: number) => {
    let at = host.state.page * host.state.perPage;
    // La page que l'écoute a montrée elle-même : une autre page est un choix de l'utilisateur.
    let own = host.state.page;
    while (token === playback) {
      const { state } = host;
      const loop = state.loop;
      if (loop && loop.shown !== 1) {
        // Un autre tour que le tour 1 : la voix lit son texte mot à mot, sans pas de la grille, à la même place.
        const words = tokenize(loop.tours[loop.shown]!.text);
        if (!words.length) return controller.stop();
        if (at >= words.length) at = 0;
        host.update({ playhead: undefined, spoken: at });
        const { rate, gap } = tempoTiming(state.tempo);
        await speech!.speak([words[at]!.word], { rate, voice: state.voice });
        if (token !== playback) return;
        await sleep(gap);
        at++;
        continue;
      }
      if (state.spoken !== undefined) host.update({ spoken: undefined });
      const total = state.view?.tracks.length ?? 0;
      if (!total) return controller.stop();
      const first = state.page * state.perPage;
      if (state.page !== own && (at < first || at >= first + state.perPage)) at = first; // page choisie à la main
      if (at >= total) at = 0; // après le dernier mot, le début
      own = Math.floor(at / state.perPage);
      host.update({ playhead: at, ...(own !== state.page && { page: own }) });
      const { rate, gap } = tempoTiming(host.state.tempo);
      const view = host.state.view!;
      // La discrépance : la voix dit l'original pendant que la page montre le résultat.
      const original = host.state.source === 'original';
      if (original && !host.state.discrepant) host.update({ discrepant: true });
      const words = original ? originalWordsAtStep(view.stages[0]!.words[at]!.output, view.tracks[at]!, view.audible) : wordsAtStep(view.segments, at);
      if (words.length) await speech!.speak(words, { rate, voice: host.state.voice });
      if (token !== playback) return;
      await sleep(gap);
      at++;
    }
  };

  const save = () => preferences?.save(MonitoringPreferencesSchema.parse({ tempo: host.state.tempo, voice: host.state.voice, source: host.state.source }));

  speech?.onVoices(() => host.update({ voices: speech.voices() }));

  const controller: ListeningController = {
    play() {
      const { state } = host;
      if (state.playing || !speech || !state.view || !state.voices.length) return;
      host.update({ playing: true, listened: true });
      void listen(++playback);
    },
    stop() {
      if (!host.state.playing) return;
      playback++;
      speech!.cancel();
      host.update({ playing: false, playhead: undefined, spoken: undefined });
    },
    toggle() {
      if (host.state.playing) controller.stop();
      else controller.play();
    },
    setTempo(tempo) {
      if (!MonitoringPreferencesSchema.shape.tempo.safeParse(tempo).success) return;
      host.update({ tempo });
      save();
    },
    setVoice(voice) {
      if (!host.state.voices.some((candidate) => candidate.id === voice)) return;
      host.update({ voice });
      save();
    },
    setSource(source) {
      if (source !== 'result' && source !== 'original') return;
      host.update({ source });
      save();
    },
  };
  return controller;
}
