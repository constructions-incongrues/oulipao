import { z } from 'zod';

/** Le tempo de l'écoute : de 1 (lent) à 5 (rapide). */
export const TEMPO_MIN = 1;
export const TEMPO_MAX = 5;
export const DEFAULT_TEMPO = 3;

/** Les réglages de l'écoute, gardés d'une visite à l'autre. */
export const MonitoringPreferencesSchema = z.object({
  tempo: z.number().int().min(TEMPO_MIN).max(TEMPO_MAX),
  /** La voix choisie ; absente : la première voix française. */
  voice: z.string().min(1).optional(),
  /** Ce que dit la voix : le texte résultant, ou l'original (la discrépance) ; absente ou inconnue : le résultat. */
  source: z.enum(['result', 'original']).catch('result'),
});
export type MonitoringPreferences = z.infer<typeof MonitoringPreferencesSchema>;

export const DEFAULT_PREFERENCES: MonitoringPreferences = { tempo: DEFAULT_TEMPO, source: 'result' };

/** Ce que dit la voix. */
export type VoiceSource = MonitoringPreferences['source'];

// ponytail: cinq crans réglés à l'oreille ; une table plutôt qu'une formule, pour les retoucher un à un.
const RATES = [0.7, 0.85, 1, 1.2, 1.4];
const GAPS = [450, 320, 220, 140, 80];

/** Un tempo devient une vitesse de voix et un blanc entre deux pas, en millisecondes. */
export function tempoTiming(tempo: number): { rate: number; gap: number } {
  const k = Math.min(Math.max(Math.round(tempo), TEMPO_MIN), TEMPO_MAX) - TEMPO_MIN;
  return { rate: RATES[k]!, gap: GAPS[k]! };
}

/** Port : garde les réglages de l'écoute. */
export interface MonitoringPreferencesStorage {
  /** Les réglages gardés, validés ; illisibles ou absents : les réglages par défaut. */
  load(): MonitoringPreferences;
  save(preferences: MonitoringPreferences): void;
}
