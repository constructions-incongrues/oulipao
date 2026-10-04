# Design

## Context

Tout se passe dans la couche **domain**, qui est pure : elle ne parle à l'extérieur que par les ports `MorphologyRepository`, `VerbRepository` et `PhoneticsRepository`, et ce changement n'en modifie aucun. La chaîne (`plugin-chain.ts`) relit la sortie de chaque étape comme un texte neuf (`reread`) et tient la table `origin[k]`, qui donne le mot d'origine du k-ième mot relu. Elle ne la transmet pas aux plugins : `s7/plugin.ts:112` tire donc le dé sur l'index relu. Les copies relevées en revue : `matchCase` ×5 (`removal.ts:16`, `verb.ts:91`, `rhyme/engine.ts:84`, `s7/adjective-shift.ts:9`, `s7/engine.ts:29`), le choix de l'apostrophe ×5, la closure `elides` ×4, et `CLOSED` défini deux fois (`s7/plugin.ts:33`, `rhyme/engine.ts:25`), importé par `edge` et `track-sort` depuis le module du S+7. Voir proposal.md pour les raisons.

## Goals / Non-Goals

**Goals :**
- Tenir la promesse du dé.
- Donner des raisons justes et garder la typographie.
- Ramener les passes à un coût linéaire, et regrouper les copies identiques, **sans changer aucune sortie** sur les textes de référence, hors des cas que visent les specs.

**Non-Goals :**
- Découper les mots selon le dictionnaire : le tokenizer reste sans port (DEBT-02 reste ouverte au-delà de la liste).
- Changer l'interface du port de morphologie.

## Decisions

### D1. Position d'origine dans la portée (domain)

`WordScope` (`plugin.ts`) gagne un champ `origin: number[]`, validé par son schéma zod. `runChain` le remplit depuis `current.origin`. Le S+n appelle `dieRoll(seed, scope.origin[index] ?? index)`. Le repli sur `index` couvre un plugin appelé hors de la chaîne, comme dans les tests unitaires. Pour un S+dé seul, `origin[k] = k` : mêmes faces qu'aujourd'hui.
*Alternative écartée :* passer `origin` en paramètre séparé de `apply`. Cela changerait la signature des treize plugins, pour un seul usage.

### D2. Liste de composés lexicalisés (domain)

`tokenizer.ts` gagne une constante `LEXICALISED`, un `Set` de composés en minuscules. Avant d'appliquer la règle `CLITIC`, le découpage teste la forme entière dans la liste. L'apostrophe U+02BC rejoint les classes `['’]` de `LETTER_RUN` et `ELISION`. Le prix : un impératif « Rendez-vous ! » devient un seul mot. L'étiqueteur lui donne alors sa catégorie, comme pour tout mot. Autre conséquence, acceptée par le fondateur : un texte gardé avant ce changement qui contient un de ces composés ou l'apostrophe U+02BC ne correspond plus à son étiquetage et ne se rouvre plus. Il reste lisible et exportable, et le message de refus dit de copier le texte puis de le remettre en pistes.
*Alternative écartée :* un prédicat issu du dictionnaire. Le tokenizer aurait dépendu de la morphologie, et `reread`, qui tourne à chaque étape, aussi.

### D3. Insécables (domain)

Trois endroits reconstruisent le blanc. Ils réutilisent désormais l'espace trouvée dans le blanc d'origine au lieu d'une espace ordinaire :
- `mixing.ts:72`, `.replace(/[^\S\n]+/g, ' ')`, garde un U+00A0 ou un U+202F présent dans la suite remplacée ;
- `lineation/plugin.ts:21` fait de même ;
- `removal.ts:41` reprend l'espace du blanc fusionné devant « ; : ! ? ».

### D4. Raisons (domain)

Le lipogramme et le tautogramme distinguent un mot absent de la morphologie (statut `unknown-noun`, déjà calculé par `nthNoun`) d'une recherche sans résultat, comme `rhyme/engine.ts:181`. La raison « absent du dictionnaire » rejoint les constantes de raison partagées (D7). Le S+n marque `CLOSED` dans le rappel `shiftAdjectives` quand `skip.has(index)`, comme pour les verbes.

### D5. Coûts linéaires (domain)

- `reread` : deux pointeurs sur `tokens` et `spans`, tous deux triés par position.
- `removeWord` : boucles indexées vers la gauche et la droite, sans `slice`.
- `track-sort/plugin.ts:78` : un `Set` des index déjà marqués.
- `planByVerse` : `push` sur la liste de la strophe, et un `Set` pour `scope.skip`.

La preuve d'identité tient en trois points : les tests existants, un banc de référence (17 chaînes sur les trois textes de référence, sorties figées avant tout changement dans `test/support/chain-golden.json` ; `npm run measure` ne mesure que l'étiquetage), et un test de volume sur 5 000 mots, sous un seuil large qui n'attrape qu'un retour au quadratique.

### D6. Lipogramme indexé (domain)

On mesure d'abord le texte de référence 2 avec `node scripts/chain-golden.ts --time`, pour confirmer ou infirmer le suspect de RISK-08 (relevé de départ : lipogramme en « e » 240 ms au p95, lettres permises 444 ms). Ensuite, `bare(word)` n'est calculé qu'une fois par forme. Un cache par jeu de lettres (`WeakMap<MorphologyRepository, Map<string, Set<string>>>`) garde les formes qui évitent ces lettres. Il est passé en `among` à `nthNoun`, comme le font déjà les filtres de rime (`neighbours.ts:58`). Les chiffres avant et après vont dans RISK-08.

### D7. Copies regroupées (domain)

On compare d'abord, ligne à ligne, les cinq `matchCase`, les cinq choix d'apostrophe et les quatre closures `elides`. Les versions identiques partent dans `src/domain/text-case.ts` (reprise de la casse, choix de l'apostrophe) et dans `src/domain/s7/elision.ts` (fabrique de la closure `elides`). Une copie qui diffère reste en place, avec un commentaire qui dit en quoi. `CLOSED` et la raison « absent du dictionnaire » vont dans `src/domain/reasons.ts`, importé par `s7`, `rhyme`, `edge`, `track-sort`, `lipogram` et `tautogram`. Chaque fonction partagée a un test de son contrat.

## Risks / Trade-offs

- [Des textes gardés avec un S+dé après un retrait se rouvrent avec d'autres faces] → la spec du carnet promet un résultat identique ; le cas est rare (S+dé après un Tri par piste). On l'écrit dans la description de la PR et dans le CHANGELOG (`fix:`).
- [La liste de composés est incomplète] → elle se complète au besoin ; DEBT-02 reste ouverte pour un découpage selon le dictionnaire.
- [Une linéarisation désaligne `origin`] → les tests de `plugin-chain.test.ts` et l'identité de `npm run measure` attrapent tout décalage.
- [Le cache du lipogramme grossit avec chaque jeu de lettres saisi] → une entrée par jeu de lettres distinct dans la session, bornée en pratique par les saisies.

## Migration Plan

Trois PR, chacune réversible : `fix:` dé, raisons, découpage et insécables ; `perf:` linéarisations et lipogramme ; `refactor:` copies regroupées. Pas de migration de données.
