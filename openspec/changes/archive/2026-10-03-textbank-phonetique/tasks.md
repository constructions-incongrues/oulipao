# Tâches

Plan de construction : la **vague 0** (groupes 1 et 2, la fondation) se fait d'abord, par un seul constructeur, puis on fusionne. La **vague 1** (groupes 3, 4 et 5) se mène en parallèle, sans fichier commun. La **vague 2** (groupe 6, le R+n) vient ensuite. La **vague 3** (groupes 7, 8 et 9) se mène en parallèle. Le groupe 10 clôt. Le R+n est utilisable seul dès la fin de la vague 2 ; si le carnet reste vide trois semaines, on s'arrête là (garde de la stratégie).

## 1. Données phonétiques (vague 0)

- [x] 1.1 [adapters] Lire GLÀFF 1.2.2, déjà dans `data/brut/autres/glaff/` (téléchargé le 2026-10-03), puis lire ses premières lignes. Noter dans `docs/lexiques.md` les champs réels (forme, étiquette GRACE, lemme, prononciations API et SAMPA, séparateurs). Vérifier que la note cite trois lignes réelles, dont une forme à deux prononciations.
- [x] 1.2 [domain] Créer `src/domain/phonetics/phoneme.ts` : l'inventaire des phonèmes du français en API (`PhonemeSchema`), `PhoneticReadingSchema` (phonèmes, syllabes, drapeau `guessed`) et le découpage d'une chaîne API en phonèmes (voyelles nasales et diacritiques compris). Vérifier par `test/domain/phonetics/phonetics.test.ts` : /ʃɛz/, /kuvɑ̃/, et le refus d'un symbole hors inventaire.
- [x] 1.3 [adapters] Écrire `src/adapters/lexicon/glaff-phonetics.ts`, qui fait cinq choses :
  - réduire l'étiquette GRACE à la catégorie d'Oulipao ;
  - garder la première des prononciations multiples ;
  - ne garder que les formes présentes dans Grammalecte ;
  - calculer les syllabes ;
  - écrire l'en-tête de licence CC BY-SA 3.0 avec l'attribution.

  Ajouter ensuite `scripts/build-phonetics.ts` et le script `build:phonetics` dans `package.json`, puis produire `data/phonetique-oulipao.tsv`. Vérifier par `test/adapters/phonetics.test.ts`, sur des lignes brutes de *chaise*, *couvent* (nom et verbe) et *vers*. Vérifier aussi que le script affiche le nombre de lignes, la couverture (part des formes de Grammalecte sans prononciation) et la taille compressée. Noter ces trois mesures dans `RESULTATS.md`.
- [x] 1.4 [adapters] Mettre à jour `THIRD_PARTY_LICENSES.md` : GLÀFF, ses auteurs, la licence CC BY-SA 3.0, et le fichier concerné. Vérifier en relisant que la mention nomme le fichier dérivé et dit qu'il est séparé du code MIT et des données MPL.

## 2. Port et adaptateur (vague 0)

- [x] 2.1 [ports] Créer `src/ports/phonetics.ts` (`PhoneticsRepository` : `readings`, `homophones` ; les rimes fréquentes sont fixées à la dérivation, voir 7.1). Ajouter `phonetics?: PhoneticsRepository` à `PluginResources` et `phonetic?: boolean` à `ConstraintPlugin`, dans `src/domain/plugin.ts`. Vérifier que `npm run typecheck` passe.
- [x] 2.2 [adapters] Écrire `src/adapters/morphology/in-memory-phonetics.ts`, qui fait trois choses :
  - valider chaque ligne par zod et lever en citant la ligne fautive ;
  - indexer par forme et catégorie, et par suite de phonèmes pour les homophones ;
  - exposer `loadPhonetics(source)`.

  Ajouter une textbank factice à `test/support/`. Vérifier par `test/adapters/phonetics.test.ts` les scénarios « Prononciation de chaise », « Ligne non conforme », « couvent nom et verbe » et « Homophones de verre ».

## 3. Rime et repli (vague 1)

