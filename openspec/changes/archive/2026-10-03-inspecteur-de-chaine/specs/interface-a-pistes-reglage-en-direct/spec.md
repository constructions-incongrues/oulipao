# Spec Delta

## REMOVED Requirements

### Requirement: Partition en systèmes
**Reason**: La partition ne sert pas à écrire, occupe la moitié de la page et ne dit pas ce qu'une chaîne de filtres a fait d'un mot (PRD « Inspecteur de chaîne », 2026-10-03).
**Migration**: Le texte résultant prend la colonne de droite ; pour suivre un mot, cliquer le mot et lire l'inspecteur (capacité `inspecteur-de-chaine`). Les catégories restent visibles dans les tranches et dans le soulignement des mots changés.

### Requirement: Blocs des noms remplacés
**Reason**: Les blocs disparaissent avec la partition.
**Migration**: Un mot remplacé est souligné dans le texte résultant, son infobulle donne le mot d'origine ; l'inspecteur montre le remplaçant à chaque étape.
