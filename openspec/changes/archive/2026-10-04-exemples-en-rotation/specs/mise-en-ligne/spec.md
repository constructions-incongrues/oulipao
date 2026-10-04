## MODIFIED Requirements

### Requirement: Adresse publique
The system SHALL be published as a static site at `https://oulipao.incongru.org`, over HTTPS only, whose root address opens the tracks page, the test page being available at `essai.html`; both pages SHALL work there exactly as when served locally.

#### Scenario: Ouverture de l'adresse
- **GIVEN** le site publié sur GitHub Pages
- **WHEN** on ouvre `https://oulipao.incongru.org`
- **THEN** la page à pistes s'affiche, et « Essayer avec un exemple » met en pistes le premier texte d'exemple

#### Scenario: Adresse en clair
- **GIVEN** le site publié
- **WHEN** on ouvre `http://oulipao.incongru.org`
- **THEN** le navigateur est renvoyé vers `https://oulipao.incongru.org`

#### Scenario: Page d'essai
- **GIVEN** le site publié
- **WHEN** on ouvre `essai.html` à la même adresse
- **THEN** la page d'essai étiquette un texte collé
