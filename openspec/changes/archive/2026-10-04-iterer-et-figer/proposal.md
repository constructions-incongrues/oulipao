# Proposal

## Why

Le résultat d'une chaîne ne peut pas devenir le texte d'origine d'une nouvelle passe sans copier-coller. Ce détour fait perdre la filiation (le carnet ignore de quoi descend un texte), la mention (elle ne dit que la dernière chaîne) et un étiquetage qui suit ce que le texte est devenu. Le PRD `.nanopm/wiki/docs/prds/iterer-et-figer.md` emprunte à Bitwig le *bounce in place* et à l'Oulipo le S+7 itéré. Pari : au moins 2 textes du carnet ont un parent dans les 21 jours qui suivent la mise en ligne.

## What Changes

- **Deux touches à côté de « Garder »** :
  - « **Itérer** » remet en pistes le texte résultant affiché (forme comprise) et garde l'état de la table ;
  - « **Figer** » le remet en pistes et vide la chaîne et la forme, en rendant toutes les pistes audibles.
- **Garde automatique.** Avant de remplacer le texte en cours, chaque geste le garde au carnet s'il ne l'a pas encore été depuis sa dernière mise en pistes, et le désigne comme parent.
- **La filiation.** Une entrée du carnet porte, en champ optionnel, son parent, le texte de l'ancêtre et les mentions des passes précédentes. Le format d'export reste en `version: 1`.
- **La mention** dit toutes les passes depuis l'ancêtre. Des passes de même libellé qui se suivent se fondent en « ×n » ; des chaînes différentes se séparent par « · puis ».
- **Au carnet et dans la copie d'un bloc**, une entrée qui a une filiation montre l'ancêtre, le parent, puis le résultat.
- **Rouvrir** une entrée de deuxième génération restaure sa filiation.

Hors de ce changement :
- itérer ou figer depuis une entrée du carnet (donc depuis une retouche) ;
- la vue de l'arbre des générations ;
- itérer plusieurs fois d'un coup.

## Capabilities

### New Capabilities
- `generations-de-textes` : faire du texte résultant le texte d'origine d'une nouvelle génération, en gardant la chaîne (itérer) ou sans elle (figer). Elle couvre la garde automatique, la filiation, la mention des passes et la reprise d'une filiation à la réouverture.

### Modified Capabilities
- `carnet-de-textes-gardes` :
  - **Lire le carnet** : une entrée qui a une filiation montre l'ancêtre et le parent avant son résultat.
  - **Copier une entrée d'un bloc** : la copie d'une telle entrée commence par l'ancêtre, puis le parent.

## Impact

- **Interface :**
  - `src/ui/tracks/notebook.ts` : `LineageSchema` (zod), champ optionnel de `NotebookEntrySchema`, `entryClipboard` ;
  - `controller.ts` : gestes `iterate` et `freeze`, identifiant de la dernière entrée gardée, filiation en cours, réouverture ;
  - `view-model.ts` : composition de la mention avec les passes ;
  - `components/result.ts` : les deux touches ;
  - `components/notebook.ts` : l'ancêtre et le parent ;
  - `app.ts` : les branchements.
- **Domaine :** aucun changement. L'étiquetage, la chaîne et la forme sont réutilisés tels quels.
- **Carnet :** pas de changement de version. Un ancien export se relit sans perte.
- **Aucune nouvelle dépendance, aucune requête réseau.**
