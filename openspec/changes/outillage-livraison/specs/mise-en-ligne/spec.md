# Spec Delta

## ADDED Requirements

### Requirement: Contrôles avant fusion et publication
The system SHALL run, on every pull request and again before every publication, the palette check (contrast of at least 4.5:1 and colour distance between tracks, including colour-blind vision) and a check that regenerating the reference texts from their annotated sources leaves the committed reference files unchanged; a failing check SHALL block the pull request and stop the publication.

#### Scenario: Palette en défaut
- **GIVEN** une PR qui change la couleur d'une piste en une teinte sous 4,5:1 sur la façade
- **WHEN** la vérification de la PR s'exécute
- **THEN** elle échoue sur le contrôle de la palette

#### Scenario: Référence non régénérée
- **GIVEN** une PR qui modifie `reference/texte-2.annote.txt` sans régénérer `reference/texte-2.json`
- **WHEN** la vérification de la PR s'exécute
- **THEN** elle échoue en montrant que le fichier de référence diffère de sa source

#### Scenario: Tout est en ordre
- **GIVEN** une PR dont la palette est conforme et les références à jour
- **WHEN** la vérification s'exécute
- **THEN** ces deux contrôles passent
