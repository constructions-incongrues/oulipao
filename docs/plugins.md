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
| `targetable` | `false` pour une mise en page qui agit sur tout le texte (Bord, Mise en vers) : elle déclare les cinq pistes, toutes visées, et la page n'affiche pas de puces |
| `tracks`, `defaultTargets` | les pistes que la contrainte sait traiter (S+n : noms et adjectifs ; lipogramme : les cinq), et celles qu'une instance neuve vise |
| `parameters` | les paramètres, dans l'ordre d'affichage : entier borné (champ numérique) ou choix (liste) |
| `defaults` | les valeurs à l'ouverture |
| `parse(values)` | valide des valeurs et complète celles qui manquent ; lève sinon |
| `acts(values)` | ces réglages changent-ils le texte ? (Le S+0, non : la page n'affiche alors ni marques ni mention) |
| `title`, `label`, `help` | « S+3 » ; « S+3, parmi tous les noms » (résumé et mention copiée) ; l'effet en une phrase, selon les pistes visées si on les lui donne (« Chaque adjectif devient… ») |
| `apply(text, tagged, values, resources, targets)` | le texte transformé, sur les pistes visées par l'instance |

`apply` rend, comme `plainWords`, un élément par mot du texte qu'il a lu (`words`, `tail`) : la
page peut ensuite couper des pistes et montrer chaque étape dans l'inspecteur sans connaître la contrainte. Il
rend aussi `marks` : pour chaque mot qu'il a touché, le remplaçant, le fait qu'il l'a retiré
(`removed`), le fait qu'il n'en a changé que le blanc d'avant, une coupe de ligne (`relaid`),
ou la raison pour laquelle il l'a laissé tel quel.

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

## Ce que la mise en page a changé au contrat

- Une contrainte peut ne pas viser de pistes (`targetable: false`) : elle compte tous les mots,
  pas bouchés compris, mais ne retire ni ne remplace un mot bouché.
- Une marque `relaid` pour un mot remis en ligne ; la chaîne les compte (`StepReport.relaid`) et
  une remise en ligne n'écrase ni un remplacement ni un retrait d'une étape précédente.
- Chaque étape de la chaîne dit, mot par mot, si elle a mis le mot à la ligne
  (`stages[k][i].newline`) : l'inspecteur y met « ↵ ».

## Côté page

`installedPlugins` (`src/ui/tracks/mixer-state.ts`) est la seule liste qui nomme les types ;
`RECIPES` (`src/ui/tracks/recipes.ts`) nomme les recettes, validées au chargement contre eux.
L'état de la table est une liste ordonnée d'instances `{id, type, enabled, params, targets}` ;
l'ordre de la liste est celui de la chaîne. Gestes : `add-instance`, `add-recipe` (une recette, son choix, le jour), `duplicate-instance`,
`remove-instance`, `toggle-instance`, `set-param` (validé par `parse`), `set-targets` (pistes
du type seulement, au moins une ; refusé pour un type non ciblable), `move-instance`. Le résumé et la mention nomment chaque
instance avec ses pistes, sauf quand elle vise toutes celles de son type.
