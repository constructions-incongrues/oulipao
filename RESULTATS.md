# Résultats de l'essai technique

Étiquetage grammatical du français dans le navigateur et lexique libre.
Mesures du 2026-10-03. Échéance de la décision : 18 octobre 2026.

Pour refaire les mesures : `npm run measure -- --errors`.

## Lexiques

Lexique retenu : **Grammalecte / Dicollecte v7.7**, licence MPL 2.0.

- Redistribution permise dans un dépôt public ; le fichier dérivé `data/lexique-oulipao.tsv`
  reste sous MPL 2.0 et porte sa notice. Le reste du dépôt peut avoir une autre licence.
- 115 184 formes de noms communs portant un genre, pour 54 233 lemmes distincts (seuil du
  PRD : 20 000).
- Genre et nombre présents sur chaque forme de nom.
- 476 104 formes au total, dont 51 957 admettent plusieurs des cinq catégories.
- Seul lexique examiné encore maintenu (décembre 2025).

Les cinq lexiques examinés sont tous redistribuables. Le détail, les licences exactes et les
sources sont dans `docs/lexiques.md`.

## Approches

Trois textes de référence de 200 mots (`reference/`). « Mots de contenu » : les mots qui ne
sont pas « autre » dans la référence ; ce score n'est pas gonflé par les mots-outils.

| Approche | Texte 1 | Texte 2 | Texte 3 | Ensemble | Mots de contenu (ensemble) |
|---|---|---|---|---|---|
| CamemBERT, modèle neuronal local | 195/200 (97,5 %) | 194/200 (97,0 %) | 190/200 (95,0 %) | 579/600 (96,5 %) | 327/342 (95,6 %) |
| Lexique, consultation seule | 181/200 (90,5 %) | 177/200 (88,5 %) | 174/200 (87,0 %) | 532/600 (88,7 %) | 279/342 (81,6 %) |
| fr-compromise, règles contextuelles | 150/200 (75,0 %) | 167/200 (83,5 %) | 169/200 (84,5 %) | 486/600 (81,0 %) | 279/342 (81,6 %) |

Seuil du PRD : au moins 9 mots sur 10 sur chacun des trois textes. Seul le modèle neuronal le
tient ; il le tient aussi sur les seuls mots de contenu (94,0 % au plus bas, texte 3).

Poids téléchargé par le navigateur :

| Approche | Poids | Détail |
|---|---|---|
| CamemBERT | environ 141 Mo au premier chargement | poids du modèle 111,3 Mo ; moteur WebAssembly 26,9 Mo (5,5 Mo transférés) ; découpeur 2,4 Mo ; bibliothèque 0,6 Mo. Mis en cache ensuite. |
| Lexique | 6,6 Mo (1,3 Mo compressé) | `data/lexique-oulipao.tsv` |
| fr-compromise | 0,27 Mo (0,10 Mo compressé) | `vendor/fr-compromise.mjs` |

Temps observé dans le navigateur sur le texte 3 (non optimisé, noté pour mémoire) : CamemBERT
20,5 s la première fois, téléchargement compris, puis 1,5 s ; lexique 0,2 s ; fr-compromise
0,01 s.

Le texte reste dans le navigateur : pendant l'étiquetage par les trois approches, toutes les
requêtes observées sont des téléchargements de fichiers statiques (scripts, lexique, modèle),
sans paramètre ni corps. Aucune ne contient le texte collé.

Erreurs du modèle neuronal (21 sur 600) :

- Participe passé employé comme adjectif, classé verbe : chauffé, devenu, déçu. Le modèle n'a
  pas d'étiquette distincte pour cet emploi ; c'est un écart de convention autant qu'une erreur.
- Verbe en tête de phrase ou à l'impératif, classé nom : méfie, Apporte, Réponds.
- Mots ambigus du texte 3 : « ferme » verbe classé adjectif, « ferme » adjectif classé nom,
  « l'est » classé nom propre. La ferme (nom), la porte, le livre, « elle livre », « est » et
  « été » sont bien classés.
- Divers : cher (adverbe) classé adjectif deux fois, pourquoi, puis, Personne, documentaire,
  autres, toute, Salut, désolé, jusqu', ta.

Limites des deux approches légères :

- Le lexique seul ne peut pas choisir entre nom, adjectif et verbe : presque toutes ses erreurs
  sont des adjectifs ou des verbes pris pour des noms (vieille, petit, laisse, ferme, livre).
- fr-compromise découpe le texte autrement et classe mal les mots-outils (que, si, où, ne) ; il
  classe « ferme » adverbe dans ses trois emplois.

## Ambiguïtés

D'après le lexique, 197 des 600 mots de référence (33 %) ont une forme qui admet plusieurs
catégories : 60 dans le texte 1, 62 dans le texte 2, 75 dans le texte 3.

