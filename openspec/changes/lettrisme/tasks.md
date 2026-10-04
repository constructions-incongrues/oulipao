# Tasks

Plan de construction :
- **Vague 0**, en parallèle : 1, 2 et 3.
- **Vague 1**, en parallèle, après la fusion de la vague 0 : 4 et 5.
- **Vague 2** : 6, après la Ciselure et après le test des onomatopées du fondateur.

## 1. Source de la voix dans les préférences (vague 0, ports)

- [x] 1.1 [ports] Ajouter `source: 'result' | 'original'` (défaut `'result'`) à `MonitoringPreferencesSchema` dans `src/ports/monitoring-preferences.ts` ; vérifier par des tests qu'une préférence ancienne, sans `source`, se lit avec la valeur par défaut, qu'une valeur inconnue revient au défaut, et que l'adaptateur `localStorage` fait l'aller-retour du champ.

## 2. Mots d'origine d'un pas (vague 0, domain)

- [x] 2.1 [domain] Ajouter `originalWordsAtStep` à `src/domain/monitoring.ts` : le mot d'origine du pas, sans ponctuation, s'il est sur une piste audible, sinon rien ; vérifier par des tests une piste audible, une piste muette, une autre piste en solo et un mot entouré de ponctuation.

## 3. Alignement lettres ↔ sons (vague 0, domain)

- [x] 3.1 [domain] Exposer `alignLetters(word)` dans `src/domain/phonetics/fallback.ts` (à côté de sa table, pour éviter un import circulaire) : les intervalles de lettres et leurs phonèmes, que `guessPhonemes` réutilise désormais ; vérifier par des tests « garçon » (ç → /s/), « temps » (s final muet), « photo » (ph → /f/), « qui » (qu → /k/), et que les tests de `guessReading` et des rimes passent sans modification.

## 4. Moteur Ciselure (vague 1, domain)

- [x] 4.1 [domain] Créer `src/domain/chisel/tiers.ts` (`firstWrittenSyllable`, `vowelsOf`, `initialOf`, `BREATH`) ; vérifier par des tests « vieux » → « vieu », « ieu », « v » ; « chat » → « cha » ; « dort » → « dor », et la casse conservée.
- [x] 4.2 [domain] Créer `src/domain/chisel/plugin.ts` (non ciblable ; `final` de 1 à 5, `perTier` de 1 à 9 ; premier vers intact ; palier `min(final, ceil(n / perTier))` ; palier 1 qui retire la piste « autres » ; pas bouché marqué `CLOSED` ; texte d'un seul vers inchangé, avec une aide qui invite à une Mise en vers) et l'inscrire dans `src/domain/registry.ts` ; vérifier par des tests les scénarios de la spec `ciselure` (descente, palier final, deux vers par palier, pas bouché, prose).
- [x] 4.3 Ajouter la Ciselure à `docs/plugins.md` et à `.nanopm/wiki/docs/catalogue-contraintes.md` ; vérifier que `npm test` passe avec une couverture au-dessus de 90 %.

## 5. Discrépance (vague 1, ui)

- [x] 5.1 [ui] Dans `src/ui/tracks/listening-controller.ts`, lire `state.source` à chaque pas, dire les mots de `originalWordsAtStep` en « original », et ajouter `setSource`, qui enregistre la préférence ; vérifier par des tests avec la voix factice qu'en « original » le pas dit « chat » quand la page montre le nom remplacé, qu'une piste muette se tait, et qu'un changement de source s'entend au pas suivant.
- [x] 5.2 [ui] Ajouter `discrepant` à `TracksState` (`controller.ts`), mis à vrai au lancement en « original » et remis à zéro avec `listened` ; étendre `withListening` (`view-model.ts`) avec « écouté en discrépance » ; vérifier par des tests les quatre scénarios de la mention dans la spec `monitoring-vocal`.
- [x] 5.3 [ui] Ajouter au transport (`components/transport.ts`) le choix « La voix dit : le résultat / l'original » et le brancher dans `app.ts` ; vérifier par un test de rendu, puis dans le navigateur : choisir « l'original » avec un S+7, entendre le mot d'origine et voir le mot remplacé.

## 6. Moteur Alphabet augmenté (vague 2, domain)

- [x] 6.1 Porte : le fondateur fait le test des onomatopées dans la voix (`hh`, `tk`, `tss`, `fff`) et tranche la notation dans un mot, collée ou séparée ; reporter la table retenue dans `design.md`.
- [x] 6.2 [domain] Créer `src/domain/body-alphabet/plugin.ts` (`replace` parmi `punctuation`, `sounds` et `both` ; la ponctuation dans les blancs ; /s/, /f/ et /k/ par `alignLetters` ; lettres muettes gardées ; pas bouché marqué `CLOSED`) et l'inscrire dans `registry.ts` ; vérifier par des tests les scénarios de la spec `alphabet-augmente`.
- [x] 6.3 Ajouter l'Alphabet augmenté à `docs/plugins.md` et au catalogue, puis faire une recette dans le navigateur : un S+7, puis une Mise en vers, une Ciselure et un Alphabet augmenté, écoutés en discrépance ; `npm test` passe avec une couverture au-dessus de 90 %.
