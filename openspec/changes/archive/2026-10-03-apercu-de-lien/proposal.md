# Proposal

## Why

Le lien `https://oulipao.incongru.org` commence à circuler par messagerie, auprès d'amis et de proches. Aujourd'hui, la carte d'aperçu affiche seulement « Oulipao — pistes » et l'adresse : il n'y a ni description, ni image, ni icône. Les robots d'aperçu n'exécutent pas le JavaScript, et le `<head>` statique ne leur donne rien d'autre à lire.

## What Changes

- La page d'accueil (`tracks.html`) reçoit un titre d'accroche, une description et les balises Open Graph et Twitter Card. Les adresses y sont absolues.
- Une image d'aperçu de 1200×630 en PNG, conforme à `DESIGN.md`, est publiée avec le site. Elle est tirée une fois d'une composition HTML versionnée.
- Une icône SVG est publiée et déclarée sur les deux pages.
- La page d'essai (`essai.html`) est exclue de l'indexation.
- Un test vérifie que ces balises sont présentes et que leurs adresses sont absolues.

Hors périmètre : `robots.txt`, `sitemap.xml`, les données structurées, le pré-rendu du corps de la page et la génération automatique de l'image au build.

## Capabilities

### New Capabilities
<!-- Aucune -->

### Modified Capabilities
- `mise-en-ligne` : deux exigences sont ajoutées, « Aperçu de lien » pour la page d'accueil et « Page d'essai hors index ».

## Impact

- `tracks.html` et `index.html` : le `<head>` seulement.
- `scripts/build-site.ts` : copie de l'image d'aperçu et de l'icône.
- Nouveaux fichiers : l'icône SVG, l'image PNG et sa composition HTML source.
- Un nouveau test dans `test/ui/`.
- Aucune dépendance ajoutée. Aucune requête vers un tiers : la promesse « le texte reste dans le navigateur » tient toujours.
