/** Un remplaçant prend la majuscule initiale du mot qu'il remplace. */
export const matchCase = (original: string, replacement: string) =>
  original[0] !== original[0]!.toLowerCase() ? replacement[0]!.toUpperCase() + replacement.slice(1) : replacement;

/** L'apostrophe que le texte emploie déjà : la typographique s'il en a une, sinon la droite. */
export const apostropheOf = (text: string) => (text.includes('’') ? '’' : "'");
