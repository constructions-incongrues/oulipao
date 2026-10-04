# Design

## Context

Voir `proposal.md` pour les motivations, et le delta de `generations-de-textes` pour le comportement attendu.

Ce qui existe, dans `src/ui/tracks/controller.ts` :
- **`nextGeneration(keepChain)`** (l. 347) garde le texte en cours, ou reprend `lastKept`. Il calcule la filiation suivante, pose le résultat dans la saisie, puis appelle `tagInto`.
- **`tagInto` / `tagAs`** (l. 315-340) font, dans l'ordre :
  - arrêter l'écoute (`controller.stop()`) ;
  - étiqueter (`tagText(dependencies.tagger, text)`) ;
  - remplacer `session` ;
  - appliquer `reset-steps` à la table ;
  - reconstruire la vue (`buildView`) ;
  - réécrire tout l'état (`view`, `mixer`, `lineage`, `unsaved`, `generation`…).

Le seul morceau réutilisable tel quel pour un tour est donc l'étiquetage suivi de `buildView`. Le reste écrase l'état du tour 1.

L'étiqueteur (Transformers.js, WASM) tourne sur le fil principal : il n'y a aucun `new Worker` dans `src`. Une mise en pistes de 533 mots prend environ 5,5 s, mais on ne sait pas combien de ce temps bloque le fil.

## Goals / Non-Goals

**Goals:**
- Calculer un tour sans toucher à l'état visible du contrôleur.
- Garder les tours en mémoire, pour que le curseur ne recalcule rien.
- Trancher par une mesure, et non par un pari, la question du curseur pendant le calcul.

**Non-Goals:**
- Déplacer l'étiqueteur dans un Web Worker. Si la mesure le réclame, ce sera un autre change.
- Montrer un tour k ≥ 2 avec ses marques mot à mot, ses pistes ou sa grille.
- Montrer la généalogie depuis un autre tour que 0, ou enchaîner les tours à l'écoute.
- Stocker la boucle au carnet, ou la restaurer.

## Decisions

### 0. Mesurer d'abord (tâche 1)

Avant le reste, on mesure sur la prévisualisation, avec l'exemple de 533 mots, la plus longue tâche du fil principal pendant une mise en pistes (`PerformanceObserver` sur `longtask`). Le résultat est noté dans ce fichier.
- **Branche A, plus longue tâche ≤ 200 ms :** le curseur suit les tours au fur et à mesure (exigence « Avancement des tours », au plus tôt).
- **Branche B, plus longue tâche > 200 ms :** les tours sont calculés derrière l'avancement, avec « Arrêter » consulté entre deux tours, et le curseur n'apparaît qu'à la fin (même exigence, au plus tard).

La spec couvre les deux branches. Seules la tâche 4.2 et la vérification changent selon la branche.

**Mesure du 2026-10-04 (tâche 1.1).**
- **Protocole :** prévisualisation locale, exemple de 118 mots, un « Itérer », soit le coût exact d'un tour, observé avec `PerformanceObserver` sur `longtask`.
- **Résultat :** une seule tâche longue de **810 ms** sur 812 ms au total. L'étiquetage bloque donc le fil principal d'un seul tenant. Par extrapolation linéaire, cela donne environ 3,7 s pour 533 mots.
- **Branche retenue : B.**
- **Ce que la branche B fait concrètement :**
  - Le calcul rend la main d'une image entre deux tours. L'avancement se peint, et un clic sur « Arrêter la boucle » est pris en compte entre deux tours.
  - Chaque tour est publié dès qu'il est prêt. C'est sans coût supplémentaire, puisque la main est rendue de toute façon, et cela respecte « au plus tard à la fin » de la spec.
  - Pendant l'étiquetage d'un tour, l'interface reste figée. L'entrée « Étiqueteur dans un Web Worker » de `TODOS.md` s'applique.

*Alternative écartée :* le worker d'emblée. C'est un chantier qui touche toute l'application, pour un geste dont on ne sait pas encore s'il sera joué.

### 1. Un tour sans effet de bord : `computeTour` (couche ui)

`src/ui/tracks/loop.ts` exporte :

```ts
computeTour(previous: TourText, mixer: MixerState, deps): Promise<Tour>
```

Il étiquette le texte affiché du tour précédent avec `tagText(deps.tagger, …)`, applique `reset-steps` et appelle `buildView`. Il rend `{ text, session, mixer, view }`, sans rien écrire dans l'état du contrôleur.

`tagAs` est réécrit pour appeler la même suite (étiquetage, `reset-steps`, `buildView`), puis écrire l'état. « Itérer » et la boucle partagent ainsi une seule définition du tour.

**Ports :** `Tagger` (déjà injecté dans `dependencies.tagger`), plus la morphologie, les verbes, la phonétique et les échelles déjà chargés, passés en paramètres comme à `buildView`.

### 2. Le point fixe : `findRepeat` (couche domain)

`src/domain/loop.ts` exporte :

```ts
findRepeat(texts: readonly string[]): { from: number; length: number } | undefined
```

La fonction compare le dernier texte aux précédents, à partir de l'indice 1, caractère pour caractère. Elle est pure, sans port, et se teste seule. `length === 1` signifie un point fixe.

### 3. L'état de la boucle dans le contrôleur

```ts
loop?: {
  tours: Tour[],
  shown: number,
  target: number,
  computing: boolean,
  repeat?: Repeat,
  firstKept: string,
}
```

- `tours[0]` est le texte d'origine et `tours[1]` le résultat en cours.
- `loop()` appelle d'abord la garde de `nextGeneration`, extraite en `ensureKept()`, pour obtenir `firstKept`, puis enchaîne les `computeTour`.
- Un numéro d'essai, comme `runs`, invalide un calcul quand la boucle est abandonnée. Toute action listée dans l'exigence « Abandon » remet `loop` à `undefined` et incrémente ce numéro.
- `controller.stop()` n'est pas appelé par un tour. L'écoute ne s'arrête qu'à l'abandon.

### 4. Garder un tour

`keep()` reçoit le tour montré. Pour k ≥ 2, il construit l'entrée :
- source : `tours[k-1].session` ;
- résultat : `tours[k].text` ;
- table : la table de la boucle ;
- filiation :
  - parent : `firstKept` ;
  - ancêtre : `lineage?.ancestor ?? tours[0].text` ;
  - passes : `[...lineage?.passes ?? [], ...Array(k-1).fill(pass)]`.

- marqueur : `loop: { tours, shown }`, champ optionnel de `NotebookEntrySchema` (zod, `.optional().catch(undefined)`), pour que l'export distingue une prise de boucle de k « Itérer » (revue de portée, D6). L'export reste en version 1.

