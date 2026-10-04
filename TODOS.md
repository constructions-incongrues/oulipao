# Suites

## Héberger le modèle d'étiquetage et trancher sa licence

- **Quoi** : servir depuis le projet la bibliothèque `@huggingface/transformers` et les poids de `Xenova/french-camembert-postag-model` (141 Mo au premier accès), et établir la licence du modèle, non déclarée aujourd'hui.
- **Pourquoi** : bloque la mise en ligne (item 4 de la roadmap). Tant que le modèle vient de jsDelivr et de Hugging Face, la page dépend de tiers à chaque premier accès, et on ne sait pas si on a le droit de le redistribuer.
- **Pour** : la page ne dépend plus que de son propre hébergement ; la réserve de l'essai technique est levée.
- **Contre** : 141 Mo à héberger ; si la licence interdit la redistribution, il faut un autre modèle ou réentraîner.
- **Contexte** : `src/adapters/taggers/camembert-model.ts` (commentaire `ponytail:`), `RESULTATS.md` (poids mesurés), `docs/designs/interface-a-pistes.md` (questions ouvertes). Décidé en revue d'ingénierie le 2026-10-03 (D13).
- **Dépend de** : rien ; à faire avant la mise en ligne, pas avant les tâches 5.1 à 5.11.

## Étiqueteur dans un Web Worker

- **Quoi** : faire tourner l'étiqueteur (Transformers.js, WASM) dans un Web Worker, derrière le port `Tagger`, au lieu du fil principal.
- **Pourquoi** : si la mesure de la tâche 1.1 du change `boucle-de-tours` montre que l'étiquetage bloque l'écran plus de 200 ms (branche B), la boucle se calcule derrière une barre d'avancement et le curseur de tours ne répond qu'à la fin.
- **Pour** : curseur vivant pendant le calcul ; la mise en pistes et « Itérer » ne figent plus la page.
- **Contre** : touche l'adaptateur d'étiquetage, le chargement du modèle et les tests de toute l'application ; messages entre fils à valider (zod) comme toute entrée d'adaptateur.
- **Contexte** : `src/adapters/taggers/camembert-model.ts`, `src/domain/tagging.ts:13` ; décision 0 de `openspec/changes/boucle-de-tours/design.md`. Décidé en revue d'ingénierie le 2026-10-04 (D4).
- **Dépend de** : la tâche 1.1 du change `boucle-de-tours` (branche B seulement).

## Dé relancé à chaque tour de boucle

- **Quoi** : un interrupteur « Dé à chaque tour » sur la rangée BOUCLE. Allumé, chaque tour tire ses dés avec une graine dérivée de la graine réglée et du numéro du tour, ce qui donne une marche au hasard par mot au lieu d'un pas fixe. La boucle reste reproductible.
- **Pourquoi** : une deuxième façon de dériver, pour un S+dé bouclé.
- **Pour** : la dérive la plus vivante du S+dé, et un interrupteur à basculer en pleine écoute.
- **Contre** : une touche de plus et une convention de plugin (`seed` repéré par les descripteurs) pour un seul filtre au dé aujourd'hui.
- **Contexte** : reporté par la revue de portée du 2026-10-04 (D3 CEO). Les choix de conception sont déjà faits : touche `aria-pressed` (D15 design), repérage par les descripteurs (D2 ingénierie), `tourSeed(seed, tour)` (identité au tour 1). Voir l'historique de `openspec/changes/boucle-de-tours/`.
- **Dépend de** : le change `boucle-de-tours` livré, et une boucle de S+dé jouée qui donne envie de l'autre dérive.
