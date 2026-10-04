# Spec Delta

## ADDED Requirements

### Requirement: Boucler
The system SHALL offer a « Boucler » control right after « Itérer » in the result header, enabled under the same conditions. It SHALL start a loop with the last « tours » count used (from 2 to 12, 4 at first) The setting SHALL sit in the loop row (see « Rangée de la boucle »); changing it SHALL start the loop again, resuming from the last computed tour when only the count grows. Tour 0 SHALL be the current source text, and tour 1 the resulting text as displayed. Each tour k ≥ 2 SHALL be what « Itérer » would produce from tour k−1: the resulting text of tour k−1 as displayed, tagged as a new source text, with the same table state (instances, settings, modulators, gates, muted and solo tracks, form), closed steps reopened and locks dropped. Tours SHALL be computed in order up to the requested count. Before computing tour 2, the system SHALL keep tour 1 in the notebook exactly as « Itérer » keeps the current text, and SHALL stop with the keep error message if keeping fails. No other tour SHALL enter the notebook while tours are computed.

#### Scenario: Quatre tours de S+7
- **GIVEN** un texte A mis en pistes avec un S+7 sur les noms, dont le résultat est B, et un carnet de 2 entrées
- **WHEN** l'utilisateur actionne « Boucler », « tours » valant 4
- **THEN** quatre tours sont calculés : B, le S+7 de B réétiqueté, puis deux tours de plus
- **AND** le carnet compte 3 entrées, la plus récente étant B

#### Scenario: Rien à boucler
- **GIVEN** toutes les pistes coupées, ou un texte saisi qui ne correspond plus à la mise en pistes
- **WHEN** l'utilisateur regarde « Boucler »
- **THEN** la touche est désactivée, comme « Itérer »

#### Scenario: Deux boucles identiques
- **GIVEN** un S+7 au dé de graine 3, bouclé sur 5 tours
- **WHEN** l'utilisateur relance la même boucle sur le même texte
- **THEN** les cinq tours sont identiques aux précédents

### Requirement: Avancement des tours
As soon as « Boucler » is used, the loop row SHALL appear, « Boucler » SHALL be disabled, and the row SHALL state, as a status message, which tour is being computed out of the requested count (« tour 2 sur 6… »). The system SHALL let the screen repaint before each tour, so that this progress shows even when tagging blocks the page. The row SHALL offer an « Arrêter la boucle » control that ends the computation after the tour in progress. Every tour already computed SHALL become reachable with the tour cursor no later than when the computation ends or is stopped. A stopped loop SHALL say so (« arrêtée au tour 3 sur 6 »), and using « Boucler » again without any change SHALL resume from the next tour instead of computing again from tour 2. If tagging a tour fails, the computation SHALL stop, the tours already computed SHALL stay reachable, and the row SHALL show an error message (« Tour 5 impossible : <raison>. Boucler relance. »).

#### Scenario: Arrêter au troisième tour
- **GIVEN** une boucle de 10 tours en cours de calcul, au tour 3
- **WHEN** l'utilisateur actionne « Arrêter la boucle »
- **THEN** le calcul s'arrête une fois le tour 3 fini, le curseur va du tour 0 au tour 3, et la rangée dit « arrêtée au tour 3 sur 10 »

#### Scenario: Reprendre une boucle arrêtée
- **GIVEN** une boucle de 10 tours arrêtée au tour 3, sans changement depuis
- **WHEN** l'utilisateur actionne « Boucler »
- **THEN** le calcul reprend au tour 4, et les tours 0 à 3 ne sont pas recalculés

#### Scenario: Échec au cinquième tour
- **GIVEN** une boucle de 8 tours dont l'étiquetage échoue au tour 5
- **WHEN** l'échec survient
- **THEN** le curseur va du tour 0 au tour 4, et la rangée montre « Tour 5 impossible » avec la raison, en message d'erreur

### Requirement: Curseur de tours
The loop row SHALL show a tour cursor: one position per tour from 0 to the requested count, numbered, telling apart computed tours, tours still to come and the tour shown, and marking the tours of a fixed point or cycle, with « tour k / n ». It SHALL be operable by pointer (click or drag across positions), by touch, and by keyboard (arrows, Home, End); Space SHALL keep controlling listening. Until the user moves the cursor, it SHALL follow the last computed tour; once moved, it SHALL stay where the user put it. Moving the cursor SHALL change only the text shown on the result paper. It SHALL NOT tag text again, apply the chain again, or change the input, the grid, the chain or the step grid, which stay those of tour 1; while another tour is shown, the grid status sentence SHALL say « la grille montre le tour 1 ». Tour 1 SHALL show the result as it is shown today. Tour 0 SHALL show the source text. Every tour k ≥ 2 SHALL underline, like tour 1, each word that differs from its ancestor at tour k−1, in the colour of its track at tour k. When the shown tour changes and the cursor then rests, the replaced words SHALL flash briefly as when the text is recomputed, except while the cursor is being dragged and when reduced motion is requested.

