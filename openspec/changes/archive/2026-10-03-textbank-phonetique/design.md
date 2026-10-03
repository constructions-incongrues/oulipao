# Design : la textbank phonétique et les filtres de rime

## Context

Voir `proposal.md` (Why). L'état actuel qui façonne l'approche :

- **Le modèle de chargement à la demande existe : c'est celui des verbes.**
  - `createVerbsLoader` (`src/ui/composition.ts`) met le chargement en mémoire, avec une constante `VERBS_VERSION` pour forcer le rechargement après une nouvelle dérivation.
  - Le contrôleur (`src/ui/tracks/controller.ts`) suit l'état `verbs` (`idle`, `loading`, `ready`, `error`). `wantVerbs` déclenche le chargement quand une instance active vise les verbes, puis `rebuild`.
  - La ressource arrive aux contraintes par `PluginResources.verbs?`.
  - Pendant l'attente, chaque mot porte la raison `LOADING` (`src/domain/verb.ts`).
- **Le S+n a une couture pour filtrer les candidats.** `shift(lemmas, start, offset, counts)` (`src/domain/s7/substitution.ts`) parcourt la liste en boucle et ne compte que les lemmes pour lesquels `counts` est vrai. L'accord passe par `NounChooser` et `rewriteNouns` (`engine.ts`) ; le lipogramme les réutilise déjà.
- **Les sauts de ligne survivent dans les blancs.** `TaggedWord` n'a pas d'offsets, mais les blancs entre les mots gardent les `\n` : c'est `TextView.gap(i)` dans `s7/syntax.ts`, qui compte déjà les phrases sur `/[.!?…\n]/`. `OutputWord.gap` les transporte d'une étape à l'autre, et `plugin-chain.ts` relit la sortie et la remet sur les positions d'origine.
- **Le registre des contraintes** est `installedPlugins` dans `src/ui/tracks/mixer-state.ts`.
- **GLÀFF** est un fichier texte dont les champs sont séparés par `|` :
  - la forme ;
  - l'étiquette GRACE (par exemple `Ncfs`) ;
  - le lemme ;
  - les prononciations en API et en SAMPA, tirées du Wiktionnaire, plusieurs par champ ;
  - des fréquences.

  Le format exact est à vérifier sur l'archive au moment de la tâche 1.1.

## Goals / Non-Goals

**Goals:**

- Une textbank phonétique qui ne coûte rien à qui ne s'en sert pas.
- Un port assez étroit pour que les quatre contraintes et l'interface en dépendent sans connaître GLÀFF.
- Réutiliser l'accord du S+n plutôt que d'en écrire un second.
- R+n livrable et utilisable seul, avant monorime, antirime et homophonies.

**Non-Goals:**

- La syllabation métrique fine (diérèse, synérèse). Le compte de syllabes suit la prononciation du lexique, avec la seule règle du e muet devant consonne.
- Aligner les lemmes de GLÀFF sur ceux de Grammalecte. La prononciation est rattachée à la **forme** et à la **catégorie grossière**, pas au lemme.

## Decisions

### D1. GLÀFF comme source, jointure par forme et catégorie

