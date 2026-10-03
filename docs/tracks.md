# L'interface à pistes

Page : `tracks.html` (script assemblé `dist/tracks.js`, par `npm run build`). La page d'essai
`index.html` reste à part, pour comparer les trois étiqueteurs.

## Vocabulaire

- **Piste** : une catégorie de mots. Cinq pistes : noms, verbes, adjectifs, adverbes, autres
  (les mots-outils : déterminants, pronoms, prépositions…).
- **Tranche** : les réglages d'une piste, dans la table de mixage (colonne de gauche, toujours
  visible) : nom, nombre de mots, mute,
  solo, emplacement de plugin.
- **Plugin** : une contrainte branchée sur une piste. Un seul existe, le S+7, sur la piste des
  noms ; les autres emplacements sont vides.
- **Partition** : le texte d'origine disposé en systèmes.
- **Système** : une ligne du texte d'origine (la règle) et, dessous, les cinq pistes. La
  partition revient à la ligne comme une partition de musique.
- **Bloc** : un mot posé sur sa piste, à sa colonne dans la règle. Sur la piste des noms, le
  bloc porte le mot remplacé quand le plugin est actif.
- **Texte résultant** : ce qu'on lit et qu'on copie, une fois la contrainte appliquée et les
  pistes coupées.

## La chaîne

L'étiquetage a lieu une fois par texte. Ensuite chaque geste rejoue trois fonctions pures :

1. **Moteur** (`src/domain/s7/engine.ts`) : si le plugin est actif, le S+7, dont la sortie est
   rendue mot par mot (`S7Result.words`) ; sinon les mots d'origine (`plainWords`).
2. **Mixage** (`src/domain/mixing.ts`) : `audibleCategories` dit quelles pistes s'entendent
   (sans solo, celles qui ne sont pas muettes ; sinon les seules pistes en solo) ; `mixText`
   retire les mots des autres, resserre le texte et garde la ponctuation.
3. **Disposition** (`src/ui/tracks/score-layout.ts`) : `layoutScore` découpe le texte d'origine
   en systèmes et pose les blocs.

`buildView` (`view-model.ts`) enchaîne les trois ; `createTracksController` (`controller.ts`)
tient l'état de la page (saisie, attente, erreur, table de mixage, vue) et ne connaît pas
Preact ; les composants (`components/`, `app.ts`) sont des fonctions de cet état.

## Règles à connaître

- **Le mute ne répare pas la phrase.** Il s'applique à la sortie du moteur : couper les adjectifs
  de « la vieille école » donne « la école ». La règle est appliquée telle quelle.
- **La partition montre le texte d'origine**, pas le texte résultant : la règle ne change pas
  quand on règle le plugin ; seuls les blocs des noms changent de libellé.
- **Colonnes de caractères.** Les blocs s'alignent sous les mots grâce à une police à chasse
  fixe. Un mot remplacé plus long que l'original est tronqué à l'écran (son libellé complet est
  dans l'infobulle) pour ne pas recouvrir le bloc suivant.
- **Largeur des systèmes** : 64 caractères, fixe (`DEFAULT_WIDTH`).

## Tests

Les composants sont écrits avec Preact et des gabarits htm, sans JSX : ce sont des fichiers
TypeScript ordinaires. Les tests les rendent en texte (`preact-render-to-string`) et actionnent
leurs gestionnaires en parcourant l'arbre rendu (`test/support/vnode.ts`), sans navigateur.

Hors couverture, nommément (`package.json`) : `src/ui/tracks/main.ts` et `src/ui/page.ts`
(montage sur le DOM, presse-papiers), `src/adapters/taggers/camembert-model.ts` (chargement du
modèle).
