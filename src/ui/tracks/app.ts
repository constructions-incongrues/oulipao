import { html } from 'htm/preact';
import type { VNode } from 'preact';
import { CATEGORIES, type Category } from '../../domain/categories.ts';
import { audibleCategories } from '../../domain/mixing.ts';
import { Arrival } from './components/arrival.ts';
import { Chain } from './components/chain.ts';
import { Inspector } from './components/inspector.ts';
import { ErrorMessage } from './components/error-message.ts';
import { Notebook } from './components/notebook.ts';
import { Result } from './components/result.ts';
import { Source } from './components/source.ts';
import { LoopRow } from './components/tour-cursor.ts';
import { lineageOf, originSegments } from './loop.ts';
import { exampleOf } from './examples.ts';
import { StepGrid } from './components/step-grid.ts';
import { ThemeToggle } from './components/theme-toggle.ts';
import { Transport } from './components/transport.ts';
import type { Loading, TracksController, TracksState } from './controller.ts';
import { installedPlugins } from '../../domain/registry.ts';
import { pluginById, recipes } from './mixer-state.ts';
import { gridSteps, inspectorLocks, inspectorWindow, summarize } from './view-model.ts';
import { modulatedLabel } from './modulation-statement.ts';
import type { Instance } from './types.ts';
import { versionLink } from '../version.ts';
import type { Form } from '../../domain/forms/form.ts';

/** Le dépôt du code d'Oulipao, ouvert sous licence MIT. */
export const SOURCE_URL = 'https://github.com/constructions-incongrues/oulipao';

export interface AppProps {
  state: TracksState;
  controller: Pick<
    TracksController,
    'setInput' | 'edit' | 'run' | 'example' | 'preload' | 'loadVerbs' | 'loadPhonetics' | 'loadScales' | 'dispatch' | 'select' | 'step' | 'closeInspector' | 'copy' | 'showPage' | 'keep' | 'iterate' | 'freeze' | 'reopen' | 'remove' | 'exportNotebook' | 'importNotebook' | 'copyEntry' | 'shareEntry' | 'replayArrival' | 'closeArrival' | 'editEntry' | 'toggle' | 'setTempo' | 'setVoice' | 'setSource' | 'loop' | 'stopLoop' | 'showTour' | 'setLoopTours'
  >;
  /** Bascule le thème clair ou sombre ; posé par le montage, qui seul touche au document. */
  onTheme?: () => void;
  /** La version publiée (« 0.2.0 »), injectée au build et passée par le montage. */
  version: string;
  /** Le jour où l'on regarde, pour les jours depuis la dernière garde ; posé par le montage à chaque rendu. */
  today?: Date;
}

/** Une textbank demandée à la volée : une ligne d'état pendant son chargement, son erreur s'il échoue. */
function Fetching({ loading, label, onRetry }: { loading: Loading; label: string; onRetry: () => void }): VNode | null {
  if (loading.status === 'loading') return html`<p class="loading" role="status">${label}</p>` as VNode;
  if (loading.status === 'error' && loading.error) return html`<${ErrorMessage} error=${loading.error} onRetry=${onRetry} />` as VNode;
  return null;
}

/**
 * La page des pistes, de haut en bas : le texte résultant (collé en haut de l'écran quand on
 * descend), le carnet replié, la saisie, la chaîne de contraintes, la grille des pistes, puis
 * l'inspecteur.
 */
/** Le nom court d'une instance sous les pistes : « S+7 », ou « S+lettres » quand son paramètre principal est modulé. */
function reminderName(instance: Instance): string {
  if (instance.recipe) return instance.recipe;
  const plugin = pluginById(instance.type);
  return Object.keys(instance.modulators ?? {}).length ? modulatedLabel(plugin, instance.params, instance.modulators).split(',')[0]! : plugin.title(instance.params);
}

