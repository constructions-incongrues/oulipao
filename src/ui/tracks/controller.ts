import { wordsAtStep } from '../../domain/monitoring.ts';
import { tagText } from '../../domain/tagging.ts';
import { DEFAULT_PREFERENCES, MonitoringPreferencesSchema, tempoTiming, type MonitoringPreferencesStorage } from '../../ports/monitoring-preferences.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { NotebookStorage } from '../../ports/notebook-storage.ts';
import type { PhoneticsRepository } from '../../ports/phonetics.ts';
import type { Speech, Voice } from '../../ports/speech.ts';
import type { Tagger } from '../../ports/tagger.ts';
import type { VerbRepository } from '../../ports/verbs.ts';
import { initialState, pluginById, reduce } from './mixer-state.ts';
import { addEntry, editEntry, entryClipboard, exportFileName, mergeEntries, parseNotebook, removeEntry, serializeNotebook, type Lineage, type NotebookEntry } from './notebook.ts';
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
}

/** Ce dont le carnet a besoin de l'extérieur. */
export interface NotebookDependencies {
  storage: NotebookStorage;
  now: () => Date;
  newId: () => string;
  /** Demande une confirmation ; `true` si elle est donnée. */
  confirm: (message: string) => boolean;
  /** Propose un fichier à enregistrer, sans rien envoyer. */
  download: (name: string, text: string) => void;
}

/** Un carnet en mémoire : pour les pages et les tests qui n'en branchent pas. */
const memoryNotebook = (): NotebookDependencies => {
  let data: string | null = null;
  return {
    storage: { read: () => data, write: (text) => void (data = text) },
    now: () => new Date(),
    newId: () => crypto.randomUUID(),
    confirm: () => true,
    download: () => {},
  };
};

/** Le chargement du modèle et du dictionnaire. */
export interface ModelState {
  /** `waiting` : pas encore demandé ; rien ne part vers les tiers avant le premier clic. */
  status: 'waiting' | 'loading' | 'ready' | 'error';
  /** Octets reçus et attendus ; `total` vaut 0 tant que la taille n'est pas connue. */
  loaded: number;
  total: number;
  error: string;
}

/** Le chargement d'une textbank demandée à la volée. */
export interface Loading {
  status: 'idle' | 'loading' | 'ready' | 'error';
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
  /** Message à côté du bouton de copie, et de celui qui garde. */
  copyMessage: string;
  /** Les textes gardés, du plus récent au plus ancien. */
  notebook: NotebookEntry[];
  /** Message du carnet : entrées illisibles, import, réouverture impossible. */
  notebookMessage: string;
  /** Un texte en pistes a changé, par un geste, depuis la dernière garde ou réouverture. */
  unsaved: boolean;
  /** La filiation du texte en cours, né d'« Itérer » ou de « Figer » ; absente : première génération. */
  lineage?: Lineage;
  /** Le chargement des verbes : `idle` tant qu'aucune instance ne les vise. */
  verbs: Loading;
  /** Le chargement des prononciations : `idle` tant qu'aucun filtre phonétique n'est en marche. */
  phonetics: Loading;
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
  /** Le tempo de l'écoute, de 1 à 5, et la voix choisie. */
  tempo: number;
  voice?: string;
  /** Les voix françaises du système ; aucune : pas d'écoute. */
  voices: Voice[];
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
  /** Charge les prononciations ; relance après un échec. Le texte résultant se recalcule à leur arrivée. */
  loadPhonetics(): Promise<void>;
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
  /** Retouche le résultat d'une entrée ; vide ou égal au résultat produit, la retouche tombe. */
  editEntry(id: string, text: string): void;
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
}

/** Un texte d'exemple, écrit pour Oulipao. */
export const EXAMPLE_TEXT =
  "Le matin où la vieille horloge du village s'arrêta, personne ne le remarqua vraiment. Le boulanger ouvrit sa boutique à l'heure habituelle, les enfants coururent vers l'école, et le chat du notaire dormit au soleil sur le mur de la mairie.";

