# Design

## Context

Ce qu'on a observé dans le code :

- **Le S+n parcourt des listes fournies par le port de morphologie.** La substitution des noms (`src/domain/s7/substitution.ts`) parcourt `morphology.nounLemmas()`. Celle des adjectifs (`adjective-shift.ts`) parcourt `morphology.adjectiveParadigms()`. Ces deux listes sont dans l'ordre du dictionnaire.
- **La position d'un lemme est cherchée par une table, sans recherche dichotomique.** Pour les noms, c'est `positionOf` : une `Map` construite une fois par liste et gardée dans une `WeakMap`. Pour les adjectifs, c'est `indexOf`. Aucune des deux ne suppose l'ordre alphabétique. Un lemme absent donne `unknown-noun` pour un nom, « absent du dictionnaire » pour un adjectif.
- **Le patron existe déjà avec la phonétique.** Le fichier `data/phonetique-oulipao.tsv` dérive du GLÀFF, sous CC BY-SA, et reste séparé du code. Le script `scripts/build-phonetics.ts` le produit à partir de `data/brut/`. L'adaptateur `loadPhonetics` le lit, `createPhoneticsLoader` (`src/ui/composition.ts`) le charge à la demande avec une version dans l'URL, et le contrôleur lance ce chargement quand une instance en a besoin. La provenance est notée dans `THIRD_PARTY_LICENSES.md` et `docs/lexiques.md`.
- **Une marque de mot (`WordMarkSchema`, `src/domain/plugin.ts`) ne peut porter qu'une raison**, et seulement pour un mot laissé. Rien ne permet de joindre une information à un mot remplacé.

## Goals / Non-Goals

**Goals:**
- Réutiliser intégralement le moteur du S+n (décalage, modulo, « Parmi », accord, élision, dé, verrous) en lui passant d'autres listes, sans dupliquer de logique de substitution.
- Garder les échelles hors du domaine : le domaine reçoit des listes ordonnées et des notes par un port.

**Non-Goals:**
- Aucun changement dans le R+n, ni dans les autres filtres qui lisent l'ordre du dictionnaire.
- Pas de recherche floue : un lemme qui ne figure pas exactement dans l'échelle n'a pas de note.

## Decisions

### 1. Une vue ordonnée du port de morphologie (domaine)
`rankedMorphology(morphology, scales, order)` (`src/domain/s7/ranked-morphology.ts`, couche domain) renvoie un `MorphologyRepository` qui délègue tout au port d'origine. Seules deux méthodes changent :
- `nounLemmas()` renvoie l'échelle des noms ;
- `adjectiveParadigms()` renvoie l'échelle des adjectifs.

Ces listes sont calculées une seule fois par couple (échelle, ordre), pour que le cache de positions (`WeakMap`) reste valide. Le plugin S+7 passe cette vue à `applyS7` et à `shiftAdjectives` quand l'ordre n'est pas alphabétique.
- *Pourquoi :* zéro modification dans `substitution.ts` et `adjective-shift.ts`. Les tests existants y restent valables tels quels, et un lemme absent de l'échelle tombe naturellement dans le cas « inconnu », qui donne la règle « les mots sans note ne bougent pas ».
- *Alternative écartée :* passer une liste `lemmas` en option dans `substituteNoun` et `shiftAdjective`. Il faudrait toucher deux signatures et leurs appelants, pour le même résultat.
- *Alternative écartée :* un plugin V+n séparé, rejeté dans le PRD (« The One UX Decision »).

### 2. Un port `ScaleRepository` (ports)
```ts
type ScaleOrder = 'valence' | 'arousal' | 'concreteness';
interface ScaleRepository {
  /** Les lemmes notés d'une catégorie, du score le plus bas au plus haut. */
  scale(order: ScaleOrder, category: 'noun' | 'adjective'): readonly string[];
  /** Note de 0 à 100, ou undefined. */
  score(order: ScaleOrder, category: 'noun' | 'adjective', lemma: string): number | undefined;
}
```
Ce port est déclaré dans `src/ports/scales.ts`, couche ports. `PluginResources` reçoit un champ optionnel `scales?: ScaleRepository`, comme `phonetics`. Le type `ScaleOrder` et le schéma zod de l'ordre vivent dans `src/domain/s7/types.ts` (`S7OrderSchema` : `alphabetical | valence | arousal | concreteness`).

### 3. Le paramètre et le titre (domaine)
`ParamsSchema` du plugin reçoit `order: S7OrderSchema.default('alphabetical')`. Le `.default` rend les anciennes chaînes rétrocompatibles. On ajoute un paramètre `choice` « Ordre », placé avant « Parmi ». `title` et `nameOf` choisissent la lettre (S, V, I, C), et `help` nomme l'échelle.
- Quand `order !== 'alphabetical'` et que `resources.scales` est absent, `apply` laisse le texte tel quel avec une raison « échelles en chargement ». C'est le comportement de la phonétique.
- Quand l'ordre n'est pas alphabétique, la piste des verbes n'est pas traitée : la branche `rewriteVerbs` est sautée.
- Les raisons `unknown-noun` et « absent du dictionnaire » sont rendues par « sans note » quand l'ordre n'est pas alphabétique.