Un mot sur trois est donc ambigu hors contexte. Le modèle neuronal en tranche correctement la
grande majorité, mais se trompe encore sur 21 mots sur 600. Cela pèse sur la décision
d'interface laissée ouverte par le PRD : si l'outil tranche toujours, environ 1 mot sur 30
ira dans la mauvaise piste ; le lexique permet de savoir lesquels sont à risque et de les
signaler.

## Réserves

- **Annotation de référence.** Les trois textes ont été écrits et annotés par l'assistant IA,
  avant tout essai d'étiqueteur, et non par le fondateur. Ils sont à relire
  (`reference/texte-N.annote.txt`, mode d'emploi dans `reference/FORMAT.md`). Tant que ce n'est
  pas fait, les scores reposent sur cette seule annotation. Le fondateur l'a acceptée telle
  quelle le 2026-10-03.
- **Textes.** Le texte 3 est volontairement chargé en mots ambigus. Aucun des trois n'est un
  texte qu'un lecteur aurait collé de lui-même.
- **Licence du modèle.** `Xenova/french-camembert-postag-model` ne déclare aucune licence, et
  son corpus d'entraînement est sous LGPL-LR. On peut le faire télécharger par le navigateur
  depuis Hugging Face ; le redistribuer dans le dépôt demande de clarifier ce point.
- **Dépendance à des tiers.** La bibliothèque et le modèle sont servis par jsDelivr et Hugging
  Face. Le texte n'y est pas envoyé, mais l'outil ne marche pas sans eux.
- **Poids.** 141 Mo au premier chargement est lourd pour « un jouet qu'on ouvre par curiosité ».
- **Seuil.** 9 sur 10 reste une proposition, pas une mesure de ce qu'un lecteur tolère.

## Décision

Validée par le fondateur le 2026-10-03, sur la proposition de l'assistant et en acceptant
l'annotation de référence telle quelle, sans relecture :

**On continue avec une réserve : l'étiquetage dans le navigateur tient le seuil (96,5 %) et un lexique libre existe (Grammalecte, MPL 2.0), mais seulement avec un modèle de 141 Mo dont la licence est à clarifier.**

---

# Moteur S+7

Mesures du 2026-10-03, décalage 7, sur les trois textes de référence, après extension de la table
des déterminants et du réaccord (décisions du fondateur du même jour). Pour les refaire :
`npm run transform:references` (écrit les grilles de relecture dans `resultats/s7/`).

## Ce que le moteur a fait

Avec les étiquettes de référence :

| Texte | Mode | Noms | Remplacés | Inconnus du dictionnaire | Sans forme au nombre voulu |
|---|---|---|---|---|---|
| 1 | même genre | 33 | 33 | 0 | 0 |
| 1 | réaccord | 33 | 32 | 0 | 1 |
| 2 | même genre | 41 | 38 | 0 | 3 |
| 2 | réaccord | 41 | 41 | 0 | 0 |
| 3 | même genre | 39 | 39 | 0 | 0 |
| 3 | réaccord | 39 | 39 | 0 | 0 |

De bout en bout, avec les étiquettes du modèle neuronal : même nombre de remplacements à un
près pour les textes 1 et 2 ; pour le texte 3, 40 remplacés et 5 mots pris à tort pour des
noms, que le dictionnaire ne connaît pas et que le moteur laisse donc intacts.

## Substitutions correctes

Critère du PRD : au moins 90 % de substitutions correctes sur chacun des trois textes, dans
chaque mode, à la lecture du fondateur. Une substitution est correcte si le groupe nominal
se lit sans faute.

| Texte | Mode | Substitutions correctes |
|---|---|---|
| 1 | même genre | 33 sur 33 |
| 1 | réaccord | 32 sur 32 |
| 2 | même genre | 37 sur 38 |
| 2 | réaccord | 40 sur 41 |
| 3 | même genre | 37 sur 39 |
| 3 | réaccord | 39 sur 39 |

Ces chiffres sont la lecture de l'assistant qui a écrit le moteur. Le fondateur les a validés
comme décompte le 2026-10-03, sans relire lui-même les grilles. Les deux modes sont au-dessus du
seuil de 90 % sur les trois textes : le pari du PRD (« des règles locales suffisent à réaccorder
un S+7 strict ») n'est pas réfuté.

Fautes relevées à cette lecture :

- **Bruit du dictionnaire** (4 cas) : « Les BiC₆H₅O₇ » (une formule chimique rangée parmi les
  noms), « le ln » et « un ln » (une abréviation), « des Tasmanie » (un nom propre). Le lexique
  compte 1 649 formes de noms contenant un chiffre. Le fondateur a décidé de ne pas filtrer le
  dictionnaire : ces cas resteront.

La faute de déterminant de la première mesure est corrigée : « Certaines choses » donne
maintenant « Certains chouans ».

## Au-delà du groupe nominal

Depuis l'extension, le mode « réaccord » accorde aussi, à la lecture des trois textes :

- l'attribut : « le maitre paraissait plus grand et curieusement plus froid », « le maitre sera
  muet », « le solarium est boueux » ;
- les adjectifs apposés ou coordonnés : « un lieutenant-colonel gratuit, chauffé et ouvert tard »,
  « Le garde-barrière, déçu, reprit… » ;
- le pronom de reprise quand son antécédent est sûr : « Mon tantra est triste, évidemment, il a
  été heureux ici », « Plusieurs maisons défendent ces déphasages, qu'elles jugent utiles ».

Restent fautifs, parce que le moteur ne peut pas en être sûr et les laisse :

- les pronoms dont l'antécédent est dans une autre phrase : « Elle livre encore ses offenses »
  (c'était la tante, devenue « mon tantra »), « quand elle retardait », « qu'elle se taisait »
  (c'était l'horloge, devenue « le vieil horodatage ») ;
- le pronom à deux antécédents possibles : « à son méridien, et avant elle à un tantra » ;
- les pronoms compléments : « su la réparer ».

Aucune faute nouvelle n'a été relevée à cette lecture ; elle reste celle de l'assistant.

## Ce que le dictionnaire donne

Non filtré, par décision du fondateur :

- **Mots rares.** Le septième nom suivant est très souvent un mot inconnu du lecteur
  (« mériédrie », « panlogisme », « viscoréduction »).
- **Mots grossiers.** « le mercredi » devient « la merde », « du salon » devient « de la
  saloperie ».

## De bout en bout

Avec les étiquettes du modèle neuronal, les erreurs d'étiquetage deviennent des fautes de
texte : « Personne n'avait su » devient « Perspiration n'avait su », « Salut Camille » devient
« Samare Camille », « reste ferme » devient « reste fermi », « ta guitare » devient « ta gulden ».

## Mode par défaut

**Réaccord (S+7 strict)**, choisi par le fondateur le 2026-10-03. Le mode « même genre » reste
disponible.

---

# Interface à pistes

Vérification du 2026-10-03 dans le navigateur, refaite après la revue de design (22 décisions) et
la revue d'ingénierie (D8 à D13), sur le texte de référence 1 (200 mots), étiqueté par le modèle
neuronal, fenêtre de 1280 × 900 px. Page : `tracks.html`. Capture :
`resultats/pistes/interface-texte-1.jpg` (S+7, parmi tous les noms).

Les huit étapes du test d'interface (tâche 3.1 de `tasks.md`) :

| Étape | Constat |
|---|---|
| 1. Coller 200 mots, mettre en pistes | La saisie se replie en « Texte : 200 mots · Modifier » |
| 2. Partition et texte résultant | 20 systèmes de 64 caractères au plus, 200 blocs pour 200 mots ; 3 à 5 pistes par système (les vides sont masquées) ; le texte résultant commence à 156 px du haut, sans défiler |
| 3. Décalage de 7 à 3, puis 1, 12, −7, 2 | 5 textes différents, sans nouvel étiquetage ; geste et affichage en 15 à 26 ms ; le résumé suit (« S+2, parmi tous les noms : 27 noms remplacés sur 34. ») ; les mots changés s'éclairent |
| 4. Couper puis rétablir le plugin | Coupé : le texte d'origine, à l'identique ; rétabli : le même texte qu'avant |
| 5. Changer « Parmi » | Le texte change |
| 6. Muet sur les adjectifs, Seul sur les verbes | Les adjectifs disparaissent, leurs 11 pistes sont estompées, la ligne « Pistes coupées : le texte est rendu tel quel… » s'affiche ; en solo, il ne reste que les verbes ; tout rétabli, le texte revient à l'identique |
| 7. Copier | Le texte remis au presse-papiers est le texte résultant, puis une ligne vide et « — S+7, parmi tous les noms (Oulipao) » ; « Copié. » à côté du bouton |
| 8. Réseau | 11 requêtes, aucune ne contient le texte ; hôtes : la page et `cdn.jsdelivr.net` (la bibliothèque du modèle) |

Autres vérifications :

| Point | Constat |
|---|---|
| Chargement du modèle | Cache vidé, la barre avance avant tout clic : « Chargement du modèle : 3 / 111 Mo — une seule fois, puis gardé par votre navigateur. » ; le bouton « Mettre en pistes » reste inactif jusqu'à la fin |
| Seconde visite | Les poids viennent du cache du navigateur (`transformers-cache`) : aucune requête vers Hugging Face ; la promesse « une seule fois » est tenue |
| Texte modifié | Bandeau « Texte modifié — remettre en pistes », partition et texte estompés, copie inactive |
| 375 px | Une seule colonne, aucun défilement horizontal de la page ; la partition est repliée derrière « Voir la partition » et défile dans son cadre |
| Clavier et libellés | 16 commandes, toutes atteignables au clavier et nommées ; aucune dans la partition cachée aux lecteurs d'écran |
| Lecteurs d'écran | À la place de la partition, une liste par piste : « Noms, 34 mots : matin devenu matois, horloge devenu horodatage, café laissé tel quel (aucun nom au bon genre et au bon nombre)… » |
| Polices | Servies par le projet ; aucune requête vers un serveur de polices |
| Page d'essai | `index.html` étiquette et applique le S+7 comme avant, avec les variables partagées |
| Console | Aucune erreur |

Le temps de mise à jour est mesuré autour du geste, rendu de la page compris ; le seuil du PRD
était d'une demi-seconde. Il passe de 2 à 4 ms (avant la revue) à 15 à 26 ms : la page rend
maintenant les mots un par un, pour les souligner et les éclairer.

Le premier chargement réel reste d'une vingtaine de secondes (mesure de l'essai technique) ; il
commence désormais à l'ouverture, sauf si le navigateur demande d'économiser les données.

## Écarts et limites

- **Les tranches ne sont pas à gauche de chaque piste** comme le prévoyait le PRD : la partition
  revenant à la ligne, chaque piste apparaît dans chaque système. Les cinq pistes forment une
  table de mixage dans une colonne à gauche (choix du fondateur, 2026-10-03) ; dans les
  systèmes, chaque piste porte son nom.
- **Les pistes ne sont plus à la même hauteur d'un système à l'autre**, puisque les pistes vides
  sont masquées (décision 3, compromis accepté).
- **Le contraste et le daltonisme** ont été vérifiés par le calcul (`DESIGN.md`), pas par des
  lecteurs daltoniens. La lecture complète d'une session au lecteur d'écran reste à faire avec
  un vrai lecteur ; la vérification porte sur ce que la page lui expose.
- **Le presse-papiers réel** n'a pas pu être relu depuis la session de vérification
  automatisée : c'est le texte remis au navigateur qui a été comparé.
- **La falsification du PRD** (3 testeurs sur 5 changent le décalage et coupent une piste en
  moins de 2 minutes) reste à mesurer : elle attend la mise en ligne et les cinq testeurs.
- En solo ou en mute, le texte résultant est une suite de mots, pas une phrase : la règle
  s'applique telle quelle (« la horloge »).

# Lipogramme

Vérification du 2026-10-03, lettre « e » interdite, sur les 3 textes de référence de 200 mots.
Deux mesures : sous Node, avec les catégories annotées des textes de référence ; dans le
navigateur, sur le texte 1, avec l'étiqueteur neuronal (fenêtre de 1280 × 900 px). Capture :
`resultats/lipogramme/texte-1-s7-puis-lipogramme.jpg`.

| Texte | Chaîne | Remplacés | Retirés | Laissés tels quels | Mots gardant un « e » hors laissés |
|---|---|---|---|---|---|
| 1 | lipogramme | 85 | 10 | 16 (verbes) | 0 |
| 1 | S+7 puis lipogramme | 92 | 10 | 17 (16 verbes, 1 nom sans voisin) | 0 |
| 2 | lipogramme | 105 | 8 | 32 (verbes) | 0 |
| 2 | S+7 puis lipogramme | 114 | 8 | 32 (verbes) | 0 |
| 3 | lipogramme | 77 | 6 | 26 (verbes) | 0 |
| 3 | S+7 puis lipogramme | 96 | 6 | 26 (verbes) | 0 |

| Critère du PRD | Constat |
|---|---|
| La lettre a disparu | 0 « e » dans les noms, adjectifs, adverbes et mots-outils des 3 textes ; les verbes qui la contiennent restent tels quels et sont comptés (v1) |
| Les remplacements sont accordés | Non mesuré : la relecture à la main revient au fondateur. Par construction, noms et adjectifs gardent genre et nombre ; un pronom « le » devient « un » (la table ne distingue pas le pronom du déterminant) |
| Les deux contraintes se combinent | S+7 puis lipogramme : 0 « e » hors verbes ; dans le navigateur, « S+7, parmi tous les noms : 33 noms remplacés sur 34. lipogramme en e : 86 mots remplacés, 9 retirés, 16 laissés tels quels. » ; l'ordre s'inverse, et le S+7 placé après réintroduit des « e », comme attendu |
| Le réglage reste en direct | Dans le navigateur, rendu compris : mettre le lipogramme en marche 106 ms, brancher le S+7 37 ms, changer de lettre 157 ms, inverser l'ordre 65 ms ; sans nouvel étiquetage |
| Le contrat tient | Le lipogramme est écrit contre `ConstraintPlugin` ; deux ajouts au contrat (portée « toutes les pistes », mot retiré), consignés dans `docs/plugins.md` ; la chaîne est tenue par la page |
| Le texte reste dans le navigateur | Hôtes contactés : la page et `cdn.jsdelivr.net` (la bibliothèque du modèle) ; aucune requête ne contient le texte |
| La mention copiée décrit la chaîne | « — S+7, parmi tous les noms · lipogramme en e (Oulipao) » |

Extrait du texte 1, S+7 puis lipogramme : « Un matois où un vif hors-bilan s'arrêta néanmoins
un remarqua vulgo Préparait un café dans un cuissot étroit, quand on un faisait dès anacondas,
ou sa marihuana lisait la jovialité sans lever nos officialisations. »

## Écarts et limites

- **Copie périmée du dictionnaire.** Pendant la vérification, le navigateur servait une copie en
  cache de `data/morpho-oulipao.tsv` d'avant l'ajout des adverbes : les adverbes gardaient leur
  « e ». L'adresse du fichier porte désormais une version (`MORPHOLOGY_VERSION` dans
  `src/ui/composition.ts`), à changer à chaque reconstruction.
