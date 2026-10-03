# Oulipao

Ouvroir de Littérature Potentielle Assistée par Ordinateur. Collez un texte français : Oulipao
le range en pistes (noms, verbes, adjectifs, adverbes, mots-outils) et y branche des
contraintes de l'Oulipo, S+7, lipogramme, Haï-kaïsation, rimes embrassées, sonnet monorime…, que l'on règle en direct comme les
effets d'une table de mixage.

Tout tourne dans le navigateur : le texte ne part nulle part.

**Essayer :** <https://oulipao.incongru.org>

## Démarrer

Il faut Node 22.18 ou plus récent (le dépôt lance le TypeScript sans compilation) et `python3`
pour servir la page.

```bash
npm ci
```

```bash
npm run build && python3 -m http.server 8765
```

Ouvrez `http://localhost:8765/tracks.html`. Au premier accès, le navigateur télécharge le
modèle d'étiquetage (141 Mo). La page d'essai des étiqueteurs est `index.html`.

## Commandes

| Commande | Effet |
|---|---|
| `npm run build` | assemble `src/` en `dist/tracks.js` et `dist/page.js` (esbuild) |
| `npm test` | lance les tests ; échoue sous 90 % de couverture (lignes, branches, fonctions) |
| `npm run typecheck` | vérifie les types (TypeScript strict) |
| `npm run build:site` | assemble le site publié dans `_site/` |
| `npm run build:lexicon`, `build:morphology`, `build:verbs` | dérivent `data/*.tsv` du lexique Grammalecte |
| `npm run check:palette` | vérifie les contrastes et l'écart en daltonisme des couleurs de `DESIGN.md` |
| `npm run measure` | mesure les étiqueteurs sur les textes de référence |
| `npm run build:references`, `transform:references` | construisent les textes de référence et leurs grilles de relecture S+7 |

## Organisation

Architecture hexagonale, en TypeScript strict ; les entités sont des schémas zod.

| Dossier | Contenu |
|---|---|
| `src/domain/` | le cœur, pur : découpage, chaîne de contraintes, mixage, et une contrainte par dossier (`s7/`, `lipogram/`, `track-sort/`, `edge/`, `lineation/`) |
| `src/ports/` | les interfaces : étiqueteur, source de texte, morphologie, verbes |
| `src/adapters/` | ce qui les sert : lexique, étiqueteurs, fichiers |
| `src/ui/` | la page à pistes (Preact et htm, sans JSX) et la page d'essai |
| `data/` | dictionnaires dérivés de Grammalecte (MPL 2.0) |
| `openspec/` | les spécifications et les changements en cours |

## Documentation

Pour apprendre :

- [Votre première contrainte](docs/tutoriel-premiere-contrainte.md) : écrire une contrainte
  jouet et la brancher sur la page, en six étapes.

Pour faire :

- [Comment écrire une contrainte](docs/guides/ecrire-une-contrainte.md)
- [Comment ajouter une recette](docs/guides/ajouter-une-recette.md)
- [Comment régénérer les données dérivées](docs/guides/regenerer-les-donnees.md)
- [Comment publier le site](docs/guides/publier-le-site.md)

Pour consulter :

- [Le contrat des plugins](docs/plugins.md) : ce qu'une contrainte déclare et rend
- [Le moteur S+7](docs/s7.md) : la règle, les accords, les limites connues
- [L'interface à pistes](docs/tracks.md) : vocabulaire, chaîne, comportement de la page
- [Système de design](DESIGN.md) : polices, couleurs, espacements
- [Résultats de l'essai technique](RESULTATS.md) : mesures des étiqueteurs

Pour comprendre :

- [Architecture (arc42)](docs/arc42/01-introduction-et-objectifs.md) : objectifs, contexte,
  stratégie, briques, exécution, déploiement, décisions, risques
- [Recensement des lexiques](docs/lexiques.md) : pourquoi Grammalecte

## Licence

Code sous licence MIT ([`LICENSE`](LICENSE)). Les dictionnaires de `data/` restent sous MPL 2.0,
comme le lexique Grammalecte dont ils dérivent ; les autres composants tiers sont listés dans
[`THIRD_PARTY_LICENSES.md`](THIRD_PARTY_LICENSES.md).
