# 12. Glossaire

**Niveau de détail :** ESSENTIAL (termes du domaine, termes techniques et sigles, termes ambigus).

## Vue d'ensemble

Le glossaire définit une cinquantaine de termes : le vocabulaire d'Oulipao (pistes, contraintes,
chaîne…), les noms des briques de la section 5, les sigles des sections 1 à 11 et les noms des
outils. Chaque définition dit ce que le terme veut dire **dans Oulipao**. Dans les tableaux, le
terme en gras est le terme retenu, celui que toute la documentation doit employer ; la colonne
« Aussi appelé » donne les autres noms qu'on rencontre dans le code, l'interface ou le wiki.

---

## 12.1 Termes du domaine

| Terme | Définition | Aussi appelé |
|-------|------------|--------------|
| **Accord** | Le travail qui suit un remplacement : le déterminant, les adjectifs, l'attribut et le participe prennent le genre et le nombre du mot nouveau, par des règles de voisinage (ADR-005). C'est le mode « réaccord » du S+n, celui par défaut. | réaccord, `reagree` |
| **Adaptateurs** | La brique qui branche les ports du Domaine sur le monde réel : les étiqueteurs, les dictionnaires, `fetch`, `node:fs` (`src/adapters`). | — |
| **Antirime** | Le filtre de rime qui remplace chaque fin de vers par un voisin qui ne rime avec aucune fin précédente de la strophe (`src/domain/rhyme/antirhyme.ts`). | — |
| **Bord** | Le type de contrainte qui ne garde que les fins de vers, les débuts et fins, ou l'intérieur du poème (`src/domain/edge`). Il sert aux recettes Haï-kaïsation et Intérieur de poème. | `edge` |
| **Chaîne** | La suite ordonnée des instances actives. Chacune relit la sortie de la précédente comme un texte neuf, tout en gardant le mot d'origine de chaque mot (`runChain`). | — |
| **Contrainte** | Une règle d'écriture énoncée, appliquée aux mots d'une ou plusieurs pistes. Il en existe neuf types : S+n, lipogramme, tri par piste, bord, mise en vers, R+n, monorime, antirime, homophonies. Dans le code, un type de contrainte est un `ConstraintPlugin`. | plugin, type (code) ; moteur (interface, section « Moteurs ») ; filtre, voir 12.3 |
| **Contrat de plugin** | L'ensemble de ce qu'un type de contrainte déclare et rend : ses réglages, ses pistes, son application, ses marques. Il est interne et non versionné (I-05, ADR-004). | — |
| **Dictionnaire** | Les fichiers dérivés des lexiques Grammalecte et GLÀFF, lus par les ports `MorphologyRepository`, `VerbRepository` et `PhoneticsRepository`. Changer de dictionnaire revient à changer de textbank. | textbank |
| **Domaine** | La brique pure, sans effet de bord, qui découpe, vérifie l'étiquetage et applique la chaîne. Elle comprend les ports (`src/domain`, `src/ports`). | — |
| **Données dérivées** | La brique des trois fichiers TSV tirés de Grammalecte : lexique, morphologie, verbes (`data/*.tsv`). | — |
| **Élision** | Le passage de « le » à « l' » (ou de « de le » à « du ») devant un mot nouveau qui commence par une voyelle ou un h muet. Le h aspiré et quelques mots (« onze », « yaourt ») l'interdisent : c'est la note `pel` de Grammalecte. | contraction |
| **Étiqueteur** | Ce qui range chaque mot dans une piste, derrière le port `Tagger`. Celui de la page à pistes est CamemBERT. La page d'essai compare aussi fr-compromise et la consultation du lexique. | tagger |
| **Homophonies** | Le filtre qui remplace un mot par un autre de même catégorie qui se prononce exactement pareil (« chat » → « schah »). | — |
| **Inspecteur** | Le panneau qui montre, pour un mot d'origine, ce que chaque instance de la chaîne en a fait et pourquoi : une bande par instance. | — |
| **Instance** | Une occurrence d'un type de contrainte dans la chaîne, avec ses réglages et ses pistes visées. Deux instances du même type coexistent : « S+2 sur les adjectifs » et « S+7 sur les noms ». | `ChainStep` ; filtre, voir 12.3 |
| **Interface** | La brique qui monte les pages, tient l'état de la table, le registre des contraintes et les recettes, et câble les adaptateurs (`src/ui`). Voir 12.3. | UI |
| **Lecteur** | Celui qui ouvre la page à pistes pour écrire sous contrainte : le fondateur d'abord, le lecteur de Queneau ou de Perec ensuite. | visiteur |
| **Lemme** | La forme de dictionnaire d'un mot : le singulier pour un nom, le masculin singulier pour un adjectif, l'infinitif pour un verbe. Le S+n se déplace dans la liste des lemmes, puis remet le mot nouveau au genre, au nombre, au temps et à la personne du mot remplacé. | paradigme (adjectifs, dans le code) |
| **Lipogramme** | Le type de contrainte qui remplace chaque mot contenant une lettre interdite par un voisin du dictionnaire qui ne la contient pas (`src/domain/lipogram`). | — |
| **Mainteneur** | Le fondateur, quand il lance les Outils : régénérer, mesurer, publier. | fondateur |
| **Marque** | Ce qu'une instance a fait d'un mot d'origine : remplacé, retiré, recoupé à la ligne, ou laissé avec sa raison (`WordMark`). | — |
| **Mise en pistes** | L'étiquetage d'un texte collé, qui le répartit en pistes. C'est l'étape coûteuse ; elle n'est pas refaite quand on règle une contrainte. | étiquetage |
| **Mise en vers** | Le type de contrainte qui recoupe le texte en lignes (`src/domain/lineation`). | `lineation` |
| **Monorime** | Le filtre de rime qui fait rimer toutes les fins de vers sur une rime choisie, parmi une liste fixée à la dérivation. | — |
| **Mot d'origine** | Un mot du découpage du texte collé. C'est l'unité de compte de bout en bout : une case de la grille, une marque par instance, une ligne de l'inspecteur (section 8). | `Token`, `index` |
| **Oulipao** | « Ouvroir de Littérature Potentielle Assistée par Ordinateur » : le système documenté ici, sur le modèle de MAO. Il s'appelait Potao avant le 2026-10-03. | Potao (ancien nom) |
| **Outils** | La brique des scripts Node que le mainteneur lance hors du navigateur : dériver les dictionnaires, construire les textes de référence, mesurer, vérifier la palette, assembler le site (`scripts/`, IF-06). Ils ne sont jamais publiés. | scripts |
| **Pas** | Une case de la grille, une par mot d'origine, comme le pas d'un séquenceur. Un pas **bouché** soustrait le mot à toute la chaîne ; un pas **percé** le laisse aux contraintes. | step |
| **Piste** | Une catégorie grammaticale du texte : noms, adjectifs, verbes, adverbes, ou autres (les mots-outils et les noms propres). On la rend muette, on la met en solo, une contrainte la vise. | `Category`, track ; « Autres » = mots-outils |
| **Prononciation devinée** | La prononciation qu'Oulipao calcule par des règles pour une forme absente de GLÀFF (19,6 % des formes, surtout des noms composés). Elle donne une rime plausible, et le mot porte cette raison. | `guessed` |
| **R+n** | Le filtre de rime qui remplace chaque mot de ses pistes par le n-ième voisin du dictionnaire qui rime avec lui, au même genre et au même nombre. | `rn` |
| **Rack** | La zone de la page à pistes, sous la table, qui montre la chaîne : une ligne par instance, avec ses réglages, ses pistes visées, son interrupteur et sa poignée pour la réordonner. | rack de filtres (`strategy.md`) |
| **Raison** | La phrase en français qui dit pourquoi un mot a été laissé tel quel : « auxiliaire », « conjugaisons en cours de chargement »… Toute contrainte doit la donner (section 8.6). | `reason` |
| **Recette** | Une contrainte de l'Oulipo nommée (Liponymie, Haï-kaïsation, Monovocalisme…), qui se réduit à une ou plusieurs instances des types installés (`src/ui/tracks/recipes.ts`). Voir 12.3. | — |
| **Rime** | La dernière voyelle prononcée d'un mot et ce qui la suit, calculée dans le Domaine à partir de la prononciation (`phonetics/rhyme.ts`). Le e muet final ne compte pas. | — |
| **S+n** | Le type de contrainte qui remplace chaque mot de ses pistes par le n-ième mot de même catégorie qui le suit (ou le précède) dans le dictionnaire. Le S+7 de l'Oulipo en est le réglage n = 7 sur la piste des noms. | S+7, M±n, `s7` |
| **Table** | La partie de la page à pistes où l'on règle les pistes (muet, solo) et la chaîne : la « table de mixage » de la métaphore de MAO. | table de mixage |
| **Textbank** | Le terme produit pour un dictionnaire où une contrainte puise ses mots. Il en existe deux : les mots et leurs formes (Grammalecte), et la textbank phonétique, ce que les mots font entendre (GLÀFF, ADR-007). | dictionnaire |
| **Tri par piste** | Le type de contrainte qui retire les mots des pistes visées, ou ne garde qu'eux (`src/domain/track-sort`). Il sert aux recettes Liponymie, La rien que la toute la et Inventaire. | `track-sort` |
| **Verrou** | Un réglage propre à un mot d'origine pour une instance : ce mot-là reçoit, par exemple, un autre décalage que le reste (`locks`). | override (code) |
| **Vers**, **strophe** | Un vers est une ligne du texte ; une strophe, un groupe de vers séparé par une ligne vide. Les filtres de rime les recalculent à partir des sauts de ligne (`verse.ts`). | ligne |

