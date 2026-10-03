# Proposition : lien vers le dépôt GitHub sur le site

## Why

Le code d'Oulipao est ouvert (licence MIT) et publié sur `github.com/constructions-incongrues/oulipao`, mais rien sur le site n'y mène. Qui ouvre `https://oulipao.incongru.org` ne peut ni lire le code, ni vérifier la promesse « le texte reste dans le navigateur », ni signaler un problème.

## What Changes

- La page à pistes porte, dans sa barre de marque, un lien « Code source » vers `https://github.com/constructions-incongrues/oulipao`, placé entre le sous-titre et la touche « Clair / sombre ».
- La page d'essai (`essai.html` en ligne) porte le même lien, dans son paragraphe d'introduction.
- Le lien s'ouvre dans le même onglet. C'est une hypothèse : un lien normal, que le lecteur peut ouvrir ailleurs s'il le veut.

## Capabilities

### New Capabilities
<!-- Aucune. -->

### Modified Capabilities
- `mise-en-ligne` : ajout d'une exigence, le lien vers le dépôt du code depuis les deux pages publiées.

## Impact

- **ui :** `src/ui/tracks/app.ts` (barre de marque) et son test `test/ui/tracks/app.test.ts`.
- **Pages :** `index.html` (page d'essai), et `tracks.html` pour le style du lien dans la barre.
- **Rien d'autre :** aucune dépendance, aucun changement du domaine, ni de la publication.
