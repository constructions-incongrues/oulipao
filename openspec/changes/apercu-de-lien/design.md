# Design

## Context

`scripts/build-site.ts` copie `tracks.html` vers `_site/index.html` et `index.html` vers `_site/essai.html`, sans aucune transformation. Il échoue en nommant toute source manquante. Les deux pages n'ont aujourd'hui que `charset`, `viewport` et `<title>`. Le corps de la page à pistes est un `<div id="app">` rempli par le JavaScript.

## Goals / Non-Goals

**Goals :**
- Les balises vivent en clair dans les fichiers HTML sources, sans gabarit ni étape de build supplémentaire.
- L'image et l'icône sont des fichiers statiques versionnés.

**Non-Goals :**
- Un mécanisme générique de métadonnées par page : il n'y a que deux pages, et une seule a besoin d'un aperçu.
- La régénération automatique de l'image.

## Decisions

**Balises écrites à la main dans `tracks.html`.** On n'injecte rien au build depuis une constante. L'adresse `https://oulipao.incongru.org` apparaît donc à la fois dans le HTML et dans `DOMAIN` de `build-site.ts`. Le test détecte toute divergence. Alternative écartée : un gabarit au build, qui ajoute une étape pour cinq lignes de HTML.

**Image : un PNG tiré une fois d'une composition HTML.** La composition `og/og-image.html` utilise les jetons de `styles/tokens.css` et les polices de `fonts/`. On en tire le PNG de 1200×630 par une capture dans un navigateur, à la main, au moment de l'implémentation. Les deux fichiers sont versionnés. Alternative écartée : une génération au build avec un navigateur headless, qui demanderait une dépendance lourde en CI pour une image qui change rarement. Le PNG s'impose parce que WhatsApp et Facebook n'affichent pas une image d'aperçu en SVG.

**Icône : un SVG dessiné à la main.** Son contenu doit être autonome, sans police web chargée : une forme vectorielle à l'encre de `DESIGN.md`. On propose un rond percé, le poinçon des noms, ou un « O » en pochoir vectorisé. Le fondateur valide le choix sur rendu, puisque `DESIGN.md` ne prévoit pas encore d'icône. L'icône est déclarée sur les deux pages.

**Textes.** Titre : « Oulipao — Ouvroir de Littérature Potentielle Assistée par Ordinateur ». Description : « Collez un texte : Oulipao le range en pistes (noms, verbes, adjectifs…) et y branche des contraintes oulipiennes que l'on règle en direct, comme sur une table de mixage. Tout tourne dans le navigateur. » Le `<title>` et `og:title` sont identiques, tout comme la description et `og:description`.

**Couche et test.** Le changement touche la couche `ui` (les pages HTML) et le script d'assemblage. Il ne dépend d'aucun port. Le test `test/ui/link-preview.test.ts` lit `tracks.html` et `index.html` comme du texte et vérifie la présence des balises, les adresses absolues, l'existence locale des fichiers visés et les dimensions du PNG, lues dans son en-tête IHDR. Il n'utilise pas de parseur HTML : des expressions régulières sur des balises qu'on écrit soi-même suffisent.

## Risks / Trade-offs

- [Cache des messageries] Un lien déjà partagé garde l'ancien aperçu pendant un moment → on vérifie avec une adresse jamais partagée, par exemple `https://oulipao.incongru.org/?v=1`, ou avec l'outil de débogage d'une plateforme.
- [L'image vieillit quand l'interface change] → elle montre la marque et le principe, pas une capture de l'interface. On la retire à la main si `DESIGN.md` change.
- [Polices dans la capture] Si les polices ne sont pas chargées au moment de la capture, le rendu se dégrade → on capture après `document.fonts.ready`.

## Choix du fondateur (2026-10-03)

- Icône : le rond percé, poinçon des noms, plein, en bleu sur la façade (`favicon.svg`).
- Image : la marque seule, avec la sérigraphie et les cinq poinçons (`og/og-image.html`, capturé dans `og-image.png` par Chrome headless).
