# Tasks

Plan de construction. La vague 0 se fait en parallèle (1, 2, 3). La vague 1 démarre une fois la vague 0 fusionnée (4, 5, 6). La vague 2 vient en dernier (7).

## 1. Contrats de la voix et des préférences (vague 0, ports)

- [x] 1.1 [ports] Créer `src/ports/speech.ts` (`voices()`, `speak(words, { rate, voice })` → `Promise<void>`, `cancel()`) et une voix factice dans `test/` qui enregistre les mots dits et se résout à la demande ; vérifier par un test que la voix factice rend les mots dans l'ordre et que `cancel()` résout la promesse en vol.
- [x] 1.2 [ports] Créer `src/ports/monitoring-preferences.ts` : `MonitoringPreferencesSchema` zod (`rate`, `gap`, `voice?`, bornes, valeurs par défaut), type déduit, port `load()`/`save()` et la conversion d'un tempo unique en `rate` et `gap` ; vérifier par des tests que le schéma refuse une valeur hors bornes et que le tempo par défaut donne les valeurs par défaut.

## 2. Ce que dit un pas (vague 0, domain)

- [x] 2.1 [domain] Créer `src/domain/monitoring.ts` avec `wordsAtStep(segments, index)` : les mots des segments de cet index sans `copyOf`, sans ponctuation ; vide si le pas ne s'entend pas ; vérifier par des tests un remplacement en trois mots, un mot retiré, une piste muette, une piste en solo, un pas bouché (son mot inchangé) et un refrain (dit une seule fois), couverture au-dessus de 90 %.

## 3. Marque du pas joué (vague 0, ui)

- [x] 3.1 [ui] Ajouter à `StepGrid` (`src/ui/tracks/components/step-grid.ts`) la prop optionnelle `playing?: number` : `aria-current="step"` sur la colonne jouée et numéro d'en-tête au style « touche enfoncée » (fond d'encre, texte couleur façade), CSS dans `tracks.html` selon `DESIGN.md`, sans lueur ni transition ; vérifier par un test de rendu qu'une seule colonne porte `aria-current` et qu'aucune ne le porte sans `playing`.

## 4. Voix du navigateur (vague 1, adapters)

- [x] 4.1 [adapters] Créer `src/adapters/speech/speech-synthesis.ts` sur un `speechSynthesis` injecté : voix dont `lang` commence par `fr`, rechargement sur `voiceschanged`, une `SpeechSynthesisUtterance` par mot, promesse résolue sur `end`, `error` ou `cancel()` ; vérifier par des tests avec un faux `speechSynthesis` le filtre des langues, l'ordre des mots, la résolution après `cancel()` et le rechargement des voix.

## 5. Préférences gardées (vague 1, adapters)

- [x] 5.1 [adapters] Créer `src/adapters/storage/local-storage-preferences.ts` (clé `oulipao.monitoring`) sur le modèle de `local-storage-notebook.ts`, avec validation zod à la lecture ; vérifier par des tests l'aller-retour, une valeur illisible et un stockage qui lève une exception (dans les deux cas, les valeurs par défaut s'appliquent).

## 6. Transport dans le contrôleur (vague 1, ui)

- [x] 6.1 [ui] Étendre `TracksState` et `TracksDependencies` (`src/ui/tracks/controller.ts`) avec `playing`, `playhead`, `listened`, les préférences, les voix, `speech`, `preferences` et un `sleep` injectable ; ajouter `play()`, `stop()`, `toggle()` et `setTempo()`/`setVoice()`, qui enregistrent les préférences ; vérifier par des tests que la lecture est arrêtée par défaut et que `toggle()` alterne.
- [x] 6.2 [ui] Écrire la boucle de lecture : à chaque pas, lire l'état courant, `wordsAtStep` sur la vue, `speak` ou `sleep(gap)` si le pas est muet, puis avancer dans les bornes de la page visible et boucler ; un jeton de lecture invalide les promesses en vol ; changer de page ou redimensionner ramène la tête au premier pas de la page ; vérifier par des tests avec la voix factice la boucle sur 8 pas, la reprise sur une nouvelle page, un réglage changé en cours de lecture entendu au pas suivant sans retour au début, et un tempo appliqué au pas suivant.
- [x] 6.3 [ui] Arrêter la lecture et remettre `listened` à faux dans `run()` et `reopen()` ; passer `listened` à vrai au lancement ; vérifier par des tests qu'aucune parole n'est émise après l'arrêt.
- [x] 6.4 [ui] Ajouter le drapeau `listened` à `ruleMention` (`src/ui/tracks/view-model.ts`) et le passer depuis la copie et `keep()` ; vérifier par des tests « — … · réglé en écoutant (Oulipao) », « — réglé en écoutant (Oulipao) » sans règle, l'absence de la mention sans écoute, sa disparition après une remise en pistes, et une mention identique entre la copie et le carnet ; `npm test` passe avec une couverture au-dessus de 90 %.

## 7. Transport à l'écran et branchements (vague 2, ui)

- [x] 7.1 [ui] Créer `src/ui/tracks/components/transport.ts` : bouton lecture/arrêt (`aria-pressed`), réglage du tempo, liste des voix françaises, état désactivé avec un message quand il n'y a aucune voix française, style des touches et des champs de paramètre de `DESIGN.md` ; vérifier par des tests de rendu chacun de ces états.
- [x] 7.2 [ui] Brancher dans `app.ts` le transport et `playing={state.playhead}` vers `StepGrid` ; vérifier par un test de l'app que la marque suit la tête.
- [x] 7.3 [ui] Dans `main.ts` : la barre d'espace appelle `toggle()` partout hors des champs, y compris sur un bouton focalisé, sans l'activer ; `visibilitychange` (masqué) et `pagehide` appellent `stop()` ; injecter l'adaptateur `speechSynthesis` et celui des préférences ; vérifier par des tests de `shortcut(' ', …)` et une recette dans le navigateur : lancer à l'espace sur la touche « Muet » des noms sans la rendre muette, entendre un S+7 changé en cours de lecture, changer d'onglet et constater l'arrêt.
- [x] 7.4 Recette d'ensemble dans le navigateur : garder un texte après une écoute et vérifier dans l'export du carnet la mention « réglé en écoutant » ; navigateur sans voix française simulée : bouton désactivé et message ; `npm test` passe avec une couverture au-dessus de 90 %.
