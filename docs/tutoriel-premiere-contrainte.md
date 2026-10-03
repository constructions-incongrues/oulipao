# Votre première contrainte

Vous allez écrire une contrainte jouet, **Majuscules**, qui met en capitales un mot sur n des
pistes visées, et la brancher sur la page à pistes. À la fin, vous l'aurez enchaînée à un S+7
dans votre navigateur, et vous saurez ce que la page attend d'une contrainte : une déclaration,
une fonction `apply`, des marques.

Comptez une demi-heure. Le code est à jeter à la fin : c'est un exercice.

## Ce qu'il vous faut

- Node 22.18 ou plus récent (`node --version`). Le dépôt lance le TypeScript sans compilation.
- `git` et `python3` (pour servir la page ; tout serveur de fichiers statiques convient).
- Une connexion : au premier essai, le navigateur télécharge le modèle d'étiquetage (141 Mo).
- Savoir lire du TypeScript. Rien sur l'Oulipo : le S+7 remplace chaque nom par le septième qui
  le suit dans le dictionnaire.

## Étape 1 : lancer la page

```bash
git clone https://github.com/constructions-incongrues/oulipao.git
```

```bash
cd oulipao && npm ci
```

```bash
npm run build && python3 -m http.server 8765
```

`npm run build` assemble `src/` en `dist/tracks.js` ; Python sert la racine du dépôt. Ouvrez
`http://localhost:8765/tracks.html` et cliquez sur « Essayer avec un exemple ». Le modèle se
charge (barre en Mo), puis le texte apparaît rangé en pistes : noms, verbes, adjectifs,
adverbes, autres.

Cliquez sur « Ajouter une contrainte ». Sous « Moteurs », vous voyez `+ S+7`, `+ Lipogramme`,
`+ Tri par piste`, `+ Bord`, `+ Mise en vers`. Votre contrainte va s'ajouter à cette rangée.

Laissez le serveur tourner et ouvrez un second terminal à la racine du dépôt.

## Étape 2 : déclarer la contrainte

Créez `src/domain/capitals/plugin.ts` :

```ts
import { z } from 'zod';
import { CATEGORIES } from '../categories.ts';
import { plainWords } from '../mixing.ts';
import { definePlugin, FULL_SCOPE, type ParameterValues, type WordMark } from '../plugin.ts';
import { CLOSED } from '../s7/plugin.ts';

const ParamsSchema = z.object({
  every: z.number().int().min(1).max(9).default(1),
});
const params = (values: ParameterValues) => ParamsSchema.parse(values);

/** Majuscules : met en capitales un mot sur n des pistes visées. */
export const capitalsPlugin = definePlugin({
  id: 'capitals',
  name: 'Majuscules',
  tracks: [...CATEGORIES],
  defaultTargets: ['noun'],
  parameters: [{ kind: 'integer', key: 'every', label: 'Un mot sur', min: 1, max: 9 }],
  defaults: ParamsSchema.parse({}),
  parse: params,
  acts: () => true,
  title: () => 'MAJ',
  label: (values) => `majuscules, un mot sur ${params(values).every}`,
  help: (values) => `Met en capitales un mot sur ${params(values).every} des pistes visées.`,
  apply(text, tagged, values, _resources, targets, scope = FULL_SCOPE) {
    const { every } = params(values);
    const skip = new Set(scope.skip);
    const { words, tail } = plainWords(text);
    const marks: WordMark[] = [];
    let seen = 0;
    for (const [index, word] of tagged.entries()) {
      if (!targets.has(word.category)) continue;
      if (seen++ % every !== 0) continue;
      if (skip.has(index)) {
        marks.push({ index, original: word.word, reason: CLOSED });
        continue;
      }
      const replacement = word.word.toUpperCase();
      words[index] = { ...words[index]!, output: replacement };
      marks.push({ index, original: word.word, replacement });
    }
    return { words, tail, marks };
  },
});
```

Ce que vous venez d'écrire :

- **La déclaration** (`id` à `help`) : la page ne connaît pas votre contrainte. Elle dessine un
  champ numérique « Un mot sur », borné de 1 à 9, d'après `parameters`, et affiche `help` sous
  les réglages. `tracks` dit quelles pistes l'instance peut viser, `defaultTargets` celles
  qu'elle vise en arrivant.
- **Le schéma zod** : une seule source pour les bornes et la valeur par défaut. `parse` valide
  ce que la page envoie.
- **`apply`** : `plainWords` découpe le texte en mots, chacun avec le blanc qui le précède
  (`gap`). Vous changez `output` des mots touchés, et vous laissez une **marque** par mot :
  c'est d'elle que la page tire le soulignement, l'infobulle et le résumé.
- **`scope.skip`** : les pas que l'utilisateur a bouchés dans la grille. Vous laissez le mot
  et dites pourquoi.

`definePlugin` vérifie la déclaration dès l'import : essayez `defaultTargets: ['noun']` avec
`tracks: ['verb']`, il lève `capitals : une piste par défaut n'est pas traitée`. Remettez
`[...CATEGORIES]`.

## Étape 3 : la brancher sur la page

Dans `src/ui/tracks/mixer-state.ts`, importez-la à côté des autres :