- **Les verbes** gardent leur « e » (v1) ; un second PRD les traitera.
- **Les mots-outils sans équivalent** sont retirés (« je », « ne », « se ») ; un nom propre
  étiqueté « autre » qui contient la lettre l'est aussi (« Marthe » disparaît, sa majuscule
  passe au mot suivant).
- **Le pronom et le déterminant** se confondent dans la table : « ne le remarqua » devient
  « néanmoins un remarqua ».
- **Des voisins lointains** : faute de voisin proche, un mot peut sauter loin dans l'ordre du
  dictionnaire (« encore » → « fifty-fifty »). C'est le jeu de « voisin = le suivant sans la
  lettre ».
- **La falsification** (2 testeurs sur 5 branchent les deux contraintes au premier essai) attend
  la mise en ligne et les cinq testeurs.

# Filtres

Vérification du 2026-10-03. Dans le navigateur, sur le texte 1 de référence avec l'étiqueteur
neuronal (fenêtre de 1280 × 900 px) ; sous Node, sur les 3 textes, avec les catégories annotées.
Capture : `resultats/filtres/texte-1-cinq-filtres.jpg`.

| Critère du PRD | Constat |
|---|---|
| Instancier | Deux S+n indépendants dans la page : S+7 sur les noms, S+3 puis S+2 sur les adjectifs. Navigateur, texte 1 : « S+7 sur les noms : 33 noms remplacés sur 34. S+3 sur les adjectifs : 13 adjectifs remplacés sur 13. » Sous Node (S+7 noms, S+3 adjectifs) : 32 + 13, 41 + 24, 39 + 14 mots remplacés sur les textes 1, 2, 3 |
| Cibler | Lipogramme en « e » sur les seuls noms, sous Node : 22, 33 et 24 noms remplacés, 0 nom gardant un « e » ; aucun mot des autres pistes ne change, sauf un adjectif réaccordé au nom remplacé (texte 3 : « l'eau désolé » → « l'ébriété désolée »), comme le prévoit l'exigence ; les « e » des autres pistes restent (47 mots-outils, 16 verbes, 11 adjectifs, 15 adverbes dans le texte 1) |
| Chaîner | Trois filtres réordonnés (S+3 adjectifs monté de la 3e à la 1re place) : le résumé et le texte suivent l'ordre affiché (« S+3 sur les adjectifs : 12 adjectifs remplacés sur 13. S+7 sur les noms … »), sans nouvel étiquetage. Avec cinq filtres, geste et rendu compris : ajouter 7 à 37 ms, changer un décalage 6 à 7 ms, changer de lettre 8 à 12 ms, monter ou descendre 7 à 11 ms, couper ou rallumer 8 à 31 ms, Muet 9 à 10 ms ; tout sous la demi-seconde |
| La mention copiée | « — S+2 sur les adjectifs · S+7 sur les noms · lipogramme en e sur les noms · S+1 sur les noms · lipogramme en a (Oulipao) » |
| Les filtres servent | Non mesuré : attend le carnet de textes gardés (roadmap, NOW, item 2) et le 14 novembre 2026 |

