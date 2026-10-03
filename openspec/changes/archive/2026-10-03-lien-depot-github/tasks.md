# Tâches : lien vers le dépôt GitHub

## 1. Page à pistes (ui)

- [x] 1.1 ui : dans `src/ui/tracks/app.ts`, exporter `SOURCE_URL = 'https://github.com/constructions-incongrues/oulipao'` et ajouter `<a class="key source-link" href=${SOURCE_URL}>Code source</a>` dans la barre de marque, entre le sous-titre et la touche « Clair / sombre ». Dans `test/ui/tracks/app.test.ts`, vérifier que le rendu contient ce lien avec cette adresse. Vérifié par `npm test`, couverture au-dessus de 90 %.
- [x] 1.2 ui : dans `tracks.html`, ajouter le style `a.key` : celui des touches, sans soulignement, `display: inline-flex; align-items: center`. Vérifié en ouvrant la page en clair et en sombre, avec le lien au focus clavier.

## 2. Page d'essai (pages)

- [x] 2.1 Dans `index.html`, ajouter au paragraphe d'introduction « Le code est ouvert : Code source. », le lien pointant vers le dépôt. Vérifié en ouvrant la page.

## 3. Vérification

- [x] 3.1 Lancer `npm run typecheck`, `npm test` et `npm run build:site`. Servir `_site/`, puis vérifier à 1440 et 375 px que le lien est visible dans la barre, qu'il mène au dépôt et que la page ne défile pas à l'horizontale ; vérifier aussi le lien de `essai.html`. Si la barre déborde à 375 px, raccourcir le libellé en « Code » (voir le design).
