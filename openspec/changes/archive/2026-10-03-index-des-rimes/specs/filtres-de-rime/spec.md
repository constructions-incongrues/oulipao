## ADDED Requirements

### Requirement: Le R+n et les homophonies au rythme du réglage en direct
The R+n and homophony filters SHALL rewrite a 200-word text, targeting all their tracks, in less than 100 ms at the 95th percentile with the derived files loaded, and SHALL give exactly the same words as a scan of the whole dictionary.

#### Scenario: Texte de référence
- **GIVEN** chacun des trois textes de référence de 200 mots, les fichiers dérivés chargés
- **WHEN** un R+1, puis une homophonie, visent toutes leurs pistes
- **THEN** chaque passage prend moins de 100 ms au 95e percentile, sous Node

#### Scenario: Mêmes mots qu'avant
- **GIVEN** les trois textes de référence, et les sorties du R+1, du R+3 et des homophonies obtenues avant l'index
- **WHEN** on les recalcule avec l'index
- **THEN** chaque mot de sortie et chaque raison sont identiques
