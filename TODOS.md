# Suites

## Héberger le modèle d'étiquetage et trancher sa licence

- **Quoi** : servir depuis le projet la bibliothèque `@huggingface/transformers` et les poids de `Xenova/french-camembert-postag-model` (141 Mo au premier accès), et établir la licence du modèle, non déclarée aujourd'hui.
- **Pourquoi** : bloque la mise en ligne (item 4 de la roadmap). Tant que le modèle vient de jsDelivr et de Hugging Face, la page dépend de tiers à chaque premier accès, et on ne sait pas si on a le droit de le redistribuer.
- **Pour** : la page ne dépend plus que de son propre hébergement ; la réserve de l'essai technique est levée.
- **Contre** : 141 Mo à héberger ; si la licence interdit la redistribution, il faut un autre modèle ou réentraîner.
- **Contexte** : `src/adapters/taggers/camembert-model.ts` (commentaire `ponytail:`), `RESULTATS.md` (poids mesurés), `docs/designs/interface-a-pistes.md` (questions ouvertes). Décidé en revue d'ingénierie le 2026-10-03 (D13).
- **Dépend de** : rien ; à faire avant la mise en ligne, pas avant les tâches 5.1 à 5.11.
