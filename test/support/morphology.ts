// Petit dictionnaire de test : port factice en mémoire.
import { InMemoryMorphology } from '../../src/adapters/morphology/in-memory-morphology.ts';
import type { Category } from '../../src/domain/categories.ts';
import type { AdjectiveForm, Gender, GrammaticalNumber, NounForm } from '../../src/domain/s7/types.ts';
import type { TaggedWord } from '../../src/domain/tagged-word.ts';
import { tokenize } from '../../src/domain/tokenizer.ts';

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

export const morphology = () => new InMemoryMorphology({ nouns: NOUNS, adjectives: ADJECTIVES, noElision: ['héros'] });

const NOUN_FORMS = new Set(NOUNS.map((x) => x.form));
const ADJECTIVE_FORMS = new Set(ADJECTIVES.map((x) => x.form));
const ADVERBS = new Set(['très', 'pas']);

/** Étiquette un texte de test d'après le petit dictionnaire ; `extra` force certaines catégories. */
export function tag(text: string, extra: Record<string, Category> = {}): TaggedWord[] {
  return tokenize(text).map(({ word }) => {
    const lower = word.toLowerCase();
    const category: Category =
      extra[word] ?? (NOUN_FORMS.has(lower) ? 'noun' : ADJECTIVE_FORMS.has(lower) ? 'adjective' : ADVERBS.has(lower) ? 'adverb' : 'other');
    return { word, category };
  });
}
