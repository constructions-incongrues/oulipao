# Tâches

Ordre de construction :

1. le domaine (groupes 1 et 2), en parallèle ;
2. l'état de la table (groupe 3) ;
3. la page (groupe 4) ;
4. la clôture (groupe 5).

La chaîne (`runChain`, `fold`) ne change pas.

## 1. Schémas des formes à refrain

- [x] 1.1 [domain] Ajouter `rondel` et `villanelle` à `SchemeSchema` et à `SCHEME_LABELS` dans `src/domain/rhyme/scheme.ts`. `lettersFor` rend :
  - pour le rondel, ABBAABABBA sur les 10 premiers vers ;
  - pour la villanelle, ABAABABABABAB sur les 13 premiers vers ;
  - pour les vers suivants, `null` (sans lettre).

  Vérifier par `test/domain/rhyme/scheme.test.ts` : « Dix vers en schéma rondel », treize vers en villanelle et une strophe plus longue.
- [x] 1.2 [domain] Vérifier par `test/domain/rhyme/rhyme-scheme.test.ts`, avec le port factice, que le schéma « rondel » sur dix vers ne laisse que deux rimes, ou la raison d'un vers sans voisin.

## 2. Mise en forme

- [x] 2.1 [domain] Créer `src/domain/forms/form.ts` :
  - `FormSchema` (zod : `none`, `rondel`, `villanelle`) ;
  - pour chaque forme, ses strophes et ses places de refrain (rondel 4/4/5 : 7 et 8 recopient 1 et 2, 13 recopie 1 ; villanelle 3×5 + 4 : 6, 12 et 18 recopient 1, 9, 15 et 19 recopient 3).

  Le module est pur, sans port. Vérifier par `test/domain/forms/form.test.ts` que les places correspondent aux scénarios « Dix vers » et « Treize vers ».
- [x] 2.2 [domain] Écrire `layoutForm(segments, form)` : il reçoit les morceaux du texte mixé (`MixedSegment`) et rend :
  - les morceaux mis en forme ;
  - le nombre de vers manquants.

  Comportement attendu :
  - les vers de l'auteur sont pris dans l'ordre, et ses sauts de strophe sont ignorés ;
  - un mot recopié garde l'`index` de son mot d'origine et porte `copyOf` (le numéro du vers qu'il recopie) ;
  - la forme s'arrête au dernier vers fourni ;
  - les vers en trop suivent dans une strophe à part ;
  - avec `none`, les morceaux sont rendus tels quels.

  Ajouter `copyOf?: number` à `MixedSegment` (`src/domain/mixing.ts`). Vérifier les scénarios « Aucune forme », « Dix vers », « Treize vers », « Six vers en rondel » et « Douze vers en rondel ».

## 3. État de la table

- [x] 3.1 [ui] Ajouter `form` (défaut `none`) à `MixerStateSchema` et l'action `set-form`, validée par `FormSchema`, dans `src/ui/tracks/types.ts` et `mixer-state.ts`. Vérifier par `test/ui/tracks/mixer-state.test.ts` : la forme par défaut, le changement de forme et le refus d'une forme inconnue.
- [x] 3.2 [ui] Dans `buildView` (`src/ui/tracks/view-model.ts`), appliquer `layoutForm` aux morceaux mixés après `runChain`. Le texte résultant, les syllabes par vers et le résumé en découlent. Le résumé dit combien de vers manquent. Vérifier par les tests de `view-model` :
  - « Schéma puis rondel » : le schéma lettre les dix vers de l'auteur, et les étapes de l'inspecteur restent alignées sur le texte d'origine ;
  - « Octosyllabes » : chaque vers recopié montre son compte de syllabes.

## 4. Page

- [x] 4.1 [ui] Ajouter un choix de forme (aucune, rondel, villanelle) près du texte résultant. C'est un `<select>` étiqueté, selon `DESIGN.md`. Vérifier par un test de rendu : le choix déclenche `set-form`, et le texte résultant change.
- [x] 4.2 [ui] Dans `components/result.ts`, marquer chaque vers recopié comme copie du vers N. La marque est visible, et donnée aux lecteurs d'écran par un texte masqué. Cliquer un mot recopié sélectionne son mot d'origine. Vérifier le scénario « Clic sur un refrain » par un test de rendu.
- [x] 4.3 [ui] Vérifier que le bouton de copie colle les treize vers en trois strophes, sans marque de copie (scénario « Copie d'un rondel »), par un test du contrôleur.
- [x] 4.4 [ui] Recette dans le navigateur, automatique si un harnais est disponible :
  1. coller dix vers ;
  2. ajouter « Schéma de rimes » en « rondel » ;
  3. choisir la forme « rondel » ;
  4. vérifier que le texte compte treize vers en strophes de 4, 4 et 5, et que les vers 7, 8 et 13 sont marqués comme copies ;
  5. cliquer un mot du vers 7 et vérifier que l'inspecteur s'ouvre sur le vers 1 ;
  6. vérifier qu'aucune erreur n'apparaît en console et qu'à 375 px, la page ne défile pas à l'horizontale.

## 5. Clôture

- [x] 5.1 Mettre à jour `docs/plugins.md` (les formes, hors de la chaîne) et `docs/tracks.md` (le choix de forme). Vérifier par relecture que la limite « aucun filtre après la forme » y est écrite.
- [x] 5.2 Lancer `npm test` (couverture au-dessus de 90 %) et `npm run typecheck`, puis noter dans `RESULTATS.md` un rondel et une villanelle faits dans le navigateur à partir d'un texte réel.
