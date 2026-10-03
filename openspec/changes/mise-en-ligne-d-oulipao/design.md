# Design : mise en ligne d'Oulipao

## Context

- **Les pages sont déjà statiques.** `tracks.html` charge `dist/tracks.js`, et `index.html` (la page d'essai) charge `dist/page.js`. Les deux lisent `styles/tokens.css` et `fonts/`, puis les données par des chemins relatifs au script : `data/lexique-oulipao.tsv`, `data/morpho-oulipao.tsv`, `data/verbes-oulipao.tsv` (`src/ui/composition.ts`). esbuild embarque `vendor/fr-compromise.mjs` dans `dist/page.js`.
- **Le modèle vient de tiers.** Transformers.js arrive de jsDelivr, les poids de Hugging Face (`src/adapters/taggers/camembert-model.ts`). Le fondateur garde ce fonctionnement en v1.
- **Le dépôt n'a ni remote, ni licence.** Le fondateur a choisi GitHub Pages et la licence MIT (2026-10-03).
- **L'adresse sera `https://oulipao.incongru.org`.** La zone DNS `incongru.org` est chez Cloudflare, et le fondateur veut qu'on la règle par le connecteur Cloudflare.
- **`data/` pèse 724 Mo, mais presque tout est dans `data/brut/`**, qui est ignoré. Le site n'a besoin que des trois `.tsv` (environ 13 Mo en tout).

## Goals / Non-Goals

**Goals :**
- Une adresse publique qui ouvre la page à pistes.
- Une publication automatique, conditionnée aux tests.
- Des licences claires.
- Rien de neuf dans le code applicatif.

**Non-Goals :**
- Servir le modèle ou Transformers.js depuis Oulipao (v2, après la licence du modèle : `TODOS.md`).
- Mesure d'audience, PWA, page de présentation.

## Decisions

### 1. Un dossier `_site/` assemblé par un script (scripts)

`scripts/build-site.ts` lance la construction existante (esbuild, via `npm run build`), vide `_site/`, puis copie :

| Source | Destination |
|---|---|
| `tracks.html` | `_site/index.html` |
| `index.html` | `_site/essai.html` |
| `dist/*.js`, `dist/*.js.map` | `_site/dist/` |
| `styles/`, `fonts/` | `_site/styles/`, `_site/fonts/` |
| `data/*.tsv` (pas `data/brut/`) | `_site/data/` |
| `LICENSE`, `THIRD_PARTY_LICENSES.md` | `_site/` |
| (vide) | `_site/.nojekyll`, pour que Pages serve les fichiers tels quels |
| `oulipao.incongru.org` | `_site/CNAME`, le domaine du site pour Pages |

Le script échoue en nommant le fichier manquant si une source attendue n'existe pas. Commande : `npm run build:site`. `_site/` est ignoré par git.

*Pourquoi pas publier la racine du dépôt :* elle contient `data/brut/` (hors git), `reference/`, `resultats/`, `openspec/` et le wiki, qui n'ont rien à faire en ligne. Et la page d'accueil doit être la page à pistes, pas la page d'essai.

*Pourquoi pas renommer les pages dans le dépôt :* `index.html` reste la page d'essai en local, ce qui ne casse ni les habitudes ni `.claude/launch.json`. Seul le site publié change les noms.

Les chemins restent relatifs, donc le site fonctionne à la racine du domaine comme sous le sous-chemin `/oulipao/` de `<compte>.github.io`, sans configuration.

### 2. Un workflow GitHub Actions (outillage)

`.github/workflows/pages.yml`, déclenché par `push` sur `main` (et à la main, `workflow_dispatch`) :
1. `actions/checkout`, puis `actions/setup-node` (Node 22, cache npm), puis `npm ci` ;
2. `npm run typecheck` et `npm test`, dont l'échec arrête tout ;
3. `npm run build:site` ;
4. `actions/upload-pages-artifact` (dossier `_site`), puis `actions/deploy-pages`.

Permissions : `pages: write`, `id-token: write`, `contents: read`. La concurrence est limitée à un déploiement à la fois.

### 3. Domaine `oulipao.incongru.org` (DNS chez Cloudflare)

- **DNS, par le connecteur Cloudflare, dans la zone `incongru.org` :**
  - un `CNAME` `oulipao` → `<compte>.github.io`, **non proxifié** (nuage gris), pour que GitHub obtienne lui-même le certificat Let's Encrypt et impose HTTPS ;
  - un `TXT` `_github-pages-challenge-<compte>.incongru.org`, avec la valeur que GitHub fournit dans les réglages Pages du compte. Il vérifie le domaine et empêche qu'un autre compte le prenne.
- **Côté GitHub :** dans Pages, le domaine personnalisé est `oulipao.incongru.org` et « Enforce HTTPS » est coché, une fois le certificat émis. Le fichier `CNAME` publié avec le site garde ce réglage à chaque déploiement.
- *Pourquoi non proxifié :* derrière le proxy Cloudflare, GitHub ne peut pas valider le domaine pour émettre son certificat. On pourra passer en proxifié plus tard, en mode SSL « Full (strict) », si on veut le cache de Cloudflare ; ce n'est pas nécessaire en v1.
- *Prérequis :* le connecteur Cloudflare doit être connecté à la session (réglages des connecteurs de claude.ai), avec un droit d'écriture sur la zone `incongru.org`. Chaque écriture DNS est confirmée par le fondateur avant d'être faite.

### 4. Licences (racine)

- `LICENSE` : texte MIT, au nom de Tristan Rivoallan, 2026. `package.json` gagne `"license": "MIT"`.
- `THIRD_PARTY_LICENSES.md` : un tableau composant, usage, licence, source :
  - Spectral, Archivo, Martian Mono et Big Shoulders Stencil Display : SIL OFL 1.1 (`fonts/LICENSE-*.txt`) ;
  - lexique et morphologie Grammalecte v7.7 : MPL 2.0, avec l'adresse de la source et la mention que les fichiers `data/*.tsv` en sont dérivés ;
  - fr-compromise : MIT (`vendor/fr-compromise.LICENSE`) ;
  - Transformers.js : chargé depuis jsDelivr, Apache 2.0 ;
  - le modèle `Xenova/french-camembert-postag-model` : chargé depuis Hugging Face, licence non déclarée.

### 5. Mesurer l'usage sans traceur (docs)

`RESULTATS.md` gagne une section « Séances en ligne » : un tableau date, appareil, ce qui a été fait, texte gardé (oui ou non). C'est la mesure de la falsification du PRD, et le site ne contient aucun traceur.

### 6. Chargement du modèle à l'ouverture

La question UX du PRD (charger à l'ouverture ou au clic) n'a pas été tranchée. On garde donc le comportement actuel : chargement dès l'ouverture, sauf quand le navigateur demande d'économiser les données. Aucun changement de code.

### Couches et ports

Aucun module applicatif nouveau. `scripts/build-site.ts` est un script d'assemblage : il touche le système de fichiers directement, comme les autres scripts, et n'a ni port ni domaine.

## Risks / Trade-offs

- **Deux tiers au premier accès** (jsDelivr et Hugging Face). C'est assumé en v1, et dit dans les licences et dans la spec. Si l'un des deux tombe, la page affiche déjà l'échec et propose de relancer.
- **Créer un dépôt public expose tout l'historique.** Il faut vérifier, avant la première poussée, que rien de privé n'est commité : `data/brut/` est ignoré, mais `reference/` et `resultats/` sont publics.
- **Un enregistrement DNS orphelin est une porte ouverte.** Si le dépôt ou Pages disparaît, le `CNAME` pointerait vers un site que n'importe quel compte GitHub pourrait réclamer. Le `TXT` de vérification ferme ce risque : il est obligatoire, pas optionnel.
- **La licence du modèle reste inconnue.** Le site ne le redistribue pas en v1, donc ce n'est pas bloquant ; ça le redeviendra pour la v2.
