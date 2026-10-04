import { initialState, reduce } from '../../src/ui/tracks/mixer-state.ts';
import type { MixerAction } from '../../src/ui/tracks/types.ts';

/** La chaîne des tests : un S+7 en marche sur les noms, puis un lipogramme coupé. */
export const SEED: readonly MixerAction[] = [
  { type: 'add-instance', plugin: 's7' },
  { type: 'add-instance', plugin: 'lipogram' },
  { type: 'toggle-instance', id: 'lipogram-1' },
];

export const seededState = SEED.reduce(reduce, initialState);

/** Le texte de travail des tests de la page : ses noms sont connus du lexique factice. */
export const SAMPLE_TEXT =
  "Le matin où la vieille horloge du village s'arrêta, personne ne le remarqua vraiment. Le boulanger ouvrit sa boutique à l'heure habituelle, les enfants coururent vers l'école, et le chat du notaire dormit au soleil sur le mur de la mairie.";
