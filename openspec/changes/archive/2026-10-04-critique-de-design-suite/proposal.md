# Proposal

## Why

La critique de design du 2026-10-04 avait d'autres constats que les trois priorités livrées par `critique-de-design` (#84) :

- le transport de l'écoute flotte entre le catalogue et la grille, hors de tout panneau, et « ESPACE » sous le bouton se lit comme une étiquette, pas comme un raccourci ;
- la phrase d'état (« S+7 sur les noms : 19 noms remplacés sur 20. ») est seule entre deux panneaux, et sans contrainte elle double le message de la chaîne ;
- au téléphone, la bande collée donne environ 60 % de sa hauteur à ses touches ;
- un champ de verrou vide affiche « — » sans dire quelle valeur le mot suit.

Deux constats sont écartés : l'accueil local `/` est la page d'essai des étiqueteurs, voulue (le site publié sert `tracks.html` à la racine) ; les réglages de la chaîne qui passent à la ligne dans leur colonne de 25rem sont conformes, et `DESIGN.md` le dit désormais.

`critique-de-design` a aussi laissé l'exigence « Fenêtre autour du mot » de `inspecteur-de-chaine` en contradiction avec l'inspecteur aligné sur la grille ; ce changement la corrige.

## What Changes

- Le transport (« Écouter », tempo, voix) passe dans l'en-tête de la grille, entre son titre et ses pages ; le raccourci s'écrit en touche de clavier (`<kbd>`, Martian Mono) à côté du bouton.
- La phrase d'état passe dans le panneau de la chaîne, sous son titre ; sans contrainte, le message propre à la chaîne ne s'affiche plus quand la phrase d'état le dit déjà.
- Sous 768 px, la bande collée cache son en-tête et ne garde que le texte.
- Un champ de verrou vide montre en encre secondaire la valeur de l'instance, sauf si le paramètre est modulé ; sous 768 px, le champ passe sous son libellé pour tenir dans la tranche de 116 px.

## Impact

- `src/ui/tracks/app.ts`, `components/chain.ts`, `components/step-grid.ts`, `components/transport.ts`, `components/inspector.ts`, `view-model.ts` (`LockField.inherited`), `tracks.html`.
- `DESIGN.md` (Layout, journal des décisions), `docs/tracks.md`.
