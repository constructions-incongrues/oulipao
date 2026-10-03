# Tasks

## 1. Test d'abord

- [x] 1.1 (ui) `test/ui/link-preview.test.ts` : il lit `tracks.html` et vérifie le titre, la description, les `og:*` (dont `og:image:width`, `og:image:height`, `og:image:alt` et `og:locale=fr_FR`) et `twitter:card=summary_large_image`. Il vérifie que les adresses commencent par `https://oulipao.incongru.org/`, que l'icône est déclarée sur les deux pages, que `essai.html` (source `index.html`) porte `noindex`, et que le PNG visé existe en 1200×630, lu dans l'en-tête IHDR. Vérification : `npm test` échoue sur ce test.

## 2. Visuels

- [x] 2.1 (ui) Icône SVG `favicon.svg` en deux variantes, le rond percé et le « O » en pochoir vectorisé. Le fondateur en choisit une. Vérification : la variante retenue s'affiche dans l'onglet en servant le site localement.
- [x] 2.2 (ui) Composition `og/og-image.html` en 1200×630, avec les jetons et les polices du site, en deux variantes : la marque seule, ou la marque et une bande S+7. Le fondateur en choisit une. Vérification : maquettes montrées au fondateur et choix noté dans `design.md`.
- [x] 2.3 Capture de la variante retenue dans `og-image.png`, après le chargement des polices. Vérification : le fichier fait 1200×630 et la partie du test 1.1 qui porte sur l'image passe.

## 3. Pages et assemblage

- [x] 3.1 (ui) `<head>` de `tracks.html` : titre, description, Open Graph, Twitter Card et icône. Vérification : le test 1.1 passe pour la page d'accueil.
- [x] 3.2 (ui) `<head>` de `index.html` : icône et `<meta name="robots" content="noindex">`. Vérification : le test 1.1 passe pour la page d'essai.
- [x] 3.3 `scripts/build-site.ts` copie `og-image.png` et `favicon.svg` à la racine de `_site/`. Vérification : `npm run build:site`, puis les deux fichiers sont présents dans `_site/`. Une source manquante fait échouer le build en la nommant.
- [x] 3.4 `npm run typecheck` et `npm test` passent, avec une couverture toujours au-dessus de 90 %.

## 4. Vérification en ligne

- [ ] 4.1 Après le déploiement, on colle `https://oulipao.incongru.org/?v=1` dans une messagerie : la carte montre le titre, la description et l'image. Capture jointe à la PR.
