# L'interface à pistes

Page : `tracks.html` (script assemblé `dist/tracks.js`, par `npm run build`). La page d'essai
`index.html` reste à part, pour comparer les trois étiqueteurs.

## Vocabulaire

- **Piste** : une catégorie de mots. Cinq pistes : noms, verbes, adjectifs, adverbes, autres
  (les mots-outils : déterminants, pronoms, prépositions…).
- **Tranche** : la ligne d'une piste dans la table de mixage (colonne de gauche) : pastille de
  couleur, nom, nombre de mots, « Muet », « Seul ».
- **Plugin** : une contrainte branchée sur une piste. Un seul existe, le S+7, ouvert sous la
  ligne des noms, avec deux paramètres : « Décalage » (de −99 à +99) et « Parmi » (« tous les
  noms », ou « les noms du même genre »). Une ligne dit que d'autres contraintes viendront.
- **Partition** : le texte d'origine disposé en systèmes.
- **Système** : une ligne du texte d'origine (la règle) et, dessous, les pistes qui y ont des
  mots (les pistes vides du système sont masquées). La partition revient à la ligne comme une
  partition de musique.
- **Bloc** : un mot posé sur sa piste, à sa colonne dans la règle. Trois aspects : plein pour un
  nom remplacé (il porte le nouveau mot ; l'infobulle dit « horloge → horodatage »), contour
  pointillé pour un nom laissé tel quel (l'infobulle dit pourquoi), simple filet pour les autres.
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
- **La partition montre le texte d'origine**, pas le texte résultant : seuls les blocs des noms
  changent de libellé quand on règle le plugin, et la règle ne fait que s'élargir pour eux.
- **Colonnes de caractères.** Les blocs s'alignent sous les mots grâce à une police à chasse
  fixe. Les mots s'écrivent toujours en entier : quand un remplaçant est plus long que le mot
  d'origine, la règle reçoit des blancs après ce mot (« droits    . ») et ce qui suit se décale.
  La règle change donc avec le réglage du plugin.
- **Largeur des systèmes** : calculée d'après la place laissée à la partition, entre 48 et 72
  caractères (`systemWidth`), et recalculée au redimensionnement (`main.ts`).
- **La copie dit d'où vient le texte.** Le texte copié est suivi, après une ligne vide, de ce qui
  l'a changé : « — S+7, parmi tous les noms (Potao) », avec « · pistes coupées : … » s'il y en a.
  Rien quand le texte copié est le texte d'origine (plugin coupé ou S+0, toutes les pistes
  entendues). Décision D11 de la revue d'ingénierie.

## La page

- **Premier contact** : la définition du S+7, la saisie, le bouton « Essayer avec un exemple »,
  et le chargement du modèle, lancé dès l'ouverture avec sa barre en Mo (`preload`, fourni par
  `composition.ts`). Si le navigateur demande d'économiser les données, un bouton « Charger le
  modèle (141 Mo) » attend un clic. Un échec se relance : le chargement raté n'est pas gardé.
- **Après la mise en pistes** : la saisie se replie en « Texte : N mots · Modifier » ; le texte
  résultant vient en tête, au-dessus de la partition. Si l'on modifie le texte, la vue est
  estompée et la copie refusée jusqu'à « remettre en pistes ».
- **Après chaque geste** : une phrase résume l'état (« S+3, parmi tous les noms : 33 noms
  remplacés sur 34. ») et est annoncée aux lecteurs d'écran ; les mots qui viennent de changer
  s'éclairent un tiers de seconde, sauf si le système demande de réduire les animations.
- **Lecteurs d'écran** : la partition dessinée leur est cachée ; ils lisent à la place une liste
  par piste (« Noms, 13 mots : matin devenu matois, … »).
- **Sous 1024 px** : une seule colonne ; la partition est repliée derrière « Voir la partition »
  et défile dans son cadre.
- **Apparence** : variables et polices de `styles/tokens.css`, décrites dans `DESIGN.md`.

## Tests

Les composants sont écrits avec Preact et des gabarits htm, sans JSX : ce sont des fichiers
TypeScript ordinaires. Les tests les rendent en texte (`preact-render-to-string`) et actionnent
leurs gestionnaires en parcourant l'arbre rendu (`test/support/vnode.ts`), sans navigateur.

Hors couverture, nommément (`package.json`) : `src/ui/tracks/main.ts` et `src/ui/page.ts`
(montage sur le DOM, presse-papiers), `src/adapters/taggers/camembert-model.ts` (chargement du
modèle).
