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
The system SHALL rebuild and republish the site on every push to `main`, and SHALL publish nothing when the tests fail.

#### Scenario: Poussée réussie
- **GIVEN** un commit dont les tests passent
- **WHEN** il est poussé sur `main`
- **THEN** le site publié reflète ce commit, sans autre manipulation

#### Scenario: Tests en échec
- **GIVEN** un commit dont un test échoue
- **WHEN** il est poussé sur `main`
- **THEN** la publication s'arrête et le site publié reste celui d'avant

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
