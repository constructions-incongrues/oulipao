# Proposition : charger le modèle d'étiquetage au premier clic

## Why

La page à pistes télécharge le modèle d'étiquetage dès l'ouverture, depuis jsDelivr et Hugging Face. Le visiteur leur fait donc connaître son adresse IP avant d'avoir rien demandé, et sans en être informé. Ce comportement n'a jamais été décidé : la question « à l'ouverture ou au clic » est restée ouverte (`design.md` de la mise en ligne, décision 6), et la section 2.5 d'arc42 l'a mis en évidence. Le fondateur l'a tranchée le 2026-10-03 : au premier clic.

## What Changes

- À l'ouverture, la page à pistes ne contacte ni jsDelivr ni Hugging Face. Elle affiche le bouton « Charger le modèle (141 Mo) » et une notice qui dit d'où vient le modèle et qui verra l'adresse du visiteur.
- Le premier clic sur « Charger le modèle », « Mettre en pistes » ou « Essayer avec un exemple » lance le chargement. Avec « Mettre en pistes » ou l'exemple, la mise en pistes suit dès que le modèle est prêt.
- « Mettre en pistes » est actif avant le chargement : cliquer dessus vaut accord.
- L'économie de données du navigateur ne sert plus à rien, puisque toute visite attend un clic. Sa lecture est retirée.
- Chaque visite redemande un clic, même quand le navigateur a gardé le modèle en cache. Aucun accord n'est mémorisé.

## Capabilities

### New Capabilities
<!-- Aucune. -->

### Modified Capabilities
- `mise-en-ligne` : ajout d'une exigence, aucune requête vers un tiers avant le premier clic, et une notice qui nomme les tiers.

## Impact

- **ui :** `src/ui/tracks/controller.ts` (démarrage, dépendance `saveData` retirée), `src/ui/tracks/components/source.ts` (bouton actif, notice), `src/ui/tracks/main.ts` (lecture de `navigator.connection` retirée), et leurs tests.
- **Documentation :** arc42, sections 2.5, 6.1, 7, 10 (QS-08) et 11 ; la décision 6 de la mise en ligne est tranchée.
- **Rien d'autre :** le domaine, les ports, les adaptateurs et la page d'essai ne changent pas. La page d'essai charge toujours ses étiqueteurs à la demande.
