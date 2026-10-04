# Design

## Context

Aujourd'hui, `ci.yml` et `release.yml` lancent `npm ci`, `typecheck`, `test` et `build:site`, sous Node 22, sans version déclarée par le projet. `check:palette` sort en code 1 en cas d'échec (`scripts/check-palette.ts:12`). `build:references` reconstruit `reference/texte-N.json` à partir de `reference/texte-N.annote.txt`, deux fichiers versionnés : le contrôle peut donc tourner en CI sans les données brutes de `data/brut/`. Les autres dérivations (lexique, morphologie, verbes, phonétique, `frequent-rhymes.ts`) en ont besoin et restent hors CI. Voir proposal.md pour les raisons.

## Goals / Non-Goals

**Goals :**
- Faire tourner en CI des garde-fous déjà écrits, sans en écrire de nouveaux.
- Une version de Node unique, déclarée.

**Non-Goals :**
- Reconstruire en CI les données tirées de Grammalecte et de GLÀFF (sources brutes absentes du dépôt).
- Versionner les fichiers dérivés par empreinte (RISK-07, suivi à part).

## Decisions

### D1. Même suite de contrôles dans les deux workflows

On ajoute deux étapes, dans le même ordre dans `ci.yml` et dans `release.yml`, après `npm test` : `npm run check:palette`, puis `npm run build:references && git diff --exit-code -- reference/`. Pas de workflow réutilisable : deux fichiers de quelques lignes restent plus lisibles qu'une indirection.

### D2. Version de Node

`.nvmrc` contient `22`, et `package.json` déclare `"engines": { "node": ">=22.18" }`, première version 22 qui exécute le TypeScript sans option. `actions/setup-node` lit `node-version-file: .nvmrc` au lieu de la valeur écrite en dur.

### D3. Minification

Le script `build` gagne `--minify`, et `--sourcemap` reste. Les tests ne passent pas par le bundle, donc rien d'autre ne change. On vérifie à la main que les deux pages fonctionnent dans l'aperçu après `build:site`.

## Risks / Trade-offs

- [`build:references` produit un JSON au formatage instable] → le script écrit `JSON.stringify(…, null, 2)` suivi d'un saut de ligne, ce qui est déterministe ; on lance le contrôle une fois en local avant de pousser.
- [La minification casse un nom utilisé à l'exécution] → aucun code ne lit `Function.name` ; on vérifie dans l'aperçu.
- [`engines` trop strict pour un poste plus ancien] → npm ne fait qu'avertir, sauf `engine-strict` ; `.nvmrc` dit la bonne version.

## Migration Plan

Une PR `ci:`, qui n'entre pas au journal des versions. On revient en arrière par revert.
