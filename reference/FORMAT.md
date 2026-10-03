# Format des textes de référence

Un fichier JSON par texte, `reference/texte-N.json` :

```json
{
  "titre": "…",
  "source": "d'où vient le texte, et sous quels droits",
  "annotateur": "qui a annoté, et quand",
  "texte": "Le texte brut, tel qu'on le collerait dans la page.",
  "mots": [
    { "mot": "Le", "categorie": "autre" },
    { "mot": "texte", "categorie": "nom" }
  ]
}
```

`mots` contient exactement les mots rendus par `tokenize(texte)` (`src/tokenize.js`), dans
l'ordre. `categorie` est l'une des cinq valeurs de `src/categories.js`. Le test
`test/reference.test.js` vérifie ces deux points sur tous les fichiers présents.

## Conventions d'annotation

- **nom** : nom commun seulement. Les noms propres sont classés **autre**.
- **verbe** : toute forme verbale, auxiliaires compris (« a mangé » : deux verbes),
  infinitifs et participes présents compris.
- **adjectif** : adjectif qualificatif, y compris le participe passé employé comme épithète
  ou attribut sans auxiliaire de temps (« une porte fermée »). Dans un temps composé ou un
  passif (« il a fermé », « elle est fermée par le vent »), le participe est **verbe**.
- **adverbe** : adverbes, y compris la négation (« ne », « pas », « plus », « jamais »).
- **autre** : déterminants (possessifs, démonstratifs, numéraux et indéfinis compris), pronoms,
  prépositions, conjonctions, interjections, noms propres.

Le cas douteux se tranche par la fonction dans la phrase, pas par la forme.

## Relire et corriger

Les fichiers JSON sont dérivés de `reference/texte-N.annote.txt`, où chaque mot est suivi de
son code entre accolades : `{n}` nom, `{v}` verbe, `{a}` adjectif, `{r}` adverbe, `{o}` autre.
Pour corriger une annotation, modifier le fichier annoté puis lancer :

    node scripts/construire-reference.js
