# Proposal

## Why

Le lien nu part le 6 octobre 2026 à 7 proches, sans exemple ni relance (`roadmap.md`, NOW 3). La page vide ne dit pas quoi faire : une première personne la trouve « austère et abscons », une autre ne repère pas le résultat, et « Essayer avec un exemple » met un texte en pistes sans aucune contrainte, donc rien ne change à l'écran. Sans le fondateur pour expliquer, le silence d'un destinataire ne prouverait rien. PRD : `.nanopm/wiki/docs/prds/premier-contact.md`.

## What Changes

- Une phrase d'accueil sur la page vide, au-dessus de la saisie, qui nomme l'instrument et ses trois gestes ; elle disparaît dès qu'un texte résultant existe et n'apparaît pas pendant une arrivée par lien.
- L'exemple qui joue est déjà livré par #107 (un S+7 sur les noms quand aucune contrainte n'est en marche) ; ce changement ne le modifie pas. Éclipse, envisagée d'abord, est écartée : au téléphone, elle montre d'abord l'original intact, et le S+7 n'apparaît qu'après défilement.

## Capabilities

### New Capabilities

_(aucune)_

### Modified Capabilities

- `interface-a-pistes-reglage-en-direct` : ajout de l'exigence « Phrase d'accueil sur la page vide ».

## Impact

- Couche ui seulement : `src/ui/tracks/components/source.ts`, `src/ui/tracks/app.ts` et `tracks.html` (affichage de la phrase), tests sous `test/ui/tracks/`.
- Aucune dépendance nouvelle, rien dans `src/domain`, `src/ports` ni `src/adapters`.
- Hors périmètre : vidéo ou démo, mesure d'audience, ouverture avec un exemple déjà joué, chemin d'arrivée par lien.
