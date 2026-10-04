# Design

## Context

Voir `proposal.md` pour les motivations, et `specs/modulateurs-de-parametres/spec.md` pour le comportement attendu.

Ce qui existe déjà et que le modulateur réutilise :
- **Le contrat de plugin** (`src/domain/plugin.ts`) déclare des paramètres entiers `lockable`. Le S+n, le R+n et l'homophonie lisent `scope.overrides` (valeurs par mot) et `scope.skip` (mots laissés).
- **`runChain`** (`src/domain/plugin-chain.ts`) relit le texte à chaque étage (`reread` donne les mots reçus, leurs étiquettes et `origin`, la position d'origine de chaque mot relu). Il traduit les verrous et les pas bouchés en portée par `scopeOf`. Les verrous vivent dans `Instance.locks` (`src/ui/tracks/types.ts`) et arrivent dans `ChainStep.locks`.
- **Les prononciations** se chargent à la demande dans le contrôleur (`controller.ts:260`, uniquement si un plugin `phonetic` est en marche). `pronounce` et `syllableCount` (`src/domain/phonetics/lookup.ts`) donnent les syllabes, et `guessReading` devine une prononciation absente.
- **Les lignes** se lisent dans les blancs des `OutputWord` (`linesOf`, `src/domain/lines.ts`).
- **La mention** se compose de `describeInstance` et de `plugin.label` (`view-model.ts`).

## Goals / Non-Goals

**Goals:**
- Un seul mécanisme (source → mot lu → paramètre ou porte) qui produit `overrides` et `skip`, sans toucher au contrat de plugin.
- Un calcul pur, étage par étage, testable sans interface ni lexique réel.
- Un énoncé dérivé du modèle, donc toujours fidèle à ce qui s'applique.

**Non-Goals:**
- Un graphe de modulation entre instances (une instance qui en module une autre).
- Une analyse syntaxique pour le voisin.
- Une interface à câbles.

## Decisions

### 1. Le modulateur vit dans le domaine, et l'instance le porte dans l'état de la table

**Couche :** domain. `src/domain/modulation/` contient :
- `schema.ts` : `SourceSchema`, `ModulatorSchema`, `GateSchema` (zod). C'est le modèle, et le type de l'interface en est déduit.
- `sources.ts` : la valeur brute d'une source sur un mot.
- `neighbour.ts` : le mot lu.
- `fold.ts` : base, profondeur et repli.
- `gate.ts` : les tests et l'Euclide.
- `apply.ts` : `modulate(stage, step)` rend `{ overrides, skip, values }`.

Ports dépendus : aucun en direct. La source `syllabes` reçoit une fonction `syllables(word, category) → number | undefined` injectée par l'appelant, construite sur `PhoneticsRepository`.

L'instance (`src/ui/tracks/types.ts`) reçoit deux champs optionnels :
- `modulators: Record<paramKey, Modulator>` ;
- `gate: Gate`.

Ils sont importés du domaine, à la manière de `ParameterValuesSchema`.

*Alternative écartée :* stocker le modulateur dans `params` sous forme de chaîne. Il échapperait à la validation zod et se mêlerait aux valeurs que le plugin lit dans `parse`.

### 2. Le calcul se fait dans `runChain`, après `reread`, et passe par la portée existante

`ChainStep` reçoit `modulators?`, `gate?` et `parameters` (les définitions du plugin, pour les bornes). Elles sont déjà disponibles via `plugin.parameters`, donc il n'y a rien à ajouter. À chaque étage :
1. `current = reread(...)` donne les mots reçus. Le modulateur lit `current.tagged[k].word`, ce qui produit la rétroaction voulue.
2. Les lignes de l'étage se calculent à partir de `words`, la sortie de l'étage précédent, avec `linesOf`.
3. On calcule d'abord la porte : elle donne la liste des positions sautées.
4. On calcule ensuite les valeurs modulées sur les mots traités. Le rang, le motif et la rampe comptent les positions des pistes visées, ni bouchées ni sautées par la porte, et dont le mot d'origine n'a pas été retiré.
5. `scopeOf` fusionne les verrous manuels **par-dessus** les valeurs modulées, et les pas bouchés avec les sauts de la porte.

Chaque mot relu reçoit sa propre valeur ; un mot d'origine relu en deux mots (« du » → « de la ») montre dans l'inspecteur celle du premier.

`ChainResult` gagne `modulation[k]`, soit pour chaque étage `{ index → { value?, gate?: 'open'|'closed', note?: 'pas de voisin'|'prononciations en cours de chargement' } }`, indexé par mot d'origine. L'inspecteur l'affiche sans rien recalculer.

*Alternative écartée :* un plugin enveloppe (« décorateur ») qui modulerait un autre plugin. Il changerait l'identité de l'instance, casserait `inherit` et les verrous, et cacherait la règle.

### 3. Le mot retiré

Une position est « retirée » quand le mot d'origine est marqué `removed` par un étage précédent. C'est la carte `marks` déjà tenue par `runChain`. Le texte relu ne contient plus ce mot, donc la plupart des cas tombent d'eux-mêmes. Le test de domaine le vérifie.

### 4. Le voisin

Dans le texte reçu, on cherche le mot le plus proche de la piste choisie, dans la direction choisie, en s'arrêtant au premier mot dont le blanc précédent (côté avant) ou le mot lui-même (côté après) contient `.`, `!` ou `?`. On utilise les mêmes données que `reread`, sans nouvelle tokenisation.

### 5. Le repli

C'est une fonction pure de `fold(v, min, max)` :
- `v` dans les bornes : inchangé ;
- `v > max` et `max ≥ 1` : `((v − 1) mod max) + 1` ;
- sinon : `min + ((v − min) mod span)`, avec un modulo mathématique.

`modulate` signale si un repli a eu lieu, pour que la phrase dise « modulo ».

### 6. L'énoncé vient du modèle

La phrase vit côté interface (`src/ui/tracks/modulation-statement.ts`), à côté de `TRACK_UNITS` qu'elle emploie. `statement(modulator | gate, plugin, targets)` compose la phrase à partir de gabarits par source et par paramètre. Par exemple, pour le décalage : « chaque {nom} avance d'autant de {noms} qu'il a de lettres », avec « {de l'adjectif suivant} » si on lit le voisin, et « en arrivant ici » si un étage précédent peut changer le mot. `describeInstance` y ajoute la phrase. Le libellé court (« S+lettres ») est construit par l'interface à partir d'une table `{ s7: 'S+', rn: 'R+', homophony: 'Homophonie ' } × nom court de la source`. On le fait côté interface pour ne pas toucher au contrat (question 2 du PRD).

