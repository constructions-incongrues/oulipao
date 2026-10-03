# Proposition : les formes fixes à refrain (rondel, villanelle)

## Why

Le rondel et la villanelle sont deux formes fixes construites sur deux rimes, dont certains vers reviennent en refrain. Le fondateur les veut (« on fait tout »), pour voir ce que la forme fait de ses propres vers. Voir `.nanopm/wiki/docs/prds/schemas-de-rimes.md`, exigence 10.

Ces formes ne rentrent pas dans le contrat actuel des filtres. Un filtre rend un mot de sortie par mot d'entrée (`runChain` lève une erreur sinon), alors qu'un refrain **ajoute** des vers. Il faut donc une conception à part, et c'est l'objet de ce changement.

## What Changes

- **Une étape de forme, en fin de chaîne.** Un choix de forme (aucune, rondel, villanelle) s'applique au texte résultant, après la dernière instance de la chaîne. Il recopie les vers de refrain aux places que fixe la forme. Les rimes, elles, viennent de la chaîne : un schéma de rimes placé avant la forme fait rimer les vers de l'auteur.
- **Des vers recopiés visibles comme tels.** Dans le texte résultant, un vers de refrain se signale comme une copie. Cliquer l'un de ses mots ouvre, dans l'inspecteur, le mot d'origine qu'il recopie.
- **Une forme sans mètre.** Les octosyllabes du rondel ne sont ni comptés ni imposés.

## Capabilities

### New Capabilities

- `formes-a-refrain` : le rondel et la villanelle comme étape de forme en fin de chaîne. Elle fixe la place des refrains et leur affichage.

### Modified Capabilities

- `interface-a-pistes-reglage-en-direct` : le texte résultant montre les vers recopiés.
- `schemas-de-rimes` : les schémas « rondel » et « villanelle » s'ajoutent à la liste fermée. Ils lettrent les vers de l'auteur avant que la forme recopie ses refrains.

## Impact

- **domain** : `src/domain/forms/`, nouveau et pur. Il reçoit les mots de sortie et la découpe en vers, et rend une liste de vers dont certains sont des copies.
- **ui** :
  - `src/ui/tracks/view-model.ts` : appliquer la forme après `runChain` ;
  - `components/result.ts` : le rendu des copies ;
  - l'état de l'interface : le choix de forme.
- **Inchangé** : `runChain`, `fold`, le contrat des filtres et l'inspecteur de chaîne. Chaque étape reste alignée mot à mot.
