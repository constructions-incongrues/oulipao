# Tasks: Lipogramme

Build Plan — 6 tasks across 4 waves

- Wave 0 (foundation, build first, then merge): Task 1
- Wave 1 (parallel after Wave 0): Tasks 2, 3, 4
- Wave 2 (after Wave 1): Task 5
- Wave 3 (after Wave 2): Task 6

Max parallel width: 3. Critical path: 4 waves.

Effort : S = une demi-journée, M = une journée, L = deux à trois jours. Total : environ 8 jours. Fondation = 12 % de l'effort.

Contraintes du projet (voir `openspec/config.yaml`) : TypeScript strict, architecture hexagonale, entités validées par schémas zod, couverture supérieure à 90 %, symboles en anglais, commentaires et documentation en français. Chaque fichier de `src/domain/lipogram/` est autonome : pas de fichier d'index partagé entre tâches parallèles.

## 1. Wave 0 — Fondation

- [x] 1.1 Contrat : chaîne de plugins et portée « toutes les pistes » (M, dépend de : rien ; exigences 5, 6, 8)
  - `src/domain/plugin.ts` : `track` accepte `'all'` ; une marque de mot « retiré » ; `apply` reçoit la sortie du plugin précédent, alignée sur les mots du texte d'origine. Trancher la question ouverte « Chaîne et texte d'origine » du design.
  - `src/domain/s7/plugin.ts` adapté au nouveau contrat.
  - `src/ui/tracks/{types,mixer-state,view-model}.ts` : une liste ordonnée de plugins installés, chacun en marche ou coupé avec ses réglages ; un geste pour changer l'ordre ; la chaîne rejouée dans `buildView`.
  - `docs/plugins.md` : ce que le lipogramme change au contrat, et pourquoi.
  - Acceptance : avec le S+7 seul installé, la page se comporte à l'identique et tous les tests existants passent.

## 2. Wave 1 — En parallèle

- [x] 2.1 Voisins sans la lettre : noms, adjectifs, adverbes (L, dépend de : rien ; exigences 2, 3)
  - `src/ports/morphology.ts` et `src/adapters/morphology/in-memory-morphology.ts` : la liste des adverbes ; les données dérivées du lexique (`data/lexique-potao.tsv` porte la catégorie de chaque forme), avec le script de construction.
  - `src/domain/lipogram/neighbour.ts` : pour un nom ou un adjectif, le premier lemme qui le suit dans l'ordre du dictionnaire, sans la lettre, qui a la forme au même genre et au même nombre ; pour un adverbe, le premier adverbe sans la lettre. Rien si aucun voisin n'existe.
  - Acceptance : tests sur le petit dictionnaire de test : voisin trouvé, traits gardés, absence de voisin signalée.
- [x] 2.2 Table des mots-outils sans la lettre (S, dépend de : rien ; exigence 4)
  - `src/domain/lipogram/function-words.ts` : pour chaque mot-outil courant (déterminants, pronoms, prépositions, conjonctions), ses équivalents de même fonction, et une recherche « équivalent sans la lettre » ; table validée par un schéma zod.
  - La table pour le « e » est soumise au fondateur avant la tâche 3.1.
  - Acceptance : tests : « le » sans « e » donne un équivalent sans « e » ; un mot-outil sans équivalent est signalé.
- [x] 2.3 Emplacement « Toutes les pistes » et ordre de la chaîne dans la page (M, dépend de : 1.1 ; exigences 5, 6, 7, 8)
  - `src/ui/tracks/app.ts` et un composant d'emplacement sous la table de mixage, dessiné d'après la déclaration du plugin ; un geste pour changer l'ordre de la chaîne.
  - `src/ui/tracks/view-model.ts` : résumé et mention de la chaîne (« — S+7, parmi tous les noms · lipogramme en e (Potao) ») ; décomptes des mots remplacés, retirés, et des verbes qui gardent la lettre.
  - `tracks.html` : styles avec les variables de `styles/tokens.css`.
  - Acceptance : tests des composants et de la vue avec un plugin d'essai de portée `'all'`.
  - GUI test : 1. Ouvrir `tracks.html` et mettre l'exemple en pistes. 2. Vérifier qu'un emplacement « Toutes les pistes » apparaît sous les cinq pistes. 3. Inverser l'ordre de la chaîne. 4. Le résumé décrit la chaîne dans le nouvel ordre.

## 3. Wave 2

- [x] 3.1 Plugin lipogramme (L, dépend de : 1.1, 2.1, 2.2 ; exigences 1, 2, 3, 4)
  - `src/domain/s7/engine.ts` : la réécriture des noms et le réaccord extraits pour être partagés, avec une fonction qui choisit le remplaçant d'un nom ; le S+7 garde exactement son comportement.
  - `src/domain/lipogram/plugin.ts` : paramètre « Lettre » (a à z, « e » par défaut) ; noms, adjectifs et adverbes remplacés par leur voisin, mots-outils par la table ou retirés, verbes laissés et marqués.
  - Acceptance : tests : pas de « e » hors verbes dans le résultat d'un texte d'essai ; réaccord des déterminants et adjectifs ; les tests du S+7 passent sans changement.

## 4. Wave 3

- [x] 4.1 Installation et vérification sur les 3 textes de référence (S, dépend de : 2.3, 3.1 ; critères de réussite)
  - `src/ui/tracks/mixer-state.ts` : le lipogramme installé, coupé à l'ouverture, après le S+7.
  - Vérification dans le navigateur sur les 3 textes de référence de 200 mots : 0 « e » hors verbes ; remplacements relus à la main ; S+7 puis lipogramme ; réglage en moins d'une demi-seconde ; 0 requête contenant le texte.
  - `RESULTATS.md` : section « Lipogramme » avec le décompte ; `docs/tracks.md` mis à jour.
  - Acceptance : les critères de réussite du PRD sont consignés, chacun avec son constat.
  - GUI test : 1. Ouvrir `tracks.html`, coller le texte de référence 1. 2. Mettre le lipogramme en marche, lettre « e ». 3. Le texte résultant ne contient aucun « e » hors verbes et le résumé compte les mots remplacés, retirés et les verbes fautifs. 4. Copier : la mention décrit la chaîne.
