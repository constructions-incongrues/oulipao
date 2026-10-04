import type { GateTest } from './schema.ts';

/** Le rythme euclidien E(k,n) frappe-t-il le pas `step` (à partir de 1, repris tous les n) ? E(3,8) : 1, 4, 7. */
export function euclidStrikes(k: number, n: number, step: number): boolean {
  const i = (step - 1) % n;
  return (i * k) % n < k;
}

/** La valeur passe-t-elle le test ? Pour l'Euclide, la valeur est le rang. */
export function passes(test: GateTest, value: number): boolean {
  switch (test.kind) {
    case 'even':
      return value % 2 === 0;
    case 'odd':
      return value % 2 !== 0;
    case 'at-least':
      return value >= test.k;
    case 'at-most':
      return value <= test.k;
    case 'euclid':
      return euclidStrikes(test.k, test.n, value);
  }
}
