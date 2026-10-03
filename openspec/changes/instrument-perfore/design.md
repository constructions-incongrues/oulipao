# Design : l'instrument perforé

## Context

- **La référence.** `~/.gstack/projects/oulipao/designs/tracks-page-instrument-20261003/finalized.html` est une page autonome, validée le 2026-10-03, avec un lexique illustratif. Elle fixe l'apparence et les gestes, pas le code : son moteur est factice, et c'est Oulipao qui fournit les vrais remplacements.
- **`DESIGN.md`** porte les jetons (couleurs, polices, espacements, rayons, mouvement). Trois choix de la référence n'y sont pas encore écrits : la chaîne au-dessus des pistes, la bande collée compacte et les pages de pas. Ce changement les y ajoute.
- **Le code actuel.**
  - La page à pistes est en Preact + htm (`src/ui/tracks/*`). Son état est un `MixerState` validé par zod et modifié par `reduce(state, action)`.
  - La chaîne (`src/domain/plugin-chain.ts`) relit la sortie de chaque instance comme un texte neuf et ramène tout aux mots d'origine (`origin[k]`).
  - Les contraintes reçoivent `apply(text, tagged, values, resources, targets)` : leur portée est la piste, rien de plus fin.
  - Le S+n et le lipogramme réécrivent les noms par `rewriteNouns(text, tagged, choose, morphology)`, où `choose(word, hints)` ne connaît pas la position du mot. Les adjectifs passent par `shiftAdjectives(words, tagged, offset, …)`, avec un seul décalage pour tous.
  - `moveInstance` existe déjà ; le glisser-déposer n'existe pas.
- **Les contraintes du projet.** Domaine pur, entités en zod, couverture au-dessus de 90 %, pas de serveur.

## Goals / Non-Goals

**Goals :**
- Appliquer `DESIGN.md` à `tracks.html` et `index.html` : jetons, polices servies par le projet, thème clair et sombre.
- Un pas bouché et un verrou par mot qui passent par le domaine, avec la même chaîne et sans nouvel étiquetage.
- La grille de pas, la chaîne réordonnable à la souris et au clavier, la bande collée, la tête de lecture.
- Un contrôle automatique des contrastes et du daltonisme.

**Non-Goals :**
- Les autres fiches de la recherche : mode témoin, effacement euclidien, conditions de déclenchement, arrangement par passages.
- Garder l'état entre deux visites : les pas bouchés et les verrous meurent avec l'étiquetage, comme le choix de l'inspecteur.
- Reprendre Pretext. Dans la référence, il ne sert qu'à animer la hauteur de la bande ; ici, une hauteur plafonnée en CSS et un défilement interne suffisent. C'est une dépendance de moins.

## Decisions

### 1. La portée par mot entre dans le contrat des contraintes (domain)

`ConstraintPlugin.apply` reçoit un sixième argument facultatif, `scope: WordScope` :

```ts
// src/domain/plugin.ts
export const WordScopeSchema = z.object({
  skip: z.array(z.number().int().nonnegative()),   // positions du texte relu que la contrainte laisse
  overrides: z.array(z.object({ index: z.number().int().nonnegative(), values: ParameterValuesSchema })),
});
```

- Les positions sont celles du texte que la contrainte reçoit : le texte relu par la chaîne.
- `runChain` traduit les indices d'origine (`ChainStep.closed`, `ChainStep.locks`) par `origin[k]`. Un mot d'origine qui donne deux mots relus (« du » → « de la ») les fait tous deux sauter ou verrouiller.
- *Rejeté* : filtrer après coup dans la chaîne, en remettant la sortie de l'étape précédente pour les mots bouchés. Le réaccord d'un nom remplacé aurait déjà changé son déterminant et ses adjectifs, et la phrase serait fausse.
- *Rejeté* : un `targets` par mot. Ce serait mélanger « quelles pistes » et « quels pas », qui sont deux réglages différents sur la page.

`ChainStep` gagne `closed: ReadonlySet<number>` (positions d'origine, communes à toute la chaîne) et `locks: ReadonlyMap<number, ParameterValues>` (propres à l'instance). Les deux sont facultatifs et vides par défaut, donc les tests existants passent sans changement.

### 2. Le S+n et le lipogramme lisent la portée (domain)

- `rewriteNouns` passe la position au choix : `choose(word, hints, index)`. Le S+n renvoie le mot tel quel pour une position sautée, et prend le décalage verrouillé quand il y en a un. Le lipogramme laisse les positions sautées.
- `shiftAdjectives` prend `offsetAt(index)` au lieu d'un nombre, et saute les positions de `skip`.
- Le lipogramme saute aussi les positions de `skip` dans sa deuxième passe (les autres pistes).
- Un verrou est validé par le `parse` de la contrainte, fusionné avec les réglages de l'instance. Une valeur refusée lève, comme `set-param`.

### 3. L'état de la table porte les pas bouchés et les verrous (ui)

```ts
// src/ui/tracks/types.ts
MixerStateSchema = z.object({
  tracks, instances,                              // Instance gagne `locks`
  closed: z.array(z.number().int().nonnegative()),            // positions d'origine
});
InstanceSchema = … .extend({ locks: z.array(z.object({ index, key, value })) });
```

Nouveaux gestes, validés par `MixerActionSchema` :
- `toggle-step { index }` ;
- `set-lock { id, index, key, value }`, dont la valeur est validée par le `parse` du plugin ;
- `clear-lock { id, index, key }`.