`composeMention` en tire déjà « ×k ».

*Alternative écartée :* garder les tours 1 à k−1 pour que le texte du parent reste la source de l'entrée. Le fondateur l'a écartée le 2026-10-04, parce que le carnet recevrait k entrées pour une seule prise.

### 5. Le papier (couche ui)

`components/result.ts` reçoit `shownTour?: { index, segments, count, repeat }`. Pour un tour k ≥ 2, les segments et les `marks` sont ceux de la vue du tour k : la chaîne y marque déjà les mots qu'elle a remplacés par rapport au tour k−1, avec leur piste. Ils reçoivent le soulignement de 2 px de leur piste, comme au tour 1, sans aucun alignement (revue d'ingénierie, D1). Les mots du tour 0 et des tours k ≥ 2 ne sont pas des boutons : un seul gestionnaire de clic sur `result-text` ouvre le mot choisi du tour 0 dans l'inspecteur, sans arrêt de tabulation par mot.

Le curseur de tours est un composant `TourCursor` (couche ui, sans port), décrit dans « Interface » plus bas.

### 6. Le dé relancé : reporté

Reporté par la revue de portée du 2026-10-04 (D3 CEO, entrée dans `TODOS.md`). Dans la v1, le dé retombe à l'identique à chaque tour, comme avec « Itérer ».

### 7. La généalogie : `alignTour` (couche domain) et la lignée (couche ui)

Le résultat du tour k−1 est une suite de segments (texte, indice du mot d'origine). Le tour k étiquette ce texte. `tagText` garantit que ses mots sont exactement les jetons de `tokenize` (`tagging.ts:12-27`), avec leurs positions. `alignTour(segments, tagged)` s'appuie sur `ownersOf`, l'attribution mot à mot extraite de `reread` (`plugin-chain.ts:94-104`, revue d'ingénierie, D1) : chaque mot de la source du tour k appartient au segment du tour k−1 qui le contient. Il rend, pour chaque mot d'origine du tour k−1, l'indice de son premier descendant dans la source du tour k, ou rien s'il a été retiré.

La lignée d'un mot du tour 0 s'obtient en composant ces correspondances, tour après tour. Elle est calculée en même temps que chaque tour et gardée dans `Tour`, pour que le survol ne calcule rien.

L'affichage : la lignée s'affiche dans l'inspecteur (`components/inspector.ts`), sur une ligne LIGNÉE ajoutée sous la prononciation, en `aria-live="polite"`. Un mot du tour 0 s'y ouvre par un clic ou un toucher sur le papier, ou depuis l'en-tête de la grille comme aujourd'hui. *Alternative écartée (revue de design D19) :* `title` et `aria-description` au survol, qui ne s'ouvrent pas au doigt et sont mal lus par les lecteurs d'écran.

*Alternative écartée :* retrouver les mots par comparaison de chaînes. Un mot répété dans le texte rendrait la lignée ambiguë.

### 8. L'écoute d'un tour (couche ui)

`listening-controller.ts` lit aujourd'hui les mots d'un pas de la grille (`wordsAtStep`). Quand le curseur montre un tour autre que 1, il lit à la place `tokenize(tour.text)` avec un indice de mot propre, sans marquer de pas. Le mot dit est marqué sur le papier (classe `spoken` : fond `{colors.text}`, texte `{colors.paper}`), et la bande collée défile pour le garder visible.

Changer de tour garde cet indice, et le ramène à 0 s'il dépasse la longueur du nouveau tour. Le drapeau `listened` est levé comme aujourd'hui.

## Interface

*Ajouté par la revue de design du 2026-10-04 (`/plan-design-review`, décisions D4 à D21).*

### Ordre de lecture de la bande

```
┌ TEXTE RÉSULTANT  [Copier] [Garder le tour 5] [Itérer] [Boucler] [Figer]   message   Forme ▾ ┐  ← en-tête : seul Boucler s'ajoute
│                                                                                              │
│  Le livret de la table…   (Spectral 22 px, mots changés soulignés 2 px couleur de piste)     │  ← 1. le texte du tour montré
│                                                                                              │
├ BOUCLE  ○─●─●─●─●─◉─○─○   tour 5 / 8   cycle de 2 à partir du tour 3                         │  ← 2. le curseur et son état
│                           [Arrêter la boucle]              tours [ 8 ]                      │  ← 3. les réglages, à droite
└──────────────────────────────────────────────────────────────────────────────────────────────┘
grille des pistes :  « la grille montre le tour 1 »  (phrase d'état, tant que le curseur n'est pas au tour 1)
```

- **Bande collée :** il ne reste que le texte, puis `○─●─◉─○ tour 5 / 8`. Réglages, touches et annonce longue disparaissent (D18).
- **Sous 768 px :** chaque trou fait 44 × 44 px. La rangée de trous défile dans elle-même (`overflow-x: auto`) et garde le tour montré visible. La page ne défile jamais de côté (D18).

### Le curseur de tours (`TourCursor`, D14)

- **La piste** est un filet d'encre de 1 px (`{colors.text}`), avec un trou par tour, de 0 au nombre demandé.
- **Les états d'un trou** reprennent la grammaire des pas :
  - tour à venir : vide, contour `{colors.rule}` ;
  - tour calculé : percé, contour d'encre de 1 px ;
  - tour montré : trou plein à l'encre ;
  - tours d'un point fixe ou d'un cycle : trait d'encre de 2 px sous les tours concernés.
- **Les numéros** sont en Martian Mono `--size-value` (11 px), en gras tous les quatre (0, 4, 8, 12), comme les numéros de pas. « tour k / n » est en Martian Mono, et l'étiquette BOUCLE en sérigraphie (Archivo largeur 75, 600, capitales).
- **Aucune couleur d'accent, aucune lueur.** Le focus est un contour d'encre de 2 px décalé de 2 px.
- **Sémantique :** `role="slider"` sur la rangée, avec `aria-valuemin=0`, `aria-valuemax=n`, `aria-valuenow` et `aria-valuetext` (« tour 5 sur 8, cycle de 2 à partir du tour 3 »). Les flèches, Début et Fin la pilotent. Espace reste à l'écoute (D17).
- **Au pointeur :** un clic sur un trou, ou un glissé à travers la rangée, montre le tour le plus proche. Un tour à venir ne se choisit pas.
- **Suivi :** tant qu'on ne l'a pas touché, le curseur suit le dernier tour calculé (D20).

### Les réglages (D15, D16)

- « tours » est un champ de paramètre entier (`Control`, kind `integer`, de 2 à 12) : fond papier, Martian Mono centré.
- « Dé à chaque tour » est reporté (D3 CEO).
- Changer le nombre de tours relance la boucle. Si seul le nombre de tours augmente, la boucle reprend là où elle en était.
- « Arrêter la boucle » est une touche ordinaire, présente seulement pendant le calcul (D17).

