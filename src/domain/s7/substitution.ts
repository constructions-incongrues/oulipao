import type { MorphologyRepository } from '../../ports/morphology.ts';
import type { ConcreteGender, ConcreteNumber, NounForm, S7Options, SubstitutionStatus } from './types.ts';

const collator = new Intl.Collator('fr');

/** Ce que la phrase dit du nom, par son déterminant : sert quand la forme seule ne tranche pas. */
export interface NounHints {
  gender?: ConcreteGender;
  number?: ConcreteNumber;
}

export interface NounChoice {
  status: SubstitutionStatus;
  /** Le nouveau nom, en minuscules ; le nom d'origine s'il n'est pas remplacé. */
  replacement: string;
  /** Genre et nombre du groupe après substitution. */
  gender: ConcreteGender;
  number: ConcreteNumber;
}

// Position de chaque lemme dans la liste triée ; calculée une fois par dictionnaire.
const positions = new WeakMap<readonly string[], Map<string, number>>();
function positionOf(lemmas: readonly string[], lemma: string): number | undefined {
  let map = positions.get(lemmas);
  if (!map) positions.set(lemmas, (map = new Map(lemmas.map((l, i) => [l, i]))));
  return map.get(lemma);
}

const compatible = (gender: NounForm['gender'], wanted: ConcreteGender) => gender === wanted || gender === 'e';

/** Lecture retenue pour une forme : compatible avec les indices, de préférence l'entrée du dictionnaire. */
function pickReading(word: string, hints: NounHints, morphology: MorphologyRepository): NounForm | undefined {
  const lower = word.toLowerCase();
  const all = morphology.nounReadings(word).length ? morphology.nounReadings(word) : morphology.nounReadings(lower);
  const matching = all.filter(
    (r) => (!hints.gender || compatible(r.gender, hints.gender)) && (!hints.number || r.number === hints.number || r.number === 'i'),
  );
  const readings = matching.length ? matching : all;
  return readings.find((r) => r.lemma === lower) ?? [...readings].sort((a, b) => collator.compare(a.lemma, b.lemma))[0];
}

/** Lemme situé `offset` rangs plus loin ; en mode « même genre », seuls ces lemmes comptent. */
function shift(lemmas: readonly string[], start: number, offset: number, counts: (lemma: string) => boolean): string {
  const step = Math.sign(offset);
  let position = start;
  // Garde-fou : au plus un tour complet par rang demandé (dictionnaire sans lemme compatible).
  for (let remaining = Math.abs(offset), guard = lemmas.length * (Math.abs(offset) + 1); remaining > 0 && guard > 0; guard--) {
    position = (position + step + lemmas.length) % lemmas.length;
    if (counts(lemmas[position]!)) remaining--;
  }
  return lemmas[position]!;
}

/**
 * Remplace un nom par le n-ième lemme suivant du dictionnaire, au même nombre.
 * Laisse le nom tel quel, et le signale, s'il est inconnu ou si le nouveau lemme n'a pas la forme voulue.
 */
export function substituteNoun(
  word: string,
  hints: NounHints,
  options: Pick<S7Options, 'offset' | 'mode'>,
  morphology: MorphologyRepository,
): NounChoice {
  const unchanged = (status: SubstitutionStatus, gender: ConcreteGender = hints.gender ?? 'm', number: ConcreteNumber = hints.number ?? 's') =>
    ({ status, replacement: word.toLowerCase(), gender, number });

  const reading = pickReading(word, hints, morphology);
  const lemmas = morphology.nounLemmas();
  const start = reading && positionOf(lemmas, reading.lemma);
  if (!reading || start === undefined) return unchanged('unknown-noun');

  // Un nom épicène ou invariable garde le genre et le nombre qu'il a dans la phrase.
  const gender: ConcreteGender = reading.gender === 'e' ? (hints.gender ?? 'm') : reading.gender;
  const number: ConcreteNumber = reading.number === 'i' ? (hints.number ?? 's') : reading.number;

  const sameGender = options.mode === 'same-gender';
  const hasGender = (lemma: string) => morphology.nounForms(lemma).some((f) => compatible(f.gender, gender));
  const target = shift(lemmas, start, options.offset, sameGender ? hasGender : () => true);

  const forms = morphology.nounForms(target).filter((f) => f.number === number || f.number === 'i');
  // En S+7 strict, le genre est celui de l'entrée du dictionnaire (la forme égale au lemme).
  const headGender = morphology.nounForms(target).find((f) => f.form === target)?.gender;
  const wanted = sameGender ? gender : headGender && headGender !== 'e' ? headGender : undefined;
  const gendered = wanted ? forms.filter((f) => compatible(f.gender, wanted)) : forms;
  const candidates = gendered.length || sameGender ? gendered : forms;
  const exact = (f: NounForm) => Number(f.number !== number) + Number(wanted !== undefined && f.gender !== wanted);
  const [best] = [...candidates].sort((a, b) => exact(a) - exact(b) || collator.compare(a.form, b.form));
  if (!best) return unchanged('missing-form', gender, number);
  return { status: 'replaced', replacement: best.form, gender: best.gender === 'e' ? gender : best.gender, number };
}
