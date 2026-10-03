import { z } from 'zod';
import type { VerbRepository } from '../ports/verbs.ts';
import { containsLetter } from './lipogram/neighbour.ts';
import { aroundAmong, before, candidatePositions } from './neighbours.ts';
import type { WordMark } from './plugin.ts';
import { GenderSchema, GrammaticalNumberSchema, type OutputWord } from './s7/types.ts';
import type { TaggedWord } from './tagged-word.ts';

/** Les temps qu'on garde d'un verbe remplacé, de l'infinitif au participe passé. */
export const TENSES = [
  'infinitive',
  'indicative-present',
  'indicative-imperfect',
  'simple-past',
  'future',
  'conditional',
  'subjunctive-present',
  'subjunctive-imperfect',
  'imperative',
  'present-participle',
  'past-participle',
] as const;
export const TenseSchema = z.enum(TENSES);
export type Tense = z.infer<typeof TenseSchema>;

export const PersonSchema = z.enum(['1s', '2s', '3s', '1p', '2p', '3p']);
export type Person = z.infer<typeof PersonSchema>;

/** Une forme conjuguée : personne pour les formes personnelles, genre et nombre pour le participe passé. */
export const VerbFormSchema = z.object({
  form: z.string().min(1),
  infinitive: z.string().min(1),
  tense: TenseSchema,
  person: PersonSchema.optional(),
  gender: GenderSchema.optional(),
  number: GrammaticalNumberSchema.optional(),
});
export type VerbForm = z.infer<typeof VerbFormSchema>;
/** Ce qu'un verbe remplacé garde : le temps, la personne, le genre et le nombre. */
export type VerbFeatures = Omit<VerbForm, 'form' | 'infinitive'>;

/** Ce que devient un verbe : sa nouvelle forme, ou la raison pour laquelle il reste. */
export type VerbShift = { form: string } | { reason: string };

export const AUXILIARIES = new Set(['être', 'avoir']);
export const AUXILIARY = 'auxiliaire';
export const LOADING = 'conjugaisons en cours de chargement';
export const UNKNOWN = 'absent du dictionnaire';
export const NO_FORM = 'aucune forme à ce temps et à cette personne';