#### Scenario: Revenir en arrière
- **GIVEN** une boucle de 6 tours calculée
- **WHEN** l'utilisateur mène le curseur au tour 5, puis au tour 2
- **THEN** le papier montre le texte du tour 5, puis celui du tour 2, aussitôt, sans étiquetage
- **AND** la grille, la chaîne et la saisie n'ont pas changé, et la phrase d'état de la grille dit « la grille montre le tour 1 »

#### Scenario: Le curseur suit les tours
- **GIVEN** une boucle de 6 tours en cours de calcul, le curseur jamais touché
- **WHEN** le tour 4 est calculé
- **THEN** le papier montre le tour 4
- **AND** si l'utilisateur mène ensuite le curseur au tour 2, l'arrivée des tours 5 et 6 ne le déplace plus

#### Scenario: La dérive soulignée
- **GIVEN** une boucle où « livrée » (tour 2) devient « livret » (tour 3) et « table » ne change pas
- **WHEN** le curseur montre le tour 3
- **THEN** « livret » est souligné dans la couleur des noms, et « table » ne l'est pas

#### Scenario: Le texte d'origine
- **GIVEN** une boucle calculée
- **WHEN** l'utilisateur mène le curseur au tour 0
- **THEN** le papier montre le texte d'origine en cours

### Requirement: Point fixe et cycle
When the text of a newly computed tour k is identical, character for character, to the text of an earlier tour j ≥ 1, the system SHALL stop computing tours after tour k. If j = k−1, the cursor SHALL announce a fixed point at tour j (« point fixe au tour j »). Otherwise, it SHALL announce a cycle of length k−j from tour j (« cycle de k−j à partir du tour j »). When a newly computed tour k has no word left, the system SHALL stop computing, the cursor SHALL announce « tout retiré au tour k », the paper SHALL say « Plus aucun mot au tour k. » for that tour, and « Garder » SHALL be disabled on it. Announcements SHALL be status messages, read by screen readers.

#### Scenario: Lipogramme bouclé
- **GIVEN** un lipogramme en e, bouclé sur 8 tours, dont le tour 2 redonne le texte du tour 1
- **WHEN** le calcul s'arrête
- **THEN** le curseur va du tour 0 au tour 2 et annonce « point fixe au tour 1 »

#### Scenario: Oscillation
- **GIVEN** une chaîne dont le tour 5 redonne le texte du tour 3
- **WHEN** le calcul s'arrête
- **THEN** le curseur va du tour 0 au tour 5 et annonce « cycle de 2 à partir du tour 3 »

#### Scenario: Tout retiré
- **GIVEN** une chaîne dont le tour 4 ne garde aucun mot
- **WHEN** le calcul s'arrête
- **THEN** le curseur va du tour 0 au tour 4, annonce « tout retiré au tour 4 », et au tour 4 le papier dit « Plus aucun mot au tour 4. »

### Requirement: Abandon de la boucle
Editing the input, changing the table state, tagging text again, reopening a notebook entry, or using « Itérer » or « Figer » SHALL abandon the loop. The cursor SHALL disappear, the computed tours SHALL be forgotten, and a computation in progress SHALL end after the tour in progress without its result being shown. Entries already kept SHALL stay in the notebook. The result status message SHALL say why the loop was abandoned and that tour 1 is in the notebook (« Boucle abandonnée : la table a changé. Le tour 1 est au carnet. »), until the next gesture.

#### Scenario: Toucher la table
- **GIVEN** une boucle de 6 tours calculée, le curseur au tour 4
- **WHEN** l'utilisateur change le décalage du S+7
- **THEN** le curseur disparaît, le papier montre le résultat de la nouvelle chaîne sur le texte en cours, et le message dit « Boucle abandonnée : la table a changé. Le tour 1 est au carnet. »

### Requirement: Garder un tour
Using « Garder » while the cursor shows tour 1 SHALL keep the current text as today. While it shows a tour k ≥ 2, it SHALL add exactly one entry:
- its source is tour k−1, with its tagging;
- its result is tour k;
- its table state is the loop's;
- it carries an optional `loop` record with the requested tour count and the tour kept, so that the export tells a loop take from k uses of « Itérer »; an unreadable record SHALL be dropped without rejecting the entry, and the export version SHALL stay 1;
- its lineage has the tour 1 entry as parent, the current lineage's ancestor (or tour 0 when there is none) as ancestor, and as passes the current lineage's passes followed by k−1 times the body of the loop's chain mention.

As an exception to the lineage of « Itérer », the parent's text is therefore not this entry's source. While the cursor shows a tour k ≥ 2, « Garder » SHALL read « Garder le tour k », and « Copier » SHALL copy that tour's text with its mention. While it shows tour 0, « Garder » SHALL be disabled with the reason « Le texte d'origine est déjà à la saisie », and « Copier » SHALL copy the source text. Reopening an entry kept from a loop SHALL restore it like any entry with a lineage. The loop itself SHALL NOT be restored.

