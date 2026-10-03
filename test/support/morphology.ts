// Petit dictionnaire de test : port factice en mémoire.
import { InMemoryMorphology } from '../../src/adapters/morphology/in-memory-morphology.ts';
import { InMemoryVerbs } from '../../src/adapters/morphology/in-memory-verbs.ts';
import type { Category } from '../../src/domain/categories.ts';
import type { AdjectiveForm, Gender, GrammaticalNumber, NounForm } from '../../src/domain/s7/types.ts';
import type { TaggedWord } from '../../src/domain/tagged-word.ts';
import { tokenize } from '../../src/domain/tokenizer.ts';
import type { VerbForm } from '../../src/domain/verb.ts';

const n = (form: string, lemma: string, gender: Gender, number: GrammaticalNumber): NounForm => ({ form, lemma, gender, number });
const a = (form: string, paradigm: string, gender: Gender, number: GrammaticalNumber): AdjectiveForm => ({ form, paradigm, gender, number });

// Ordre du dictionnaire : aire, arbre, camion, chat, cheval, école, ferme, fermoir, héros,
// horloge, hôtel, livre, maison, oncle, village, ville, voisin.
export const NOUNS: NounForm[] = [
  n('aire', 'aire', 'f', 's'),
  n('arbre', 'arbre', 'm', 's'), n('arbres', 'arbre', 'm', 'p'),
  n('camion', 'camion', 'm', 's'), n('camions', 'camion', 'm', 'p'),
  n('chat', 'chat', 'm', 's'), n('chats', 'chat', 'm', 'p'),
  n('cheval', 'cheval', 'm', 's'), n('chevaux', 'cheval', 'm', 'p'),
  n('école', 'école', 'f', 's'), n('écoles', 'école', 'f', 'p'),
  n('ferme', 'ferme', 'f', 's'), n('fermes', 'ferme', 'f', 'p'),
  n('fermoir', 'fermoir', 'm', 's'), n('fermoirs', 'fermoir', 'm', 'p'),
  n('héros', 'héros', 'm', 'i'),
  n('horloge', 'horloge', 'f', 's'), n('horloges', 'horloge', 'f', 'p'),
  n('hôtel', 'hôtel', 'm', 's'), n('hôtels', 'hôtel', 'm', 'p'),
  n('livre', 'livre', 'e', 's'), n('livres', 'livre', 'e', 'p'),
  n('maison', 'maison', 'f', 's'), n('maisons', 'maison', 'f', 'p'),
  n('oncle', 'oncle', 'm', 's'), n('oncles', 'oncle', 'm', 'p'),
  n('village', 'village', 'm', 's'), n('villages', 'village', 'm', 'p'),
  n('ville', 'ville', 'f', 's'), n('villes', 'ville', 'f', 'p'),
  n('voisin', 'voisin', 'm', 's'), n('voisine', 'voisin', 'f', 's'), n('voisins', 'voisin', 'm', 'p'),
];

export const ADJECTIVES: AdjectiveForm[] = [
  a('vieux', 'vieux', 'm', 'i'), a('vieil', 'vieux', 'm', 's'), a('vieille', 'vieux', 'f', 's'), a('vieilles', 'vieux', 'f', 'p'),
  a('petit', 'petit', 'm', 's'), a('petite', 'petit', 'f', 's'), a('petits', 'petit', 'm', 'p'), a('petites', 'petit', 'f', 'p'),
  a('gris', 'gris', 'm', 'i'), a('grise', 'gris', 'f', 's'), a('grises', 'gris', 'f', 'p'),
  a('beau', 'beau', 'm', 's'), a('bel', 'beau', 'm', 's'), a('belle', 'beau', 'f', 's'),
  a('rapide', 'rapide', 'e', 's'), a('rapides', 'rapide', 'e', 'p'),
  a('enceinte', 'enceinte', 'f', 's'),
  a('fermé', 'fermer', 'm', 's'), a('fermée', 'fermer', 'f', 's'), a('fermés', 'fermer', 'm', 'p'),
  a('fermé', 'fermé', 'm', 's'),
];

// Ordre du dictionnaire : ainsi, bien, ici, jamais, pas, plus, très, vite.
export const ADVERB_LIST = ['très', 'pas', 'plus', 'vite', 'ici', 'bien', 'jamais', 'ainsi'];

export const morphology = () => new InMemoryMorphology({ nouns: NOUNS, adjectives: ADJECTIVES, adverbs: ADVERB_LIST, noElision: ['héros'] });

