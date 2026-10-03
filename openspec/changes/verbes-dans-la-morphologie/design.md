# Design : les verbes dans la morphologie

## Context

Voir `proposal.md` pour le pourquoi, et les specs du changement pour les exigences.

L'état actuel :

- **Morphologie.** `MorphologyRepository` (`src/ports/morphology.ts`) sert les noms, les adjectifs et les adverbes. Elle les lit dans `data/morpho-oulipao.tsv` (6 Mo, 1,6 Mo compressé), dérivé de Grammalecte par `src/adapters/lexicon/grammalecte-morphology.ts`.
- **Chargement.** Le contrôleur de la page à pistes charge ce fichier en même temps que le modèle d'étiquetage (`preload`), avant tout calcul. `buildView` passe `{ morphology }` à `runChain`, et `apply` est synchrone.
- **Le lexique brut.** Il compte 353 363 lignes de verbes pour 8 403 infinitifs. Une ligne porte une classe (`v1_it_x__a`, le préfixe `v0` désigne *être* et *avoir*) puis des traits mêlés : temps (`infi ipre iimp ipsi ifut cond spre simp impe ppre ppas`), personnes (`1sg … 3pl`, `1isg`, `1jsg`, parfois suivies de `!`) et, pour le participe passé, genre et nombre. Une même ligne peut cumuler plusieurs temps et personnes (`mange` : `ipre spre 1sg 3sg`).
- **Les étiqueteurs.** Les trois rangent les auxiliaires sur la piste `verb` ; CamemBERT distingue les modes dans ses étiquettes, mais `TaggedWord` ne garde que la catégorie.

## Goals / Non-Goals

**Goals:**
- Un port des verbes distinct, chargé à la demande, pour que le S+7 sur les noms ne paie pas les verbes.
- Un seul moteur de remplacement des verbes, partagé par le V+n et le lipogramme, comme `formInParadigm` l'est pour les adjectifs.
- Le contrat des filtres reste synchrone ; l'attente se règle dans l'hôte.

**Non-Goals:**
- Garder le mode fin de l'étiqueteur dans `TaggedWord` pour lever les ambiguïtés : cela changerait le port `Tagger` et les trois adaptateurs. L'heuristique du pronom suffit pour une première version.
- Réaccorder le sujet ou les participes après *être*.
- Fusionner les verbes dans `morpho-oulipao.tsv`.

## Decisions

### 1. Un port à part, `VerbRepository`, plutôt que d'étendre `MorphologyRepository`

**Module** : `src/ports/verbs.ts`, couche ports.

Le port offre trois méthodes :
- `infinitives()` : les infinitifs dans l'ordre du dictionnaire, sans *être* ni *avoir* ;
- `readings(form)` : les lectures d'une forme ;
- `forms(infinitive)` : toutes les formes d'un verbe, que le domaine filtre selon les traits voulus (comme `nounForms` pour les noms).

Une quatrième, `blocksElision(form)`, couvre les verbes à h aspiré (*haïr*, *hurler*).

*Pourquoi.* Le chargement à la demande impose que les verbes arrivent après la morphologie. Avec un seul port, il faudrait soit tout charger d'un coup, soit un objet à moitié rempli dont les méthodes changent de réponse avec le temps. Deux ports gardent chaque objet immuable une fois construit.

*Alternative écartée.* Étendre `MorphologyRepository` avec des méthodes de verbes qui rendent vide tant que rien n'est chargé. C'est plus simple à câbler, mais l'état caché brouille les tests et les raisons affichées.

### 2. L'entité `VerbForm` dans le domaine

**Module** : `src/domain/verb.ts`, couche domaine, dépend du port `VerbRepository`.

Le schéma zod `VerbFormSchema` porte :
- `form` et `infinitive` ;
- `tense` (énumération de onze valeurs : `infinitive`, `indicative-present`, `indicative-imperfect`, `simple-past`, `future`, `conditional`, `subjunctive-present`, `subjunctive-imperfect`, `imperative`, `present-participle`, `past-participle`) ;
- `person` (`1s … 3p`), absente pour les formes non personnelles ;
- `gender` et `number` pour le participe passé.

Le type `VerbFeatures` est la même entité sans `form` ni `infinitive`. Le même module contient trois fonctions pures :
- `pickVerbReading(word, previousWord, verbs)` : l'heuristique du pronom ;
- `shiftVerb(word, previousWord, offset, verbs)` : le V+n ;
- `neighbourVerb(word, previousWord, letter, verbs)` : le voisin sans la lettre.

Elles rendent une forme ou une raison, sur le modèle de `AdjectiveShift`.

### 3. Une ligne par lecture dans le fichier dérivé

**Modules** : `src/adapters/lexicon/grammalecte-verbs.ts` (dérivation, couche adaptateurs, appelée par `scripts/build-verbs.ts`) et `src/adapters/morphology/in-memory-verbs.ts` (lecture, implémente `VerbRepository`, dépend du port `TextSource`).

Le format est `V<TAB>forme<TAB>infinitif<TAB>temps<TAB>personne|genre+nombre|-<TAB>0|1`. Une ligne brute qui cumule des temps et des personnes s'éclate en autant de lignes. Les étiquettes `1isg` et `1jsg` (formes d'inversion, *puissé-je*) et les marques `!` sont abandonnées. Les lignes `v0` (auxiliaires) restent dans le fichier pour que les filtres les reconnaissent, mais `infinitives()` les écarte de l'ordre du dictionnaire.

