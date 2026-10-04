# Spec Delta

## ADDED Requirements

### Requirement: Révision figée des poids du modèle
The system SHALL request the tagging model's weights and tokenizer at a fixed revision of the Hugging Face repository, named in the code, rather than at its moving default branch; changing the revision SHALL require a change to the code.

#### Scenario: Requête du modèle
- **GIVEN** la page à pistes et l'onglet réseau ouvert
- **WHEN** l'utilisateur charge le modèle
- **THEN** les fichiers du modèle sont demandés à la révision figée dans le code, pas à la branche `main`

### Requirement: Données publiées vérifiées
The system SHALL load in full every derived data file served with the site — the lexicon, the dictionary, the verbs and the phonetic textbank — in the tests that gate publication, so that a file with a non-conforming line stops the publication.

#### Scenario: Fichier des verbes abîmé
- **GIVEN** une régénération du fichier des verbes qui produit une ligne non conforme
- **WHEN** les tests de la PR de version s'exécutent
- **THEN** ils échouent en nommant la ligne, et le site publié reste celui d'avant
