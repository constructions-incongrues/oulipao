# Conception

## Contexte

Aujourd'hui, `example()` dans `src/ui/tracks/controller.ts` place `EXAMPLE_TEXT` dans la saisie puis appelle `run()`. `run()` met en pistes avec `state.mixer`, si bien que la chaîne réglée survit déjà à une remise en pistes. Le composant `Source` cache le bouton dès qu'un texte est en pistes (prop `started`, calculée dans `app.ts`). Les vers sont déjà pris en charge : une ligne par vers, strophes séparées par une ligne vide (exigences « Syllabes par vers », « Vers recopiés dans le texte résultant »).

## Objectifs / hors champ

**Objectifs :**
- Rotation sans aucun stockage, déterminée par l'état de la visite.
- Mention de la source et garde-fou déduits de la saisie, sans état à synchroniser.

**Hors champ :**
- Choisir un exemple précis dans une liste, ou tirer au hasard.
- Associer à un exemple une chaîne réglée d'avance (projet préchargé, écarté par le fondateur dans le wiki produit).
- Garder la position de la rotation d'une visite à l'autre.

## Décisions

### Les textes : un module de données de l'interface
`src/ui/tracks/examples.ts` (couche **ui**, aucun port) exporte `EXAMPLES`, une liste figée de `{ author, title, year, text }`. Un type TypeScript simple suffit, sans schéma zod : ces données sont écrites dans le code, n'entrent pas par un adaptateur et ne sont pas une entité du domaine. Un test vérifie les invariants de la spec : 5 textes, au plus 150 mots chacun, textes déjà en NFC.

Les textes sont recopiés depuis Wikisource, d'après une édition ancienne et non une édition critique moderne qui pourrait avoir des droits sur l'établissement du texte. Pour La Fontaine, on prend l'édition de 1874, à l'orthographe moderne, plutôt que l'édition Barbin et son orthographe d'époque que l'étiqueteur lirait mal. La Fontaine, Rimbaud, Verlaine et Hugo sont repris en entier. Pour Proust, on coupe le premier paragraphe à la fin d'une phrase, sous 150 mots.

Alternative écartée : un fichier JSON dans `data/`, chargé à la demande. Il faudrait un adaptateur, un schéma et un état de chargement pour moins de 3 Ko de texte.

### La rotation : un compteur dans l'état du contrôleur
`TracksState` reçoit `examplesShown: number`, à 0 au départ. `example()` place `EXAMPLES[examplesShown % EXAMPLES.length].text` dans la saisie, incrémente le compteur, puis appelle `run()`. Le libellé s'en déduit : « Essayer avec un exemple » si le compteur vaut 0, « Autre exemple » ensuite. L'état meurt avec la page, ce qui donne exactement la règle « rien d'une visite à l'autre ».

Alternative écartée : retrouver l'exemple suivant d'après le texte présent dans la saisie. Après un texte collé puis effacé, on retomberait sur le premier texte, et le libellé n'aurait plus de base.

### Mention et garde-fou : déduits de la saisie
Une fonction pure `exampleOf(input)` (dans `examples.ts`) rend l'exemple dont le texte est égal à la saisie, ou `undefined`. `app.ts` en tire :
- l'affichage du bouton : saisie vide (après `trim`) ou `exampleOf(input) !== undefined` ;
- la mention : `exampleOf(input)`, qu'elle vienne d'un clic, d'un texte rouvert depuis le carnet ou d'un exemple recollé à la main.

`Source` remplace la prop `started` par `exampleLabel?: string` (absente, le bouton est caché) et `example?: Example` (la source à mentionner). Le composant reste sans logique.

L'égalité est stricte, après la normalisation NFC que la saisie applique déjà. Retoucher un caractère cache donc le bouton et la mention, comme la spec le demande.

### Rendu de la mention
Elle prend la classe `example-source` et s'affiche dans la famille `.input-message, .privacy` de `tracks.html` : encre secondaire, `--size-small`, police d'interface, titre en `<cite>`. Sur la saisie repliée, elle s'insère dans la ligne : « Texte : <cite>Le Dormeur du val</cite>, Rimbaud · 104 mots · Modifier ». C'est conforme à `DESIGN.md`, puisque la mention est un message d'interface et non du texte à lire.

## Risques / compromis

- [Un texte en vers mal découpé par l'étiqueteur (élisions, retours à la ligne)] → la tâche de vérification met chaque exemple en pistes dans le navigateur et contrôle la grille et le compte de syllabes.
- [Écart de transcription avec la source] → recopier depuis Wikisource et noter la page de chaque texte en commentaire dans `examples.ts`.
- [Le bouton disparaît dès qu'on retouche un exemple, ce qui peut surprendre] → c'est voulu par le garde-fou. Vider la saisie le fait réapparaître.
