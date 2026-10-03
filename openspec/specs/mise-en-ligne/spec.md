# mise-en-ligne Specification

## Purpose
Rendre Oulipao accessible à une adresse publique, sans rien installer, en gardant la promesse que le texte ne quitte pas le navigateur et en disant d'où vient chaque morceau du site.

## Requirements

### Requirement: Adresse publique
The system SHALL be published as a static site at `https://oulipao.incongru.org`, over HTTPS only, whose root address opens the tracks page, the test page being available at `essai.html`; both pages SHALL work there exactly as when served locally.

#### Scenario: Ouverture de l'adresse
- **GIVEN** le site publié sur GitHub Pages
- **WHEN** on ouvre `https://oulipao.incongru.org`
- **THEN** la page à pistes s'affiche, et « Essayer avec un exemple » met le texte d'exemple en pistes

#### Scenario: Adresse en clair
- **GIVEN** le site publié
- **WHEN** on ouvre `http://oulipao.incongru.org`
- **THEN** le navigateur est renvoyé vers `https://oulipao.incongru.org`

#### Scenario: Page d'essai
- **GIVEN** le site publié
- **WHEN** on ouvre `essai.html` à la même adresse
- **THEN** la page d'essai étiquette un texte collé

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

### Requirement: Le texte reste dans le navigateur
The system SHALL send no request containing the user's text, SHALL load nothing from third parties other than the tagging library from jsDelivr and the tagging model from Hugging Face, and SHALL carry no tracker or audience measurement.

#### Scenario: Session observée dans l'onglet réseau
- **GIVEN** l'adresse publique ouverte avec l'onglet réseau et le cache vidé
- **WHEN** un texte est collé, mis en pistes et transformé
- **THEN** aucune requête ne contient le texte, et toute requête qui ne vise pas le site va vers `cdn.jsdelivr.net` ou vers Hugging Face

### Requirement: Le modèle attend le premier clic
The tracks page SHALL send no request to jsDelivr or Hugging Face before the user's first click on « Charger le modèle », « Mettre en pistes » or « Essayer avec un exemple ». Until then, it SHALL show the « Charger le modèle (141 Mo) » button and a notice naming jsDelivr and Hugging Face as the sources of the model and stating that they will see the visitor's address, while the text stays in the browser. The page SHALL ask again on every visit, even when the model is already in the browser cache.

#### Scenario: Ouverture sans requête vers un tiers
- **GIVEN** l'adresse publique ouverte avec l'onglet réseau
- **WHEN** la page à pistes a fini de s'afficher et que rien n'a été cliqué
- **THEN** aucune requête n'est partie vers `cdn.jsdelivr.net`, `huggingface.co` ou `*.hf.co`, et la notice nomme jsDelivr et Hugging Face

#### Scenario: Charger le modèle
- **GIVEN** la page à pistes ouverte, rien encore cliqué
- **WHEN** l'utilisateur active « Charger le modèle »
- **THEN** le téléchargement commence, avec son avancement, et « Mettre en pistes » sert dès que le modèle est prêt

#### Scenario: Mettre en pistes d'emblée
- **GIVEN** la page à pistes ouverte, un texte collé, rien encore cliqué
- **WHEN** l'utilisateur active « Mettre en pistes »
- **THEN** le modèle se charge, puis le texte est mis en pistes sans autre clic

#### Scenario: Visite suivante
- **GIVEN** le modèle chargé lors d'une visite précédente
- **WHEN** l'utilisateur rouvre la page à pistes
- **THEN** la page attend de nouveau le premier clic avant de contacter jsDelivr ou Hugging Face

### Requirement: Politique de sécurité du contenu
Both published pages SHALL declare a content security policy that allows network connections only to the site itself, `cdn.jsdelivr.net`, `huggingface.co` and `*.hf.co`, allows scripts only from the site, `cdn.jsdelivr.net` and in-memory copies (`blob:`), plus WebAssembly, and forbids inline scripts and `eval`. Under this policy the pages SHALL work exactly as before, with no policy violation reported.

#### Scenario: Requête vers un autre hôte refusée
- **GIVEN** la page à pistes ouverte
- **WHEN** un script de la page tente une requête vers un hôte qui n'est ni le site, ni jsDelivr, ni Hugging Face
- **THEN** le navigateur refuse la requête et signale la violation de la politique dans la console

#### Scenario: Usage complet sans violation
- **GIVEN** la page à pistes ouverte, console ouverte, cache vidé
- **WHEN** l'utilisateur charge le modèle, met un texte en pistes, ajoute une contrainte qui vise les verbes et copie le résultat
- **THEN** tout fonctionne comme avant, et la console ne signale aucune violation de la politique

#### Scenario: Page d'essai
- **GIVEN** la page d'essai ouverte
- **WHEN** un texte est étiqueté par les trois étiqueteurs puis transformé
- **THEN** tout fonctionne comme avant, et la console ne signale aucune violation de la politique

### Requirement: Licences publiées
The system SHALL publish its code under the MIT licence and SHALL ship with the site a list of third-party components with their licences: the fonts (SIL OFL 1.1), the lexicon and morphology derived from Grammalecte (MPL 2.0, with the address of their source), fr-compromise (MIT), Transformers.js, and the CamemBERT model, whose licence is stated as undeclared.

#### Scenario: Licences en ligne
- **GIVEN** le site publié
- **WHEN** on ouvre `LICENSE` et `THIRD_PARTY_LICENSES.md` à l'adresse publique
- **THEN** on y lit la licence MIT du code et chaque composant tiers avec sa licence

### Requirement: Lien vers le code
The system SHALL show on the tracks page and on the test page a link labelled « Code source » to `https://github.com/constructions-incongrues/oulipao`, reachable by keyboard and visible at every screen width.

#### Scenario: Page à pistes
- **GIVEN** la page à pistes ouverte
- **WHEN** l'utilisateur active « Code source » dans la barre de marque
- **THEN** le navigateur ouvre `https://github.com/constructions-incongrues/oulipao`

#### Scenario: Page d'essai
- **GIVEN** la page d'essai ouverte
- **WHEN** l'utilisateur lit son introduction
- **THEN** un lien « Code source » mène à `https://github.com/constructions-incongrues/oulipao`

#### Scenario: Téléphone
- **GIVEN** une fenêtre de 375 px de large
- **WHEN** la page à pistes s'affiche
- **THEN** le lien « Code source » est visible dans la barre de marque et la page ne défile pas à l'horizontale
