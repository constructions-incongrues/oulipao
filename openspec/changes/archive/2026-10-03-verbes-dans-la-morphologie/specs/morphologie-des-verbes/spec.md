# Spec Delta

## Purpose

Donner aux filtres les verbes du français et leurs formes conjuguées, tirés du lexique Grammalecte. Les verbes sont rangés dans l'ordre du dictionnaire, décrits par leur temps et leur personne, et chargés seulement quand une instance de la chaîne vise la piste des verbes.

## ADDED Requirements

### Requirement: Formes conjuguées tirées du lexique
The system SHALL derive from the Grammalecte lexicon a file of verb forms giving, for each form, its infinitive, its tense (infinitive, present, imperfect, simple past, future and conditional of the indicative; present and imperfect of the subjunctive; imperative; present participle; past participle), its person for finite forms, its gender and number for past participles, and whether it blocks elision; the system SHALL validate every line of that file when loading it and SHALL refuse a non-conforming file.

#### Scenario: Formes de « manger »
- **GIVEN** le fichier des verbes dérivé du lexique
- **WHEN** on demande les lectures de « mangeait »
- **THEN** on obtient l'infinitif « manger », l'imparfait de l'indicatif, troisième personne du singulier

#### Scenario: Ligne non conforme
- **GIVEN** un fichier des verbes dont une ligne porte un temps inconnu
- **WHEN** il est chargé
- **THEN** le chargement échoue et le message cite la ligne

### Requirement: Ordre du dictionnaire des verbes
The system SHALL order verbs by their infinitive in French dictionary order, accents ignored at the first level, as for nouns and adjectives, and SHALL exclude the auxiliaries « être » and « avoir » from that order.

#### Scenario: Voisin de « manger »
- **GIVEN** le dictionnaire des verbes
- **WHEN** on cherche le verbe qui suit « manger »
- **THEN** c'est l'infinitif suivant dans l'ordre du dictionnaire, jamais « être » ni « avoir »

### Requirement: Lecture retenue pour une forme ambiguë
The system SHALL, when a verb form has several readings, keep the reading whose person matches the subject pronoun just before the verb (« je », « j' », « tu », « il », « elle », « on », « nous », « vous », « ils », « elles »), then prefer the indicative over the subjunctive and the imperative, and the third person when no pronoun decides.

#### Scenario: « mange » après « tu »
- **GIVEN** la forme « mange » précédée de « tu »
- **WHEN** sa lecture est retenue
- **THEN** c'est l'indicatif présent, deuxième personne du singulier

#### Scenario: Sujet nominal
- **GIVEN** la forme « mange » précédée d'un nom sujet
- **WHEN** sa lecture est retenue
- **THEN** c'est l'indicatif présent, troisième personne du singulier

### Requirement: Remplacement à traits constants
The system SHALL give a replaced verb the form of the new verb at the same tense and person, or for a past participle the same gender and number, and SHALL leave the verb unchanged with a stated reason when the new verb has no such form.

#### Scenario: Verbe défectif
- **GIVEN** un verbe à la première personne dont le remplaçant n'existe qu'à la troisième (« falloir »)
- **WHEN** le filtre s'applique
- **THEN** le verbe reste tel quel et sa raison dit qu'aucune forme ne convient

### Requirement: Auxiliaires intacts
The system SHALL leave every form of « être » and « avoir » unchanged, with the reason that it is an auxiliary, whatever the filter.

#### Scenario: Passé composé
- **GIVEN** « il a mangé » et un filtre qui vise les verbes
- **WHEN** le filtre s'applique
- **THEN** « a » reste tel quel et seul le participe « mangé » peut changer, au même genre et au même nombre

### Requirement: Élision devant le verbe nouveau
The system SHALL elide or restore the pronoun just before a replaced verb (« je », « me », « te », « se », « ne », « le », « la ») according to the new verb's initial letter and its elision ban.

#### Scenario: Élision perdue
- **GIVEN** « j'aime » dont le verbe devient un verbe à consonne initiale
- **WHEN** le texte résultant s'affiche
- **THEN** le pronom est rétabli en « je » suivi d'une espace

#### Scenario: Élision gagnée
- **GIVEN** « je chante » dont le verbe devient un verbe à voyelle initiale
- **WHEN** le texte résultant s'affiche
- **THEN** le pronom devient « j' » collé au verbe

### Requirement: Chargement à la demande
The system SHALL load the verb forms only when an enabled instance of the chain targets the verb track, SHALL leave targeted verbs unchanged with a loading reason until they arrive, SHALL then update the result without re-tagging, and SHALL let the user retry after a loading failure.

#### Scenario: Page ouverte sans verbes visés
- **GIVEN** la page à pistes avec la chaîne par défaut
- **WHEN** elle s'ouvre et qu'on lance un texte
- **THEN** le fichier des verbes n'est pas téléchargé

#### Scenario: Verbes visés
- **GIVEN** un texte mis en pistes
- **WHEN** on fait viser la piste des verbes à un S+7
- **THEN** les verbes restent d'abord tels quels avec la raison « conjugaisons en cours de chargement », puis le texte résultant se recalcule sans nouvel étiquetage