`duplicate-instance` copie les verrous. `remove-instance` les emporte avec l'instance. Le contrôleur remet `closed` et les verrous à zéro à chaque nouvel étiquetage, comme il ferme l'inspecteur. `activeSteps` construit `ChainStep.closed` et `ChainStep.locks`.

### 4. La page : composants et ordre (ui)

`app.ts` suit l'ordre de la référence : bande de sortie, saisie, chaîne, grille, inspecteur.
- `components/result.ts` : la bande collée (`position: sticky`). Une sentinelle observée par `IntersectionObserver` ajoute la classe `stuck`, qui la rend compacte (17 px, `max-height` de 4 ou 3 lignes, défilement interne).
- `components/chain.ts` (nouveau, à la place de `rack.ts`) : une ligne par instance en grille CSS à colonnes fixes (poignée, numéro, nom, réglage, pistes visées, marche, touches), puis la ligne « Ajouter ». Le glisser-déposer est natif : seule la poignée rend la ligne `draggable` ; un trait d'encre `drop-before` ou `drop-after` montre la place ; au lâcher, `move-instance`. Les touches ↑ et ↓ envoient `move-instance` à la position voisine et gardent le focus sur la touche.
- `components/step-grid.ts` (nouveau, absorbe `strip.ts`) :
  - les tranches de piste ;
  - l'en-tête des pas, dont chaque mot est un bouton vers l'inspecteur ;
  - les pas (`toggle-step`) ;
  - la pagination, dont le nombre de pas par page vient d'un `ResizeObserver` sur la grille (16, 8 ou 4), avec des flèches quand il y a plus de six pages.
- `components/inspector.ts` : un champ par paramètre entier dans la bande de chaque instance qui vise la piste du mot (`set-lock` / `clear-lock`), plus l'état du pas.
- La tête de lecture est un élément de la grille, animé en CSS (300 ms) quand la génération du résultat change ; `prefers-reduced-motion` l'annule. L'éclat des mots remplacés existe déjà (`changed`) et passe aux nouveaux jetons.
- Les poinçons sont un `<symbol>` SVG par piste, défini une fois dans `tracks.html` ; le nom de la piste est toujours écrit à côté.

`view-model.ts` calcule pour chaque pas son état (percé, contour, bouché) et son verrou, pour que les composants restent sans logique.

### 5. Jetons et polices (ressources)

- `styles/tokens.css` est réécrit à partir du front matter de `DESIGN.md` : variables `--panel`, `--paper`, `--ink`, `--muted`, `--rule`, `--noun`… et leurs valeurs sombres sous `prefers-color-scheme` et `[data-theme]`. Les pages n'écrivent aucune couleur en dur.
- `fonts/` : woff2 du sous-ensemble latin, tirés de `@fontsource/spectral`, `@fontsource-variable/archivo`, `@fontsource-variable/martian-mono` et `@fontsource-variable/big-shoulders-stencil-display` (5.3.0, OFL 1.1), avec leurs licences. Les fichiers Source Serif 4 et IBM Plex sont retirés.
- Le bouton « Clair / sombre » pose `data-theme` sur `<html>`. Le choix n'est pas gardé d'une visite à l'autre (non-goal).

### 6. Vérification de la palette (scripts)

`scripts/check-palette.ts` lit les couleurs du front matter de `DESIGN.md` et calcule :
- les contrastes WCAG ;
- la simulation de Machado (2009) en deutéranopie, protanopie et tritanopie, avec une sévérité de 1,0 ;
- le ΔE CIELAB 76 minimal entre pistes.

Il échoue en nommant la paire fautive. Il tourne par `npm run check:palette` ; le calcul vit dans une fonction pure, `src/domain/palette.ts`, testée comme le reste du domaine. *Placé dans le domaine* parce que c'est du calcul pur sans port. *Alternative rejetée* : un test qui lit `tokens.css`, ce qui obligerait à analyser du CSS.

### Couches et ports des nouveaux modules

| Module | Couche | Ports dont il dépend |
|---|---|---|
| `src/domain/plugin.ts` (`WordScope`) | domain | aucun |
| `src/domain/palette.ts` | domain | aucun |
| `src/ui/tracks/components/step-grid.ts` | ui | aucun (reçoit la vue) |
| `src/ui/tracks/components/chain.ts` | ui | aucun |
| `scripts/check-palette.ts` | scripts | lecture de fichier, directe comme les autres scripts |

## Risks / Trade-offs

- **Le contrat `apply` change.** Les trois appelants sont internes et la portée est facultative, donc rien ne casse. Le contrat n'est pas publié (voir `plugin.ts`).
- **Un pas bouché coupe un groupe nominal en deux sens.** Boucher un nom laisse aussi son déterminant et ses adjectifs, puisque rien n'est réaccordé. Boucher un adjectif ne protège pas son accord si le nom est remplacé. C'est l'exception déjà écrite dans « Portée d'un filtre » ; le design la garde.
- **Le glisser-déposer natif ne marche pas au doigt.** Les touches ↑ et ↓ le remplacent sur téléphone, et la spec les exige.
- **La bande collée mange l'écran sur téléphone.** Le plafond de trois lignes limite la perte ; on reviendra dessus si le fondateur trouve la grille trop étroite.
- **La variable de police Archivo ajoute environ 80 Ko.** C'est accepté : une seule famille sert à la fois l'interface et la sérigraphie.
- **Le daltonisme n'a pas encore été mesuré.** Si `check:palette` échoue sur la palette Okabe-Ito adaptée, on ajuste la luminosité d'une teinte dans `DESIGN.md` avant d'écrire `tokens.css`. C'est la tâche 1, faite avant toute autre pour cette raison.
