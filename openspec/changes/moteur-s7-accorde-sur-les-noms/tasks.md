# Tasks: Moteur S+7 accordé sur les noms

Build Plan — 9 tasks across 5 waves

- Wave 0 (foundation, build first, then merge): Task 1
- Wave 1 (after Wave 0): Task 2
- Wave 2 (parallel after Wave 1): Tasks 3, 4, 5, 6
- Wave 3 (parallel after Wave 2): Tasks 7, 8
- Wave 4 (after Wave 3): Task 9

Max parallel width: 4. Critical path: 5 waves.

Effort : S = une demi-journée, M = une journée. Total : 7,5 jours. Fondation (vagues 0 et 1) = 20 % de l'effort.

Contraintes du projet (voir `openspec/config.yaml`) : TypeScript strict, architecture hexagonale, couverture supérieure à 90 %, entités validées par schémas zod, symboles en anglais, commentaires et documentation en français.

## 1. Wave 0 — Migration

- [x] 1.1 Migration TypeScript et structure hexagonale (M, dépend de : rien ; contraintes du projet)
  - Couches : toutes. Outillage : `tsconfig.json` strict ; `tsc --noEmit` vérifie les types ; `esbuild` produit `dist/` pour le navigateur ; les tests tournent directement sur les `.ts` avec `node --test` ; `npm test` échoue sous 90 % de couverture (lignes, branches, fonctions).
  - Schémas zod pour les entités existantes (`Category`, `TaggedWord`, `ReferenceText`, entrée de lexique) ; les adaptateurs valident ce qu'ils lisent.
  - Domaine (`src/domain`) : `tokenizer.ts`, `categories.ts` (valeurs `noun`, `verb`, `adjective`, `adverb`, `other`), `comparison.ts`.
  - Ports (`src/ports`) : `tagger.ts` (interface `Tagger`).
  - Adaptateurs (`src/adapters/taggers`) : `lexicon-lookup.ts`, `fr-compromise.ts`, `camembert.ts`, et le registre. La logique d'alignement des sous-mots de CamemBERT est extraite en fonction pure et testée ; seul le chargement du modèle (111 Mo) est exclu de la couverture, nommément.
  - Interface (`src/ui`) : `page.ts` ; `index.html` charge `dist/`. Les libellés affichés restent en français.
  - Scripts migrés en TypeScript avec des noms anglais ; les identifiants français existants (`etiqueter`, `comparer`, `enregistrer`…) passent en anglais ; les commentaires restent en français.
  - Les fichiers de référence gardent leurs codes `{n} {v} {a} {r} {o}` ; le script de construction émet les valeurs anglaises ; `reference/FORMAT.md` est mis à jour.
  - Acceptance : `npm test` passe avec une couverture d'au moins 90 % ; le script de mesure redonne exactement 579/600, 532/600 et 486/600 ; la page d'essai fonctionne depuis `dist/`.

## 2. Wave 1 — Ports et contrats

