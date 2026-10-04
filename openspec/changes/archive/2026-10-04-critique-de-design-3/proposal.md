# Proposal

## Why

La deuxième critique de design du 2026-10-04 (après #84 et #91) a relevé :

- une recette perd son nom une fois branchée : Monovocalisme en « a » devient un « lipogramme en e, i, o, u, y » dans la chaîne, la phrase d'état, les tranches, l'inspecteur et la mention copiée ;
- la grille montre où une contrainte vise, pas ce qu'elle a fait : un mot remplacé, retiré ou inchangé a le même poinçon plein ;
- au téléphone, la ligne de filtre empile ses touches sur trois rangs et laisse « Retirer » seul ;
- une contrainte sur les cinq pistes est rappelée cinq fois dans les tranches ;
- la grille vide affiche « PAGE 1–0 » ;
- « Mettre en pistes » pèse autant qu'« Essayer avec un exemple » ;
- « Texte » n'est pas en sérigraphie comme les autres titres de panneau ;
- la phrase d'état et les bandes de l'inspecteur commencent parfois en minuscule ;
- le message du modèle est plus grand que les autres notes et redit la phrase de confidentialité ;
- le panneau de la chaîne vide garde un espace en trop ;
- au téléphone, le dépliant de la porte (17 px), celui du carnet (22 px), les listes (28 px) et les champs (34 px) restent sous 44 px.

Le fondateur a accordé l'écart à la règle des poinçons de `DESIGN.md` (« traite toutes les recos »).

## What Changes

- Une instance branchée par une recette porte `recipe`, son nom avec le choix (« Monovocalisme (a) »). `describeInstance`, la ligne de chaîne (le moteur en sous-titre) et les rappels des tranches l'emploient. Un réglage, des pistes, un modulateur ou une porte changés le font tomber ; un double le garde.
- Un pas percé porte son issue (`outcome` : `changed`, `removed`, `unchanged`), tirée des marques de la vue. Changé : poinçon plein. Inchangé : poinçon réduit de moitié. Retiré : poinçon barré d'un trait d'encre. Le nom accessible dit « mot changé », « mot retiré » ou « mot inchangé ».
- Sous 768 px, la ligne de filtre place la marche et ↑ ↓ sur un rang, puis Dupliquer et Retirer sur le suivant.
- Une contrainte qui vise les cinq pistes est rappelée une fois, en tête des tranches (« Toutes les pistes : … »).
- Avant la mise en pistes, les pages de la grille cèdent la place à « Les pas apparaissent une fois le texte mis en pistes. ».
- « Mettre en pistes » prend un contour de 2 px, à taille égale.
- « Texte » passe en sérigraphie.
- La phrase d'état et les libellés de bande commencent par une majuscule. La mention copiée ne change pas.
- Le message du modèle passe à la taille des notes et perd la phrase en double.
- La phrase d'état vide et le message de chaîne vide ne creusent plus d'espace.
- Sous 768 px, les listes, les champs, la porte et le carnet font 44 px.

## Impact

- `src/ui/tracks/types.ts` (`InstanceSchema.recipe`), `mixer-state.ts`, `view-model.ts` (`GridStep.outcome`, `gridSteps(…, marks)`, majuscules), `app.ts`, `components/chain.ts`, `step-grid.ts`, `source.ts`, `tracks.html`.
- `DESIGN.md` (Shapes, Components, Layout, journal), `docs/tracks.md`.
- Un carnet ancien reste lisible : `recipe` est facultatif.
