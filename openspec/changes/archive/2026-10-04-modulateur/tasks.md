# Tasks

## 1. Modèle (domain)

- [x] 1.1 domain : créer `src/domain/modulation/schema.ts` avec `SourceSchema` (lettres, syllabes, voyelles, lettre, rang, ligne, motif, rampe), le mot lu (soi ou voisin : piste, sens), `ModulatorSchema` (source, mot lu, base, profondeur) et `GateSchema` (source, mot lu, test : pair, impair, au moins *k*, au plus *k*, euclide *k* sur *n*, ce dernier sur le rang seulement). Vérifier par des tests zod qui acceptent les cas valides et refusent un motif vide, une lettre de plus d'un caractère et un Euclide sur une autre source que le rang.
- [x] 1.2 domain : créer `fold.ts`, qui calcule `base + profondeur × source` et le repli. Vérifier par des tests de table : homophonie 13 → 4, R+n 25 → 5, base 7 et profondeur −1 sur 4 → 3, valeur sous le minimum.

## 2. Sources et porte (domain)

- [x] 2.1 domain : créer `sources.ts` pour les sources du mot. Les lettres comptent les accentuées, sans apostrophe ni trait d'union. Les voyelles comptent les lettres voyelles. La lettre ignore les accents. Les syllabes passent par une fonction injectée qui peut rendre `undefined`. Vérifier : « porte-clés » → 9, « élève » sur e → 3, syllabes factices.
- [x] 2.2 domain : ajouter les sources de position : rang, ligne, motif répété, rampe arrondie, toutes calculées sur une liste de positions traitées. Vérifier : rang 1, 2, 3 ; motif « 7, 0 » sur 4 mots ; rampe de 1 à 9 sur 5 mots ; ligne lue sur des blancs contenant `\n`.
- [x] 2.3 domain : créer `neighbour.ts`, qui trouve le voisin le plus proche d'une piste, avant ou après, sans franchir `.`, `!` ou `?`. Vérifier : « Le chat noir dort. » → « noir » ; pas de voisin au-delà d'un point.
- [x] 2.4 domain : créer `gate.ts` avec les cinq tests et l'Euclide E(*k*,*n*) sur `((r − 1) mod n) + 1`. Vérifier : E(3,8) laisse passer les rangs 1, 4 et 7 ; lettres paires sur chat, chaise et pluie.

## 3. Branchement dans la chaîne (domain)

- [x] 3.1 domain : créer `apply.ts`. `modulate` prend l'étage (mots reçus, étiquettes, lignes, pistes visées, pas bouchés, mots retirés), les modulateurs, la porte et les définitions des paramètres. Il rend les sauts de la porte, les valeurs par position, les notes (pas de voisin, prononciations en cours de chargement) et les replis. Vérifier par des tests de domaine avec des ports factices.
- [x] 3.2 domain : étendre `ChainStep` (`modulators?`, `gate?`, `syllables?`) et `runChain`. Après `reread`, appeler `modulate`, fusionner les verrous manuels par-dessus et les pas bouchés avec les sauts, puis exposer `ChainResult.modulation` par étage et par mot d'origine. Vérifier par des tests de `plugin-chain` : rétroaction de deux S+lettres, verrou prioritaire, pas bouché intact, mot retiré non compté, porte propre à une instance.
- [x] 3.3 ui : créer `src/ui/tracks/modulation-statement.ts` pour la phrase par modulateur et par porte, avec « modulo » quand il y a eu repli, « en arrivant ici » quand un étage précédent existe, et le voisin nommé. Vérifier par des tests de phrase pour chaque source, la porte et le voisin, sans aucune valeur par mot dans la phrase.

## 4. État et persistance (ui)

- [x] 4.1 ui : dans `src/ui/tracks/types.ts`, ajouter à `InstanceSchema` les champs optionnels `modulators` et `gate`, en retombant sur `undefined` quand ils sont invalides. Vérifier : un ancien export se lit sans rejet ; une source inconnue laisse l'instance fixe et l'entrée est lue.
- [x] 4.2 ui : dans `mixer-state.ts`, ajouter les actions `setModulator`, `clearModulator`, `setGate` et `clearGate`. Elles refusent un paramètre non verrouillable et valident par le schéma. La remise en pistes vide les verrous mais garde modulateurs et porte, et le duplicata d'une instance copie ses modulateurs. Vérifier par les tests de `mixer-state`.
- [x] 4.3 ui : dans `view-model.ts`, passer modulateurs, porte et fonction des syllabes à `runChain`. Le libellé court vient de la table de noms (« S+lettres »), la phrase s'ajoute à `describeInstance` et donc à `ruleMention`, et l'inspecteur reçoit ses valeurs. Vérifier par les tests du modèle de vue : la mention d'un S+lettres et celle d'une porte paire.
- [x] 4.4 ui : dans `controller.ts`, charger les prononciations quand une instance en marche lit `syllabes` (modulateur ou porte). Vérifier par un test du contrôleur avec un chargeur factice.

## 5. Interface (ui)

- [x] 5.1 ui : créer `components/modulator-field.ts`, un sélecteur « fixe / sources » à côté de chaque champ verrouillable du panneau d'instance. Sa ligne de réglages (mot lu, base, profondeur, lettre, motif, rampe) est repliée par défaut, et une saisie invalide est refusée près du champ. Le tout suit `DESIGN.md`. Vérifier : brancher « lettres » sur un S+n réécrit le texte ; le lipogramme n'offre aucun modulateur ; un motif « 7, x » est refusé.
- [x] 5.2 ui : créer `components/gate-field.ts`, une ligne « Porte » fermée par défaut (source, mot lu, test, *k*, *n*). Vérifier : la porte « lettres paires » laisse « pluie » intact.
- [x] 5.3 ui : dans `components/inspector.ts` et `step-grid.ts`, afficher la valeur modulée sous chaque mot traité, dans un style distinct du verrou, ainsi que l'état de porte et les notes (« pas de voisin », prononciations en cours). Le nom accessible du pas mentionne la valeur modulée. Vérifier : « +4 » sous « chat » et « +6 » sous « chaise » pour un S+lettres.

## 6. Vérification d'ensemble

- [x] 6.1 Lancer `npm test` et vérifier que tout passe et que la couverture reste au-dessus de 90 %.
- [x] 6.2 Vérifier dans le navigateur, avec la prévisualisation : deux S+lettres à la suite et l'inspecteur montrent la rétroaction ; garder le texte au carnet, le rouvrir et obtenir un résultat identique ; la mention copiée énonce la règle ; un texte de 500 mots avec trois instances modulées se règle sans ralentissement perceptible.
