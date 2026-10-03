# Design

## Context

Voir `proposal.md` pour le pourquoi.

État du code :

- **Le contrat.** `src/domain/plugin.ts` déclare `ParameterSchema` comme une union discriminée de `integer` et de `choice`. `ParameterValuesSchema` accepte déjà les nombres et les chaînes.
- **L'hôte.** `src/ui/tracks/components/control.ts` rend un champ numérique ou une liste. `mixer-state.ts` valide chaque réglage par `plugin.parse({ ...params, [key]: value })`, qui lève une erreur si la valeur est refusée.
- **Le lipogramme.** `src/domain/lipogram/plugin.ts` lit `letter` (un choix parmi a–z). Il travaille déjà sur une chaîne de lettres : `containsLetter(word, letters)` accepte plusieurs lettres et `inherit` concatène celles des lipogrammes d'avant dans `banned`. Le passage à une liste est donc surtout un changement de paramètres.
- **Les voisins.** `nthNoun`, `nthAdjective` et `nthAdverb` (`src/domain/neighbours.ts`) et `nthVerb` (`src/domain/verb.ts`) prennent un prédicat `accept(form)`. `rewriteVerbs` passe l'index du mot à son rappel `change`, et `rewriteNouns` passe l'index à son choix de nom. Un filtre peut donc imposer un critère différent à chaque mot.
- **La persistance.** Aucune n'existe : ni `localStorage`, ni état dans l'adresse. Les seuls réglages écrits d'avance sont les recettes (`src/ui/tracks/recipes.ts`).

## Goals / Non-Goals

