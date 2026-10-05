# Proposal

## Why

Un texte d'Oulipao circule aujourd'hui en copier-coller. Proche A a envoyé le sien par mail, avec l'original entre parenthèses. Le copier-coller transmet le texte, mais il perd la chaîne, ses réglages et sa graine. Le destinataire ne peut donc ni voir comment le texte a été fait, ni le rejouer.

Une entrée du carnet contient déjà tout ce qu'il faut pour rouvrir un texte à l'identique : seul le transport manque. Ce transport sert KR3 (un texte revient sans relance) et le principe « la contrainte est explicite ». PRD : `.nanopm/wiki/docs/prds/lien-partageable.md`.

## What Changes

- **« Partager » sur chaque entrée du carnet.** Le bouton copie une adresse `https://oulipao.incongru.org/#v1.…` qui contient l'entrée entière, compressée : original, étiquetage, table, mention, résultat, retouche et filiation. Si le presse-papiers est refusé, l'adresse s'affiche dans un champ sélectionnable. Au-delà de 8 000 caractères, un avertissement signale que certaines messageries tronquent les liens longs.
- **Une vue d'arrivée.** À l'ouverture d'une adresse à fragment, la page montre d'abord le texte : la retouche quand elle existe, avec le résultat produit à côté. Puis viennent l'original et la mention de la chaîne. Le carnet et le texte en cours du destinataire ne bougent pas.
- **« Rejouer ».** Ce bouton charge la table telle qu'elle était gardée, par le même chemin que « Rouvrir ». Si l'étiqueteur ou le lexique ne se charge pas (hors ligne, CDN en panne), « Rejouer » est désactivé avec la raison, et la vue d'arrivée reste lisible.
- **Un lien illisible ne casse rien.** Un fragment invalide, tronqué ou d'une autre version affiche « Ce lien n'est pas lisible », puis l'outil normal.
- **Le fragment s'efface une fois lu**, pour qu'un rechargement ne ramène pas la vue d'arrivée par-dessus le travail du destinataire.
- **Le non-objectif « partage en un clic » est réécrit** dans `strategy.md`, `objectives.md` et `roadmap.md` : le partage du texte seul reste refusé, celui de l'entrée avec sa chaîne devient permis.
- **Hors de ce changement** :
  - garder au carnet l'entrée reçue ;
  - signaler l'écart quand le rejeu diffère du résultat transporté ;
  - afficher en lecture seule une entrée que « Rouvrir » refuse ;
  - remplacer l'original par son propre texte ;
  - un aperçu de lien propre à l'entrée, un raccourcisseur, une image.

## Capabilities

### New Capabilities
- `lien-partageable` : le codage d'une entrée du carnet dans le fragment de l'adresse, le bouton « Partager », la vue d'arrivée, « Rejouer » et son état hors ligne, les liens illisibles et l'effacement du fragment.

### Modified Capabilities
_(aucune — le carnet garde ses exigences ; « Partager » s'y ajoute par la nouvelle capacité)_

## Impact

- **Code** : un module de codage et de décodage pur (`src/domain` ou `src/ui/tracks`, selon le design) ; `notebook-controller.ts` et `components/notebook.ts` pour « Partager » ; `controller.ts`, `app.ts` et un composant d'arrivée pour la vue et « Rejouer » ; `main.ts` pour lire le fragment au démarrage et l'effacer.
- **API du navigateur** : `CompressionStream` et `DecompressionStream` (`deflate-raw`), `navigator.clipboard`, `history.replaceState`. Aucune dépendance npm nouvelle, aucun serveur.
- **Documents** : `.nanopm/wiki/docs/strategy.md`, `objectives.md`, `roadmap.md`.
- **Compatibilité** : le fragment porte une version (`v1`) ; toute entrée décodée est validée par `NotebookEntrySchema`.
