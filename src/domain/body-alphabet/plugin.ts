import { z } from 'zod';
import { CATEGORIES } from '../categories.ts';
import { plainWords } from '../mixing.ts';
import { alignLetters } from '../phonetics/fallback.ts';
import type { Phoneme } from '../phonetics/phoneme.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues, type WordMark } from '../plugin.ts';
import { CLOSED } from '../reasons.ts';
import { matchCase } from '../text-case.ts';

const ParamsSchema = z.object({ replace: z.enum(['punctuation', 'sounds', 'both']).default('punctuation') });
const params = (values: ParameterValues) => ParamsSchema.parse(values);

const REPLACES = { punctuation: 'la ponctuation', sounds: 'les sons', both: 'les deux' } as const;

// La table retenue par le test de la voix du 2026-10-04 : seules, des onomatopées que la voix dit
// comme des mots ; dans un mot, des groupes qu'elle lit comme des syllabes.
/** La ponctuation devenue corps : souffle, claquement, sifflement. */
export const PUNCTUATION_BODY: Record<string, string> = { ',': 'pfou', '.': 'clac', '!': 'fuit', '?': 'fuit' };
/** Les sons devenus corps, dans un mot : /s/ sifflé, /f/ soufflé, /k/ claqué. */
export const SOUND_BODY: Partial<Record<Phoneme, string>> = { s: 'tss', f: 'pf', k: 'tk' };

/** Un blanc dont la ponctuation devient des mots : « , » → « pfou », sans double espace. */
export function embodyGap(gap: string): string {
  if (!/[,.!?]/.test(gap)) return gap;
  return gap
    .replace(/[   ]*([,.!?])[   ]*/g, (_, mark: string) => ` ${PUNCTUATION_BODY[mark]} `)
    .replace(/ {2,}/g, ' ')
    .replace(/ +\n/g, '\n');
}

/** Les sons du corps déjà écrits : on ne les retravaille pas (« pfou » ne devient pas « ppfou »). */
const BODY = /(pfou|clac|fuit|pf|tss|tk)/i;

/** Un morceau de mot dont les lettres qui portent /s/, /f/ ou /k/ deviennent leurs sons du corps. */
const embodyPart = (part: string) =>
  alignLetters(part)
    .map(({ start, end, phonemes }) => {
      const bodies = phonemes.map((phoneme) => SOUND_BODY[phoneme]).filter(Boolean);
      return bodies.length ? bodies.join('') : part.slice(start, end).toLowerCase();
    })
    .join('');

/**
 * Un mot dont les lettres qui portent /s/, /f/ ou /k/ deviennent sifflement, souffle ou claquement.
 * Les sons du corps déjà présents restent tels quels : le moteur rejoué ne fait pas grossir le texte.
 */
// ponytail: un mot qui contient déjà « tk », « pf » ou « tss », ou qui est « fuit » ou « clac », garde
// ces lettres ; plafond : le verbe « fuit » n'est jamais soufflé ; distinguer les sons posés par le
// moteur si ça gêne.
export function embodyWord(word: string): string {
  const carved = word
    .split(BODY)
    .map((part, k) => (k % 2 ? part.toLowerCase() : embodyPart(part)))
    .join('');
  return matchCase(word, carved);
}

/**
 * Alphabet augmenté : à la manière d'Isou, qui ajoutait à l'alphabet des sons du corps, remplace la
 * ponctuation par des souffles, des claquements et des sifflements, et dans les mots les lettres
 * qui portent /s/, /f/ ou /k/. Les sons viennent des règles de prononciation devinée : aucune
 * textbank à charger. Agit sur tout le texte ; un pas bouché garde son mot.
 */
export const bodyAlphabetPlugin = definePlugin({
  id: 'body-alphabet',
  name: 'Alphabet augmenté',
  targetable: false,
  tracks: [...CATEGORIES],
  defaultTargets: [...CATEGORIES],
  parameters: [{ kind: 'choice', key: 'replace', label: 'Remplace', options: Object.entries(REPLACES).map(([value, label]) => ({ value, label })) }],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: () => 'Alphabet augmenté',
  label: (values) => `alphabet augmenté : ${REPLACES[params(values).replace]}`,
  help(values) {
    const { replace } = params(values);
    const punctuation = 'la virgule devient « pfou », le point « clac », ! et ? « fuit »';
    const sounds = 'dans les mots, /s/ devient « tss », /f/ « pf », /k/ « tk »';
    const parts = replace === 'punctuation' ? [punctuation] : replace === 'sounds' ? [sounds] : [punctuation, sounds];
    return `Les lettres d'Isou, sons du corps : ${parts.join(' ; ')}.`;
  },
  apply(text, tagged, values, _resources, _targets, scope = FULL_SCOPE) {
    const { replace } = params(values);
    const skip = new Set(scope.skip);
    const { words, tail } = plainWords(text);
    const marks: WordMark[] = [];
    const punctuation = replace !== 'sounds';
    const sounds = replace !== 'punctuation';
    for (const word of words) {
      const { index } = word;
      const original = tagged[index]!.word;
      const gap = punctuation ? embodyGap(word.gap) : word.gap;
      const relaid = gap !== word.gap;
      word.gap = gap;
      if (!sounds || !word.output) {
        if (relaid) marks.push({ index, original, relaid: true });
        continue;
      }
      if (skip.has(index)) {
        marks.push({ index, original, reason: CLOSED });
        continue;
      }
      const carved = embodyWord(word.output);
      if (carved === word.output) {
        if (relaid) marks.push({ index, original, relaid: true });
        continue;
      }
      word.output = carved;
      marks.push({ index, original, replacement: carved });
    }
    return { words, tail: punctuation ? embodyGap(tail).replace(/ +$/, '') : tail, marks };
  },
});
