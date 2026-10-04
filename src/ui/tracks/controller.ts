// La page des pistes : une façade qui garde l'état et compose deux contrôleurs.
//
//   app.ts ──► createTracksController (façade : saisie, étiquetage, table, inspecteur, grille)
//                ├─ createNotebookController  (notebook-controller.ts : garder, rouvrir, supprimer, importer…)
//                └─ createListeningController (listening-controller.ts : écoute, tempo, voix)
//
// Les deux contrôleurs lisent et changent l'état par la façade (`host`) ; seule elle le tient.
import type { MonitoringPreferencesStorage, VoiceSource } from '../../ports/monitoring-preferences.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { PhoneticsRepository } from '../../ports/phonetics.ts';
import type { ScaleRepository } from '../../ports/scales.ts';
import { StalledError } from '../../ports/stalled.ts';
import type { Speech, Voice } from '../../ports/speech.ts';
import type { Tagger } from '../../ports/tagger.ts';
import type { VerbRepository } from '../../ports/verbs.ts';
import { EXAMPLES } from './examples.ts';
import { createListeningController, initialListening } from './listening-controller.ts';
import { findRepeat } from '../../domain/loop.ts';
import { tokenize } from '../../domain/tokenizer.ts';
import { computeTour, loopFinished, replacedIn, type LoopState, type TourResources } from './loop.ts';
import { initialState, pluginById, reduce } from './mixer-state.ts';
import type { Lineage, NotebookEntry } from './notebook.ts';
import { cannotReopen, createNotebookController, initialNotebook, memoryNotebook, messageOf, reopenProblem, type NotebookDependencies } from './notebook-controller.ts';
import type { SharedEntry } from './share-link.ts';
import { MixerStateSchema, type MixerAction, type MixerState } from './types.ts';
import { buildView, changedWords, composeMention, pageOf, readsSyllables, ruleBody, ruleMention, stepsPerPage, withListening, type Session, type TracksView } from './view-model.ts';

/** Ce dont la page a besoin de l'extérieur. */
export interface TracksDependencies {
  tagger: Tagger;
  loadMorphology: () => Promise<MorphologyRepository>;
  /** Les verbes, demandés seulement quand une instance active vise leur piste. */
  loadVerbs?: () => Promise<VerbRepository>;
  /** Les prononciations, demandées seulement quand une instance active est un filtre phonétique. */
  loadPhonetics?: () => Promise<PhoneticsRepository>;
  loadScales?: () => Promise<ScaleRepository>;
  /** Télécharge le modèle d'étiquetage, en signalant l'avancement en octets. */
  preload: (onProgress: (loaded: number, total: number) => void) => Promise<void>;
  /** Place un texte dans le presse-papiers. */
  copy: (text: string) => Promise<void>;
  /** Le carnet et ce qu'il demande au navigateur ; absent : un carnet en mémoire, perdu au rechargement. */
  notebook?: NotebookDependencies;
  /** La voix de l'écoute ; absente : pas d'écoute. */
  speech?: Speech;
  /** Les réglages de l'écoute, gardés ; absents : réglages par défaut, perdus au rechargement. */
  preferences?: MonitoringPreferencesStorage;
  /** Attend un blanc, en millisecondes ; remplacé dans les tests. */
  sleep?: (ms: number) => Promise<void>;
  /** Laisse l'écran se repeindre avant le tour suivant de la boucle ; remplacé dans les tests. */
  nextFrame?: () => Promise<void>;
  /** L'entrée portée par le lien qui a ouvert la page ; rien : la page s'ouvre sans lien d'Oulipao. */
  arrival?: Promise<SharedEntry | 'unreadable' | undefined>;
}

/** Ce que dit la page quand le lien qui l'a ouverte est tronqué, abîmé, ou d'une autre version. */
export const UNREADABLE_LINK = 'Ce lien n’est pas lisible.';

export type { NotebookDependencies } from './notebook-controller.ts';

/** Un message d'erreur : une tête courte (en rouge et en gras), puis le détail (à l'encre). */
export interface ErrorText {
  lead: string;
  detail: string;
}

