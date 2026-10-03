import { tagText } from '../../domain/tagging.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { Tagger } from '../../ports/tagger.ts';
import type { VerbRepository } from '../../ports/verbs.ts';
import { initialState, reduce } from './mixer-state.ts';
import type { MixerAction, MixerState } from './types.ts';
import { buildView, changedWords, pageOf, ruleMention, stepsPerPage, type Session, type TracksView } from './view-model.ts';

/** Ce dont la page a besoin de l'extérieur. */
export interface TracksDependencies {
  tagger: Tagger;
  loadMorphology: () => Promise<MorphologyRepository>;
  /** Les verbes, demandés seulement quand une instance active vise leur piste. */
  loadVerbs?: () => Promise<VerbRepository>;
  /** Télécharge le modèle d'étiquetage, en signalant l'avancement en octets. */
  preload: (onProgress: (loaded: number, total: number) => void) => Promise<void>;
  /** Place un texte dans le presse-papiers. */
  copy: (text: string) => Promise<void>;
}

/** Le chargement du modèle et du dictionnaire. */
export interface ModelState {
  /** `waiting` : pas encore demandé ; rien ne part vers les tiers avant le premier clic. */
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
  /** Le chargement des verbes : `idle` tant qu'aucune instance ne les vise. */
  verbs: { status: 'idle' | 'loading' | 'ready' | 'error'; error: string };
  /** Le mot d'origine ouvert dans l'inspecteur ; aucun : l'inspecteur est fermé. */
  selected?: number;
  /** La grille : pas par page (selon sa largeur) et page affichée. */
  perPage: number;
  page: number;
  /** La bande du texte résultant est collée en haut de l'écran : elle se fait compacte. */
  pinned: boolean;
}

export interface TracksController {
  readonly state: TracksState;
  /** Télécharge le modèle et le dictionnaire, au premier clic ; relance après un échec. */
  preload(): Promise<void>;
  setInput(text: string): void;
  /** Rouvre la saisie repliée. */
  edit(): void;
  /** Étiquette le texte saisi et affiche le texte résultant. */
  run(): Promise<void>;
  /** Place le texte d'exemple dans la saisie et le met en pistes. */
  example(): Promise<void>;
  /** Charge les verbes ; relance après un échec. Le texte résultant se recalcule à leur arrivée. */
  loadVerbs(): Promise<void>;
  /** Applique un geste à la table et met la vue à jour, sans réétiqueter. */
  dispatch(action: MixerAction): void;
  /** Ouvre l'inspecteur sur un mot d'origine. */
  select(index: number): void;
  /** Passe au mot d'origine précédent ou suivant, sans sortir du texte ; la grille suit sa page. */
  step(delta: number): void;
  /**
   * Un raccourci de l'inspecteur, où que soit le focus : une flèche l'ouvre (premier mot de la
   * page affichée) ou passe au mot voisin, Échap le ferme. Rien avant la mise en pistes ni quand
   * la frappe va dans un champ ; rend `true` si la touche a servi.
   */
  shortcut(key: string, inField: boolean): boolean;
  closeInspector(): void;
  copy(): Promise<void>;
  /** La grille a changé de largeur : le pas qui était en tête de page reste visible. */
  resize(width: number): void;
  /** Affiche une page de la grille, bornée aux pages existantes. */
  showPage(page: number): void;
  /** La bande du texte résultant vient de se coller en haut de l'écran, ou de se décoller. */
  pin(pinned: boolean): void;
}

/** Un texte d'exemple, écrit pour Oulipao. */
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
    verbs: { status: 'idle', error: '' },
    perPage: 16,
    page: 0,
    pinned: false,
  };
  let session: Session | undefined;
  let morphology: MorphologyRepository | undefined;
  let verbs: VerbRepository | undefined;
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
    const view = buildView(session, mixer, morphology, undefined, verbs);
    const changed = changedWords(state.view, view);
    update({ ...patch, view, changed, generation: state.generation + 1, copyMessage: '' });
    wantVerbs(mixer);
  };

  /** Une instance active vise les verbes pour la première fois : on les charge, sans attendre. */
  const wantVerbs = (mixer: MixerState) => {
    if (state.verbs.status === 'idle' && mixer.instances.some((instance) => instance.enabled && instance.targets.includes('verb'))) void controller.loadVerbs();
  };

  const controller: TracksController = {
    get state() {
      return state;
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
        // Nouvel étiquetage, nouvelles positions : les pas se rouvrent, les verrous tombent, l'inspecteur se ferme.
        const mixer = reduce(state.mixer, { type: 'reset-steps' });
        const view = buildView(session, mixer, morphology!, undefined, verbs);
        update({ tagging: false, editing: false, stale: state.input !== text, mixer, view, changed: new Set(), generation: state.generation + 1, selected: undefined, page: 0 });
        wantVerbs(mixer);
      } catch (error) {
        if (run === runs) update({ tagging: false, inputMessage: `Échec de l’étiquetage : ${messageOf(error)}. Vous pouvez relancer.` });
      }
    },
    example() {
      controller.setInput(EXAMPLE_TEXT);
      return controller.run();
    },
    async loadVerbs() {
      if (!dependencies.loadVerbs || state.verbs.status === 'loading' || state.verbs.status === 'ready') return;
      update({ verbs: { status: 'loading', error: '' } });
      try {
        verbs = await dependencies.loadVerbs();
        update({ verbs: { status: 'ready', error: '' } });
        rebuild({});
      } catch (error) {
        update({ verbs: { status: 'error', error: `Échec du chargement des verbes : ${messageOf(error)}.` } });
      }
    },
    dispatch(action) {
      rebuild({ mixer: reduce(state.mixer, action) });
    },
    select(index) {
      // La grille montre la page du mot choisi.
      update({ selected: index, page: pageOf(index, state.perPage) });
    },
    step(delta) {
      if (state.selected === undefined || !state.view) return;
      const selected = Math.min(Math.max(state.selected + delta, 0), state.view.tracks.length - 1);
      update({ selected, page: pageOf(selected, state.perPage) });
    },
    shortcut(key, inField) {
      if (inField || !state.view) return false;
      const delta = ({ ArrowLeft: -1, ArrowRight: 1 } as Record<string, number>)[key];
      // Inspecteur fermé : une flèche l'ouvre sur le premier mot de la page affichée.
      if (delta && state.selected === undefined) controller.select(Math.min(state.page * state.perPage, state.view.tracks.length - 1));
      else if (delta) controller.step(delta);
      else if (key === 'Escape' && state.selected !== undefined) controller.closeInspector();
      else return false;
      return true;
    },
    closeInspector() {
      update({ selected: undefined });
    },
    resize(width) {
      const perPage = stepsPerPage(width);
      if (perPage === state.perPage) return;
      update({ perPage, page: pageOf(state.page * state.perPage, perPage) });
    },
    showPage(page) {
      const words = state.view?.tracks.length ?? 0;
      const last = Math.max(0, Math.ceil(words / state.perPage) - 1);
      update({ page: Math.min(Math.max(page, 0), last) });
    },
    pin(pinned) {
      if (pinned !== state.pinned) update({ pinned });
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
