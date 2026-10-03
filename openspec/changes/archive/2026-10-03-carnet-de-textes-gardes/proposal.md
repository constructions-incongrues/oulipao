# Carnet de textes gardés

## Why

Un texte obtenu dans Oulipao disparaît dès qu'on ferme l'onglet ou qu'on tourne un autre bouton. Le seul moyen de le garder est « Copier » puis le coller ailleurs, et ce geste n'est jamais fait : le 2026-10-03, huit changements ont été livrés et aucun texte n'a été gardé. L'objectif O2 se lit dans des « textes datés, rangés, avec la mention de la chaîne ». Sans endroit pour les ranger, ni O2 ni la garde de la stratégie (« trois semaines sans texte gardé ») ne se mesurent. C'est l'item 1 du NOW.

## What Changes

- Un bouton **« Garder »** à côté de « Copier », actif dans les mêmes conditions. Il range dans le carnet :
  - le texte résultant et la date ;
  - la mention de la chaîne, la même que celle de la copie ;
  - de quoi rouvrir le texte : le texte d'origine avec son étiquetage, et l'état de la table (instances, réglages, verrous, pas bouchés, pistes coupées, forme).
- Une section **« Carnet »** en bas de la page des pistes. Elle donne le nombre de textes gardés, puis la liste du plus récent au plus ancien, avec pour chacun la date, le texte et la mention.
- **Rouvrir** une entrée : le texte d'origine revient dans la saisie, et la table reprend l'état gardé. Le texte n'est pas réétiqueté, si bien que le texte résultant redevient celui qui avait été gardé.
- **Supprimer** une entrée, après confirmation.
- **Exporter** le carnet dans un fichier JSON daté, et **importer** un tel fichier. Le fichier est validé, les entrées sont fusionnées par identifiant et les entrées invalides sont signalées.
- Le carnet est stocké dans le navigateur. Aucune requête réseau ne contient un texte gardé.

## What's not changing

- Pas d'édition d'un texte gardé, pas d'étiquettes, pas de recherche dans le carnet.
- Pas de partage (lien, image), pas de synchronisation entre appareils, pas de compte.
- Un texte n'entre dans le carnet que par « Garder » : « Copier » n'y range rien.

## Capabilities

### New Capabilities
- `carnet-de-textes-gardes` : garder un texte avec sa chaîne, lister le carnet, rouvrir, supprimer, exporter et importer.

### Modified Capabilities
- `interface-a-pistes-reglage-en-direct` : l'ordre de la page gagne la section « Carnet » en dernier ; le traitement dans le navigateur couvre aussi les textes gardés.

## Impact

- Nouveau port `src/ports/notebook-storage.ts` et son adaptateur navigateur `src/adapters/storage/`.
- Nouveau module `src/ui/tracks/notebook.ts`. Il contient le schéma zod d'une entrée, qui réutilise `MixerStateSchema` et `TaggedWordSchema`, ainsi que l'ajout, la suppression, la fusion et la lecture validée.
- `src/ui/tracks/controller.ts` : les gestes garder, rouvrir, supprimer, exporter et importer.
- Nouveau composant `src/ui/tracks/components/notebook.ts` ; `components/result.ts` (bouton « Garder ») ; `app.ts` ; `main.ts` (stockage et téléchargement).
- `docs/tracks.md`.

## Ties to

- Roadmap : NOW 1, « Carnet de textes gardés ».
- Objectif : O2, KR1 à KR3, dont il est l'instrument de mesure.
- PRD : `.nanopm/wiki/docs/prds/carnet-de-textes-gardes.md`.
