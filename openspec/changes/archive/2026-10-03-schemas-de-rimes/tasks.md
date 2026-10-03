# Tâches

Plan de construction en quatre vagues :

- **Vague 0** (groupes 1 et 2) : la fondation. Un seul constructeur, puis on fusionne. L'API de la pré-passe est **gelée** à la fin du groupe 2.
- **Vague 1** (groupes 3 à 7) : en parallèle, chacun dans son fichier. Aucun groupe ne touche `engine.ts` ni `mixer-state.ts`.
- **Vague 2** : le groupe 8.
- **Vague 3** : le groupe 9.

Si le carnet reste vide trois semaines, on s'arrête (garde de la stratégie).

## 1. Genre et découpe de la rime (vague 0)

- [x] 1.1 [domain] Sortir le e muet de `src/domain/phonetics/lookup.ts` et l'exporter. Ajouter à `src/domain/phonetics/rhyme.ts` :
  - `GenderSchema` : `any`, `masculine`, `feminine`, `alternate` ;
  - `rhymeGender(form, phonemes)` ;
  - `splitRhyme(rhyme)`, qui donne `{ vowel, coda }`.

  Vérifier par les tests de phonétique :
  - rose, roses et chantent sont féminins ;
  - vert, souvent et été sont masculins ;
  - /ɛʁ/, /ɔ̃/ et /ɔz/ se découpent correctement.

## 2. Fondations des schémas (vague 0)

- [x] 2.1 [domain] Ajouter `lineStart` à `VersePlace` dans `src/domain/verse.ts`. Vérifier le scénario « Article initial » dans les tests de `verse`.
- [x] 2.2 [domain] Créer `src/domain/rhyme/scheme.ts` avec `SchemeSchema` (`plates`, `croisees`, `embrassees`, `etreinte`, `bisexuelle`) et `lettersFor(scheme, stanzaLength)`. Vérifier les lettres de chaque schéma sur des strophes de 3, 4, 5 et 6 vers, dont « Strophe de cinq vers » et « Six vers en rimes croisées ».
- [x] 2.3 [domain] Extraire la pré-passe de l'antirime en `planByVerse` dans `src/domain/rhyme/engine.ts`, puis réécrire `antirhyme.ts` avec ce helper. Vérifier que les tests de l'antirime passent sans changement. **Geler la signature.**

## 3. Monorime à genre (vague 1)

- [x] 3.1 [domain] Ajouter le paramètre `gender` au monorime (`src/domain/rhyme/monorhyme.ts`), en mode alterné par strophe. Vérifier les scénarios « Monorime en /ɔ̃/ » et « Sonnet monorime alterné ».

## 4. Schéma de rimes (vague 1)

- [x] 4.1 [domain] Créer `src/domain/rhyme/rhyme-scheme.ts` : la contrainte `rhyme-scheme`. Ses paramètres sont le schéma, la richesse (reprise de `RICHNESS_OPTIONS`) et le genre (`any` ou `alternate`). Elle s'appuie sur `planByVerse` et `lettersFor`.
- [x] 4.2 [domain] Vérifier les scénarios avec le port phonétique factice :
  - « Rimes embrassées » ;
  - « Aucun voisin qui rime » ;
  - « Mot verrouillé » ;
  - « Tercet » (rime bisexuelle) ;
  - « Quatrain alterné ».

## 5. Antérime (vague 1)

- [x] 5.1 [domain] Créer `src/domain/rhyme/anterhyme.ts` sur les `lineStart`, par paires de vers. Vérifier le scénario « Distique ».

## 6. Rime berrychonne (vague 1)

- [x] 6.1 [domain] Créer `src/domain/rhyme/berrychonne.ts` avec `splitRhyme`. Les deux combinaisons sont essayées dans l'ordre du dictionnaire. Vérifier le scénario « Tercet en /aʁ/ et /ɔl/ ».

## 7. Proposition des refrains (vague 1, sans code)

- [x] 7.1 Écrire `openspec/changes/refrains/`, avec une proposition et une conception pour le rondel et la villanelle. Elles doivent trancher comment une contrainte qui duplique des vers entre dans `runChain` et `fold` : une étape de remise en page en fin de chaîne, ou une autre voie. Si la question reste sans réponse, le dire, et la tranche tombe.

## 8. Rack et inspecteur (vague 2)

- [x] 8.1 [ui] Enregistrer le schéma de rimes, l'antérime et la rime berrychonne dans `installedPlugins` (`src/ui/tracks/mixer-state.ts`). Vérifier qu'ils apparaissent dans le rack.
- [x] 8.2 [ui] Faire montrer à l'inspecteur le genre de la rime et, sous un schéma actif, la lettre du vers. Les fichiers touchés sont `view-model.ts`, `components/inspector.ts` et `app.ts`. Vérifier les scénarios « Mot connu » et « Lettre du schéma ».
- [x] 8.3 [ui] Test GUI, automatique si un harnais est disponible, sinon en recette manuelle :
  1. coller un quatrain ;
  2. ajouter « Schéma de rimes » et choisir « embrassées » ;
  3. vérifier que les fins des vers 1 et 4 riment, et celles des vers 2 et 3 aussi ;
  4. cliquer la dernière fin ;
  5. vérifier que l'inspecteur affiche « A », une rime entre barres obliques et un genre.

## 9. Clôture (vague 3)

- [x] 9.1 Mettre à jour `docs/plugins.md` et le `README.md`. Vérifier en relisant que les trois filtres et le réglage de genre y sont décrits.
- [x] 9.2 Lancer `npm test` et vérifier que la couverture dépasse 90 %. Relire à la main 3 poèmes de 3 strophes passés aux rimes embrassées, et noter dans `RESULTATS.md` combien de fins de vers sur 10 suivent leur lettre.
