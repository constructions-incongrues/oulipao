# Tasks

## 1. PR « ci: » sous les règles actuelles

- [x] 1.1 (ci, aucune couche hexagonale) Dans `.github/workflows/ci.yml`, ajouter le déclencheur `merge_group` et la clé de concurrence `ci-${{ github.event.pull_request.number || github.ref }}` (design, décision 1). Mettre à jour le commentaire d'en-tête : la CI vérifie chaque PR et chaque groupe de la file. Le job garde le nom `check`. Vérifier qu'`actionlint` passe s'il est disponible, sinon relire le YAML, et que « check » de la PR passe sur `pull_request`.
- [x] 1.2 (docs) Réécrire l'étape 4 de `docs/guides/publier-le-site.md` :
  - approuver l'exécution de « check » de la PR de version, puis la mettre en file avec `gh pr merge <n> --squash` ;
  - retirer `--admin` et la phrase « ne le reçoit jamais » ;
  - dans les prérequis et l'étape 3, dire que les PR passent par la file ;
  - ajouter au tableau de dépannage : « la PR sort de la file », « la file n'avance pas (check sans réponse) » et « retour en arrière du ruleset ».

  Vérifier en relisant le guide de bout en bout.
- [x] 1.3 (docs) Dans `CLAUDE.md`, remplacer « PR fusionnées en squash » par « PR fusionnées en squash par la file de fusion (`gh pr merge <n> --squash` met en file) ». Vérifier que la consigne reste sur une ligne lisible.
- [ ] 1.4 Ouvrir la PR `ci: file de fusion sur main` et la fusionner avec les règles actuelles, une fois « check » vert. Vérifier qu'elle est sur `main` et que `npm test` passe sur `main`.

## 2. Bascule du ruleset (réglage du dépôt, avec l'accord du fondateur au moment de l'appliquer)

- [ ] 2.1 Sauvegarder l'état actuel : `gh api repos/constructions-incongrues/oulipao/rulesets/24430545 > /tmp/ruleset-avant.json` (dans le dossier de travail de la session). Copier l'essentiel dans la description de la PR d'archive, pour pouvoir revenir en arrière. Vérifier que le fichier contient `bypass_actors` et `required_status_checks`.
- [ ] 2.2 Faire un `PUT` du ruleset 24430545 : garder `required_status_checks` à l'identique, ajouter la règle `merge_queue` (design, décision 2) et vider `bypass_actors`. Vérifier par un `gh api` relu : deux règles (`required_status_checks`, `merge_queue` en `SQUASH`) et `bypass_actors: []`.

## 3. Vérification par une PR qui traverse la file

- [ ] 3.1 Archiver ce changement (`openspec archive file-de-fusion`) dans une PR `docs: archive du changement file-de-fusion`, puis lancer `gh pr merge <n> --squash`. Vérifier :
  - `gh` annonce la mise en file ;
  - une exécution `merge_group` de « Vérification » réussit sur une référence `gh-readonly-queue/main/…` ;
  - la PR arrive sur `main` sous son titre, en un seul commit.
- [ ] 3.2 Vérifier que le contournement a disparu. Dans le même essai, avant la mise en file, `gh pr merge <n> --squash --admin` doit être refusé (scénario « Fusion directe refusée »). Noter le message dans la PR.
- [ ] 3.3 À la prochaine PR de version, appliquer le guide (approuver la CI, mettre en file), puis trancher la question ouverte du design : la route `gh api …/runs/<id>/approve` marche-t-elle ? Corriger le guide selon le résultat. Vérifier que la version est publiée.
