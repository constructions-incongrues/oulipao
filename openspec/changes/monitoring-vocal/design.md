# Design

## Context

Voir `proposal.md` pour le pourquoi et `specs/monitoring-vocal/spec.md` pour les exigences.

L'état observé dans le code :

- **La vue calcule déjà ce qui s'entend.** `TracksView.segments` (`src/ui/tracks/view-model.ts`) vient de `mixSegments` (`src/domain/mixing.ts`). Il ne garde que les mots des pistes audibles. Chaque mot y porte l'`index` de son mot d'origine, et un remplacement en plusieurs mots partage le même `index`. Les mots retirés n'y sont pas. Les vers recopiés par un refrain y reviennent avec `copyOf`.
- **La tête de lecture actuelle (`div.head`) est une animation décorative.** Elle est `aria-hidden` et rejouée à chaque `generation` : c'est le « moment signé » de `DESIGN.md`. Elle n'a aucun état de pas courant.
- **`controller.shortcut()` ne connaît que ←, → et Échap**, et `main.ts` lui passe chaque touche avec `inField`. Il n'existe ni écouteur `visibilitychange` ni `pagehide`.
- **Rien n'est encore gardé dans le navigateur, hormis le carnet** (`oulipao.notebook`). Le thème, lui, n'est pas gardé.
- **`ruleMention` rend `\n\n— {parts} (Oulipao)` ou une chaîne vide.** `keep()` et la copie l'utilisent tous les deux.

## Goals / Non-Goals

**Goals :**
- Une lecture qui suit l'état courant pas à pas, sans jamais redémarrer la boucle quand un réglage change.
- Toute la logique testable sous Node avec une voix factice. L'adaptateur navigateur reste mince.

**Non-Goals :**
- Le rythme exact : la latence de `speechSynthesis` (100 à 300 ms par énoncé) est acceptée.
- L'écoute hors de la console.
- Un ordonnanceur générique réutilisable.

## Decisions

### Port `Speech` (couche ports), adaptateur `speechSynthesis` (couche adapters)
`src/ports/speech.ts` expose trois choses :
- `voices()`, qui rend les voix françaises (`{ id, name }`) ;
- `speak(words, { rate, voice })`, qui rend une promesse résolue quand le dernier mot est dit ou que la parole est coupée ;
- `cancel()`.

L'adaptateur `src/adapters/speech/speech-synthesis.ts` dépend seulement de l'objet `speechSynthesis` qu'on lui injecte. Il :
- filtre les voix dont `lang` commence par `fr` ;
- recharge la liste sur `voiceschanged` (Chrome la remplit en retard) ;
- dit chaque mot dans un `SpeechSynthesisUtterance` séparé ;
- résout la promesse sur `end` ou `error`.

Les alternatives : une seule `utterance` par pas, ou par phrase. Je les écarte, parce que le pas à pas haché est voulu et que la coupure doit tomber entre deux mots.

### `wordsAtStep` (couche domain), pure
`src/domain/monitoring.ts` prend les `MixedSegment[]` et un index, et rend les mots dits à ce pas. Ce sont les segments de cet `index` sans `copyOf`, découpés en mots et débarrassés de la ponctuation. Le résultat est vide si rien ne s'entend.

Elle s'appuie sur `segments` plutôt que de recalculer l'audibilité : `mixSegments` applique déjà mute, solo et retrait. Un pas bouché y figure avec son mot inchangé, et il est donc dit, ce qui est conforme à la spec. Cette fonction ne dépend d'aucun port.

### Préférences (ports et adapters)
Un schéma zod `MonitoringPreferencesSchema` `{ tempo, voice? }` (le tempo de 1 à 5, converti en vitesse et blanc par `tempoTiming`) vit dans le port `src/ports/monitoring-preferences.ts`, avec ses bornes et ses valeurs par défaut. Le port a deux opérations, `load()` et `save()`.

L'adaptateur `src/adapters/storage/local-storage-preferences.ts` utilise la clé `oulipao.monitoring` et valide à la lecture. Une valeur invalide ou absente donne les valeurs par défaut. On reprend le modèle de `local-storage-notebook.ts`.