### Mouvement (D13)

Quand le curseur se pose, après 150 ms sans mouvement, les mots changés du tour montré s'éclairent 300 ms de la couleur de leur piste : c'est le « moment signé » de `DESIGN.md`. Pendant un glissé, rien ne bouge. Rien non plus si le système demande de réduire les animations. Quand le curseur suit le calcul (D20), l'éclat joue à chaque tour qui arrive.

### États

```
  ÉLÉMENT          | ATTENTE                    | VIDE                         | ERREUR                                  | SUCCÈS                         | PARTIEL
  -----------------|----------------------------|------------------------------|-----------------------------------------|--------------------------------|-------------------------------
  Boucler          | désactivé pendant le calcul| désactivé (rien à boucler)   | —                                       | réactivé, relance              | relance = reprise (D11)
  Rangée BOUCLE    | dès le clic, « tour 2 sur  | « tout retiré au tour k »    | message d'erreur DESIGN.md (filet rouge,| « tour k / n », annonce du     | « arrêtée au tour 3 sur 6 »
                   | 6… » role=status (D6)      | (D8)                         | début rouge gras) « Tour 5 impossible :  | point fixe / cycle role=status |
                   |                            |                              | <raison>. Boucler relance. » (D7)       |                                |
  Papier tour k    | tour 1 inchangé            | « Plus aucun mot au tour k. »| tours faits gardés                      | mots changés soulignés (D12)   | idem
                   |                            | Spectral italique, encre sec.|                                         |                                |
  Garder / Copier  | « Garder le tour k »,      | Garder désactivé au tour vide| —                                       | une entrée, mention ×k (D10)   | idem
                   | Copier le tour montré      | et au tour 0 (raison en title)|                                        |                                |
  Abandon          | —                          | —                            | —                                       | message de la bande : « Boucle | —
                   |                            |                              |                                         | abandonnée : … Le tour 1 est au|
                   |                            |                              |                                         | carnet. » (D9)                 |
```

### Parcours (storyboard)

```
  ÉTAPE | LE FONDATEUR FAIT                        | IL RESSENT                     | CE QUI LE PORTE
  ------|------------------------------------------|--------------------------------|-------------------------------------------------
  1     | règle un S+7, lit le tour 1              | curiosité                      | bande inchangée, « Boucler » à côté d'« Itérer »
  2     | actionne Boucler                         | attente, un peu d'impatience   | rangée BOUCLE immédiate, « tour 2 sur 4… » (D6)
  3     | regarde les tours arriver                | amusement, le texte « part »   | le curseur suit le dernier tour, éclat à chaque arrivée (D20, D13)
  4     | balaie le curseur d'avant en arrière     | jeu, le plaisir de l'instrument| trous percés, mots changés soulignés, rien à recalculer (D12, D14)
  5     | voit « cycle de 2 à partir du tour 3 »   | surprise, trouvaille           | annonce + trait sous les tours du cycle
  6     | choisit « livre » au tour 0              | « d'où vient ce mot ? »        | lignée dans l'inspecteur (D19)
  7     | « Garder le tour 5 »                     | prise assumée, sans doute       | libellé qui nomme le tour, mention ×5 (D10)
  8     | descend lire, bande collée               | lecture sans perdre le geste   | les trous restent dans la bande collée (D18)
```

- **Cinq secondes :** la bande ne change pas d'allure ; seule une touche s'ajoute.
- **Cinq minutes :** la rangée de trous devient le geste.
- **À long terme :** le carnet ne garde que les tours choisis, qui sont nommés.

## Risks / Trade-offs

