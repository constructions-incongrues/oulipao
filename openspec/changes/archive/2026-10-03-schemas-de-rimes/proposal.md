# Proposition : les schémas de rimes

## Why

La textbank phonétique est livrée, avec le R+n, le monorime, l'antirime et les homophonies. Mais chacun de ces filtres traite une fin de vers seule, ou contre toutes les autres. Aucun ne sait donner une **forme** à un poème : des rimes plates, croisées ou embrassées, une étreinte en miroir, l'alternance des rimes masculines et féminines, une rime en tête de vers.

C'est pourtant le cœur de la famille des rimes dans le catalogue des contraintes (`.nanopm/wiki/docs/catalogue-contraintes.md`, E2). Le PRD est `.nanopm/wiki/docs/prds/schemas-de-rimes.md` et le découpage `.nanopm/wiki/docs/tasks/schemas-de-rimes.md`.

## What Changes

- **Genre de la rime.** Une rime est féminine quand le mot finit par un e muet, masculine sinon. La rime se découpe aussi en voyelle et en consonne finale.
- **Monorime à genre.** Le monorime reçoit un réglage de genre : indifférent, masculin, féminin ou alterné. Le sonnet monorime est un monorime alterné.
- **Schéma de rimes**, une contrainte nouvelle. On choisit un schéma dans une liste fermée : plates, croisées, embrassées, étreinte en miroir ou rime bisexuelle. On règle aussi la richesse et le genre (indifférent ou alterné). Dans chaque strophe :
  - le premier vers d'une lettre fixe sa rime ;
  - les vers suivants de la même lettre prennent cette rime ;
  - un vers d'une autre lettre qui rime par accident perd la rime.
- **Antérime**, une contrainte nouvelle. Le premier mot plein de chaque vers rime avec celui du vers voisin.
- **Rime berrychonne**, une contrainte nouvelle. La fin du 3e vers porte la consonne de l'une des deux rimes précédentes et la voyelle de l'autre.
- **Début de vers.** Chaque mot sait s'il est le premier mot plein de son vers.
- **Inspecteur.** Pour une fin de vers, il montre aussi le genre de la rime et la lettre du vers dans le schéma.
- **Refrains.** Le rondel et la villanelle ne font pas partie de ce changement : ils dupliquent des vers et cassent l'alignement mot à mot de la chaîne. Une tâche rédige leur proposition à part.

## Capabilities

### New Capabilities

- `schemas-de-rimes` : le genre de la rime, les schémas nommés (plates, croisées, embrassées, étreinte, rime bisexuelle), l'antérime et la rime berrychonne.

### Modified Capabilities

- `filtres-de-rime` : le monorime reçoit un réglage de genre.
- `vers-et-strophes` : le premier mot plein de chaque vers est repéré.
- `inspecteur-de-chaine` : l'inspecteur montre le genre de la rime et la lettre du vers dans le schéma.

## Impact

- **domain** :
  - `src/domain/phonetics/rhyme.ts` : le genre et la découpe en voyelle et consonne ;
  - `src/domain/phonetics/lookup.ts` : le e muet devient partagé ;
  - `src/domain/verse.ts` : `lineStart` ;
  - `src/domain/rhyme/engine.ts` : la pré-passe planifiée est extraite de l'antirime ;
  - `src/domain/rhyme/scheme.ts`, nouveau : les lettres par strophe ;
  - `src/domain/rhyme/rhyme-scheme.ts`, `anterhyme.ts` et `berrychonne.ts`, nouveaux ;
  - `src/domain/rhyme/monorhyme.ts` et `antirhyme.ts`, modifiés.
- **ui** :
  - `src/ui/tracks/mixer-state.ts` : l'enregistrement des trois filtres ;
  - `view-model.ts`, `components/inspector.ts` et `app.ts`.
- **Données** : aucune nouvelle. La textbank phonétique déjà chargée à la demande suffit.
- **Hors de ce changement** :
  - les refrains (E3) ;
  - un schéma tapé librement (E1) ;
  - imposer un mètre ;
  - composer un poème à partir de rien.
