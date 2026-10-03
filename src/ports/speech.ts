/** Une voix française du système. */
export interface Voice {
  id: string;
  name: string;
}

export interface SpeakOptions {
  /** La vitesse de la voix, 1 étant la vitesse normale. */
  rate: number;
  /** La voix choisie ; absente ou disparue : la première voix française. */
  voice?: string;
}

/** Port : dire des mots à voix haute, avec une voix française du système. Rien ne quitte la machine. */
export interface Speech {
  /** Les voix françaises disponibles ; la liste peut arriver en retard (voir `onVoices`). */
  voices(): Voice[];
  /** Appelle `listener` quand la liste des voix change. */
  onVoices(listener: () => void): void;
  /** Dit les mots dans l'ordre ; se résout quand le dernier est dit, ou dès que la parole est coupée. */
  speak(words: readonly string[], options: SpeakOptions): Promise<void>;
  /** Coupe la parole en cours. */
  cancel(): void;
}
