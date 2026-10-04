import { StalledError } from '../../ports/stalled.ts';

/** Le délai sans aucune donnée reçue après lequel un chargement est arrêté. */
export const STALL_MS = 30_000;

/** Les minuteurs, remplaçables dans les tests. */
export interface Timers {
  set(callback: () => void, ms: number): unknown;
  clear(handle: unknown): void;
}

export const realTimers: Timers = {
  set: (callback, ms) => setTimeout(callback, ms),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
};

export interface InactivityOptions {
  /** Ce qui charge, pour le message : « du modèle ». */
  resource: string;
  ms?: number;
  timers?: Timers;
}

/**
 * Un minuteur d'inactivité : `touch` le réarme à chaque signe de vie, `stop` le coupe. S'il
 * expire, `onStall` reçoit une `StalledError`. Un réseau lent mais vivant n'est jamais coupé.
 */
export function inactivityTimer(onStall: (error: StalledError) => void, { resource, ms = STALL_MS, timers = realTimers }: InactivityOptions) {
  let handle: unknown;
  const stop = () => {
    if (handle !== undefined) timers.clear(handle);
    handle = undefined;
  };
  const touch = () => {
    stop();
    handle = timers.set(() => {
      handle = undefined;
      onStall(new StalledError(resource, Math.round(ms / 1000)));
    }, ms);
  };
  return { touch, stop };
}

/**
 * Lance un chargement qui signale son avancement, et l'arrête s'il ne progresse plus : la promesse
 * rejette alors avec une `StalledError`, même si le chargement sous-jacent ne s'interrompt pas.
 */
export function watchProgress<T>(
  start: (onProgress: (loaded: number, total: number) => void) => Promise<T>,
  onProgress: (loaded: number, total: number) => void,
  options: InactivityOptions,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = inactivityTimer((error) => {
      settled = true;
      reject(error);
    }, options);
    timer.touch();
    start((loaded, total) => {
      if (settled) return;
      timer.touch();
      onProgress(loaded, total);
    }).then(
      (value) => {
        timer.stop();
        if (!settled) resolve(value);
      },
      (error: unknown) => {
        timer.stop();
        if (!settled) reject(error);
      },
    );
  });
}