---

## 12.2 Termes techniques et sigles

| Terme ou sigle | Forme développée | Dans Oulipao |
|----------------|------------------|--------------|
| ADR | Architecture Decision Record | Une décision consignée dans la section 9, au format de Nygard (ADR-001 à ADR-006). |
| API (phonétique) | Alphabet phonétique international | La notation des prononciations affichées dans l'inspecteur (`/ʃɛz/`). Voir 12.3. |
| Architecture hexagonale | — | Le découpage en Domaine pur, ports, adaptateurs et interface, imposé par `CLAUDE.md` (sections 2.1 et 4.2). |
| CamemBERT | — | Le modèle neuronal d'étiquetage, `Xenova/french-camembert-postag-model`, quantifié en q8 et exécuté dans le navigateur (ADR-002). |
| CDN | Content Delivery Network | jsDelivr, le CDN de Hugging Face et celui de GitHub Pages : ils servent les fichiers ; aucun ne reçoit le texte. |
| CI | Intégration continue | Deux workflows GitHub Actions. `ci.yml`, sur chaque PR : typecheck, tests, assemblage. `release.yml`, sur `main` : release-please, puis, à chaque version, les mêmes étapes et la publication. |
| CSP | Content Security Policy | La politique déclarée dans une balise `<meta>` de chaque page : elle borne les requêtes au site, à jsDelivr et à Hugging Face, même pour un code tiers altéré (QS-02, RISK-02). |
| DEBT-xx | — | L'identifiant d'une dette technique de la section 11. |
| DOM | Document Object Model | Seuls les points d'entrée des pages y touchent. Ils sont exclus de la couverture de tests. |
| ESM | ECMAScript Modules | Le format du code assemblé par esbuild et du module Transformers.js importé. |
| French Treebank | — | Le jeu d'étiquettes grammaticales de CamemBERT, ramené aux cinq pistes par l'adaptateur. |
| GLÀFF | Gros Lexique À tout Faire du Français | Le lexique 1.2.2 (CC BY-SA 3.0, dérivé du Wiktionnaire) d'où vient le fichier des prononciations (ADR-007). |
| Grammalecte | — | Le lexique français v7.7 (MPL 2.0) d'où viennent trois des quatre fichiers de données : lexique, morphologie, verbes (ADR-003, remplacé par ADR-007). |
| I-xx | — | L'identifiant d'une interface interne de la section 5 : les ports I-01 à I-04 et I-06, le contrat de plugin I-05. |
| IF-xx | — | L'identifiant d'une interface externe, commun aux sections 3 et 5 (IF-01 à IF-07 ; IF-05 est interne). |
| LEAN, ESSENTIAL, THOROUGH | — | Les trois niveaux de détail du toolkit arc42 utilisé pour cette documentation. Toutes les sections sont en ESSENTIAL. |
| MAO | Musique assistée par ordinateur | La métaphore du produit : pistes, table de mixage, séquenceur. |
| MPL 2.0 | Mozilla Public License 2.0 | La licence du lexique Grammalecte et des fichiers qui en dérivent. C'est un copyleft au niveau du fichier (section 2.3). |
| ONNX, q8 | Open Neural Network Exchange ; quantification sur 8 bits | Le format et la précision des poids du modèle téléchargés depuis Hugging Face. |
| OpenSpec | — | L'outil de changements du projet (`openspec/`) : chaque évolution a sa spec et son `design.md`. |
| Port | — | Une interface déclarée par le Domaine pour ce dont il a besoin : `Tagger`, `MorphologyRepository`, `VerbRepository`, `TextSource`. |
| `ponytail:` | — | Le préfixe d'un commentaire qui marque une simplification délibérée, avec sa limite et sa sortie (section 2.4). |
| PR de version | — | La PR que release-please ouvre et tient à jour sur `main` : prochain numéro de version et `CHANGELOG.md`. Sa fusion publie le site. |
| Q42 | — | Le modèle de qualité de quality.arc42.org, d'où viennent les étiquettes `#secure`, `#suitable`, `#efficient`, `#flexible`, `#usable`. |
| QS-xx | — | L'identifiant d'un scénario de qualité de la section 10 (QS-01 à QS-13). |
| Racine de composition | — | Le seul endroit qui choisit quel adaptateur sert quel port : `src/ui/composition.ts`. |
| RGAA | Référentiel général d'amélioration de l'accessibilité | Il ne s'applique pas à Oulipao (section 2.3) ; l'accessibilité y est un objectif de qualité. |
| RGPD | Règlement général sur la protection des données | Oulipao ne collecte rien ; l'adresse IP du visiteur part toutefois chez trois fournisseurs (section 2.5). |
| RISK-xx | — | L'identifiant d'un risque de la section 11 (RISK-01 à RISK-09), attribué d'abord dans les ADR. |
| SAMPA | Speech Assessment Methods Phonetic Alphabet | La notation ASCII des prononciations dans GLÀFF ; Oulipao lit l'API et n'affiche pas le SAMPA. |
| SRI | Subresource Integrity | Une empreinte qui ferait refuser un fichier tiers altéré. Il n'y en a pas sur Transformers.js (RISK-02). |
| TLS | Transport Layer Security | Il est terminé par GitHub Pages, jsDelivr et Hugging Face ; HTTP est redirigé en 301. |
| Transformers.js | — | La bibliothèque qui exécute le modèle en WASM dans le navigateur. La version 4.3.0 est chargée depuis jsDelivr. |
| TSV | Valeurs séparées par des tabulations | Le format des trois fichiers de données : une forme par ligne, validée à la lecture. |
| WASM | WebAssembly | Le moteur d'exécution du modèle dans le navigateur ; le site l'exige (section 2.1). |
| WCAG 2.2 | Web Content Accessibility Guidelines | La norme du seuil de contraste de 4,5:1, vérifié par `check:palette` (QS-10). |
| zod | — | La bibliothèque de schémas qui définit les entités et valide tout ce qui entre (sections 2.1 et 8.4). |
| ΔE | Écart de couleur perçu | L'écart minimal de 20 entre deux pistes, sous trois simulations de daltonisme (QS-10). |

