# Proposition : la textbank phonétique et les filtres de rime

## Why

Tous les filtres d'Oulipao travaillent sur l'écrit : l'ordre du dictionnaire pour le S+n, les lettres pour le lipogramme. Aucun ne sait ce qu'un mot fait entendre, si bien que toute la famille des rimes et des homophonies est hors d'atteinte. Le catalogue des contraintes (`.nanopm/wiki/docs/catalogue-contraintes.md`) range cette évolution, E2, au premier rang : elle débloque 17 contraintes et en outille 7 autres. Le fondateur l'a mise en tête de la roadmap (NOW 2, 2026-10-03). Le PRD est `.nanopm/wiki/docs/prds/textbank-phonetique.md`.

## What Changes

- **Données.** Un fichier dérivé, `data/phonetique-oulipao.tsv`, est tiré d'un lexique libre qui porte la prononciation. Par hypothèse, c'est GLÀFF (CC BY-SA 3.0), retenu tant que l'ambiguïté de licence de Lexique 3.83 n'est pas levée. Le fichier donne pour chaque forme :
  - sa catégorie ;
  - ses phonèmes ;
  - ses syllabes ;
  - sa rime.

  Un script `npm run build:phonetics` le produit. Le fichier porte sa licence et son attribution dans son en-tête et dans `THIRD_PARTY_LICENSES.md`.
- **Port.** Un port de phonétique donne :
  - les lectures d'une forme : phonèmes, syllabes, rime ;
  - les homophones d'une forme dans une catégorie ;
  - le test de rime entre deux formes à une richesse donnée (pauvre, suffisante, riche).

  Un adaptateur en mémoire valide chaque ligne par un schéma zod.
- **Phonétisation de repli.** Un mot absent du fichier est phonétisé par des règles écrites dans le domaine. Sa marque porte la raison « prononciation devinée ».
- **Chargement à la demande.** La textbank n'est chargée que lorsqu'une instance active de la chaîne est un filtre phonétique. Le premier chargement de la page ne change pas.
- **Vers et strophes.** Le texte reçoit une découpe en vers (une ligne) et en strophes (blocs séparés par une ligne vide). Elle est calculée à partir des blancs entre les mots, sans toucher au contrat de sortie mot à mot. Chaque mot connaît son vers, sa strophe, et sait s'il est le dernier mot plein de son vers.
- **Quatre contraintes nouvelles**, toutes instanciables, ciblables, enchaînables, et qui respectent les pas bouchés et les verrous :
  - **R+n** : un mot devient le n-ième voisin du dictionnaire, dans sa catégorie, parmi ceux qui riment avec lui. Il est accordé comme au S+n. Ses réglages : n, la richesse, et la portée (tous les mots visés ou fins de vers seulement).
  - **Monorime** : chaque fin de vers visée prend une rime choisie dans une liste fermée, celle des rimes les plus fréquentes du lexique.
  - **Antirime** : une fin de vers qui rime avec une fin de vers précédente de sa strophe est remplacée par le premier voisin qui ne rime pas.
  - **Homophonies** : un mot devient un homophone de même catégorie. S'il n'en a pas, il reste tel quel, avec sa raison.
- **Inspecteur.** Il montre la prononciation, les syllabes et la rime du mot ouvert.
- **Texte résultant.** Il montre le nombre de syllabes de chaque vers.

## Capabilities

### New Capabilities

- `textbank-phonetique` : les données phonétiques dérivées, le port, la définition de la rime et de sa richesse, la phonétisation de repli, la licence et le chargement à la demande.
- `vers-et-strophes` : la découpe du texte en vers et en strophes, et le repérage des fins de vers.
- `filtres-de-rime` : les contraintes R+n, monorime, antirime et homophonies.

### Modified Capabilities

- `inspecteur-de-chaine` : l'inspecteur montre la prononciation, les syllabes et la rime du mot ouvert.
- `interface-a-pistes-reglage-en-direct` : le texte résultant montre le nombre de syllabes de chaque vers ; les états d'attente couvrent la textbank phonétique.

## Impact

- **domain** :
  - `src/domain/phonetics/`, nouveau : la rime, la richesse et la phonétisation de repli ;
  - `src/domain/verse.ts`, nouveau ;
  - `src/domain/rhyme/`, nouveau : les quatre contraintes ;
  - `src/domain/plugin.ts` : `PluginResources` gagne `phonetics?` ;
  - `src/domain/neighbours.ts`, nouveau : le n-ième voisin qui passe un critère, partagé avec le lipogramme ;
- **ports** : `src/ports/phonetics.ts`, nouveau.
- **adapters** :
  - `src/adapters/lexicon/glaff-phonetics.ts`, nouveau : la dérivation ;
  - `src/adapters/morphology/in-memory-phonetics.ts`, nouveau.
- **ui** :
  - `src/ui/composition.ts` : le chargeur et `PHONETICS_VERSION` ;
  - `src/ui/tracks/controller.ts` : l'état `phonetics` ;
  - `src/ui/tracks/mixer-state.ts` : `installedPlugins` ;
  - `src/ui/tracks/view-model.ts`, `components/inspector.ts` et `components/result.ts`.
- **Données et scripts** : `scripts/build-phonetics.ts`, `data/phonetique-oulipao.tsv`, `package.json`, `THIRD_PARTY_LICENSES.md`, `docs/lexiques.md`, `docs/plugins.md`.
- **Hors de ce changement** :
  - déplacer, dupliquer ou insérer des vers (E3) ;
  - un filtre qui réécrit pour tenir un mètre ;
  - le paramètre texte libre (E1) ;
  - toute autre langue que le français.
