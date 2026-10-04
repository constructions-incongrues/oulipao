# Proposal

## Why

Plusieurs sessions travaillent en parallèle et fusionnent sur `main` (30 PR en deux jours). Le ruleset exige le check « check », mais pas que la PR soit à jour : une PR verte sur une base périmée peut arriver sur `main` sans que la combinaison ait été testée. C'est arrivé le 2026-10-04 : le squash de #75 a rejoint #74 sur `main` sans aucune exécution de CI sur leur somme. Le contournement administrateur (`bypass: always`) laisse en plus une fusion directe hors de toute vérification.

## What Changes

- **File de fusion sur `main`.** Une PR n'arrive sur `main` qu'après que la CI a passé sur `main` + la PR (+ les PR qui la précèdent dans la file). Méthode squash, titre de la PR, check « check » obligatoire.
- **La CI tourne aussi dans la file.** `ci.yml` écoute `merge_group`. Sa clé de concurrence ne s'appuie plus seulement sur le numéro de PR, absent dans la file.
- **BREAKING (process)** : le contournement administrateur est retiré du ruleset. `gh pr merge --admin` ne fusionne plus. La PR de version de release-please passe aussi par la file, après approbation de l'exécution de sa CI.
- **Le guide `docs/guides/publier-le-site.md`** est mis à jour : fusionner par la file, approuver la CI de la PR de version. Il ne parle plus de `--admin`, et il corrige l'affirmation que la PR de version ne reçoit jamais le check.

## Capabilities

### New Capabilities

### Modified Capabilities
- `mise-en-ligne` : ajoute la fusion par file comme seule voie vers `main`, y compris pour la PR de version.

## Impact

- `.github/workflows/ci.yml` : déclencheur `merge_group` et clé de concurrence.
- Réglage du dépôt GitHub hors du code : le ruleset « main : vérification obligatoire » (id 24430545) gagne la règle `merge_queue` et perd son contournement administrateur.
- `docs/guides/publier-le-site.md`, et la consigne de `CLAUDE.md` sur la fusion des PR.
- Les sessions et agents : `gh pr merge --squash` met désormais une PR en file au lieu de la fusionner ; une PR en conflit textuel reste à mettre à jour à la main.
- Aucun code de l'application.
