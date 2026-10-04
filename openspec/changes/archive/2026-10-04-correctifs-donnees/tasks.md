# Tasks

## 1. Base de comparaison

- [x] 1.1 Relever, avant tout changement, un échantillon fixe de réponses de la textbank (formes, homophones, rimes, finales) sur `data/phonetique-oulipao.tsv`, et le temps et la mémoire de `loadPhonetics` sous `node --expose-gc` ; vérifier que le fichier d'échantillon est produit dans `test/support/`

## 2. Index phonétique (PR `perf:`)

- [x] 2.1 (domain) `splitPhonemes` valide les symboles par un `Set` des phonèmes au lieu de `PhonemeSchema.safeParse` ; tests existants de `test/domain/phonetics/*` verts, et une ligne à phonème inconnu toujours refusée
- [x] 2.2 (adapters) `PhoneticEntry` garde l'API en chaîne ; clés des index calculées depuis la chaîne ; `readings()` analyse au premier appel et garde le résultat par forme ; tests de `InMemoryPhonetics` verts et réponses identiques à l'échantillon 1.1
- [x] 2.3 (adapters) Test de budget sur le fichier réel : moins de 250 Mo de tas ajoutés après ramasse-miettes, réponses identiques à l'échantillon ; ajouter `--expose-gc` au script `test` de `package.json` ; vérifier que le test échoue sur l'ancienne représentation
- [x] 2.4 Ajouter le temps de chargement de la textbank à `npm run measure`, et reporter avant/après dans RISK-11 de `docs/arc42/11-risques-et-dette-technique.md`

## 3. Données publiées (PR `perf:`, même lot)

- [x] 3.1 (adapters) Test qui charge `data/verbes-oulipao.tsv` réel avec `loadVerbs` et vérifie trois formes connues (« aimons », « finissait », « pris ») ; `npm test` vert

## 4. Étiqueteur (PR `fix:`)

- [x] 4.1 (adapters) `MODEL_REVISION = '39f044ac95da4c5fd3832cbc5658c027fc027127'` passé au tokenizer et au modèle dans `camembert-model.ts` ; test qui vérifie que les deux appels reçoivent la révision (chargeur factice) ; chargement réel vérifié dans l'aperçu local
- [x] 4.2 Sonder dans l'aperçu local un poème de 600 mots sans ponctuation forte ; consigner le résultat dans la PR
- [x] 4.3 (adapters) Seulement si 4.2 échoue : découpage des phrases trop longues aux retours à la ligne puis par fenêtres d'environ 400 sous-mots sur une frontière de mot, dans `camembert-tagger.ts` ; tests avec un tokenizer factice (phrase courte intacte, poème découpé aux lignes, prose découpée en fenêtres, aucun mot perdu) ; refaire 4.2 et vérifier le succès

## 5. Vérification d'ensemble

- [x] 5.1 `npm run typecheck` et `npm test` verts, couverture ≥ 90 % en lignes, branches et fonctions ; sorties de `npm run measure` identiques sur les trois textes de référence
