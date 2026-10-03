# Potao

Outil web qui applique des contraintes oulipiennes à un texte français, entièrement dans le
navigateur. Planification dans `.nanopm/wiki/`, changements dans `openspec/`.

## Contraintes

- TypeScript, mode strict.
- Architecture hexagonale : `src/domain` (pur), `src/ports` (interfaces), `src/adapters`
  (lexique, étiqueteurs, fichiers), `src/ui`. Le domaine se teste avec des ports factices.
- Couverture de tests supérieure à 90 %, vérifiée par `npm test`.
- Entités définies et validées par des schémas zod ; les types TypeScript en sont déduits ;
  toute donnée entrant par un adaptateur est validée.
- Symboles en anglais ; commentaires, documentation et PR en français.
- Parler français avec le fondateur.