const NOUN_FORMS = new Set(NOUNS.map((x) => x.form));
const ADJECTIVE_FORMS = new Set(ADJECTIVES.map((x) => x.form));
const ADVERBS = new Set(['très', 'pas', 'plus', 'ne', "n'", 'vite', 'ici']);
const VERBS = new Set(['est', 'sont', 'a', 'été', 'paraissait', 'reste', 'devient', 'voit', 'dort']);

/** Étiquette un texte de test d'après le petit dictionnaire ; `extra` force certaines catégories. */
export function tag(text: string, extra: Record<string, Category> = {}): TaggedWord[] {
  return tokenize(text).map(({ word }) => {
    const lower = word.toLowerCase();
    const category: Category =
      extra[word] ?? (NOUN_FORMS.has(lower) ? 'noun' : ADJECTIVE_FORMS.has(lower) ? 'adjective' : ADVERBS.has(lower) ? 'adverb' : VERBS.has(lower) ? 'verb' : 'other');
    return { word, category };
  });
}

const PRESENT = ['1s', '2s', '3s', '1p', '2p', '3p'] as const;
/** Les formes d'un verbe : infinitif, présent, imparfait (3s, 1p), participe passé. */
function conjugate(infinitive: string, present: string[], imperfect: [string, string], participle: string): VerbForm[] {
  const v = (form: string, tense: VerbForm['tense'], extra: Partial<VerbForm> = {}): VerbForm => ({ form, infinitive, tense, ...extra });
  return [
    v(infinitive, 'infinitive'),
    ...present.map((form, i) => v(form, 'indicative-present', { person: PRESENT[i] })),
    // « mange » est aussi un subjonctif : de quoi tester le choix de la lecture.
    ...present.map((form, i) => v(form, 'subjunctive-present', { person: PRESENT[i] })),
    v(imperfect[0], 'indicative-imperfect', { person: '3s' }),
    v(imperfect[1], 'indicative-imperfect', { person: '1p' }),
    v(participle, 'past-participle', { gender: 'm', number: 's' }),
    v(`${participle}e`, 'past-participle', { gender: 'f', number: 's' }),
  ];
}

// Ordre du dictionnaire (auxiliaires exclus) : adorer, aimer, chanter, dormir, falloir, finir, haïr, manger.
export const VERB_FORMS: VerbForm[] = [
  ...conjugate('manger', ['mange', 'manges', 'mange', 'mangeons', 'mangez', 'mangent'], ['mangeait', 'mangions'], 'mangé'),
  ...conjugate('aimer', ['aime', 'aimes', 'aime', 'aimons', 'aimez', 'aiment'], ['aimait', 'aimions'], 'aimé'),
  ...conjugate('adorer', ['adore', 'adores', 'adore', 'adorons', 'adorez', 'adorent'], ['adorait', 'adorions'], 'adoré'),
  ...conjugate('chanter', ['chante', 'chantes', 'chante', 'chantons', 'chantez', 'chantent'], ['chantait', 'chantions'], 'chanté'),
  ...conjugate('dormir', ['dors', 'dors', 'dort', 'dormons', 'dormez', 'dorment'], ['dormait', 'dormions'], 'dormi'),
  ...conjugate('finir', ['finis', 'finis', 'finit', 'finissons', 'finissez', 'finissent'], ['finissait', 'finissions'], 'fini'),
  ...conjugate('haïr', ['hais', 'hais', 'hait', 'haïssons', 'haïssez', 'haïssent'], ['haïssait', 'haïssions'], 'haï'),
  // Défectif : seulement la troisième personne du singulier.
  { form: 'falloir', infinitive: 'falloir', tense: 'infinitive' },
  { form: 'faut', infinitive: 'falloir', tense: 'indicative-present', person: '3s' },
  { form: 'fallait', infinitive: 'falloir', tense: 'indicative-imperfect', person: '3s' },
  { form: 'fallu', infinitive: 'falloir', tense: 'past-participle', gender: 'e', number: 'i' },
  { form: 'est', infinitive: 'être', tense: 'indicative-present', person: '3s' },
  { form: 'a', infinitive: 'avoir', tense: 'indicative-present', person: '3s' },
];

export const verbs = () => new InMemoryVerbs(VERB_FORMS, ['hais', 'hait', 'haïr', 'haïssait', 'haï']);