- [x] 3.1 [domain] Écrire `src/domain/phonetics/rhyme.ts`, avec `rhymeOf(reading)` (dernière voyelle prononcée et ce qui suit, e muet final exclu) et `rhymes(a, b, richness)`. Vérifier par `test/domain/phonetics/phonetics.test.ts` les scénarios « Rime suffisante », « Rime riche refusée » et « E muet final ».
- [x] 3.2 [domain] Écrire `src/domain/phonetics/fallback.ts` : une table ordonnée de règles graphème→phonème, qui produit une lecture marquée `guessed`. Vérifier par un test qui couvre « glorbiture » (rime /yʁ/), *eau*, *ain*, *ch*, et le *e* final muet.
- [x] 3.3 [domain] Écrire `src/domain/phonetics/lookup.ts`. `pronounce(form, category, phonetics)` choisit la lecture de la catégorie, puis le repli ; `lineSyllables(words)` compte les syllabes d'un vers, avec le e muet devant consonne et l'élision devant voyelle. Vérifier par un test que le vers de Verlaine « Je fais souvent ce rêve étrange et pénétrant » compte 12.

## 4. Vers et strophes (vague 1)

- [x] 4.1 [domain] Écrire `src/domain/verse.ts`, avec `layoutVerse(text, tagged)` → `{ line, stanza, lineEnd }[]` tiré des blancs (`tokenize`). Vérifier par `test/domain/verse.test.ts` les scénarios « Deux strophes », « Prose », « Ponctuation finale » et « Mot-outil final ».
- [x] 4.2 [domain] Vérifier la stabilité dans la chaîne par un test de `test/domain/verse.test.ts`. Un texte en vers passé au S+7 puis relu (`reread`) doit garder pour chaque mot le même vers et la même strophe (scénario « Après un S+7 »).

## 5. Chargement à la demande (vague 1)