### 7. Les prononciations

`controller.ts:260` déclenche aussi `loadPhonetics()` quand une instance en marche a un modulateur ou une porte qui lit `syllabes`. Avant le chargement, la fonction `syllables` rend `undefined`. Le mot garde alors la valeur de l'instance, avec la note `PHONETICS_LOADING`.

### 8. L'interface

C'est l'option A du PRD : à côté de chaque champ verrouillable, un sélecteur « fixe / lettres / syllabes / voyelles / lettre / rang / ligne / motif / rampe ». Si on choisit une source, une ligne repliée s'ouvre :
- le mot lu : lui-même ou voisin (piste, sens) ;
- la base et la profondeur ;
- les champs propres à la source : la lettre, le motif, les bornes de la rampe.

La porte est une ligne « Porte » dans le panneau, fermée par défaut. Composants : `components/modulator-field.ts` et `components/gate-field.ts`. Les actions vont dans `mixer-state.ts` (`setModulator`, `clearModulator`, `setGate`, `clearGate`), sur le modèle de `lock` et `unlock`. Les valeurs sont validées par `ModulatorSchema` avant d'entrer dans l'état. La saisie invalide (motif « 7, x ») est refusée près du champ, comme pour les verrous. Le style suit `DESIGN.md`.

### 9. La persistance

`modulators` et `gate` sont optionnels dans `InstanceSchema`. Un ancien carnet se lit donc tel quel. Pour qu'un modulateur abîmé n'invalide pas l'entrée, `InstanceSchema` passe ces deux champs par un `z.preprocess`/`catch` qui retombe sur `undefined`. La remise en pistes d'un nouveau texte vide déjà `locks` (`mixer-state.ts:164`). Elle ne touche pas `modulators` ni `gate`.

## Risks / Trade-offs

- **[Coût du calcul]** Le modulateur ajoute un passage linéaire par étage. Le voisin est en O(distance). → On mesure sur 500 mots avec trois instances modulées. On ne met pas de cache tant que ce n'est pas lent.
- **[Combinatoire peu lisible]** Le périmètre complet multiplie les réglages. → La ligne de réglages est repliée par défaut, la phrase unique sert de garde-fou, et la mention dit tout.
- **[Rétroaction surprenante]** L'ordre de la chaîne change les valeurs. → L'inspecteur montre la valeur lue à chaque étage, et la phrase dit « en arrivant ici ».
- **[Voisin approximatif]** Le plus proche n'est pas toujours celui qui qualifie le mot. → C'est assumé et dit dans la phrase (« l'adjectif suivant », pas « son adjectif »).
- **[Couverture > 90 %]** Huit sources, cinq tests et un repli. → Le domaine est testé par table, source par source. L'interface est testée par les actions de `mixer-state` et le modèle de vue.
