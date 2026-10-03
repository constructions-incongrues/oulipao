# Proposition : mise en ligne d'Oulipao

## Why

Oulipao ne s'ouvre que sur le poste du fondateur, après un serveur local lancé dans le dépôt. Une séance d'écriture commence donc par du terminal, et elle est impossible depuis un autre appareil. Or le fondateur lâche l'outil « si chaque séance demande d'abord du code » (`personas.md`). Il veut maintenant s'en servir de partout et pouvoir le montrer (PRD `.nanopm/wiki/docs/prds/mise-en-ligne-d-oulipao.md`).

## What Changes

- **Licence du code.** Le dépôt passe sous licence MIT. Un fichier des licences tierces nomme ce que le site embarque ou charge : polices OFL 1.1, lexique et morphologie dérivés de Grammalecte (MPL 2.0), fr-compromise (MIT), Transformers.js et le modèle CamemBERT, chargés depuis des tiers.
- **Assemblage du site.** Une commande construit un dossier `_site/` publiable. La page à pistes y devient la page d'accueil (`index.html`), la page d'essai passe à `essai.html`, et le dossier contient les scripts construits, les styles, les polices, les données et les licences.
- **Publication automatique.** À chaque poussée sur `main`, un workflow GitHub Actions lance les tests, assemble le site et le publie sur GitHub Pages. Si les tests échouent, rien n'est publié.
- **Dépôt public.** Le dépôt est créé sur GitHub et Pages y est activé. C'est une action du fondateur, faite une seule fois.
- **Adresse `https://oulipao.incongru.org`.** Le site publié porte un fichier `CNAME` et Pages est réglé sur ce domaine, avec HTTPS imposé. Dans la zone `incongru.org` chez Cloudflare, un enregistrement `CNAME` fait pointer `oulipao` vers `<compte>.github.io`, et un `TXT` vérifie le domaine auprès de GitHub. Ces enregistrements se posent par le connecteur Cloudflare.
- **Mesure de l'usage.** `RESULTATS.md` gagne une section « Séances en ligne », où le fondateur note ses séances faites depuis l'adresse publique.

Ce que la v1 ne fait **pas**, par décision du fondateur (2026-10-03) :
- le modèle d'étiquetage reste chargé depuis Hugging Face, et Transformers.js depuis jsDelivr ;
- pas de mesure d'audience, pas de fonctionnement hors ligne, pas de page de présentation ;
- les « non » de la stratégie restent : ni comptes, ni sauvegarde serveur, ni partage en un clic.

## Capabilities

### New Capabilities
- `mise-en-ligne` : l'adresse publique et ses pages, la publication depuis `main` sous condition de tests verts, la confidentialité du texte et les tiers autorisés, les licences publiées, l'absence de traceur.

### Modified Capabilities
<!-- Aucune : la mise en ligne ne change le comportement d'aucune capacité existante, qui fonctionne à l'identique à l'adresse publique. -->

## Impact

- **Nouveaux fichiers :**
  - `LICENSE` (MIT) et `THIRD_PARTY_LICENSES.md` ;
  - `scripts/build-site.ts` ;
  - `.github/workflows/pages.yml`.
- **Fichiers modifiés :**
  - `package.json` : champ `license` et script `build:site` ;
  - `.gitignore` : ajout de `_site/` ;
  - `RESULTATS.md` : section « Séances en ligne ».
- **Code applicatif :** inchangé. Les chemins sont déjà relatifs (`dist/`, `styles/`, `fonts/`, `data/`), et le chargement du modèle ne change pas.
- **Extérieur :**
  - un dépôt GitHub public ;
  - l'adresse `https://oulipao.incongru.org` ;
  - deux enregistrements dans la zone DNS `incongru.org` chez Cloudflare (le `CNAME` et le `TXT` de vérification GitHub).