- **L'alignement se trompe** quand l'étiqueteur découpe le texte autrement que `tokenize` (élisions, traits d'union). → Les tests d'`alignTour` couvrent l'élision et le trait d'union. Si un écart persiste, la lignée s'arrête sur « ? » plutôt que de suivre un mauvais mot.

- **L'étiqueteur fige l'écran pendant des secondes.** → Mesure en tâche 1, puis la branche B. Le plafond de 12 tours borne l'attente à environ une minute.
- **La mémoire.** Douze tours de 533 mots, avec leurs étiquetages et leurs vues, tiennent largement. → Rien à faire. On ne garde pas plus que le plafond.
- **L'en-tête de la bande s'allonge d'une touche** (Boucler). À 768 px, il passe peut-être sur deux lignes. → À vérifier en 6.2. Si c'est le cas, Forme passe à la ligne, avant les touches.
- **Le libellé « Parent » au carnet** montre la source de l'entrée (le tour k−1), alors que le lien du parent mène au tour 1. → C'est accepté et écrit dans la spec. À revoir si le carnet doit un jour montrer l'arbre.
- **Une table modifiée en plein calcul** pourrait mêler deux tables. → Le numéro d'essai invalide le calcul, et la boucle est abandonnée.
- **Le test de reproductibilité dépend du dé à graine.** Un futur filtre au hasard sans graine casserait le scénario « Deux boucles identiques ». → Le scénario sert justement de garde.

## Revue de design du 2026-10-04

*`/plan-design-review`, en texte seul : le designer gstack n'a pas de clé OpenAI. Une seule voix extérieure, un sous-agent Claude [single-model] ; Codex a été écarté par le fondateur.*

**Hors périmètre (choix de design écartés) :**
- un `<input type="range">` natif, générique et sans lecture des tours calculés (D14) ;
- la généalogie au survol par `title` (D19) ;
- une grille estompée hors du tour 1 (D5) ;
- l'éclat à chaque cran du curseur, qui ferait stroboscope (D13) ;
- une confirmation avant d'abandonner la boucle, qui casserait le geste (D9) ;
- un dépliant des réglages collé à Boucler (D16).

**Ce qui existe déjà et que le plan reprend :**
- les numéros de pas (Martian Mono, gras tous les 4) ;
- la grammaire des trous (vide, contour, plein) ;
- la touche `aria-pressed` des pistes Muet et Seul ;
- le champ de paramètre (`Control`) ;
- l'inspecteur, qui s'ouvre sur un mot choisi ;
- le soulignement de 2 px dans la couleur de la piste ;
- le message d'état de la bande (`role=status`) ;
- le message d'erreur de `DESIGN.md` ;
- le moment signé ;
- la bande collée.

**TODOS.md :** aucune proposition. Toute la vérification est dans les tâches 6.2 et 6.3.

### Implementation Tasks

Tâches tirées de la revue, toutes déjà reportées dans `tasks.md` :
- [ ] **T1 (P1, humain ~1 j / CC ~30 min)** : `components/tour-cursor.ts`, la rangée de trous (D14, D17, D20). Fichiers : `src/ui/tracks/components/tour-cursor.ts`, `tracks.html`. Vérification : tâche 5.2.
- [ ] **T2 (P1, humain ~4 h / CC ~15 min)** : la rangée BOUCLE, ses réglages et ses états (D4, D6 à D11, D15 à D17). Fichiers : `components/result.ts`, `controller.ts`, `app.ts`. Vérification : tâches 4.2, 4.3 et 5.1.
- [ ] **T3 (P1, humain ~4 h / CC ~15 min)** : les mots changés soulignés et l'éclat une fois le curseur posé (D12, D13). Fichiers : `loop.ts`, `components/result.ts`. Vérification : tâches 4.6 et 5.2.
- [ ] **T4 (P2, humain ~3 h / CC ~10 min)** : la lignée dans l'inspecteur (D19). Fichiers : `components/inspector.ts`, `components/result.ts`. Vérification : tâche 5.3.
- [ ] **T5 (P2, humain ~2 h / CC ~10 min)** : la bande collée et le téléphone (D18). Fichiers : `components/result.ts`, `tracks.html`. Vérification : tâches 5.3 et 6.2.
- [ ] **T6 (P2, humain ~2 h / CC ~10 min)** : le mot dit marqué sur le papier (D21), et « la grille montre le tour 1 » (D5). Fichiers : `listening-controller.ts`, `components/step-grid.ts`. Vérification : tâches 4.7 et 5.2.

### Completion Summary

```
  +====================================================================+
  |         DESIGN PLAN REVIEW — COMPLETION SUMMARY                    |
  +====================================================================+
  | System Audit         | DESIGN.md présent, UI : bande, rangée, inspecteur |
  | Step 0               | 4/10, les 7 passes                          |
  | Pass 1  (Info Arch)  | 3/10 → 8/10 after fixes                     |
  | Pass 2  (States)     | 3/10 → 9/10 after fixes                     |
  | Pass 3  (Journey)    | 4/10 → 8/10 after fixes                     |
  | Pass 4  (AI Slop)    | 5/10 → 8/10 after fixes                     |
  | Pass 5  (Design Sys) | 6/10 → 9/10 after fixes                     |
  | Pass 6  (Responsive) | 3/10 → 8/10 after fixes                     |
  | Pass 7  (Decisions)  | 2 resolved, 0 deferred                      |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (6 items)                           |
  | What already exists  | written                                     |
  | TODOS.md updates     | 0 items proposed                            |
  | Approved Mockups     | 0 generated, 0 approved (pas de clé OpenAI) |
  | Decisions made       | 18 added to plan (D4 à D21)                 |
  | Decisions deferred   | 0                                           |
  | Overall design score | 3/10 → 8/10                                 |
  +====================================================================+
```

Ce qui empêche encore un 10 :
- la durée réelle d'attente d'un tour (mesure 1.1) ;
- la tenue de l'en-tête à 768 px (6.2) ;
- l'absence de maquette pour valider la rangée de trous à l'œil.

## Revue d'ingénierie du 2026-10-04

*`/plan-eng-review`. Cible fixe : `openspec/changes/boucle-de-tours/` (proposition, spec, conception, tâches).*

**Enregistrement du périmètre :**
- **Réponses sur les fonctionnalités :** aucune coupe proposée, le fondateur ayant fixé le périmètre deux fois.
- **Structure :** A, Smaller arrangement (réponse à D1).
- **Périmètre accepté :** les fonctionnalités, contrats et états approuvés en revue de design restent inchangés.
  - L'attribution mot à mot de `reread` (`src/domain/plugin-chain.ts:83-107`) est extraite en `ownersOf`, exportée et partagée par la chaîne et la lignée.
  - `src/domain/loop.ts` porte `findRepeat`, `tourSeed` et `alignTour`, qui s'appuie sur `ownersOf`.
  - Le soulignement des tours k ≥ 2 reprend les `marks` de la vue de ce tour.
- **Remèdes en attente :** aucun.
- **Résultat du Scope Challenge :** périmètre accepté tel quel, dans un arrangement plus petit.

**Constats du Scope Challenge :**
1. [P2] (confiance 9/10) `openspec/changes/boucle-de-tours/tasks.md` (tâche 4.4) — `keep()` est défini dans `src/ui/tracks/notebook-controller.ts:145` (`keep() {`), et non dans `controller.ts`, qui le délègue (`controller.ts:539`, `keep: notebookController.keep,`). C'est une correction de fait, sans changement de comportement : elle est appliquée aux tâches.

## Decision ledger

### R1: Repérer les tirages au dé à relancer par tour
Finding: A4, P2, confiance 8/10, `src/domain/s7/plugin.ts:26` (`seed: z.number().int().min(1).max(MAX_SEED).default(1),`) et `:112` (`{ kind: 'integer', key: 'seed', label: 'Graine', … when: { key: 'draw', values: ['dice'] } }`), revue d'architecture.
Plan baseline: `design.md`, décision 6 : « `computeTour` réécrit, dans une copie de la table du tour, le paramètre `seed` de chaque instance dont le tirage est au dé ». Le mécanisme de repérage n'est pas précisé (proposition d'origine).
Runtime evidence: seul S+7 (S+n, V+n) déclare un paramètre `seed` aujourd'hui (`grep seed src/domain` : `s7/plugin.ts` seulement).
Comparison grid:
| Choix | Actuel | A | B |
|---|---|---|---|
| R1 repérage des dés | non précisé, en attente | descripteur : tout paramètre entier de clé `seed` dont la condition `when` est remplie | code : `type` S+7 et `draw === 'dice'` en dur dans `loop.ts` |
| Comportement « Dé à chaque tour » | approuvé (revue de design, D15 ; spec « Dé relancé à chaque tour ») | inchangé | inchangé |
Question D2:
D2 — Comment la boucle repère-t-elle les dés à relancer ?
Project/branch/task: change boucle-de-tours, tritri/nanopm-pm-brainstorm-loop-58fdef.
ELI10: Quand « Dé à chaque tour » est allumé, la boucle doit changer la graine de chaque tirage au dé à chaque tour. Elle peut les trouver en lisant les descripteurs de paramètres (tout réglage nommé seed et visible), ou en connaissant le S+7 en dur. Aujourd'hui seul le S+7 a un dé.
Stakes if we pick wrong: un futur filtre au hasard avec une graine resterait figé à chaque tour sans que personne ne s'en aperçoive.
Recommendation: A because the parameter descriptors already say which settings are seeds and when they apply.
Note: options differ in kind, not coverage — no completeness score.
Pros / cons:
A) Par les descripteurs (recommended)
  ✅ Tout futur filtre qui déclare un paramètre seed est relancé sans toucher à la boucle
  ✅ Respecte la condition when : une graine masquée (tirage fixe) n'est pas réécrite
  ❌ Repose sur une convention de nom (seed) qu'il faut écrire dans plugin.ts