Extrait du texte 1, chaîne S+2 adjectifs · S+7 noms · lipogramme en e sur les noms · S+1 noms ·
lipogramme en a : « Une mâture où le vigilé hors-bord s'arrêta, personne ne le remarqua vulgo
Préparait le câlin en une cuistrerie étrusque… »

## Écarts et limites

- **Le S+n sur les adjectifs compte tous les adjectifs** : « Parmi » ne vaut que pour les noms
  (décision du 2026-10-03). Un adjectif sans forme au bon genre et au bon nombre reste tel quel.
- **Ordre des mesures** : les premières mesures attendaient deux images ; dans un panneau masqué,
  le navigateur les espace d'une seconde. Les chiffres ci-dessus mesurent le geste et le rendu
  sans attendre l'image suivante.
- **Lettres accentuées** : un lipogramme en « a » laisse « â » (« mâture », « câlin ») ; les
  voyelles accentuées sont hors du périmètre v1.
- **Un filtre ajouté est en marche** : il agit dès qu'il est branché (S+7 par défaut,
  lipogramme en « e »).

# Inspecteur de chaîne

Vérification du 2026-10-03, dans le navigateur, sur le texte 1 de référence avec l'étiqueteur
neuronal. Capture : `resultats/inspecteur/texte-1-inspecteur.jpg`.