/** L'erreur d'un chargement : arrêté faute de données, ou échoué. `what` : « du modèle », « des verbes »… */
export function loadingError(error: unknown, what: string): ErrorText {
  if (error instanceof StalledError) {
    return { lead: `Le chargement ${error.resource} ne progresse plus.`, detail: `Rien reçu depuis ${error.seconds} secondes : la connexion est peut-être coupée.` };
  }
  return { lead: `Le chargement ${what} a échoué.`, detail: `${messageOf(error)}.` };
}

/** Le chargement du modèle et du dictionnaire. */
export interface ModelState {
  /** `waiting` : pas encore demandé ; rien ne part vers les tiers avant le premier clic. */
  status: 'waiting' | 'loading' | 'ready' | 'error';
  /** Octets reçus et attendus ; `total` vaut 0 tant que la taille n'est pas connue. */
  loaded: number;
  total: number;
  /** Présente quand le chargement a échoué. */
  error?: ErrorText;
}

/** Le chargement d'une textbank demandée à la volée. */
export interface Loading {
  status: 'idle' | 'loading' | 'ready' | 'error';
  error?: ErrorText;
}

export interface TracksState {
  /** Le texte saisi. */
  input: string;
  /** La saisie est-elle dépliée ? Elle se replie une fois le texte mis en pistes. */
  editing: boolean;
  /** Exemples déjà mis en pistes pendant la visite : le suivant est `EXAMPLES[examplesShown % EXAMPLES.length]`. */
  examplesShown: number;
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
  /** Message à côté du bouton de copie, et de celui qui garde. */
  copyMessage: string;
  /** Les textes gardés, du plus récent au plus ancien. */
  notebook: NotebookEntry[];
  /** Avis du carnet, discret : entrées illisibles conservées, import réussi, copie. */
  notebookMessage: string;
  /** Échec dans le carnet, annoncé : garder, rouvrir, supprimer, importer, retoucher, copier. */
  notebookError?: ErrorText;
  /** Le carnet survit-il à la fermeture de l'onglet ? `false` : stockage refusé, carnet de séance. */
  notebookPersistent: boolean;
  /** Le lien d'une entrée partagée, affiché à copier quand le presse-papiers l'a refusé. */
  sharedLink?: string;
  /** L'entrée reçue par un lien, montrée avant tout le reste ; aucune : pas de vue d'arrivée. */
  arrival?: SharedEntry;
  /** « Ce lien n'est pas lisible. », ou rien. */
  arrivalMessage: string;
  /** La raison pour laquelle l'entrée reçue ne peut pas être rejouée. */
  arrivalError?: ErrorText;
  /** Un texte en pistes a changé, par un geste, depuis la dernière garde ou réouverture. */
  unsaved: boolean;
  /** La filiation du texte en cours, né d'« Itérer » ou de « Figer » ; absente : première génération. */
  lineage?: Lineage;
  /** Le chargement des verbes : `idle` tant qu'aucune instance ne les vise. */
  verbs: Loading;
  /** Le chargement des prononciations : `idle` tant qu'aucun filtre phonétique n'est en marche. */
  phonetics: Loading;
  /** Le chargement des échelles affectives : `idle` tant qu'aucun S+n ne prend un autre ordre que le dictionnaire. */
  scales: Loading;
  /** Le mot d'origine ouvert dans l'inspecteur ; aucun : l'inspecteur est fermé. */
  selected?: number;
  /** La grille : pas par page (selon sa largeur) et page affichée. */
  perPage: number;
  page: number;
  /** La bande du texte résultant est collée en haut de l'écran : elle se fait compacte. */
  pinned: boolean;
  /** L'écoute est en marche. */
  playing: boolean;
  /** Le pas que dit l'écoute ; aucun : l'écoute est arrêtée. */
  playhead?: number;
  /** L'écoute a tourné depuis la dernière mise en pistes ou réouverture : la mention le dit. */
  listened: boolean;
  /** Dans le même temps, l'écoute a tourné en disant l'original : la mention dit « écouté en discrépance ». */
  discrepant: boolean;
  /** Ce que dit la voix : le texte résultant, ou l'original. */
  source: VoiceSource;
  /** Le tempo de l'écoute, de 1 à 5, et la voix choisie. */
  tempo: number;
  voice?: string;
  /** Les voix françaises du système ; aucune : pas d'écoute. */
  voices: Voice[];
  /** Le nombre de tours que lance « Boucler », de 2 à 12. */
  loopTours: number;
  /** La boucle de tours en cours ; aucune : le papier montre le résultat en cours. */
  loop?: LoopState;
  /** Le mot que dit l'écoute dans un tour autre que le tour 1, compté dans le texte de ce tour. */
  spoken?: number;
}

