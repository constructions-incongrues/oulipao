# L'interface à pistes

Page : `tracks.html` (script assemblé `dist/tracks.js`, par `npm run build`). La page d'essai
`index.html` reste à part, pour comparer les trois étiqueteurs.

## Vocabulaire

- **Piste** : une catégorie de mots. Cinq pistes : noms, verbes, adjectifs, adverbes, autres
  (les mots-outils : déterminants, pronoms, prépositions…).
- **Tranche** : la ligne d'une piste dans la table de mixage (colonne de gauche) : pastille de
  couleur, nom, nombre de mots, « Muet », « Seul », et le rappel des filtres qui visent la piste
  (« 1. S+7 · 2. Lipogramme en e (coupé) »), numérotés à leur place dans la chaîne.
- **Filtre** : une instance d'un type de contrainte (S+n, lipogramme), avec ses réglages et ses
  pistes visées. Un type peut être instancié plusieurs fois. La page dessine les réglages
  d'après la déclaration du type : voir `docs/plugins.md`.
- **Rack** : sous les cinq tranches, les filtres dans l'ordre où le texte les traverse. Chacun
  porte sa marche, ses réglages, l'effet en clair, une pastille par piste que son type sait
  traiter (enfoncée si elle est visée ; la dernière visée ne s'éteint pas), et ↑, ↓,
  « Dupliquer », « Retirer ». Une mise en page (Bord, Mise en vers) agit sur tout le texte : à
  la place des pastilles, « Tout le texte ». À l'ouverture, la chaîne est vide : le texte passe
  tel quel.
- **Navigateur de contraintes** : sous le rack, la touche « Ajouter une contrainte » le déplie.
  D'abord les **recettes**, par leur nom de l'Oulipo (Haï-kaïsation, Liponymie, Monovocalisme…),
  chacune avec sa règle en une phrase et le lien vers sa fiche oulipo.net ; une recette branche
  une ou plusieurs instances. Celles qui demandent un réglage (la voyelle gardée, la piste
  interdite) déplient un choix : « Brancher » ou « Annuler » (Échap). Puis les **moteurs** : un
  bouton par type, qui ajoute une instance aux réglages et pistes par défaut. Tout ajout va en fin
  de chaîne ; une copie aussi. L'Éclipse (un texte suivi de son S+7) n'a pas de recette : le S+7
  donne la seconde partie, mais la sortie ne sait pas encore juxtaposer les deux.
- **Texte résultant** : ce qu'on lit et qu'on copie, une fois les filtres appliqués et les
  pistes coupées. Un mot remplacé est souligné de la couleur de sa piste ; son infobulle nomme
  la piste et le mot d'origine (« Noms : cuisine → cuissot »), ou dit pourquoi un mot est laissé
  tel quel. Chaque mot se clique ; seuls les mots remplacés reçoivent le focus clavier.
- **Inspecteur** : sous le texte résultant, fermé tant qu'aucun mot n'est choisi (une phrase
  invite à cliquer). Un tableau : une ligne « Origine », puis une ligne par filtre actif dans
  l'ordre de la chaîne ; le mot choisi au centre, six voisins de chaque côté (deux sous 768 px),
  chaque mot dans sa colonne ; « · » pour un mot retiré, « ↵ » devant un mot que l'étape a mis à
  la ligne (dit « à la ligne » au lecteur d'écran). À l'ouverture, le focus y passe :
  ← → changent de mot (y compris les mots absents du texte résultant), Échap ferme. Le choix
  survit aux réglages ; un nouvel étiquetage le ferme. Une fenêtre trop large défile dans
  l'inspecteur, jamais la page.

## La chaîne

L'étiquetage a lieu une fois par texte. Ensuite chaque geste rejoue deux fonctions pures :

1. **Chaîne de filtres** (`runChain`, `src/domain/plugin-chain.ts`) : les filtres en marche et
   réglés pour agir, dans l'ordre du rack, chacun sur ses pistes ; chacun lit la sortie du
   précédent ; le résultat reste mot par mot, aligné sur le texte d'origine, et la sortie de
   chaque étape est gardée (`stages`) pour l'inspecteur.
2. **Mixage** (`src/domain/mixing.ts`) : `audibleCategories` dit quelles pistes s'entendent
   (sans solo, celles qui ne sont pas muettes ; sinon les seules pistes en solo) ; `mixText`
   retire les mots des autres, resserre le texte et garde la ponctuation.
3. **Forme à refrain** (`layoutForm`, `src/domain/forms/form.ts`) : aucune, rondel ou
   villanelle, choisie près du texte résultant. Elle se pose sur le texte mixé, après la chaîne,
   et recopie les vers de refrain à leurs places. Un mot recopié garde l'index de son mot
   d'origine : la chaîne, l'inspecteur et la grille restent alignés mot à mot.

`buildView` (`view-model.ts`) enchaîne les trois et prépare les bandes de l'inspecteur ;
`inspectorWindow` en découpe la fenêtre autour du mot choisi ; `createTracksController` (`controller.ts`)
tient l'état de la page (saisie, attente, erreur, table de mixage, vue) et ne connaît pas
Preact ; les composants (`components/`, `app.ts`) sont des fonctions de cet état.

## Règles à connaître

- **Le mute ne répare pas la phrase.** Il s'applique à la sortie du moteur : couper les adjectifs
  de « la vieille école » donne « la école ». La règle est appliquée telle quelle.
- **L'inspecteur montre ce que la chaîne a fait, pas ce qu'on entend** : un mot d'une piste
  muette y figure à toutes les étapes. Un adjectif peut changer à une étape qui ne le vise pas :
  c'est le réaccord au nom remplacé.
- **La copie dit d'où vient le texte.** Le texte copié est suivi, après une ligne vide, de ce qui
  l'a changé, filtre par filtre dans l'ordre de la chaîne : « — S+2 sur les adjectifs · S+7 sur
  les noms · lipogramme en a (Oulipao) », avec « · pistes coupées : … » s'il y en a. Les pistes
  d'un filtre sont nommées, sauf quand il vise toutes celles que son type sait traiter. Rien
  quand le texte copié est le texte d'origine (filtres coupés ou sans effet, toutes les pistes
  entendues). Décision D11 de la revue d'ingénierie.

- **Aucun filtre après la forme.** Les filtres ne lisent que les vers de l'auteur. Les refrains
  recopient la sortie de la chaîne et rien ne les retouche ensuite. Pour faire rimer la forme,
  on met un schéma de rimes « rondel » ou « villanelle » dans la chaîne. Les sauts de strophe de
  l'auteur tombent : c'est la forme qui fait les strophes. S'il manque des vers, la forme
  s'arrête et le résumé dit combien. Les vers en trop suivent dans une strophe à part.
- **Un refrain se lit comme une copie** : en italique, à l'encre secondaire, annoncé aux
  lecteurs d'écran (« Refrain, copie du vers 1 »). Cliquer un de ses mots ouvre le mot d'origine
  dans l'inspecteur. La copie du texte garde les refrains, sans ces marques, et nomme la forme.

## La page

- **Premier contact** : la définition du S+7, la saisie, le bouton « Essayer avec un exemple »,
  et le chargement du modèle, lancé dès l'ouverture avec sa barre en Mo (`preload`, fourni par
  `composition.ts`). Si le navigateur demande d'économiser les données, un bouton « Charger le
  modèle (141 Mo) » attend un clic. Un échec se relance : le chargement raté n'est pas gardé.
