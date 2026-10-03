# Comment publier le site

Mettre en ligne une nouvelle version d'Oulipao sur `https://oulipao.incongru.org`. Le site est
statique : GitHub Pages sert des fichiers, tout le calcul tourne dans le navigateur du lecteur.

## Prérequis

- Node 22.18 ou plus récent, `npm ci` déjà fait.
- `python3`, pour l'aperçu local (n'importe quel serveur de fichiers statiques convient).
- Le droit de pousser sur `main` du dépôt `constructions-incongrues/oulipao`, ou une PR acceptée.

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

3. **Poussez sur `main`** (directement ou en fusionnant une PR). Le flux
   `.github/workflows/pages.yml` (« Publication ») enchaîne `npm ci`, `npm run typecheck`,
   `npm test`, `npm run build:site`, puis publie `_site/`. Pour republier sans nouveau commit :
   onglet Actions du dépôt, « Publication », « Run workflow ».

## Vérification

```bash
gh run list --workflow=pages.yml --limit 1
```

La dernière exécution est `completed` / `success`. Puis ouvrez `https://oulipao.incongru.org` :
la page à pistes s'affiche, et `https://oulipao.incongru.org/essai.html` montre la page d'essai.
GitHub Pages garde les fichiers en cache dix minutes (`max-age=600`) : rechargez sans cache si
l'ancienne version reste.

## Dépannage

| Symptôme | Cause | Correction |
|---|---|---|
| `build-site : source manquante, <chemin>` | un fichier attendu n'existe pas (souvent `data/*.tsv` dans un clone sans les données) | rétablir le fichier nommé ; pour les données, voir [régénérer les données](regenerer-les-donnees.md) |
| Le flux échoue à `npm test` | tests ou couverture sous 90 % | rien n'est publié, le site reste celui d'avant ; corriger et repousser |
| La page s'ouvre, mais la mise en pistes reste bloquée | jsDelivr ou Hugging Face ne répond pas | rien à corriger chez nous : le modèle vient de ces tiers (voir `TODOS.md`) |
| Le dictionnaire est l'ancien | version inchangée dans `src/ui/composition.ts` | voir [régénérer les données](regenerer-les-donnees.md), étape 3 |
| `essai.html` ou `tracks.html` en 404 en local | serveur lancé depuis le mauvais dossier | `_site/` pour le site assemblé, la racine du dépôt pour le développement |

## Voir aussi

- [Vue de déploiement](../arc42/07-vue-de-deploiement.md) : fournisseurs, réseau, environnements
- [Risques et dette technique](../arc42/11-risques-et-dette-technique.md) : dépendance aux tiers