/** « 1 texte illisible laissé de côté. » ; rien quand tout se lit. */
const count = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;
const unreadable = (rejected: number) => (rejected ? `${count(rejected, 'texte illisible laissé', 'textes illisibles laissés')} de côté.` : '');

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** L'état de la page des pistes et ses gestes ; `onChange` est appelé à chaque changement. */
export function createTracksController(dependencies: TracksDependencies, onChange: (state: TracksState) => void = () => {}): TracksController {
  const notebook = dependencies.notebook ?? memoryNotebook();
  const stored = parseNotebook(notebook.storage.read());
  const speech = dependencies.speech;
  const preferences = dependencies.preferences?.load() ?? DEFAULT_PREFERENCES;
  const sleep = dependencies.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
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
    notebook: stored.entries,
    notebookMessage: stored.error ?? unreadable(stored.rejected),
    unsaved: false,
    verbs: { status: 'idle', error: '' },
    phonetics: { status: 'idle', error: '' },
    perPage: 16,
    page: 0,
    pinned: false,
    playing: false,
    listened: false,
    tempo: preferences.tempo,
    voice: preferences.voice,
    voices: speech?.voices() ?? [],
  };
  let session: Session | undefined;
  let morphology: MorphologyRepository | undefined;
  let verbs: VerbRepository | undefined;
  let phonetics: PhoneticsRepository | undefined;
  let loading: Promise<void> | undefined;
  let runs = 0;
  // L'entrée gardée ou rouverte en dernier : « Itérer » et « Figer » la reprennent comme parent si rien n'a changé depuis.
  let lastKept: string | undefined;
  // Le numéro de l'écoute en cours : arrêter le change, et la boucle d'avant s'éteint d'elle-même.
  let playback = 0;

  const update = (patch: Partial<TracksState>) => {
    state = { ...state, ...patch };
    onChange(state);
  };
  const setModel = (patch: Partial<ModelState>) => update({ model: { ...state.model, ...patch } });

  /** Rejoue la vue après un geste ; les mots qui ont changé s'éclairent. */
  const rebuild = (patch: Partial<TracksState>) => {
    const mixer = patch.mixer ?? state.mixer;
    if (!session || !morphology) return update(patch);
    const view = buildView(session, mixer, morphology, undefined, verbs, phonetics);
    const changed = changedWords(state.view, view);
    update({ ...patch, view, changed, generation: state.generation + 1, copyMessage: '' });
    wantResources(mixer);
  };

  /**
   * Une instance active vise les verbes, ou est un filtre phonétique, pour la première fois : on
   * charge ce qu'il lui faut, sans attendre.
   */
  const wantResources = (mixer: MixerState) => {
    const enabled = mixer.instances.filter((instance) => instance.enabled);
    if (state.verbs.status === 'idle' && enabled.some((instance) => instance.targets.includes('verb'))) void controller.loadVerbs();
    if (state.phonetics.status === 'idle' && enabled.some((instance) => pluginById(instance.type).phonetic || readsSyllables(instance))) void controller.loadPhonetics();
  };

  /** La mention de la chaîne, avec « réglé en écoutant » si l'écoute a tourné. */
  const mention = (view: TracksView) =>
    withListening(composeMention(state.lineage?.passes ?? [], ruleBody(ruleMention(state.mixer, view.audible, undefined, view.folded))), state.listened);

  /**
   * Met en pistes `text` : par la saisie, la filiation tombe ; par « Itérer » ou « Figer », elle
   * suit, et la table de départ est celle que le geste fournit.
   */
  const tagInto = async (text: string, mixer: MixerState, lineage?: Lineage) => {
    if (!text.trim()) return update({ inputMessage: 'Collez d’abord un texte.' });
    const run = ++runs;
    controller.stop();
    update({ tagging: true, inputMessage: '', copyMessage: '' });
    await controller.preload();
    if (run !== runs) return; // un essai plus récent a pris le relais
    if (state.model.status !== 'ready') return update({ tagging: false });
    try {
      const tagged = await tagText(dependencies.tagger, text);
      if (run !== runs) return;
      session = { text, tagged };
      if (!lineage) lastKept = undefined;
      // Nouvel étiquetage, nouvelles positions : les pas se rouvrent, les verrous tombent, l'inspecteur se ferme.
      const next = reduce(mixer, { type: 'reset-steps' });
      const view = buildView(session, next, morphology!, undefined, verbs, phonetics);
      update({ tagging: false, editing: false, stale: state.input !== text, mixer: next, view, changed: new Set(), generation: state.generation + 1, selected: undefined, page: 0, unsaved: true, listened: false, lineage });
      wantResources(next);
    } catch (error) {
      if (run === runs) update({ tagging: false, inputMessage: `Échec de l’étiquetage : ${messageOf(error)}. Vous pouvez relancer.` });
    }
  };

  /** « Itérer » (la même table) ou « Figer » (chaîne et forme vidées, toutes les pistes audibles). */
  const nextGeneration = async (keepChain: boolean) => {
    const view = state.view;
    if (!view || !session || state.stale || view.empty || state.tagging) return;
    const reuse = !state.unsaved && lastKept !== undefined && state.notebook.some((entry) => entry.id === lastKept);
    const parent = reuse ? lastKept : controller.keep();
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

  /**
   * L'écoute : à chaque pas, elle relit l'état (vue, page, tempo, voix), dit les mots du pas ou se
   * tait, attend un blanc, puis passe au suivant, en boucle sur la page affichée. Un réglage changé
   * s'entend donc au pas suivant, sans revenir au début.
   */
  const listen = async (token: number) => {
    let at = state.page * state.perPage;
    while (token === playback) {
      const first = state.page * state.perPage;
      const end = Math.min(first + state.perPage, state.view?.tracks.length ?? 0);
      if (end <= first) return controller.stop();
      if (at < first || at >= end) at = first; // fin de page, ou page changée : premier pas de la page
      update({ playhead: at });
      const { rate, gap } = tempoTiming(state.tempo);
      const words = wordsAtStep(state.view!.segments, at);
      if (words.length) await speech!.speak(words, { rate, voice: state.voice });
      if (token !== playback) return;
      await sleep(gap);
      at++;
    }
  };

  const savePreferences = () => dependencies.preferences?.save(MonitoringPreferencesSchema.parse({ tempo: state.tempo, voice: state.voice }));

  speech?.onVoices(() => update({ voices: speech.voices() }));

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
    run() {
      return tagInto(state.input, state.mixer);
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
    async loadPhonetics() {
      if (!dependencies.loadPhonetics || state.phonetics.status === 'loading' || state.phonetics.status === 'ready') return;
      update({ phonetics: { status: 'loading', error: '' } });
      try {
        phonetics = await dependencies.loadPhonetics();
        update({ phonetics: { status: 'ready', error: '' } });
        rebuild({});
      } catch (error) {
        update({ phonetics: { status: 'error', error: `Échec du chargement des prononciations : ${messageOf(error)}.` } });
      }
    },
    dispatch(action) {
      // Seul un geste rend le travail « non gardé » : le chargement d'une textbank ne compte pas.
      rebuild({ mixer: reduce(state.mixer, action), unsaved: session !== undefined });
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
      if (key === ' ') return controller.toggle(), true;
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
    play() {
      if (state.playing || !speech || !state.view || !state.voices.length) return;
      update({ playing: true, listened: true });
      void listen(++playback);
    },
    stop() {
      if (!state.playing) return;
      playback++;
      speech!.cancel();
      update({ playing: false, playhead: undefined });
    },
    toggle() {
      if (state.playing) controller.stop();
      else controller.play();
    },
    setTempo(tempo) {
      if (!MonitoringPreferencesSchema.shape.tempo.safeParse(tempo).success) return;
      update({ tempo });
      savePreferences();
    },
    setVoice(voice) {
      if (!state.voices.some((candidate) => candidate.id === voice)) return;
      update({ voice });
      savePreferences();
    },
    keep() {
      const view = state.view;
      if (!view || !session || state.stale || view.empty) return;
      const entry: NotebookEntry = {
        id: notebook.newId(),
        keptAt: notebook.now().toISOString(),
        result: view.result,
        mention: mention(view),
        source: session,
        mixer: state.mixer,
        ...(state.lineage && { lineage: state.lineage }),
      };
      const entries = addEntry(state.notebook, entry);
      try {
        notebook.storage.write(serializeNotebook(entries));
        update({ notebook: entries, copyMessage: 'Gardé.', unsaved: false });
        lastKept = entry.id;
        return entry.id;
      } catch (error) {
        update({ copyMessage: `Impossible de garder : ${messageOf(error)}` });
        return undefined;
      }
    },
    iterate: () => nextGeneration(true),
    freeze: () => nextGeneration(false),
    async reopen(id) {
      const entry = state.notebook.find((candidate) => candidate.id === id);
      if (!entry) return;
      try {
        for (const instance of entry.mixer.instances) pluginById(instance.type);
      } catch (error) {
        return update({ notebookMessage: `Ce texte ne peut pas être rouvert : ${messageOf(error)}.` });
      }
      if (state.unsaved && !notebook.confirm('Le texte en cours n’est pas gardé. Rouvrir quand même ?')) return;
      const run = ++runs; // une mise en pistes en cours ne doit pas l'écraser
      controller.stop();
      update({ notebookMessage: '', inputMessage: '', listened: false });
      await controller.preload();
      if (run !== runs || !morphology) return;
      session = entry.source;
      const mixer = MixerStateSchema.parse(entry.mixer);
      const view = buildView(session, mixer, morphology, undefined, verbs, phonetics);
      lastKept = entry.id;
      update({ input: session.text, tagging: false, editing: false, stale: false, mixer, view, changed: new Set(), generation: state.generation + 1, selected: undefined, page: 0, copyMessage: '', unsaved: false, lineage: entry.lineage });
      wantResources(mixer);
    },
    remove(id) {
      if (!notebook.confirm('Supprimer ce texte du carnet ?')) return;
      const entries = removeEntry(state.notebook, id);
      try {
        notebook.storage.write(serializeNotebook(entries));
        update({ notebook: entries, notebookMessage: '' });
      } catch (error) {
        update({ notebookMessage: `Suppression impossible : ${messageOf(error)}` });
      }
    },
    exportNotebook() {
      notebook.download(exportFileName(notebook.now()), serializeNotebook(state.notebook));
    },
    importNotebook(text) {
      const merged = mergeEntries(state.notebook, text);
      if (merged.error) return update({ notebookMessage: `Import refusé : ${merged.error}` });
      try {
        notebook.storage.write(serializeNotebook(merged.entries));
      } catch (error) {
        return update({ notebookMessage: `Import impossible : ${messageOf(error)}` });
      }
      const counts = [count(merged.added, 'texte ajouté', 'textes ajoutés'), count(merged.present, 'déjà présent', 'déjà présents')];
      if (merged.rejected) counts.push(count(merged.rejected, 'illisible', 'illisibles'));
      update({ notebook: merged.entries, notebookMessage: `Import : ${counts.join(', ')}.` });
    },
    async copyEntry(id) {
      const entry = state.notebook.find((candidate) => candidate.id === id);
      if (!entry) return;
      try {
        await dependencies.copy(entryClipboard(entry));
        update({ notebookMessage: 'Copié.' });
      } catch (error) {
        update({ notebookMessage: `Copie impossible : ${messageOf(error)}` });
      }
    },
    editEntry(id, text) {
      const entries = editEntry(state.notebook, id, text);
      try {
        notebook.storage.write(serializeNotebook(entries));
        update({ notebook: entries, notebookMessage: '' });
      } catch (error) {
        update({ notebookMessage: `Retouche impossible : ${messageOf(error)}` });
      }
    },
    async copy() {
      const view = state.view;
      if (!view || state.stale || view.empty) return;
      try {
        await dependencies.copy(view.result + mention(view));
        update({ copyMessage: 'Copié.' });
      } catch (error) {
        update({ copyMessage: `Copie impossible : ${messageOf(error)}` });
      }
    },
  };
  return controller;
}
