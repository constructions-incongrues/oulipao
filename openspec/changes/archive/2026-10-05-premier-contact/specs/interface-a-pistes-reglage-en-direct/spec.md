## ADDED Requirements

### Requirement: Phrase d'accueil sur la page vide
While no resulting text exists and no shared-link arrival is shown, the system SHALL display, above the source input and next to the example button, one welcome sentence that names Oulipao as an instrument and its three gestures: paste a text, add a constraint, listen to what it does. The sentence SHALL be plain text read by screen readers, SHALL follow the design system, and SHALL fit a 375 px wide screen without horizontal scrolling. It SHALL disappear as soon as a resulting text exists and SHALL NOT come back during the visit.

#### Scenario: Première ouverture
- **GIVEN** une première visite, sans paramètre dans l'adresse
- **WHEN** la page s'affiche
- **THEN** la phrase d'accueil est visible au-dessus de la saisie, à côté de « Essayer avec un exemple »

#### Scenario: Pendant le chargement du modèle
- **GIVEN** la page vide et le modèle d'étiquetage en cours de chargement
- **WHEN** la barre de progression s'affiche
- **THEN** la phrase d'accueil reste visible

#### Scenario: Après la première mise en pistes
- **GIVEN** la phrase d'accueil visible
- **WHEN** un texte est mis en pistes et le texte résultant apparaît
- **THEN** la phrase d'accueil n'est plus affichée, même si l'on rouvre la saisie

#### Scenario: Arrivée par un lien partagé
- **GIVEN** une adresse qui porte une entrée de carnet partagée
- **WHEN** la page s'affiche avec l'action « Rejouer »
- **THEN** la phrase d'accueil n'est pas affichée
