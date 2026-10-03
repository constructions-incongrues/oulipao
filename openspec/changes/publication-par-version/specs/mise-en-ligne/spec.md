## MODIFIED Requirements

### Requirement: Publication depuis main
The system SHALL republish the site only when a new version is released from `main` — that is, when the pending version pull request is merged — or when the founder triggers the publication by hand. A push to `main` that releases no version SHALL leave the published site unchanged. The system SHALL publish nothing when the tests fail.

#### Scenario: Poussée réussie
- **GIVEN** une PR fusionnée sur `main` avec le titre `fix: défilement bloqué`
- **WHEN** la poussée sur `main` est traitée
- **THEN** le site publié ne change pas, et la PR de version en attente annonce cette correction et propose la version suivante

#### Scenario: Fusion de la PR de version
- **GIVEN** une PR de version en attente dont les tests passent
- **WHEN** le fondateur la fusionne
- **THEN** la version est étiquetée dans le dépôt, une release GitHub est créée, et le site publié reflète cette version sans autre manipulation

#### Scenario: Tests en échec
- **GIVEN** une PR de version dont un test échoue après fusion
- **WHEN** la publication s'exécute
- **THEN** la publication s'arrête et le site publié reste celui d'avant

#### Scenario: Publication à la main
- **GIVEN** le site publié
- **WHEN** le fondateur lance la publication à la main depuis GitHub
- **THEN** le site est reconstruit à partir de `main` et republié, si les tests passent

## ADDED Requirements

### Requirement: Journal des versions
The repository SHALL keep a `CHANGELOG.md` in French that lists, for each released version, its number, its date, and its changes grouped under « Nouveautés » (titles `feat:`) and « Corrections » (titles `fix:`). Pull requests titled `docs:`, `chore:`, `refactor:`, `test:`, `ci:` or `build:` SHALL not appear in it. A title marked as breaking (`feat!:` or `fix!:`) SHALL be listed under its own heading.

#### Scenario: Version avec une nouveauté et une correction
- **GIVEN** deux PR fusionnées depuis la dernière version, `feat: filtre de rime riche` et `fix: défilement bloqué`
- **WHEN** la PR de version suivante est fusionnée
- **THEN** `CHANGELOG.md` gagne une entrée datée pour cette version, avec « filtre de rime riche » sous « Nouveautés » et « défilement bloqué » sous « Corrections »

#### Scenario: Travail sans effet visible
- **GIVEN** une seule PR fusionnée depuis la dernière version, intitulée `docs: section 5 arc42`
- **WHEN** release-please traite la poussée
- **THEN** aucune nouvelle version n'est proposée et `CHANGELOG.md` ne change pas

### Requirement: Version affichée
The tracks page SHALL show the published version number (for example `v0.2.0`) in its brand bar, next to « Code source », as a link to the version history. The test page SHALL show the same number and link in its introduction. Both SHALL show the version the site was built from, be reachable by keyboard and stay visible at every screen width.

#### Scenario: Page à pistes
- **GIVEN** le site publié en version `0.2.0`
- **WHEN** la page à pistes s'affiche
- **THEN** la barre de marque montre `v0.2.0`, et l'activer ouvre le journal des versions

#### Scenario: Page d'essai
- **GIVEN** le site publié en version `0.2.0`
- **WHEN** la page d'essai s'affiche
- **THEN** son introduction montre `v0.2.0` avec un lien vers le journal des versions

#### Scenario: Téléphone
- **GIVEN** une fenêtre de 375 px de large
- **WHEN** la page à pistes s'affiche
- **THEN** la version et « Code source » sont visibles dans la barre de marque, et la page ne défile pas à l'horizontale
