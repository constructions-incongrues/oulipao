---
type: doc
skill: recherche
provenance: assistant-researched
generated: 2026-10-03
updated: 2026-10-04
sources: [oulipo.net/contraintes (153 fiches), src/domain/plugin.ts, src/domain/plugin-chain.ts, src/ports, src/adapters]
---
# Catalogue des contraintes oulipiennes, vu comme des filtres

Pour chaque contrainte du site de l'Oulipo : peut-elle devenir un filtre d'Oulipao, et sinon, qu'est-ce qui manque ? Ce classement doit servir à choisir les prochains filtres.

## Le contrat jugé

Un filtre, c'est le contrat `ConstraintPlugin` (`src/domain/plugin.ts`) tel qu'il est aujourd'hui :

- **Entrée.** Le texte, ses mots étiquetés sur cinq pistes (`noun`, `verb`, `adjective`, `adverb`, `other`), les pistes visées et une portée (mots sautés, valeurs propres à certains mots).
- **Réglages.** Des paramètres de deux sortes seulement : un entier borné ou un choix dans une liste fermée.
- **Ressources.** Une seule textbank prêtée par l'hôte : la morphologie (`MorphologyRepository`), qui connaît les **noms, les adjectifs et les adverbes**, leurs formes et l'élision. Pas de verbes, pas de phonétique, pas de définitions. Les étiqueteurs (CamemBERT, fr-compromise, recherche dans le lexique) ne servent qu'à étiqueter.
- **Sortie.** Un élément par mot d'origine, avec le blanc qui le précède : remplacé (par un ou plusieurs mots), retiré, ou laissé avec une raison. Un filtre peut donc **changer les blancs**, et donc couper des lignes. Il voit le texte entier et ses fins de ligne. En revanche, il ne peut ni **déplacer** un mot, ni **dupliquer** un vers, ni **insérer** du texte qui ne soit pas rattaché à un mot.
- **Chaîne.** Les instances s'enchaînent ; chacune relit la sortie de la précédente. Plusieurs lipogrammes enchaînés interdisent donc plusieurs lettres.

## La grille

- **A. Faisable aujourd'hui.** Un nouveau filtre suffit, avec le contrat et les ressources actuels, sans toucher au reste.
- **B. Faisable avec évolution.** Il faut étendre le contrat ou ajouter une textbank. Les évolutions sont numérotées E1 à E8 (voir plus bas).
- **C. Hors du modèle filtre.** La contrainte compose un texte au lieu d'en transformer un. Ou bien elle construit une œuvre entière, elle est visuelle, elle produit plusieurs textes, ou elle repose sur un jugement. Quand une évolution permettrait au moins de *contrôler* un texte écrit à la main, elle est notée.

Deux réserves valent pour tout le niveau A :

- **Les verbes résistent, en partie.** E6 est faite pour le S+n et le lipogramme : ils remplacent les verbes au même temps et à la même personne (« être » et « avoir » restent). Un filtre qui remplace par un voisin dans un autre ordre (initiale imposée, forme) n'en profite pas encore.
- **Les mots-outils échappent au lexique.** Un filtre qui remplace par un « voisin » ne peut pas les traiter ; il les retire ou les laisse.

« Faisable » veut donc dire « implémentable », pas « parfait ».

## Couverture dans Oulipao (2026-10-04)

**32 contraintes sur 153 sont gérées, soit 21 %.** Sur les 61 que ce catalogue juge réalisables comme filtres (A et B), 30 le sont, soit 49 %. Une contrainte compte comme gérée quand un moteur ou une recette la produit.

| Niveau | Gérées | Total | Part |
|---|---|---|---|
| A | 16 | 25 | 64 % |
| B | 14 | 36 | 39 % |
| C | 2 | 91 | 2 % |
| ? | 0 | 1 | — |
| **Total** | **32** | **153** | **21 %** |

| Contrainte | Niveau | Comment |
|---|---|---|
| S+7, V+7 | A | moteur S+n, sur les noms, adjectifs et verbes |
| S+dé | A | moteur S+n, tirage « au dé » : un décalage de 1 à 6 par mot, déduit d'une graine ; la recette prend la date julienne du jour |
| Éclipse | A | recette : un S+7 sur les noms et la forme éclipse, qui met le texte d'origine devant le texte résultant |
| Lipogramme | A | moteur Lipogramme, sur une liste de lettres interdites ou permises (paramètre texte, E1) |
| Liponymie, La rien que la toute la, Inventaire | A | moteur Tri par piste, et une recette chacune |
| Haï-kaïsation, Intérieur de poème | A | moteur Bord, et une recette chacune |
| Poème de bandit, Juliennes | A | moteur Mise en vers, et une recette chacune (Juliennes prend la date julienne du jour) |
| Monovocalisme, Bivocalisme | A | recettes : un lipogramme sur les autres voyelles, voyelle(s) gardée(s) au choix ; une voyelle accentuée compte pour sa voyelle nue |
| Contrainte du prisonnier | B | recette : un lipogramme sur les douze lettres à hampe ou à jambage (E1) |
| Beau présent, Épithalame oulipien | B | recette Beau présent : un lipogramme en lettres permises, où l'on tape le nom (E1) |
| Monoconsonnantisme | B | lipogramme en lettres permises sur les voyelles et la consonne gardée (E1) ; les mots qui survivent sont rares tant que E7 manque |
| Tautogramme, Abécédaire | A | moteur Tautogramme progressif, et une recette chacune : la lettre choisie, ou les lettres de a à z ; les mots-outils ne comptent pas |
| Tautogramme progressif | B | moteur Tautogramme progressif : les initiales suivent une liste de lettres en boucle ; chaque mot part du dictionnaire à son initiale changée (E1) |
| Poème monorime, Sonnet monorime (les deux fiches) | B | moteur Monorime, sur la textbank phonétique (E2) ; le genre peut alterner masculin et féminin |
| Antirime | B | moteur Antirime (E2) |
| Antérime | B | moteur Antérime : la rime imposée en début de vers (E2) |
| Rime berrychonne | B | moteur Rime berrychonne (E2) |
| Homophonies | B | moteur Homophonies (E2) |
| Étreinte, Rime bisexuelle | B | moteur Schéma de rimes, schémas « étreinte » et « rime bisexuelle » (E2) |
| Rondel, Villanelle | C | forme à refrain posée après la chaîne, avec le schéma de rimes du même nom : le fondateur écrit les vers neufs, les refrains sont recopiés (E2, E3 en partie) |

**Hors catalogue.** Le moteur R+n (remplacer un mot par le n-ième mot qui rime avec lui) ne correspond à aucune fiche. Il prépare Aphorime et Locurime, qui attendent encore E5.

Familles suivantes, dans l'ordre :
- **Voisin à initiale imposée :** Acrostiche universel, Delmas, Lipossible. Le moteur du Tautogramme progressif en fait déjà l'essentiel ; l'Acrostiche brivadois reste à faire.
- **Variantes du S+n :** adverbes, Poème carré, Propre-Commun. Homosyntaxisme et Aphorisme n'attendent plus que les adverbes.
- **Recherche par forme :** Anagramme, Homovocalisme, avec un index construit à la demande.

## Récapitulatif

