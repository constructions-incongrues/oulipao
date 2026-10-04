# Comment publier le site

Mettre en ligne une nouvelle version d'Oulipao sur `https://oulipao.incongru.org`. Le site est
statique : GitHub Pages sert des fichiers, tout le calcul tourne dans le navigateur du lecteur.
Une poussée sur `main` ne publie rien : le site change quand une version est fixée, en
fusionnant la PR de version que release-please tient à jour.

## Prérequis

- Node 22.18 ou plus récent, `npm ci` déjà fait.
- `python3`, pour l'aperçu local (n'importe quel serveur de fichiers statiques convient).
- Le droit de fusionner des PR sur le dépôt `constructions-incongrues/oulipao`.
- Des PR fusionnées en squash avec un titre conventionnel (`feat: …`, `fix: …`) : ce titre
  devient l'entrée du journal des versions.
- Une PR n'arrive sur `main` que par la file de fusion : `gh pr merge <numéro>` la met
  en file (dès que sa propre CI passe), et la file la fusionne en squash une fois « check »
  passé sur `main` avec elle. Aucun rôle, administrateur compris, ne peut fusionner
  autrement. N'ajoutez pas `--squash` : la file fixe la méthode, et `gh` répond alors « The
  merge strategy for main is set by the merge queue » avec un code de sortie 1, bien que la
  mise en file soit programmée.

## Étapes

1. **Assemblez le site** dans `_site/` (ignoré par git) :

   ```bash
   npm run build:site
   ```

   Le script reconstruit `dist/` (`npm run build`), puis copie :

   | Source | Dans `_site/` |
   |---|---|
   | `tracks.html` | `index.html` (la page à pistes est la page d'accueil) |
   | `index.html` | `essai.html` (la page d'essai des étiqueteurs) |
   | `dist/*.js`, `dist/*.js.map` | `dist/` |
   | `styles/`, `fonts/` | tels quels |
   | `data/lexique-oulipao.tsv`, `morpho-oulipao.tsv`, `verbes-oulipao.tsv` | `data/` (jamais `data/brut/`) |
   | `LICENSE`, `THIRD_PARTY_LICENSES.md` | à la racine |

   Il écrit aussi `.nojekyll` et `CNAME`. Il se termine par :

   ```
   Site assemblé dans _site/ pour https://oulipao.incongru.org
   ```

2. **Regardez le site assemblé** avant de le publier :

   ```bash
   python3 -m http.server 8766 --directory _site
   ```

   Ouvrez `http://localhost:8766/`, puis « Essayer avec un exemple ». Au premier accès, le
   navigateur télécharge le modèle d'étiquetage depuis Hugging Face (141 Mo, barre de
   progression en Mo) ; ensuite il est en cache.

3. **Fusionnez vos PR sur `main`** en les mettant en file (`gh pr merge <numéro>`). À chaque fusion, le flux `.github/workflows/release.yml`
   (« Versions et publication ») ouvre ou met à jour la PR de version, intitulée
   `chore(main): release 0.x.y`. Elle porte le prochain numéro dans `package.json` et les
   entrées de `CHANGELOG.md` (« Nouveautés », « Corrections »). Une PR `docs:` ou `chore:` seule
   n'ouvre pas de PR de version.

   ```bash
   gh pr list --label "autorelease: pending"
   ```

4. **Fusionnez la PR de version.** release-please étiquette `v0.x.y` et crée la release GitHub ;
   le même flux enchaîne alors `npm ci`, `npm run typecheck`, `npm test`, `npm run build:site`,
   puis publie `_site/`. La version publiée s'affiche dans la barre de marque.

   La PR de version passe par la file comme les autres. Ouverte par `github-actions`, elle voit
   son exécution de « check » (workflow `ci.yml`) attendre une approbation (`action_required`) :
   sur la PR, cliquez « Approve workflows to run ». Une fois « check » passé, mettez-la en file :

   ```bash
   gh pr merge <numéro>
   ```

   Chaque mise à jour de la PR de version par release-please redemande cette approbation.

**Publier à la main** (dépannage) : onglet Actions du dépôt, « Versions et publication »,
« Run workflow ». Le site est reconstruit depuis `main` tel quel, y compris des changements pas
encore versionnés ; la version affichée reste celle de `package.json`.

## Vérification

```bash
gh run list --workflow=release.yml --limit 1
```

La dernière exécution est `completed` / `success`. Puis ouvrez `https://oulipao.incongru.org` :
la page à pistes s'affiche avec le nouveau numéro (`v0.x.y`) dans sa barre de marque, et `https://oulipao.incongru.org/essai.html` montre la page d'essai.
GitHub Pages garde les fichiers en cache dix minutes (`max-age=600`) : rechargez sans cache si
l'ancienne version reste.

## Dépannage

| Symptôme | Cause | Correction |
|---|---|---|
| `build-site : source manquante, <chemin>` | un fichier attendu n'existe pas (souvent `data/*.tsv` dans un clone sans les données) | rétablir le fichier nommé ; pour les données, voir [régénérer les données](regenerer-les-donnees.md) |
| Le flux échoue à `npm test` | tests ou couverture sous 90 % | rien n'est publié, le site reste celui d'avant ; corriger, fusionner le correctif, puis la nouvelle PR de version |
| Aucune PR de version n'apparaît | aucun titre `feat:` ou `fix:` depuis la dernière version | normal pour `docs:` ou `chore:` ; sinon vérifier le titre du commit de squash sur `main` |
| Une PR manque au journal | titre non conventionnel | éditer la PR de version avant de la fusionner, ou publier à la main |
| La PR de version ne peut pas entrer en file | son exécution de « check » attend une approbation | « Approve workflows to run » sur la PR, attendre « check », puis `gh pr merge <numéro>` |
| Une PR sort de la file | « check » échoue sur `main` + la PR (souvent une autre PR fusionnée entre-temps) | mettre la branche à jour avec `main`, corriger, puis la remettre en file |
| La file n'avance pas | aucun « check » ne répond pour le groupe (déclencheur `merge_group` absent de `ci.yml`, Actions en panne) | au bout de 15 minutes la PR sort de la file ; vérifier `ci.yml` et l'état de GitHub Actions |
| Plus rien ne peut fusionner (Actions en panne durable) | la file exige « check » et aucun rôle ne la contourne | rétablir le contournement administrateur dans le ruleset « main : vérification obligatoire », fusionner, puis le retirer ; le geste reste dans le journal du ruleset |
| La page s'ouvre, mais la mise en pistes reste bloquée | jsDelivr ou Hugging Face ne répond pas | rien à corriger chez nous : le modèle vient de ces tiers (voir `TODOS.md`) |
| Le dictionnaire est l'ancien | version inchangée dans `src/ui/composition.ts` | voir [régénérer les données](regenerer-les-donnees.md), étape 3 |
| `essai.html` ou `tracks.html` en 404 en local | serveur lancé depuis le mauvais dossier | `_site/` pour le site assemblé, la racine du dépôt pour le développement |

## Voir aussi

- [Vue de déploiement](../arc42/07-vue-de-deploiement.md) : fournisseurs, réseau, environnements
- [Risques et dette technique](../arc42/11-risques-et-dette-technique.md) : dépendance aux tiers
