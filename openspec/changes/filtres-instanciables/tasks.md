# Tasks: Filtres instanciables, ciblables et chaînables

Build Plan — 5 tasks across 3 waves

- Wave 0 (foundation, build first, then merge): Task 1
- Wave 1 (parallel after Wave 0): Tasks 2, 3, 4
- Wave 2 (after Wave 1): Task 5

Max parallel width: 3. Critical path: 3 waves.

Effort : S = une demi-journée, M = une journée, L = deux à trois jours. Total : environ 6,5 jours. Fondation = 15 % de l'effort.

Contraintes du projet (voir `openspec/config.yaml`) : TypeScript strict, architecture hexagonale, entités validées par schémas zod, couverture supérieure à 90 %, symboles en anglais, commentaires et documentation en français.

## 1. Wave 0 — Fondation

- [x] 1.1 Contrat et état des instances (M, dépend de : rien ; exigences 1, 2, 3, 4, 7, 9)
  - `src/domain/plugin.ts` : un type déclare les pistes qu'il sait traiter et ses pistes par défaut ; `apply` reçoit les pistes visées. S+n : noms et adjectifs (noms par défaut) ; lipogramme : les cinq pistes (toutes par défaut).
  - `src/domain/plugin-chain.ts` : les étapes de la chaîne portent leurs pistes visées.
  - `src/domain/s7/plugin.ts`, `src/domain/lipogram/plugin.ts` : déclaration et signature seulement, comportement inchangé.
  - `src/ui/tracks/{types,mixer-state,view-model,app}.ts` : liste ordonnée d'instances `{id, type, enabled, params, targets}` (schéma zod) ; gestes ajouter, dupliquer, retirer, cibler (au moins une piste, parmi celles du type), déplacer ; résumé et mention par instance, avec ses pistes sauf quand elle vise toutes celles de son type.
  - `docs/plugins.md` : type et instance.
  - Acceptance : avec les instances d'ouverture (un S+7 sur les noms, un lipogramme coupé), la page se comporte à l'identique et les tests existants passent.

## 2. Wave 1 — En parallèle

- [x] 2.1 Lipogramme ciblé (S, dépend de : 1.1 ; exigence 6)
  - `src/domain/lipogram/plugin.ts` : ne touche que les mots des pistes visées ; les noms ne passent par la réécriture que si la piste des noms est visée.
  - Acceptance : tests : un lipogramme sur les seuls noms laisse la lettre dans les autres pistes.
- [x] 2.2 S+n sur les adjectifs (L, dépend de : 1.1 ; exigences 5, 6)
  - Nouveau `src/domain/s7/adjective-shift.ts` : le n-ième adjectif qui suit dans le dictionnaire, à la forme de même genre et de même nombre, en comptant tous les adjectifs (« Parmi » ne vaut que pour les noms, décision du 2026-10-03) ; élision du mot précédent si besoin.
  - `src/domain/s7/plugin.ts` : décalage appliqué aux noms et/ou aux adjectifs selon les pistes visées.
  - Acceptance : tests : un S+3 sur les adjectifs change les adjectifs et garde leurs traits ; un S+n sur les noms seuls se comporte comme avant.
- [x] 2.3 Rack des instances dans la page (M, dépend de : 1.1 ; exigences 3, 4, 7, 8)
  - `src/ui/tracks/components/` : un rack remplace l'emplacement « Toutes les pistes » : instances dans l'ordre de la chaîne, pastilles des pistes visées, boutons ajouter (par type), dupliquer, retirer, monter, descendre. Les réglages de toutes les instances, S+n compris, passent dans le rack : la tranche des noms ne porte plus le panneau du S+7. `strip.ts` ne garde que le rappel des instances qui visent la piste.
  - `src/ui/tracks/app.ts`, `tracks.html` : branchement et styles avec les variables de `styles/tokens.css`.
  - Acceptance : tests des composants et de la page.
  - GUI test : 1. Ouvrir `tracks.html`, mettre l'exemple en pistes. 2. Ajouter un S+n, régler son décalage à 3 et sa piste aux adjectifs. 3. Le rack montre deux S+n dans l'ordre ; la tranche des adjectifs rappelle le second. 4. Monter le second : le résumé suit le nouvel ordre.

## 3. Wave 2

- [x] 3.1 Vérification dans le navigateur et compte rendu (S, dépend de : 2.1, 2.2, 2.3 ; critères de réussite)
  - Sur le texte de référence 1 : deux S+n (noms, adjectifs), un lipogramme sur les noms, réordonnés ; temps de mise à jour avec cinq instances.
  - `RESULTATS.md` : section « Filtres » ; `docs/tracks.md` mis à jour.
  - Acceptance : les critères « Instancier, Cibler, Chaîner » du PRD sont consignés avec leur constat.
  - GUI test : 1. Ouvrir `tracks.html`, coller le texte de référence 1. 2. Brancher deux S+n et un lipogramme sur les noms. 3. La mention copiée décrit les trois instances et leurs pistes.