B) S+7 en dur
  ✅ Le plus direct : une condition sur le type et draw, lisible en une ligne
  ✅ Aucun contrat nouveau à documenter pour les plugins
  ❌ Couple la boucle au S+7 ; un nouveau dé serait ignoré en silence
Net: une convention de nom documentée contre un couplage silencieux au S+7.
Header: Question
Options:
A) Par les descripteurs (recommended)
La boucle réécrit tout paramètre entier de clé seed dont la condition when est remplie, dans une copie de la table du tour ; la convention est écrite dans src/domain/plugin.ts. (human ~1 h / CC ~5 min)
B) S+7 en dur
La boucle réécrit seed seulement pour les instances S+7 (et V+n) dont draw vaut dice, condition écrite dans src/ui/tracks/loop.ts. (human ~30 min / CC ~3 min)

State: approved
Actual answer: A) Par les descripteurs (réponse à D2, 2026-10-04)
Accepted scope: la boucle réécrit tout paramètre entier de clé `seed` dont la condition `when` est remplie, dans une copie de la table du tour ; la convention est écrite dans `src/domain/plugin.ts` ; décision 6 et tâche 4.5 mises à jour.
History: none

### R2: Contrat de non-régression des gestes existants
Finding: T1, P1 (CRITICAL), confiance 9/10, `src/ui/tracks/controller.ts:327-340` (`const tagAs = async (run: number, text: string, mixer: MixerState, lineage?: Lineage) => {`), `:347-362` (`const nextGeneration = async (keepChain: boolean) => {`), `src/domain/plugin-chain.ts:83` (`function reread(`), revue des tests.
Plan baseline: tâches 3.1 (réécrire `tagAs` via `computeTour`), 3.2 (extraire `ensureKept()` de `nextGeneration`) et extraction de `ownersOf` (D1). Vérification proposée : « les tests existants passent sans changement ». Aucun contrat écrit des comportements à préserver.
Runtime evidence: `test/ui/tracks/generations.test.ts` (Itérer, Figer, garde automatique, filiation), `test/ui/tracks/controller.test.ts` (mise en pistes, essais concurrents `runs`), tests de la chaîne existants sous `test/domain`. Leur couverture exacte de `reread` n'est pas mesurée ici (inconnu).
Comparison grid:
| Choix | Actuel | A | B |
|---|---|---|---|
| R2 contrat de non-régression | non écrit, en attente | contrat écrit : comportements nommés + assertions, tests existants inchangés, plus 3 tests ajoutés aux fichiers existants | tests existants inchangés seulement |
| R1 repérage des dés | approuvé (D2, A) | inchangé | inchangé |
Question D3:
D3 — Quel contrat de non-régression pour les gestes que la boucle réécrit ?
Project/branch/task: change boucle-de-tours, tritri/nanopm-pm-brainstorm-loop-58fdef.
ELI10: Pour partager le code, la boucle réécrit trois morceaux qui marchent déjà : la mise en pistes (tagAs), la garde d'Itérer et Figer (nextGeneration), et l'alignement de la chaîne (reread). Si l'un casse, Itérer, Figer ou toute la chaîne se dérèglent. Il faut dire ce qui doit rester identique et comment on le vérifie.
Stakes if we pick wrong: Itérer garde deux fois, ou une contraction (du → de la) perd son mot d'origine dans la chaîne, sans qu'aucun test ne rougisse.
Recommendation: A because the existing tests do not pin the three behaviors the refactor touches most.
Completeness: A=10/10, B=7/10
Pros / cons:
A) Contrat écrit + 3 tests (recommended)
  ✅ Nomme ce qui reste identique : mise en pistes, garde sans doublon, essai le plus récent qui l'emporte, contraction relue en deux mots
  ✅ Trois tests ajoutés aux fichiers existants attrapent une régression que les tests actuels laisseraient passer
  ❌ Un peu plus de travail avant la boucle elle-même, au début de la vague 1
B) Tests existants seuls
  ✅ Rien à écrire de plus : la suite actuelle doit rester verte
  ✅ Aucun test neuf à maintenir pour du code déjà livré
  ❌ Rien ne garantit que la suite actuelle couvre la contraction ou l'essai concurrent
Net: trois tests ciblés contre la confiance dans une couverture non mesurée.
Header: Question
Options:
A) Contrat écrit + 3 tests (recommended)
Comportements préservés : mettre en pistes (nouvel étiquetage, pas rouverts, verrous tombés, essai le plus récent qui l'emporte) ; Itérer et Figer (garde sans doublon, filiation, échec de garde qui laisse tout en place) ; reread (« du » relu en « de la » garde le mot d'origine, mot absorbé sans relu). Tests existants inchangés et verts, plus 3 cas ajoutés à controller.test.ts, generations.test.ts et au test de la chaîne. Aucun changement voulu. (human ~2 h / CC ~10 min)
B) Tests existants seuls
Même liste de comportements préservés, vérifiée seulement par la suite existante inchangée et verte ; aucun test ajouté. (human 0 / CC 0)

State: approved
Actual answer: A) Contrat écrit + 3 tests (réponse à D3, 2026-10-04)
Accepted scope: contrat de non-régression écrit dans la tâche 3.0 ; tests existants inchangés et verts, plus 3 cas : essai le plus récent qui l'emporte (controller.test.ts), garde sans doublon après « Garder » puis « Itérer » via `ensureKept` (generations.test.ts), « du » relu en « de la » et mot absorbé (test de la chaîne). Aucun changement de comportement voulu.
History: none