- **Après la mise en pistes** : la saisie se replie en « Texte : N mots · Modifier » ; le texte
  résultant vient en tête, l'inspecteur dessous. Si l'on modifie le texte, la vue est
  estompée et la copie refusée jusqu'à « remettre en pistes ».
- **Après chaque geste** : une phrase par filtre résume l'état (« S+7 sur les noms : 33 noms
  remplacés sur 34. lipogramme en a : 45 mots remplacés, 6 retirés, 28 laissés tels quels. ») et est annoncée aux lecteurs d'écran ; les mots qui viennent de changer
  s'éclairent un tiers de seconde, sauf si le système demande de réduire les animations.
- **Lecteurs d'écran** : l'inspecteur est un tableau dont chaque ligne est nommée par son
  étape ; sa légende annonce le mot choisi.
- **Sous 1024 px** : une seule colonne. Sous 768 px, l'inspecteur ne montre que deux voisins.
- **Apparence** : variables et polices de `styles/tokens.css`, décrites dans `DESIGN.md`.

## Tests

Les composants sont écrits avec Preact et des gabarits htm, sans JSX : ce sont des fichiers
TypeScript ordinaires. Les tests les rendent en texte (`preact-render-to-string`) et actionnent
leurs gestionnaires en parcourant l'arbre rendu (`test/support/vnode.ts`), sans navigateur.

Hors couverture, nommément (`package.json`) : `src/ui/tracks/main.ts` et `src/ui/page.ts`
(montage sur le DOM, presse-papiers), `src/adapters/taggers/camembert-model.ts` (chargement du
modèle).

## Voir aussi

- [Le contrat des plugins](plugins.md) : ce que la page attend d'une contrainte
- [Comment ajouter une recette](guides/ajouter-une-recette.md)
- [Comment publier le site](guides/publier-le-site.md)
