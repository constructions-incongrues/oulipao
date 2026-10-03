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
| `track` | la piste sur laquelle elle se branche |
| `parameters` | les paramètres, dans l'ordre d'affichage : entier borné (champ numérique) ou choix (liste) |
| `defaults` | les valeurs à l'ouverture |
| `parse(values)` | valide des valeurs et complète celles qui manquent ; lève sinon |
| `acts(values)` | ces réglages changent-ils le texte ? (Le S+0, non : la page n'affiche alors ni marques ni mention) |
| `title`, `label`, `help` | « S+3 » ; « S+3, parmi tous les noms » (résumé et mention copiée) ; l'effet en une phrase |
| `apply(text, tagged, values, resources)` | le texte transformé |

`apply` rend, comme `plainWords`, un élément par mot du texte d'origine (`words`, `tail`) : la
page peut ensuite couper des pistes et disposer la partition sans connaître la contrainte. Il
rend aussi `marks` : pour chaque mot de sa piste, le remplaçant, ou la raison pour laquelle le
mot est resté tel quel.

`resources` porte les textbanks que la page prête à la contrainte. Aujourd'hui, une seule : le
dictionnaire du S+7 (`morphology`).

## Ce que le S+7 a appris au contrat

Le S+7 (`src/domain/s7/plugin.ts`) est branché sur les noms, mais il **réécrit aussi les autres
pistes** : déterminants, adjectifs, attributs et pronoms se réaccordent. C'est pourquoi `apply`
rend tout le texte, mot par mot, et pas seulement sa piste. Une contrainte qui ne respecte pas
les pistes (le lipogramme agit sur les lettres) n'aura besoin de rien de plus ; il faudra
peut-être en revanche revoir `track` et `marks`, pensés pour une contrainte attachée à une piste.

## Côté page

`installedPlugin` (`src/ui/tracks/mixer-state.ts`) est la seule ligne qui nomme le S+7. Les
réglages passent par un seul geste, `set-param` (clé, valeur), validé par `parse`.