/** Les bornes du nombre de tours d'une boucle. */
export const LOOP_MIN = 2;
export const LOOP_MAX = 12; // ponytail: plafond qui tient une boucle à ~45 s sur 533 mots ; à relever si l'étiquetage passe dans un worker

export interface TracksController {
  readonly state: TracksState;
  /** Télécharge le modèle et le dictionnaire, au premier clic ; relance après un échec. */
  preload(): Promise<void>;
  setInput(text: string): void;
  /** Rouvre la saisie repliée. */
  edit(): void;
  /** Étiquette le texte saisi et affiche le texte résultant. */
  run(): Promise<void>;
  /** Place l'exemple suivant dans la saisie et le met en pistes, avec la même table ; après le dernier, revient au premier. */
  example(): Promise<void>;
  /** Charge les verbes ; relance après un échec. Le texte résultant se recalcule à leur arrivée. */
  loadVerbs(): Promise<void>;
  /** Charge les prononciations ; relance après un échec. Le texte résultant se recalcule à leur arrivée. */
  loadPhonetics(): Promise<void>;
  loadScales(): Promise<void>;
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
  /** Range le texte résultant dans le carnet, avec sa chaîne et de quoi le rouvrir ; rend l'identifiant gardé, rien en cas d'échec. */
  keep(): string | undefined;
  /** Garde le texte en cours s'il ne l'est pas, puis met en pistes son résultat avec la même table. */
  iterate(): Promise<void>;
  /** Garde le texte en cours s'il ne l'est pas, puis met en pistes son résultat, chaîne et forme vidées. */
  freeze(): Promise<void>;
  /** Garde le tour 1 s'il ne l'est pas, puis calcule les tours suivants ; relancée, reprend où elle s'était arrêtée. */
  loop(): Promise<void>;
  /** Arrête la boucle une fois le tour en cours fini. */
  stopLoop(): void;
  /** Montre un tour déjà calculé sur le papier ; le curseur cesse de suivre le calcul. */
  showTour(tour: number): void;
  /** Règle le nombre de tours ; une boucle en cours s'allonge ou se raccourcit. */
  setLoopTours(tours: number): void;
  /** Rouvre un texte gardé : son texte d'origine, son étiquetage et sa table, sans réétiqueter. */
  reopen(id: string): Promise<void>;
  /** Supprime un texte gardé, après confirmation. */
  remove(id: string): void;
  /** Propose le carnet entier en fichier. */
  exportNotebook(): void;
  /** Ajoute au carnet les entrées nouvelles d'un fichier exporté. */
  importNotebook(text: string): void;
  /** Copie une entrée d'un bloc : l'original, le résultat (retouché), la chaîne. */
  copyEntry(id: string): Promise<void>;
  shareEntry(id: string): Promise<void>;
  /** Rejoue l'entrée reçue par un lien : charge le modèle à ce premier clic, puis la rouvre dans la table. */
  replayArrival(): Promise<void>;
  /** Ferme la vue d'arrivée ; l'outil s'affiche tel qu'il l'aurait été sans le lien. */
  closeArrival(): void;
  /** Retouche le résultat d'une entrée ; vide ou égal au résultat produit, la retouche tombe. */
  editEntry(id: string, text: string): void;
  /** Relit le carnet gardé : un autre onglet vient de l'écrire. */
  syncNotebook(): void;
  /** La grille a changé de largeur : le pas qui était en tête de page reste visible. */
  resize(width: number): void;
  /** Affiche une page de la grille, bornée aux pages existantes. */
  showPage(page: number): void;
  /** La bande du texte résultant vient de se coller en haut de l'écran, ou de se décoller. */
  pin(pinned: boolean): void;
  /** Lance l'écoute de la page affichée, en boucle ; rien sans texte en pistes ni voix française. */
  play(): void;
  /** Arrête l'écoute ; la voix se tait aussitôt. */
  stop(): void;
  /** Lance ou arrête l'écoute. */
  toggle(): void;
  /** Règle le tempo de l'écoute, à partir du pas suivant. */
  setTempo(tempo: number): void;
  /** Choisit la voix de l'écoute, à partir du pas suivant. */
  setVoice(voice: string): void;
  /** Fait dire à la voix le résultat ou l'original (la discrépance), à partir du pas suivant. */
  setSource(source: VoiceSource): void;
}

