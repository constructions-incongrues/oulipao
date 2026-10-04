/** Programme un appel différé ; rend de quoi l'annuler. Remplaçable dans les tests. */
export type Schedule = (callback: () => void, ms: number) => () => void;

export const realSchedule: Schedule = (callback, ms) => {
  const handle = setTimeout(callback, ms);
  return () => clearTimeout(handle);
};

/**
 * Un appel qui attend le repos : chaque nouvel appel annule le précédent, seul le dernier part,
 * `ms` millisecondes après. Sert aux champs réglés en direct, pour ne pas relancer la chaîne à
 * chaque frappe.
 */
export function debounced<A extends unknown[]>(run: (...args: A) => void, ms: number, schedule: Schedule = realSchedule): (...args: A) => void {
  let cancel: (() => void) | undefined;
  return (...args) => {
    cancel?.();
    cancel = schedule(() => {
      cancel = undefined;
      run(...args);
    }, ms);
  };
}