const SUBJECTS: Record<string, Person> = {
  je: '1s', "j'": '1s', 'j’': '1s', tu: '2s', il: '3s', elle: '3s', on: '3s',
  nous: '1p', vous: '2p', ils: '3p', elles: '3p',
};
// Pronoms qui s'intercalent entre le sujet et le verbe : « je me lave », « il ne mange ».
const CLITICS = /^(me|te|se|le|la|les|lui|leur|y|en|ne|[mtsln]['’])$/i;
const TENSE_RANK = new Map<Tense, number>(TENSES.map((tense, rank) => [tense, rank === 0 ? TENSES.length : rank]));
const PERSON_RANK: Person[] = ['3s', '3p', '1s', '1p', '2s', '2p'];
const PLAIN_WORD = /^[a-zàâäçéèêëîïôöùûüÿœæ'’-]+$/i;

/** La personne que dit le pronom sujet juste avant le verbe, un pronom intercalé près. */
function subjectPerson(previous: readonly string[]): Person | undefined {
  const [last, before] = [previous.at(-1)?.toLowerCase(), previous.at(-2)?.toLowerCase()];
  if (last && SUBJECTS[last]) return SUBJECTS[last];
  if (last && before && CLITICS.test(last)) return SUBJECTS[before];
  return undefined;
}

/**
 * La lecture retenue pour une forme : celle qui s'accorde au pronom sujet qui précède, puis
 * l'indicatif avant le conditionnel, le subjonctif et l'impératif, puis la troisième personne.
 */
export function pickVerbReading(word: string, previous: readonly string[], verbs: VerbRepository): VerbForm | undefined {
  const readings = verbs.readings(word.toLowerCase());
  const person = subjectPerson(previous);
  const agreeing = readings.filter((reading) => reading.person === person);
  const rank = (reading: VerbForm) => TENSE_RANK.get(reading.tense)! * 10 + (reading.person ? PERSON_RANK.indexOf(reading.person) : 0);
  return [...(agreeing.length ? agreeing : readings)].sort((a, b) => rank(a) - rank(b))[0];
}

/** La forme garde-t-elle les traits voulus ? Un participe invariable convient à tous les accords. */
function fits(form: VerbForm, wanted: VerbFeatures): boolean {
  if (form.tense !== wanted.tense || form.person !== wanted.person || !PLAIN_WORD.test(form.form)) return false;
  if (wanted.tense !== 'past-participle') return true;
  const gender = wanted.gender === 'e' ? 'm' : wanted.gender;
  const number = wanted.number === 'i' ? 's' : wanted.number;
  return (form.gender === 'e' || form.gender === gender) && (form.number === 'i' || form.number === number);
}

/** Reporte la majuscule initiale du mot d'origine sur le mot nouveau. */
const matchCase = (original: string, replacement: string) =>
  original[0] !== original[0]!.toLowerCase() ? replacement[0]!.toUpperCase() + replacement.slice(1) : replacement;

/** La lecture d'un verbe et sa place dans le dictionnaire, ou la raison de le laisser. */
function locate(word: string, previous: readonly string[], verbs: VerbRepository): { reading: VerbForm; start: number } | { reason: string } {
  const reading = pickVerbReading(word, previous, verbs);
  if (!reading) return { reason: UNKNOWN };
  if (AUXILIARIES.has(reading.infinitive)) return { reason: AUXILIARY };
  const start = verbs.infinitives().indexOf(reading.infinitive);
  return start < 0 ? { reason: UNKNOWN } : { reading, start };
}

/** Le V+n : le n-ième verbe qui suit dans le dictionnaire, au même temps et à la même personne. */
export function shiftVerb(word: string, previous: readonly string[], offset: number, verbs: VerbRepository): VerbShift {
  const found = locate(word, previous, verbs);
  if ('reason' in found) return found;
  const infinitives = verbs.infinitives();
  const target = infinitives[(((found.start + offset) % infinitives.length) + infinitives.length) % infinitives.length]!;
  const form = verbs.forms(target).find((candidate) => fits(candidate, found.reading));
  return form ? { form: matchCase(word, form.form) } : { reason: NO_FORM };
}

/**
 * Le n-ième verbe qui suit dans le dictionnaire (`offset` négatif : qui précède) et qui a, aux
 * mêmes traits, une forme que `accept` retient ; `none` est la raison s'il n'y en a pas assez.
 */
export function nthVerb(
  word: string,
  previous: readonly string[],
  offset: number,
  accept: (form: string) => boolean,
  verbs: VerbRepository,
  none: string,
  among?: ReadonlySet<string>,
  from?: (entry: string) => string,
): VerbShift {
  const found = locate(word, previous, verbs);
  if ('reason' in found) return found;
  const infinitives = verbs.infinitives();
  // `from` : partir d'ailleurs que du verbe lui-même (le tautogramme part de l'infinitif à l'initiale changée).
  const start = from ? before(infinitives, from(found.reading.infinitive)) : found.start;
  const step = Math.sign(offset) || 1;
  let remaining = Math.abs(offset);
  // Avec `among`, seuls les infinitifs des formes candidates sont essayés, dans l'ordre du tour (voir neighbours.ts).
  const positions = among
    ? aroundAmong(candidatePositions(infinitives, among, (form) => verbs.readings(form).map((r) => r.infinitive)), start, step)
    : Array.from({ length: infinitives.length - (from ? 0 : 1) }, (_, k) => (((start + (k + 1) * step) % infinitives.length) + infinitives.length) % infinitives.length);
  for (const position of positions) {
    const target = infinitives[position]!;
    const form = verbs.forms(target).find((candidate) => fits(candidate, found.reading) && accept(candidate.form));
    if (form && --remaining === 0) return { form: matchCase(word, form.form) };
  }
  return { reason: none };
}

/** Le premier verbe qui suit dans le dictionnaire et qui a, aux mêmes traits, une forme sans la lettre. */
export const neighbourVerb = (word: string, previous: readonly string[], letter: string, verbs: VerbRepository): VerbShift =>
  nthVerb(word, previous, 1, (form) => !containsLetter(form, letter), verbs, 'aucun voisin sans la lettre');

const FULL_PRONOUN: Record<string, string> = { j: 'je', m: 'me', t: 'te', s: 'se', n: 'ne', l: 'le' };

/**
 * Élide ou rétablit le pronom devant un verbe remplacé (modifie la sortie en place) :
 * « je adore » → « j’adore », « j’mange » → « je mange ».
 */
export function fixPronounElision(words: OutputWord[], index: number, apostrophe: string, elides: (word: string) => boolean) {
  const previous = words[index - 1];
  const word = words[index]!;
  if (!previous?.output || !word.output) return;
  if (/^(je|me|te|se|ne|le|la)$/i.test(previous.output) && elides(word.output)) {
    previous.output = `${previous.output[0]}${apostrophe}`;
    word.gap = '';
  } else if (/^[jmtsnl]['’]$/i.test(previous.output) && !elides(word.output)) {
    previous.output = matchCase(previous.output, FULL_PRONOUN[previous.output[0]!.toLowerCase()]!);
    word.gap = ' ';
  }
}

/**
 * Applique un changement aux verbes d'une sortie mot par mot (modifiée en place) et rend les
 * marques : forme nouvelle, pronom élidé ou rétabli, ou raison. Sans verbes chargés, chaque verbe
 * retenu reste avec la raison du chargement. `elides` dit si un mot appelle l'élision.
 */
export function rewriteVerbs(
  words: OutputWord[],
  tagged: readonly TaggedWord[],
  retained: (index: number) => boolean,
  change: (word: string, previous: readonly string[], verbs: VerbRepository, index: number) => VerbShift,
  verbs: VerbRepository | undefined,
  apostrophe: string,
  elides: (word: string) => boolean,
): WordMark[] {
  const marks: WordMark[] = [];
  words.forEach((word, index) => {
    if (tagged[index]!.category !== 'verb' || !word.output || !retained(index)) return;
    const original = tagged[index]!.word;
    if (!verbs) return marks.push({ index, original, reason: LOADING });
    const previous = words.slice(Math.max(0, index - 3), index).map((w) => w.output).filter(Boolean);
    const shift = change(word.output, previous, verbs, index);
    if ('reason' in shift) return marks.push({ index, original, reason: shift.reason });
    word.output = shift.form;
    fixPronounElision(words, index, apostrophe, elides);
    marks.push({ index, original, replacement: shift.form });
  });
  return marks;
}
