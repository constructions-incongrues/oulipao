/** Port : garde le carnet, sous forme de texte, d'une visite à l'autre. */
export interface NotebookStorage {
  /** Le carnet gardé ; `null` s'il n'y en a pas encore. */
  read(): string | null;
  /** Remplace le carnet gardé ; lève si le stockage le refuse (quota, navigation privée). */
  write(data: string): void;
  /**
   * Garde une copie de secours d'un carnet illisible, sans jamais écraser une copie déjà gardée ;
   * absent : pas de copie (carnet en mémoire).
   */
  backup?(data: string): void;
}