- [x] 5.1 [ui] Dans `src/ui/composition.ts`, ajouter `createPhoneticsLoader` et `PHONETICS_VERSION` sur le modèle des verbes. Dans `src/ui/tracks/controller.ts`, ajouter l'état `phonetics` et `wantResources`, qui demande les prononciations dès qu'une instance active est `phonetic` (les verbes, comme avant, d'après les pistes visées). Vérifier par `test/ui/tracks/phonetics.test.ts` et `test/ui/tracks/controller.test.ts` :
  - aucune requête sans filtre phonétique ;
  - un chargement au premier filtre phonétique ;
  - un recalcul à l'arrivée ;
  - la relance après un échec ;
  - les tests des verbes passent inchangés.
- [x] 5.2 [ui] Dans `src/ui/tracks/main.ts` et `src/ui/tracks/view-model.ts`, passer `phonetics` à `runChain`. Afficher l'échec de la textbank dans `app.ts`, avec un bouton « Relancer », sur le modèle des verbes. Vérifier par `test/ui/tracks/phonetics.test.ts` le scénario « Échec de la textbank phonétique » : les autres filtres continuent de s'appliquer.

## 6. R+n (vague 2, après les vagues 0 et 1)

- [x] 6.1 [domain] Rendre génériques les voisins du lipogramme : `src/domain/neighbours.ts` (`nthNoun`, `nthAdjective`, `nthAdverb`) et `nthVerb` dans `src/domain/verb.ts`, le n-ième voisin qui passe un critère ; le lipogramme les appelle avec n = 1 (révisé à l'implémentation, voir design D6). Écrire le moteur commun `src/domain/rhyme/engine.ts`. Vérifier que `npm test` passe sans toucher aux tests existants du lipogramme ni du S+n.
- [x] 6.2 [domain] Écrire `src/domain/rhyme/rn.ts`. La contrainte `rnPlugin` (`definePlugin`, `phonetic: true`) a pour pistes les noms, les adjectifs, les verbes et les adverbes. Ses paramètres : `n` (de −20 à 20), `richness` (pauvre, suffisante ou riche) et `reach` (tous les mots ou fins de vers). Le critère est « la forme accordée rime avec l'original », avec une mémoire `forme → rime` par appel, à commenter en `ponytail:` (plafond et index précalculé). Les pas bouchés et les verrous sont respectés, et la raison est `LOADING` sans textbank. Vérifier par `test/domain/rhyme/rhyme-filters.test.ts`, avec la textbank factice :
  - « R+1 sur chaise » ;
  - « Aucun voisin qui rime » ;
  - « R+0 » ;
  - « Fins de vers seulement » ;
  - « Pas bouché » ;
  - un verbe accordé en temps et en personne.
- [x] 6.3 [ui] Ajouter `rnPlugin` à `installedPlugins` (`src/ui/tracks/mixer-state.ts`). Vérifier par `test/ui/tracks/phonetics.test.ts` le scénario « S+7 puis R+2 » : la mention copiée nomme le S+n puis « R+2, rime suffisante » dans l'ordre.

## 7. Monorime et antirime (vague 3, en parallèle avec 8 et 9)

- [x] 7.1 [adapters] Étendre `scripts/build-phonetics.ts` pour écrire `src/domain/rhyme/frequent-rhymes.ts`, les 30 rimes les plus fréquentes avec un mot exemple. Vérifier que le module généré compile et contient /ɔ̃/ avec un exemple.
- [x] 7.2 [domain] Écrire `src/domain/rhyme/monorhyme.ts` : un paramètre `choice` tiré de `frequent-rhymes.ts`, sur les fins de vers seulement. Vérifier par un test le scénario « Monorime en /ɔ̃/ », dont le cas d'une fin de vers déjà en /ɔ̃/.
- [x] 7.3 [domain] Écrire `src/domain/rhyme/antirhyme.ts` : parcourir les fins de vers par strophe ; le critère est « ne rime avec aucune fin gardée ». Vérifier par un test le scénario « Quatrain à rimes plates ».
- [x] 7.4 [ui] Ajouter les deux contraintes à `installedPlugins`. Vérifier par `test/ui/tracks/mixer-state.test.ts` la liste des contraintes installées, et dans le navigateur qu'une chaîne homophonies puis monorime s'exécute et que le résumé nomme les deux réglages.

## 8. Homophonies (vague 3, en parallèle avec 7 et 9)

- [x] 8.1 [domain] Écrire `src/domain/rhyme/homophony.ts` : candidats tirés de `homophones`, mêmes traits, n-ième en boucle, raison « aucun homophone ». L'ajouter à `installedPlugins` avec les autres. Vérifier par un test le scénario « vers nom », ainsi qu'un mot sans homophone.

## 9. Prononciation dans l'interface (vague 3, en parallèle avec 7 et 8)

- [x] 9.1 [ui] Dans `src/ui/tracks/view-model.ts`, la vue reçoit la prononciation en clair de chaque mot (`pronunciations` : prononciation, syllabes, rime, « devinée »). `src/ui/tracks/components/inspector.ts` les affiche en API, selon `DESIGN.md`. Vérifier par `test/ui/tracks/phonetics.test.ts` et `test/domain/phonetics/phonetics.test.ts` les scénarios « Mot connu » et « Mot deviné ».
- [x] 9.2 [ui] Dans `src/ui/tracks/components/result.ts`, afficher le compte de syllabes en marge de chaque vers (Martian Mono, couleur secondaire), masqué sans filtre phonétique. Vérifier par un test les scénarios « Alexandrin » et « Sans filtre phonétique ». Vérifier aussi dans le navigateur, à 375 px, que la marge ne fait pas défiler la page à l'horizontale.

## 10. Clôture

- [x] 10.1 Mettre à jour `docs/plugins.md` (les quatre contraintes, le champ `phonetic`) et `docs/lexiques.md` (GLÀFF retenu, la raison de licence). Vérifier en relisant que chaque contrainte a un exemple.
- [ ] 10.2 Relire à la main 3 textes de 200 mots passés au R+7 à la richesse suffisante. Compter les remplacements qui riment vraiment avec l'original, avec une règle écrite d'avance dans `RESULTATS.md` (même rime phonétique, mot deviné compté à part). Vérifier qu'au moins 9 sur 10 riment.
- [x] 10.3 Lancer `npm test`, `npm run typecheck` et `npm run build`. Vérifier que tout passe et que la couverture reste au-dessus de 90 % en lignes, branches et fonctions.
