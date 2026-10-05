# Proposal

## Why

Après « Mettre en pistes », quand aucune contrainte n'est en marche, le texte résultant est le texte d'origine, et rien ne dit quoi faire. Le catalogue « Ajouter une contrainte » est replié, deux écrans plus bas, sous le carnet et la saisie. Même « Essayer avec un exemple » arrive sans chaîne : on obtient un Proust inchangé. Le premier geste de l'instrument reste donc introuvable, pour le fondateur comme pour les sept destinataires du lien nu, qui part au plus tard le 6 octobre (jam du 2026-10-04).

## What Changes

- **Une invite dans la bande.** Tant qu'aucune contrainte n'est en marche, une ligne s'affiche sous le texte résultant : « Aucune contrainte en marche : le texte est rendu tel quel. ». Elle porte une touche « Brancher une contrainte » qui ouvre le catalogue, fait défiler l'écran jusqu'à lui et y met le focus. L'invite disparaît dès qu'une contrainte est en marche. Rien ne bouge sans un geste.
- **L'exemple joue.** « Essayer avec un exemple » branche un S+7 sur les noms quand aucune contrainte n'est en marche, puis met le texte en pistes. Une chaîne déjà en marche est gardée telle quelle, comme aujourd'hui.

Hors de ce changement :
- une chaîne propre à chaque exemple ;
- une recette pour l'exemple ;
- l'ouverture ou le défilement automatiques après une mise en pistes.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities
- `interface-a-pistes-reglage-en-direct` :
  - une nouvelle exigence, « Brancher une contrainte depuis la bande » ;
  - l'exigence « Exemples en rotation » change : le S+7 est branché quand aucune contrainte n'est en marche.

## Impact

- `src/ui/tracks/components/result.ts` : l'invite et sa touche.
- `src/ui/tracks/components/browser.ts` : un geste qui ouvre le catalogue, y fait défiler l'écran et y met le focus.
- `src/ui/tracks/app.ts` : les branchements.
- `src/ui/tracks/controller.ts` : `example()` branche le S+7 si aucune contrainte n'est en marche.
- `tracks.html` : le style de l'invite.
- Aucune dépendance, aucun schéma, aucune donnée gardée.
