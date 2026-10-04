# Spec Delta

## ADDED Requirements

### Requirement: Nom de la recette sur ses instances
The system SHALL name each instance added by a recipe with the recipe's name followed by its choice in parentheses, when there is one, and SHALL use that name in the chain row (with the engine's name under it), the status sentence, the track strips' reminders, the inspector's band and the mention appended to a copy. The name SHALL be dropped once the instance's settings, targets, modulators or gate are changed; a duplicate SHALL keep it.

#### Scenario: Monovocalisme en a
- **GIVEN** un texte mis en pistes
- **WHEN** on branche la recette Monovocalisme en gardant « a »
- **THEN** la chaîne montre « Monovocalisme (a) » avec « Lipogramme » dessous, et la phrase d'état commence par « Monovocalisme (a) : »

#### Scenario: Réglée autrement
- **GIVEN** une instance branchée par Monovocalisme en « a »
- **WHEN** l'utilisateur change ses lettres
- **THEN** elle s'appelle de nouveau « Lipogramme » et se décrit par ses réglages