```ts
import { capitalsPlugin } from '../../domain/capitals/plugin.ts';
```

et ajoutez-la à la fin de la liste des types installés :

```ts
export const installedPlugins: readonly ConstraintPlugin[] = [s7Plugin, lipogramPlugin, trackSortPlugin, edgePlugin, lineationPlugin, capitalsPlugin];
```

Reconstruisez :

```bash
npm run build
```

Rechargez la page, « Essayer avec un exemple », « Ajouter une contrainte » : `+ Majuscules` est
au bout de la rangée « Moteurs ». Cliquez dessus. Les noms du texte résultant passent en
capitales, soulignés de la couleur des noms, et le résumé dit :

```
majuscules, un mot sur 1, sur les noms : 13 noms remplacés sur 13.
```

Mettez « Un mot sur » à 2 : un nom sur deux seulement. Allumez la pastille des adjectifs sur
l'instance : ils passent aussi en capitales. Rien de tout cela n'est écrit dans la page : elle
l'a déduit de votre déclaration.

## Étape 4 : l'enchaîner à un S+7

Ajoutez `+ S+7`. Il vient **après** Majuscules dans la chaîne : il lit le texte déjà en
capitales et remplace chaque nom par le septième qui le suit. Le texte commence maintenant par
« Le Matois où le vieil Horodatage du Villégiateur s'arrêta » : le S+7 ne garde du mot remplacé
que sa majuscule initiale (`matchCase`, `src/domain/s7/engine.ts`). Vos capitales ont disparu.

Cliquez sur « Matois » : l'inspecteur s'ouvre, avec une ligne « Origine » puis une ligne par
filtre. Vous y lisez « matin », puis « MATIN », puis « Matois ». Avec ↑ sur l'instance S+7,
mettez-la en tête : le S+7 agit d'abord, puis Majuscules met en capitales le nom nouveau,
« MATOIS ». L'ordre de la chaîne compte.

Une contrainte n'a rien à savoir de celles qui la précèdent : `runChain`
(`src/domain/plugin-chain.ts`) relit la sortie de chacune comme un texte neuf, et chaque mot
relu garde la piste du mot d'origine.

## Étape 5 : la tester

Le dépôt exige 90 % de couverture. Créez `test/domain/capitals.test.ts` :

```ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { capitalsPlugin } from '../../src/domain/capitals/plugin.ts';
import type { WordScope } from '../../src/domain/plugin.ts';
import { morphology, tag } from '../support/morphology.ts';

const resources = { morphology: morphology() };
const run = (text: string, values: Record<string, number>, scope?: WordScope) => {
  const result = capitalsPlugin.apply(text, tag(text), capitalsPlugin.parse(values), resources, new Set(['noun'] as const), scope);
  return { ...result, text: result.words.map((w) => w.gap + w.output).join('') + result.tail };
};

test('Majuscules : un nom sur n passe en capitales', () => {
  assert.equal(run('Le chat voit la maison.', {}).text, 'Le CHAT voit la MAISON.');
  assert.equal(run('Le chat voit la maison.', { every: 2 }).text, 'Le CHAT voit la maison.');
});

test('Majuscules : un pas bouché garde son mot', () => {
  const result = run('Le chat dort.', {}, { skip: [1], overrides: [] });
  assert.equal(result.text, 'Le chat dort.');
  assert.equal(result.marks[0]!.reason, 'pas bouché');
});
```

`tag` (`test/support/morphology.ts`) étiquette un texte d'essai sans le modèle : il connaît
quelques noms (« chat », « maison »…), adjectifs et verbes. Lancez :

```bash
node --test test/domain/capitals.test.ts
```

```
# tests 2
# pass 2
# fail 0
```

Puis toute la suite :

```bash
npm test
```

Un test échoue, `mixer-state.test.ts` : il compare la liste des types installés, et la vôtre a
maintenant `'capitals'` en plus. C'est voulu : ajouter un type est un changement visible.
Pour une vraie contrainte, vous mettriez ce test à jour.

## Étape 6 : tout remettre en place

```bash
git checkout src/ui/tracks/mixer-state.ts && rm -r src/domain/capitals test/domain/capitals.test.ts
```

```bash
npm run build && npm test
```

Tout repasse au vert.

## Ce que vous avez construit

Une contrainte complète : déclarée, validée par zod, réglable dans la page, enchaînée à d'autres,
visible dans l'inspecteur, respectueuse des pas bouchés, testée. Vous avez vu que la page ne
connaît aucune contrainte en particulier : `installedPlugins` est la seule ligne à toucher hors
du domaine.

Pour aller plus loin :

- [Comment écrire une contrainte](guides/ecrire-une-contrainte.md) : la liste à suivre pour une
  vraie, avec retrait de mots, mises en page et dépannage.
- [Le contrat des plugins](plugins.md) : tous les champs, les marques, la portée par mot.
- [Comment ajouter une recette](guides/ajouter-une-recette.md) : proposer une contrainte sous son
  nom de l'Oulipo.
- [Le moteur S+7](s7.md) : ce qu'une contrainte sérieuse doit faire pour garder une langue
  correcte.
