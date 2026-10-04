# Tasks

## 1. Mesure de départ

- [x] 1.1 Banc de référence des contraintes (`test/support/chain-golden.ts`, `scripts/chain-golden.ts`) : 17 chaînes sur les trois textes de référence, sorties figées dans `test/support/chain-golden.json` et vérifiées par `test/domain/chain-golden.test.ts`, temps de départ relevés avec `--time` ; vérifier que le test passe avant tout changement

## 2. Dé sur la position d'origine (PR `fix:`)

- [x] 2.1 (domain) Ajouter `origin: number[]` à `WordScope` et à son schéma zod dans `plugin.ts`, rempli par `runChain` depuis `current.origin` ; test dans `test/domain/plugin-chain.test.ts` : un plugin espion reçoit les positions d'origine après une étape qui retire un mot
- [x] 2.2 (domain) `s7/plugin.ts` tire `dieRoll(seed, scope.origin[index] ?? index)` ; tests : S+dé seul inchangé, S+dé après un Tri par piste qui retire un adverbe garde les mêmes faces quand on coupe ou rallume l'étape amont

## 3. Raisons, découpage, insécables (PR `fix:`)

- [x] 3.1 (domain) Le S+n marque « pas bouché » un adjectif dont le pas est bouché (rappel de `shiftAdjectives`) ; test dans `test/domain/s7/plugin.test.ts`
- [x] 3.2 (domain) Le lipogramme donne « absent du dictionnaire » à un mot inconnu de la morphologie ; test dans `test/domain/lipogram/plugin.test.ts`
- [x] 3.3 (domain) Le tautogramme donne « absent du dictionnaire » à un mot inconnu, et le mot suivant prend la lettre d'après ; test dans `test/domain/tautogram/plugin.test.ts`
- [x] 3.4 (domain) `tokenizer.ts` : liste `LEXICALISED` (« rendez-vous », « on-dit », « chez-soi », « chez-moi », « m'as-tu-vu ») testée avant la règle des clitiques, et U+02BC dans les classes d'apostrophe ; tests : « rendez-vous », « dit-il », « donne-le », « lʼarbre », « QU'IL », chaîne vide, blancs seuls
- [x] 3.5 (domain) Espaces insécables conservées dans `mixing.ts`, `lineation/plugin.ts` et `removal.ts` ; tests : retrait devant « ! » avec U+202F, piste coupée devant « : » avec U+00A0, mise en vers
- [x] 3.6 Refiger le banc (`node scripts/chain-golden.ts > test/support/chain-golden.json`) : le diff ne montre que les cas visés par les specs (dé après un retrait, raisons, insécables) ; noter les écarts dans la PR
- [x] 3.7 (ui) Le refus de rouvrir une entrée dont l'étiquetage ne correspond plus au découpage dit comment la récupérer (copier le texte, le remettre en pistes) ; test du message

## 4. Coûts linéaires (PR `perf:`)

- [x] 4.1 (domain) `reread` à deux pointeurs dans `plugin-chain.ts` ; `npm test` vert, banc de référence inchangé
- [x] 4.2 (domain) `removeWord` sans `slice` (`removal.ts`), `Set` des marques dans `track-sort/plugin.ts`, strophes sans recopie et `Set` des pas bouchés dans `rhyme/engine.ts` ; `npm test` vert, banc de référence inchangé
- [x] 4.3 (domain) Test de volume dans `test/domain/plugin-chain.test.ts` : une chaîne Tri par piste + Bord + Mise en vers sur un texte de 5 000 mots, sous un seuil large qui n'attrape qu'un retour au quadratique ; vérifier qu'il échoue sur l'ancien `reread`
- [x] 4.4 (domain) Lipogramme : `bare(word)` calculé une fois, cache par jeu de lettres des formes qui les évitent, passé en `among` à `nthNoun` ; banc de référence inchangé et temps du texte 2 mesuré avant/après (`--time`)
- [x] 4.5 Reporter les mesures avant/après dans RISK-08 de `docs/arc42/11-risques-et-dette-technique.md`

## 5. Copies regroupées (PR `refactor:`)

- [ ] 5.1 (domain) Comparer ligne à ligne les cinq `matchCase`, les cinq choix d'apostrophe et les quatre closures `elides` ; noter dans la PR celles qui sont identiques et celles qui diffèrent
- [ ] 5.2 (domain) Extraire les copies identiques dans `src/domain/text-case.ts` et `src/domain/s7/elision.ts`, avec un test du contrat de chaque fonction partagée ; laisser en place, commentées, celles qui diffèrent ; banc de référence inchangé
- [ ] 5.3 (domain) Créer `src/domain/reasons.ts` (« pas bouché », « absent du dictionnaire ») et y faire pointer `s7`, `rhyme`, `verb`, `edge`, `track-sort`, `lipogram` et `tautogram` ; plus aucun import de `s7/plugin.ts` depuis `edge` ni `track-sort` (vérifié par recherche)
- [ ] 5.4 Mettre à jour DEBT-02 dans `docs/arc42/11-risques-et-dette-technique.md` (liste de composés lexicalisés, découpage selon le dictionnaire toujours ouvert)

## 6. Vérification d'ensemble

- [ ] 6.1 `npm run typecheck` et `npm test` verts, couverture ≥ 90 % en lignes, branches et fonctions
