---
type: overview
section: plan
generated: 2026-10-04
sources: [objectives.md, strategy.md, roadmap.md, opportunities/INDEX.md]
---
# Plan Brief
Generated 2026-10-04 · Project: oulipao · Sources: objectives.md, strategy.md, roadmap.md, opportunities/INDEX.md (toutes du 2026-10-04 ; la roadmap suit désormais la stratégie révisée)

## What we're betting on
Oulipao est l'instrument personnel du fondateur pour jouer de la littérature potentielle en français, comme un synthétiseur qu'on construit soi-même : navigateur, gratuit, code ouvert, sans compte, ouvert en passant à qui a le lien. Construire et jouer font tous deux partie du plaisir ; les textes sont le sous-produit. Pari : **si le fondateur joue de son instrument au moins une fois par semaine hors débogage, au moins 2 autres personnes ouvriront Oulipao d'elles-mêmes et en garderont ou enverront une prise avant le 31 décembre 2026**, en jouant de l'instrument et pas d'un seul réglage. Avantages : le rack joué en direct, un français juste, la trace de chaque prise (carnet, lien qui rejoue la prise). Risque nommé : le fondateur construit sans jouer (au moins 17 heures de construction pour 0 prise notée) ; déclencheur : deux semaines de commits sur `src/` sans prise hors débogage. Test : prise de 15 minutes chaque soir du 6 au 12 octobre, puis bilan du lien nu le 20 octobre.
_More detail: `.nanopm/wiki/docs/strategy.md`_

## What we're aiming for
Période : octobre – décembre 2026.
- **O1 — Un instrument dont on joue.** KR1 : au moins une prise par semaine hors débogage, du 5 octobre au 15 novembre, aucune semaine vide. KR2 : tout défaut de contrainte connu corrigé sous 7 jours. KR3 : au 15 décembre, au moins 70 % des contraintes du catalogue apparaissent dans une prise du carnet.
- **O2 — D'autres en jouent sans relance.** KR1 : au moins 2 des 7 destinataires du lien nu renvoient un bloc de carnet le 20 octobre, dont un qui touche à autre chose que l'humeur. KR2 : au moins 2 personnes rouvrent Oulipao sans relance et gardent ou envoient une prise avant le 31 décembre. KR3 : au moins 2 des 3 destinataires d'un puzzle le renvoient résolu d'ici le 15 novembre.

État au 4 octobre : O2 à 0 sur 3, le lien nu n'est pas parti.
_More detail: `.nanopm/wiki/docs/objectives.md`_

## What we're building now
NOW, dans cet ordre :
1. **« Copier » emporte l'original** (S) : d'ici le 5 octobre, original, résultat et mention collés hors de l'outil, PR fusionnée et test vert, avant tout envoi du lien.
2. **Le fondateur joue** (pas de code) : au moins 4 prises hors débogage du 6 au 12 octobre, dont 2 à chaîne de 2 instances ou plus ; puis une par semaine jusqu'au 15 novembre, relevée chaque dimanche contre les heures de commits.
3. **Le lien nu, 14 jours sans relance** (pas de code) : envoyé le 6 octobre à 7 personnes, une question le 20 octobre ; confirmé si au moins 2 blocs reviennent.
4. **Mode puzzle** (L, change `mode-puzzle`, #89 non fusionné) : en ligne au plus tard le 31 octobre ; aucun envoi avant le 20 octobre, et seulement si au moins 2 blocs sont revenus. Si le relevé du dimanche montre du code sans jeu deux semaines de suite, couper le puzzle avant le jeu.

NEXT : héberger le modèle d'étiquetage et trancher sa licence ; lister les modules qu'on ne joue pas (15 novembre) ; documentation à jour du code ; mode témoin.
_More detail: `.nanopm/wiki/docs/roadmap.md`_

## Top open opportunities
Toutes non triées dans l'INDEX ; l'ordre suit l'INDEX. Hors roadmap :
1. **Je veux que le texte transformé dise encore quelque chose** (medium) — volontairement pas un résultat clé ; à revoir selon le bilan du lien nu.
2. **Je veux montrer ce que ça donne à quelqu'un** (medium) — partage du texte seul en un clic en LATER ; le bloc du carnet et le lien de prise (#95) en tiennent lieu (assumed).
3. **Le hasard du dictionnaire me fait rire, y compris les mots crus** (medium) — confortée par le refus du filtrage, sans item dédié (assumed).
4. **L'interface ne doit pas m'empêcher de lire le résultat** (medium) — sur aucun horizon de la roadmap.
5. **Je veux changer l'humeur d'un texte** (medium) — c'est l'outil à résultat, en LATER.

(« Le résultat n'est drôle qu'à côté de l'original » est en NOW avec « Copier » ; « La contrainte doit être exacte » est couverte par O1 KR2 ; « Lexique tiré d'un texte » est en LATER.)
_More detail: `.nanopm/wiki/entities/opportunities/INDEX.md`_

## What we're saying no to
Mesurer la réussite aux textes du fondateur, ou à la construction seule ; un outil à résultat mis en avant ; un résultat clé sur le sens ; envoyer un puzzle avant le bilan du 20 octobre ; le partage du texte seul en un clic (hors puzzles) ; un format de plugin publié ou un bac à sable tiers ; le filtrage des mots crus ; comptes, sauvegarde serveur, autres langues ; une chaîne par piste ; toute génération de texte par IA (sans réouverture).

## Not yet planned
Objectifs, stratégie et roadmap existent et sont alignés au 4 octobre. Écarts restants : les objectifs ne mentionnent ni « Copier » comme préalable au lien nu, ni le relevé du dimanche (heures de commits contre prises) ; leur prochain pas (« envoyer le lien nu, puis fusionner #89 ») précède la roadmap révisée. Les 8 opportunités restent non triées. Question ouverte de la stratégie : si le fondateur joue sans que personne ne revienne, le pari est-il réussi pour lui seul ?
