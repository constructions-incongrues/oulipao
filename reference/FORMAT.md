# Format des textes de référence

Un fichier JSON par texte, `reference/texte-N.json` :

```json
{
  "title": "…",
  "source": "d'où vient le texte, et sous quels droits",
  "annotator": "qui a annoté, et quand",
  "text": "Le texte brut, tel qu'on le collerait dans la page.",
  "words": [
    { "word": "Le", "category": "other" },
    { "word": "texte", "category": "noun" }
  ]
}
```

`words` contient exactement les mots rendus par `tokenize(text)` (`src/domain/tokenizer.ts`),
dans l'ordre. `category` est l'une des cinq valeurs de `src/domain/categories.ts` : `noun`,
`verb`, `adjective`, `adverb`, `other`. Le schéma `ReferenceTextSchema`
(`src/domain/reference-text.ts`) vérifie ces deux points ; `test/domain/reference-text.test.ts`
l'applique à tous les fichiers présents.

## Conventions d'annotation

- **nom** (`noun`) : nom commun seulement. Les noms propres sont classés **autre**.
- **verbe** (`verb`) : toute forme verbale, auxiliaires compris (« a mangé » : deux verbes),
  infinitifs et participes présents compris.
- **adjectif** (`adjective`) : adjectif qualificatif, y compris le participe passé employé comme épithète
  ou attribut sans auxiliaire de temps (« une porte fermée »). Dans un temps composé ou un
  passif (« il a fermé », « elle est fermée par le vent »), le participe est **verbe**.
- **adverbe** (`adverb`) : adverbes, y compris la négation (« ne », « pas », « plus », « jamais »).
- **autre** (`other`) : déterminants (possessifs, démonstratifs, numéraux et indéfinis compris), pronoms,
  prépositions, conjonctions, interjections, noms propres.

Le cas douteux se tranche par la fonction dans la phrase, pas par la forme.

## Relire et corriger

Les fichiers JSON sont dérivés de `reference/texte-N.annote.txt`, où chaque mot est suivi de
son code entre accolades : `{n}` nom, `{v}` verbe, `{a}` adjectif, `{r}` adverbe, `{o}` autre.
Pour corriger une annotation, modifier le fichier annoté puis lancer :

    npm run build:references
