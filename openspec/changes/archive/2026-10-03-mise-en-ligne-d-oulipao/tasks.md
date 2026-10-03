# Tâches : mise en ligne d'Oulipao

Plan de construction : les tâches d'une même vague se font en parallèle, une vague après l'autre.
- Vague 0, en parallèle (fichiers disjoints) : 1.1, 2.2, 2.3
- Vague 1 : 2.1, après 1.1 (le script copie les licences)
- Vague 2 : 3.1, une action du fondateur
- Vague 3 : 3.2, domaine et DNS par le connecteur Cloudflare
- Vague 4 : 4.1

## 1. Licences (vague 0)

- [x] 1.1 Ajouter `LICENSE` (MIT, Tristan Rivoallan, 2026), le champ `"license": "MIT"` dans `package.json`, et `THIRD_PARTY_LICENSES.md`. Ce dernier liste les polices (OFL 1.1), le lexique et la morphologie dérivés de Grammalecte v7.7 (MPL 2.0, avec la source), fr-compromise (MIT), Transformers.js (jsDelivr, Apache 2.0) et le modèle CamemBERT (Hugging Face, licence non déclarée). Effort S, dépend de rien. Vérifié en relisant les deux fichiers contre `fonts/LICENSE-*.txt`, `vendor/fr-compromise.LICENSE` et `data/brut/README_lexique.txt`.

## 2. Site et publication (2.2 et 2.3 en vague 0, 2.1 en vague 1)

- [x] 2.1 scripts : écrire `scripts/build-site.ts` et `npm run build:site`. Le script construit, vide `_site/`, puis y copie `tracks.html` en `index.html`, `index.html` en `essai.html`, `dist/*.js` et `*.js.map`, `styles/`, `fonts/`, `data/*.tsv`, `LICENSE`, `THIRD_PARTY_LICENSES.md`, un `.nojekyll` et un `CNAME` contenant `oulipao.incongru.org`. Il échoue en nommant toute source manquante. Ajouter `_site/` à `.gitignore`. Effort M, dépend de 1.1 (fichiers de licence copiés). Vérifié en lançant `npm run build:site`, puis `python3 -m http.server` dans `_site/` : « Essayer avec un exemple » met le texte en pistes, et `essai.html` étiquette un texte.
- [x] 2.2 outillage : écrire `.github/workflows/pages.yml`. Le workflow se déclenche par une poussée sur `main` et par `workflow_dispatch`. Il enchaîne Node 22, `npm ci`, `npm run typecheck`, `npm test`, `npm run build:site`, `upload-pages-artifact` (`_site`) et `deploy-pages`, avec les permissions `pages: write`, `id-token: write` et `contents: read`, et la concurrence `pages`. Effort S, dépend de rien (le contrat `npm run build:site` → `_site/` est fixé par le design). Vérifié par une relecture contre la documentation de `actions/deploy-pages`. L'exécution réelle se fait en 3.1.
- [x] 2.3 docs : ajouter à `RESULTATS.md` la section « Séances en ligne », un tableau date, appareil, ce qui a été fait, texte gardé. Effort S, dépend de rien. Vérifié en relisant la section, qui permet de calculer la falsification du PRD (au moins 3 séances en ligne sur au moins 6 en 28 jours).

## 3. Dépôt public et domaine (vagues 2 et 3, actions du fondateur)

- [x] 3.1 Vérifier qu'aucun fichier commité n'est privé (`git ls-files`, en particulier `reference/`, `resultats/` et `.nanopm/`). Puis, **avec la confirmation du fondateur avant chaque geste extérieur** : créer le dépôt public `constructions-incongrues/oulipao` sur GitHub, ajouter le remote `origin`, pousser `main`, et régler Pages sur la source « GitHub Actions ». Effort S, dépend de 1.1, 2.1, 2.2 et 2.3 (tout est commité avant la première poussée). Vérifié quand le workflow est vert et que l'adresse `constructions-incongrues.github.io/oulipao` répond (elle redirigera vers le domaine après 3.2).
- [x] 3.2 Domaine `oulipao.incongru.org`. *Fait le 2026-10-03 : `CNAME` en place et non proxifié, domaine réglé dans Pages, certificat Let's Encrypt émis, HTTPS imposé, `http://` → `https://` en 301. Le `TXT` de vérification GitHub n'a pas été créé : le fondateur l'a jugé inutile (« ça fonctionne sans »). Le domaine n'est donc pas protégé contre une reprise par un autre compte GitHub.* *Écart du 2026-10-03 : le connecteur Cloudflare branché n'expose pas l'API DNS (seulement Workers, D1, KV, R2 et Hyperdrive). Le fondateur crée donc lui-même les deux enregistrements dans le tableau de bord ; le reste est inchangé.* Prérequis prévu : le connecteur Cloudflare est connecté, avec un droit d'écriture sur la zone `incongru.org`. **Avec la confirmation du fondateur avant chaque écriture :**
  - par le connecteur Cloudflare, créer dans la zone `incongru.org` le `CNAME` `oulipao` → `constructions-incongrues.github.io`, non proxifié ;
  - créer aussi le `TXT` `_github-pages-challenge-constructions-incongrues` avec la valeur donnée par GitHub (vérification du domaine pour l'organisation) ;
  - côté GitHub, régler le domaine personnalisé de Pages sur `oulipao.incongru.org`, attendre le certificat, puis cocher « Enforce HTTPS ».

  Effort S, dépend de 3.1. Vérifié quand `dig oulipao.incongru.org` renvoie vers `constructions-incongrues.github.io`, que le domaine apparaît comme vérifié dans GitHub, que `https://oulipao.incongru.org` répond avec un certificat valide, et que `http://` redirige vers `https://`.

## 4. Vérification en ligne (vague 4)

- [ ] 4.1 Sur `https://oulipao.incongru.org`, avec le cache vidé et l'onglet réseau ouvert :
  - ouvrir l'adresse et vérifier que la page à pistes s'affiche ;
  - cliquer « Essayer avec un exemple », attendre le texte résultant, boucher un pas et vérifier que le texte change ;
  - vérifier qu'aucune requête ne contient le texte, et que toute requête hors du site va vers `cdn.jsdelivr.net` ou vers Hugging Face ;
  - recharger et vérifier que les poids du modèle viennent du cache ;
  - ouvrir `essai.html`, `LICENSE` et `THIRD_PARTY_LICENSES.md`.

  Recommencer sur un second appareil (téléphone) et noter la première séance dans `RESULTATS.md`. Effort S, dépend de 3.2 et de 2.3 (la section où noter la séance). Vérifié quand chaque assertion est constatée. Captures jointes au compte rendu.