### R3: TODO « étiqueteur dans un Web Worker »
Finding: TODO, P3, confiance 7/10, `src/domain/tagging.ts:13` (`const parsed = TaggerOutputSchema.safeParse(await tagger.tag(text));`) — aucun `new Worker` dans `src` ; revue de performance.
Plan baseline: hors périmètre de ce change (décision 0, branche B : avancement puis curseur, sans worker).
Runtime evidence: durée de blocage inconnue jusqu'à la tâche 1.1.
Comparison grid:
| Choix | Actuel | A | B | C |
|---|---|---|---|---|
| R3 TODO worker | non proposé | ajouté à TODOS.md, conditionné à la branche B | non ajouté | construit dans ce change |
Question D4:
D4 — Ajouter « étiqueteur dans un Web Worker » à TODOS.md ?
Project/branch/task: change boucle-de-tours, tritri/nanopm-pm-brainstorm-loop-58fdef.
ELI10: Si la mesure montre que l'étiquetage gèle l'écran (branche B), la boucle se calcule derrière une barre et le curseur n'arrive qu'à la fin. Déplacer l'étiqueteur dans un Web Worker rendrait le curseur vivant pendant le calcul, et soulagerait aussi la mise en pistes et Itérer. C'est un chantier qui touche toute l'application.
Stakes if we pick wrong: on oublie pourquoi le curseur attend la fin, ou on ouvre un gros chantier avant de savoir s'il sert.
Recommendation: A because the need depends on a measurement that doesn't exist yet, and the TODO keeps the reason.
Note: options differ in kind, not coverage — no completeness score.
Pros / cons:
A) Ajouter à TODOS.md (recommended)
  ✅ Garde la trace du pourquoi, avec la condition (branche B) et le point de départ
  ✅ Ne change rien à ce change : la boucle reste livrable sans worker
  ❌ Une entrée de plus dans un fichier de suites qui compte déjà un chantier lourd
B) Ne pas l'ajouter
  ✅ Aucun bruit dans TODOS.md tant que la mesure n'a rien dit
  ✅ La décision 0 de design.md mentionne déjà le worker comme autre change possible
  ❌ La raison et le point de départ se perdent si la branche B tombe
C) Le construire ici
  ✅ Curseur vivant pendant le calcul quelle que soit la mesure
  ✅ Profite aussi à la mise en pistes et à Itérer
  ❌ Touche l'adaptateur d'étiquetage et toute l'application, pour un besoin non mesuré
Net: une trace conditionnelle contre rien, ou contre un chantier non justifié.
Header: Question
Options:
A) Ajouter à TODOS.md (recommended)
Entrée « Étiqueteur dans un Web Worker » (Quoi, Pourquoi, Pour, Contre, Contexte, Dépend de : branche B de la tâche 1.1). (human ~10 min / CC ~2 min)
B) Ne pas l'ajouter
Rien dans TODOS.md ; la décision 0 reste la seule trace. (human 0 / CC 0)
C) Le construire ici
Ajouter au change un adaptateur d'étiquetage en Web Worker et ses tâches. (human ~2-3 j / CC ~1 h)

State: approved
Actual answer: A) Ajouter à TODOS.md (réponse à D4, 2026-10-04)
Accepted scope: entrée « Étiqueteur dans un Web Worker » ajoutée à `TODOS.md`, conditionnée à la branche B de la tâche 1.1 ; aucun changement de ce change.
History: none

Approval readiness: PASS — scope record (D1, A), R1 (D2, A), R2 (D3, A), R3 (D4, A).

### Hors périmètre (revue d'ingénierie)
- L'étiqueteur dans un Web Worker est reporté dans `TODOS.md` (D4), à reprendre seulement en branche B.
- Un second algorithme d'alignement est écarté (D1) : `ownersOf` est partagé.
- Une couverture de tests mesurée de `reread` n'est pas faite : le contrat D3 fixe les cas nécessaires à la place.

### Ce qui existe déjà
- `reread` et son attribution mot à mot (`plugin-chain.ts:83-107`) sont réutilisés par extraction (D1).
- `tagText` garantit le même découpage que `tokenize` (`tagging.ts:12-27`), et c'est ce qui rend l'alignement exact.
- Les `marks` de `buildView` donnent les mots remplacés de chaque tour, d'où le soulignement sans code neuf.
- `dispatch` → `rebuild` (`controller.ts:287`, `:493`) est le point de passage unique pour abandonner la boucle.
- Les numéros d'essai `runs` (`controller.ts:316-330`) servent de modèle à l'invalidation d'un calcul abandonné.
- `test/ui/tracks/generations.test.ts` et `controller.test.ts` servent de base au contrat D3.

### Flux d'une boucle

```
Boucler ──► ensureKept() ──(échec)──► message de garde, rien ne bouge
   │            │ ok : firstKept
   ▼            ▼
 rangée « tour 2 sur n… » ──► [image + setTimeout(0)] ──► computeTour(k)
   ▲                                                        │
   │   ┌──── stopLoop ? ──► « arrêtée au tour k » (reprise) │
   │   ├──── essai périmé (abandon) ──► rien n'est publié ◄──┤
   │   ├──── échec d'étiquetage ──► tours faits + erreur ◄───┤
   │   └──── tour vide / findRepeat ──► annonce, fin ◄───────┤
   └──────── k < n : tour suivant ◄──────────────────────────┘
```

### Modes de défaillance
| Chemin | Défaillance réaliste | Test | Gestion d'erreur | Visible ? |
|---|---|---|---|---|
| `computeTour` | l'étiquetage lève une erreur au tour k | 4.2, « Échec au cinquième tour » | arrêt, tours gardés, message | oui |
| abandon pendant le calcul | un tour périmé est publié après le changement de table | 4.3, « un calcul abandonné ne publie rien » | numéro d'essai | sans objet (évité) |
| `ensureKept` | stockage plein au tour 1 | 4.1 | message de garde, geste arrêté | oui |
| `ownersOf` extrait | une contraction perd son mot d'origine dans la chaîne | 2.0 (D3) | sans objet | silencieux sans test, donc couvert par D3 |
| graines par tour | un paramètre `seed` masqué est réécrit | 4.5 | condition `when` (D2) | non, mais testé |

Aucune lacune critique : chaque défaillance silencieuse a un test.

### Parallélisation
| Étape | Modules | Dépend de |
|---|---|---|
| 1.1 mesure | prévisualisation | — |
| 2.x domaine | `src/domain` | 2.0 avant 2.3 |
| 3.x tour sans effet de bord | `src/ui/tracks` (contrôleur) | 2.0 |
| 4.x boucle | `src/ui/tracks` (contrôleur, écoute) | 1.1, 2.x, 3.x |
| 5.x interface | `src/ui/tracks/components`, `tracks.html` | 4.x |

- **Voie A :** 2.0, puis 2.1 à 2.3 (domaine).
- **Voie B :** 1.1, puis 3.x (contrôleur).
- **Ensuite :** 4.x et 5.x se suivent.

Lancer A et B, fusionner les deux, puis 4.x, puis 5.x. Conflit possible : 2.0 touche les tests du contrôleur, que 3.x modifie aussi, donc 2.0 passe avant 3.x.

