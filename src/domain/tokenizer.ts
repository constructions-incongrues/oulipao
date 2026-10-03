import { z } from 'zod';

export const TokenSchema = z.object({
  word: z.string().min(1),
  start: z.number().int().nonnegative(),
  end: z.number().int().positive(),
});
export type Token = z.infer<typeof TokenSchema>;

// Un mot = une suite de lettres ; chiffres et ponctuation ne sont pas des mots.
// ponytail: règles minimales (élisions, clitiques après trait d'union). Les mots composés
// (« peut-être », « porte-monnaie ») restent un seul mot ; à affiner si la mesure le montre.
const LETTER_RUN = /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu;
const ELISION = /^(?:l|d|j|m|t|s|n|c|qu|jusqu|lorsqu|puisqu|quoiqu)['’]/iu;
const CLITIC = /-(?:t-)?(je|tu|il|elle|on|nous|vous|ils|elles|ce|moi|toi|le|la|les|lui|leur|y|en)$/iu;

/** Découpage en mots partagé par les étiqueteurs, la page et la comparaison. */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  for (const match of text.matchAll(LETTER_RUN)) {
    let start = match.index;
    let rest = match[0];
    let elision: RegExpMatchArray | null;
    while ((elision = rest.match(ELISION))) {
      const prefix = elision[0];
      tokens.push({ word: prefix, start, end: start + prefix.length });
      start += prefix.length;
      rest = rest.slice(prefix.length);
    }
    // « dit-il », « a-t-elle », « donne-le-moi » : les clitiques sont des mots à part.
    const clitics: Token[] = [];
    let clitic: RegExpMatchArray | null;
    while ((clitic = rest.match(CLITIC))) {
      const pronoun = clitic[1]!;
      const restEnd = start + rest.length;
      clitics.unshift({ word: pronoun, start: restEnd - pronoun.length, end: restEnd });
      rest = rest.slice(0, clitic.index);
    }
    tokens.push({ word: rest, start, end: start + rest.length }, ...clitics);
  }
  return tokens;
}
