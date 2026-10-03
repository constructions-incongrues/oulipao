# Composants tiers

Le code d'Oulipao est sous licence MIT (`LICENSE`). Le site embarque ou charge les composants suivants, chacun sous sa propre licence.

## Embarqués dans le site

| Composant | Usage dans Oulipao | Licence | Source |
|---|---|---|---|
| Spectral (Production Type) | texte lu | SIL Open Font License 1.1 (`fonts/LICENSE-spectral.txt`) | `@fontsource/spectral` 5.3.0 |
| Archivo (Omnibus-Type) | interface et étiquettes | SIL Open Font License 1.1 (`fonts/LICENSE-archivo.txt`) | `@fontsource-variable/archivo` 5.3.0 |
| Martian Mono (Evil Martians) | valeurs et numéros | SIL Open Font License 1.1 (`fonts/LICENSE-martian-mono.txt`) | `@fontsource-variable/martian-mono` 5.3.0 |
| Big Shoulders Stencil Display | la marque | SIL Open Font License 1.1 (`fonts/LICENSE-big-shoulders-stencil-display.txt`) | `@fontsource-variable/big-shoulders-stencil-display` 5.3.0 |
| Lexique français Grammalecte v7.7 (Olivier R., Dicollecte) | `data/lexique-oulipao.tsv`, `data/morpho-oulipao.tsv` et `data/verbes-oulipao.tsv` en sont dérivés (réduits aux colonnes utiles) | Mozilla Public License 2.0 (https://www.mozilla.org/MPL/2.0/) | https://grammalecte.net/ ; scripts de dérivation : `scripts/build-lexicon.ts`, `scripts/build-morphology.ts`, `scripts/build-verbs.ts` |
| fr-compromise (Spencer Kelly) | étiqueteur de la page d'essai, intégré à `dist/page.js` | MIT (`vendor/fr-compromise.LICENSE`) | https://github.com/nlp-compromise/fr-compromise |

## Chargés depuis des tiers au premier accès

Ces deux composants ne sont pas redistribués par Oulipao : le navigateur les télécharge directement chez leur hébergeur, puis les garde en cache. Aucun texte ne leur est envoyé.

| Composant | Usage dans Oulipao | Licence | Chargé depuis |
|---|---|---|---|
| Transformers.js (`@huggingface/transformers` 4.3.0) | exécute le modèle d'étiquetage dans le navigateur | Apache License 2.0 | `cdn.jsdelivr.net` |
| Modèle `Xenova/french-camembert-postag-model` | étiquetage grammatical du texte (noms, verbes, adjectifs…) | **non déclarée** par son auteur | Hugging Face (`huggingface.co`) |

La licence du modèle n'est pas déclarée. C'est pour cette raison qu'Oulipao ne le redistribue pas (`TODOS.md`).
