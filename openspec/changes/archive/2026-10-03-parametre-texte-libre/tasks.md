# Tasks

## 1. Contrat et lettres partagées (vague 0, fondation)

- [x] 1.1 (domain) Ajouter `TextParameterSchema` (`kind: 'text'`, `key`, `label`, `maxLength` ≥ 1, `placeholder` facultatif) à l'union `ParameterSchema` de `src/domain/plugin.ts`. Vérifier par un test que la validation d'un plugin échoue pour `maxLength: 0` et passe pour 40.
- [x] 1.2 (domain) Créer `src/domain/letters.ts` : y déplacer `bare` (depuis `lipogram/neighbour.ts`) et `elide` (depuis `lipogram/plugin.ts`), et ajouter `lettersOf(input)`, qui ne garde que les lettres nues dans l'ordre de la saisie (« Hélène-Marie » donne `helenemarie`). Vérifier par des tests unitaires (accents, ligatures, chiffres, ponctuation) que les tests existants du lipogramme passent sans changement.

## 2. Lipogramme à lettres saisies (vague 1)

- [x] 2.1 (domain) Remplacer `letter` par `letters` (texte, `maxLength` 40, « e » par défaut) et `mode` (`forbidden` | `allowed`) dans `src/domain/lipogram/plugin.ts`. Ajouter `bannedLetters(letters, mode)`, rebrancher `apply` et `inherit` sur ces lettres bannies, et faire rendre faux à `acts` quand aucune lettre n'est bannie ou que le mode est `allowed` sur une saisie vide. Vérifier par des tests les scénarios « Plusieurs lettres interdites », « Beau présent », « Aucune lettre permise » et « Lettres permises puis lettres interdites », et par un test qu'une seule lettre interdite donne le même texte qu'avant.
- [x] 2.2 (domain) Réécrire `title`, `label` et `help` du lipogramme : « lipogramme en a, e », « lipogramme seulement en l, u, c, i, e », et l'aide pour une saisie vide. Vérifier par les tests de la mention (scénarios « Copie », « Plusieurs lettres », « Lettres permises » de la spec lipogramme).

## 3. Tautogramme progressif (vague 1, en parallèle de 2)

- [x] 3.1 (domain) Créer `src/domain/tautogram/cycle.ts` avec `assignLetters(tagged, targets, skip, letters)`, qui rend la lettre de chaque mot retenu (pistes visées hors `other`, hors pas bouchés, dans l'ordre, en boucle). Vérifier par des tests le scénario « Trois noms », et qu'un mot-outil, une piste non visée ou un pas bouché ne prend pas de lettre.
- [x] 3.2 (domain ; ports `MorphologyRepository`, `VerbRepository`) Créer `src/domain/tautogram/plugin.ts` (`id: 'tautogram'`, pistes nom, adjectif, verbe et adverbe, toutes visées par défaut, `letters` à « oulipo » par défaut). Les noms passent par `rewriteNouns` et `nthNoun`, les adjectifs et adverbes par `nthAdjective` et `nthAdverb`, les verbes par `rewriteVerbs` et `nthVerb`, avec le prédicat d'initiale sur la forme nue. Le mot déjà à la bonne lettre est gardé, et la raison « aucun voisin à l'initiale x » s'affiche sinon. Vérifier par des tests à ports factices les scénarios « Nom remplacé » (avec réaccord), « Déjà à la bonne lettre », « Verbe », « Initiale accentuée » et « Aucun voisin », et que `être` et `avoir` restent.
- [x] 3.3 (domain) Écrire `title`, `label` et `help` du tautogramme (« tautogramme progressif en oulipo » ; l'aide dit que les mots-outils ne comptent pas). Vérifier par les tests des scénarios « Ouverture », « Nom saisi », « Aide » et « Copie ».

## 4. Hôte et recettes (vague 2)

- [x] 4.1 (ui) Rendre un paramètre `text` dans `src/ui/tracks/components/control.ts` comme un `<input type="text">` étiqueté, avec `maxlength` et `placeholder`, qui appelle `onParam` à chaque frappe, en suivant `DESIGN.md`. Vérifier par un test de composant que la frappe émet la valeur et que le champ porte son libellé.
- [x] 4.2 (ui) Installer `tautogramPlugin` dans `installedPlugins` (`src/ui/tracks/mixer-state.ts`), pour qu'il apparaisse dans la section « Moteurs » du navigateur. Vérifier par un test de `mixer-state` qu'une saisie de 41 caractères est refusée et que l'instance garde sa valeur.
- [x] 4.3 (ui) Réécrire les recettes Monovocalisme, Bivocalisme et Contrainte du prisonnier en une instance de lipogramme `forbidden`, et ajouter Beau présent (`allowed`, `letters: ''`, règle qui dit de taper le nom) dans `src/ui/tracks/recipes.ts`. Vérifier par les tests des recettes : « Monovocalisme en a » (une instance sur e, i, o, u, y), « Une instance au lieu de douze » et « Beau présent ».
- [x] 4.4 (ui) Recette dans le navigateur : sur un texte de référence, brancher un S+7, puis un lipogramme en mode « permises », taper « Lucie », puis un tautogramme progressif. Vérifier que le texte résultant change à chaque frappe en moins d'une demi-seconde, que la mention de copie liste les trois instances, que tout se règle au clavier, et que l'onglet réseau ne montre aucune requête contenant « Lucie ».

## 5. Clôture

- [x] 5.1 Lancer `npm test` et vérifier que tout passe avec une couverture supérieure à 90 %.
- [x] 5.2 Mettre à jour `.nanopm/wiki/docs/catalogue-contraintes.md` (section « Couverture dans Oulipao » : Beau présent, Contrainte du prisonnier en une instance, Tautogramme progressif) et vérifier que le tableau récapitulatif reste cohérent.
