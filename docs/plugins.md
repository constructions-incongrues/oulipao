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
(`removed`), ou la raison pour laquelle il l'a laissé tel quel.

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

## Ce que les filtres de rime ont changé au contrat

Quatre contraintes phonétiques (`src/domain/rhyme/`) : R+n, monorime, antirime, homophonies.

- `phonetic: true` dans la déclaration : la page charge alors les prononciations à la demande
  (`resources.phonetics`, port `PhoneticsRepository`), comme les verbes. D'ici là, chaque mot
  visé reste avec la raison « prononciations en cours de chargement ».
- La rime, sa richesse et le compte des syllabes se calculent dans le domaine
  (`src/domain/phonetics/`) ; le port ne donne que les prononciations et les homophones.
- Les quatre contraintes partagent un moteur (`applyRhymeFilter`) : pour chaque mot visé, la
  contrainte décide d'un critère, et le moteur prend le n-ième voisin du dictionnaire qui le
  passe (`src/domain/neighbours.ts`, partagé avec le lipogramme), accordé comme au S+n.
- Les fins de vers viennent de `layoutVerse` (`src/domain/verse.ts`), recalculé sur le texte que
  la contrainte reçoit : les filtres ne déplacent jamais un saut de ligne, la découpe vaut donc
  pour toute la chaîne. Le contrat de sortie, un mot par mot d'origine, n'a pas changé.

| Contrainte | Réglages | Exemple |
|---|---|---|
| R+n | décalage, richesse (pauvre, suffisante, riche), tous les mots ou fins de vers | R+1 : « sur la chaise » → « sur la fraise » |
| Monorime | la rime, dans la liste des 30 plus fréquentes (`frequent-rhymes.ts`, généré) | en /ɔ̃/ : « la chaise » en fin de vers → « la maison » |
| Antirime | richesse | « la table / la fable / la rose / la chose » → « la table / la fraise / la rose / la maison » |
| Homophonies | rang | « un vers » → « un vert » |

## Côté page

`installedPlugins` (`src/ui/tracks/mixer-state.ts`) est la seule liste qui nomme les types.
L'état de la table est une liste ordonnée d'instances `{id, type, enabled, params, targets}` ;
l'ordre de la liste est celui de la chaîne. Gestes : `add-instance`, `duplicate-instance`,
`remove-instance`, `toggle-instance`, `set-param` (validé par `parse`), `set-targets` (pistes
du type seulement, au moins une), `move-instance`. Le résumé et la mention nomment chaque
instance avec ses pistes, sauf quand elle vise toutes celles de son type.
