## ADDED Requirements

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