export function App({ state, controller, onTheme = () => {}, version, today = new Date() }: AppProps): VNode {
  const { mixer, view, stale } = state;
  const example = exampleOf(state.input);
  const release = versionLink(version);
  const audible = view?.audible ?? audibleCategories(mixer.tracks);
  const words = view?.stages[0]!.words.map((word) => word.output) ?? [];
  const steps = view ? gridSteps(mixer, view.tracks, words, undefined, view.stages, view.marks) : [];
  // Le type d'une instance de la chaîne, pour écrire ses valeurs modulées dans l'inspecteur.
  const instancePlugin = (id: string) => {
    const instance = mixer.instances.find((candidate) => candidate.id === id);
    return instance && pluginById(instance.type);
  };
  // Une contrainte qui vise les cinq pistes se rappelle une seule fois, en tête des tranches.
  const reminder = (instance: Instance, position: number) => `${position + 1}. ${reminderName(instance)}${instance.enabled ? '' : ' (coupé)'}`;
  const everywhere = (instance: Instance) => CATEGORIES.every((category) => instance.targets.includes(category));
  const reminders = Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      mixer.instances.flatMap((instance, position) => (instance.targets.includes(category) && !everywhere(instance) ? [reminder(instance, position)] : [])),
    ]),
  ) as Record<Category, string[]>;
  const allTracks = mixer.instances.flatMap((instance, position) => (everywhere(instance) ? [reminder(instance, position)] : []));
  const selected = state.selected;
  // La boucle : le papier montre le tour choisi au curseur ; la grille, la chaîne et l'inspecteur restent ceux du tour 1.
  const loop = state.loop;
  const shown = loop?.shown ?? 1;
  const tour = loop && shown !== 1 ? loop.tours[shown]! : undefined;
  const paper = !tour
    ? view && { segments: view.segments, marks: view.marks, tracks: view.tracks, empty: view.empty, interactive: true }
    : shown === 0
      ? { segments: originSegments(tour.text), marks: new Map(), tracks: tour.session.tagged.map((word) => word.category), empty: false, interactive: true }
      : { segments: tour.view!.segments, marks: tour.view!.marks, tracks: tour.view!.tracks, empty: loop!.emptyAt === shown, interactive: false };
  const lineage = loop && loop.tours.length > 2 && selected !== undefined ? lineageOf(loop.tours, selected) : undefined;
  return html`
    <main class="tracks">
      <header class="bar">
        <h1>Oulipao</h1>
        <span class="silk">Ouvroir de littérature potentielle assistée par ordinateur</span>
        <a class="key version-link" href=${release.href} title="Journal des versions">${release.text}</a>
        <a class="key source-link" href=${SOURCE_URL}>Code source</a>
        <${ThemeToggle} onToggle=${onTheme} />
      </header>
      ${state.arrivalMessage && html`<p class="arrival-message" role="status">${state.arrivalMessage}</p>`}
      ${state.arrival &&
      html`<${Arrival}
        entry=${state.arrival}
        model=${state.model}
        error=${state.arrivalError}
        onReplay=${() => void controller.replayArrival()}
        onClose=${controller.closeArrival}
      />`}
      <div class="pin-sentinel" aria-hidden="true"></div>
      ${view &&
      paper &&
      html`<${Result}
        segments=${paper.segments}
        empty=${paper.empty}
        emptyText=${tour ? `Plus aucun mot au tour ${shown}.` : undefined}
        marks=${paper.marks}
        tracks=${paper.tracks}
        interactive=${paper.interactive}
        selected=${selected}
        onSelect=${controller.select}
        changed=${state.changed}
        generation=${state.generation}
        audibleCount=${audible.size}
        stale=${stale}
        pinned=${state.pinned}
        copyMessage=${state.copyMessage}
        onCopy=${() => void controller.copy()}
        onKeep=${controller.keep}
        onIterate=${() => void controller.iterate()}
        onFreeze=${() => void controller.freeze()}
        busy=${state.tagging}
        onLoop=${() => void controller.loop()}
        looping=${loop?.status === 'computing'}
        keepLabel=${shown >= 2 ? `Garder le tour ${shown}` : 'Garder'}
        keepDisabled=${shown === 0 || loop?.emptyAt === shown}
        keepTitle=${shown === 0 ? 'Le texte d’origine est déjà à la saisie' : undefined}
        spoken=${tour ? state.spoken : undefined}
        loopRow=${loop &&
        html`<${LoopRow} loop=${loop} pinned=${state.pinned} onShow=${controller.showTour} onStop=${controller.stopLoop} onTours=${controller.setLoopTours} />`}
        syllables=${tour ? undefined : view.syllables}
        form=${state.mixer.form ?? 'none'}
        onForm=${(form: Form) => controller.dispatch({ type: 'set-form', form })}
      />`}
      <${Notebook}
        entries=${state.notebook}
        message=${state.notebookMessage}
        error=${state.notebookError}
        persistent=${state.notebookPersistent}
        today=${today}
        onReopen=${(id: string) => void controller.reopen(id)}
        onRemove=${controller.remove}
        onExport=${controller.exportNotebook}
        onImport=${controller.importNotebook}
        onCopy=${(id: string) => void controller.copyEntry(id)}
        onEdit=${controller.editEntry}
        onShare=${(id: string) => void controller.shareEntry(id)}
        sharedLink=${state.sharedLink}
      />
      <${Source}
        input=${state.input}
        words=${view ? Object.values(view.counts).reduce((a, b) => a + b, 0) : 0}
        editing=${state.editing}
        exampleLabel=${!state.input.trim() || example ? (state.examplesShown ? 'Autre exemple' : 'Essayer avec un exemple') : undefined}
        example=${example}
        tagging=${state.tagging}
        message=${state.inputMessage}
        model=${state.model}
        onInput=${controller.setInput}
        onEdit=${controller.edit}
        onRun=${() => void controller.run()}
        onExample=${() => void controller.example()}
        onLoad=${() => void controller.preload()}
      />
      ${stale &&
      html`<p class="stale-bar">Texte modifié — <button type="button" class="key rerun" onClick=${() => void controller.run()}>remettre en pistes</button></p>`}
      <${Fetching} loading=${state.verbs} label="Chargement des verbes…" onRetry=${() => void controller.loadVerbs()} />
      <${Fetching} loading=${state.phonetics} label="Chargement des prononciations…" onRetry=${() => void controller.loadPhonetics()} />
      <${Fetching} loading=${state.scales} label="Chargement des échelles…" onRetry=${() => void controller.loadScales()} />
      <${Chain} instances=${mixer.instances} plugins=${installedPlugins} recipes=${recipes} lookup=${pluginById} dispatch=${controller.dispatch}
        status=${view ? summarize(mixer, view) + (shown !== 1 ? ' · la grille montre le tour 1' : '') : ''} />
      <${StepGrid}
        steps=${steps}
        tracks=${mixer.tracks}
        audible=${audible}
        reminders=${reminders}
        allTracks=${allTracks}
        perPage=${state.perPage}
        page=${state.page}
        selected=${selected}
        generation=${state.generation}
        playing=${state.playhead}
        onToggleStep=${(index: number) => controller.dispatch({ type: 'toggle-step', index })}
        onInspect=${controller.select}
        onMute=${(category: Category) => controller.dispatch({ type: 'toggle-mute', category })}
        onSolo=${(category: Category) => controller.dispatch({ type: 'toggle-solo', category })}
        onPage=${controller.showPage}
        transport=${view &&
        html`<${Transport}
          playing=${state.playing}
          tempo=${state.tempo}
          voice=${state.voice}
          source=${state.source}
          voices=${state.voices}
          onToggle=${controller.toggle}
          onTempo=${controller.setTempo}
          onVoice=${controller.setVoice}
          onSource=${controller.setSource}
        />`}
      />
      ${view &&
      (selected === undefined
        ? html`<p class="inspector-hint">Cliquez un mot pour voir ce que chaque contrainte en a fait.</p>`
        : html`<${Inspector}
            window=${inspectorWindow(view, selected, state.page * state.perPage, (state.page + 1) * state.perPage - 1, instancePlugin)}
            perPage=${state.perPage}
            word=${words[selected]}
            step=${steps[selected]?.state}
            locks=${inspectorLocks(mixer, selected, view.tracks[selected]!)}
            onLock=${(id: string, key: string, value: number | undefined) =>
              controller.dispatch(value === undefined ? { type: 'clear-lock', id, index: selected, key } : { type: 'set-lock', id, index: selected, key, value })}
            onClose=${controller.closeInspector}
            pronunciation=${view.pronunciations[selected]}
            lineage=${lineage}
          />`)}
    </main>
  ` as VNode;
}
