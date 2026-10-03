# Design

## Context

La page des pistes tient tout son état dans le contrôleur (`src/ui/tracks/controller.ts`). Le texte mis en pistes est une `Session` `{ text, tagged }`, et la table est un `MixerState` validé par `MixerStateSchema`. Les pistes coupées en font partie (`tracks`), comme les verrous, les pas bouchés (`closed`) et la forme. Le texte résultant se recalcule à partir de ces deux objets et des textbanks (`buildView`). La mention de la chaîne existe déjà : `ruleMention`, ajoutée au texte copié.

`MixerStateSchema` vit dans `src/ui/tracks/types.ts`, pas dans le domaine. Une entrée de carnet qui l'embarque appartient donc à la même couche.

L'étiqueteur est un modèle neuronal téléchargé. Rien ne garantit qu'il étiquette deux fois un texte de la même façon d'une version à l'autre. Or les verrous et les pas bouchés désignent les mots par leur position.

## Goals / Non-Goals

**Goals :**
- Rouvrir une entrée doit redonner exactement le texte gardé, verrous et pas bouchés compris.
- Le format du fichier exporté doit être le même que celui du stockage, pour qu'il n'y ait qu'un seul schéma à maintenir.
- Le domaine reste intact : aucune règle oulipienne ne change.

**Non-Goals :**
- Migrer les entrées d'une version du format vers une autre. Le champ `version` est posé, mais il n'existe qu'une version.
- Garder un instantané du dictionnaire. Si le lexique change, un texte rouvert peut différer du texte gardé. Le texte gardé reste toujours lisible tel qu'il a été gardé.

## Decisions

### 1. L'entrée garde l'étiquetage, et rouvrir ne réétiquette pas

L'entrée stocke la `Session` entière (`text` et `tagged`) en plus du `MixerState`. Rouvrir remet cette session et cette table, puis appelle `buildView`, sans repasser par l'étiqueteur.

*Alternative écartée :* réétiqueter le texte d'origine à la réouverture. C'est plus léger de quelques Ko par entrée, mais les verrous et les pas bouchés retomberaient sur d'autres mots dès que le modèle change. Cela ferait aussi attendre le modèle pour une simple relecture. La question restée ouverte dans le PRD est donc tranchée ici.

Rouvrir a quand même besoin de la morphologie : le contrôleur appelle `preload()` comme le fait `run()`. Le modèle est alors probablement en cache, et c'est un clic de l'utilisateur, ce qui respecte « rien ne part avant le premier clic ».

### 2. Un port de stockage au niveau du texte brut, la logique du carnet dans `src/ui/tracks`

- Le port `src/ports/notebook-storage.ts` déclare `NotebookStorage { read(): string | null; write(data: string): void }`. Il ne manipule que des chaînes : il n'importe rien de l'interface, et le sens des dépendances est respecté.
- L'adaptateur `src/adapters/storage/local-storage-notebook.ts` s'appuie sur `localStorage`, sous une clé unique `oulipao.notebook`. Il est testé avec un faux objet `Storage`.
- Le module `src/ui/tracks/notebook.ts` contient `NotebookEntrySchema`, qui compose `MixerStateSchema` et `TaggedWordSchema` (son type en est déduit), et `NotebookFileSchema` (`{ version: 1, entries }`). Il fournit aussi les fonctions pures `parseNotebook` (entrées valides et nombre d'entrées rejetées), `addEntry`, `removeEntry`, `mergeEntries` (fusion par `id`, avec les comptes ajoutées, déjà présentes et rejetées) et `serializeNotebook`.

*Alternative écartée :* IndexedDB. Une entrée pèse quelques Ko (un texte de 200 mots et ses étiquettes), donc les 5 Mo de `localStorage` suffisent pour des centaines de textes. L'API est synchrone et se teste sans bibliothèque. On passera à IndexedDB si le quota est atteint, ce que l'erreur d'écriture signalera.

*Alternative écartée :* mettre le schéma de l'entrée dans `src/domain`. Il faudrait y descendre `MixerStateSchema`, un déplacement sans rapport avec ce changement.

### 3. La lecture est tolérante entrée par entrée

`parseNotebook` valide l'enveloppe, puis chaque entrée avec `safeParse`. Les entrées valides sont gardées et les autres sont comptées. Un JSON illisible, ou une enveloppe invalide, donne un carnet vide avec un message, sans que la page plante. À l'écriture suivante, les entrées illisibles sont perdues. C'est assumé, et le message le signale avant.

### 4. Restaurer passe par une vérification des types de contraintes

Avant de restaurer une entrée, le contrôleur vérifie que chaque `instance.type` existe dans le registre (`pluginById` sans exception). Sinon, l'entrée est refusée avec un message, et elle reste affichée dans le carnet. La table restaurée remplace l'état courant directement, après `MixerStateSchema.parse`, sans passer par une nouvelle action du réducteur : il n'y a qu'un appelant, et le schéma valide déjà l'état entier.

### 5. Dépendances injectées pour les tests

`TracksDependencies` gagne `notebook: NotebookStorage`, `now(): Date`, `newId(): string`, `confirm(message): boolean` et `download(name, text)`. `main.ts` les branche sur `localStorage`, `new Date()`, `crypto.randomUUID()`, `window.confirm` et un `Blob` téléchargé par une ancre `download`. Ce fichier est exclu de la couverture, comme aujourd'hui. L'import lit le fichier dans le composant (`File.text()`) et passe la chaîne au contrôleur.

`window.confirm` est natif et accessible au clavier. Le système de design ne prévoit pas de boîte de dialogue, et ce changement n'en invente pas.

### 6. Interface

- **« Garder »** est une touche de même style que « Copier », placée juste après elle dans la bande de sortie. Elle partage la zone `aria-live` : « Gardé. », ou « Impossible de garder : … ».
- **« Carnet »** est une section en bas de page, sous l'inspecteur, avec un titre en sérigraphie et le compte (« 3 textes gardés »). Chaque entrée affiche sa date (Archivo), son texte (Spectral, sur fond papier comme la bande de sortie) et sa mention, puis les touches « Rouvrir » et « Supprimer ». En tête de section : « Exporter » et « Importer » (un `<input type="file" accept="application/json">` habillé en touche).
- Le carnet suit `DESIGN.md` : variables de `styles/tokens.css`, pas d'ombre, de carte ni de couleur d'accent.

### 7. La politique de sécurité du contenu ne change pas

L'export navigue vers une URL `blob:` par une ancre `download` : ce n'est ni un `connect-src` ni un script. L'import lit un fichier local. La CSP de `tracks.html` reste telle quelle, et `test/pages.test.ts` doit continuer à passer sans modification.

## Risks / Trade-offs

- [Le navigateur efface ses données (navigation privée, nettoyage)] → C'est la raison d'être de l'export. La section rappelle en une ligne que le carnet vit dans ce navigateur.
- [Une évolution future de `MixerStateSchema` (un champ rendu obligatoire) rendrait d'anciennes entrées invalides] → Elles seraient signalées, et leur texte resterait dans le fichier exporté. Les nouveaux champs doivent rester optionnels, comme `closed` et `form` aujourd'hui.
- [Le lexique change entre la garde et la réouverture] → Le texte rouvert peut alors différer du texte gardé. L'entrée affiche toujours le texte gardé, qui seul fait foi.
- [Effort : la revue du PRD l'estime à M plutôt qu'à S] → Le découpage des tâches permet de livrer « Garder » et la liste d'abord, puis la réouverture et l'export.
