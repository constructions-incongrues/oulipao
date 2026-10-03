import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { WordMark } from '../plugin.ts';
import type { TaggedWord } from '../tagged-word.ts';
import { formInParadigm } from './agreement.ts';
import { elides } from './elision.ts';
import type { ConcreteGender, ConcreteNumber, OutputWord } from './types.ts';

/** Reporte la majuscule initiale du mot d'origine sur le mot nouveau. */
const matchCase = (original: string, replacement: string) =>
  original[0] !== original[0]!.toLowerCase() ? replacement[0]!.toUpperCase() + replacement.slice(1) : replacement;

/** Ce que devient un adjectif : sa nouvelle forme, ou la raison pour laquelle il reste. */
export type AdjectiveShift = { form: string } | { reason: string };

/**
 * Le S+n d'un adjectif : le n-ième adjectif qui le suit dans l'ordre du dictionnaire, en comptant
 * tous les adjectifs (« Parmi » ne vaut que pour les noms), mis au genre et au nombre du mot
 * d'origine. Devant un mot qui appelle l'élision, la forme euphonique (« vieil »).
 */
export function shiftAdjective(word: string, offset: number, nextElides: boolean | undefined, morphology: MorphologyRepository): AdjectiveShift {
  const readings = morphology.adjectiveReadings(word.toLowerCase());
  const paradigms = morphology.adjectiveParadigms();
  const reading = readings[0];
  const start = reading ? paradigms.indexOf(reading.paradigm) : -1;
  if (!reading || start < 0) return { reason: 'absent du dictionnaire' };
  const gender: ConcreteGender = reading.gender === 'e' ? 'm' : reading.gender;
  const number: ConcreteNumber = reading.number === 'i' ? 's' : reading.number;
  const position = (((start + offset) % paradigms.length) + paradigms.length) % paradigms.length;
  const form = formInParadigm(paradigms[position]!, { gender, number, nextElides }, morphology);
  return form ? { form } : { reason: 'pas de forme au bon genre et au bon nombre' };
}

/** « le », « la » devant une voyelle : « l’ » ; et l'inverse quand l'adjectif nouveau commence par une consonne. */
export function fixElision(words: OutputWord[], index: number, gender: ConcreteGender, apostrophe: string, morphology: MorphologyRepository) {
  const previous = words[index - 1];
  const word = words[index]!;
  if (!previous?.output) return;
  if (/^(le|la)$/i.test(previous.output) && elides(word.output, morphology)) {
    previous.output = `${previous.output[0]}${apostrophe}`;
    word.gap = '';
  } else if (/^l['’]$/i.test(previous.output) && !elides(word.output, morphology)) {
    previous.output = matchCase(previous.output, gender === 'f' ? 'la' : 'le');
    word.gap = ' ';
  }
}

/**
 * Applique le S+n aux adjectifs d'une sortie mot par mot (modifiée en place) et rend les marques.
 * Le genre retenu est celui de la forme en place, déjà accordée au nom. `offsetAt` donne le
 * décalage d'un adjectif d'après sa position (verrou) ; `undefined` le laisse (pas bouché).
 */
export function shiftAdjectives(
  words: OutputWord[],
  tagged: readonly TaggedWord[],
  offsetAt: (index: number) => number | undefined,
  apostrophe: string,
  morphology: MorphologyRepository,
): WordMark[] {
  const marks: WordMark[] = [];
  words.forEach((word, index) => {
    const offset = offsetAt(index);
    if (tagged[index]!.category !== 'adjective' || !word.output || offset === undefined) return;
    const next = words[index + 1];
    // Placé juste avant un mot (sans ponctuation entre eux) : la forme dépend de son initiale.
    const nextElides = next?.output && /^\s+$/.test(next.gap) ? elides(next.output, morphology) : undefined;
    const original = word.output;
    const shift = shiftAdjective(original, offset, nextElides, morphology);
    if ('reason' in shift) {
      marks.push({ index, original, reason: shift.reason });
      return;
    }
    word.output = matchCase(original, shift.form);
    // Genre du groupe, pour un article à rétablir : celui de l'adjectif d'origine, sinon du nouveau.
    // ponytail: deux épicènes (« l'énorme » → « rapide ») retombent au masculin ; lire le nom si ça gêne.
    const gendered = [...morphology.adjectiveReadings(original.toLowerCase()), ...morphology.adjectiveReadings(shift.form)];
    const gender = (gendered.find((r) => r.gender !== 'e')?.gender ?? 'm') as ConcreteGender;
    fixElision(words, index, gender, apostrophe, morphology);
    marks.push({ index, original, replacement: word.output });
  });
  return marks;
}