**Goals :**
- Un seul nouveau type de paramètre, assez général pour les 7 contraintes B d'E1, mais sans mise en forme propre à un plugin dans l'hôte.
- Le tautogramme progressif suit le motif du lipogramme (noms avec leur groupe, puis les autres pistes, puis les verbes, puis l'élision), pour hériter du réaccord et de l'élision sans les réécrire.

**Non-Goals :**
- Le verrou par mot sur un paramètre texte. `set-lock` reste réservé aux entiers.
- Le moteur des filtres de rime (`src/domain/rhyme/engine.ts`) : il dépend de la phonétique, que le tautogramme n'utilise pas.
- L'acrostiche brivadois, l'abécédaire et le tautogramme simple : ils viendront comme recettes ou préréglages, après.

## Decisions

**1. `TextParameterSchema` : `kind`, `key`, `label`, `maxLength` (entier ≥ 1) et un `placeholder` facultatif.** *Couche : domain.* Ce type ne valide pas le contenu de la saisie. Le plugin interprète la chaîne dans son `parse` (zod) : lettres seulement, accents et ligatures ramenés à la lettre nue par la même fonction `bare` que le lipogramme. Écarté : un `pattern` (expression régulière) dans le contrat. Chaque plugin interprète la saisie à sa façon (lettres en liste, lettres en ensemble), et une expression dans le contrat refuserait des saisies naturelles comme « Hélène-Marie ».

**2. Une saisie vide est valide.** `parse` accepte toute chaîne d'au plus `maxLength` caractères. Une saisie dont le plugin ne tire rien rend `acts` faux, et `help` le dit. Une saisie trop longue fait échouer `parse`, et `mixer-state` la refuse comme une valeur hors bornes. Le champ HTML porte `maxlength`, donc le cas ne se produit pas à la frappe. Écarté : refuser la saisie vide, car le champ deviendrait impossible à effacer pour retaper.

**3. Le champ texte se met à jour à chaque frappe, sans différé.** *Couche : ui.* Le réglage passe par le même chemin que les autres paramètres, qui tient la demi-seconde sur 200 mots (spec du réglage en direct). Un différé ne s'ajoute que si la mesure de la tâche de vérification dépasse ce seuil.

**4. Le lipogramme : `letters` (texte, `maxLength` 40, « e » par défaut) et `mode` (`forbidden` | `allowed`).** *Couche : domain.* Une fonction pure `bannedLetters(letters, mode)` rend la chaîne des lettres bannies : la saisie nettoyée, ou bien son complément dans a–z. `apply` y ajoute `banned` (hérité) comme aujourd'hui. `inherit` concatène les `bannedLetters` des lipogrammes d'avant, et plus seulement leur `letter`, ce qui couvre le scénario « permises puis interdites ». Il n'y a pas d'alias pour l'ancien `letter` : rien ne le persiste, et les recettes sont réécrites (décision 6). Écarté : garder `letter` en plus de `letters`, deux sources de vérité pour un réglage que personne n'a enregistré.

**5. Le tautogramme progressif, dans `src/domain/tautogram/plugin.ts`.** *Couche : domain, ports `MorphologyRepository` et `VerbRepository`.*
- **Le cycle se calcule avant toute réécriture.** Une fonction pure `assignLetters(tagged, targets, skip, letters)` rend une `Map<index, lettre>`. Elle parcourt les mots dans l'ordre et ne retient que les catégories visées, hors mots-outils (`other`) et hors pas bouchés (`scope.skip`). Chaque mot retenu prend `letters[k % letters.length]`. Le calcul se fait sur l'étiquetage et non sur la sortie, pour que le cycle ne dépende pas des remplacements faits avant dans la passe.
- **Le point de départ : le mot à l'initiale changée.** Partir du mot lui-même donne toujours le premier mot de la lettre. En faisant le tour depuis « maison », le premier mot en « l » rencontré est la tête du bloc des « l » : « l », un nom de lettre. C'est ce que la recette dans le navigateur a montré (« L’o le ubique l i… »). La recherche part donc de la place qu'aurait le mot avec sa nouvelle initiale (« maison » vers « p » : « paison »). `nthNoun`, `nthAdjective`, `nthAdverb` et `nthVerb` reçoivent un `from` facultatif, qui calcule cette ancre depuis le lemme, le paradigme, l'adverbe ou l'infinitif. `before(liste, ancre)` (recherche dichotomique dans une liste triée par `Intl.Collator('fr')`) donne la place de départ. Le tour est alors complet, entrée de départ comprise : elle n'est plus le mot lui-même. Écarté : le même rang relatif dans le bloc de la lettre, plus dur à énoncer ; ou garder le premier mot de la lettre en écartant les sigles, ce qui donne toujours le même mot par lettre.
- **Les remplacements suivent le motif du lipogramme**, avec le prédicat `startsWith(letter)` sur la forme nue à la place de `!containsLetter`, et l'ancre `from` :
  - les noms par `rewriteNouns` et `nthNoun(word, hints, 1, accept)` ;
  - les adjectifs et adverbes par `nthAdjective` et `nthAdverb` ;
  - les verbes par `rewriteVerbs` et `nthVerb(..., accept, verbs, 'aucun voisin à l'initiale x')` ;
  - un mot qui commence déjà par sa lettre passe par `keepNoun`, ou n'est pas retenu.
- **`être` et `avoir`** : `nthVerb` les laisse déjà avec la raison « auxiliaire », comme au lipogramme. Ils prennent leur lettre (décision du fondateur : verbes traités comme au lipogramme).
- **Les helpers communs.** `bare` et `matchCase` sont déjà exportés ou faciles à exporter : `bare` sort de `lipogram/neighbour.ts` vers un module partagé `src/domain/letters.ts`, sans changer de comportement. `elide` (article devant voyelle) passe du lipogramme à ce même module, pour que les deux plugins le partagent.

Écarté : réutiliser `applyRhymeFilter`. Il impose une passe phonétique (`Sounds`) et l'attente de la textbank phonétique, inutiles ici.

**6. Les recettes.** *Couche : ui.* `lipograms(letters[])` (n instances) devient `lipogram(letters, mode)` (une instance). Le Beau présent ajoute une instance en mode `allowed` avec `letters: ''`. Elle n'agit pas tant que le nom n'est pas tapé (décision 2), et la règle de la recette le dit. Écarté : un choix au branchement pour le nom. Le contrat de recette n'offre qu'une liste fermée, et l'étendre est hors de propos.

## Risks / Trade-offs

- **[Le texte change pour les recettes à plusieurs lettres]** Douze lipogrammes enchaînés ne donnent pas le même texte qu'un lipogramme sur douze lettres : chaque instance prenait le premier voisin sans *sa* lettre, puis l'instance suivante repartait de ce voisin. → C'est voulu : la nouvelle règle est celle de l'Oulipo (le premier voisin sans aucune des lettres). Rien n'est persisté, donc personne ne perd un réglage. Pour une seule lettre, le texte est identique, et un test le fixe.
- **[Lettres rares en tête de mot]** Pour « x », « y », « k » et « w », il y a peu de voisins par catégorie et par traits, donc beaucoup de « aucun voisin ». → La raison s'affiche par mot dans l'inspecteur. Le cycle avance quand même, ce qui garde la règle lisible.
- **[Coût de la recherche]** Un voisin à l'initiale imposée peut obliger à faire le tour du dictionnaire. → Le parcours est le même que celui du lipogramme, qui tient le réglage en direct. Si une mesure le contredit, `among` (les formes qui commencent par la lettre, indexées une fois par lettre) borne la recherche sans changer le résultat.
- **[Mode « permises » avec une saisie courte]** Avec « e » seul permis, presque aucun mot ne survit. → C'est la contrainte. Les mots sans voisin restent, avec leur raison.

## Migration Plan

Aucune donnée à migrer. Le changement se livre d'un bloc, comme les précédents. Pour revenir en arrière, on annule le commit.
