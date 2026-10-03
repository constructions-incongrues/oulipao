import { tagText } from '../../domain/tagging.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { Tagger } from '../../ports/tagger.ts';
import { initialState, reduce } from './mixer-state.ts';
import type { MixerAction, MixerState } from './types.ts';
import { buildView, changedWords, ruleMention, type Session, type TracksView } from './view-model.ts';

/** Ce dont la page a besoin de l'extérieur. */
export interface TracksDependencies {
  tagger: Tagger;
  loadMorphology: () => Promise<MorphologyRepository>;
  /** Télécharge le modèle d'étiquetage, en signalant l'avancement en octets. */
  preload: (onProgress: (loaded: number, total: number) => void) => Promise<void>;
  /** Place un texte dans le presse-papiers. */
  copy: (text: string) => Promise<void>;
  /** Le navigateur demande-t-il d'économiser les données ? Alors le modèle attend un clic. */
  saveData?: boolean;
}

/** Le chargement du modèle et du dictionnaire. */
export interface ModelState {
  /** `waiting` : pas encore demandé (économie de données). */
  status: 'waiting' | 'loading' | 'ready' | 'error';
  /** Octets reçus et attendus ; `total` vaut 0 tant que la taille n'est pas connue. */
  loaded: number;
  total: number;
  error: string;
}

export interface TracksState {
  /** Le texte saisi. */
  input: string;
  /** La saisie est-elle dépliée ? Elle se replie une fois le texte mis en pistes. */
  editing: boolean;
  /** Étiquetage en cours. */
  tagging: boolean;
  /** Message de la zone de saisie : texte vide, échec de l'étiquetage. */
  inputMessage: string;
  model: ModelState;
  mixer: MixerState;
  view?: TracksView;
  /** Le texte saisi a changé depuis la mise en pistes : la vue ne lui correspond plus. */
  stale: boolean;
  /** Les mots du texte résultant qui viennent de changer, et le numéro de ce changement. */
  changed: ReadonlySet<number>;
  generation: number;
  /** Message à côté du bouton de copie. */
  copyMessage: string;
  /** Le mot d'origine ouvert dans l'inspecteur ; aucun : l'inspecteur est fermé. */
  selected?: number;
}

export interface TracksController {
  readonly state: TracksState;
  /** À l'ouverture : lance le préchargement, sauf si le navigateur demande d'économiser les données. */
  start(): void;
  /** Télécharge le modèle et le dictionnaire ; relance après un échec. */
  preload(): Promise<void>;
  setInput(text: string): void;
  /** Rouvre la saisie repliée. */
  edit(): void;
  /** Étiquette le texte saisi et affiche le texte résultant. */
  run(): Promise<void>;
  /** Place le texte d'exemple dans la saisie et le met en pistes. */
  example(): Promise<void>;
  /** Applique un geste à la table et met la vue à jour, sans réétiqueter. */
  dispatch(action: MixerAction): void;
  /** Ouvre l'inspecteur sur un mot d'origine. */
  select(index: number): void;
  /** Passe au mot d'origine précédent ou suivant, sans sortir du texte. */
  step(delta: number): void;
  closeInspector(): void;
  copy(): Promise<void>;
}

/** Un texte d'exemple, écrit pour Potao. */
export const EXAMPLE_TEXT =
  "Le matin où la vieille horloge du village s'arrêta, personne ne le remarqua vraiment. Le boulanger ouvrit sa boutique à l'heure habituelle, les enfants coururent vers l'école, et le chat du notaire dormit au soleil sur le mur de la mairie.";

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** L'état de la page des pistes et ses gestes ; `onChange` est appelé à chaque changement. */
export function createTracksController(dependencies: TracksDependencies, onChange: (state: TracksState) => void = () => {}): TracksController {
  let state: TracksState = {
    input: '',
    editing: true,
    tagging: false,
    inputMessage: '',
    model: { status: 'waiting', loaded: 0, total: 0, error: '' },
    mixer: initialState,
    stale: false,
    changed: new Set(),
    generation: 0,
    copyMessage: '',
  };
  let session: Session | undefined;
  let morphology: MorphologyRepository | undefined;
  let loading: Promise<void> | undefined;
  let runs = 0;

  const update = (patch: Partial<TracksState>) => {
    state = { ...state, ...patch };
    onChange(state);
  };
  const setModel = (patch: Partial<ModelState>) => update({ model: { ...state.model, ...patch } });

  /** Rejoue la vue après un geste ; les mots qui ont changé s'éclairent. */
  const rebuild = (patch: Partial<TracksState>) => {
    const mixer = patch.mixer ?? state.mixer;
    if (!session || !morphology) return update(patch);
    const view = buildView(session, mixer, morphology);
    const changed = changedWords(state.view, view);
    update({ ...patch, view, changed, generation: state.generation + 1, copyMessage: '' });
  };

  const controller: TracksController = {
    get state() {
      return state;
    },
    start() {
      if (!dependencies.saveData) void controller.preload();
    },
    preload() {
      if (state.model.status === 'ready') return Promise.resolve();
      return (loading ??= (async () => {
        setModel({ status: 'loading', loaded: 0, total: 0, error: '' });
        try {
          const [, loaded] = await Promise.all([
            dependencies.preload((bytes, total) => setModel({ loaded: bytes, total })),
            dependencies.loadMorphology(),
          ]);
          morphology = loaded;
          setModel({ status: 'ready' });
        } catch (error) {
          setModel({ status: 'error', error: `Échec : ${messageOf(error)}. Vous pouvez relancer.` });
        } finally {
          loading = undefined;
        }
      })());
    },
    setInput(text) {
      update({ input: text, stale: session !== undefined && text !== session.text });
    },
    edit() {
      update({ editing: true });
    },
    async run() {
      const text = state.input;
      if (!text.trim()) return update({ inputMessage: 'Collez d’abord un texte.' });
      const run = ++runs;
      update({ tagging: true, inputMessage: '', copyMessage: '' });
      await controller.preload();
      if (run !== runs) return; // un essai plus récent a pris le relais
      if (state.model.status !== 'ready') return update({ tagging: false });
      try {
        const tagged = await tagText(dependencies.tagger, text);
        if (run !== runs) return;
        session = { text, tagged };
        const view = buildView(session, state.mixer, morphology!);
        // Nouvel étiquetage, nouvelles positions : l'inspecteur se ferme.
        update({ tagging: false, editing: false, stale: state.input !== text, view, changed: new Set(), generation: state.generation + 1, selected: undefined });
      } catch (error) {
        if (run === runs) update({ tagging: false, inputMessage: `Échec de l’étiquetage : ${messageOf(error)}. Vous pouvez relancer.` });
      }
    },
    example() {
      controller.setInput(EXAMPLE_TEXT);
      return controller.run();
    },
    dispatch(action) {
      rebuild({ mixer: reduce(state.mixer, action) });
    },
    select(index) {
      update({ selected: index });
    },
    step(delta) {
      if (state.selected === undefined || !state.view) return;
      update({ selected: Math.min(Math.max(state.selected + delta, 0), state.view.tracks.length - 1) });
    },
    closeInspector() {
      update({ selected: undefined });
    },
    async copy() {
      const view = state.view;
      if (!view || state.stale || view.empty) return;
      try {
        await dependencies.copy(view.result + ruleMention(state.mixer, view.audible));
        update({ copyMessage: 'Copié.' });
      } catch (error) {
        update({ copyMessage: `Copie impossible : ${messageOf(error)}` });
      }
    },
  };
  return controller;
}
