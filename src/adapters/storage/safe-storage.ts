/** Un `Storage` réduit à ce dont les adaptateurs du navigateur ont besoin. */
export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Un stockage en mémoire, perdu à la fermeture de l'onglet. */
export function memoryStorage(): KeyValueStorage {
  const items = new Map<string, string>();
  return { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => void items.set(key, value) };
}

/**
 * Le stockage du navigateur, ou un stockage en mémoire quand le navigateur le refuse (cookies
 * bloqués : lire `localStorage` lève). `persistent` dit lequel des deux on a.
 */
export function safeStorage(get: () => KeyValueStorage): { storage: KeyValueStorage; persistent: boolean } {
  try {
    const storage = get();
    storage.getItem('oulipao.probe'); // certains navigateurs ne refusent qu'au premier accès
    return { storage, persistent: true };
  } catch {
    return { storage: memoryStorage(), persistent: false };
  }
}
