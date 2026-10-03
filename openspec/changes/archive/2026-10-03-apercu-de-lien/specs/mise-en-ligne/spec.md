# Spec Delta

## ADDED Requirements

### Requirement: Aperçu de lien
The root page SHALL declare, in its static HTML head and readable without running any script, a title and a description presenting Oulipao, the Open Graph properties `og:title`, `og:description`, `og:type`, `og:url`, `og:image` (with its width, height and alternative text) and `og:locale` set to `fr_FR`, and a `twitter:card` set to `summary_large_image`. Every address in these properties SHALL be absolute and under `https://oulipao.incongru.org/`. The preview image SHALL be a 1200×630 PNG published with the site. Both pages SHALL declare an SVG icon published with the site. None of this SHALL load anything from a third party.

#### Scenario: Lien partagé par messagerie
- **GIVEN** le site publié
- **WHEN** on colle `https://oulipao.incongru.org` dans une messagerie qui affiche des aperçus
- **THEN** la carte montre le titre, la description et l'image d'aperçu d'Oulipao

#### Scenario: Robot sans JavaScript
- **GIVEN** la page d'accueil récupérée par une simple requête HTTP, sans exécuter de script
- **WHEN** on lit son `<head>`
- **THEN** il contient le titre, la description, toutes les propriétés Open Graph listées et `twitter:card`, et chaque adresse commence par `https://oulipao.incongru.org/`

#### Scenario: Image et icône publiées
- **GIVEN** le site publié
- **WHEN** on ouvre l'adresse de `og:image` et celle de l'icône
- **THEN** la première renvoie une image PNG de 1200×630, la seconde une image SVG

### Requirement: Page d'essai hors index
The test page SHALL ask search engines not to index it.

#### Scenario: Balise robots
- **GIVEN** la page `essai.html` publiée
- **WHEN** on lit son `<head>`
- **THEN** il contient `<meta name="robots" content="noindex">`
