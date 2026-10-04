# Le contrat des plugins

Une contrainte oulipienne se branche sur la page à pistes comme un effet sur une table de
mixage : la page lui donne le texte étiqueté, la contrainte déclare ses paramètres et rend le
texte transformé. La page ne connaît aucune contrainte en particulier ; elle dessine les
réglages d'après la déclaration.

**Contrat interne.** Il n'est ni versionné ni publié. La stratégie attend trois contraintes
écrites en interne avant d'ouvrir un format à des tiers : la deuxième contrainte dira ce que
ce contrat a de faux.

## Ce qu'une contrainte déclare

`ConstraintPlugin` (`src/domain/plugin.ts`), vérifié par `definePlugin` :

| Champ | Rôle |
|---|---|
| `id`, `name` | identifiant, et nom court du bouton de marche (« S+7 ») |
| `nameOf` (facultatif) | le nom d'une instance selon ses réglages, affiché dans la chaîne : le S+n au dé s'appelle « S+dé » ; absent, la chaîne affiche `name` |
| `targetable` | `false` pour une mise en page qui agit sur tout le texte (Bord, Mise en vers) : elle déclare les cinq pistes, toutes visées, et la page n'affiche pas de puces |
| `tracks`, `defaultTargets` | les pistes que la contrainte sait traiter (S+n : noms, adjectifs et verbes ; lipogramme : les cinq), et celles qu'une instance neuve vise |
| `parameters` | les paramètres, dans l'ordre d'affichage : entier borné (`integer`, avec `min` et `max` : un champ numérique) ou choix (`choice`, avec `options` : une liste) ; chacun a une `key` et un `label` |
| `defaults` | les valeurs à l'ouverture |
| `parse(values)` | valide des valeurs et complète celles qui manquent ; lève sinon |
| `acts(values)` | ces réglages changent-ils le texte ? (Le S+0, non : la page n'affiche alors ni marques ni mention) |
| `title`, `label`, `help` | « S+3 » ; « S+3, parmi tous les noms » (résumé et mention copiée) ; l'effet en une phrase, selon les pistes visées si on les lui donne (« Chaque adjectif devient… ») |
| `apply(text, tagged, values, resources, targets, scope?)` | le texte transformé, sur les pistes visées par l'instance, en respectant la portée par mot (voir plus bas) |

`definePlugin` lève au chargement si : la déclaration ne suit pas son schéma (`id`, `name` vides,
aucune piste), deux paramètres partagent une `key`, un entier a `min > max`, une piste par défaut
n'est pas dans `tracks`, une contrainte non ciblable ne déclare pas les cinq pistes, ou
`parse(defaults)` lève.

## Les types installés

| `id` | `name` | Pistes (par défaut) | Paramètres | Module |
|---|---|---|---|---|
| `s7` | S+7 | noms, adjectifs, verbes (noms) | `offset` (−99 à 99), `mode` (`reagree`, `same-gender`), `draw` (`fixed`, `dice`), `seed` (1 à 9 999 999) | `src/domain/s7/plugin.ts`, voir `docs/s7.md` |
| `lipogram` | Lipogramme | les cinq (les cinq) | `letter` (choix) | `src/domain/lipogram/plugin.ts` |
| `track-sort` | Tri par piste | les cinq (noms) | `mode` (`remove`, `keep`), `layout` (`as-is`, `one-per-line`) | `src/domain/track-sort/plugin.ts` |
| `edge` | Bord | non ciblable | `mode` (`ends`, `head-tail`, `inside`), `n` (1 à 9) | `src/domain/edge/plugin.ts` |
| `lineation` | Mise en vers | non ciblable | `cut` (`every`, `punctuation`, `number`), `n` (1 à 99), `number` (1 à 9 999 999) | `src/domain/lineation/plugin.ts` |
| `chisel` | Ciselure | non ciblable | `final` (1 à 5), `perTier` (1 à 9) | `src/domain/chisel/plugin.ts` |
| `body-alphabet` | Alphabet augmenté | non ciblable | `replace` (`punctuation`, `sounds`, `both`) | `src/domain/body-alphabet/plugin.ts` |
| `rn`, `monorhyme`, `antirhyme`, `homophony`, `rhyme-scheme`, `anterhyme`, `berrychonne` | filtres de rime | noms, adjectifs, verbes, adverbes | voir plus bas | `src/domain/rhyme/` |

La liste fait foi dans `installedPlugins` (`src/ui/tracks/mixer-state.ts`).

`apply` rend, comme `plainWords`, un élément par mot du texte qu'il a lu (`words`, `tail`) : la
page peut ensuite couper des pistes et montrer chaque étape dans l'inspecteur sans connaître la contrainte. Il
rend aussi `marks` : pour chaque mot qu'il a touché, le remplaçant, le fait qu'il l'a retiré
(`removed`), le fait qu'il n'en a changé que le blanc d'avant, une coupe de ligne (`relaid`),
ou la raison pour laquelle il l'a laissé tel quel.

**La portée par mot.** Le dernier argument de `apply`, `scope` (`WordScope`), vient de la grille
de pas et des verrous de l'inspecteur. Il est facultatif : sans lui, la contrainte prend
`FULL_SCOPE` (aucune exception).

| Champ | Contenu | Ce que la contrainte en fait |
|---|---|---|
| `skip` | positions des pas bouchés, dans le texte reçu | laisser le mot tel quel, avec la marque `reason: CLOSED` (« pas bouché », exporté par `src/domain/s7/plugin.ts`) |
| `overrides` | `{ index, values }` : les valeurs verrouillées d'un mot | traiter ce mot avec `parse({ ...values, ...override })` au lieu des réglages de l'instance |

Les positions sont celles du texte que la contrainte reçoit : `runChain` les traduit depuis les
mots d'origine (`scopeOf`, `src/domain/plugin-chain.ts`). Un mot d'origine relu en deux mots
(« du » → « de la ») fait sauter ou verrouiller les deux.

Qui lit quoi aujourd'hui : S+7, lipogramme, Tri par piste, Bord, Ciselure et Alphabet augmenté respectent `skip` ; Mise en vers
ne reçoit pas `scope` (elle ne retire ni ne remplace de mot). Seul le S+7 lit `overrides`. Or
l'inspecteur propose un verrou pour chaque paramètre entier de chaque instance en marche qui vise
la piste du mot (`inspectorLocks`, `src/ui/tracks/view-model.ts`) : un verrou posé sur `n` de Bord
ou de Mise en vers est gardé, affiché, et sans effet.

**Retirer un mot.** Une contrainte qui retire passe par `removeWord` (`src/domain/removal.ts`) :
le blanc du mot retiré (ponctuation, sauts de ligne) se fond dans celui du mot suivant. Les
sauts de ligne restent ; une suite de ponctuation se réduit à son signe le plus fort ; les
espaces suivent l'usage français ; la ponctuation tombe en tête de texte ; des guillemets ou des
parenthèses qui n'entourent plus rien tombent ensemble ; un mot retiré en tête de phrase lègue
sa majuscule. Les vers restent des vers.

## Type et instance

Une contrainte déclarée est un **type**. Ce qu'on branche sur la table est une **instance** :
un exemplaire du type, avec son identifiant (« s7-1 », « s7-2 »), ses réglages et ses pistes
visées, choisies parmi celles du type. On peut brancher plusieurs instances d'un même type
(deux S+n réglés différemment) ; elles forment une seule chaîne, dans l'ordre de la table.

## La chaîne

Plusieurs instances s'appliquent l'une après l'autre, dans l'ordre choisi sur la table
(`runChain`, `src/domain/plugin-chain.ts`). Chacune lit la sortie de la précédente, que la page
relit comme un texte neuf : chaque mot relu garde la catégorie du mot d'origine dont il vient.
La sortie est ensuite ramenée aux mots du texte d'origine — une contraction relue en deux mots
(« de la ») revient à son mot, un mot retiré reste vide — et les marques aussi : un mot garde
son mot d'origine, et porte au bout du compte ce que toute la chaîne en a fait. Une contrainte
n'a donc rien à savoir de celles qui la précèdent.

`resources` porte les textbanks que la page prête à la contrainte : le dictionnaire des noms,
adjectifs et adverbes (`morphology`), et les verbes (`verbs`, port `VerbRepository`). Les verbes
sont facultatifs : la page ne les charge que quand une instance active vise la piste `verb`, et
recalcule le texte à leur arrivée. D'ici là, une contrainte laisse chaque verbe visé avec la
raison « conjugaisons en cours de chargement » ; `apply` reste synchrone.

## La portée par mot

`apply` reçoit `scope` (`WordScope`), que la chaîne tire de l'instance : `skip`, les mots
d'origine dont le pas est bouché, à laisser tels quels ; `overrides`, les verrous, une valeur
de paramètre propre à un mot. Une contrainte qui lit `overrides` pour un paramètre entier le
déclare `lockable: true` ; l'inspecteur ne propose de verrou que pour ces paramètres, et la
table refuse les autres. Aujourd'hui, seul le décalage du S+7 est verrouillable : Bord lit
`skip` mais pas `overrides`, et Mise en vers ne lit pas `scope`.

## Ce que le S+7 a appris au contrat

Le S+7 (`src/domain/s7/plugin.ts`) est branché sur les noms, mais il **réécrit aussi les autres
pistes** : déterminants, adjectifs, attributs et pronoms se réaccordent. C'est pourquoi `apply`
rend tout le texte, mot par mot, et pas seulement sa piste. Une contrainte qui ne respecte pas
les pistes (le lipogramme agit sur les lettres) n'aura besoin de rien de plus ; il faudra
peut-être en revanche revoir `track` et `marks`, pensés pour une contrainte attachée à une piste.

## Ce que le lipogramme a changé au contrat

- `track` accepte `'all'` : le lipogramme agit sur toutes les pistes.
- Une marque peut dire qu'un mot a été retiré (`removed`).
- Une chaîne de contraintes, tenue par la page : le contrat lui-même n'a pas eu à changer pour
  qu'une contrainte lise la sortie d'une autre.

- `inherit` (facultatif) : dans une chaîne, une instance reçoit aussi les réglages des instances
  du même type placées avant elle. Le lipogramme s'en sert pour cumuler les lettres bannies : un
  lipogramme en e après un lipogramme en a ne remet pas de « a ».

## Ce que la mise en page a changé au contrat

- Une contrainte peut ne pas viser de pistes (`targetable: false`) : elle compte tous les mots,
  pas bouchés compris, mais ne retire ni ne remplace un mot bouché.
- Une marque `relaid` pour un mot remis en ligne ; la chaîne les compte (`StepReport.relaid`) et
  une remise en ligne n'écrase ni un remplacement ni un retrait d'une étape précédente.
- Chaque étape de la chaîne dit, mot par mot, si elle a mis le mot à la ligne
  (`stages[k][i].newline`) : l'inspecteur y met « ↵ ».

## Ce que les filtres de rime ont changé au contrat

Sept contraintes phonétiques (`src/domain/rhyme/`) : R+n, monorime, antirime, homophonies, et les schémas de rimes (plus bas).

- `phonetic: true` dans la déclaration : la page charge alors les prononciations à la demande
  (`resources.phonetics`, port `PhoneticsRepository`), comme les verbes. D'ici là, chaque mot
  visé reste avec la raison « prononciations en cours de chargement ».
- La rime, sa richesse et le compte des syllabes se calculent dans le domaine
  (`src/domain/phonetics/`) ; le port ne donne que les prononciations et les homophones.
- Les quatre contraintes partagent un moteur (`applyRhymeFilter`) : pour chaque mot visé, la
  contrainte décide d'un critère, et le moteur prend le n-ième voisin du dictionnaire qui le
  passe (`src/domain/neighbours.ts`, partagé avec le lipogramme), accordé comme au S+n.
- Les fins de vers viennent de `layoutVerse` (`src/domain/verse.ts`), recalculé sur le texte que
  la contrainte reçoit : une mise en page placée avant elle dans la chaîne (Mise en vers)
  redéfinit donc les vers des filtres de rime qui la suivent. Le contrat de sortie, un mot par mot d'origine, n'a pas changé.

| Contrainte | Réglages | Exemple |
|---|---|---|
| R+n | décalage, richesse (pauvre, suffisante, riche), tous les mots ou fins de vers | R+1 : « sur la chaise » → « sur la fraise » |
| Monorime | la rime, dans la liste des 30 plus fréquentes (`frequent-rhymes.ts`, généré) | en /ɔ̃/ : « la chaise » en fin de vers → « la maison » |
| Antirime | richesse | « la table / la fable / la rose / la chose » → « la table / la fraise / la rose / la maison » |
| Homophonies | rang | « un vers » → « un vert » |

### Les schémas de rimes

Trois contraintes de plus, plus un réglage pour le monorime. Les quatre se décident strophe par
strophe et dans l'ordre du texte, alors que le moteur décide mot à mot et dans l'ordre des
catégories. Elles passent donc par une pré-passe partagée, `planByVerse` (`engine.ts`) : la
contrainte reçoit les mots retenus de chaque strophe et note, par `settle`, ceux qui changent.
`settle` rend la prononciation que le mot aura (celle du voisin prévu par `probe`), si bien
qu'une fin remplacée compte ensuite par sa rime nouvelle. L'antirime y passe aussi.

- **Le genre de la rime** (`rhymeGender`, `src/domain/phonetics/rhyme.ts`). La rime est féminine
  si le mot finit par un e muet écrit que la prononciation n'a pas (« rose », « chantent »), et
  masculine sinon (« souvent », « été »).
- **Les lettres** (`lettersFor`, `src/domain/rhyme/scheme.ts`). Un schéma de longueur fixe se
  répète avec des lettres nouvelles : six vers croisés donnent ABAB CD. L'étreinte se lit en
  miroir sur toute la strophe, et le vers du milieu d'une strophe impaire est libre.
- **Un vers sans voisin.** S'il n'a aucun voisin qui convienne, il garde son mot, avec sa raison.
  La rime de sa lettre ne change pas.
- **L'inspecteur.** Il montre le genre de la rime et, sous un schéma de rimes actif, la lettre de
  la fin de vers (`schemeLetters`).

| Contrainte | Réglages | Exemple |
|---|---|---|
| Monorime | + genre : indifférent, masculin, féminin, alterné (sonnet monorime) | en /ɛʁ/ alterné : « le vert / le chat / le ver » → « le vert / le verre / le ver » |
| Schéma de rimes (`rhyme-scheme`) | schéma (plates, croisées, embrassées, étreinte, rime bisexuelle), richesse, genre (indifférent ou alterné) | embrassées : « la chaise / la table / la rose / la chose » → « la chaise / la table / la table / la fraise » |
| Antérime (`anterhyme`) | richesse | « la chaise dort / la table dort » → « la chaise dort / la braise dort » |
| Rime berrychonne (`berrychonne`) | aucun | « le vert / la chose / la table » → « … / la braise » (/ɛ/ de l'un, /z/ de l'autre) |

Les schémas « rondel » (ABBAABABBA) et « villanelle » (ABAABABABABAB) donnent leurs lettres
aux seuls vers de l'auteur. Les deux formes ajoutent des vers, et une contrainte doit rendre un
mot par mot qu'elle lit : elles ne sont donc pas des contraintes. Elles se posent après la
chaîne (`layoutForm`, voir `docs/tracks.md`), et aucun filtre ne peut agir après elles.

## Côté page

`installedPlugins` (`src/ui/tracks/mixer-state.ts`) est la seule liste qui nomme les types ;
`RECIPES` (`src/ui/tracks/recipes.ts`) nomme les recettes, validées au chargement contre eux.
L'état de la table est une liste ordonnée d'instances `{id, type, enabled, params, targets}` ;
l'ordre de la liste est celui de la chaîne. Gestes : `add-instance`, `add-recipe` (une recette, son choix, le jour), `duplicate-instance`,
`remove-instance`, `toggle-instance`, `set-param` (validé par `parse`), `set-targets` (pistes
du type seulement, au moins une ; refusé pour un type non ciblable), `move-instance`. Le résumé et la mention nomment chaque
instance avec ses pistes, sauf quand elle vise toutes celles de son type.

## Voir aussi

- [Votre première contrainte](tutoriel-premiere-contrainte.md) (tutoriel)
- [Comment écrire une contrainte](guides/ecrire-une-contrainte.md)
- [Comment ajouter une recette](guides/ajouter-une-recette.md)
