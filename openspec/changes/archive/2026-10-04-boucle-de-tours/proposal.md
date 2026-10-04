# Proposal

## Why

« Itérer » remet la chaîne entière en pistes sur son résultat, une génération par clic. Le fondateur a cliqué plusieurs fois, et le texte a dérivé parce que l'étiquetage relit autrement les mots transformés. Ce qui l'a fait rire, c'est le voyage, pas le texte final (jam du 2026-10-04). Le geste se joue mal pourtant :
- on ne revient pas à un tour précédent ;
- chaque clic attend un étiquetage d'environ 5,5 s ;
- chaque génération entre au carnet.

Le PRD `.nanopm/wiki/docs/prds/boucle-de-tours.md` reprend l'item que « Itérer et figer » avait écarté (« itérer plusieurs fois d'un coup ») et y ajoute un curseur. Pari : au moins 2 prises gardées depuis un tour ≥ 2, et au moins une séance de curseur balayé pour le plaisir, dans les 21 jours qui suivent la mise en ligne.

## What Changes

- **« Boucler » et un réglage « tours »** (de 2 à 12), à côté d'« Itérer ». Le tour 1 est le résultat en cours. Chaque tour suivant est ce qu'« Itérer » ferait du tour précédent : même table, nouvel étiquetage.
- **Le calcul des tours**, l'un après l'autre, avec son avancement et une touche « Arrêter ». Rien n'entre au carnet pendant le calcul, sauf la garde automatique du tour 1, comme le fait « Itérer ».
- **Une rangée BOUCLE sous le résultat**, avec un curseur en trous perforés, du tour 0 (le texte d'origine) au dernier tour calculé. Il change le texte affiché sur le papier, mots changés soulignés, sans nouvel étiquetage. La grille et la chaîne restent celles du tour 1. La rangée porte aussi les réglages, l'avancement et l'annonce, et le curseur reste dans la bande collée.
- **Le point fixe et le cycle.** Quand un tour redonne le texte d'un tour précédent, le calcul s'arrête et le curseur l'annonce.
- **Garder un tour.** « Garder » au tour k range ce seul tour, avec une filiation dont le parent est l'entrée du tour 1, et une mention qui se lit « ×k ».
- **La boucle s'abandonne** dès que le texte, la table ou la mise en pistes changent.
- **La généalogie d'un mot.** Choisir un mot d'origine (au tour 0 sur le papier, ou dans l'en-tête de la grille) l'ouvre dans l'inspecteur, avec sa lignée sur tous les tours (« livre → livrée → livret »), et « — » s'il disparaît.
- **L'écoute des tours.** Le transport de l'écoute lit le tour montré par le curseur. Changer de tour en pleine lecture fait continuer la voix dans le nouveau tour.

Hors de ce changement :
- le dé relancé à chaque tour (reporté par la revue de portée du 2026-10-04) ;
- le puzzle de tours, qui revient au mode puzzle (#89) ;
- changer la chaîne entre deux tours ;
- enchaîner les tours à l'écoute (la voix qui avance d'un tour à la fin du texte) ;
- la généalogie partant d'un mot d'un tour autre que 0.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities
- `monitoring-vocal` : « Boucle sur la page visible ». Au tour 1, la voix lit tout le texte, la grille suit sa page, et elle reprend au début après le dernier mot, au lieu de boucler sur la page affichée (retour du fondateur, 2026-10-04).
- `generations-de-textes` : nouvelles exigences pour la boucle, à savoir « Boucler », le calcul des tours, le curseur, le point fixe et le cycle, l'abandon de la boucle, la garde d'un tour, la généalogie d'un mot et l'écoute des tours. Les exigences existantes ne changent pas. La garde d'un tour pose une exception à la filiation : le parent d'un tour gardé est l'entrée du tour 1, et non l'entrée dont le texte est sa source.

## Impact

- **Interface (`src/ui/tracks`) :**
  - `controller.ts` : un calcul de tour sans effet de bord, extrait de `nextGeneration`/`tagAs`, plus l'état de la boucle (tours, curseur, avancement) et la garde d'un tour ;
  - `components/result.ts` : le réglage, « Boucler », « Arrêter », le curseur, le texte du tour affiché, la rangée BOUCLE ;
  - `components/tour-cursor.ts` : le curseur de tours ;
  - `components/inspector.ts` : la lignée d'un mot ;
  - `listening-controller.ts` : la lecture du tour montré ;
  - `notebook.ts` et `notebook-controller.ts` : le champ optionnel `loop` et la garde d'un tour ;
  - `app.ts` : les branchements.
- **Domaine :**
  - des fonctions pures pour repérer un point fixe ou un cycle dans une suite de textes, et pour relier les mots d'un tour à ceux du tour suivant (généalogie) ;
  - l'attribution mot à mot de `reread`, extraite dans `plugin-chain.ts` en `ownersOf` et partagée.
- **Carnet :** un champ optionnel `loop` (nombre de tours demandé, tour gardé) sur l'entrée, pour que l'export distingue une prise de boucle (revue de portée, D6). L'export reste en version 1, et `LineageSchema` sert tel quel.
- **Performance :** un tour coûte un étiquetage, sur le fil principal. Une tâche de mesure décide si le curseur répond pendant le calcul ou seulement après (voir `design.md`).
- **Aucune nouvelle dépendance, aucune requête réseau.**
