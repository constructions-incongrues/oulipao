## ADDED Requirements

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
