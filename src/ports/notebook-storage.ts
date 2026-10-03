/** Port : garde le carnet, sous forme de texte, d'une visite à l'autre. */
export interface NotebookStorage {
  /** Le carnet gardé ; `null` s'il n'y en a pas encore. */
  read(): string | null;
  /** Remplace le carnet gardé ; lève si le stockage le refuse (quota, navigation privée). */
  write(data: string): void;
}
