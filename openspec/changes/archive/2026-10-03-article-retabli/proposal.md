# Proposal

## Why

Dans une chaîne S+7 → tautogramme progressif → lipogramme, le texte gardait un article élidé devant un mot devenu consonantique : « l’celé ». Seule l'élision dans un sens était traitée (« le » → « l’ » devant une voyelle) ; rien ne rétablissait « le » ou « la ».

## What Changes

- `restoreArticle` dans `src/domain/letters.ts` : « l’ » devant un mot nouveau à initiale consonantique redevient « le » ou « la », au genre du mot nouveau, sinon du mot remplacé, sinon au masculin.
- Le lipogramme et le tautogramme l'appellent après l'élision, pour chaque mot remplacé.

## Capabilities

### Modified Capabilities
- `lipogramme` : exigence « Élision de l'article ». La spec `tautogramme-progressif` le couvre déjà (« elision SHALL follow the new word »).
