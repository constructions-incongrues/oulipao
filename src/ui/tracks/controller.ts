import { tagText } from '../../domain/tagging.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { Tagger } from '../../ports/tagger.ts';
import { initialState, reduce } from './mixer-state.ts';
import type { MixerAction, MixerState } from './types.ts';
import { buildView, type Session, type TracksView } from './view-model.ts';

/** Ce dont la page a besoin de l'extérieur. */
export interface TracksDependencies {
  tagger: Tagger;
  loadMorphology: () => Promise<MorphologyRepository>;
  /** Place un texte dans le presse-papiers. */
  copy: (text: string) => Promise<void>;
  /** Largeur des systèmes de la partition, en caractères. */
  width?: number;
}

export interface TracksState {
  /** `idle` : rien d'étiqueté. `loading` : étiquetage et chargements en cours. */
  status: 'idle' | 'loading' | 'ready' | 'error';
  /** Message d'attente ou d'erreur. */
  message: string;
  /** Le texte saisi. */
  input: string;
  mixer: MixerState;
  view?: TracksView;
  /** Le texte résultant vient-il d'être copié ? */
  copied: boolean;
}

export interface TracksController {
  readonly state: TracksState;
  setInput(text: string): void;
  /** Étiquette le texte saisi et affiche la partition. */
  run(): Promise<void>;
  /** Applique un geste à la table et met la vue à jour, sans réétiqueter. */
  dispatch(action: MixerAction): void;
  copy(): Promise<void>;
}

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** L'état de la page des pistes et ses gestes ; `onChange` est appelé à chaque changement. */
export function createTracksController(dependencies: TracksDependencies, onChange: (state: TracksState) => void = () => {}): TracksController {
  let state: TracksState = { status: 'idle', message: '', input: '', mixer: initialState, copied: false };
  let session: Session | undefined;
  let morphology: MorphologyRepository | undefined;
  let runs = 0;

  const update = (patch: Partial<TracksState>) => {
    state = { ...state, ...patch };
    onChange(state);
  };

  return {
    get state() {
      return state;
    },
    setInput(text) {
      update({ input: text });
    },
    async run() {
      const text = state.input;
      if (!text.trim()) return update({ status: 'error', message: 'Collez d’abord un texte.' });
      const run = ++runs;
      update({ status: 'loading', message: 'Chargement du modèle et du dictionnaire, puis étiquetage…', copied: false });
      try {
        const [tagged, loaded] = await Promise.all([tagText(dependencies.tagger, text), dependencies.loadMorphology()]);
        if (run !== runs) return; // un essai plus récent a pris le relais
        session = { text, tagged };
        morphology = loaded;
        update({ status: 'ready', message: '', view: buildView(session, state.mixer, morphology, dependencies.width) });
      } catch (error) {
        if (run === runs) update({ status: 'error', message: `Échec : ${messageOf(error)}. Vous pouvez relancer.` });
      }
    },
    dispatch(action) {
      const mixer = reduce(state.mixer, action);
      const view = session && morphology ? buildView(session, mixer, morphology, dependencies.width) : state.view;
      update({ mixer, view, copied: false });
    },
    async copy() {
      if (!state.view) return;
      try {
        await dependencies.copy(state.view.result);
        update({ copied: true });
      } catch (error) {
        update({ status: 'error', message: `Copie impossible : ${messageOf(error)}` });
      }
    },
  };
}