| Critère du PRD | Constat |
|---|---|
| Suivre un mot dans la chaîne | Cinq filtres ; un clic sur le mot venu de « cuisine » ouvre l'inspecteur : six bandes, « Origine » puis chaque filtre dans l'ordre. On y lit « cuisine → cuisseau (S+7) → cuissot (lipogramme en e) → cuissot (lipogramme en a) → cuistance (S+1) », et « étroite » devenue « étrusque » au S+2 puis « étudiante » par réaccord |
| Le texte d'abord | À 1280 × 900 px : plus de partition ; le texte résultant occupe la colonne de droite, l'inspecteur fermé ne laisse qu'une ligne d'invitation ; la page ne défile pas à l'horizontale |
| Sur téléphone | À 375 px : la page ne défile pas à l'horizontale ; l'inspecteur montre cinq mots et défile en lui-même (442 px de contenu pour 343 de place), la colonne des noms d'étape prenant de la largeur |
| Toujours en direct | Inspecteur ouvert, cinq filtres, geste et rendu compris : ouvrir 165 ms, mot suivant 8 à 153 ms, changer un décalage 130 ms, monter un filtre 300 ms ; sous la demi-seconde, sans nouvel étiquetage ; le choix reste sur le même mot quand un filtre monte |
| Ce qui change dans le code | `score-layout.ts`, `components/score.ts`, la mesure de largeur de `main.ts`, `setWidth` et `toggleScore` supprimés ; `runChain` rend `stages` ; `components/inspector.ts` et ses tests |
| Falsification | À mesurer : une ligne à la fin de chacune des 3 premières séances d'écriture, avant le 31 octobre 2026 (« inspecteur ouvert, réglage changé : oui/non ») |