| Contrainte | Niveau | Raison | Évolutions |
|---|---|---|---|
| [99 notes préparatoires](https://oulipo.net/contraintes/99-notes-preparatoires) | C | forme d'essai, pas de règle formelle | — |
| [À deux voies](https://oulipo.net/contraintes/a-deux-voies) | C | poème qui bifurque en deux lectures | — |
| [À supposer…](https://oulipo.net/contraintes/a-supposer) | C | écriture d'une phrase unique d'au moins 1000 signes | — |
| [Abécédaire](https://oulipo.net/contraintes/abecedaire) | A | remplacer chaque mot par un voisin à l'initiale attendue | E6 |
| [Acronyme](https://oulipo.net/contraintes/acronyme) | C | génère des expansions d'un mot | E1, E7 |
| [Acrostiche brivadois](https://oulipo.net/contraintes/acrostiche-brivadois) | B | initiales de vers imposées par un nom + abécédaire dans le vers | E1 |
| [Acrostiche universel](https://oulipo.net/contraintes/acrostiche-universel) | A | 26 vers dont les initiales vont de a à z | E6 |
| [Aigre-doux](https://oulipo.net/contraintes/aigre-doux) | ? | fiche muette (règle dans un .docx) | — |
| [Alexandrin jouetien](https://oulipo.net/contraintes/alexandrin-jouetien) | C | composition métrique | E2, E8 |
| [Alexandrin oral](https://oulipo.net/contraintes/alexandrin-oral) | C | composition métrique | E2, E8 |
| [Algorithme de Mathews](https://oulipo.net/contraintes/algorithme-de-mathews) | B | permutations sur un tableau de mots, lecture en colonnes | E3, E7 |
| [Alphabétique (portrait)](https://oulipo.net/contraintes/alphabetique-portrait) | C | liste de mots choisie pour un portrait | — |
| [Alva](https://oulipo.net/contraintes/alva) | B | élider des e muets pour raccourcir un vers | E2 |
| [Anaérobie](https://oulipo.net/contraintes/anaerobie) | B | priver un texte du son /R/ en gardant des mots | E2, E7 |
| [Anagramme](https://oulipo.net/contraintes/anagramme) | A | remplacer un mot par une de ses anagrammes | E7 |
| [Antérime](https://oulipo.net/contraintes/anterime) | B | imposer une rime en début de vers | E2 |
| [Antirime](https://oulipo.net/contraintes/antirime) | B | fin de vers en antiphonèmes du vers précédent | E2 |
| [Aphorime](https://oulipo.net/contraintes/aphorime) | B | substitution par la rime dans un aphorisme | E2, E5 |
| [Aphorisme](https://oulipo.net/contraintes/aphorisme) | A | garder la syntaxe, changer les mots pleins | E5, E6 |
| [Arbre à théâtre](https://oulipo.net/contraintes/arbre-a-theatre) | C | renvoi : littérature en graphe | — |
| [Arbres et arborescence](https://oulipo.net/contraintes/arbres-et-arborescence) | C | renvoi : littérature en graphe | — |
| [Avalanche](https://oulipo.net/contraintes/avalanche) | C | suite de boules de neige | — |
| [Avion](https://oulipo.net/contraintes/avion) | C | abréviation de noms propres | — |
| [Beau présent](https://oulipo.net/contraintes/beau-present) | B | n'écrire qu'avec les lettres d'un nom | E1 |
| [Belle absente](https://oulipo.net/contraintes/belle-absente) | B | une lettre interdite par vers + pangramme | E1, E8 |
| [Bibliothèques virtuelles](https://oulipo.net/contraintes/bibliotheques-virtuelles) | C | titres de livres sous contrainte | — |
| [Bivocalisme](https://oulipo.net/contraintes/bivocalisme) | A | chaîne de lipogrammes sur trois ou quatre voyelles | — |
| [Bord de poème](https://oulipo.net/contraintes/bord-de-poeme) | B | extraire le pourtour d'un poème, en réordonnant | E3 |
| [Boule de neige](https://oulipo.net/contraintes/boule-de-neige) | C | vers de longueur croissante | — |
| [Bris de mots](https://oulipo.net/contraintes/bris-de-mots) | C | renvoi : oblique | — |
| [Caradec](https://oulipo.net/contraintes/caradec) | B | une chaîne de S+7 dont on montre chaque étape | E3 |
| [Carré lescurien](https://oulipo.net/contraintes/carre-lescurien) | A | renvoi : poème carré | — |
| [Chicago](https://oulipo.net/contraintes/chicago) | C | devinette en homosyntaxismes résolue par homophonie | — |
| [Chimère](https://oulipo.net/contraintes/chimere) | B | remplir le moule d'un texte avec les mots d'autres textes | E4, E6 |
| [Chronopoème](https://oulipo.net/contraintes/chronopoeme) | C | poème lu en un temps donné | — |
| [Citations](https://oulipo.net/contraintes/citations) | C | recherche de vers dans un corpus | — |
| [CMMP](https://oulipo.net/contraintes/cmmp) | C | combinatoire de sonnets | — |
| [Conte à votre façon](https://oulipo.net/contraintes/conte-a-votre-facon) | C | récit en arbre | — |
| [Contrainte de Delmas](https://oulipo.net/contraintes/contrainte-de-delmas) | A | changer l'initiale des mots pleins en gardant des mots | E7 |
| [Contrainte de Lloyd](https://oulipo.net/contraintes/contrainte-de-lloyd) | C | renvoi : SOLVA | — |
| [Contrainte de Pascal](https://oulipo.net/contraintes/contrainte-de-pascal) | C | relations entre personnages dictées par une figure | — |
| [Contrainte de Turing](https://oulipo.net/contraintes/contrainte-de-turing) | C | effacer toute marque de genre | E8 |
| [Contrainte du prisonnier](https://oulipo.net/contraintes/contrainte-du-prisonnier) | B | lipogramme sur toutes les lettres à jambages | E1 |
| [Cornichon](https://oulipo.net/contraintes/cornichon) | C | mots dont les deux moitiés ont un rapport sémantique | — |
| [Critique constructive](https://oulipo.net/contraintes/critique-constructive) | C | critique puis extrait d'un livre imaginaire | — |
| [Cylindre](https://oulipo.net/contraintes/cylindre) | C | texte qui se boucle | — |
| [Désarguesienne](https://oulipo.net/contraintes/desarguesienne) | C | configuration de Desargues en lettres et mots | — |
| [Deunglitsch](https://oulipo.net/contraintes/deunglitsch) | C | renvoi : l'égal franglais | — |
| [Échelle](https://oulipo.net/contraintes/echelle) | C | relier deux mots en changeant une lettre à la fois | E7 |
| [Éclipse](https://oulipo.net/contraintes/eclipse) | A | un texte suivi de son S+7 | — |
| [Eodermdrome](https://oulipo.net/contraintes/eodermdrome) | C | parcours eulérien d'un pentagone de lettres | — |
| [Épithalame oulipien](https://oulipo.net/contraintes/epithalame-oulipien) | B | renvoi : beau présent | E1 |
| [Étreinte](https://oulipo.net/contraintes/etreinte) | B | schéma de rimes ABCDEF FEDCBA | E2 |
| [Exercice de style](https://oulipo.net/contraintes/exercice-de-style) | C | réécrire une histoire dans un style tiré au sort | — |
| [Explorations à la limite](https://oulipo.net/contraintes/explorations-a-la-limite) | C | catalogue de propositions limites | — |
| [Facteur commun (mise en)](https://oulipo.net/contraintes/facteur-commun-mise-en) | B | mettre en facteur une syllabe commune | E2, E3 |
| [Filigrane](https://oulipo.net/contraintes/filigrane) | C | effacer un mot dans des locutions et composer | E5 |
| [Formes fixes](https://oulipo.net/contraintes/formes-fixes) | C | sonnet, ballade, pantoum… | — |
| [Graphe](https://oulipo.net/contraintes/graphe) | C | texte à embranchements | — |
| [Haï-kaïsation](https://oulipo.net/contraintes/hai-kaisation) | A | ne garder que les fins de vers | — |
| [Haïku argentin](https://oulipo.net/contraintes/haiku-argentin) | C | haïku de mots avec mésostiche | — |
| [Hétérogrammes](https://oulipo.net/contraintes/heterogrammes) | C | renvoi : ulcérations | — |
| [Homomorphisme](https://oulipo.net/contraintes/homomorphisme) | B | même structure qu'un texte-souche | E2, E6 |
| [Homophonies](https://oulipo.net/contraintes/homophonies) | B | réécrire un énoncé en homophone | E2, E7 |
| [Homosyntaxisme](https://oulipo.net/contraintes/homosyntaxisme) | A | garder la syntaxe, changer tous les mots pleins | E6 |
| [Homovocalisme](https://oulipo.net/contraintes/homovocalisme) | A | garder les voyelles, changer les consonnes | E7 |
| [Hyper-roman](https://oulipo.net/contraintes/hyper-roman) | C | récits qui se multiplient | — |
| [Hypertropes](https://oulipo.net/contraintes/hypertropes) | C | suite de poèmes sur la suite de Fibonacci | — |
| [Immorale élémentaire](https://oulipo.net/contraintes/immorale-elementaire) | B | changer les substantifs d'après un champ lexical | E5 |
| [Index](https://oulipo.net/contraintes/index) | C | lire un index de premiers vers comme un poème | — |
| [Intérieur de poème](https://oulipo.net/contraintes/interieur-de-poeme) | A | retirer le bord d'un poème | — |
| [Inventaire](https://oulipo.net/contraintes/inventaire) | A | relever une catégorie de mots | — |
| [Juliennes](https://oulipo.net/contraintes/juliennes) | A | nombre de mots par vers dicté par la date julienne | — |
| [La rien que la toute la](https://oulipo.net/contraintes/la-rien-que-la-toute-la) | A | ne garder que les mots-outils | — |
| [L'égal franglais](https://oulipo.net/contraintes/legal-franglais) | C | texte lisible en deux langues | E5, E8 |
| [Leiris](https://oulipo.net/contraintes/leiris) | C | définir un mot par ses lettres et ses sons | — |
| [Lipogramme](https://oulipo.net/contraintes/lipogramme) | A | existe déjà | E6 |
| [Liponymie](https://oulipo.net/contraintes/liponymie) | A | retirer une catégorie de mots | — |
| [Lipossible](https://oulipo.net/contraintes/lipossible) | A | ôter une lettre et retomber sur un mot | E7 |
| [Littérature définitionnelle](https://oulipo.net/contraintes/litterature-definitionnelle) | B | remplacer chaque mot plein par sa définition | E5 |
| [Locurime](https://oulipo.net/contraintes/locurime) | B | substituer par la rime dans des locutions | E2, E5 |
| [Locutions introuvables](https://oulipo.net/contraintes/locutions-introuvables) | B | croiser les moitiés de deux locutions | E5, E3 |
| [Logo-rallye](https://oulipo.net/contraintes/logo-rallye) | C | renvoi : parcours obligé | E1, E8 |
| [LSD](https://oulipo.net/contraintes/lsd) | C | définitions inattendues choisies par l'auteur | E5 |
| [Minisextine](https://oulipo.net/contraintes/minisextine-minisestina) | C | sextine appliquée aux syllabes d'un mot | — |
| [Monkine](https://oulipo.net/contraintes/monkine) | C | longueurs de mots dictées par le carré d'une quenine | — |
| [Monoconsonnantisme](https://oulipo.net/contraintes/monoconsonnantisme) | B | lipogramme sur toutes les consonnes sauf une | E1, E7 |
| [Monostique paysager](https://oulipo.net/contraintes/monostique-paysager) | C | vers unique de 40 à 50 syllabes, lu en balayant | — |
| [Monovocalisme](https://oulipo.net/contraintes/monovocalisme) | A | chaîne de lipogrammes sur toutes les voyelles sauf une | — |
| [Morale double](https://oulipo.net/contraintes/morale-double) | C | deux morales élémentaires en regard | — |
| [Morale élémentaire](https://oulipo.net/contraintes/morale-elementaire) | C | forme fixe de groupes nom + adjectif | E3 |
| [N-ine](https://oulipo.net/contraintes/n-ine) | C | sextine généralisée | — |
| [Nonine](https://oulipo.net/contraintes/nonine) | C | permutation qui revient au départ avant n strophes | — |
| [Noninisation](https://oulipo.net/contraintes/noninisation) | C | compléter un poème en nonine | E3 |
| [Oblique](https://oulipo.net/contraintes/oblique) | C | définir un mot par les mots qui le contiennent | E7 |
| [Onzain hétérogrammatique](https://oulipo.net/contraintes/onzain-heterogrammatique) | C | 121 lettres en onze anagrammes | — |
| [Ouliporime](https://oulipo.net/contraintes/ouliporime) | C | trois vers qui finissent sur les fragments d'un mot | — |
| [Palindrome](https://oulipo.net/contraintes/palindrome) | B | inverser l'ordre des unités | E3 |
| [Parcours obligé](https://oulipo.net/contraintes/parcours-oblige-ou-logo-rallye) | C | texte qui contient des mots imposés dans l'ordre | E1, E8 |
| [Perverbe](https://oulipo.net/contraintes/perverbe) | B | croiser deux proverbes | E5, E3 |
| [Petite boîte](https://oulipo.net/contraintes/petite-boite) | C | forme fixe de 6 vers avec mot mis en boîte | — |
| [Petite morale élémentaire portative](https://oulipo.net/contraintes/petite-morale-elementaire-portative) | C | réduction de la morale élémentaire | — |
| [Poème carré](https://oulipo.net/contraintes/poeme-carre-ou-carre-lescurien) | A | permuter les mots de même catégorie | — |
| [Poème de bandit](https://oulipo.net/contraintes/poeme-de-bandit) | A | mettre une prose en vers | — |
| [Poème de métro](https://oulipo.net/contraintes/poeme-de-metro) | C | un vers par station | — |
| [Poème fondu](https://oulipo.net/contraintes/poeme-fondu) | C | réduire un poème en n'employant que ses mots | E2 |
| [Poème monorime](https://oulipo.net/contraintes/poeme-monorime) | B | une seule rime pour tous les vers | E2 |
| [Poème pour bègue](https://oulipo.net/contraintes/poeme-pour-begue) | C | chaque syllabe paire répète l'impaire | — |
| [Porche](https://oulipo.net/contraintes/porche) | C | phrase ambiguë à l'oreille entre deux genres | — |
| [Portrait en creux](https://oulipo.net/contraintes/portrait-en-creux) | C | portrait dessiné par les blancs du texte | — |
| [Portrait géographique](https://oulipo.net/contraintes/portrait-geographique) | C | itinéraire réel sur une carte | — |
| [Propre-Commun](https://oulipo.net/contraintes/propre-commun) | A | changer les noms communs en noms propres | — |
| [Quatroum](https://oulipo.net/contraintes/quatroum) | C | quatrine mêlée au pantoum | — |
| [Quenine](https://oulipo.net/contraintes/quenine) | C | renvoi : n-ine | — |
| [Quenine à démarreur](https://oulipo.net/contraintes/quenine-a-demarreur) | C | permutation des débuts de vers | — |
| [Queninisation](https://oulipo.net/contraintes/queninisation) | C | compléter un texte en quenine | E3 |
| [Quenoum](https://oulipo.net/contraintes/quenoum) | C | quenine mêlée au pantoum | — |
| [Récapitul](https://oulipo.net/contraintes/recapitul) | C | six strophes et des vers-listes entre elles | E3 |
| [Redonde](https://oulipo.net/contraintes/redonde) | C | trois mots-clefs permutés sur trois strophes | — |
| [Rime berrychonne](https://oulipo.net/contraintes/rime-berrychonne) | B | rime composée de la consonne de l'un, la voyelle de l'autre | E2 |
| [Rime bisexuelle](https://oulipo.net/contraintes/rime-bisexuelle) | B | rimes masculine et féminine en trio | E2 |
| [Rondel](https://oulipo.net/contraintes/rondel) | C | forme fixe à refrain sur deux rimes | E2, E3 |
| [S+7](https://oulipo.net/contraintes/s7) | A | existe déjà | — |
| [S+dé](https://oulipo.net/contraintes/sde) | A | S+n avec un décalage tiré au dé | — |
| [SOLVA](https://oulipo.net/contraintes/solva-sonnet-de-longueur-variable) | C | ajouter un vers à un sonnet | — |
| [Sonnet à la limite](https://oulipo.net/contraintes/sonnet-a-la-limite) | C | sonnets limites de Le Lionnais | — |
| [Sonnet alexandriniste](https://oulipo.net/contraintes/sonnet-alexandriniste) | C | sonnet en vers longs qui se rétablit en alexandrin | — |
| [Sonnet dessiné](https://oulipo.net/contraintes/sonnet-dessine) | C | bande dessinée en forme de sonnet | — |
| [Sonnet enjambeur](https://oulipo.net/contraintes/sonnet-enjambeur) | C | chaque vers enjambe, le dernier sur le premier | — |
| [Sonnet irrationnel](https://oulipo.net/contraintes/sonnet-irrationnel) | C | strophes de 3-1-4-1-5 vers sur pi | E2, E3 |
| [Sonnet mince](https://oulipo.net/contraintes/sonnet-mince) | C | sonnet en vers très courts à mots-clés | — |
| [Sonnet monorime](https://oulipo.net/contraintes/sonnet-monorime) | B | renvoi : sonnet monorime | E2 |
| [Sonnet monorime (définition)](https://oulipo.net/contraintes/sonnet-monorime-0) | B | une rime unique, en alternant masculin et féminin | E2 |
| [Surdéfinitions](https://oulipo.net/contraintes/surdefinitions) | C | définir un mot par son sens et par un mot qui le contient | E7 |
| [Système jiǎnpǔ](https://oulipo.net/contraintes/systeme-jianpu) | B | correspondance entre voyelles et notes | E2 |
| [Tautogramme](https://oulipo.net/contraintes/tautogramme) | A | tous les mots commencent par la même lettre | E6 |
| [Tautogramme progressif](https://oulipo.net/contraintes/tautogramme-progressif) | B | initiales selon une liste de lettres qui se répète | E1 |
| [Terine](https://oulipo.net/contraintes/terine) | C | n-ine de trois | — |
| [Terine à triolet](https://oulipo.net/contraintes/terine-a-triolet) | C | mots-rimes remplacés par trois mots liés | E5 |
| [Terine homophonique](https://oulipo.net/contraintes/terine-homophonique) | C | terine sur des homophones | E2 |
| [Textes à démarreur](https://oulipo.net/contraintes/textes-a-demarreur) | C | liste de phrases ouvertes par une formule | E1 |
| [Théâtre booléen](https://oulipo.net/contraintes/theatre-booleen) | C | pièces combinées par opérations ensemblistes | — |
| [Tireur à la ligne](https://oulipo.net/contraintes/tireur-a-la-ligne) | C | insérer des phrases entre deux phrases | — |
| [Traduction antonymique](https://oulipo.net/contraintes/traduction-antonymique) | B | remplacer chaque mot plein par un antonyme | E5, E6 |
| [Traduction homophonique](https://oulipo.net/contraintes/traduction-homophonique) | B | traduire un texte étranger par le son | E2, E5 |
| [Transduction](https://oulipo.net/contraintes/transduction) | B | remplacer les noms par ceux d'un lexique spécialisé | E5 |
| [Ulcérations](https://oulipo.net/contraintes/ulcerations) | C | vers de onze lettres, anagrammes d'ulcérations | — |
| [Un hôte de marque](https://oulipo.net/contraintes/un-hote-de-marque-0) | C | exemple de critique constructive | — |
| [V+7](https://oulipo.net/contraintes/v7) | A | existe : un S+7 qui vise les verbes | — |
| [Villanelle](https://oulipo.net/contraintes/villanelle) | C | forme fixe à refrain sur deux rimes | E2, E3 |
| [Vocabulaires raisonnés](https://oulipo.net/contraintes/vocabulaires-raisonnes) | C | classer le lexique selon des principes nouveaux | — |
| [X prend Y pour Z](https://oulipo.net/contraintes/x-prend-y-pour-z) | C | récit dicté par une table de multiplication | — |
| [Zeugme dessiné](https://oulipo.net/contraintes/zeugme-dessine-1) | C | zeugmes en bande dessinée | — |

## A. Faisable aujourd'hui (25)

### Abécédaire

**Règle.** Les initiales des mots successifs suivent l'alphabet.

**Verdict.** Le filtre remplace les noms, adjectifs et adverbes par le voisin du dictionnaire dont l'initiale est la lettre attendue, sur le modèle du voisin du lipogramme (`neighbour.ts`). Les verbes et les mots-outils restent hors d'atteinte : rendement partiel, comme le lipogramme ; E6 l'améliore. Évolutions : E6.

### Acrostiche universel

**Règle.** Un acrostiche de vingt-six vers sur l'alphabet entier.

**Verdict.** Le filtre remplace le premier mot remplaçable de la ligne n par un voisin commençant par la n-ième lettre. Pas besoin de paramètre texte, l'alphabet est fixe. Si la ligne commence par un verbe ou un mot-outil, le filtre le laisse avec une raison. Évolutions : E6.

### Anagramme

**Règle.** Permuter les lettres d'un mot pour en faire un autre ; le poème anagrammatique répète les mêmes lettres à chaque vers.

**Verdict.** Mot à mot, c'est faisable : on énumère les formes de noms, d'adjectifs et d'adverbes et on cherche celles qui ont les mêmes lettres. C'est lent sans index (E7). Le poème anagrammatique, lui, est une composition (C). Évolutions : E7.

### Aphorisme

**Règle.** On garde le moule syntaxique d'un aphorisme et on remplace ses mots pleins par d'autres de même nature, éventuellement pris dans un domaine.

**Verdict.** C'est un S+n étendu aux adjectifs et adverbes, faisable avec la morphologie actuelle. Les verbes (E6) et le choix d'un domaine lexical (E5) relèvent d'évolutions. Évolutions : E5, E6.

### Bivocalisme

**Règle.** Un texte qui n'emploie que deux voyelles.

**Verdict.** Trois ou quatre instances du lipogramme enchaînées (a, e, i, o, u, y selon le choix). Le rendement est celui du lipogramme : verbes et mots sans voisin restent.

### Carré lescurien

**Règle.** Renvoie au poème carré.

**Verdict.** Voir Poème carré.

### Contrainte de Delmas

**Règle.** On remplace l'initiale des mots significatifs par une autre lettre et l'énoncé garde un sens.

**Verdict.** Pour une lettre choisie (paramètre à choix, comme le lipogramme), le filtre essaie lettre + reste du mot et garde le remplacement si `nounReadings` ou `adjectiveReadings` le connaît. Le « sens » n'est pas vérifiable ; E7 accélère la recherche. Évolutions : E7.

### Éclipse

**Règle.** L'auteur écrit un texte dont le S+7 forme la seconde partie.

**Verdict.** Le S+7 existe ; l'auteur écrit la première partie et Oulipao lui donne la seconde. Juxtaposer les deux dans une seule sortie demanderait E3, mais ce n'est pas l'essentiel.

### Haï-kaïsation

**Règle.** On réduit un poème à ses fins de vers ; en variante, on colle les premiers mots aux derniers.

**Verdict.** Retrait pur : le filtre retire tout sauf les n derniers mots de chaque ligne (n entier). La variante tête-à-queue garde aussi les premiers.

### Homosyntaxisme

**Règle.** Un texte de même syntaxe que le texte-souche.

**Verdict.** Un S+n sur les noms, adjectifs et adverbes, avec les mots-outils gardés, suffit. Les verbes attendent E6. Évolutions : E6.

### Homovocalisme

**Règle.** Un texte dont la suite des voyelles reproduit celle du texte-souche.

**Verdict.** Mot à mot : on remplace un mot par un autre du lexique qui a le même squelette de voyelles. Le lexique s'énumère aujourd'hui ; un index (E7) rendrait la recherche rapide. La fiche ne précise pas si l'homovocalisme est graphique ou phonétique ; la version graphique est faisable. Évolutions : E7.

### Intérieur de poème

**Règle.** Ce qui reste quand on ôte le bord : premier et dernier vers, premiers et derniers mots des autres.

**Verdict.** Retrait pur, en suivant les fins de ligne du texte reçu.

### Inventaire

**Règle.** Lister dans un poème les mots d'une catégorie (noms, verbes…).

**Verdict.** Le filtre retire tout ce qui n'est pas sur la piste visée et met un mot par ligne (en changeant les blancs). Les pistes viennent de l'étiqueteur.

### Juliennes

**Règle.** Les chiffres de la date julienne du début de l'écriture donnent le nombre de mots de chaque vers.

**Verdict.** Pour un texte donné, c'est une remise en vers : le filtre change les blancs pour couper les lignes selon les chiffres. La date tient dans un paramètre entier. La contrainte d'origine est une composition ; la remise en vers en est la part mécanique.

### La rien que la toute la

**Règle.** Un texte sans nom, sans adjectif ni verbe.

**Verdict.** Liponymie sur trois pistes : le filtre retire les mots des pistes noun, adjective, verb.

### Lipogramme

**Règle.** Ne jamais employer une lettre donnée.

**Verdict.** Filtre existant (`src/domain/lipogram`). Les verbes sont laissés en v1 : E6 les ouvrirait. Évolutions : E6.

### Liponymie

**Règle.** S'interdire une catégorie de mots (noms, verbes, adjectifs).

**Verdict.** Retrait des mots des pistes visées. Couper une piste dans l'hôte fait presque la même chose ; un filtre a l'avantage de s'enchaîner.

### Lipossible

**Règle.** On ôte d'un mot toutes ses occurrences d'une lettre pour en obtenir un autre (paresse → presse).

**Verdict.** Paramètre à choix : la lettre. Le filtre remplace le mot si la forme amputée est connue du lexique, et laisse les autres avec une raison. Évolutions : E7.

### Monovocalisme

**Règle.** Un lipogramme d'où sont bannies toutes les voyelles sauf une.

**Verdict.** Quatre ou cinq instances du lipogramme enchaînées. La variante phonétique (monophonisme) demande E2.

### Poème carré

**Règle.** On permute entre eux des mots de même catégorie (permutations plates, alternées, embrassées).

**Verdict.** Chaque mot est remplacé par un autre mot du texte, sur la même piste : la sortie mot par mot le permet. Le mode de permutation est un paramètre à choix ; le réaccord des noms reprend la mécanique du S+7.

### Poème de bandit

**Règle.** Un poème volé à une prose : seule la disposition change.

**Verdict.** Le filtre change les blancs entre les mots pour couper les lignes (tous les n mots, ou aux ponctuations). Les mots restent intacts.

### Propre-Commun

**Règle.** Chaque nom commun d'une série devient un personnage, par une majuscule, un prénom ou un titre.

**Verdict.** La majuscule seule est faisable sur la piste des noms. Ajouter prénoms et titres demanderait une liste à fournir, que la fiche laisse à l'auteur.

### S+7

**Règle.** Remplacer chaque nom par le septième qui le suit dans un dictionnaire.

**Verdict.** Filtre existant (`src/domain/s7`), avec ses variantes de décalage et de réaccord.

### S+dé

**Règle.** Comme le S+7, mais le décalage de chaque nom est tiré au dé, de 1 à 6.

**Verdict.** Le moteur du S+7 accepte déjà un décalage par mot (les verrous passent des valeurs propres). Un paramètre entier « graine » rend le tirage reproductible.

### Tautogramme

**Règle.** Un texte dont tous les mots commencent par la même lettre.

**Verdict.** Le filtre remplace les mots pleins par leur voisin à l'initiale imposée (paramètre à choix). Mots-outils et verbes résistent : rendement partiel, comme le lipogramme. Évolutions : E6.


## B. Faisable avec évolution (36)

### Acrostiche brivadois

**Règle.** Les initiales des vers épellent un nom propre ; dans chaque vers, les initiales des mots progressent dans l'alphabet.

**Verdict.** La règle se transforme en remplacements par voisin, ligne par ligne (les fins de ligne se lisent dans le texte reçu). Il manque le paramètre qui porte le nom à épeler (E1). Évolutions : E1.

### Algorithme de Mathews

**Règle.** On range des mots en tableau, on décale chaque ligne d'un cran de plus, puis on lit les colonnes.

**Verdict.** Appliqué aux mots d'un texte groupés par ligne, c'est mécanique. Mais la lecture en colonnes recompose les mots, ce que la sortie mot par mot ne sait pas faire (E3). Il faut aussi savoir si le résultat est un mot (E7). Évolutions : E3, E7.

### Alva

**Règle.** On raccourcit un alexandrin en ne comptant plus ses e muets, par élisions de plus en plus brutales (« brûl' »).

**Verdict.** C'est une vraie transformation, paramétrable par la longueur visée (entier). Il faut savoir où sont les e muets et compter les syllabes (E2). Évolutions : E2.

### Anaérobie

**Règle.** Ôter un phonème (le R, ou L, ou T) à chaque mot et retomber sur des mots : « rosse » → « os ».

**Verdict.** La privation est phonétique, pas graphique : le lipogramme en r n'est qu'une approximation. Il faut la phonétique (E2) et la recherche d'homophones dans le lexique (E7). Évolutions : E2, E7.

### Antérime

**Règle.** La rime se place au début des vers plutôt qu'à la fin.

**Verdict.** On peut forcer la rime initiale en remplaçant le premier mot remplaçable de chaque vers par un mot qui rime avec celui du vers voisin. Il faut connaître les rimes (E2). Évolutions : E2.

### Antirime

**Règle.** Le second vers finit sur les antiphonèmes (traits distinctifs inversés) des sons qui terminent le premier.

**Verdict.** Remplacement du dernier mot d'un vers sur deux. Il faut les phonèmes et leurs traits distinctifs (E2), plus qu'un simple dictionnaire de rimes. Évolutions : E2.

### Aphorime

**Règle.** La fiche est vide ; la fiche « Locurime » en donne la définition : remplacer un mot d'un aphorisme par des mots qui riment avec lui.

**Verdict.** Classée d'après la fiche Locurime, avec cette ambiguïté. Mêmes besoins : les rimes (E2) et, pour repérer les aphorismes, un recueil (E5). Évolutions : E2, E5.

### Beau présent

**Règle.** Chaque vers n'emploie que les lettres du nom du destinataire.

**Verdict.** C'est un lipogramme sur toutes les lettres absentes du nom. En théorie, une chaîne d'instances du lipogramme y suffit, mais il en faut une vingtaine. Un paramètre « lettres permises » (E1) en fait un vrai filtre. Évolutions : E1.

### Belle absente

**Règle.** Le vers n interdit la n-ième lettre du nom et contient toutes les autres lettres de l'alphabet.

**Verdict.** L'interdiction se fait par lipogramme ligne par ligne si l'on reçoit le nom (E1). L'obligation de contenir toutes les autres lettres est une composition : au mieux un contrôle (E8). Évolutions : E1, E8.

### Bord de poème

**Règle.** Premier et dernier vers, premiers mots des autres vers, puis la liste de leurs derniers mots.

**Verdict.** L'extraction est un retrait, mais la liste des derniers mots vient après le reste : il faut déplacer des mots (E3). Évolutions : E3.

### Caradec

**Règle.** On parcourt le dictionnaire de 7 en 7 et on écrit toutes les étapes à la suite, jusqu'à retomber sur un sens.

**Verdict.** La chaîne calcule déjà chaque étape (`stages` dans `ChainResult`). Mais la contrainte affiche les étapes les unes après les autres dans le texte : il faut dupliquer des segments (E3). Évolutions : E3.

### Chimère

**Règle.** On vide un texte de ses noms, adjectifs et verbes, puis on y verse dans l'ordre ceux de trois autres textes.

**Verdict.** Le remplacement est mot par mot, donc compatible avec la sortie actuelle. Il faut recevoir les textes-cibles (E4) et réaccorder les verbes (E6). Évolutions : E4, E6.

### Contrainte du prisonnier

**Règle.** N'écrire qu'avec les lettres sans hampe ni jambage (a, c, e, m, n, o, r, s, u, v, w, x, z, et parfois i).

**Verdict.** Une douzaine de lipogrammes enchaînés : impraticable. Un paramètre « lettres interdites » (E1), ou un préréglage dans un paramètre à choix, en fait un filtre. Évolutions : E1.

### Épithalame oulipien

**Règle.** Beau présent sur les lettres des noms réunis des mariés.

**Verdict.** Voir Beau présent. Évolutions : E1.

### Étreinte

**Règle.** Généralisation des rimes embrassées : les rimes reviennent en miroir.

**Verdict.** Pour forcer le schéma sur un texte en vers, on remplace les mots de fin de vers par des mots qui riment avec leur miroir (E2). Écrire une étreinte reste une composition. Évolutions : E2.

### Facteur commun (mise en)

**Règle.** On sort d'une suite de mots la syllabe qu'ils partagent et on l'écrit une seule fois.

**Verdict.** Transformation mécanique, mais il faut découper en syllabes (E2) et déplacer la syllabe hors des mots (E3). Évolutions : E2, E3.

### Homomorphisme

**Règle.** Principe général : produire un texte de même structure qu'un autre (syntaxe, voyelles…).

**Verdict.** Ses deux déclinaisons citées sont classées à part. Le principe général dépend de la structure gardée : syntaxe (E6 pour les verbes), sons (E2). Évolutions : E2, E6.

### Homophonies

**Règle.** Trouver des énoncés qui se prononcent comme un énoncé donné (« un bon appartement chaud » / « un Bonaparte manchot »).

**Verdict.** Il faut phonétiser l'énoncé (E2) et le redécouper en mots du lexique (E7). La justification par un récit reste à l'auteur. Évolutions : E2, E7.

### Immorale élémentaire

**Règle.** On ne change que les noms d'une morale élémentaire pour en faire paraître une autre, cachée dessous.

**Verdict.** Remplacement mot par mot, mais les noms nouveaux viennent d'un domaine choisi : il faut des lexiques thématiques (E5). Évolutions : E5.

### Littérature définitionnelle

**Règle.** On remplace chaque mot plein par une de ses définitions, et on recommence sur le résultat.

**Verdict.** La sortie mot par mot accepte un remplacement de plusieurs mots, et l'itération se fait en enchaînant des instances. Il manque le dictionnaire de définitions (E5). Évolutions : E5.

### Locurime

**Règle.** Dans une locution ou un proverbe, remplacer un mot par des mots qui riment avec lui.

**Verdict.** Remplacement mot à mot, faisable avec un dictionnaire de rimes (E2). Repérer les locutions dans le texte demande un recueil (E5). Évolutions : E2, E5.

### Locutions introuvables

**Règle.** On échange les compléments de deux locutions (« tirer le diable en Espagne »).

**Verdict.** Il faut reconnaître les locutions dans le texte (E5) et échanger des segments de longueurs différentes (E3). Évolutions : E5, E3.

### Monoconsonnantisme

**Règle.** Un texte qui n'emploie qu'une consonne.

**Verdict.** Dix-neuf lipogrammes enchaînés : impraticable, et presque aucun mot ne survit. Un paramètre de lettres permises (E1) et la recherche de mots par lettres (E7) rendraient le filtre utilisable. Évolutions : E1, E7.

### Palindrome

**Règle.** Un texte qui se lit dans les deux sens, en lettres, syllabes ou mots.

**Verdict.** Le palindrome de lettres est une composition. Le palindrome de mots, lui, se construit en écrivant le texte suivi de son miroir : il faut déplacer et dupliquer des mots (E3). Évolutions : E3.

### Perverbe

**Règle.** On soude le début d'un proverbe à la fin d'un autre.

**Verdict.** Il faut reconnaître les proverbes du texte (E5) et remplacer une moitié par une moitié d'une autre longueur (E3). Évolutions : E5, E3.

### Poème monorime

**Règle.** Tous les vers finissent sur la même rime.

**Verdict.** Sur un texte en vers, le filtre remplace chaque mot de fin de vers par un mot de même nature qui porte la rime choisie. Il faut un dictionnaire de rimes (E2). Évolutions : E2.

### Rime berrychonne

**Règle.** Le 3e vers finit sur un son fait de la consonne d'un des deux vers précédents et de la voyelle de l'autre.

**Verdict.** Le filtre peut remplacer la fin du 3e vers par un mot qui porte ce son, s'il sait phonétiser et chercher par son (E2). Évolutions : E2.

### Rime bisexuelle

**Règle.** Trois vers qui riment, deux d'un genre de rime et un de l'autre.

**Verdict.** Même mécanisme que la rime berrychonne (E2). Évolutions : E2.

### Sonnet monorime

**Règle.** Page d'exemple du sonnet monorime.

**Verdict.** Voir la fiche suivante. Évolutions : E2.

### Sonnet monorime (définition)

**Règle.** Un sonnet dont tous les vers finissent sur la même rime, en respectant l'alternance des rimes masculines et féminines.

**Verdict.** Comme le poème monorime, avec le genre de rime en plus : E2. Évolutions : E2.

### Système jiǎnpǔ

**Règle.** La fiche esquisse une correspondance entre les sons vocaliques et les douze notes de la gamme ; la règle est dans un PDF.

**Verdict.** Classement provisoire : la fiche est vague. Si la règle est de traduire un texte en mélodie, il faut les sons vocaliques (E2), et la sortie n'est plus un texte. Évolutions : E2.

### Tautogramme progressif

**Règle.** Les initiales suivent en boucle une liste de lettres choisie.

**Verdict.** Même mécanisme que le tautogramme, mais la liste de lettres demande un paramètre texte (E1). Évolutions : E1.

### Traduction antonymique

**Règle.** Chaque nom, verbe, adjectif et adverbe devient un de ses antonymes.

**Verdict.** Remplacement mot par mot, compatible avec le contrat. Il manque un dictionnaire d'antonymes (E5) et les verbes (E6). Évolutions : E5, E6.

### Traduction homophonique

**Règle.** Rendre un texte d'une autre langue par un texte français qui sonne pareil.

**Verdict.** Il faut la phonétique de deux langues (E2) et un lexique étranger (E5) ; le redécoupage en mots français relève de E7. Le texte d'entrée n'est plus en français, ce que les étiqueteurs ne savent pas lire. Évolutions : E2, E5.

### Transduction

**Règle.** Substituer aux noms d'un texte ceux d'un autre domaine ; en variante, un S+n restreint à un domaine.

**Verdict.** C'est un S+n dont le dictionnaire est un lexique thématique : le port de morphologie est déjà « la textbank de la contrainte », il faut des lexiques de domaine (E5). Évolutions : E5.

### V+7

**Règle.** Le S+7 appliqué aux verbes.

**Verdict.** Le moteur du S+7 s'appliquerait tel quel, mais la morphologie n'expose pas de verbes : il faut leurs formes conjuguées (E6). Le lexique Grammalecte les contient ; c'est l'évolution la moins chère du catalogue. Évolutions : E6.


## C. Hors du modèle filtre (91)

### 99 notes préparatoires

**Règle.** Épuiser un sujet en 99 phrases numérotées, puis les ordonner.

**Verdict.** La fiche dit elle-même que ce n'est pas une contrainte au sens strict. C'est un projet d'écriture ; aucune évolution n'en fait un filtre.

### À deux voies

**Règle.** Le poème se dédouble en deux itinéraires parallèles, lus à deux voix, puis se referme.

**Verdict.** Il faut deux sorties simultanées et une mise en page ; un filtre ne rend qu'un texte.

### À supposer…

**Règle.** Un texte d'une seule phrase très longue, qui s'ouvre sur une formule imposée (« à supposer qu'on me demande ici de… »).

**Verdict.** La part mécanique (préfixer la formule, remplacer les points par des virgules) se ferait en touchant aux blancs, mais elle ne produit pas la contrainte, qui est un défi d'écriture.

### Acronyme

**Règle.** Lire un mot comme un sigle et lui inventer des développements variés.

**Verdict.** La contrainte produit plusieurs textes à partir d'un mot ; il n'y a pas de texte à transformer. Évolutions : E1, E7.

### Alexandrin jouetien

**Règle.** Typologie des alexandrins selon la place de leurs e muets comptés (64 types).

**Verdict.** C'est une classification de vers à écrire. Avec la phonétique (E2), Oulipao pourrait dire de quel type est chaque vers (E8), sans le produire. Évolutions : E2, E8.

### Alexandrin oral

**Règle.** Vers de douze syllabes comptées selon la prononciation orale.

**Verdict.** Composition ; au mieux un contrôle du compte syllabique (E2, E8). Évolutions : E2, E8.

### Alphabétique (portrait)

**Règle.** Une liste alphabétique de mots qui dresse le portrait de quelqu'un.

**Verdict.** Le choix des mots est un jugement ; trier les mots d'un texte ne fait pas un portrait.

### Arbre à théâtre

**Règle.** Renvoie à la littérature en graphe.

**Verdict.** Structure de lecture non linéaire : voir Graphe.

### Arbres et arborescence

**Règle.** Renvoie à la littérature en graphe.

**Verdict.** Voir Graphe.

### Avalanche

**Règle.** Une boule de neige de longueur 1, puis 2, … jusqu'à n.

**Verdict.** Composition à longueurs imposées ; rien à transformer.

### Avion

**Règle.** Abréger un mot ou un nom pour en faire un autre (Queneau → Rameau).

**Verdict.** La fiche est vague sur la règle ; les exemples relèvent du jeu sur les noms propres, que les étiqueteurs rangent dans `other`.

### Bibliothèques virtuelles

**Règle.** Rassembler des titres de livres qui satisfont une contrainte.

**Verdict.** Constitution d'une collection, pas transformation d'un texte.

### Boule de neige

**Règle.** Le vers n compte n lettres (ou n mots, n syllabes).

**Verdict.** Composition. On pourrait retirer des mots pour approcher une boule de neige de mots, mais le résultat n'aurait pas de sens.

### Bris de mots

**Règle.** Renvoie à Oblique.

**Verdict.** Voir Oblique.

### Chicago

**Règle.** Quatre énoncés de même syntaxe forment une devinette dont la solution est une homophonie.

**Verdict.** Écriture de devinettes : jugement et invention.

### Chronopoème

**Règle.** Un poème dont la lecture à voix haute dure exactement le temps programmé sur un minuteur.

**Verdict.** Contrainte de performance orale.

### Citations

**Règle.** Pour chaque mot d'une liste, trouver le plus de vers possibles qui le contiennent.

**Verdict.** Recherche documentaire dans un corpus poétique, pas transformation.

### CMMP

**Règle.** Cent mille milliards de poèmes : dix sonnets dont on combine librement les vers de même rang.

**Verdict.** La contrainte produit des milliards de textes à partir de dix ; un filtre en rend un à partir d'un.

### Conte à votre façon

**Règle.** Un conte à embranchements où le lecteur choisit sa route.

**Verdict.** Structure de lecture, pas transformation.

### Contrainte de Lloyd

**Règle.** Renvoie à SOLVA.

**Verdict.** Voir SOLVA.

### Contrainte de Pascal

**Règle.** Les relations entre les personnages suivent les incidences d'une figure tirée du théorème de Pascal.

**Verdict.** Contrainte de construction narrative.

### Contrainte de Turing

**Règle.** Aucune marque linguistique ne doit permettre d'assigner un sexe au narrateur ou aux personnages.

**Verdict.** La réécriture demande de reformuler des phrases. En revanche, repérer les accords genrés est faisable, puisque la morphologie connaît le genre des adjectifs et des participes : un contrôle (E8) servirait l'auteur. Évolutions : E8.

### Cornichon

**Règle.** Composer avec des mots coupables en deux moitiés liées par le sens (corps + nichon).

**Verdict.** Choix sémantique et composition.

### Critique constructive

**Règle.** Un auteur critique un livre qui n'existe pas, un autre en écrit un extrait.

**Verdict.** Écriture à plusieurs.

### Cylindre

**Règle.** Un texte dont la fin se raccorde au début, à l'échelle de la lettre, du mot ou de la phrase.

**Verdict.** Composition.

### Désarguesienne

**Règle.** Dix mots, dix lettres, chaque lettre dans exactement trois mots et chaque mot en contenant trois.

**Verdict.** Composition sous contrainte combinatoire ; au plus un contrôle.

### Deunglitsch

**Règle.** Renvoie à l'égal franglais.

**Verdict.** Voir L'égal franglais.

### Échelle

**Règle.** Une suite de mots qui ne diffèrent que d'une lettre, d'un mot à son contraire.

**Verdict.** Génération d'une suite de mots. Un index (E7) trouverait des échelles, mais ce serait un générateur, pas un filtre. Évolutions : E7.

### Eodermdrome

**Règle.** Une suite de onze lettres qui parcourt tous les côtés et diagonales d'un pentagone.

**Verdict.** Composition combinatoire.

### Exercice de style

**Règle.** Raconter la même histoire banale selon une consigne tirée d'un chapeau.

**Verdict.** C'est une méta-contrainte. Chaque réglage d'une chaîne de filtres est déjà un « exercice de style » automatique, mais la plupart des styles de Queneau (théâtre, alexandrins…) demandent un auteur.

### Explorations à la limite

**Règle.** Propositions de Le Lionnais aux bords de la littérature : réduction à une lettre, bord de poème, sonnet de mots-outils…

**Verdict.** C'est un regroupement ; ses éléments sont classés à leur fiche (Bord de poème, La rien que la toute la).

### Filigrane

**Règle.** Choisir des locutions qui contiennent un mot, l'en effacer, faire un poème des restes.

**Verdict.** La sélection de locutions demanderait un recueil (E5) ; la composition reste à l'auteur. Évolutions : E5.

### Formes fixes

**Règle.** Toutes les formes fixes classiques.

**Verdict.** Composition prosodique.

### Graphe

**Règle.** Le texte suit un graphe mathématique ; le lecteur choisit son chemin.

**Verdict.** Structure de lecture, pas transformation.

### Haïku argentin

**Règle.** Trois vers de 5, 7 et 5 mots contenant chacun une syllabe d'un mot banni.

**Verdict.** Composition.

### Hétérogrammes

**Règle.** Renvoie à Ulcérations.

**Verdict.** Voir Ulcérations.

### Hyper-roman

**Règle.** Une machine à multiplier les récits, parfois écrite à plusieurs.

**Verdict.** Construction d'œuvre.

### Hypertropes

**Règle.** Le contenu du poème de rang n dépend des poèmes dont les rangs forment sa décomposition de Zeckendorf.

**Verdict.** Construction d'une suite de poèmes.

### Index

**Règle.** Prélever dans l'index d'un recueil des incipits et les enchaîner.

**Verdict.** Collage à partir d'un corpus.

### L'égal franglais

**Règle.** Un texte qui se lit en français et en anglais, avec un sens différent.

**Verdict.** Composition bilingue. Avec un lexique anglais (E5), Oulipao pourrait contrôler qu'un mot existe dans les deux langues (E8). Évolutions : E5, E8.

### Leiris

**Règle.** Définitions en glossaire qui jouent sur les lettres ou les sonorités du mot (« Glossaire j'y serre mes gloses »).

**Verdict.** Invention de définitions.

### Logo-rallye

**Règle.** Renvoie à Parcours obligé.

**Verdict.** Voir Parcours obligé. Évolutions : E1, E8.

### LSD

**Règle.** Variante de la littérature définitionnelle où l'on choisit ou fabrique des définitions surprenantes.

**Verdict.** Le choix « inattendu » est un jugement. Avec un dictionnaire (E5), le filtre pourrait choisir une définition au hasard, mais ce serait la littérature définitionnelle. Évolutions : E5.

### Minisextine

**Règle.** Le principe de la sextine appliqué aux syllabes ou phonèmes d'un mot choisi.

**Verdict.** Composition combinatoire.

### Monkine

**Règle.** Le carré de permutation d'une quenine fixe le nombre de lettres de chaque mot.

**Verdict.** Composition.

### Monostique paysager

**Règle.** Un seul long vers panoramique, lu en balayant l'auditoire du regard.

**Verdict.** Composition et performance.

### Morale double

**Règle.** Une morale élémentaire à deux faces, lisible en entrelacement.

**Verdict.** Composition et disposition.

### Morale élémentaire

**Règle.** Dix groupes nom + adjectif, un interlude de sept vers courts, une conclusion de quatre groupes.

**Verdict.** Composition. On pourrait extraire d'un texte ses groupes nom + adjectif, mais il faudrait réorganiser le texte (E3), et l'interlude reste à écrire. Évolutions : E3.

### N-ine

**Règle.** n strophes de n vers dont les mots-rimes tournent selon la permutation de la sextine.

**Verdict.** Composition. La permutation des mots de fin de vers d'un texte donné est faisable (un mot remplacé par un autre mot du texte), mais sans les n strophes ce n'est pas la forme.

### Nonine

**Règle.** Variante de la quenine où la permutation revient à l'ordre initial plus tôt.

**Verdict.** Composition, comme la n-ine.

### Noninisation

**Règle.** Prendre un poème de n vers comme une strophe et écrire les autres strophes.

**Verdict.** Les strophes à écrire sont une composition. Dupliquer la strophe en permutant ses mots-rimes produirait un squelette (E3), pas la forme. Évolutions : E3.

### Oblique

**Règle.** Définir un mot en le reliant à d'autres qui l'englobent (vol + can = volcan).

**Verdict.** Invention de définitions ; E7 trouverait les mots englobants, à titre d'aide. Évolutions : E7.

### Onzain hétérogrammatique

**Règle.** Onze tranches de onze lettres, chacune anagramme du même ensemble.

**Verdict.** Composition.

### Ouliporime

**Règle.** Trois vers courts dont les fins reprennent les trois fragments d'un mot, plus un support commun.

**Verdict.** Composition.

### Parcours obligé

**Règle.** Un texte où une série de mots imposés apparaît dans un ordre donné.

**Verdict.** Composition. Avec la liste de mots en paramètre (E1), Oulipao contrôlerait leur présence et leur ordre (E8). Évolutions : E1, E8.

### Petite boîte

**Règle.** Six vers de mètres fixés, le 4e est un mot dont la catégorie est absente des autres vers.

**Verdict.** Composition. La part liponymique des vers 1-3 et 5-6 est faisable (Liponymie), mais pas la forme.

### Petite morale élémentaire portative

**Règle.** Une morale élémentaire réduite : groupes nom + adjectif et mots isolés.

**Verdict.** Composition.

### Poème de métro

**Règle.** Un vers composé entre deux stations, écrit à l'arrêt.

**Verdict.** Contrainte de situation d'écriture.

### Poème fondu

**Règle.** Tirer d'un poème un poème plus court, avec ses seuls mots.

**Verdict.** La sélection et le réordonnancement sont un jugement. Un tirage au hasard sous un compte de syllabes (E2) ne ferait pas un poème. Évolutions : E2.

### Poème pour bègue

**Règle.** Dans chaque vers, chaque syllabe paire est identique à celle qui la précède.

**Verdict.** Composition sonore.

### Porche

**Règle.** Une phrase où un mot et son homophone de l'autre genre restent tous deux possibles à l'oreille.

**Verdict.** Invention syntaxique ; jugement.

### Portrait en creux

**Règle.** Les blancs d'une page en police fixe dessinent le visage de la personne décrite.

**Verdict.** Contrainte visuelle.

### Portrait géographique

**Règle.** Un itinéraire réel qui dresse le portrait physique de quelqu'un.

**Verdict.** Contrainte visuelle et documentaire.

### Quatroum

**Règle.** Le début du vers suit le pantoum, le mot-rime suit la quatrine.

**Verdict.** Composition.

### Quenine

**Règle.** Généralisation de la sextine (voir N-ine).

**Verdict.** Voir N-ine.

### Quenine à démarreur

**Règle.** Comme la quenine, mais ce sont les débuts de vers qui tournent.

**Verdict.** Composition.

### Queninisation

**Règle.** Tenir un texte pour une strophe et écrire les autres strophes d'une quenine.

**Verdict.** Voir Noninisation. Évolutions : E3.

### Quenoum

**Règle.** Les mots-rimes tournent comme dans la quenine, les vers se répètent comme dans le pantoum.

**Verdict.** Composition.

### Récapitul

**Règle.** Six strophes de six vers longs ; entre deux, un vers liste un mot pris à chaque vers précédent.

**Verdict.** Les strophes sont à écrire. Insérer les vers-listes dans un texte existant demanderait E3, mais le choix des mots reste à l'auteur. Évolutions : E3.

### Redonde

**Règle.** Trois strophes de cinq vers dont les mots terminaux suivent un schéma fixe.

**Verdict.** Composition.

### Rondel

**Règle.** Treize octosyllabes sur deux rimes, avec des vers qui reviennent en refrain.

**Verdict.** Composition. Forcer la forme sur un texte demanderait les rimes (E2) et la duplication des vers de refrain (E3), avec un résultat discutable. Évolutions : E2, E3.

### SOLVA

**Règle.** On ajoute un alexandrin au milieu d'un sonnet pour en faire une ode de quinze vers.

**Verdict.** Le vers ajouté est à écrire.

### Sonnet à la limite

**Règle.** Un sonnet de mots-outils et un sonnet de treize vers.

**Verdict.** Le sonnet de mots-outils est classé à « La rien que la toute la » (A) ; l'autre est une composition.

### Sonnet alexandriniste

**Règle.** Un sonnet dont les vers s'égarent en longueur avant de revenir à l'alexandrin.

**Verdict.** La fiche décrit des modèles plus qu'une règle ; composition.

### Sonnet dessiné

**Règle.** Les cases de fin de ligne riment en images.

**Verdict.** Contrainte visuelle.

### Sonnet enjambeur

**Règle.** Un sonnet circulaire où chaque vers enjambe sur le suivant.

**Verdict.** Composition.

### Sonnet irrationnel

**Règle.** Quatorze vers en cinq strophes selon les décimales de pi, sur quatre rimes, avec un vers-refrain.

**Verdict.** Composition. Couper un texte en 3-1-4-1-5 vers est faisable, mais les rimes (E2) et le refrain (E3) ne le sont pas. Évolutions : E2, E3.

### Sonnet mince

**Règle.** Un sonnet aux vers les plus courts possibles, où l'ordre des rimes devient un ordre de mots-clés.

**Verdict.** Composition.

### Surdéfinitions

**Règle.** Définir un mot deux fois : par son sens et par sa présence dans un autre mot.

**Verdict.** Invention de définitions ; E7 en aide. Évolutions : E7.

### Terine

**Règle.** Trois strophes de trois vers, trois mots-rimes qui tournent.

**Verdict.** Composition, comme la n-ine.

### Terine à triolet

**Règle.** Au lieu de répéter un mot-rime, on emploie trois mots liés (rouge, blanc, rosé).

**Verdict.** Composition. Évolutions : E5.

### Terine homophonique

**Règle.** La terine joue sur trois homophones au lieu de trois mots-clés.

**Verdict.** Composition. Évolutions : E2.

### Textes à démarreur

**Règle.** Une longue liste de phrases qui commencent toutes par la même formule (« Je me souviens »).

**Verdict.** Les phrases sont à écrire. Préfixer chaque ligne d'un texte par une formule (E1) serait faisable, mais ce n'est pas la contrainte. Évolutions : E1.

### Théâtre booléen

**Règle.** Des pièces qui se croisent par intersection, réunion, complémentaire.

**Verdict.** Construction dramatique.

### Tireur à la ligne

**Règle.** Entre une phrase de départ et une d'arrivée, insérer des phrases intermédiaires, encore et encore.

**Verdict.** Écriture d'ajouts.

### Ulcérations

**Règle.** Chaque vers est une anagramme du mot « ulcérations ».

**Verdict.** Composition.

### Un hôte de marque

**Règle.** Une critique et un extrait de bande dessinée d'un livre imaginaire.

**Verdict.** Voir Critique constructive.

### Villanelle

**Règle.** Cinq tercets et un quatrain sur deux rimes, deux vers qui reviennent en refrain.

**Verdict.** Composition, comme le rondel. Évolutions : E2, E3.

### Vocabulaires raisonnés

**Règle.** Ordonner les mots selon des propriétés inventées (les lettres de vent N, E, O, S donnent la « force » d'un mot).

**Verdict.** Lexicographie, pas transformation. Annoter chaque mot de sa « force » serait un contrôle (E8).

### X prend Y pour Z

**Règle.** Une relation à trois personnages est traitée comme un produit dont on se donne la table.

**Verdict.** Construction narrative.

### Zeugme dessiné

**Règle.** Décliner des zeugmes en images.

**Verdict.** Contrainte visuelle.


## —. Non classée (1)

Fiches dont la règle n'est pas lisible sur la page. Elles ne sont pas classées plutôt que devinées.

### Aigre-doux

**Règle.** La fiche annonce une forme fixe de Jacques Jouet sans la décrire ; la règle est dans une pièce jointe.

**Verdict.** Non classée : on ne peut pas juger une règle qu'on n'a pas lue. À reprendre avec le document.


## Évolutions qui débloquent le plus

Classées par nombre de contraintes **B** qu'elles débloquent. Une contrainte qui demande deux évolutions apparaît sous les deux. Pour la débloquer, il faut les deux. Les contraintes C où l'évolution n'apporte qu'un contrôle ou une aide sont listées à part.

### 1. E2 — Textbank phonétique (17 B, 7 autres)

Un port `Phonetics` : phonèmes, syllabes, e muets comptés, rime d'un mot, et recherche dans le lexique des mots qui riment ou qui sonnent pareil. Il faut un adaptateur de phonétisation, par exemple à partir du lexique Grammalecte ou de Lexique.org.

Débloque : [Alva](https://oulipo.net/contraintes/alva), [Anaérobie](https://oulipo.net/contraintes/anaerobie), [Antérime](https://oulipo.net/contraintes/anterime), [Antirime](https://oulipo.net/contraintes/antirime), [Aphorime](https://oulipo.net/contraintes/aphorime), [Étreinte](https://oulipo.net/contraintes/etreinte), [Facteur commun (mise en)](https://oulipo.net/contraintes/facteur-commun-mise-en), [Homomorphisme](https://oulipo.net/contraintes/homomorphisme), [Homophonies](https://oulipo.net/contraintes/homophonies), [Locurime](https://oulipo.net/contraintes/locurime), [Poème monorime](https://oulipo.net/contraintes/poeme-monorime), [Rime berrychonne](https://oulipo.net/contraintes/rime-berrychonne), [Rime bisexuelle](https://oulipo.net/contraintes/rime-bisexuelle), [Sonnet monorime](https://oulipo.net/contraintes/sonnet-monorime), [Sonnet monorime (définition)](https://oulipo.net/contraintes/sonnet-monorime-0), [Système jiǎnpǔ](https://oulipo.net/contraintes/systeme-jianpu), [Traduction homophonique](https://oulipo.net/contraintes/traduction-homophonique).

Améliore ou outille aussi : [Alexandrin jouetien](https://oulipo.net/contraintes/alexandrin-jouetien) (C), [Alexandrin oral](https://oulipo.net/contraintes/alexandrin-oral) (C), [Poème fondu](https://oulipo.net/contraintes/poeme-fondu) (C), [Rondel](https://oulipo.net/contraintes/rondel) (C), [Sonnet irrationnel](https://oulipo.net/contraintes/sonnet-irrationnel) (C), [Terine homophonique](https://oulipo.net/contraintes/terine-homophonique) (C), [Villanelle](https://oulipo.net/contraintes/villanelle) (C).

### 2. E5 — Textbanks sémantiques (9 B, 5 autres)

Des dictionnaires aujourd'hui absents de `src/adapters` : définitions, antonymes, lexiques thématiques (cuisine, politique…), locutions et proverbes, lexique d'une autre langue. Chacune est un port de plus et un adaptateur qui valide ses entrées.

Débloque : [Aphorime](https://oulipo.net/contraintes/aphorime), [Immorale élémentaire](https://oulipo.net/contraintes/immorale-elementaire), [Littérature définitionnelle](https://oulipo.net/contraintes/litterature-definitionnelle), [Locurime](https://oulipo.net/contraintes/locurime), [Locutions introuvables](https://oulipo.net/contraintes/locutions-introuvables), [Perverbe](https://oulipo.net/contraintes/perverbe), [Traduction antonymique](https://oulipo.net/contraintes/traduction-antonymique), [Traduction homophonique](https://oulipo.net/contraintes/traduction-homophonique), [Transduction](https://oulipo.net/contraintes/transduction).

Améliore ou outille aussi : [Aphorisme](https://oulipo.net/contraintes/aphorisme) (A), [Filigrane](https://oulipo.net/contraintes/filigrane) (C), [L'égal franglais](https://oulipo.net/contraintes/legal-franglais) (C), [LSD](https://oulipo.net/contraintes/lsd) (C), [Terine à triolet](https://oulipo.net/contraintes/terine-a-triolet) (C).

### 3. E3 — Sortie libre et structure en vers (7 B, 7 autres)

Le contrat rend un mot de sortie par mot d'origine : on peut remplacer, retirer, changer les blancs, mais pas déplacer un mot, dupliquer un vers ni insérer du texte qui ne soit pas rattaché à un mot. Il faudrait deux choses. D'abord, une notion explicite de vers et de strophe dans le texte étiqueté. Ensuite, une sortie d'un autre genre, une suite de segments qui pointent vers leurs mots d'origine, pour garder l'alignement de la partition.

Débloque : [Algorithme de Mathews](https://oulipo.net/contraintes/algorithme-de-mathews), [Bord de poème](https://oulipo.net/contraintes/bord-de-poeme), [Caradec](https://oulipo.net/contraintes/caradec), [Facteur commun (mise en)](https://oulipo.net/contraintes/facteur-commun-mise-en), [Locutions introuvables](https://oulipo.net/contraintes/locutions-introuvables), [Palindrome](https://oulipo.net/contraintes/palindrome), [Perverbe](https://oulipo.net/contraintes/perverbe).

Améliore ou outille aussi : [Morale élémentaire](https://oulipo.net/contraintes/morale-elementaire) (C), [Noninisation](https://oulipo.net/contraintes/noninisation) (C), [Queninisation](https://oulipo.net/contraintes/queninisation) (C), [Récapitul](https://oulipo.net/contraintes/recapitul) (C), [Rondel](https://oulipo.net/contraintes/rondel) (C), [Sonnet irrationnel](https://oulipo.net/contraintes/sonnet-irrationnel) (C), [Villanelle](https://oulipo.net/contraintes/villanelle) (C).

### 4. E1 — Paramètre texte libre (7 B, 4 autres)

Un troisième type de paramètre, `text` (un mot, un nom, une liste de lettres ou de mots), validé par zod. Aujourd'hui, seuls existent l'entier borné et le choix dans une liste fermée.

Débloque : [Acrostiche brivadois](https://oulipo.net/contraintes/acrostiche-brivadois), [Beau présent](https://oulipo.net/contraintes/beau-present), [Belle absente](https://oulipo.net/contraintes/belle-absente), [Contrainte du prisonnier](https://oulipo.net/contraintes/contrainte-du-prisonnier), [Épithalame oulipien](https://oulipo.net/contraintes/epithalame-oulipien), [Monoconsonnantisme](https://oulipo.net/contraintes/monoconsonnantisme), [Tautogramme progressif](https://oulipo.net/contraintes/tautogramme-progressif).

Améliore ou outille aussi : [Acronyme](https://oulipo.net/contraintes/acronyme) (C), [Logo-rallye](https://oulipo.net/contraintes/logo-rallye) (C), [Parcours obligé](https://oulipo.net/contraintes/parcours-oblige-ou-logo-rallye) (C), [Textes à démarreur](https://oulipo.net/contraintes/textes-a-demarreur) (C).

### 5. E7 — Index lexical par lettres (4 B, 8 autres)

Un index du lexique par lettres et par motifs : anagrammes, mots contenus dans un autre mot, mots qui diffèrent d'une lettre, squelette de voyelles. On peut le construire aujourd'hui en parcourant `nounLemmas` puis `nounForms`, mais c'est coûteux ; un port dédié rendrait ces recherches rapides et testables.

Débloque : [Algorithme de Mathews](https://oulipo.net/contraintes/algorithme-de-mathews), [Anaérobie](https://oulipo.net/contraintes/anaerobie), [Homophonies](https://oulipo.net/contraintes/homophonies), [Monoconsonnantisme](https://oulipo.net/contraintes/monoconsonnantisme).

Améliore ou outille aussi : [Acronyme](https://oulipo.net/contraintes/acronyme) (C), [Anagramme](https://oulipo.net/contraintes/anagramme) (A), [Contrainte de Delmas](https://oulipo.net/contraintes/contrainte-de-delmas) (A), [Échelle](https://oulipo.net/contraintes/echelle) (C), [Homovocalisme](https://oulipo.net/contraintes/homovocalisme) (A), [Lipossible](https://oulipo.net/contraintes/lipossible) (A), [Oblique](https://oulipo.net/contraintes/oblique) (C), [Surdéfinitions](https://oulipo.net/contraintes/surdefinitions) (C).

### 6. E6 — Verbes dans la morphologie (4 B, 6 autres)

`MorphologyRepository` n'expose que les noms, les adjectifs et les adverbes ; le lexique Grammalecte est filtré à ces trois natures. Exposer les verbes et leurs formes conjuguées (mode, temps, personne) ouvre la piste `verb`, que le lipogramme laisse aujourd'hui intacte.

Débloque : [Chimère](https://oulipo.net/contraintes/chimere), [Homomorphisme](https://oulipo.net/contraintes/homomorphisme), [Traduction antonymique](https://oulipo.net/contraintes/traduction-antonymique), [V+7](https://oulipo.net/contraintes/v7).

Améliore ou outille aussi : [Abécédaire](https://oulipo.net/contraintes/abecedaire) (A), [Acrostiche universel](https://oulipo.net/contraintes/acrostiche-universel) (A), [Aphorisme](https://oulipo.net/contraintes/aphorisme) (A), [Homosyntaxisme](https://oulipo.net/contraintes/homosyntaxisme) (A), [Lipogramme](https://oulipo.net/contraintes/lipogramme) (A), [Tautogramme](https://oulipo.net/contraintes/tautogramme) (A).

### 7. E8 — Mode contrôle (1 B, 6 autres)

Pour les contraintes d'écriture (composer un texte, pas en transformer un), Oulipao peut au moins dire où un texte écrit à la main enfreint la règle. Le contrat le permet déjà : une marque avec une `reason`, sans remplacement. C'est l'hôte qui manque : il faudrait un filtre « vérificateur » affiché comme tel, qui ne touche pas au texte.

Débloque : [Belle absente](https://oulipo.net/contraintes/belle-absente).

Améliore ou outille aussi : [Alexandrin jouetien](https://oulipo.net/contraintes/alexandrin-jouetien) (C), [Alexandrin oral](https://oulipo.net/contraintes/alexandrin-oral) (C), [Contrainte de Turing](https://oulipo.net/contraintes/contrainte-de-turing) (C), [L'égal franglais](https://oulipo.net/contraintes/legal-franglais) (C), [Logo-rallye](https://oulipo.net/contraintes/logo-rallye) (C), [Parcours obligé](https://oulipo.net/contraintes/parcours-oblige-ou-logo-rallye) (C).

### 8. E4 — Second texte source (1 B, 0 autres)

Un filtre qui reçoit un texte de plus que le texte traité (texte-cible, recueil de proverbes de l'utilisateur). Il faut un nouveau champ dans `PluginResources` ou un paramètre de type texte long.

Débloque : [Chimère](https://oulipo.net/contraintes/chimere).

## Ce qu'on en retient

- **Le niveau A est déjà riche.** Vingt-cinq fiches, dont le S+7 et le lipogramme déjà faits, tiennent dans le contrat actuel. Ils forment trois familles :
  - **remplacement par voisin** : abécédaire, tautogramme, acrostiche universel, Delmas, lipossible, homovocalisme ;
  - **retrait** : liponymie, la rien que la toute la, inventaire, haï-kaïsation, intérieur de poème ;
  - **permutation et remise en vers** : poème carré, poème de bandit, juliennes, S+dé.
- **Les deux évolutions les plus rentables sont lexicales.** La phonétique (E2) ouvre toute la famille des rimes et des homophonies. Les verbes (E6) coûtent peu, puisque le lexique Grammalecte les contient déjà, et ils relèvent le rendement de presque tous les filtres A ; ils débloquent aussi le V+7.
- **E3 est la seule évolution qui touche à l'architecture.** Elle sort de l'alignement mot à mot, sur lequel reposent la partition et la chaîne (`runChain`, `fold`). Elle mérite sa propre réflexion avant d'être engagée.
- **Près de six contraintes sur dix sont en C.** C'est attendu : l'Oulipo invente surtout des contraintes d'*écriture*. Le mode contrôle (E8) est le moyen le moins cher de servir ces auteurs sans écrire à leur place, ce qui est conforme à l'anti-persona du wiki.

## Ambiguïtés signalées

- **Aigre-doux** : la règle n'est que dans une pièce jointe ; non classée.
- **Aphorime** : fiche vide ; classée d'après la définition donnée dans la fiche Locurime.
- **Système jiǎnpǔ** : la règle est dans un PDF ; classement provisoire.
- **Homovocalisme** : la fiche ne dit pas si les voyelles sont graphiques ou sonores ; la version graphique est classée A.
- **Avion** : règle vague ; classée d'après les exemples.
- **Doublons du site** : « Sonnet monorime » a deux fiches, « Carré lescurien » renvoie à « Poème carré », « Logo-rallye » à « Parcours obligé ». Chaque fiche est comptée une fois.

---

153 fiches traitées : 25 en A, 36 en B, 91 en C, 1 non classée. Page source consultée le 2026-10-03 : <https://oulipo.net/contraintes>.
