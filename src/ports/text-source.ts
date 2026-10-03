/** Port : fournit le contenu d'un fichier texte (lexique…), d'où qu'il vienne. */
export type TextSource = () => Promise<string>;