Le tempo de l'interface est **un seul réglage**, qui fixe à la fois `rate` et `gap` (par exemple de 1 à 5) : un bouton, pas deux. L'alternative, deux champs, est écartée parce qu'elle fait plus de réglages pour le même geste.

### Ordonnancement dans le contrôleur (couche ui)
`TracksState` reçoit :
- `playing` ;
- `playhead` (l'index du pas courant, ou rien) ;
- `listened` (la lecture a tourné depuis la dernière mise en pistes ou réouverture) ;
- les préférences ;
- la liste des voix.

`TracksDependencies` reçoit `speech` et `preferences`.

La boucle est **asynchrone et sans minuterie**. Pour chaque pas :
1. elle lit l'état courant ;
2. elle calcule `wordsAtStep` sur la vue courante ;
3. elle attend la promesse de `speak` (ou `gap` si le pas est muet) ;
4. elle avance dans les bornes de la page visible : `page * perPage`, jusqu'à `min(page * perPage + perPage, nombre de pas)`.

Un jeton de lecture, incrémenté à chaque arrêt, rend caduques les promesses en vol : la boucle sort dès que son jeton n'est plus le jeton courant. Changer de page ou redimensionner place la tête au premier pas de la page. `run()` et `reopen()` arrêtent la lecture et remettent `listened` à faux. L'injection du temps (`sleep`) permet de tester sans attendre.

L'alternative, `setInterval` à tempo fixe, est écartée : elle chevaucherait les énoncés, dont la durée varie.

### Mention (couche ui)
`ruleMention` reçoit un drapeau `listened`. Quand il est vrai, elle ajoute `réglé en écoutant` comme dernière partie : `— … · réglé en écoutant (Oulipao)`, ou `— réglé en écoutant (Oulipao)` s'il n'y a aucune autre partie. La copie et `keep()` passent `state.listened`, ce qui garde la mention identique dans les deux cas, comme l'exige `carnet-de-textes-gardes`.

### Pas joué (couche ui)
`StepGrid` reçoit une prop optionnelle `playing?: number`. La colonne jouée reçoit `aria-current="step"` et, sur son numéro d'en-tête, le style d'une touche enfoncée : fond d'encre, texte couleur façade. C'est l'état « enfoncé » de `DESIGN.md`, sans lueur ni couleur d'accent. La marque saute de pas en pas sans transition.

L'animation de balayage reste inchangée, puisqu'elle signe le recalcul du texte. Si elle gêne pendant la lecture, on la retirera dans une autre tâche.

### Transport et branchements (couche ui)
`components/transport.ts` contient :
- le bouton lecture/arrêt, avec `aria-pressed` ;
- le tempo ;
- le choix de la voix ;
- le message quand il n'y a aucune voix française.

`main.ts` :
- passe l'espace à `controller.shortcut` même sur un bouton, avec un `preventDefault` qui empêche le clic natif ;
- écoute `visibilitychange` (onglet masqué) et `pagehide`, qui appellent `stop()` ;
- injecte `speechSynthesis` et `localStorage`.

## Risks / Trade-offs

- **Les navigateurs se comportent différemment avec la synthèse vocale.** Safari peut ne pas émettre `end` après un `cancel()`. → L'adaptateur résout aussi la promesse sur `cancel()`, et le jeton de lecture protège la boucle.
- **La liste des voix est vide au premier rendu dans Chrome.** → Elle se recharge sur `voiceschanged`. Le message « aucune voix française » n'apparaît que lorsque la liste est chargée et ne contient aucune voix française.
- **La barre d'espace détournée sur un bouton surprend un utilisateur au clavier.** → C'est la décision du fondateur (convention des DAW). Entrée active toujours le bouton.
- **Le balayage rejoue à chaque réglage pendant la lecture**, et peut se confondre avec la marque du pas joué. → On le verra à l'usage, sans changement prévu ici.

## Open Questions

- La valeur par défaut du tempo et ses bornes, à régler à l'oreille pendant l'implémentation. Elles ne changent ni la spec ni le découpage.
