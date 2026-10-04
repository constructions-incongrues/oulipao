# Design

## Context

Voir `proposal.md` pour le pourquoi, et les specs `ciselure`, `alphabet-augmente` et `monitoring-vocal` pour les exigences.

L'état observé dans le code :

- **Les moteurs non ciblables qui agissent sur tout le texte**, comme `edge` et `lineation`, passent par `plainWords`, `linesOf` (`src/domain/lines.ts`) et `removeWord` (`src/domain/removal.ts`). Ils respectent `scope.skip` en marquant `CLOSED` (`src/domain/reasons.ts`), et ils s'inscrivent dans `src/domain/registry.ts`.
- **`linesOf` ne coupe que sur les sauts de ligne.** Aucun découpeur de phrases n'existe, et le PRD n'en demande pas.
- **Les règles graphème → phonème de `src/domain/phonetics/fallback.ts`** avancent dans le mot règle par règle (`guessPhonemes`). Chaque règle consomme un intervalle de lettres et produit ses phonèmes, mais ces intervalles ne sont pas exposés.
- **Aucun découpage en syllabes écrites.** `syllabify` travaille sur des phonèmes et reste privé.
- **L'écoute lit seulement `view.segments`**, c'est-à-dire le résultat (`listening-controller.ts`, `wordsAtStep`). La vue garde les mots d'origine dans `view.stages[0].words`. La mention reçoit un seul booléen, dans `withListening` (`view-model.ts`).

## Goals / Non-Goals

**Goals :**
- Des règles pures, déterministes, testées sans port.
- La discrépance comme réglage de l'écoute : aucun moteur nouveau n'en a besoin.

**Non-Goals :**
- Une syllabation écrite exacte, la phonologie complète du français, des onomatopées « justes ».

## Decisions

### Ciselure (couche domain, `src/domain/chisel/`)
- **Le fichier `tiers.ts`** contient les fonctions pures `firstWrittenSyllable`, `vowelsOf`, `initialOf` et `BREATH = 'pfou'`. Il ne dépend d'aucun port.
- **La syllabe écrite** se compose des consonnes d'attaque, du groupe de voyelles, puis d'une seule consonne de coda, prise seulement si une autre consonne la suit : « vieux » donne « vieu », « chat » donne « cha », « dort » donne « dor ». *ponytail : heuristique d'écriture ; le plafond, ce sont les mots comme « oignon » ; on passera par la syllabation phonétique si ça gêne.*
- **Les paliers sont cumulatifs.** À partir du palier 1, les mots de la piste « autres » sont retirés avec `removeWord`. Les paliers 2 à 5 remplacent la sortie des mots restants. La casse suit `matchCase`, comme dans les autres moteurs.
- **Le palier d'un vers** vaut `min(final, ceil(n / perTier))`, où `n` est le rang du vers dans `linesOf`. Le vers 0 reste au palier 0.
- **Les paramètres** sont `final` (1 à 5) et `perTier` (1 à 9), tous deux entiers.
- Le moteur s'écrit sur le modèle d'`edge`. Il ne dépend que de `plugin.ts`, `mixing.ts`, `lines.ts`, `removal.ts` et `reasons.ts`.
- **Alternative écartée :** un découpeur de phrases pour la prose, que le fondateur a écarté au profit d'une Mise en vers placée avant.

### Alignement lettres ↔ sons (couche domain, `src/domain/phonetics/fallback.ts`)
- `alignLetters(word)` rend `{ start, end, phonemes }[]`. Il vit à côté de la table, dans `fallback.ts`, et `guessPhonemes` en dérive : une seule source de règles, sans import circulaire. Les deux restent équivalents : `guessReading` doit garder les mêmes résultats, ce que ses tests existants vérifient.
- **Alternative écartée :** aligner la lecture du lexique sur les lettres. Il faudrait un alignement par programmation dynamique, sans données pour le valider. Les règles donnent les lettres directement.

### Alphabet augmenté (couche domain, `src/domain/body-alphabet/`)
- **Un paramètre à choix**, `replace`, parmi `punctuation`, `sounds` et `both`.
- **La ponctuation** est remplacée dans les blancs : une virgule devient un souffle, un point un claquement, ! et ? un sifflement. La table est fixée par le test du 2026-10-04 : seules, souffle `pfou`, claquement `clac`, sifflement `fuit` ; dans un mot, /f/ → `pf`, /k/ → `tk`, /s/ → `tss`, collés aux autres lettres.
- **Les sons :** les intervalles d'`alignLetters` (`fallback.ts`) dont les phonèmes contiennent /s/, /f/ ou /k/ sont remplacés par l'onomatopée correspondante. Une lettre muette, sans phonème, reste écrite.
- Ce moteur n'est **pas phonétique** au sens de `plugin.phonetic` : il ne charge aucune textbank.

### Discrépance (couches ports, domain et ui)
- **Port :** `MonitoringPreferencesSchema` reçoit un champ `source: 'result' | 'original'`, `'result'` par défaut. L'adaptateur `localStorage` ne change pas, puisqu'il sérialise le schéma.
- **Domaine :** `originalWordsAtStep(stages[0].words, tracks, audible, index)` rend le mot d'origine sans ponctuation, ou rien si sa piste n'est pas audible.
- **Interface :** la boucle de `listening-controller.ts` lit `state.source` à chaque pas. `TracksState` reçoit `discrepant`, mis à vrai au lancement de la lecture en « original » et remis à faux avec `listened`. `withListening(mention, listened, discrepant)` ajoute « écouté en discrépance » après « réglé en écoutant ». Le transport reçoit un `Control` à choix, « La voix dit ».

## Risks / Trade-offs

- **La syllabation écrite se trompe sur certains mots** (« oignon », « second »). → C'est accepté : le palier reste lisible, la règle reste énoncée, et le plafond est noté dans le code.
- **La synthèse vocale peut épeler les onomatopées** (« hh » lu « ache ache »). → La vague 2 attend le test du fondateur, et la table se change sans toucher au moteur.
- **Exporter la table de `fallback.ts`** touche un module partagé par les rimes. → Ses tests existants doivent passer sans modification.

## Open Questions

- **Test des onomatopées du 2026-10-04 :**
  - « chaitsse » (le son collé dans le mot) est lu correctement. La notation collée est donc retenue pour les sons à l'intérieur des mots.
  - Les onomatopées seules (« hh », « tk », « tss », « fff ») sont épelées lettre par lettre. Ça touche la ponctuation de l'alphabet augmenté et le souffle du palier 5 de la Ciselure (`BREATH = 'hh'`). Le second test a retenu `pfou`, `fuit` et `clac` pour les formes seules, et `pf`, `tk`, `tss` collés dans les mots, que la voix lit comme des syllabes.

