# Spec Delta

## ADDED Requirements

### Requirement: Espaces insécables conservées
The system SHALL keep a no-break space (U+00A0) or a narrow no-break space (U+202F) of the source text in the spacing it belongs to whenever a constraint removes a word, cuts a track or relays a line; when spacing is rebuilt before « ; : ! ? », the space SHALL be the one the source text used there.

#### Scenario: Retrait devant un point d'exclamation
- **GIVEN** le texte « Quel chat noir ! », avec une espace fine insécable avant « ! », et un Tri par piste qui retire les adjectifs
- **WHEN** il s'applique
- **THEN** le texte résultant est « Quel chat ! », avec toujours une espace fine insécable avant « ! »

#### Scenario: Piste coupée
- **GIVEN** le texte « Il dort : rien ne bouge. », avec une espace insécable avant « : », et la piste des verbes en muet
- **WHEN** le texte résultant s'affiche
- **THEN** l'espace avant « : » est toujours insécable
