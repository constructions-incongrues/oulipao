# Proposition : les verbes dans la morphologie

## Why

La morphologie d'Oulipao ne connaît que les noms, les adjectifs et les adverbes. Aucun filtre ne peut donc toucher un verbe : le lipogramme les laisse avec la raison « verbe, laissé en v1 », et le V+7 n'existe pas. Le lexique Grammalecte, déjà dans `data/brut/`, contient pourtant les 8 400 verbes du français et leurs 353 000 formes conjuguées. Le catalogue des contraintes (`.nanopm/wiki/docs/catalogue-contraintes.md`) range cette évolution, E6, parmi les moins chères et les plus rentables. Elle débloque le V+7, et elle relève le rendement de presque tous les filtres qui remplacent un mot par un voisin du dictionnaire.

## What Changes

- **Données.** Un fichier dérivé, `data/verbes-oulipao.tsv`, est tiré du lexique Grammalecte. Il donne pour chaque forme conjuguée :
  - son infinitif ;
  - son temps (de l'infinitif au participe passé) ;
  - sa personne ;
  - pour le participe passé, son genre et son nombre ;
  - l'interdiction d'élision (h aspiré).

  Les auxiliaires *être* et *avoir* n'y figurent pas. Un script `npm run build:verbs` le produit.
- **Port.** Un port de morphologie des verbes donne :
  - les infinitifs, dans l'ordre du dictionnaire ;
  - les lectures d'une forme ;
  - la forme d'un verbe à un temps et une personne donnés.

  Un adaptateur en mémoire valide chaque ligne du fichier par un schéma zod.
- **Chargement à la demande.** Les verbes ne sont chargés que lorsqu'une instance de la chaîne vise la piste des verbes. Le premier chargement de la page reste aussi léger qu'aujourd'hui. Pendant le chargement, les verbes restent tels quels, avec une raison ; dès qu'ils arrivent, le texte résultant se recalcule.
- **V+7.** Le S+n gagne la piste des verbes. Chaque verbe visé devient le n-ième verbe qui le suit dans le dictionnaire, au même temps et à la même personne ; c'est le V+7 de l'Oulipo. La piste des verbes n'est pas visée par défaut.
- **Lipogramme.** Un verbe qui contient la lettre interdite est remplacé par le premier verbe qui le suit dans le dictionnaire, au même temps et à la même personne, sans la lettre. **BREAKING** pour la spec du lipogramme : l'exigence « Verbes laissés en v1 » disparaît, et le résumé ne compte plus les verbes à part.
- **Élision.** Un pronom élidé devant un verbe suit le verbe nouveau : « j'aime » devient « je mange », « je chante » devient « j'adore ».
- **Auxiliaires.** *Être* et *avoir* restent toujours tels quels, avec une raison, dans les deux filtres.

## What's not changing

- **Les temps composés ne sont pas reconnus comme tels.** Dans « a mangé », l'auxiliaire reste et le participe passé est traité seul, au même genre et au même nombre.
- **Aucun réaccord au-delà du verbe.** Le sujet ne change pas, et un participe passé employé avec *être* garde ses accords.
- **Le mode « Parmi » ne vaut que pour les noms.** Les verbes, comme les adjectifs, comptent tous les verbes. Un mode « verbes de même construction » (transitifs, pronominaux) est hors champ.
- **Une seule lettre interdite à la fois**, et l'interdiction d'une voyelle ne s'étend pas à ses formes accentuées, comme aujourd'hui.

## Capabilities

### New Capabilities
- `morphologie-des-verbes` : les formes conjuguées tirées du lexique, leurs traits (temps, personne, genre et nombre du participe), l'ordre du dictionnaire des verbes, le choix d'une lecture pour une forme ambiguë, l'élision et le chargement à la demande.

### Modified Capabilities
- `filtres-instanciables` : le S+n peut viser la piste des verbes. Une nouvelle exigence, « S+n sur les verbes », décrit le V+7.
- `lipogramme` : les verbes fautifs sont remplacés par un voisin sans la lettre. L'exigence « Verbes laissés en v1 » est retirée, et le décompte du résumé change en conséquence.

## Impact

- **Domaine.**
  - `src/domain/verb.ts` (nouveau) : schéma des formes verbales, choix d'une lecture, V+n et voisin sans la lettre.
  - `src/domain/plugin.ts` : `PluginResources` reçoit les verbes, facultatifs.
  - `src/domain/s7/plugin.ts` : piste des verbes.
  - `src/domain/lipogram/` : cas des verbes.
  - `src/domain/s7/elision.ts` : l'élision doit consulter les verbes.
- **Ports.** `src/ports/verbs.ts` (nouveau).
- **Adaptateurs.**
  - `src/adapters/lexicon/grammalecte-verbs.ts` (dérivation) ;
  - `src/adapters/morphology/in-memory-verbs.ts` (lecture et index).
- **Interface.**
  - `src/ui/composition.ts` : chargeur des verbes et version du fichier.
  - `src/ui/tracks/controller.ts` : chargement quand la chaîne vise les verbes, puis recalcul.
- **Données et scripts.** `data/verbes-oulipao.tsv` (nouveau, versionné comme les autres fichiers dérivés), `scripts/build-verbs.ts`, `package.json`.
- **Documentation.** `docs/lexiques.md`, `docs/plugins.md`, `docs/s7.md`.
- **Poids.** Ordre de grandeur à mesurer à la dérivation : une dizaine de mégaoctets brut, deux à trois compressés. Ces octets ne sont téléchargés que par ceux qui visent les verbes.
