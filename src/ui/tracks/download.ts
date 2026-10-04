import { realSchedule, type Schedule } from './schedule.ts';

/** Ce dont le téléchargement a besoin du navigateur. */
export interface DownloadHost {
  createObjectURL(blob: Blob): string;
  revokeObjectURL(url: string): void;
  /** Un lien prêt à cliquer. */
  link(href: string, download: string): { click(): void };
}

/**
 * Propose un fichier à enregistrer, sans rien envoyer. L'adresse du fichier n'est révoquée qu'après
 * le clic traité : révoquée aussitôt, Safari et Firefox peuvent annuler le téléchargement.
 */
export function downloadText(host: DownloadHost, name: string, text: string, schedule: Schedule = realSchedule): void {
  const url = host.createObjectURL(new Blob([text], { type: 'application/json' }));
  host.link(url, name).click();
  schedule(() => host.revokeObjectURL(url), 0);
}
