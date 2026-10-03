import type { VerbForm } from '../domain/verb.ts';

/**
 * Port : les verbes et leurs formes conjuguées, chargés à part de la morphologie et seulement
 * quand une contrainte vise la piste des verbes.
 */
export interface VerbRepository {
  /** Les infinitifs dans l'ordre du dictionnaire, sans les auxiliaires « être » et « avoir ». */
  infinitives(): readonly string[];
  /** Lectures d'une forme (plusieurs si elle cumule temps ou personnes) ; auxiliaires compris. */
  readings(form: string): readonly VerbForm[];
  /** Toutes les formes d'un verbe. */
  forms(infinitive: string): readonly VerbForm[];
  /** La forme interdit-elle l'élision (h aspiré : « haïr », « hurler ») ? */
  blocksElision(form: string): boolean;
}
