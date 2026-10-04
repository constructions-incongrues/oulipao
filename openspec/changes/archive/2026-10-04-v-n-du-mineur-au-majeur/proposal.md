# Proposal

## Why

Le fondateur veut faire glisser un texte du triste vers le joyeux, comme on passe d'un accord mineur à un accord majeur. Dans ce passage, seule la tierce bouge, d'un demi-ton. Le S+7 sait déplacer un mot de n crans dans une liste, mais cette liste est toujours rangée par ordre alphabétique.

Il existe des données libres pour la ranger autrement. Quatre bases de normes affectives du français, notées par de vrais lecteurs, sont distribuées par openlexicon en CC BY-SA 4.0. Elles donnent une valence, une intensité (arousal) et, pour les noms, une concrétude. PRD : `.nanopm/wiki/docs/prds/v-n-du-mineur-au-majeur.md`.

## What Changes

- **Un paramètre « Ordre » dans le S+7.** Ses valeurs : alphabétique (par défaut, le comportement actuel), valence, intensité, concrétude. Le décalage, le verrou, la modulation, « Parmi » et le tirage au dé s'appliquent à l'ordre choisi.
- **Une échelle par catégorie.** Les noms et les adjectifs ont chacun la leur. Pour les ordres autres qu'alphabétique, la piste des verbes ne bouge pas.
- **Les mots sans note restent en place.** Un mot absent de l'échelle n'est pas remplacé et porte la raison « sans note ».
- **Le titre dit l'ordre** : V+3, I+3, C+3, et V+dé, I+dé, C+dé. Le titre S+7 reste celui de l'ordre alphabétique.
- **L'inspecteur montre la note.** Pour chaque mot remplacé, il affiche la note du mot d'origine et celle du mot nouveau sur l'échelle choisie.
- **Un fichier de données dérivé.** `data/echelles-oulipao.tsv` est construit à partir des quatre bases d'openlexicon :
  - chaque mot est ramené à son lemme et à sa catégorie par Grammalecte ;
  - chaque base est normalisée par le rang de ses mots ;
  - un mot présent dans plusieurs bases reçoit la moyenne de ses rangs.

  Le fichier est sous CC BY-SA 4.0, séparé du code, et chargé à la demande.
- **Rétrocompatible.** Une chaîne enregistrée sans ordre se relit en ordre alphabétique.

## Capabilities

### New Capabilities
- `ordres-du-s7` : les échelles par valence, intensité et concrétude, le paramètre d'ordre du S+7, les mots sans note, les titres V+n, I+n et C+n, la note dans l'inspecteur, et le fichier d'échelles avec sa provenance.

### Modified Capabilities
- `moteur-s7-accorde-sur-les-noms` : la substitution par décalage parcourt la liste des lemmes dans l'ordre choisi. Jusqu'ici, elle ne parcourait que l'ordre alphabétique.

## Impact

- **Domaine** (`src/domain/s7/`) : le paramètre d'ordre, le titre et l'aide (`plugin.ts`), et la liste ordonnée passée à la substitution des noms et des adjectifs.
- **Ports** : un nouveau port `ScaleRepository` (`src/ports/scales.ts`), et un champ optionnel `scales` dans `PluginResources`.
- **Adaptateurs** : un chargeur du fichier d'échelles validé par zod (`src/adapters/lexicon/`), et un script `scripts/build-scales.ts` avec la commande `npm run build:scales`.
- **Interface** : le chargement à la demande du fichier (`src/ui/composition.ts`, `controller.ts`, comme pour la phonétique), et la note dans l'inspecteur.
- **Données et licences** : `data/echelles-oulipao.tsv`, les sources brutes dans `data/brut/`, `THIRD_PARTY_LICENSES.md` et `docs/lexiques.md`.
- **Aucune nouvelle dépendance npm.**