*Pourquoi.* Un format plat se valide ligne à ligne par un `z.tuple`, comme `morpho-oulipao.tsv`, et l'adaptateur n'a qu'à indexer.

*Alternative écartée.* Garder les traits groupés (`ipre,spre;1sg,3sg`) pour alléger le fichier : la compression gzip du serveur rattrape l'essentiel de la redondance, et le parseur serait plus fragile. On mesure à la dérivation. Si le fichier compressé dépasse 4 Mo, on revient sur ce choix avant de poursuivre (tâche 1.4).

### 4. Les ressources des filtres gagnent `verbs?`

`PluginResources` devient `{ morphology; verbs?: VerbRepository }`. Le S+n et le lipogramme consultent `verbs` pour la piste `verb`. Quand il manque, chaque verbe visé reste avec la raison « conjugaisons en cours de chargement ».

*Pourquoi.* `apply` reste synchrone et pur ; c'est l'hôte qui attend. Un filtre testé sans verbes garde son comportement.

### 5. Le contrôleur charge les verbes quand la chaîne les vise

**Modules** : `src/ui/composition.ts` (`createVerbsLoader`, `VERBS_VERSION`) et `src/ui/tracks/controller.ts`, couche ui.

Après chaque geste qui change la chaîne, le contrôleur regarde si une instance active vise `verb`. Si c'est le cas et que les verbes ne sont pas chargés, il lance le chargement une seule fois. À l'arrivée, il refait `rebuild` ; en cas d'échec, il garde l'erreur et permet de relancer, comme pour la morphologie.

Le lipogramme vise toutes ses pistes par défaut : brancher un lipogramme déclenche donc le chargement. C'est voulu, puisqu'il traite désormais les verbes ; la chaîne par défaut de la page (le S+7 sur les noms) ne le déclenche pas.

### 6. L'heuristique du pronom pour les formes ambiguës

On regarde le mot qui précède le verbe :
- *je*, *j'* : première personne du singulier ;
- *tu* : deuxième du singulier ;
- *il*, *elle*, *on* : troisième du singulier ;
- *nous*, *vous*, *ils*, *elles* : les personnes du pluriel correspondantes.

Si un pronom réfléchi ou un pronom complément s'intercale (*je me*, *je le*), on regarde un mot plus haut, pas davantage.

Parmi les lectures qui restent, l'ordre de préférence des temps est le suivant :
1. les temps de l'indicatif (présent, imparfait, passé simple, futur) ;
2. le conditionnel ;
3. le subjonctif ;
4. l'impératif ;
5. le reste.

Enfin, on préfère la troisième personne.

*Alternative écartée.* Faire passer le mode de CamemBERT par `TaggedWord`. Ce serait plus juste, mais cela touche trois adaptateurs et le port `Tagger` (voir Non-Goals).

### 7. L'élision se généralise

`elides(word, lexicon)` dans `src/domain/s7/elision.ts` accepte tout objet doté de `blocksElision` : les appelants actuels passent toujours la morphologie, sans changement ; les verbes passent un objet qui consulte les deux lexiques. Un helper `fixPronounElision(words, index, …)` du module verbe rétablit ou élide *je*, *me*, *te*, *se*, *ne*, *le* et *la*, sur le modèle de `fixElision` des adjectifs.

## Risks / Trade-offs

- **[Lecture fausse pour une forme ambiguë sans pronom]** Par exemple « que mon frère finisse », où le subjonctif n'est pas reconnu. → La raison n'est pas affichée parce que le verbe est bien remplacé. On le documente dans `docs/s7.md`, et on garde la porte ouverte au mode de l'étiqueteur.
- **[Poids du fichier]** Plusieurs mégaoctets de plus pour qui vise les verbes. → On mesure à la dérivation (tâche 1.4). Le fichier est servi compressé et à part ; une adresse versionnée le laisse en cache.
- **[Verbes défectifs et impersonnels]** Avec *falloir*, *pleuvoir*, *gésir*, beaucoup de verbes restent. → La raison le dit ; le décalage reste strict, comme pour les adjectifs, pour que le V+7 soit le V+7.
- **[L'auxiliaire étiqueté verbe]** Il compte parmi les mots laissés dans le résumé. → Sa raison est explicite (« auxiliaire »).
- **[Temps de calcul]** Le lipogramme parcourt les infinitifs jusqu'à trouver une forme sans la lettre. → Au pire 8 400 essais par verbe, avec une recherche indexée par (infinitif, traits). Le scénario « Changer de lettre » (moins d'une demi-seconde pour 200 mots) sert de garde-fou ; on mesure dans les tests.

## Migration Plan

Pas de donnée utilisateur à migrer. L'état de la chaîne ne garde pas de verbes. Le changement de la spec du lipogramme est un changement de comportement visible : les verbes changent désormais. Il est annoncé dans la note de version. Pour revenir en arrière, on rétablit le cas `verb` du lipogramme et on retire la piste du S+n ; le fichier des verbes reste inerte.