## Écarts et limites

- **Mots coupés.** Au premier essai, le tableau serrait ses colonnes et coupait les mots
  (« da/ns ») ; les mots restent maintenant sur une ligne, et l'inspecteur défile en lui-même
  si la place manque.
- **La raison d'un mot laissé tel quel**, que donnait la partition, passe dans l'infobulle du mot
  du texte résultant (« Noms : laissé tel quel, absent du dictionnaire »).
- **Les mesures varient** d'un geste à l'autre (8 à 300 ms) dans un panneau de navigateur
  partagé ; aucune ne dépasse la demi-seconde.



# Textbank phonétique et filtres de rime

Vérification du 2026-10-03 : sous Node avec les fichiers dérivés, puis dans le navigateur
(page à pistes, étiqueteur neuronal, poème de quatre vers).

| Critère | Constat |
|---|---|
| Données | `data/phonetique-oulipao.tsv` tiré de GLÀFF 1.2.2 : 406 215 lignes, 382 669 formes. 19,6 % des 476 104 formes de Grammalecte n'y sont pas (surtout des noms composés) et passent par la prononciation devinée |
| Poids | 12,5 Mo bruts, 1,98 Mo compressés en gzip ; chargés seulement quand un filtre phonétique est en marche. Lecture et validation sous Node : 1,6 s |
| Index des rimes (2026-10-03) | Le fichier porte aussi une prononciation pour chaque forme candidate des filtres que GLÀFF ne donne pas dans sa catégorie ou dans sa casse : 32 326 empruntées à une autre ligne, 89 393 devinées par les règles. 17,4 Mo bruts, 3,2 Mo compressés en gzip |
| Temps des filtres de rime, avant et après l'index (2026-10-03) | Sous Node, trois textes de référence de 200 mots, toutes les pistes, 95e percentile. Avant : R+1 de 0,3 à 1,1 s, R+3 de 1,2 à 1,7 s, homophonies de 2,8 à 4,0 s. Après : R+1 de 27 à 87 ms, R+3 de 57 à 89 ms, homophonies de 5 à 6 ms. Le tout premier R+n d'une session coûte jusqu'à 410 ms, le temps de calculer les positions des rimes rencontrées. Sorties identiques mot à mot et raison par raison sur les neuf passages |
| Filtres de vers et index des rimes (2026-10-03) | Sous Node, textes de référence réécrits en vers (8 mots par vers, strophes de 4 vers), réglages par défaut, toutes les pistes, 95e percentile. Avant : monorime 201 à 556 ms, schéma de rimes 135 à 504 ms, antérime 37 à 1 249 ms, rime berrychonne 3 à 82 ms. Après : 0,4 à 19 ms pour les quatre ; premier passage à froid de 2 à 264 ms. Pour les verbes, les candidates sont aussi filtrées par le temps et la personne (une rime comme /ɔ̃/ touche presque tous les verbes, par « -ons »). Sorties identiques mot à mot. Dans les mêmes conditions, le R+7 par défaut reste irrégulier : 33 à 79 ms en médiane, 56 à 237 ms au 95e percentile |
| Index des finales (2026-10-03) | Les filtres qui exigent une richesse (R+n, antérime, schéma de rimes) ne prennent plus que les formes qui partagent la finale exigée ; un mot trop court pour rimer à cette richesse n'en a aucune. Sous Node, textes de référence en prose et en vers, 95e percentile. R+7 par défaut : en vers de 54–189 ms à 6–17 ms, en prose de 34–155 ms à 6–10 ms. R+1 : 4 à 7 ms. Antérime et schéma : 4 ms au plus. Premier passage à froid : 244 ms au plus (865 ms avant). Chargement de la textbank : 2 650 ms (2 667 ms avant). Sorties identiques mot à mot sur les 24 passages |
| Rimes | « chaise » /ʃɛz/, rime /ɛz/ ; « couvent » /ku.vɑ̃/ (nom), /kuv/ (verbe) ; « glorbiture » devinée, rime /yʁ/ |
| Syllabes | « Je fais souvent ce rêve étrange et pénétrant » : 12 |
| Filtres sous Node | Sur « Le vieux chat dort sur la chaise / Pendant que tombe la pluie / Il rêve de la cuisine / Et du jardin dans le soir noir » : R+1 (noms, adjectifs, verbes) 78 à 98 ms ; monorime en /ɔ̃/ 3 ms ; antirime 0 ms (aucune fin de vers ne rime) ; homophonies 318 à 363 ms (« chat » → « schah ») |
| Navigateur | R+7 sur les noms : 5 noms remplacés sur 6, « chaise » → « cinghalaise », comptes de syllabes en bout de vers. Homophonies puis monorime en /ɔ̃/ : « Le vieux schah dort sur la champagnisation / … la plumaison / … la cuisson / … le soir oblong ». L'inspecteur montre « /ʃɛz/ · 1 syllabe · rime /ɛz/ ». Aucune erreur dans la console ; à 375 px, la page ne défile pas à l'horizontale |
| Justesse des rimes (9 sur 10) | **À relire par le fondateur.** Règle fixée d'avance : un remplacement est juste si sa rime phonétique (dernière voyelle et ce qui suit) est celle du mot d'origine, à l'oreille ; un mot dont la prononciation est devinée se compte à part ; un mot laissé tel quel ne compte pas. Relire 3 textes de 200 mots passés au R+7, rime suffisante |

