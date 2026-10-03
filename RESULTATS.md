# Résultats de l'essai technique

Étiquetage grammatical du français dans le navigateur et lexique libre.
Mesures du 2026-10-03. Échéance de la décision : 18 octobre 2026.

Pour refaire les mesures : `npm run measure -- --errors`.

## Lexiques

Lexique retenu : **Grammalecte / Dicollecte v7.7**, licence MPL 2.0.

- Redistribution permise dans un dépôt public ; le fichier dérivé `data/lexique-potao.tsv`
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
| Lexique | 6,6 Mo (1,3 Mo compressé) | `data/lexique-potao.tsv` |
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
| 7. Copier | Le texte remis au presse-papiers est le texte résultant, puis une ligne vide et « — S+7, parmi tous les noms (Potao) » ; « Copié. » à côté du bouton |
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
