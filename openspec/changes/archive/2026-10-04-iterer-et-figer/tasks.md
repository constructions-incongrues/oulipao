# Tasks

## 1. Filiation et mention (ui)

- [x] 1.1 ui : dans `src/ui/tracks/notebook.ts`, ajouter `LineageSchema` (parent, ancêtre, passes) et le champ `lineage` optionnel de `NotebookEntrySchema`, oublié quand il est illisible. Vérifier par les tests du carnet : un ancien export se lit sans rejet et sans filiation ; une filiation abîmée laisse l'entrée lisible ; l'aller-retour garde la filiation.
- [x] 1.2 ui : dans `notebook.ts`, `entryClipboard` préfixe l'ancêtre et une ligne vide pour une entrée qui a une filiation. Vérifier par le scénario « Copier une deuxième génération ».
- [x] 1.3 ui : dans `view-model.ts`, ajouter `ruleBody`, le corps d'une mention, et `composeMention(passes, current)` (fusion « ×n » au libellé, « · puis », chaîne vide sans règle). Vérifier par des tests : « S+7 sur les noms ×3 », « S+7 sur les noms · puis lipogramme en e », un figement sans règle ensuite, une liste vide.

## 2. Gestes (ui)

- [x] 2.1 ui : dans `controller.ts`, faire en sorte que `keep()` rende l'identifiant gardé et écrive la filiation en cours dans l'entrée. Retenir `lastKept`. `reopen` restaure `lineage` et fixe `lastKept`. Une mise en pistes du texte saisi efface les deux. La mention passe par `composeMention`. Vérifier par les tests du contrôleur : garder, rouvrir une deuxième génération, coller un nouveau texte.
- [x] 2.2 ui : dans `controller.ts`, ajouter `iterate()` et `freeze()`. Ils gardent le texte s'il n'est pas gardé, sinon ils reprennent `lastKept`. Ils calculent la filiation suivante, posent le résultat affiché dans la saisie et mettent en pistes avec la table gardée (itérer) ou vidée, pistes audibles (figer). Un échec de garde arrête le geste. Vérifier par des tests avec un étiqueteur factice : trois générations (parent, ancêtre, deux passes), pas de doublon après « Garder », stockage plein qui laisse tout en place, figer qui vide chaîne, forme et pistes coupées.

## 3. Interface (ui)

- [x] 3.1 ui : dans `components/result.ts`, ajouter les touches « Itérer » et « Figer » après « Garder », désactivées comme elle et pendant l'étiquetage. Les brancher dans `app.ts`. Vérifier : rendu des deux touches, désactivées sans résultat, et un clic qui appelle le contrôleur.
- [x] 3.2 ui : dans `components/notebook.ts`, afficher « Ancêtre » et « Parent » avant le résultat d'une entrée qui a une filiation, et rien de plus pour une entrée sans filiation. Ajouter le style dans `tracks.html`, conformément à `DESIGN.md`. Vérifier par le scénario « Texte de deuxième génération ».

## 4. Vérification d'ensemble

- [x] 4.1 Lancer `npm test` et vérifier que tout passe et que la couverture reste au-dessus de 90 %.
- [x] 4.2 Vérifier dans le navigateur, avec la prévisualisation : sur l'exemple, un S+7 itéré deux fois donne trois entrées liées, et la mention « ×3 » apparaît ; figer puis brancher un lipogramme donne « · puis » ; le carnet montre l'ancêtre et le parent ; la copie d'un bloc commence par l'ancêtre ; un geste sur 500 mots n'est pas plus lent qu'une mise en pistes du même texte.