/**
 * La barre d'espace sert-elle à l'écoute ? Oui hors d'un champ, une fois un texte en pistes, quand
 * une voix française existe — sur une touche focalisée aussi (spec `monitoring-vocal`). Sans voix,
 * elle garde son effet ordinaire : elle active la touche qui a le focus.
 */
export const claimsSpace = (state: Pick<TracksState, 'view' | 'voices'>, inField: boolean) => !inField && state.view !== undefined && state.voices.length > 0;

/** L'état de la page des pistes et ses gestes ; `onChange` est appelé à chaque changement. */
export function createTracksController(dependencies: TracksDependencies, onChange: (state: TracksState) => void = () => {}): TracksController {
  const notebook = dependencies.notebook ?? memoryNotebook();
  const sleep = dependencies.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const listeningDependencies = { speech: dependencies.speech, preferences: dependencies.preferences, sleep };
  let state: TracksState = {
    input: '',
    editing: true,
    examplesShown: 0,
    tagging: false,
    inputMessage: '',
    model: { status: 'waiting', loaded: 0, total: 0 },
    mixer: initialState,
    stale: false,
    changed: new Set(),
    generation: 0,
    copyMessage: '',
    arrivalMessage: '',
    ...initialNotebook(notebook),
    unsaved: false,
    verbs: { status: 'idle' },
    phonetics: { status: 'idle' },
    scales: { status: 'idle' },
    perPage: 16,
    page: 0,
    pinned: false,
    listened: false,
    discrepant: false,
    ...initialListening(listeningDependencies),
    loopTours: 4,
  };
  let session: Session | undefined;
  let morphology: MorphologyRepository | undefined;
  let verbs: VerbRepository | undefined;
  let phonetics: PhoneticsRepository | undefined;
  let scales: ScaleRepository | undefined;
  let loading: Promise<void> | undefined;
  let runs = 0;
  // L'entrée gardée ou rouverte en dernier : « Itérer » et « Figer » la reprennent comme parent si rien n'a changé depuis.
  let lastKept: string | undefined;
  // Le numéro de la boucle en cours : l'abandonner le change, et un tour en calcul n'est plus publié.
  let loopRun = 0;
  let stopRequested = false;
  // Le curseur se pose : après ce repos, les mots changés du tour montré s'éclairent (pas pendant un glissé).
  let rest: ReturnType<typeof setTimeout> | undefined;
  const REST = 150;
  const nextFrame =
    dependencies.nextFrame ??
    (() =>
      new Promise<void>((resolve) => {
        // Une image, puis la main rendue : l'avancement se peint avant l'étiquetage qui bloque. Onglet
        // caché, les images s'arrêtent : le délai de secours fait avancer la boucle quand même.
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => setTimeout(resolve, 0));
        setTimeout(resolve, 50);
      }));

  const update = (patch: Partial<TracksState>) => {
    state = { ...state, ...patch };
    onChange(state);
  };
  const setModel = (patch: Partial<ModelState>) => update({ model: { ...state.model, ...patch } });
  /** L'étiqueteur et les données déjà chargées, pour calculer un tour. */
  const resources = (): TourResources => ({ tagger: dependencies.tagger, morphology: morphology!, verbs, phonetics, scales });

  /** Rejoue la vue après un geste ; les mots qui ont changé s'éclairent. */
  const rebuild = (patch: Partial<TracksState>) => {
    const mixer = patch.mixer ?? state.mixer;
    if (!session || !morphology) return update(patch);
    const view = buildView(session, mixer, morphology, undefined, verbs, phonetics, scales);
    const changed = changedWords(state.view, view);
    update({ ...patch, view, changed, generation: state.generation + 1, copyMessage: patch.copyMessage ?? '' });
    wantResources(mixer);
  };

  /**
   * Une instance active vise les verbes, ou est un filtre phonétique, pour la première fois : on
   * charge ce qu'il lui faut, sans attendre.
   */
  const wantResources = (mixer: MixerState) => {
    const enabled = mixer.instances.filter((instance) => instance.enabled);
    if (state.verbs.status === 'idle' && enabled.some((instance) => instance.targets.includes('verb'))) void controller.loadVerbs();
    if (state.phonetics.status === 'idle' && enabled.some((instance) => pluginById(instance.type).phonetic || pluginById(instance.type).needsPhonetics?.(instance.params) || readsSyllables(instance))) void controller.loadPhonetics();
    if (state.scales.status === 'idle' && enabled.some((instance) => pluginById(instance.type).needsScales?.(instance.params))) void controller.loadScales();
  };

  /** La mention de la chaîne, avec « réglé en écoutant » si l'écoute a tourné. */
  const mention = (view: TracksView) =>
    withListening(composeMention(state.lineage?.passes ?? [], ruleBody(ruleMention(state.mixer, view.audible, undefined, view.folded))), state.listened, state.discrepant);

  /**
   * Met en pistes `text` : par la saisie, la filiation tombe ; par « Itérer » ou « Figer », elle
   * suit, et la table de départ est celle que le geste fournit.
   */
  const tagInto = async (text: string, mixer: MixerState, lineage?: Lineage) => {
    if (!text.trim()) return update({ inputMessage: 'Collez d’abord un texte.' });
    const run = ++runs;
    try {
      await tagAs(run, text, mixer, lineage);
    } finally {
      settle(run);
    }
  };

  /** Étiquette et met en pistes ; `run` numérote l'essai, un plus récent l'emporte. */
  const tagAs = async (run: number, text: string, mixer: MixerState, lineage?: Lineage) => {
    controller.stop();
    const abandoned = abandonLoop('nouvelle mise en pistes');
    update({ tagging: true, inputMessage: '', copyMessage: abandoned }); // la raison d'un abandon reste lisible
    await controller.preload();
    if (run !== runs || state.model.status !== 'ready') return; // relayé par un essai plus récent, ou modèle absent
    try {
      const tour = await computeTour(text, mixer, resources());
      if (run !== runs) return;
      session = tour.session;
      if (!lineage) lastKept = undefined;
      // Nouvel étiquetage, nouvelles positions : les pas se rouvrent, les verrous tombent, l'inspecteur se ferme.
      const { mixer: next, view } = tour;
      update({ tagging: false, editing: false, stale: state.input !== text, mixer: next, view, changed: new Set(), generation: state.generation + 1, selected: undefined, page: 0, unsaved: true, listened: false, discrepant: false, lineage });
      wantResources(next);
    } catch (error) {
      if (run === runs) update({ tagging: false, inputMessage: `Échec de l’étiquetage : ${messageOf(error)}. Vous pouvez relancer.` });
    }
  };

  /**
   * Abandonne la boucle : les tours calculés sont oubliés, un tour en calcul ne sera pas publié, et
   * le message de la bande dit pourquoi. Rend ce message ; rien sans boucle.
   */
  const abandonLoop = (reason: string) => {
    if (!state.loop) return '';
    loopRun++;
    const message = `Boucle abandonnée : ${reason}. Le tour 1 est au carnet.`;
    update({ loop: undefined, spoken: undefined, copyMessage: message });
    return message;
  };

  /** Le corps de la mention d'une passe de la table en cours, sur la vue donnée. */
  const passOf = (mixer: MixerState, view: TracksView) => ruleBody(ruleMention(mixer, view.audible, undefined, view.folded));

  /** Le tour montré, s'il est un tour k ≥ 2 de la boucle : son numéro, ses passes précédentes et sa mention. */
  const shownTour = () => {
    const loop = state.loop;
    if (!loop || loop.shown < 2 || loop.emptyAt === loop.shown) return undefined;
    const tour = loop.tours[loop.shown]!;
    const first = loop.tours[1]!;
    const pass = passOf(first.mixer!, first.view!);
    const passes = [...(state.lineage?.passes ?? []), ...Array<string>(pass ? loop.shown - 1 : 0).fill(pass)];
    const mention = withListening(composeMention(passes, passOf(tour.mixer!, tour.view!)), state.listened, state.discrepant);
    return { loop, tour, passes, mention };
  };

  /**
   * Garde le texte en cours s'il ne l'a pas été depuis sa mise en pistes, sa réouverture ou le dernier
   * geste ; sinon reprend l'entrée gardée en dernier. Rend son identifiant ; rien si la garde échoue.
   */
  const ensureKept = () => {
    const reuse = !state.unsaved && lastKept !== undefined && state.notebook.some((entry) => entry.id === lastKept);
    return reuse ? lastKept : controller.keep();
  };

  /** « Itérer » (la même table) ou « Figer » (chaîne et forme vidées, toutes les pistes audibles). */
  const nextGeneration = async (keepChain: boolean) => {
    const view = state.view;
    if (!view || !session || state.stale || view.empty || state.tagging) return;
    abandonLoop(keepChain ? '« Itérer »' : '« Figer »');
    const parent = ensureKept();
    if (!parent) return; // la garde a échoué : son message est affiché, rien ne bouge
    const pass = ruleBody(ruleMention(state.mixer, view.audible, undefined, view.folded));
    const lineage: Lineage = {
      parent,
      ancestor: state.lineage?.ancestor ?? session.text,
      passes: [...(state.lineage?.passes ?? []), ...(pass ? [pass] : [])],
    };
    const mixer = keepChain ? state.mixer : initialState;
    update({ input: view.result });
    await tagInto(view.result, mixer, lineage);
  };

  /** Calcule les tours manquants, un par un, en laissant l'écran se repeindre entre deux. */
  const runLoop = async () => {
    const run = ++loopRun;
    stopRequested = false;
    const base = state.loop!.tours[1]!.mixer!;
    update({ loop: { ...state.loop!, status: 'computing', error: undefined } });
    while (state.loop && !loopFinished(state.loop)) {
      const k = state.loop.tours.length;
      update({ loop: { ...state.loop, progress: k } });
      await nextFrame();
      if (run !== loopRun || !state.loop) return;
      if (stopRequested) return update({ loop: { ...state.loop, status: 'stopped', progress: undefined } });
      let computed;
      try {
        computed = await computeTour(state.loop.tours[k - 1]!.text, base, resources());
      } catch (error) {
        if (run === loopRun && state.loop) update({ loop: { ...state.loop, status: 'failed', progress: undefined, error: { lead: `Tour ${k} impossible :`, detail: `${messageOf(error)}. Boucler relance.` } } });
        return;
      }
      if (run !== loopRun || !state.loop) return; // abandonnée pendant l'étiquetage : rien n'est publié
      const text = computed.view.result;
      const tours = [...state.loop.tours, { text, ...computed }];
      const emptied = tokenize(text).length === 0;
      const repeat = emptied ? undefined : findRepeat(tours.map((tour) => tour.text));
      const follow = state.loop.follow;
      update({ loop: { ...state.loop, tours, shown: follow ? k : state.loop.shown, progress: undefined, repeat, ...(emptied && { emptyAt: k }) }, ...(follow && { changed: replacedIn(computed.view), generation: state.generation + 1 }) });
    }
    if (run === loopRun && state.loop) update({ loop: { ...state.loop, status: stopRequested ? 'stopped' : 'done', progress: undefined } });
  };

  const host = {
    get state() {
      return state;
    },
    update,
  };
  const listening = createListeningController(host, listeningDependencies);
  const notebookController = createNotebookController(
    {
      ...host,
      get state() {
        return state;
      },
      session: () => session,
      mention,
      restore: (entry) => restore(entry),
      onKept: (id) => void (lastKept = id),
      copy: (text) => dependencies.copy(text),
    },
    notebook,
  );

  /** L'essai le plus récent, fini quelle qu'en soit l'issue, rend le bouton « Mettre en pistes ». */
  const settle = (run: number) => {
    if (run === runs && state.tagging) update({ tagging: false });
  };

  /** Rouvre un texte gardé : son texte d'origine, son étiquetage et sa table, sans réétiqueter. */
  const restore = async (entry: NotebookEntry) => {
    const run = ++runs; // une mise en pistes en cours ne doit pas l'écraser
    try {
      await restoreAs(run, entry);
    } finally {
      settle(run);
    }
  };

  const restoreAs = async (run: number, entry: NotebookEntry) => {
    controller.stop();
    abandonLoop('un texte a été rouvert');
    update({ notebookMessage: '', notebookError: undefined, inputMessage: '', listened: false, discrepant: false });
    await controller.preload();
    if (run !== runs || !morphology) return;
    const mixer = MixerStateSchema.parse(entry.mixer);
    // Un texte gardé avant la normalisation peut être décomposé : texte et mots étiquetés passent en NFC.
    const source: Session = { text: entry.source.text.normalize('NFC'), tagged: entry.source.tagged.map((word) => ({ ...word, word: word.word.normalize('NFC') })) };
    let view: TracksView;
    try {
      // On reconstruit avant de toucher à la table : un échec la laisse telle quelle.
      view = buildView(source, mixer, morphology, undefined, verbs, phonetics, scales);
    } catch (error) {
      return update({ notebookError: cannotReopen(messageOf(error)) });
    }
    session = source;
    lastKept = entry.id;
    update({ input: session.text, tagging: false, editing: false, stale: false, mixer, view, changed: new Set(), generation: state.generation + 1, selected: undefined, page: 0, copyMessage: '', unsaved: false, lineage: entry.lineage });
    wantResources(mixer);
  };

  const controller: TracksController = {
    get state() {
      return state;
    },
    preload() {
      if (state.model.status === 'ready') return Promise.resolve();
      return (loading ??= (async () => {
        setModel({ status: 'loading', loaded: 0, total: 0, error: undefined });
        try {
          const [, loaded] = await Promise.all([
            dependencies.preload((bytes, total) => setModel({ loaded: bytes, total })),
            dependencies.loadMorphology(),
          ]);
          morphology = loaded;
          setModel({ status: 'ready' });
        } catch (error) {
          setModel({ status: 'error', error: loadingError(error, 'du modèle') });
        } finally {
          loading = undefined;
        }
      })());
    },
    setInput(raw) {
      // Un accent décomposé (« e » + accent combinant, fréquent depuis macOS) vaut la lettre précomposée.
      const text = raw.normalize('NFC');
      if (session && text !== session.text) abandonLoop('le texte a changé');
      update({ input: text, stale: session !== undefined && text !== session.text });
    },
    edit() {
      update({ editing: true });
    },
    run() {
      return tagInto(state.input, state.mixer);
    },
    example() {
      controller.setInput(EXAMPLES[state.examplesShown % EXAMPLES.length]!.text);
      update({ examplesShown: state.examplesShown + 1 });
      return controller.run();
    },
    async loadVerbs() {
      if (!dependencies.loadVerbs || state.verbs.status === 'loading' || state.verbs.status === 'ready') return;
      update({ verbs: { status: 'loading' } });
      try {
        verbs = await dependencies.loadVerbs();
        update({ verbs: { status: 'ready' } });
        rebuild({});
      } catch (error) {
        update({ verbs: { status: 'error', error: loadingError(error, 'des verbes') } });
      }
    },
    async loadPhonetics() {
      if (!dependencies.loadPhonetics || state.phonetics.status === 'loading' || state.phonetics.status === 'ready') return;
      update({ phonetics: { status: 'loading' } });
      try {
        phonetics = await dependencies.loadPhonetics();
        update({ phonetics: { status: 'ready' } });
        rebuild({});
      } catch (error) {
        update({ phonetics: { status: 'error', error: loadingError(error, 'des prononciations') } });
      }
    },
    async loadScales() {
      if (!dependencies.loadScales || state.scales.status === 'loading' || state.scales.status === 'ready') return;
      update({ scales: { status: 'loading' } });
      try {
        scales = await dependencies.loadScales();
        update({ scales: { status: 'ready' } });
        rebuild({});
      } catch (error) {
        update({ scales: { status: 'error', error: loadingError(error, 'des échelles') } });
      }
    },
    dispatch(action) {
      const abandoned = abandonLoop('la table a changé');
      // Seul un geste rend le travail « non gardé » : le chargement d'une textbank ne compte pas.
      rebuild({ mixer: reduce(state.mixer, action), unsaved: session !== undefined, copyMessage: abandoned });
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
      if (key === ' ') return claimsSpace(state, inField) && (controller.toggle(), true);
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
    play: listening.play,
    stop: listening.stop,
    toggle: listening.toggle,
    setTempo: listening.setTempo,
    setVoice: listening.setVoice,
    setSource: listening.setSource,
    keep() {
      if (state.loop?.shown === 0) return undefined; // le texte d'origine est déjà à la saisie
      const shown = shownTour();
      if (!shown) return state.loop && state.loop.shown !== 1 ? undefined : notebookController.keep();
      const { loop, tour, passes, mention } = shown;
      return notebookController.keepTour({
        result: tour.text,
        mention,
        source: tour.session,
        mixer: tour.mixer!,
        lineage: { parent: loop.firstKept, ancestor: state.lineage?.ancestor ?? loop.tours[0]!.text, passes },
        loop: { tours: loop.target, shown: loop.shown },
      });
    },
    async loop() {
      const view = state.view;
      if (!view || !session || state.stale || view.empty || state.tagging || state.loop?.status === 'computing') return;
      if (!state.loop) {
        const firstKept = ensureKept();
        if (!firstKept) return; // la garde a échoué : son message est affiché, rien ne bouge
        const origin = { text: session.text, session };
        update({ loop: { tours: [origin, { text: view.result, session, mixer: state.mixer, view }], target: state.loopTours, shown: 1, follow: true, status: 'computing', firstKept } });
      } else if (loopFinished(state.loop)) return;
      await runLoop();
    },
    stopLoop() {
      if (state.loop?.status === 'computing') stopRequested = true;
    },
    showTour(tour) {
      const loop = state.loop;
      if (!loop || !Number.isInteger(tour) || tour < 0 || tour >= loop.tours.length) return;
      update({ loop: { ...loop, shown: tour, follow: false } });
      clearTimeout(rest);
      rest = setTimeout(() => {
        const view = state.loop?.shown === tour && tour >= 2 ? state.loop.tours[tour]!.view : undefined;
        if (view) update({ changed: replacedIn(view), generation: state.generation + 1 });
      }, REST);
    },
    setLoopTours(tours) {
      if (!Number.isInteger(tours) || tours < LOOP_MIN || tours > LOOP_MAX) return;
      update({ loopTours: tours });
      const loop = state.loop;
      if (!loop || loop.status === 'computing') return loop && update({ loop: { ...loop, target: tours } });
      if (tours < loop.tours.length - 1) {
        // Moins de tours : on garde les premiers, déjà calculés ; rien à recalculer.
        const kept = loop.tours.slice(0, tours + 1);
        const emptyAt = loop.emptyAt !== undefined && loop.emptyAt <= tours ? loop.emptyAt : undefined;
        return update({ loop: { ...loop, tours: kept, target: tours, shown: Math.min(loop.shown, tours), repeat: findRepeat(kept.map((tour) => tour.text)), emptyAt, status: 'done' } });
      }
      update({ loop: { ...loop, target: tours } });
      if (!loopFinished(state.loop!)) void runLoop();
    },
    iterate: () => nextGeneration(true),
    freeze: () => nextGeneration(false),
    reopen: notebookController.reopen,
    remove: notebookController.remove,
    exportNotebook: notebookController.exportNotebook,
    importNotebook: notebookController.importNotebook,
    copyEntry: notebookController.copyEntry,
    shareEntry: notebookController.shareEntry,
    async replayArrival() {
      const shared = state.arrival;
      if (!shared) return;
      if (state.unsaved && !notebook.confirm('Le texte en cours n’est pas gardé. Rejouer quand même ?')) return;
      update({ arrivalError: undefined });
      await controller.preload();
      if (state.model.status !== 'ready') return; // la vue reste ouverte, avec la raison ; un clic réessaie
      // Une entrée reçue n'est dans aucun carnet : son identifiant ne désigne rien à reprendre.
      const entry: NotebookEntry = { ...shared, id: 'reçue', keptAt: new Date(0).toISOString() };
      const problem = reopenProblem(entry);
      if (problem) return update({ arrivalError: cannotReopen(problem) });
      update({ arrival: undefined });
      await restore(entry);
    },
    closeArrival() {
      update({ arrival: undefined, arrivalError: undefined });
    },
    editEntry: notebookController.editEntry,
    syncNotebook: notebookController.syncNotebook,
    async copy() {
      const view = state.view;
      if (!view || state.stale || view.empty) return;
      const shown = shownTour();
      const text = state.loop?.shown === 0 ? state.loop.tours[0]!.text : shown ? shown.tour.text + shown.mention : view.result + mention(view);
      try {
        await dependencies.copy(text);
        update({ copyMessage: 'Copié.' });
      } catch (error) {
        update({ copyMessage: `Copie impossible : ${messageOf(error)}` });
      }
    },
  };
  void dependencies.arrival?.then((received) => {
    if (received === 'unreadable') update({ arrivalMessage: UNREADABLE_LINK });
    else if (received) update({ arrival: received, arrivalMessage: '' });
  });
  return controller;
}