### Implementation Tasks
- [ ] **T1 (P1, human ~2 h / CC ~10 min)** : tests et contrat de non-régression (D3). Fichiers : `test/ui/tracks/controller.test.ts`, `test/ui/tracks/generations.test.ts`, le test de la chaîne. Vérification : tâche 2.0.
- [ ] **T2 (P2, human ~2 h / CC ~10 min)** : extraire `ownersOf` de `reread` et écrire `alignTour` (D1). Fichiers : `src/domain/plugin-chain.ts`, `src/domain/loop.ts`. Vérification : tâche 2.3.
- [ ] **T3 (P2, human ~1 h / CC ~5 min)** : graines repérées par les descripteurs (D2). Fichiers : `src/domain/plugin.ts`, `src/ui/tracks/loop.ts`. Vérification : tâche 4.5.
- [ ] **T4 (P2, human ~1 h / CC ~5 min)** : abandon dans `rebuild`, et rendre la main avant chaque tour. Fichiers : `src/ui/tracks/controller.ts`. Vérification : tâches 4.2 et 4.3.

Effort estimé avec un ratio « tests » d'environ 30×.

### Completion summary (revue d'ingénierie)
- **Step 0, Scope Challenge :** scope accepted as-is, dans un arrangement plus petit (D1).
- **Architecture Review :** 3 issues found (abandon, repeinte avant tour, graines).
- **Code Quality Review :** 1 issue found (code partagé `ownersOf`).
- **Test Review :** diagramme produit, 1 lacune critique de non-régression (D3).
- **Performance Review :** 0 issues found.
- **NOT in scope :** écrit. **What already exists :** écrit.
- **TODOS.md updates :** 1 item proposé, accepté.
- **Failure modes :** 0 critical gaps flagged.
- **Unresolved decisions :** 0.
- **Outside voice :** codex, unavailable (sonde cassée, `model_unusable` ; fallback natif impossible sans TaskOutput).
- **Parallelization :** 2 voies parallèles, puis 2 étapes séquentielles.
- **Lake Score :** 1/1.

## Revue de portée (CEO) du 2026-10-04

*`/plan-ceo-review`, profondeur stratégie seulement, mode SCOPE REDUCTION (réponse à D1).*

**Prémisse.** Le geste de base (Boucler et le curseur) suffit à tester le pari. Le change compte 19 tâches et touche plus de 15 fichiers, ce qui en fait un item NEXT plus gros que le mode puzzle, qui est en NOW (13 tâches).

**Cœur proposé :**
- Boucler, le réglage « tours », l'avancement et « Arrêter la boucle » ;
- le curseur en trous ;
- le point fixe, le cycle et le tour vide ;
- l'abandon de la boucle ;
- « Garder le tour k » (×k) ;
- le soulignement des mots changés et la bande collée.

### Ledger (CEO)

| ID and owner | Contract and evidence | Current | Proposed | Status | Exact approval and scope |
|---|---|---|---|---|---|
| C1 généalogie (Tristan) | spec « Généalogie d'un mot » ; tâches 2.3 (`alignTour`), 4.6, 5.3 ; décisions D19 design et D1 ingénierie | dans la v1 | reportée à TODOS.md | approved (kept) | D2 CEO : « Garder dans la v1 », après rendu ASCII ; périmètre inchangé |
| C2 dé par tour (Tristan) | spec « Dé relancé à chaque tour » ; tâches 2.2, 4.5 ; décisions D15 design et D2 ingénierie | reporté | reporté à TODOS.md | deferred | D3 CEO : « Reporter à TODOS.md » ; spec, tâches 2.2 et 4.5, touche de 5.1, décision 6 et R1 (D2 ingénierie) sans objet dans la v1 |
| C3 écoute des tours (Tristan) | spec « Écoute des tours » ; tâche 4.7 ; décision D21 design | dans la v1 | reportée à TODOS.md | approved (kept) | D4 CEO : « Garder dans la v1 » ; périmètre inchangé |
| C4 reprise d'une boucle arrêtée (Tristan) | spec « Avancement des tours » (reprise) ; tâche 4.2 ; décision D11 design | dans la v1 | reportée : relancer recalcule depuis le tour 2 | approved (kept) | D5 CEO : « Garder dans la v1 » ; périmètre inchangé |
| C5 mesure du pari (Tristan, section 8) | PRD « Falsification » ; spec « Garder un tour » ; `LineageSchema` (`notebook.ts:15-19`, `parent`, `ancestor`, `passes`) ; note success-measurability du PRD | rien ne distingue une entrée de boucle de k « Itérer » | marqueur optionnel `loop` dans l'entrée | approved | D6 CEO : « Champ optionnel loop » ; spec « Garder un tour », tâche 4.4, proposition mises à jour |
| C6 condition de départ (Tristan, section 9) | roadmap NOW 1–3, NEXT ; PR #89 (mode puzzle, brouillon) | commencer maintenant | — | approved | D7 CEO : « Commencer maintenant » ; roadmap : la boucle passe en NOW, item 4, en parallèle du puzzle |

**Résultat de l'étape 0 (CEO) :** périmètre réduit d'un extra (dé par tour reporté, D3) ; généalogie, écoute des tours et reprise gardées (D2, D4, D5).


Approval readiness (CEO): PASS — mode D1 ; C1 (D2, gardé), C2 (D3, reporté), C3 (D4, gardé), C4 (D5, gardé), C5 (D6, approuvé), C6 (D7, approuvé).

### Revue de portée : sections 1 à 11
- **Section 1, architecture :** tout reste dans le navigateur, sans requête ni stockage nouveau en dehors du carnet. Aucun constat.
- **Section 2, erreurs :** aucune lacune (registre ci-dessous).
- **Section 3, sécurité :** une seule entrée nouvelle, un entier de 2 à 12 validé par `Control` et zod. Aucun constat.
- **Section 4, cas limites :** « Garder » pressé deux fois donne deux entrées, ce qui est déjà le cas aujourd'hui (WARNING hérité, non introduit).
- **Sections 5 à 7 :** couvertes par la revue d'ingénierie.
- **Section 8, observabilité :** **CRITICAL GAP** résolu (D6) avec le champ `loop`.
- **Section 9, déploiement :** démarrage immédiat, la boucle passe en NOW (D7).
- **Section 10, trajectoire :** réversibilité 4/5, 2 dettes (exception de filiation, champ `loop`).
- **Section 11, design :** couverte par `/plan-design-review`.

### Hors périmètre (revue de portée)
- **Reporté :** le dé relancé à chaque tour (D3), avec une entrée dans `TODOS.md`. La différence n'a pas encore été entendue, et la boucle dérive déjà avec un dé fixe.
- **Rejeté :** aucun élément.

### Ce qui existe déjà (revue de portée)
- « Itérer », la garde automatique et la filiation sont réutilisés.
- `reread` est partagé via `ownersOf`.
- Les `marks` de la vue donnent le soulignement.
- L'inspecteur et le transport de l'écoute sont étendus.

