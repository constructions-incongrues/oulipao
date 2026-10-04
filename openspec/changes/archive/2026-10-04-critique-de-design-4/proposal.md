# Proposal

## Why

La troisième critique de design du 2026-10-04 (après #84, #91 et #93) a relevé :

- le carnet ouvert repousse l'instrument : avec 8 entrées, il mesure 9 164 px, soit dix écrans, entre la bande et la saisie ;
- une recette par vers appliquée à un texte d'un seul vers ne prévient pas : Haï-kaïsation sur la prose de Proust donne « Charles-Quint. » et la phrase d'état dit seulement « 117 mots retirés », alors que l'exemple proposé tourne entre prose et poésie ;
- hors état collé, la bande défile en elle-même (jusqu'à 60 % de l'écran) et capte la molette ;
- la ligne Bord dit « Ne garde que les 1 mot de la fin de chaque vers. » ;
- dans le carnet, la mention commence en minuscule, alors que la phrase d'état prend la majuscule.

L'exigence « Texte résultant toujours visible » dit encore que la copie reste atteignable dans la bande collée, ce que #91 a changé au téléphone ; ce changement la remet d'accord.

## What Changes

- Chaque entrée du carnet est un dépliant, replié par défaut : sa date, ses premiers mots et sa règle sur une ligne (deux sous 768 px). Déplié, il montre l'ascendance, le texte, la mention et les gestes. La mention prend une majuscule.
- Quand un Bord (donc Haï-kaïsation) agit sur un texte d'un seul vers, sans mise en vers avant lui, la phrase d'état ajoute « Le texte n'a qu'un vers : collez un poème, ou mettez-le d'abord en vers. ».
- Hors état collé, la bande n'a plus de hauteur maximale ni de défilement propre.
- L'aide du Bord s'accorde pour un seul mot : « Ne garde que le dernier mot de chaque vers. », etc.

## Impact

- `src/ui/tracks/components/notebook.ts`, `src/ui/tracks/view-model.ts` (`TracksView.verses`, `verseWarning`), `src/domain/edge/plugin.ts`, `tracks.html`.
- `DESIGN.md` (Layout, journal), `docs/tracks.md`.
