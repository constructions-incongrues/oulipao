import { edgePlugin } from './edge/plugin.ts';
import { lineationPlugin } from './lineation/plugin.ts';
import { lipogramPlugin } from './lipogram/plugin.ts';
import type { ConstraintPlugin } from './plugin.ts';
import { anterhymePlugin } from './rhyme/anterhyme.ts';
import { antirhymePlugin } from './rhyme/antirhyme.ts';
import { berrychonnePlugin } from './rhyme/berrychonne.ts';
import { homophonyPlugin } from './rhyme/homophony.ts';
import { monorhymePlugin } from './rhyme/monorhyme.ts';
import { rhymeSchemePlugin } from './rhyme/rhyme-scheme.ts';
import { rnPlugin } from './rhyme/rn.ts';
import { s7Plugin } from './s7/plugin.ts';
import { tautogramPlugin } from './tautogram/plugin.ts';
import { trackSortPlugin } from './track-sort/plugin.ts';

/** Les types de contraintes qu'on peut brancher sur la table : une contrainte nouvelle s'inscrit ici, dans le domaine. */
export const installedPlugins: readonly ConstraintPlugin[] = [s7Plugin, lipogramPlugin, trackSortPlugin, edgePlugin, lineationPlugin, rnPlugin, monorhymePlugin, antirhymePlugin, homophonyPlugin, rhymeSchemePlugin, anterhymePlugin, berrychonnePlugin, tautogramPlugin];
