/** Le reste mathématique : toujours entre 0 et `m − 1`, même pour un `v` négatif. */
const mod = (v: number, m: number) => ((v % m) + m) % m;

/**
 * Ramène une valeur dans les bornes d'un paramètre. Au-dessus du maximum, elle reprend à 1 (une
 * source positive reste positive : 25 lettres sur un décalage de −20 à +20 donnent 5) ; ailleurs,
 * elle tourne dans `[min, max]`.
 */
export function fold(value: number, min: number, max: number): number {
  if (value >= min && value <= max) return value;
  if (value > max && max >= 1) return mod(value - 1, max) + 1;
  return min + mod(value - min, max - min + 1);
}

/** La valeur d'un modulateur pour une source, et si elle a été repliée. */
export function modulatedValue(base: number, depth: number, source: number, min: number, max: number): { value: number; folded: boolean } {
  const raw = base + depth * source;
  const value = fold(raw, min, max);
  return { value, folded: value !== raw };
}