### 4. La note dans l'inspecteur : un champ `detail` sur la marque (domaine et ui)
`WordMarkSchema` reçoit `detail: z.string().optional()`, une précision en clair sur un mot remplacé. Le S+7 y met par exemple « valence 12 → 31 », d'après `scales.score`. L'inspecteur (`src/ui/tracks/view-model.ts`) affiche `detail` dans la bande, sous le mot, comme il affiche déjà `reason`.
- *Pourquoi :* un champ générique reste réutilisable par d'autres filtres, par exemple pour une rime ou un nombre de syllabes. Un champ `score` serait propre au V+n.

### 5. Le fichier d'échelles et son script (adapters, scripts)
- **Sources.** Les quatre TSV d'openlexicon se téléchargent dans `data/brut/autres/openlexicon/`, qui n'est pas versionné (`.gitignore`), comme le GLÀFF. `docs/lexiques.md` donne leurs URL (`https://lexique.org/databases/<base>/<fichier>.tsv`) et la date de téléchargement. Le fichier dérivé, lui, est versionné.
- **Le script.** `scripts/build-scales.ts`, lancé par `npm run build:scales`, s'appuie sur des fonctions pures et testées placées dans `src/adapters/lexicon/openlexicon-scales.ts`, comme `glaff-phonetics.ts`. Il procède ainsi :
  1. Il lit chaque base avec sa colonne de note : Gobin `Valence`, `Arousal` et `C.gram` ; Bonin 2018 `Valence.Mean`, `Arousal.Mean` et `Concreteness.Mean` ; Bonin 2003 `ValEmo.Moy` et `Concr.M` ; Gilet `val_g` et `aro_g`.
  2. Il ramène chaque mot à un lemme de nom (`nounReadings`) ou d'adjectif (`adjectiveReadings`), avec la morphologie Grammalecte chargée depuis `data/`. Pour Gobin, la catégorie vient de `C.gram` ; un mot « adj./nom » entre dans les deux échelles. Pour les autres bases, c'est celle de la base : des noms pour Bonin, des adjectifs pour Gilet. Pour un participe adjectivé, le lemme d'adjectif est l'infinitif (« abandonner »), comme dans la morphologie.
  3. Il convertit chaque note en rang percentile dans sa base, de 0 à 1, en traitant les ex aequo.
  4. Il fait la moyenne des rangs d'un même lemme sur les différentes bases, puis l'arrondit à un score de 0 à 100.
  5. Il compte et affiche les entrées écartées.
- **Le format.** `data/echelles-oulipao.tsv` a pour colonnes `order`, `category`, `lemma` et `score`. Un en-tête `#` porte la licence et les quatre références.
- **Le chargement.** `loadScales` (`src/adapters/morphology/in-memory-scales.ts`) valide chaque ligne avec zod et construit les listes triées, en départageant les ex aequo par ordre alphabétique pour que le résultat soit déterministe.
- *Pourquoi le rang plutôt que les z-scores :* les quatre échelles ne sont pas linéaires entre elles (de −3 à +3, de 1 à 5, de 1 à 3, de 1 à 7). Le rang est robuste et suffit, puisque seul l'ordre compte pour le décalage. Le score de 0 à 100 ne sert qu'à l'affichage.

### 6. Chargement à la demande (ui)
`createScalesLoader(base)` dans `composition.ts` suit le modèle de `createPhoneticsLoader`, avec sa propre `SCALES_VERSION`. Le contrôleur gagne un état `scales: Loading` et lance le chargement dès qu'une instance S+n active a un ordre autre qu'alphabétique. Il passe ensuite `scales` à `buildView` puis aux ressources des plugins. L'erreur et le bouton « Relancer » reprennent l'affichage de la phonétique (`app.ts`).

## Risks / Trade-offs

- **Le lemme lu en premier n'est pas toujours le bon.** `adjectiveReadings(word)[0]` peut être une lecture absente de l'échelle alors qu'une autre lecture y figure. → Dans la vue ordonnée, aucune correction en v1. Un test documente le cas ; on corrigera s'il gêne un texte.
- **Les échelles sont courtes.** Avec environ 2 700 noms et 1 100 adjectifs, et moins encore en « même genre », un grand décalage fait vite le tour de l'échelle. → C'est le même modulo que pour le dictionnaire. L'aide indique le nombre de mots de l'échelle.
- **Des formes fléchies dans les sources** (« matons », « démoli »). → La réduction au lemme par Grammalecte (étape 2) les traite, et le script compte ce qu'il perd. On vérifie le compte à la première construction.
- **La licence.** Le README d'openlexicon place les bases sans licence propre sous CC BY-SA 4.0, et aucune des quatre fiches ne déroge. → On le note dans `THIRD_PARTY_LICENSES.md`, avec le lien vers le README. Si un auteur conteste, on retire sa base et on reconstruit.
- **Le champ `detail` s'ajoute à `WordMarkSchema`.** → Le champ est optionnel : les marques existantes restent valides, et le carnet ne stocke pas les marques.

## Migration Plan

Aucune migration n'est nécessaire. `order` a une valeur par défaut, et les chaînes du carnet se relisent en ordre alphabétique. Pour revenir en arrière, il suffit d'annuler la PR : le fichier d'échelles n'est chargé que si l'ordre est choisi.
