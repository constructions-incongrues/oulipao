# Comment écrire une contrainte

Ajouter un type de contrainte à la page à pistes : il apparaît sous « Moteurs » dans le
navigateur de contraintes, se règle, s'enchaîne aux autres et passe dans l'inspecteur.

Première fois ? Le [tutoriel](../tutoriel-premiere-contrainte.md) fait le chemin complet sur une
contrainte jouet. Ce guide est la liste à suivre pour une vraie.

## Prérequis

- Node 22.18 ou plus récent (les scripts et les tests lancent le TypeScript tel quel), `npm ci`
  déjà fait.
- Avoir lu le [contrat des plugins](../plugins.md), au moins « Ce qu'une contrainte déclare » et
  « La portée par mot ».
- Une modification ouverte dans `openspec/changes/` si la contrainte change le comportement
  visible (c'est l'usage du dépôt : voir `openspec/specs/` pour les exemples).

## Étapes

1. **Créez le module** dans le domaine, un dossier par contrainte :
   `src/domain/<nom>/plugin.ts`. Le domaine reste pur : pas de DOM, pas de `fetch`, pas d'import
   depuis `src/adapters` ni `src/ui`.

2. **Décrivez les paramètres par un schéma zod** et déduisez-en la lecture des valeurs. Les
   bornes du schéma doivent être celles de `parameters`, et chaque champ a sa valeur par défaut :

   ```ts
   const ParamsSchema = z.object({
     mode: z.enum(['ends', 'head-tail', 'inside']).default('ends'),
     n: z.number().int().min(1).max(9).default(1),
   });
   const params = (values: ParameterValues) => ParamsSchema.parse(values);
   ```

   Puis `defaults: ParamsSchema.parse({})` et `parse: params` dans la déclaration.

3. **Déclarez la contrainte avec `definePlugin`**. Il vérifie la déclaration au chargement du
   module et lève en nommant l'erreur. Choisissez :
   - `tracks` et `defaultTargets` pour une contrainte qui vise des pistes ;
   - `targetable: false`, avec les cinq pistes dans les deux champs, pour une mise en page qui
     agit sur tout le texte (modèle : `src/domain/edge/plugin.ts`).

4. **Écrivez `apply`** en partant de `plainWords(text)`, qui rend un élément par mot du texte
   reçu. Pour chaque mot que vous touchez, poussez une marque :

   | Ce que fait la contrainte | Sur le mot | La marque |
   |---|---|---|
   | remplacer | `words[i] = { ...words[i]!, output: nouveau }` | `{ index, original, replacement }` |
   | retirer | `tail = removeWord(words, i, tail)` | `{ index, original, removed: true }` |
   | changer seulement le blanc d'avant | modifier `words[i].gap` | `{ index, original, relaid: true }` |
   | laisser, avec une raison | rien | `{ index, original, reason }` |

   Retirez toujours par `removeWord` (`src/domain/removal.ts`) : il recolle la ponctuation et les
   sauts de ligne. Rendez autant d'éléments dans `words` que de mots reçus : sinon `runChain`
   lève « la sortie ne suit pas les mots du texte ».

5. **Respectez la portée.** Prenez `scope = FULL_SCOPE` en dernier paramètre, sautez les
   positions de `scope.skip` avec la marque `reason: CLOSED`, et si un paramètre entier a un
   sens mot par mot, lisez `scope.overrides` comme le fait `src/domain/s7/plugin.ts:82`.

6. **Testez le module** dans `test/domain/<nom>.test.ts`, avec `node:test` et les aides de
   `test/support/morphology.ts` (`tag` étiquette un texte d'essai, `morphology()` fournit un
   petit dictionnaire). Couvrez chaque valeur de chaque paramètre, un pas bouché, et `help` pour
   chaque mode : le seuil de couverture est de 90 % des lignes, branches et fonctions.

7. **Installez le type** dans `installedPlugins` (`src/ui/tracks/mixer-state.ts`) : importez-le
   et ajoutez-le à la fin de la liste. C'est la seule liste qui nomme les types ; la page dessine
   le reste d'après la déclaration.

8. **Mettez à jour le test qui liste les types installés**,
   `test/ui/tracks/mixer-state.test.ts`, qui compare la liste des identifiants.

9. **Documentez** : une ligne dans le tableau « Les types installés » de
   [`docs/plugins.md`](../plugins.md), et, si la contrainte a appris quelque chose au contrat, une
   section « Ce que … a changé au contrat ».

## Vérification

```bash
npm run typecheck
```

```bash
npm test
```

Les deux passent, le second sans erreur de couverture. Puis dans le navigateur :

```bash
npm run build && python3 -m http.server 8765
```

Ouvrez `http://localhost:8765/tracks.html`, « Essayer avec un exemple », « Ajouter une
contrainte » : le bouton `+ <name>` est sous « Moteurs ». Branchez-le : le résumé sous le texte
dit combien de mots l'instance a remplacés, retirés ou laissés.

## Dépannage

| Symptôme | Cause | Correction |
|---|---|---|
| `<id> : une piste par défaut n'est pas traitée` au chargement | `defaultTargets` hors de `tracks` | ajouter la piste à `tracks` ou l'ôter des défauts |
| `<id> : une contrainte non ciblable vise les cinq pistes` | `targetable: false` avec moins de cinq pistes | `tracks: [...CATEGORIES]`, `defaultTargets: [...CATEGORIES]` |
| `<id> : deux paramètres portent la même clé` | deux `key` identiques | renommer l'une |
| `<id> : bornes inversées pour <key>` | `min > max` | les échanger |
| `ZodError` au chargement du module | `parse(defaults)` lève : défauts hors des bornes du schéma | aligner `defaults`, le schéma et `parameters` |
| `<id> : la sortie ne suit pas les mots du texte` | `apply` a rendu plus ou moins de mots qu'il n'en a reçu | partir de `plainWords(text)` et ne jamais retirer d'élément de `words` |
| `npm test` échoue sur `mixer-state.test.ts` | la liste des types a changé | étape 8 |
| Le bouton n'apparaît pas dans la page | `dist/tracks.js` n'a pas été reconstruit | `npm run build`, puis recharger |
| Un mot retiré laisse deux espaces ou une virgule orpheline | retrait à la main | passer par `removeWord` |

## Voir aussi

- [Le contrat des plugins](../plugins.md) (référence)
- [Comment ajouter une recette](ajouter-une-recette.md), pour proposer la contrainte sous son nom
  de l'Oulipo
- [Le moteur S+7](../s7.md), l'exemple le plus complet de contrainte
