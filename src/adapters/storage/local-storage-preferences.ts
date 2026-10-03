import { DEFAULT_PREFERENCES, MonitoringPreferencesSchema, type MonitoringPreferencesStorage } from '../../ports/monitoring-preferences.ts';

/** La clé des réglages de l'écoute dans le stockage du navigateur. */
export const MONITORING_KEY = 'oulipao.monitoring';

/**
 * Les réglages de l'écoute dans un `Storage` du navigateur (`localStorage`). Ce n'est qu'un confort :
 * une valeur illisible ou un stockage refusé donnent les réglages par défaut, sans erreur.
 */
export function createLocalStoragePreferences(storage: Pick<Storage, 'getItem' | 'setItem'>): MonitoringPreferencesStorage {
  return {
    load() {
      try {
        const parsed = MonitoringPreferencesSchema.safeParse(JSON.parse(storage.getItem(MONITORING_KEY) ?? 'null'));
        return parsed.success ? parsed.data : DEFAULT_PREFERENCES;
      } catch {
        return DEFAULT_PREFERENCES;
      }
    },
    save(preferences) {
      try {
        storage.setItem(MONITORING_KEY, JSON.stringify(MonitoringPreferencesSchema.parse(preferences)));
      } catch {
        // Stockage plein ou refusé (navigation privée) : le réglage vaut pour cette visite seulement.
      }
    },
  };
}
