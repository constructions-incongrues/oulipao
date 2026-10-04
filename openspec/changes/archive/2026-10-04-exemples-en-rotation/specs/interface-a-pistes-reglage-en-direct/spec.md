## ADDED Requirements

### Requirement: Exemples en rotation
The system SHALL offer five public-domain example texts, in this fixed order: Proust, « Longtemps, je me suis couché de bonne heure » (opening of *Du côté de chez Swann*, 1913); La Fontaine, *Le Corbeau et le Renard* (1668); Rimbaud, *Le Dormeur du val* (1870); Verlaine, *Chanson d'automne* (1866); Hugo, *Demain, dès l'aube* (1856). Each text SHALL hold at most 150 words and verse texts SHALL keep one line per verse and a blank line between stanzas.

The example button SHALL be shown in the open input whenever the input is empty or holds one of the example texts unchanged, before and after a first run alike, and SHALL be hidden otherwise. Its label SHALL be « Essayer avec un exemple » until it has been used once in the visit, then « Autre exemple ». Each click SHALL place the next example text in the input and run it, the first click of a visit placing the first text and the click after the last text placing the first again; the current chain SHALL be kept. Nothing about the rotation SHALL be stored beyond the visit.

Whenever the input holds one of the example texts unchanged, a line SHALL name its author, title and year under the input, and the folded input SHALL name them too.

#### Scenario: Premier essai
- **GIVEN** une première visite, la saisie vide
- **WHEN** on clique « Essayer avec un exemple »
- **THEN** le début de *Du côté de chez Swann* est mis en pistes, la mention « Marcel Proust, Du côté de chez Swann (1913) » s'affiche, et le bouton se lit « Autre exemple » quand on rouvre la saisie

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

## MODIFIED Requirements

### Requirement: Syllabes par vers
The system SHALL show, next to each line of the result text, its syllable count, counted from the pronunciations of the textbank and including a final mute e before a consonant inside the line, as well as the e of a final « -es » or « -ent » before a vowel inside the line (the liaison makes it heard), once the textbank is loaded; the count SHALL be hidden when the chain has no phonetic filter.

#### Scenario: Alexandrin
- **GIVEN** une chaîne avec un filtre phonétique et le vers « Je fais souvent ce rêve étrange et pénétrant »
- **WHEN** le texte résultant s'affiche
- **THEN** ce vers porte le compte 12

#### Scenario: E muet porté par la liaison
- **GIVEN** une chaîne avec un filtre phonétique et le vers « Ni les voiles au loin descendant vers Harfleur »
- **WHEN** le texte résultant s'affiche
- **THEN** ce vers porte le compte 12, le e de « voiles » comptant devant « au »

#### Scenario: Sans filtre phonétique
- **GIVEN** une chaîne sans filtre phonétique
- **WHEN** le texte résultant s'affiche
- **THEN** aucun compte de syllabes n'apparaît
