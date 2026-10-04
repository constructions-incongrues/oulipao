// Un tour de la chaîne, calculé sans toucher à l'état de la page : « Mettre en pistes », « Itérer »
// et la boucle de tours partagent cette seule définition.
//
//   texte ──tagText──► session ──reset-steps──► table ──buildView──► vue
import { alignTour, type Repeat } from '../../domain/loop.ts';
import { tagText } from '../../domain/tagging.ts';
import { tokenize } from '../../domain/tokenizer.ts';
import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { PhoneticsRepository } from '../../ports/phonetics.ts';
import type { ScaleRepository } from '../../ports/scales.ts';
import type { Tagger } from '../../ports/tagger.ts';
import type { VerbRepository } from '../../ports/verbs.ts';
import { reduce } from './mixer-state.ts';
import type { MixerState } from './types.ts';
import { buildView, type Session, type TracksView } from './view-model.ts';

/** Ce qu'un tour demande : l'étiqueteur et les données déjà chargées. */
export interface TourResources {
  tagger: Tagger;
  morphology: MorphologyRepository;
  verbs?: VerbRepository;
  phonetics?: PhoneticsRepository;
  scales?: ScaleRepository;
}

/** Un tour : sa source étiquetée, sa table (pas rouverts, verrous tombés) et sa vue. */
export interface Tour {
  session: Session;
  mixer: MixerState;
  view: TracksView;
}

/**
 * Étiquette `text` comme un texte neuf et lui applique la table : nouvelles positions, donc pas
 * rouverts et verrous tombés. Rien n'est écrit ailleurs ; une erreur d'étiquetage remonte.
 */
export async function computeTour(text: string, mixer: MixerState, resources: TourResources): Promise<Tour> {
  const tagged = await tagText(resources.tagger, text);
  const session: Session = { text, tagged };
  const next = reduce(mixer, { type: 'reset-steps' });
  const view = buildView(session, next, resources.morphology, undefined, resources.verbs, resources.phonetics, resources.scales);
  return { session, mixer: next, view };
}

/** Un tour retenu par la boucle : son texte, et pour un tour calculé, sa source, sa table et sa vue. */
export interface LoopTour {
  text: string;
  session: Session;
  mixer?: MixerState;
  view?: TracksView;
}

/** Où en est la boucle : en calcul, finie (compte atteint, point fixe, cycle, tour vide), arrêtée, échouée. */
export type LoopStatus = 'computing' | 'done' | 'stopped' | 'failed';

/**
 * La boucle de tours. `tours[0]` est le texte d'origine, `tours[1]` le résultat en cours (sa table
 * garde ses pas bouchés et ses verrous), chaque tour suivant ce qu'« Itérer » ferait du précédent.
 */
export interface LoopState {
  tours: LoopTour[];
  /** Le nombre de tours demandé. */
  target: number;
  /** Le tour montré sur le papier. */
  shown: number;
  /** Le curseur suit le dernier tour calculé, tant qu'on ne l'a pas touché. */
  follow: boolean;
  status: LoopStatus;
  /** Le tour en cours de calcul ; aucun hors calcul. */
  progress?: number;
  repeat?: Repeat;
  /** Le tour qui n'a plus aucun mot. */
  emptyAt?: number;
  error?: { lead: string; detail: string };
  /** L'entrée du tour 1, gardée au premier « Boucler » : parent des tours gardés. */
  firstKept: string;
}

/** La boucle est-elle allée au bout : compte atteint, point fixe, cycle ou tour vide ? */
export const loopFinished = (loop: LoopState) => loop.repeat !== undefined || loop.emptyAt !== undefined || loop.tours.length - 1 >= loop.target;

/**
 * La lignée d'un mot du tour 0, sur chaque tour atteint : ce que le tour a mis à la place de son
 * descendant ; « — » s'il a été retiré (la lignée s'arrête), « ? » si son descendant est introuvable.
 */
export function lineageOf(tours: readonly LoopTour[], index: number): string[] {
  const line = [tours[0]!.session.tagged[index]?.word ?? '?'];
  let at: number | undefined = index;
  for (let k = 1; k < tours.length; k++) {
    const segments = tours[k]!.view!.segments;
    const placed = segments.filter((segment) => segment.index === at).map((segment) => segment.text).join('');
    if (!placed.trim()) return [...line, '—'];
    line.push(placed);
    if (k === tours.length - 1) break;
    at = alignTour(segments).get(at!);
    if (at === undefined) return [...line, '?'];
  }
  return line;
}

/** Le texte d'origine en morceaux : chaque mot porte sa position, pour s'ouvrir dans l'inspecteur. */
export function originSegments(text: string): { text: string; index?: number }[] {
  const segments: { text: string; index?: number }[] = [];
  let at = 0;
  tokenize(text).forEach((token, index) => {
    if (token.start > at) segments.push({ text: text.slice(at, token.start) });
    segments.push({ text: token.word, index });
    at = token.end;
  });
  if (at < text.length) segments.push({ text: text.slice(at) });
  return segments;
}

/** Les mots que la chaîne a remplacés dans la vue d'un tour : ils s'éclairent quand le curseur s'y pose. */
export const replacedIn = (view: TracksView) => new Set([...view.marks].filter(([, mark]) => mark.state === 'replaced').map(([index]) => index));
