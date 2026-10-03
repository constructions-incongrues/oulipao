# Tâches

## 1. Domaine

- [x] 1.1 [domain] Ajouter `eclipse` à `FormSchema` et `FORM_LABELS`, et le paramètre `source` à `layoutForm` : pour éclipse, le texte d'origine, une ligne vide, puis les segments. Vérifier dans les tests des formes : la sortie éclipse, `missing` à 0, et les autres formes inchangées.
- [x] 1.2 [domain] Ajouter `dieRoll(seed, index)` (de 1 à 6, pur) et, dans le S+n, les réglages `draw` (fixe ou au dé) et `seed`. `offsetAt` choisit le verrou, puis le dé, puis le décalage ; le titre au dé est « S+dé ». Vérifier par les tests :
  - toutes les faces sortent sur 600 positions, chacune entre 60 et 140 fois ;
  - même graine, même texte ;
  - une autre graine change au moins un décalage ;
  - un verrou garde la priorité ;
  - le titre et l'aide.

## 2. Interface

- [x] 2.1 [ui] Dans `buildView`, passer le texte d'origine à `layoutForm` ; le résumé et la mention de la copie disent « éclipse ». Vérifier dans les tests du modèle de vue.
- [x] 2.2 [ui] `Recipe.form` facultatif ; `add-recipe` pose la forme de la recette. Ajouter les recettes Éclipse (S+7 sur les noms et forme éclipse) et S+dé (S+n au dé sur les noms, graine = date julienne du jour). Vérifier dans les tests des recettes : quinze recettes triées, les deux réglages, et la forme posée.
- [x] 2.3 Lancer `npm test` (couverture au-dessus de 90 %), puis faire la recette dans le navigateur : brancher Éclipse, puis S+dé et changer la graine.

## 3. Documentation

- [x] 3.1 [docs] `docs/tracks.md` (la forme éclipse) et `docs/s7.md` (le tirage au dé). Dans `catalogue-contraintes.md`, faire passer Éclipse et S+dé dans les contraintes gérées : 32 sur 153, 30 sur 61 en A et B, 16 sur 25 en A ; vider la liste « Presque gérées ».
