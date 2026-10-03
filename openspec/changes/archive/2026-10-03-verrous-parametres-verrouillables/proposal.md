# Verrous réservés aux paramètres verrouillables

## Why

L'inspecteur propose un champ de verrou pour chaque paramètre entier de chaque instance en marche qui vise la piste du mot. Seul le S+7 lit ces verrous. Bord (`n`) et Mise en vers (`n`, `number`) les ignorent : un verrou posé sur eux est gardé et affiché (« Bord sur ce mot »), mais il ne change rien au texte.

## What Changes

- Un paramètre entier se déclare verrouillable (`lockable: true`) quand sa contrainte lit les verrous. Seul le décalage du S+7 l'est.
- L'inspecteur ne propose de champ de verrou que pour un paramètre verrouillable, et la table refuse un verrou sur un autre paramètre.

## Capabilities

### Modified Capabilities
- `verrous-de-parametres` : seul un paramètre déclaré verrouillable peut recevoir un verrou.
