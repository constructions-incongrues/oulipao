---
type: overview
section: define
generated: 2026-10-04
sources: [vision-mission.md, business-model.md, org.md, product.md, personas.md]
---
# PM Context Brief
Generated 2026-10-04 · Project: oulipao · Sources: vision-mission.md, business-model.md, org.md, product.md, personas.md

## What we do
Oulipao (« Ouvroir de Littérature Potentielle Assistée par Ordinateur ») est un instrument pour jouer de la littérature potentielle, pensé comme un logiciel de MAO : « comme Ableton, sauf que les pistes sont linguistiques ». On colle un texte français ; il est étiqueté une fois dans le navigateur (CamemBERT) et rangé en cinq pistes (noms, verbes, adjectifs, adverbes, autres). On branche une chaîne de contraintes oulipiennes (15 moteurs, 15 recettes) et on la règle en direct (modulateur, porte, verrous, grille de pas, Muet / Seul, écoute vocale) ; chaque geste rejoue la chaîne et réécrit le résultat. On garde les prises au carnet (dans le navigateur), on itère ou fige, on copie, on partage par lien. Gratuit, sans compte, sans serveur, chaque règle lisible et rejouable (le hasard s'écrit avec sa graine). En ligne sur oulipao.incongru.org, version 0.6.2. Pari du 4 octobre : le plaisir vient de jouer de l'instrument et de le construire ; les textes sont un sous-produit.
_More detail: `.nanopm/wiki/docs/product.md`_

## Who it's for
Persona principal : le fondateur, Tristan, développeur et lecteur des oulipiens. Son job : jouer de l'instrument et le construire (brancher, régler, moduler, enchaîner des contraintes, garder ses prises, ajouter la contrainte qui manque dès qu'il l'imagine). Il le lâche si chaque séance commence par du code ou un correctif. Persona secondaire, borné au lien partagé et au futur mode puzzle : le proche non oulipien qui reçoit un lien et joue quelques minutes (deux personnes réelles, Proche A et Proche B) ; on ne construit pas le reste de l'instrument pour lui. Jade, la développeuse de plugins, est retirée. Anti-persona : celui qui veut qu'une IA écrive à sa place. L'outil à résultat (« rendre ce texte joyeux ») est un usage qu'on ne casse pas mais qu'on ne met pas en avant.
_More detail: `.nanopm/wiki/docs/personas.md`_

## How we make money
Pas du tout : projet libre, gratuit et bénévole, dont le fondateur paie les coûts. Un seul niveau à 0 €, sans compte. Ni abonnement, ni dons, ni subvention. Diffusion espérée par les textes produits qui circulent, sans promotion ; canal non prouvé. Seul coût attendu : l'hébergement, non chiffré, d'où la règle de conception : tout dans le navigateur, aucun texte stocké côté serveur (assumed, inférée du coût nul par utilisateur).
_More detail: `.nanopm/wiki/docs/business-model.md`_

## Why we exist
Mission : Oulipao est l'instrument de son fondateur pour jouer de la littérature potentielle ; le code est ouvert pour que d'autres s'en servent en passant. Vision à 3-5 ans, horizon et non cible : un écosystème ouvert où la communauté publie plugins et textbanks, et où la majorité de ce qui sert n'a pas été écrit par l'équipe d'origine ; elle redevient cible le jour où quelqu'un d'autre écrit un plugin. Valeurs : la contrainte est explicite (la matière lettriste et le hasard entrent s'ils sont rejouables), ouvert et bidouillable, le texte reste à l'auteur. Stade : prototype à usage personnel, mis en ligne.
_More detail: `.nanopm/wiki/docs/vision-mission.md`_

## Who decides
Tristan, seul humain, décide de tout (direction produit, budget, mise en ligne) sans consulter personne. Des agents IA écrivent le code sous sa direction. Travail les soirs et week-ends, sans cadence, feuille de route NOW / NEXT / LATER sans dates. Aucune partie prenante externe à ménager (ni l'Oulipo, ni testeurs, ni ayants droit).
_More detail: `.nanopm/wiki/docs/org.md`_

## What's NOT known yet
- **Le pari du jeu n'a pas de preuve :** l'objectif est une prise par semaine hors débogage ; au 4 octobre, personne, fondateur compris, n'a de prise de jeu documentée, et la plupart des changements venaient d'audits et de correctifs.
- **Persona secondaire mince :** deux personnes, un échange chacune, aucune n'a ouvert l'outil d'elle-même ; le test du lien nu (7 personnes) rend son bilan le 20 octobre.
- **Risque principal :** le fondateur garde-t-il le temps et l'envie de porter seul le projet sans retours rapides ?
- **Dépendance d'étiquetage :** le modèle CamemBERT (141 Mo) est servi par des tiers, sans vérification d'intégrité ni licence déclarée ; hébergement et licence à trancher.
- **Coût d'hébergement :** non chiffré ; aucune donnée d'usage.
- **Questions produit ouvertes :** statut du lien partageable alors que le partage en un clic reste refusé hors puzzles ; « Copier » perd l'original ; le mode puzzle peut déplacer l'instrument vers le jeu à résoudre ; le format de plugin n'est pas publié, alors que la vision repose sur des plugins tiers.
- **Docs Define en retard :** `vision-mission.md` dit la page hors ligne alors qu'elle est en ligne (0.6.2), et sa « One Belief » (garder des textes) contredit le pari du 4 octobre ; `org.md` dit qu'il n'y a pas de dépôt git ; `business-model.md` date du 3 octobre et ignore le lien partageable comme canal.
- **Lacunes d'équipe :** aucune compétence linguistique dédiée ; l'outil repose sur des bibliothèques et données existantes (Grammalecte, GLÀFF, openlexicon).