#### Scenario: Garder le tour 5
- **GIVEN** un texte A sans filiation, un S+7 sur les noms bouclé sur 8 tours, le tour 1 gardé automatiquement, et le curseur au tour 5
- **WHEN** l'utilisateur actionne « Garder le tour 5 »
- **THEN** le carnet compte une seule entrée de plus
- **AND** sa source est le tour 4, son résultat le tour 5, son parent l'entrée du tour 1, son ancêtre A et ses passes précédentes quatre S+7 sur les noms
- **AND** sa mention se lit « — S+7 sur les noms ×5 (Oulipao) »
- **AND** dans l'export du carnet, l'entrée porte `loop` avec 8 tours demandés et le tour 5 gardé

#### Scenario: Rouvrir un tour gardé puis itérer
- **GIVEN** l'entrée du tour 5 gardée depuis une boucle
- **WHEN** l'utilisateur la rouvre, actionne « Itérer » puis garde le résultat
- **THEN** la nouvelle entrée a pour parent l'entrée du tour 5, pour ancêtre A, et cinq passes précédentes

### Requirement: Généalogie d'un mot
While a loop has more than one reachable tour, choosing a source word (clicking or touching it on the paper at tour 0, or choosing it from the grid header as today) SHALL open it in the inspector, which SHALL show a « Lignée » line through every reachable tour, in order, announced to screen readers: at each tour, the word or words that tour put in the place of the word's descendant, or « — » once it has been removed, after which the line SHALL stop. When the replacement of a word splits into several words, the line SHALL follow the first one. When a descendant cannot be matched to a word of the next tour, the line SHALL stop with « ? » rather than follow another word. Choosing words SHALL NOT add a tab stop per word on the paper.

#### Scenario: Suivre « livre »
- **GIVEN** une boucle de 4 tours où « livre » devient « livrée », puis « livret », puis « livreur »
- **WHEN** l'utilisateur choisit « livre », au tour 0 sur le papier ou dans l'en-tête de la grille
- **THEN** l'inspecteur montre la lignée « livre → livrée → livret → livreur »

#### Scenario: Un mot retiré
- **GIVEN** une boucle avec un lipogramme en e, où « mer » est retiré au tour 1
- **WHEN** l'utilisateur choisit « mer »
- **THEN** l'inspecteur montre la lignée « mer → — »

### Requirement: Écoute des tours
When a loop is shown, the listening transport SHALL read the tour under the cursor. For tour 1, it SHALL read as it does today. For any other tour, it SHALL read the tour's text word by word, in order, at the same tempo and with the same voice, without marking any step in the grid; the word being spoken SHALL be marked on the paper (ink background, paper text), and the paper SHALL scroll to keep it visible. Moving the cursor while it reads SHALL make the next word spoken come from the newly shown tour, at the same word position or at the start of the text if that tour is shorter. Listening to any tour SHALL count as listening for the « réglé en écoutant » mention.

#### Scenario: Changer de tour en écoutant
- **GIVEN** une boucle de 5 tours, la lecture en marche au tour 2, au dixième mot
- **WHEN** l'utilisateur mène le curseur au tour 4
- **THEN** le mot suivant dit est le onzième mot du tour 4, marqué sur le papier, et aucun pas de la grille n'est marqué

#### Scenario: Garder après avoir écouté
- **GIVEN** la lecture lancée au tour 3, puis arrêtée
- **WHEN** l'utilisateur garde le tour 3
- **THEN** la mention de l'entrée finit par « réglé en écoutant »

### Requirement: Rangée de la boucle
Once a loop exists, the system SHALL show a loop row under the result text, labelled « BOUCLE », holding in this order the tour cursor with « tour k / n », the announcement (progress, stop, fixed point, cycle, error), « Arrêter la boucle » while computing then the « tours » setting. The result header SHALL gain only « Boucler ». When the result strip is stuck to the top of the screen, the loop row SHALL keep only the tour cursor and « tour k / n ». Under 768 px, each cursor position SHALL be at least 44 px wide and tall, and the cursor SHALL scroll within its row, keeping the shown tour visible, without the page scrolling sideways.

#### Scenario: Bande collée
- **GIVEN** une boucle de 6 tours et la bande collée en haut de l'écran
- **WHEN** l'utilisateur regarde la bande
- **THEN** il voit le texte, le curseur de tours et « tour k / 6 », sans réglages ni touches

#### Scenario: Téléphone
- **GIVEN** une boucle de 12 tours sur un écran de 375 px
- **WHEN** l'utilisateur fait défiler le curseur et touche le tour 9
- **THEN** le curseur défile dans sa rangée, la page ne défile pas de côté, et le papier montre le tour 9
