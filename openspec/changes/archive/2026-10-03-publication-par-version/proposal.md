# Proposition

## Pourquoi

Aujourd'hui, chaque poussée sur `main` change le site publié. Le fondateur ne choisit pas le moment de la mise en ligne, rien ne dit ce qui a changé ni quand, et l'outil ne dit pas quelle version il est en train de servir. release-please règle ces trois points avec un seul mécanisme. Le projet n'a encore ni version, ni tag, ni journal : c'est le moment le moins coûteux pour en adopter un.

## Ce qui change

- **BREAKING (processus)** : une poussée sur `main` ne publie plus le site. release-please tient à jour une « PR de version » qui fixe la prochaine version et le journal. Le site n'est publié qu'à la fusion de cette PR, et seulement si les tests passent. La publication manuelle reste possible.
- Le projet reçoit un numéro de version (départ `0.1.0`) et un `CHANGELOG.md` en français, avec des sections « Nouveautés » et « Corrections ».
- La version publiée s'affiche dans la barre de marque de la page à pistes et dans l'introduction de la page d'essai. Elle mène au journal des versions.
- Convention de travail : les PR sont fusionnées en squash, et leur titre suit les Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`…), avec une description en français. Les commits des branches restent libres.

## Capacités

### Nouvelles capacités

Aucune.

### Capacités modifiées

- `mise-en-ligne` : l'exigence « Publication depuis main » devient une publication à chaque version. S'y ajoutent l'affichage de la version publiée et un journal des versions.

## Impact

- `.github/workflows/pages.yml` : remplacé par un workflow qui enchaîne release-please, puis le build et le déploiement si une version vient d'être créée.
- Nouveaux fichiers à la racine : `release-please-config.json`, `.release-please-manifest.json` et `CHANGELOG.md` (ce dernier est produit par release-please).
- `package.json` : champ `version` ; le script `build` injecte la version dans le bundle.
- `src/ui/tracks/main.ts`, `src/ui/tracks/app.ts`, `index.html` et `src/ui/page.ts` : affichage de la version.
- `CLAUDE.md` : règle sur les titres de PR.
- Réglage GitHub, à faire par le fondateur : autoriser seulement le squash-merge, et laisser le titre de la PR servir de message de commit.
- Aucune nouvelle dépendance npm : release-please tourne comme une action GitHub.
