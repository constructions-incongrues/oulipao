# Proposition

## Pourquoi

« Essayer avec un exemple » ne propose qu'un texte, deux phrases de prose écrites pour Oulipao, et le bouton disparaît après le premier essai. Les contraintes qui travaillent sur les vers, les strophes et les rimes n'ont rien à mordre, et on ne peut pas voir une même chaîne à l'œuvre sur un autre texte sans en coller un soi-même.

## Ce qui change

- Le texte maison disparaît au profit de cinq textes du domaine public : Proust (prose), La Fontaine (fable en vers), Rimbaud (sonnet), Verlaine (strophes de vers courts), Hugo (alexandrins en quatrains).
- Le bouton reste dans la saisie rouverte et passe au texte suivant à chaque clic, en boucle ; la première visite commence toujours par le même texte. Rien n'est gardé d'une visite à l'autre.
- Le libellé devient « Autre exemple » après le premier clic.
- Une ligne sous la saisie nomme l'auteur, le titre et l'année du texte d'exemple affiché.
- Garde-fou : le bouton ne s'affiche que si la saisie est vide ou contient un texte d'exemple tel quel ; un texte collé ou retouché ne peut donc pas être écrasé.
- La chaîne réglée est conservée quand on passe à l'exemple suivant, comme pour toute remise en pistes.

## Capacités

### Nouvelles capacités

Aucune.

### Capacités modifiées

- `interface-a-pistes-reglage-en-direct` : ajout de l'exigence « Exemples en rotation » (rotation, libellé, mention de la source, garde-fou) ; l'exigence « Syllabes par vers » compte aussi le e de « -es » et « -ent » devant voyelle, faute de quoi un alexandrin de Hugo comptait 11.
- `mise-en-ligne` : le scénario « Ouverture de l'adresse » parle du premier texte d'exemple et non plus du texte d'exemple unique.

## Impact

- `src/ui/tracks/controller.ts` : `EXAMPLE_TEXT` remplacé par une liste de textes ; `example()` avance dans la liste.
- `src/ui/tracks/components/source.ts` et `src/ui/tracks/app.ts` : visibilité du bouton, libellé, ligne de mention.
- Nouveau module de données `src/ui/tracks/examples.ts`.
- `src/domain/phonetics/lookup.ts` : compte des syllabes d'un vers.
- Tests : `test/domain/phonetics/phonetics.test.ts`, `test/ui/tracks/controller.test.ts`, `monitoring-controller.test.ts`, `transport.test.ts`, `components.test.ts`, `app.test.ts` (ils importent `EXAMPLE_TEXT` ou vérifient le bouton).
- Aucune dépendance nouvelle, aucune requête réseau nouvelle : la règle du premier clic (`mise-en-ligne`) ne change pas.
