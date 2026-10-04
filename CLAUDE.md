# Oulipao

Outil web qui applique des contraintes oulipiennes à un texte français, entièrement dans le
navigateur. Planification dans `.nanopm/wiki/`, changements dans `openspec/`, documentation
indexée dans `README.md`.

## Contraintes

- TypeScript, mode strict.
- Architecture hexagonale : `src/domain` (pur), `src/ports` (interfaces), `src/adapters`
  (lexique, étiqueteurs, fichiers), `src/ui`. Le domaine se teste avec des ports factices.
- Couverture de tests supérieure à 90 %, vérifiée par `npm test`.
- Entités définies et validées par des schémas zod ; les types TypeScript en sont déduits ;
  toute donnée entrant par un adaptateur est validée.
- Symboles en anglais ; commentaires, documentation et PR en français.
- PR fusionnées en squash par la file de fusion : `gh pr merge <n>`, sans `--squash`, met en file.
  Le titre de PR suit les Conventional Commits, la description en français :
  `feat: filtre de rime riche`, `fix: défilement bloqué`. Seuls `feat`, `fix`, `perf` et
  `revert` entrent au journal des versions et déclenchent une version ; `docs`, `chore`,
  `refactor`, `test`, `ci`, `build` et `style` n'y entrent pas. `!` après le type marque un
  changement cassant.
- Parler français avec le fondateur.

## Système de design

Lire `DESIGN.md` avant tout travail visuel ou d'interface : il fixe les polices, les couleurs, les espacements et la direction esthétique. Demander au fondateur avant de s'en écarter. En revue ou en recette d'interface, signaler le code qui ne suit pas `DESIGN.md`.
