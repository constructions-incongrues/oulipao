# Design

## Context

Le constat et ses raisons sont dans proposal.md. Voici l'état observé le 2026-10-04.

- **Le ruleset 24430545 « main : vérification obligatoire »** :
  - cible : la branche par défaut ;
  - une seule règle, `required_status_checks`, avec le contexte `check` (intégration 15368, GitHub Actions) et `strict_required_status_checks_policy: false` ;
  - contournement : `RepositoryRole 5` (administrateur), `bypass_mode: always`.
- **La fusion** : squash seul, titre = titre de la PR (`squash_merge_commit_title: PR_TITLE`), branche supprimée à la fusion. Le dépôt est public, dans une organisation, donc la file de fusion est disponible.
- **`ci.yml`** se déclenche sur `pull_request` seulement. Sa clé de concurrence est `ci-${{ github.event.pull_request.number }}`, avec `cancel-in-progress: true`. Le job s'appelle `check` et dure environ 45 s.
- **`release.yml`** se déclenche sur `push` vers `main` et `workflow_dispatch`. Il n'écrit rien sur `main` : release-please pousse sur sa propre branche, et l'étiquette ainsi que la release passent par l'API.
- **La PR de version** (ouverte par `github-actions`) : son exécution de « check » s'arrête en `action_required`. Une fois approuvée, elle tourne et réussit (PR #67, exécution 37169588681). Le guide `docs/guides/publier-le-site.md` affirme à tort qu'elle ne reçoit jamais le check, et prescrit `gh pr merge --squash --admin`.

## Goals / Non-Goals

**Goals:**
- Aucun commit n'arrive sur `main` sans que « check » ait passé sur l'état exact qui y arrive.
- Basculer sans moment où plus rien ne peut fusionner.

**Non-Goals:**
- Résoudre les conflits textuels : une PR en conflit reste à mettre à jour à la main.
- Changer `release.yml`, ou le jeton de release-please (PAT, application GitHub).

## Decisions

### 1. `ci.yml` écoute `merge_group`, et sa clé de concurrence retombe sur la référence
```yaml
on:
  pull_request:
  merge_group:
concurrency:
  group: ci-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```
Dans un événement `merge_group`, `pull_request.number` est vide. Sans ce repli, toutes les exécutions de la file partageraient le groupe `ci-` et s'annuleraient entre elles. Chaque groupe de la file a sa propre référence (`gh-readonly-queue/main/pr-…`), donc l'annulation ne touche que les poussées successives sur une même PR, comme aujourd'hui. Le nom du job reste `check`, pour que le contexte obligatoire ne change pas.
- *Alternative écartée :* un workflow séparé pour la file. Il dupliquerait les étapes de vérification et ferait deux contextes à tenir.

### 2. La règle de file dans le ruleset existant, et rien ne peut la contourner
Un `PUT repos/constructions-incongrues/oulipao/rulesets/24430545` garde la règle `required_status_checks` telle quelle, ajoute la règle suivante, et vide `bypass_actors` :
```json
{ "type": "merge_queue", "parameters": {
    "merge_method": "SQUASH", "grouping_strategy": "ALLGREEN",
    "max_entries_to_build": 5, "max_entries_to_merge": 5,
    "min_entries_to_merge": 1, "min_entries_to_merge_wait_minutes": 0,
    "check_response_timeout_minutes": 15 } }
```
- `min_entries_to_merge: 1` et une attente nulle : une PR seule passe tout de suite, sans attendre qu'un lot se forme.
- `ALLGREEN` : un lot n'est fusionné que si toutes ses entrées passent. Une entrée qui casse sort de la file, et les suivantes sont reconstruites sans elle.
- `check_response_timeout_minutes: 15` : la CI dure moins d'une minute. Un check qui ne répond pas, par exemple quand `merge_group` manque, fait sortir la PR au lieu de bloquer la file.
- Un seul ruleset reste à lire, plutôt que deux.
- *Alternative écartée :* `strict_required_status_checks_policy: true`. Il faudrait mettre chaque PR à jour à la main, et recommencer dès qu'une autre PR passe entre-temps.

### 3. L'ordre de bascule
1. PR « ci: … » : `ci.yml` (décision 1), le guide et `CLAUDE.md`. Elle est fusionnée sous les règles actuelles : « check » passe sur `pull_request`.
2. Mise à jour du ruleset (décision 2), une fois la PR 1 sur `main`, puisque la file lit le `ci.yml` de la branche de base.
3. Une PR de test traverse la file : l'archive de ce changement. Elle doit arriver sur `main` en passant par un `merge_group` (« check » visible sur la référence `gh-readonly-queue/…`).

Si on inverse 1 et 2, la file attend un check qui ne vient jamais. Le délai de 15 minutes limite les dégâts, mais plus rien ne fusionne.

### 4. Comment on fusionne désormais
- **Une PR ordinaire** : `gh pr merge <n> --squash`. Quand la branche exige une file, `gh` met la PR en file au lieu de la fusionner. La fusion arrive plus tard, sans que personne ait à surveiller la CI.
- **La PR de version** : on approuve l'exécution de « check » en attente (« Approve workflows to run » sur la PR), puis on la met en file une fois « check » passé.
- **`--admin` ne fusionne plus.** C'est voulu.

## Risks / Trade-offs

- **[CI en panne, ou GitHub Actions indisponible] → plus rien ne fusionne.** On rétablit le contournement par un `PUT` du ruleset, avec la commande de retour en arrière ci-dessous. Ce geste est explicite et laisse une trace dans le journal du ruleset.
- **[L'approbation de la CI de la PR de version est oubliée] → la PR de version ne peut pas entrer dans la file.** Le guide en fait une étape à part entière. Si ça devient pénible, il faudra un jeton dédié pour release-please, hors de ce changement.
- **[Chaque fusion attend une exécution de CI d'environ 45 s, plus la mise en file]** → C'est accepté : c'est le prix de la garantie.
- **[Les sessions en cours suivent encore l'ancienne consigne (`--admin`)]** → La commande échoue avec un message clair. `CLAUDE.md` porte la nouvelle consigne.

## Migration Plan

Les étapes sont celles de la décision 3. Pour revenir en arrière, on remet le ruleset dans son état d'origine : `required_status_checks` seul, et le contournement `RepositoryRole 5 / always`. On garde l'état d'origine dans `tasks.md` avant toute modification. `merge_group` peut rester dans `ci.yml` sans effet.

## Open Questions

- Peut-on approuver par `gh api -X POST repos/constructions-incongrues/oulipao/actions/runs/<id>/approve` l'exécution en attente d'une PR ouverte par `github-actions` ? Cette route vise d'abord les PR venues d'une fourche. Sinon, le bouton de l'interface suffit. On le vérifiera à la première PR de version après la bascule, et on corrigera le guide selon le résultat.