Décision du fondateur (2026-10-03). GLÀFF est sous CC BY-SA 3.0, sans ambiguïté. Il couvre 192 000 formes et porte la prononciation en API. Lexique 3.83 est écarté tant que ses auteurs n'ont pas levé l'ambiguïté NC/SA (voir le PRD, l'analyse des quatre modalités).

Le script réduit chaque étiquette GRACE à la catégorie grossière d'Oulipao (`N`→nom, `A`→adjectif, `V`→verbe, `R`→adverbe, le reste→autre). Il garde une ligne par couple forme-catégorie-prononciation et calcule les syllabes et la rime au moment de la dérivation, une fois pour toutes.

- **Alternative écartée :** joindre par lemme à Grammalecte. Les lemmes divergent, et la rime ne dépend que de la forme.
- **Conséquence :** le R+n prend ses **candidats** dans Grammalecte (forme accordée, comme au S+n) et teste leur **rime** dans GLÀFF par la forme. Un candidat sans prononciation est phonétisé par le repli (D4).

### D2. Port `Phonetics` étroit, rime calculée dans le domaine

`src/ports/phonetics.ts`, couche **ports** :

```ts
interface PhoneticsRepository {
  readings(form: string, category?: Category): PhoneticReading[]; // syllabes de phonèmes ; toutes catégories sans elle
  homophones(phonemes: string, category: Category): string[];     // ordre du dictionnaire
}
```

Les rimes fréquentes du monorime ne passent pas par le port : elles sont fixées à la dérivation (D7).

La rime, la richesse, le e muet et le compte de syllabes d'un vers sont des fonctions **pures** de `src/domain/phonetics/`, couche **domain**. Elles se testent sans fichier.

- **Alternative écartée :** une méthode `rhymesWith` dans le port. Elle aurait figé la définition de la rime dans l'adaptateur et l'aurait dédoublée avec le repli.

### D3. Adaptateur en mémoire et chargement à la demande

`src/adapters/morphology/in-memory-phonetics.ts`, couche **adapters**, dépend du port `TextSource` :

- `parsePhonetics(tsv)` valide chaque ligne par zod ; un phonème hors de l'inventaire français est refusé.
- `loadPhonetics(source)` charge le fichier.

Un index `phonèmes → formes` sert les homophones.

Côté interface (couche **ui**), le schéma des verbes est copié tel quel :

- `createPhoneticsLoader` et `PHONETICS_VERSION` ;
- un état `phonetics` dans le contrôleur ;
- `wantResources(mixer)`, qui demande les verbes quand une instance active vise leur piste (comme avant) et les prononciations quand une instance active est phonétique.

`ConstraintPlugin` gagne un champ optionnel `phonetic?: boolean`. (Révisé à l'implémentation : un champ `needs` listant les verbes aurait été faux, puisque le besoin de verbes dépend des pistes visées par l'instance, pas du type.)

### D4. Phonétisation de repli par règles

`src/domain/phonetics/fallback.ts`, couche **domain**, pur. C'est une table ordonnée de règles graphème→phonème, de la plus longue à la plus courte (`eau`→o, `ain`→ɛ̃, `ch`→ʃ, `e` final muet…). Elle suffit pour donner une rime plausible, pas une prononciation exacte. Le résultat porte le drapeau `guessed`, qui devient la raison « prononciation devinée ».

- **Alternative écartée :** embarquer un modèle de conversion graphème-phonème (des centaines de kilo-octets, une licence de plus).

### D5. Vers et strophes dans le domaine, pas dans le contrat

`src/domain/verse.ts`, couche **domain**. `layoutVerse(text, tagged) → VerseInfo[]` prend un élément par mot : `{ line, stanza, lineEnd }`. Il se calcule à partir de `tokenize(text)` et des blancs. Les contraintes de rime l'appellent elles-mêmes sur le texte qu'elles reçoivent ; le contrat `apply(...)` ne change pas.

Les filtres ne déplacent ni n'ajoutent jamais de saut de ligne, et `reread` garde les blancs. La découpe reste donc stable dans la chaîne sans être transportée.

- **Alternative écartée :** ajouter `line` et `stanza` à `TaggedWord`. Il aurait fallu toucher l'étiqueteur et tous les tests de la chaîne pour une information que l'on recalcule en quelques lignes.

### D6. R+n par le n-ième voisin qui passe un critère

Révisé à l'implémentation. Le lipogramme avait déjà « le premier voisin, de même genre et de même nombre, que retient un critère » (sans la lettre), pour les noms, les adjectifs, les adverbes et les verbes. Ces fonctions deviennent génériques (`src/domain/neighbours.ts`, couche **domain**, et `nthVerb` dans `src/domain/verb.ts`) : le n-ième voisin qui passe un critère. Le lipogramme les appelle avec n = 1, sans changer de comportement. Le S+n n'est pas touché.

`src/domain/rhyme/engine.ts` (`applyRhymeFilter`), couche **domain**, dépend des ports `MorphologyRepository`, `VerbRepository` et `PhoneticsRepository`. Pour chaque mot visé, la contrainte décide d'un critère (`Decision`) ; le moteur passe par `rewriteNouns` pour les noms (groupe réaccordé), puis traite les adjectifs (élision), les adverbes et les verbes (`rewriteVerbs`). R+n (`rn.ts`) a pour critère « la forme rime avec l'original ».

- **Coût :** le moteur peut parcourir tout le dictionnaire d'une catégorie avant de trouver n rimes. Une rime riche rare donne un parcours complet (environ 50 000 noms), et le prédicat interroge la textbank à chaque lemme. Une mémoire `forme → rime` par appel suffit pour un texte de quelques centaines de mots. Ce plafond est à noter en `ponytail:` ; si la latence dépasse le budget de l'inspecteur, on passera à un index `rime → lemmes` précalculé à la dérivation.

### D7. Monorime, antirime et homophonies réutilisent R+n

Les trois contraintes sont dans `src/domain/rhyme/`, couche **domain**.

- **Monorime :** le critère devient « rime == rime choisie ». La liste fermée vient de `frequentRhymes(30)` à la dérivation (le nom le plus fréquent de chaque rime sert d'exemple). Le paramètre est un `choice` existant, qui demande les données : la liste est fixée à la dérivation et écrite dans un petit module généré, `src/domain/rhyme/frequent-rhymes.ts`. Aucun nouveau type de paramètre (E1 reste hors du changement).
- **Antirime :** on parcourt les fins de vers de chaque strophe dans l'ordre et on fixe d'avance le critère de chacune, « ne rime avec aucune fin précédente » ; une fin remplacée compte ensuite par la rime de son remplaçant, prévu sans le contexte de la phrase (`probe`).
- **Homophonies :** le critère est « fait partie de `homophones(phonèmes, catégorie)` », avec les mêmes traits. L'accord se fait comme au S+n.

### D8. Interface

- **Inspecteur** (`components/inspector.ts`, `view-model.ts` `InspectorColumn`) : une ligne « prononciation » de la forme `/ʃɛz/ · 1 syllabe · rime /ɛz/`.
- **Texte résultant** (`components/result.ts`) : un compte de syllabes en marge de chaque vers, en Martian Mono, couleur secondaire (`DESIGN.md`), masqué sans filtre phonétique.
- **Affichage en API.** SAMPA reste interne si la source l'impose.

## Risks / Trade-offs

- [Le format de GLÀFF diffère de ce qui est décrit ici] → la tâche 1.1 commence par lire l'archive. Le schéma zod refuse ce qui ne colle pas, sans rien deviner.
- [Les prononciations du Wiktionnaire sont incomplètes pour les formes fléchies] → la tâche 1.3 mesure la couverture (part des formes de Grammalecte sans prononciation) et la note dans `RESULTATS.md`. Le repli D4 couvre le reste, et la raison le dit.
- [La textbank pèse trop lourd] → ne garder que les formes présentes dans Grammalecte, puis mesurer. Le chargement à la demande protège la première page.
- [Le parcours de `shift` est lent sur les rimes riches rares] → mémoire par appel (D6) ; index précalculé seulement si on mesure une latence.
- [Le partage à l'identique s'impose aux réutilisateurs du fichier] → licence et attribution en en-tête, fichier séparé (spec `textbank-phonetique`). C'est un choix assumé du fondateur.
- [Le périmètre est large (revue du PRD)] → les tâches sont ordonnées pour que le R+n soit utilisable seul dès la vague 2. Monorime, antirime et homophonies viennent après, et peuvent s'arrêter là si le carnet reste vide (garde de la stratégie).

## Migration Plan

Aucune migration : il n'y a pas de données utilisateur, et le comportement des filtres existants ne change pas. Il faut relancer `npm run build:phonetics` puis augmenter `PHONETICS_VERSION` à chaque nouvelle dérivation. Pour revenir en arrière, il suffit de retirer les contraintes de `installedPlugins`.

## Open Questions

- Taille exacte de la liste fermée du monorime : 30 rimes est une valeur de départ. On la réglera à l'usage, sans toucher aux specs.
