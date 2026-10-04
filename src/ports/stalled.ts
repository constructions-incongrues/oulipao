/**
 * Un chargement qui ne reçoit plus rien : il a été arrêté. `resource` nomme ce qui chargeait, prêt
 * à lire dans une phrase : « du modèle », « du dictionnaire », « des verbes », « des prononciations ».
 */
export class StalledError extends Error {
  readonly resource: string;
  readonly seconds: number;
  constructor(resource: string, seconds: number) {
    super(`le chargement ${resource} ne reçoit plus rien depuis ${seconds} secondes`);
    this.name = 'StalledError';
    this.resource = resource;
    this.seconds = seconds;
  }
}
