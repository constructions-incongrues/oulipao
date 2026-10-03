# Design

## Context

Voir `proposal.md` pour les mesures. Le R+n et les homophonies passent par `applyRhymeFilter` (`src/domain/rhyme/engine.ts`). Pour chaque mot visé, `decide` rend un critère `accept(form)`, et la recherche du n-ième voisin (`nthNoun`, `nthAdjective`, `nthAdverb` dans `src/domain/neighbours.ts`, `nthVerb` dans `src/domain/verb.ts`) essaie les lemmes un à un, dans l'ordre du dictionnaire, en faisant le tour. Chaque essai prend les formes du lemme, écarte celles qui ne sont pas de simples mots ou n'ont pas les traits voulus, puis appelle `accept`. Pour le R+n, `accept` prononce la forme : lexique pour sa catégorie, sinon autre catégorie, sinon règles (`pronounce`, `src/domain/phonetics/lookup.ts`).

Le fichier dérivé a quatre colonnes (forme, catégorie, prononciation en syllabes, rime) et ne porte que les prononciations de GLÀFF, pour les formes connues de `lexique-oulipao.tsv`.

## Goals / Non-Goals

**Goals :**
- Moins de 100 ms pour le R+n et les homophonies sur un texte de 200 mots.
- Exactement les mêmes mots en sortie qu'aujourd'hui.

**Non-Goals :**
- Le monorime et l'antirime, déjà sous 10 ms.
- Changer la définition de la rime, du repli par règles ou des homophones.
- Une mesure dans le navigateur au-delà de la vérification de la tâche 5 : RISK-08 la couvre déjà.

## Decisions

### 1. Les prononciations de repli sont calculées à la dérivation (adapters, scripts)

Choix du fondateur (2026-10-03), parmi trois options : à la dérivation, au chargement, ou un index de GLÀFF seul. `derivePhonetics` (couche **adapters**) reçoit l'univers des formes candidates par catégorie : noms, adjectifs et adverbes de `morpho-oulipao.tsv`, verbes de `verbes-oulipao.tsv`, et toujours les formes de `lexique-oulipao.tsv`. Pour chaque couple forme et catégorie que GLÀFF ne couvre pas, il écrit la prononciation que `pronounce` donnerait : celle d'une autre catégorie de GLÀFF, sinon `guessReading`. Ces lignes viennent après celles de GLÀFF, pour que `readings(form)` sans catégorie rende toujours en premier la même prononciation.

Une cinquième colonne dit la source : `G` (GLÀFF, même catégorie), `A` (GLÀFF, autre catégorie) ou `R` (règles). Le schéma zod de l'adaptateur l'exige ; une ligne `R` donne une lecture `guessed`.

- *Alternative écartée : un index des seules formes de GLÀFF.* Il exclurait les 19,6 % de formes devinées, que la spec `textbank-phonetique` laisse aux filtres : des résultats changeraient.
- *Alternative écartée : deviner au chargement.* Rien ne change sur disque, mais chaque premier usage paierait le calcul de quelque 90 000 prononciations.

### 2. Le port gagne `rhyming(rhyme, category)` (ports, adapters)

`InMemoryPhonetics` bâtit à la construction un index `catégorie + rime → formes`, avec toutes les lignes. L'index des homophones ne garde que les lignes `G`, comme aujourd'hui. Le port reste étroit : trois méthodes.

### 3. La recherche du voisin se restreint aux candidates (domain)

Les fonctions `nthNoun`, `nthAdjective`, `nthAdverb` et `nthVerb` prennent un argument optionnel, `among?: ReadonlySet<string>`, un ensemble de formes. Sans lui, rien ne change. Avec lui :
1. les formes sont ramenées à leurs lemmes (`nounReadings`, `adjectiveReadings`, `verbs.readings` ; un adverbe est son propre lemme) ;
2. on prend la position de chaque lemme dans la liste du dictionnaire (`positionOf` est déjà indexé) ;
3. on trie les positions dans l'ordre où le tour complet les rencontrerait à partir du point de départ, dans le sens du décalage ;
4. on applique **le même** essai (`pick`) à ces seuls lemmes.

*Pourquoi le résultat est identique :* un lemme hors de l'ensemble n'a aucune forme que `accept` retiendrait, puisque `accept(form)` implique que la forme est dans l'ensemble. Le parcours restreint rencontre donc les mêmes lemmes retenus, dans le même ordre. C'est l'invariant que chaque filtre doit tenir ; il est écrit en commentaire dans `Decision`.

### 4. Le R+n et les homophonies fournissent leurs candidates (domain)

`Decision` gagne un champ optionnel `among?: ReadonlySet<string>`, que le moteur passe à la recherche du voisin, et `Sounds` une méthode `rhyming`.
- **R+n :** `among` = les formes de la catégorie dont la rime est celle du mot d'origine. Deux mots ne riment, à quelque richesse que ce soit, que s'ils ont la même rime (`rhymes`, `src/domain/phonetics/rhyme.ts`).
- **Homophonies :** `among` = l'ensemble des homophones, déjà calculé.

### Couches et ports

Aucun module nouveau.
- **adapters :** `lexicon/glaff-phonetics.ts`, `morphology/in-memory-phonetics.ts` ;
- **ports :** `phonetics.ts` ;
- **domain :** `neighbours.ts`, `verb.ts`, `rhyme/engine.ts`, `rn.ts`, `homophony.ts` ;
- **ui :** `composition.ts` (`PHONETICS_VERSION`) ;
- **scripts :** `build-phonetics.ts`.

## Risks / Trade-offs

- **[Une forme candidate manque à l'index, et un résultat change]** → Le test d'équivalence (tâche 4.1) compare mot à mot les sorties du R+1, du R+3 et des homophonies sur les trois textes de référence, avant et après. Un écart bloque la tâche.
- **[Le fichier grossit]** → Environ 20 % de lignes et une colonne de plus. Mesuré à la dérivation (tâche 1.3) et noté dans `RESULTATS.md` ; il reste chargé à la demande.
- **[Une rime très fréquente (/e/, /ɔ̃/) donne un grand ensemble]** → Il reste borné par les formes de cette rime, bien moins que tout le dictionnaire ; c'est mesuré sur les textes de référence.

## Migration Plan

Régénérer le fichier (`npm run build:phonetics`) et changer `PHONETICS_VERSION`. Retour arrière : un revert ; l'ancien fichier se régénère de même.
