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
| `track` | la piste sur laquelle elle se branche, ou `'all'` pour toutes (comme un effet sur le bus master) |
| `parameters` | les paramètres, dans l'ordre d'affichage : entier borné (champ numérique) ou choix (liste) |
| `defaults` | les valeurs à l'ouverture |
| `parse(values)` | valide des valeurs et complète celles qui manquent ; lève sinon |
| `acts(values)` | ces réglages changent-ils le texte ? (Le S+0, non : la page n'affiche alors ni marques ni mention) |
| `title`, `label`, `help` | « S+3 » ; « S+3, parmi tous les noms » (résumé et mention copiée) ; l'effet en une phrase |
| `apply(text, tagged, values, resources)` | le texte transformé |

`apply` rend, comme `plainWords`, un élément par mot du texte qu'il a lu (`words`, `tail`) : la
page peut ensuite couper des pistes et disposer la partition sans connaître la contrainte. Il
rend aussi `marks` : pour chaque mot qu'il a touché, le remplaçant, le fait qu'il l'a retiré
(`removed`), ou la raison pour laquelle il l'a laissé tel quel.

## La chaîne

Plusieurs contraintes s'appliquent l'une après l'autre, dans l'ordre choisi sur la table
(`runChain`, `src/domain/plugin-chain.ts`). Chacune lit la sortie de la précédente, que la page
relit comme un texte neuf : chaque mot relu garde la catégorie du mot d'origine dont il vient.
La sortie est ensuite ramenée aux mots du texte d'origine — une contraction relue en deux mots
(« de la ») revient à son mot, un mot retiré reste vide — et les marques aussi : un mot garde
son mot d'origine, et porte au bout du compte ce que toute la chaîne en a fait. Une contrainte
n'a donc rien à savoir de celles qui la précèdent.

`resources` porte les textbanks que la page prête à la contrainte. Aujourd'hui, une seule : le
dictionnaire du S+7 (`morphology`).

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

## Côté page

`installedPlugins` (`src/ui/tracks/mixer-state.ts`) est la seule liste qui nomme les
contraintes. L'état de la table garde, par identifiant, si chacune est en marche et ses
réglages, et l'ordre de la chaîne. Trois gestes : `toggle-plugin`, `set-param` (clé, valeur,
validé par `parse`) et `move-plugin` (position dans la chaîne).
