# Conception : les schémas de rimes

## Context

Ce qui existe déjà :

- **Le moteur.** `applyRhymeFilter` (`src/domain/rhyme/engine.ts`) appelle `decide` mot par mot, de façon paresseuse et dans l'ordre des catégories (noms, puis adjectifs et adverbes, puis verbes), pas dans l'ordre du texte. `decide` ne peut donc pas porter d'état propre à une strophe.
- **Le précédent de l'antirime.** L'antirime contourne cette limite par une pré-passe : `layoutVerse`, puis `probe`, construisent une `Map<index, Decision>` que lisent ensuite `eligible` et `decide`.
- **Le e muet.** Il est déjà reconnu dans `lookup.ts`, mais par une expression privée.
- **Les vers.** `VersePlace` connaît `line`, `stanza` et `lineEnd`, mais pas `lineStart`.
- **L'enregistrement.** Les filtres sont enregistrés dans `installedPlugins` (`src/ui/tracks/mixer-state.ts`).
- **La chaîne.** `runChain` lève une erreur si un filtre change le nombre de mots.

## Goals / Non-Goals

**Goals :**

- une seule mécanique de pré-passe pour l'antirime, les schémas, l'antérime et la rime berrychonne ;
- un calcul des lettres par strophe pur et testable seul ;
- une API de pré-passe gelée dès la vague 0, pour que les filtres de la vague 1 se construisent en parallèle sans toucher `engine.ts`.

**Non-Goals :**

- les refrains : ils sortent de l'alignement mot à mot et ont leur propre proposition ;
- toute modification de `runChain` ;
- toute donnée nouvelle.

## Decisions

### 1. Pré-passe planifiée partagée

**Domain.** On extrait de l'antirime un helper `planByVerse(text, tagged, resources, targets, scope, plan)` dans `engine.ts`. Il fait trois choses :

1. il calcule `layoutVerse` ;
2. il donne à `plan` les places et une sonde (`probe`) ;
3. il renvoie les `eligible` et `decide` qui lisent la `Map` produite.

On l'utilise pour l'antirime, le schéma, l'antérime et la rime berrychonne. Il ne dépend que du port `PhoneticsRepository`, déjà présent dans `PluginResources`.

**Alternative écartée :** rendre `decide` ordonné par le texte. Ce serait modifier le moteur partagé par le R+n et le S+n, et perdre la paresse du chargement par catégorie.

### 2. Lettres par strophe

**Domain**, fichier `scheme.ts`, pur, sans port. `lettersFor(scheme, stanzaLength)` renvoie une lettre par vers, ou `null` pour un vers libre :

- **les schémas de longueur fixe** (plates, croisées, embrassées, bisexuelle) se répètent depuis le début ;
- **l'étreinte** se calcule en miroir sur la longueur de la strophe ;
- **le vers du milieu** d'une strophe impaire en étreinte est libre.

### 3. Genre de la rime

**Domain**, fichier `rhyme.ts`. `rhymeGender(form, phonemes)` réutilise le e muet, qui sort de `lookup.ts` pour être partagé. Pour « -ent », il faut en plus que le dernier phonème lu ne soit pas une voyelle : « chantent » /ʃɑ̃t/ est féminin, « souvent » /su.vɑ̃/ est masculin.

Le fondateur a laissé ouverte la question « le e muet suffit-il ? ». On la tranche ainsi : la règle graphique corrigée par la lecture. On n'utilise pas un champ de genre tiré du lexique, que GLÀFF ne fournit pas.

`GenderSchema` (zod : `any`, `masculine`, `feminine`, `alternate`) est partagé par le monorime et le schéma.

### 4. Vers sans voisin qui rime

Le PRD laissait la question ouverte. On garde le mot, avec sa raison, comme le font déjà le R+n et le monorime. On ne change pas la rime de toute la lettre : la règle reste lisible (« la contrainte est explicite »), et une lettre dont la rime glisse serait opaque.

### 5. Découpe de la rime pour la rime berrychonne

**Domain**, fichier `rhyme.ts`. `splitRhyme(rhyme)` donne `{ vowel, coda }`. Les deux combinaisons croisées (coda de l'une avec la voyelle de l'autre) sont essayées dans l'ordre du dictionnaire.

### 6. Couches

| Module | Couche | Ports |
|--------|--------|-------|
| `phonetics/rhyme.ts`, `rhyme/scheme.ts`, `verse.ts` | domain | aucun |
| `rhyme/engine.ts`, `rhyme-scheme.ts`, `anterhyme.ts`, `berrychonne.ts`, `monorhyme.ts` | domain | `PhoneticsRepository`, et `MorphologyRepository` via les ressources du plugin |
| `mixer-state.ts`, `view-model.ts`, `inspector.ts` | ui | aucun nouveau |

## Risks / Trade-offs

- **[Risque] Un schéma sur une prose.** Tous les mots sont sur un seul vers : rien ne se passe. → La raison le dit (« un seul vers »), et l'aide renvoie vers la mise en vers.
- **[Risque] Peu de candidats au genre alterné.** Combinés, la rime riche et le genre féminin raréfient les mots. → Le mot reste avec sa raison. La relecture de la clôture mesure ce taux.
- **[Compromis] `probe` ignore le contexte d'accord.** C'est déjà le cas dans l'antirime. → On l'accepte : l'accord se fait au remplacement final.
- **[Risque] La lettre dans l'inspecteur.** L'inspecteur lit les mots d'origine. → La lettre se calcule sur le texte qui entre dans le filtre de schéma. Elle n'est montrée que si ce filtre est actif.