## Écarts et limites

- **Mots composés.** GLÀFF n'a pas les noms composés : « œil-de-chat » est deviné partie par
  partie. Les règles de repli donnent une rime plausible, pas une prononciation exacte.
- **« que » devant un verbe nouveau.** Le R+n sur les verbes peut laisser « que abombe » : comme
  au V+7, seul un pronom s'élide devant le verbe remplacé.
- **Homophonies lentes** sur un mot dont l'homophone est loin dans le dictionnaire (300 ms
  environ) : le moteur parcourt les lemmes un par un. Sous la demi-seconde.
- **« ɔ̃ » ressemble à un « 5 »** dans les polices de l'interface : le monorime nomme donc
  chaque rime avec un mot exemple (« /ɔ̃/ (formation) »).
- **Le compte des syllabes** suit la prononciation du lexique, le e muet devant consonne et
  l'élision devant voyelle ; ni diérèse ni synérèse.

---

# Schémas de rimes

Vérification du 2026-10-03, dans le navigateur (page à pistes, étiqueteur neuronal). Trois poèmes
de trois quatrains, écrits pour l'essai, passent aux rimes embrassées, rime suffisante, sur les
quatre pistes pleines.

| Critère | Constat |
|---|---|
| Fins de vers qui suivent leur lettre, selon la règle | 35 sur 36. La 36e (« fenêtre », lettre B) reste avec sa raison : « aucun voisin en /ɑ̃tʁ/ (B) ». Critère tenu : 36 sur 36 suivent leur lettre ou portent leur raison |
| Fins de vers qui suivent leur lettre, à l'oreille | 34 sur 36 (9,4 sur 10). « table » → « CEM » rime en /ɑ̃/ par une prononciation devinée (le sigle manque dans GLÀFF) ; lu comme un sigle, il ne rime pas |
| Exemples | « Le café fume sur la table / … » ; « Le phare veille sur la Côte-d'Or / Un marin chante sur le remarquable » ; « Le vieux marin ferme les péchés / La marée monte vers la planèze » |
| Inspecteur | Sur la dernière fin d'un quatrain : « /ʒaʁdɛ̃/ · 2 syllabes · rime /ɛ̃/ masculine · lettre A » |
| Tests | `npm test` : 317 tests, couverture 100 % des lignes, 98,8 % des branches |

