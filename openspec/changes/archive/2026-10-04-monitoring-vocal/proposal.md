# Proposal

## Why

Le fondateur règle ses contraintes à l'œil. Pour entendre une rime, un mètre ou une absurdité correcte, il doit cesser de régler et lire lui-même à voix haute. La console a déjà le vocabulaire du son (mute, solo, « pistes qu'on entend », tête de lecture), mais rien ne sort. Le PRD `.nanopm/wiki/docs/prds/monitoring-vocal.md` pose le pari : entendre en réglant aide à garder des textes. Sa mesure est au moins 2 textes du carnet « réglés en écoutant » dans les 21 jours.

## What Changes

- **Un transport dans la console.** Lecture et arrêt au bouton et à la barre d'espace. Arrêté par défaut, il ne reprend jamais seul.
- **Une tête de lecture qui parcourt la page visible de la grille et boucle.** Chaque pas dit, avec la synthèse vocale du navigateur, ce que le résultat a mis à la place de son mot, calculé au moment où la tête l'atteint. Un réglage changé pendant la lecture s'entend donc au pas suivant.
- **Les pistes muettes, hors solo, se taisent, comme les pas bouchés et les mots retirés.** Un pas silencieux dure le temps d'un blanc.
- **Le pas joué est marqué dans la grille, à l'encre.**
- **Un réglage de tempo** (vitesse de la voix, blanc entre deux pas) et **un choix parmi les voix françaises du système.** Les deux sont gardés dans le navigateur. Sans voix française, la lecture est désactivée et un message le dit.
- **La lecture s'arrête** quand l'onglet est masqué, quand la page est quittée, quand on remet en pistes et quand on rouvre une entrée du carnet.
- **La mention de la chaîne se termine par « réglé en écoutant »** quand la lecture a tourné depuis la mise en pistes du texte. Elle apparaît donc au carnet, dans son export et dans le texte copié.

Hors de ce changement : le synthé Web Audio, la synchronisation à un tempo précis, l'export audio, la lecture phrase entière, l'écoute de l'original (bypass), la piste lettriste et le téléphone.

## Capabilities

### New Capabilities
- `monitoring-vocal` : entendre le texte résultant mot à mot pendant qu'on règle les pistes. Elle couvre le transport, la boucle sur la page visible, ce que dit un pas, le pas joué, le tempo, la voix, les arrêts et la mention « réglé en écoutant ».

### Modified Capabilities

Aucune. La mention reste « identique à celle du bouton de copie » (`carnet-de-textes-gardes`), et son ajout est spécifié dans `monitoring-vocal`.

## Impact

- **Nouveau port** `src/ports/speech.ts` et son adaptateur `src/adapters/speech/speech-synthesis.ts`.
- **Nouveau port** des préférences de monitoring et son adaptateur `localStorage`.
- **Nouvelle fonction pure** du domaine, `src/domain/monitoring.ts`.
- **Interface :** `src/ui/tracks/controller.ts` (état et ordonnancement de la lecture), `view-model.ts` (`ruleMention`), `components/step-grid.ts` (pas joué), un nouveau composant `components/transport.ts`, `app.ts`, `main.ts` (raccourci, `visibilitychange`, `pagehide`), et le CSS de `tracks.html`.
- **Aucune nouvelle dépendance.** Aucune requête réseau : la voix est celle du système.
- **Le carnet** ne change ni de schéma ni de format d'export (`version: 1`).
