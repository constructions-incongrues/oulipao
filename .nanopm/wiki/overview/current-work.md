---
type: overview
section: plan
generated: 2026-10-03
sources: [objectives.md, strategy.md, roadmap.md]
---
# Plan Brief
Generated 2026-10-03 · Project: oulipao · Sources: objectives.md, strategy.md, roadmap.md (les trois existent)

> La roadmap (révisée aujourd'hui, deuxième passe) fait foi là où elle diverge de la stratégie : la mise en ligne et les verbes, encore présentés comme « non » dans la stratégie, sont faits.

## What we're betting on

Oulipao est l'instrument personnel du fondateur pour jouer de la littérature potentielle en français, entièrement dans le navigateur, sans compte. Le pari : des contraintes traitées comme des filtres instanciables, ciblables et enchaînables lui donnent chaque semaine des textes qu'il garde (au moins 5 en 6 semaines, dont 3 issus d'une chaîne de plusieurs filtres). Avantages visés : le rack de filtres, un français juste (accords, élision), et l'auteur qui est l'utilisateur.

**Risque.** Construire au lieu d'écrire. Garde : trois semaines sans texte gardé alors que des commits continuent, on s'arrête et on relit ce qui manque. Falsification fixée au 14 novembre 2026. Le test « carnet de trois soirs » a été écarté par le fondateur.

_More detail: `.nanopm/wiki/docs/strategy.md`_

## What we're aiming for

Période : octobre à décembre 2026.

- **O1 : un prototype à pistes avec un S+7 français correct.** Les trois résultats clés sont atteints (pistes par catégorie, accords au moins 9 sur 10, texte qui ne quitte pas le navigateur).
- **O2 : que le fondateur se serve d'Oulipao pour écrire.** Au moins 5 textes gardés avant le 31 décembre ; au moins une séance par semaine pendant 6 semaines ; au moins 3 textes enchaînant plusieurs filtres. Aucun texte gardé à ce jour. Si aucun n'est gardé fin décembre, comprendre ce qui bloque avant d'ajouter des contraintes.

Les seuils chiffrés sont proposés par l'assistant, non validés par le fondateur.

_More detail: `.nanopm/wiki/docs/objectives.md`_

## What we're building now

Déjà livré aujourd'hui : filtres instanciables/ciblables/chaînables, inspecteur de chaîne, instrument perforé (design, grille de pas, verrous), verbes et V+7, lipogramme, mise en ligne GitHub Pages.

**NOW (4 à 8 semaines)**
1. **Carnet de textes gardés** (S) : ranger chaque texte avec sa date et sa chaîne. Cible : 1 texte avant le 12 octobre, 5 avant le 31 décembre. Passe en premier : sans lui, rien ne se mesure.
2. **Textbank phonétique et premier filtre de rime** (L) : au moins 2 textes gardés faits avec ce filtre, dans une chaîne d'au moins 2 filtres, avant le 30 novembre. Pièges : licence de Lexique.org (CC BY-SA) face au MIT et à la MPL, chargement à la demande, définition de la rime.
3. **Écrire chaque semaine** (sans code) : une séance par semaine du 5 octobre au 14 novembre.

Le temps de code n'est plus la limite ; le temps d'écriture l'est. Un chantier L passe devant un premier texte inexistant : la garde du risque s'applique.

**NEXT (1 à 3 mois), d'un coup d'œil** : autres filtres phonétiques (homophonies, monorime, antirime) ; élagage et mode témoin ; lipogramme à plusieurs lettres et accentuées ; paramètre texte libre (E1).

_More detail: `.nanopm/wiki/docs/roadmap.md`_

## What we're saying no to

- Génération de texte par IA (pas de réouverture).
- Comptes et sauvegarde serveur (rouvrir si le fondateur perd un texte).
- Autres langues que le français.
- Une chaîne par piste.
- Nouvelle fiche du séquenceur tant qu'aucun texte n'est gardé (rouvrir à 3 textes dans le carnet).
- Pour l'instant, avec condition de réouverture : format de plugin publié et bac à sable tiers, partage en un clic, cinq testeurs, mise en ligne comme condition.

## Not yet planned

- LATER sans date : sortie libre et structure en vers (E3), textbanks sémantiques (E5), hébergement du modèle d'étiquetage et sa licence (`TODOS.md`).
- Pas de mesure en place de la régularité (séances par semaine) hors carnet, qui n'existe pas encore (assumed).
- `product.md` n'a pas suivi ce qui est construit, et il n'y a pas de connecteur (Linear, Notion, GitHub) : aucune source externe dans le plan.
- Question ouverte de la stratégie : si les textes ne viennent pas, est-ce l'outil, l'envie ou le choix des contraintes ?