## Écarts et limites

- **Des voisins rares.** Le premier voisin qui rime est souvent un mot rare du dictionnaire
  (« tories », « sans-soin », « gynophile », « viscosimètre », « riblon »). C'est la règle :
  le voisin le plus proche dans l'ordre alphabétique, pas le plus courant.
- **La même rime deux fois.** Un vers peut recevoir le mot de son modèle à un autre nombre
  (« fleuve » → « fleuves »). La règle ne l'interdit pas.
- **La fin de vers dépend de l'étiqueteur.** Dans « Le berger rentre avec son chien », « chien »
  n'est pas étiqueté comme un mot plein. La fin du vers est donc « rentre », et la lettre B prend
  la rime /ɑ̃tʁ/.
- **L'inspecteur lit le mot d'origine.** Pour une fin remplacée, il montre la prononciation, la
  rime et le genre du mot d'origine, mais la lettre du vers dans le schéma. C'est l'écart déjà
  connu des filtres de rime.

---

# Formes à refrain

Vérification du 2026-10-03, dans le navigateur (page à pistes, étiqueteur neuronal). Deux
textes écrits pour l'essai passent par un schéma de rimes du même nom que la forme, puis par
la forme.

| Critère | Constat |
|---|---|
| Rondel | 10 vers donnent 13 vers en strophes de 4, 4 et 5 ; les vers 7, 8 et 13 sont des refrains. Deux rimes, /in/ et /o/ : « Le soir descend sur la colline / Le berger rentre avec son troupeau / La lampe brille à la kapo / … / La lune éclaire le ruine-babine / Le soir descend sur la colline » |
| Villanelle | 13 vers donnent 19 vers, soit cinq tercets et un quatrain ; les vers 6, 12 et 18 recopient le vers 1, les vers 9, 15 et 19 recopient le vers 3. Deux rimes, /abl/ et /ɔʁ/, aucun vers laissé : « La mer revient sur le sable / Les bateaux dorment dans le port / Le phare veille sur la coupable / … » |
| Refrains | En italique, à l'encre secondaire, annoncés « Refrain, copie du vers N » aux lecteurs d'écran ; un clic sur « colline » au vers 7 sélectionne le mot d'origine, et l'inspecteur l'ouvre. Chaque vers garde son compte de syllabes |
| Téléphone | À 375 px, le choix de forme passe sous le titre, sans défilement horizontal |
| Tests | `npm test` : couverture 100 % des lignes ; `npm run typecheck` sans erreur |

## Écarts et limites

- **Une donnée fausse dans GLÀFF.** « polygéniste » y est noté /po/ : le rondel le fait rimer
  avec « troupeau ». La règle est juste, pas la donnée.
- **Les mots rares** reviennent, comme pour tous les filtres de rime (« ruine-babine »,
  « plaider-coupable », « isochore »).
- **Une erreur de console antérieure.** Au chargement de la page, l'observateur qui colle la
  bande de résultat lit une bande qui n'existe pas encore (`src/ui/tracks/main.ts`). Elle est
  sans lien avec les formes et à corriger à part.

---

# Séances en ligne

Mesure du pari de la mise en ligne (`.nanopm/wiki/docs/prds/mise-en-ligne-d-oulipao.md`). Le site n'a aucun traceur : on note ici chaque séance d'écriture, à la main, qu'elle se fasse en ligne ou en local.

**Le pari est faux si**, dans les 28 jours qui suivent la mise en ligne, moins de 3 séances passent par `https://oulipao.incongru.org` alors qu'au moins 6 sont notées en tout.

| Date | Adresse (en ligne ou locale) | Appareil | Ce qui a été fait | Texte gardé |
|---|---|---|---|---|
