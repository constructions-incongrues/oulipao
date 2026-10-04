# Proposal

## Why

Un paramètre de contrainte vaut aujourd'hui la même chose pour tous les mots d'une instance. Pour le faire varier, il faut poser des verrous à la main, mot par mot. La chaîne ne garde alors qu'une liste de valeurs, pas la règle qui les a produites. Les contraintes qui font varier un réglage selon le mot (« chaque nom avance d'autant de mots qu'il a de lettres ») ou selon sa place (« le *n*-ième nom avance de *n* ») tiennent en une phrase, mais restent hors de portée.

Le PRD `.nanopm/wiki/docs/prds/modulateur.md` emprunte à Bitwig le modulateur : une source branchée sur un paramètre. Il pose le pari suivant : au moins 2 textes du carnet portent une instance modulée dans les 21 jours qui suivent la mise en ligne.

## What Changes

- **Un modulateur par paramètre verrouillable.** Il concerne aujourd'hui le décalage du S+n, celui du R+n et le rang de l'homophonie. Le paramètre est soit fixe, soit modulé par une source.
- **Huit sources :**
  - **du mot** : lettres, syllabes, voyelles, occurrences d'une lettre donnée ;
  - **de position** : rang du mot parmi ceux que l'instance traite, numéro de ligne, motif de valeurs répété, rampe d'une valeur à une autre.
- **Le mot lu** est celui que reçoit l'instance à son étage de la chaîne (deux S+lettres à la suite forment une rétroaction), ou son **voisin**, c'est-à-dire le mot le plus proche d'une piste choisie, avant ou après, dans la même phrase.
- **Une base et une profondeur.** La valeur vaut `base + profondeur × source`. Hors de la plage, elle est repliée : une valeur au-dessus du maximum revient dans `[1, max]`, les autres dans `[min, max]`.
- **Une porte par instance.** Une source, éprouvée par un test (pair, impair, au moins *k*, au plus *k*, Euclide E(*k*,*n*) sur le rang), décide si chaque mot est traité. Une porte fermée laisse le mot tel quel, comme un pas bouché.
- **Les priorités.** Le verrou manuel l'emporte sur le modulateur, qui l'emporte sur la valeur de l'instance. Un pas bouché reste bouché.
- **L'inspecteur** affiche, pour chaque bande, la valeur reçue par chaque mot modulé et l'état de la porte.
- **La mention et le libellé de l'instance** énoncent la règle en une phrase, sans liste de valeurs (« S+lettres »).
- **Les modulateurs sont gardés** avec l'état de la table, au carnet et dans son export, sans changer `version: 1`.

Hors de ce changement :
- les sources qui ne s'énoncent pas (LFO, hasard sans graine) ;
- le rattachement grammatical exact du voisin ;
- la modulation des paramètres non entiers ou non verrouillables ;
- plusieurs modulateurs additionnés sur un même paramètre ;
- tout branchement à Bitwig.

## Capabilities

### New Capabilities
- `modulateurs-de-parametres` : faire varier un paramètre verrouillable mot par mot selon une source énonçable. Elle couvre les sources, le mot lu, la base, la profondeur, le repli, la porte, les priorités avec les verrous et les pas bouchés, l'affichage dans l'inspecteur, l'énoncé (mention et libellé) et la persistance.

### Modified Capabilities

Aucune. Les verrous gardent leur comportement (`verrous-de-parametres`). Leur priorité sur le modulateur est spécifiée dans `modulateurs-de-parametres`.

## Impact

- **Domaine :**
  - un nouveau module pur `src/domain/modulation/` (sources, voisin, repli, porte, phrase), testé sans interface ;
  - `src/domain/plugin-chain.ts` : à chaque étage, `runChain` calcule les surcharges et les sauts issus des modulateurs, sous les verrous et avec les pas bouchés ;
  - **le contrat de plugin (`src/domain/plugin.ts`) ne change pas.**
- **Interface :**
  - `src/ui/tracks/types.ts` : `ModulatorSchema` et `GateSchema` (zod), en champs optionnels d'`InstanceSchema` ;
  - `mixer-state.ts` (actions) ;
  - `view-model.ts` (libellé, mention, valeurs de l'inspecteur) ;
  - `controller.ts` (chargement des prononciations quand une source lit les syllabes) ;
  - les composants du panneau d'instance et `components/inspector.ts`.
- **Carnet :** aucun changement de format. Un ancien export se relit sans perte.
- **Aucune nouvelle dépendance, aucune requête réseau.**