### Écart avec l'état idéal
- **Ce que la boucle apporte :** la réinjection devient un geste du rack (Boucler, puis le curseur), qu'on lit, qu'on entend et qu'on mesure à l'export.
- **Ce qui manque encore pour l'idéal à 12 mois :** le dé par tour, l'enchaînement des tours à l'écoute et la réinjection propre à une instance.

### Registre erreurs et reprise (par capacité)
| Capacité | Défaillance | Reprise | L'utilisateur voit | Qui vérifie |
|---|---|---|---|---|
| étiquetage d'un tour | erreur du modèle | arrêt, tours faits gardés | erreur dans la rangée BOUCLE | tâche 4.2 |
| garde (tour 1 ou k) | stockage plein | message existant, geste arrêté | « Impossible de garder » | tâche 4.1 |
| abandon pendant le calcul | tour périmé publié | numéro d'essai | rien | tâche 4.3 |
| écoute d'un tour | aucune voix française | message existant | « Aucune voix française » | tâche 4.7 |
| champ `loop` illisible | entrée abîmée | oublié, l'entrée reste | rien | tâche 4.4 |

### Registre des modes de défaillance
| Chemin | Défaillance | Repris ? | Test ? | L'utilisateur voit ? | Journal ? |
|---|---|---|---|---|---|
| computeTour | étiquetage en échec | O | O (4.2) | message | non (pas de journal côté client) |
| abandon | publication périmée | O | O (4.3) | rien | non |
| keep tour k | quota | O | O (4.1) | message | non |
| loop field | illisible | O | O (4.4) | rien | non |

Aucune lacune critique.

### Diagrammes
- **Architecture :** voir « Revue de portée › Section 1 », dans le rapport en chat, et « Flux d'une boucle ».
- **Machine à états de la boucle :**
```
 (aucune) --Boucler--> calcul --tour prêt--> calcul ... --n atteint / point fixe / cycle / tour vide--> finie
    ^                    |--Arrêter--> arrêtée --Boucler (rien changé)--> calcul (reprise)
    |                    |--échec--> échouée (tours faits gardés) --Boucler--> calcul
    +--abandon (table, saisie, mise en pistes, rouvrir, Itérer, Figer) depuis tout état
```
Transitions impossibles : un tour périmé ne se publie pas après un abandon (numéro d'essai), et « Boucler » est désactivé pendant le calcul.
- **Déploiement et retour en arrière :** fusion, publication automatique ; le retour en arrière est le revert de la PR, et les entrées de boucle restent lisibles.

### Audit des diagrammes périmés
« Ordre de lecture de la bande » ne montrait plus la touche du dé : corrigé quand C2 a été appliqué. Les autres diagrammes sont exacts.

### Implementation Tasks (revue de portée)
- [ ] **T1 (P1, human ~1 h / CC ~5 min)** : carnet, champ optionnel `loop` (D6). Fichiers : `src/ui/tracks/notebook.ts`, `notebook-controller.ts`. Vérification : tâche 4.4, scénario « Garder le tour 5 ».
- [ ] **T2 (P2, human ~10 min / CC ~2 min)** : roadmap, la boucle passe en NOW (D7). Fait dans `.nanopm/wiki/docs/roadmap.md`. Vérification : l'item 4 est présent.

### Completion Summary (revue de portée)
```
  +====================================================================+
  |            MEGA PLAN REVIEW — COMPLETION SUMMARY                   |
  +====================================================================+
  | Mode selected        | SCOPE REDUCTION                             |
  | System Audit         | NEXT plus gros que le NOW ; #89 ouverte      |
  | Step 0               | 4 candidats : 1 reporté (dé), 3 gardés       |
  | Section 1  (Arch)    | 0 issues found                              |
  | Section 2  (Errors)  | 5 error paths mapped, 0 GAPS                |
  | Section 3  (Security)| 0 issues found, 0 High severity             |
  | Section 4  (Data/UX) | 4 edge cases mapped, 0 unhandled            |
  | Section 5  (Quality) | 0 issues found (revue d'ingénierie)         |
  | Section 6  (Tests)   | Diagram (eng), 0 gaps                       |
  | Section 7  (Perf)    | 0 issues found                              |
  | Section 8  (Observ)  | 1 gap found, résolu (D6)                    |
  | Section 9  (Deploy)  | 1 risk flagged, résolu (D7)                 |
  | Section 10 (Future)  | Reversibility: 4/5, debt items: 2           |
  | Section 11 (Design)  | 0 issues (couvert par /plan-design-review)  |
  +--------------------------------------------------------------------+
  | NOT in scope         | written (1 item)                            |
  | What already exists  | written                                     |
  | Dream state delta    | written                                     |
  | Error/rescue registry| 5 rows, 0 CRITICAL GAPS                     |
  | Failure modes        | 4 total, 0 CRITICAL GAPS                    |
  | TODOS.md updates     | 1 item (dé par tour)                        |
  | Scope proposals      | 0 proposed, 0 accepted (mode réduction)     |
  | CEO plan             | skipped by mode                             |
  | Outside voice        | codex unavailable (model_unusable)          |
  | Lake Score           | N/A                                         |
  | Diagrams produced    | 3 (architecture, états, déploiement)        |
  | Stale diagrams found | 1 (corrigé)                                 |
  | Unresolved decisions | 0                                           |
  +====================================================================+
```

## GSTACK REVIEW REPORT

| Review | Trigger | Why | Runs | Status | Findings |
|--------|---------|-----|------|--------|----------|
| CEO Review | `/plan-ceo-review` | Scope & strategy | 1 | clean | mode: SCOPE_REDUCTION, 0 critical gaps (1 reporté, 3 gardés, mesure et démarrage décidés) |
| Outside Review | codex via `/plan-eng-review` et `/plan-ceo-review` | Independent 2nd opinion | 2 | unavailable | sonde Codex cassée (model_unusable), no completed external review |
| Eng Review | `/plan-eng-review` | Architecture & tests (required) | 1 | issues_open (mapped) | 5 issues, 0 critical gaps |
| Design Review | `/plan-design-review` | UI/UX gaps | 1 | clean | score: 3/10 → 8/10, 18 decisions |
| DX Review | `/plan-devex-review` | Developer experience gaps | 0 | — | — |

- **OUTSIDE COVERAGE:**
  - codex, phases plan-review (ingénierie et portée) : unavailable ;
  - codex, phase design : skipped, avec un sous-agent Claude natif à la place.
  - Aucune revue extérieure terminée.
- **VERDICT:** CEO + DESIGN CLEARED. Eng review ISSUES OPEN : 5 constats, tous en tâches approuvées, aucune décision ouverte. Eng review required (clean).

NO UNRESOLVED DECISIONS