---

## 12.3 Termes ambigus

| Terme | Sens dans cette documentation | À ne pas confondre avec |
|-------|-------------------------------|-------------------------|
| **API** | L'alphabet phonétique international, dans lequel s'écrivent les prononciations (12.2). | Une interface de programmation : Oulipao n'en expose aucune ; la documentation écrit « port » ou « interface » pour ce sens-là. |
| **Contrainte** | Une règle d'écriture oulipienne (12.1). | Une contrainte d'architecture, au sens de la section 2 d'arc42. La section 2 précise « contrainte du projet » quand c'est ce sens-là. |
| **Domaine** | La brique pure du système (`src/domain`). | Le nom de domaine `oulipao.incongru.org` (sections 3 et 7), écrit alors « nom de domaine » ou « adresse ». |
| **Filtre** | Dans les specs et le wiki, tantôt un type de contrainte (« filtres instanciables »), tantôt une instance (« cinq filtres »). Cette documentation écrit **contrainte** pour le type et **instance** pour l'occurrence dans la chaîne. | Un filtre au sens du traitement du signal ou d'un filtre de recherche : rien n'est filtré, les mots sont remplacés, retirés ou recoupés. |
| **Interface** | La brique qui monte les pages (`src/ui`), avec une majuscule. | Une `interface` TypeScript (un port) ; une interface au sens d'arc42 (IF-xx, I-xx), écrite « interface » en minuscule et suivie de son identifiant. |
| **Moteur** | Dans l'interface, la section « Moteurs » liste les types de contrainte qu'on peut ajouter nus. | Le moteur S+7 (`src/domain/s7/engine.ts`), qui est le code qui applique le S+n. |
| **Pas** | Une case de la grille, un mot d'origine (12.1). | Le décalage du S+n (le « 7 » de S+7), qu'on écrit « décalage ». |
| **Piste** | Une catégorie grammaticale du texte. | Une piste audio : la métaphore s'arrête au nom, puisqu'une piste ne joue rien dans le temps. |
| **Plugin** | Un type de contrainte derrière le contrat interne (ADR-004). | Une extension écrite par un tiers et chargée à l'exécution : il n'en existe pas, et aucun format public n'est ouvert. |
| **Recette** | Une contrainte de l'Oulipo nommée, qui se réduit à des instances (12.1). | Une recette au sens de la vérification avant livraison : cette documentation écrit alors « vérification ». |
| **Table** | La table de mixage de la page à pistes. | Un tableau de cette documentation. |
