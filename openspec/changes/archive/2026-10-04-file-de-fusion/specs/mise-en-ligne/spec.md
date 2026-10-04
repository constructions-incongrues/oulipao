# Spec Delta

## ADDED Requirements

### Requirement: Fusion par file
The repository SHALL accept a change on `main` only through its merge queue: a pull request SHALL be merged, squashed under its title, only after the required check « check » has passed on the combination of `main`, the pull requests ahead of it in the queue, and the pull request itself. No role SHALL be able to bypass this rule. A pull request whose combination fails the check SHALL leave the queue without reaching `main`.

#### Scenario: Deux PR vertes chacune de leur côté
- **GIVEN** deux PR vertes sur leur propre base, qui modifient le même module sans conflit textuel
- **WHEN** elles sont mises en file l'une après l'autre
- **THEN** la seconde n'arrive sur `main` qu'après que « check » a passé sur `main` avec les deux PR

#### Scenario: Combinaison cassée
- **GIVEN** une PR en file dont la combinaison avec `main` fait échouer un test
- **WHEN** la file exécute « check »
- **THEN** la PR sort de la file, `main` ne change pas, et la PR reste ouverte

#### Scenario: Fusion directe refusée
- **GIVEN** une PR verte et un compte administrateur
- **WHEN** l'administrateur tente de la fusionner sans passer par la file (`gh pr merge --admin`)
- **THEN** GitHub refuse la fusion

#### Scenario: PR de version
- **GIVEN** la PR de version ouverte par release-please, dont l'exécution de « check » attend une approbation
- **WHEN** le fondateur approuve cette exécution, puis met la PR en file une fois « check » passé
- **THEN** la PR de version arrive sur `main` par la file, et la publication suit comme avant
