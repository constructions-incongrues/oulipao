# Proposal

## Why

La revue d'ingénierie du 2026-10-04 a relevé plusieurs garde-fous qui existent mais ne tournent pas en CI :
- `npm run check:palette` vérifie contrastes et daltonisme ;
- rien ne vérifie que les références générées (`reference/*.json`) correspondent à leur source annotée ;
- la version de Node attendue n'est déclarée nulle part ;
- le script publié n’est pas minifié (1,3 Mo pour `tracks.js`).

C'est la voie D du plan de correction, indépendante des trois autres.

## What Changes

- La vérification de chaque PR lance aussi `npm run check:palette`, puis `npm run build:references` suivi d'un contrôle que rien n'a changé dans `reference/`.
- La publication refait les mêmes contrôles avant de déployer.
- `package.json` déclare `engines.node` et un fichier `.nvmrc` fixe la version de Node utilisée en local et en CI.
- `npm run build` minifie les scripts assemblés et garde les cartes de source.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `mise-en-ligne` : contrôles de chaque PR et de la publication (palette, références générées).

## Impact

- `.github/workflows/ci.yml` et `release.yml`, `package.json` (scripts `build` et `engines`), nouveau `.nvmrc`.
- Aucun code de `src/` touché. La taille de `dist/*.js` publiée diminue.
