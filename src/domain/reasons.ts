// Les raisons, en clair, qu'un filtre donne d'un mot laissé tel quel : l'inspecteur les montre.

/** Le pas du mot est bouché : aucun filtre ne le touche. */
export const CLOSED = 'pas bouché';

/** Le mot n'est pas dans le dictionnaire : aucun voisin ne peut se chercher à partir de lui. */
export const UNKNOWN = 'absent du dictionnaire';
