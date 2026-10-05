# Spec Delta

## ADDED Requirements

### Requirement: Brancher une contrainte depuis la bande
While a text is on tracks and no constraint is enabled, the system SHALL show under the resulting text the line « Aucune contrainte en marche : le texte est rendu tel quel. » with a « Brancher une contrainte » control, also when the result strip is stuck to the top of the screen. Using the control SHALL open the constraint catalogue, scroll it into view below the stuck strip (instantly when reduced motion is requested), and move the focus to its first control. The line SHALL disappear as soon as a constraint is enabled. Nothing SHALL open or scroll without this gesture.

#### Scenario: Premier texte, chaîne vide
- **GIVEN** un texte collé, aucune contrainte
- **WHEN** l'utilisateur le met en pistes
- **THEN** la bande montre le texte inchangé, puis « Aucune contrainte en marche : le texte est rendu tel quel. » et la touche « Brancher une contrainte » ; l'écran n'a pas bougé

#### Scenario: Brancher
- **GIVEN** l'invite affichée, le catalogue replié deux écrans plus bas
- **WHEN** l'utilisateur actionne « Brancher une contrainte »
- **THEN** le catalogue s'ouvre, l'écran défile jusqu'à lui, et le focus est sur sa première touche

#### Scenario: Une contrainte en marche
- **GIVEN** l'invite affichée
- **WHEN** l'utilisateur ajoute un S+7 depuis le catalogue
- **THEN** l'invite disparaît et la bande montre les noms remplacés

#### Scenario: Chaîne montée
- **GIVEN** un S+7 en marche
- **WHEN** l'utilisateur met un autre texte en pistes
- **THEN** aucune invite ne s'affiche

## MODIFIED Requirements

### Requirement: Exemples en rotation
The system SHALL offer five public-domain example texts, in this fixed order: Proust, « Longtemps, je me suis couché de bonne heure » (opening of *Du côté de chez Swann*, 1913); La Fontaine, *Le Corbeau et le Renard* (1668); Rimbaud, *Le Dormeur du val* (1870); Verlaine, *Chanson d'automne* (1866); Hugo, *Demain, dès l'aube* (1856). Each text SHALL hold at most 150 words and verse texts SHALL keep one line per verse and a blank line between stanzas.

The example button SHALL be shown in the open input whenever the input is empty or holds one of the example texts unchanged, before and after a first run alike, and SHALL be hidden otherwise. Its label SHALL be « Essayer avec un exemple » until it has been used once in the visit, then « Autre exemple ». Each click SHALL place the next example text in the input and run it, the first click of a visit placing the first text and the click after the last text placing the first again. When no constraint is enabled, the click SHALL first add an S+7 on nouns with its default settings, so that the example plays; otherwise the current chain SHALL be kept unchanged. Nothing about the rotation SHALL be stored beyond the visit.

Whenever the input holds one of the example texts unchanged, a line SHALL name its author, title and year under the input, and the folded input SHALL name them too.

#### Scenario: Premier essai
- **GIVEN** une première visite, la saisie vide
- **WHEN** on clique « Essayer avec un exemple »
- **THEN** un S+7 sur les noms est branché, le début de *Du côté de chez Swann* est mis en pistes avec ses noms remplacés, la mention « Marcel Proust, Du côté de chez Swann (1913) » s'affiche, et le bouton se lit « Autre exemple » quand on rouvre la saisie

#### Scenario: Exemple suivant avec la même chaîne
- **GIVEN** le texte de Proust mis en pistes avec un S+7 branché
- **WHEN** on rouvre la saisie et clique « Autre exemple »
- **THEN** *Le Corbeau et le Renard* est mis en pistes, toujours avec le S+7 branché

#### Scenario: Retour au premier texte
- **GIVEN** *Demain, dès l'aube* mis en pistes comme cinquième exemple
- **WHEN** on clique « Autre exemple »
- **THEN** le texte de Proust est de nouveau mis en pistes

#### Scenario: Texte collé protégé
- **GIVEN** un texte collé dans la saisie, ou un exemple retouché d'un seul caractère
- **WHEN** la saisie s'affiche
- **THEN** le bouton d'exemple n'apparaît pas, et aucune mention de source non plus

#### Scenario: Nouvelle visite
- **GIVEN** une visite précédente arrêtée sur le troisième exemple
- **WHEN** on rouvre la page et clique « Essayer avec un exemple »
- **THEN** c'est le texte de Proust qui est mis en pistes

#### Scenario: Chaîne déjà en marche
- **GIVEN** un lipogramme en e en marche, sans autre contrainte
- **WHEN** on clique « Essayer avec un exemple »
- **THEN** le texte de Proust est mis en pistes avec le seul lipogramme, sans S+7 ajouté

#### Scenario: Contraintes toutes coupées
- **GIVEN** une chaîne d'un S+7 coupé
- **WHEN** on clique « Essayer avec un exemple »
- **THEN** un S+7 sur les noms en marche s'ajoute en fin de chaîne, et le S+7 coupé reste coupé