- [x] 2.1 Ports et contrats du moteur (S, dépend de : 1.1 ; exigences 1, 5, 6)
  - Ports : `src/ports/morphology.ts` — interface `MorphologyRepository` (infos d'un nom par forme, forme d'un nom par lemme et nombre, lemmes triés, infos et forme d'un adjectif, prédicat « voyelle ou h muet »).
  - Domaine (`src/domain/s7`) : modules aux signatures exportées (écrits directement avec leur corps, une seule personne implémentant les vagues à la suite) — `substitution.ts`, `elision.ts`, `agreement.ts`, `engine.ts` ; dans `types.ts`, schémas zod `Substitution {index, original, replacement, status}`, `S7Options {offset, mode, category}` et entrées de morphologie (nom, adjectif), types déduits.
  - Domaine : `determiners.ts`, table complète des déterminants et contractions par genre, nombre et forme élidée (le/la/l'/les, un/une/des, du/de la/de l'/des, au/à la/à l'/aux, ce/cet/cette/ces, mon/ma/mes, ton/ta/tes, son/sa/ses).
  - Un port factice en mémoire pour tester le domaine sans lexique : `test/support/morphology.ts`, petit dictionnaire servi par `InMemoryMorphology` (`src/adapters/morphology/in-memory-morphology.ts`), la même classe qui sert le fichier dérivé.
  - `docs/s7.md` : ordre des étapes — substitution, accord (mode « réaccord » seulement), élision.
  - Les tâches suivantes ne modifient ces fichiers que pour remplir le corps de leur propre module.
  - Acceptance : Le projet compile ; un test vérifie que la table couvre chaque déterminant listé au singulier, au pluriel et sous forme élidée ; le port factice satisfait l'interface.

## 3. Wave 2 — En parallèle

- [x] 3.1 Adaptateur de morphologie et données dérivées (M, dépend de : 2.1 ; dépendances ; exigences 3, 4, 5, 6)
  - Adaptateurs : `src/adapters/morphology/tsv-morphology.ts` implémente `MorphologyRepository` à partir de `data/morpho-potao.tsv`.
  - `scripts/build-morphology.ts` dérive ce fichier du lexique Grammalecte (MPL 2.0) : noms et adjectifs avec forme, lemme, genre, nombre, et h aspiré pour les noms (note `pel` du lexique).
  - Lemmes triés dans l'ordre du dictionnaire français (`Intl.Collator('fr')`).
  - Ne modifie pas `data/lexique-potao.tsv`.
  - Acceptance : « horloge » rend féminin singulier et h muet, « héros » rend h aspiré, « chevaux » rend le lemme « cheval » au pluriel ; la liste triée est identique d'une exécution à l'autre.
- [x] 3.2 Substitution des noms (M, dépend de : 2.1 ; exigences 1, 2, 3, 4, 7)
  - Domaine : `src/domain/s7/substitution.ts` et son test uniquement ; testé avec le port factice.
  - Pour chaque mot de la catégorie visée (nom par défaut) : n-ième lemme suivant, n négatif admis ; nombre conservé.
  - Option « même genre » : le décompte ne porte que sur les lemmes du même genre ; un nom épicène garde le genre qu'il a dans la phrase.
  - Lemme absent, ou forme manquante au nombre voulu : nom laissé tel quel et signalé (`status`).
  - Acceptance : Même entrée, même sortie ; en « même genre », +7 puis −7 redonne les noms d'origine pour tout nom présent dans le dictionnaire.
- [x] 3.3 Élision et contraction (S, dépend de : 2.1 ; exigence 6)
  - Domaine : `src/domain/s7/elision.ts` et son test uniquement ; testé avec le port factice.
  - Fonction pure : à partir du ou des mots qui précèdent le groupe nominal et du premier mot du groupe, rendre les formes corrigées.
  - Couvre le / l', de le / du / de l', à le / au / à l', ce / cet, ma / mon devant voyelle ; respecte le h aspiré.
  - Acceptance : « le » + « horloge » donne « l'horloge » ; « de le » + « héros » donne « du héros » ; « au » + « école » donne « à l'école » ; « ma » + « amie » donne « mon amie ».
- [x] 3.4 Réaccord du déterminant et des adjectifs contigus (M, dépend de : 2.1 ; exigence 5)
  - Domaine : `src/domain/s7/agreement.ts` et son test uniquement ; testé avec le port factice.
  - Fonctions pures : mettre un déterminant et les adjectifs épithètes contigus au nom au genre donné, en conservant le nombre.
  - Adjectif sans forme au genre voulu : laissé tel quel et signalé.
  - Ne traite ni les attributs, ni les participes, ni les pronoms de reprise.
  - Acceptance : « la vieille » au masculin donne « le vieux » ; « un petit » au féminin donne « une petite » ; « ses grands » au féminin reste « ses » et donne « grandes ».

## 4. Wave 3 — En parallèle

- [x] 4.1 Assemblage du moteur, deux modes (M, dépend de : 3.2, 3.3, 3.4 ; exigences 1, 5, 6, 7, 8)
  - Domaine : `src/domain/s7/engine.ts` et son test uniquement.
  - `applyS7(text, taggedWords, options, morphology)` rend le texte transformé et la liste des substitutions.
  - Mode « même genre » : substitution puis élision. Mode « réaccord » : substitution, accord, puis élision.
  - Casse et ponctuation du texte d'origine conservées ; majuscule de début de phrase reportée sur le mot nouveau.
  - Acceptance : Sur des phrases d'essai (« La ferme de mon oncle », « l'horloge du village », « au camion »), chaque mode rend le texte attendu et la liste des substitutions ; deux exécutions donnent la même sortie.
- [x] 4.2 Affichage du résultat dans la page d'essai (S, dépend de : 2.1, 3.1 ; critère « le texte reste dans le navigateur » ; périmètre)
  - Interface : `index.html` et `src/ui/page.ts` uniquement.
  - Sous le texte étiqueté, afficher le texte transformé ; un champ numérique pour n (7 par défaut) et un sélecteur de mode.
  - S'appuie sur la signature de `engine.ts` fixée en 2.1 et sur l'adaptateur de morphologie ; aucune autre interface nouvelle.
  - Acceptance : Le texte transformé s'affiche et suit les changements de n et de mode.
  - GUI test (automatique si un outil de test de navigateur est disponible, sinon vérification manuelle) : 1. Ouvrir la page d'essai. 2. Coller un texte et lancer l'étiquetage. 3. Vérifier qu'un texte transformé s'affiche sous le texte étiqueté. 4. Passer n de 7 à 3 et vérifier que le texte transformé change. 5. Changer de mode et vérifier que le texte transformé change. 6. Vérifier dans l'onglet réseau qu'aucune requête ne contient le texte collé.

## 5. Wave 4 — Mesure

- [ ] 5.1 Mesure sur les textes de référence (M, dépend de : 3.1, 4.1 ; critères de réussite ; falsification)
  - Scripts : `scripts/transform-references.ts` transforme les 3 textes de référence, décalage 7, dans chaque mode, avec les étiquettes de référence, puis de bout en bout avec l'étiqueteur neuronal.
  - Sorties versionnées dans `resultats/s7/`, avec une grille de relecture listant chaque substitution et son groupe nominal.
  - Section « Moteur S+7 » dans `RESULTATS.md` : décompte par texte et par mode, mode retenu par défaut.
  - Le décompte des substitutions correctes est fait par le fondateur à la lecture ; la tâche n'est terminée qu'avec ce décompte.
  - Acceptance : `RESULTATS.md` donne, pour chaque texte et chaque mode, le nombre de substitutions correctes sur le total, et nomme le mode par défaut, avant le 8 novembre 2026.
