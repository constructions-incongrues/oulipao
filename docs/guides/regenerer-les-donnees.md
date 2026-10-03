# Comment régénérer les données dérivées

Refaire les trois fichiers de `data/` à partir du lexique Grammalecte, après avoir changé un
script de dérivation ou la version du lexique.

| Fichier | Script | Sert à | Lu par |
|---|---|---|---|
| `data/lexique-oulipao.tsv` | `npm run build:lexicon` | l'étiqueteur par consultation du lexique | la page d'essai seulement |
| `data/morpho-oulipao.tsv` | `npm run build:morphology` | noms, adjectifs et adverbes des contraintes | la page à pistes, à la première contrainte |
| `data/verbes-oulipao.tsv` | `npm run build:verbs` | conjugaisons du V+n et du lipogramme | la page à pistes, quand une instance vise les verbes |

Les trois restent sous MPL 2.0, comme le lexique d'origine : chaque script écrit la notice en
tête du fichier. Le choix de Grammalecte est expliqué dans [`docs/lexiques.md`](../lexiques.md).

## Prérequis

- Node 22.18 ou plus récent, `npm ci` déjà fait.
- `unzip` et environ 70 Mo libres pour le lexique brut.

## Étapes

1. **Téléchargez et décompressez le lexique** dans `data/brut/` (ignoré par git : il ne part ni
   dans le dépôt ni sur le site) :

   ```bash
   mkdir -p data/brut && curl -L -o data/brut/lexique-grammalecte-fr-v7.7.zip https://grammalecte.net/dic/lexique-grammalecte-fr-v7.7.zip
   ```

   ```bash
   unzip -o data/brut/lexique-grammalecte-fr-v7.7.zip -d data/brut
   ```

   Vous devez obtenir `data/brut/lexique-grammalecte-fr-v7.7.txt` (55 Mo).

2. **Lancez les scripts** dont vous voulez le résultat. Chacun écrit une ligne de statistiques :

   ```bash
   npm run build:lexicon
   ```

   ```
   {"forms":476104,"ambiguous":51957,"nounRowsWithGender":115184,"nounLemmasWithGender":54233}
   ```

   ```bash
   npm run build:morphology
   ```

   ```
   {"rows":197920,"nouns":115117}
   ```

   ```bash
   npm run build:verbs
   ```

   ```
   {"rows":421972,"infinitives":8403}
   ```

   Ces nombres sont ceux de Grammalecte v7.7 avec les scripts actuels.

3. **Changez la version du fichier servi** si son contenu a changé, sinon les navigateurs
   gardent l'ancien en cache. Dans `src/ui/composition.ts` :
   - `MORPHOLOGY_VERSION` après `build:morphology` ;
   - `VERBS_VERSION` après `build:verbs`.

   Prenez la date du jour et un mot qui dit le changement (`'2026-10-03-adverbes'`).
   `lexique-oulipao.tsv` n'a pas de version : la page d'essai le relit tel quel.

4. **Mesurez les étiqueteurs** si vous avez changé le lexique de l'étiqueteur :

   ```bash
   npm run measure
   ```

   Comparez avec [`RESULTATS.md`](../../RESULTATS.md).

## Vérification

```bash
git diff --stat data/
```

Sans changement de script ni de lexique, le diff est vide : les dérivations sont
reproductibles. Avec un changement, le diff ne touche que les lignes attendues. Puis :

```bash
npm test
```

Les tests des adaptateurs (`test/adapters/morphology.test.ts`, `verbs.test.ts`,
`grammalecte.test.ts`) lisent les formats ; ils échouent si une ligne ne suit plus son schéma.

## Dépannage

| Symptôme | Cause | Correction |
|---|---|---|
| `Error: ENOENT: no such file or directory, open '…/data/brut/lexique-grammalecte-fr-v7.7.txt'` | lexique absent ou non décompressé | étape 1 |
| La page montre encore l'ancien dictionnaire | version inchangée, cache du navigateur | étape 3, puis `npm run build` |
| Statistiques très différentes de celles ci-dessus | autre version du lexique | vérifier le nom du fichier : les scripts attendent la v7.7 |

## Voir aussi

- [Recensement des lexiques](../lexiques.md) : licences, tailles, raisons du choix
- [Le moteur S+7](../s7.md), section « Le dictionnaire »
- [Comment publier le site](publier-le-site.md) : `data/brut/` n'est jamais publié
