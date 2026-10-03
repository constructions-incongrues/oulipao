# 9. Décisions d'architecture

**Niveau de détail :** ESSENTIAL (contexte, décision, conséquences, alternatives quand il y en a
eu, implications).

## Vue d'ensemble

Cette section consigne six décisions, celles que la section 4 a désignées comme difficiles à
défaire, touchant plusieurs briques ou porteuses de compromis peu évidents. Toutes ont été prises
le 2026-10-03, par le fondateur, pendant les changements OpenSpec archivés sous
`openspec/changes/archive/`, dont les `design.md` gardent le détail.

Deux choix structurants n'ont pas d'ADR ici :
- **l'architecture hexagonale**, imposée par `CLAUDE.md` : c'est une contrainte du projet, qui
  relève de la section 2 ;
- **l'absence de toute génération par IA** : c'est un principe produit (`strategy.md`), qui ne sera
  pas rouvert.

Une décision nouvelle donne un nouvel ADR. Un ADR n'est jamais réécrit. Quand une décision
change, l'ancien ADR passe à « Remplacé par ADR-xxx », et le nouveau explique pourquoi.

Les risques créés portent des identifiants RISK-xx, repris dans la section 11.

**Note du 2026-10-03, à propos de l'ADR-004.** Ses conséquences disent que l'objectif 4 n'est pas
atteint. C'était vrai quand il a été écrit, mais ce ne l'est plus : la PR #9 a ajouté trois
contraintes sans toucher aux ports ni aux adaptateurs (sections 1.2 et 10, QS-09). La décision,
elle, ne change pas : le contrat reste interne tant que personne d'autre n'écrit de contrainte.
L'ADR n'est donc ni réécrit ni remplacé.

### Journal des décisions

| ID | Titre | Statut | Date |
|----|-------|--------|------|
| ADR-001 | Tout le calcul dans le navigateur, sans serveur | Acceptée | 2026-10-03 |
| ADR-002 | Étiqueter avec CamemBERT, servi par des tiers | Acceptée | 2026-10-03 |
| ADR-003 | Grammalecte comme lexique unique | Acceptée | 2026-10-03 |
| ADR-004 | Un contrat de plugin interne jusqu'à la troisième contrainte | Acceptée | 2026-10-03 |
| ADR-005 | Réaccorder par des règles de voisinage, sans analyse syntaxique | Acceptée | 2026-10-03 |
| ADR-006 | Deux ports séparés pour la morphologie et les verbes | Acceptée | 2026-10-03 |

---

## ADR-001 : Tout le calcul dans le navigateur, sans serveur

**Statut :** Acceptée

**Date :** 2026-10-03

**Contexte :**
Oulipao reçoit des textes que leur auteur n'a peut-être pas envie de confier à qui que ce soit :
des brouillons, des lettres. Le projet est mené seul, le soir, sans budget ni envie d'exploiter
une machine. La décision a été posée comme condition dès l'essai technique (« tout le traitement
du texte se fait dans le navigateur ; aucune requête ne contient le texte collé »), avant le
choix de tout étiqueteur.

**Décision :**
Tout le traitement (étiquetage, contraintes, rendu) s'exécute dans le navigateur du lecteur. Le
site est un ensemble de fichiers statiques. Il n'y a ni serveur applicatif, ni compte, ni
stockage des textes.

**Conséquences :**

Positives :
- La confidentialité tient par construction : il n'existe aucun endroit où le texte pourrait
  partir.
- Rien à exploiter, à dimensionner ni à sécuriser côté serveur. L'hébergement statique est
  gratuit, et la charge porte sur le processeur du lecteur.
- Le même code tourne sous Node pour les tests et les mesures.

Négatives :
- Chaque lecteur télécharge le modèle et les dictionnaires (environ 141 Mo au premier accès),
  puis les garde en mémoire.
- Aucune sauvegarde : refermer l'onglet fait perdre le travail qui n'a pas été copié.
- La justesse est limitée à ce qu'on peut faire tourner dans un navigateur, en taille de modèle
  comme en analyse.

Pas de tableau des alternatives : un service d'étiquetage hébergé n'a pas été évalué, parce que
la décision était une condition du produit.

**Implications :**
- Briques concernées (→ section 5) : toutes. Interface, Domaine et Adaptateurs forment un seul
  fichier assemblé pour le navigateur ; les Données dérivées sont servies telles quelles.
- Objectifs de qualité servis (→ section 1.2) : objectif 1, `#secure`, directement. Objectif 3,
  `#efficient` : aucun aller-retour réseau à chaque geste.
- Contrainte créée (→ section 2) : tout composant doit pouvoir s'exécuter dans un navigateur
  (ES2022, WASM) et sous Node.
- Risques créés (→ section 11) : RISK-04, perte du texte faute de sauvegarde.

---

## ADR-002 : Étiqueter avec CamemBERT, servi par des tiers

**Statut :** Acceptée

**Date :** 2026-10-03

**Contexte :**
Les contraintes visent une piste grammaticale. Un mot mal classé est donc remplacé à tort, ou
laissé à tort. L'essai technique s'était fixé un seuil, avant toute mesure : au moins 9 mots sur
10 bien classés sur chacun des trois textes de référence annotés à la main. Trois approches ont
été mesurées derrière le même contrat (`Tagger`, I-01).

**Décision :**
Étiqueter avec le modèle `Xenova/french-camembert-postag-model`, exécuté par Transformers.js en
WASM. En v1, la bibliothèque est chargée depuis jsDelivr (version 4.3.0, épinglée) et les poids
depuis Hugging Face.

**Conséquences :**

Positives :
- 96,5 % des mots bien classés sur l'ensemble, et 95,0 % sur le texte le plus difficile : seul ce
  modèle tient le seuil, y compris sur les seuls mots de contenu.
- Le modèle tourne localement : l'ADR-001 est respecté.
- Les autres étiqueteurs restent branchés derrière le même port, sur la page d'essai.

Négatives :
- Environ 141 Mo au premier accès, et 20,5 s pour le premier étiquetage, téléchargement compris.
  Ensuite, 1,5 s par texte de 200 mots.
- La page dépend de deux tiers à chaque premier accès, sans engagement de service.
- Le code chargé de jsDelivr ne fait l'objet d'aucune vérification d'intégrité (SRI).
- La licence du modèle n'est pas déclarée. Elle ne bloque pas tant qu'Oulipao ne redistribue pas
  le modèle, mais elle bloquera dès qu'on voudra l'héberger soi-même.

**Alternatives envisagées :**

| Alternative | Raison du rejet |
|-------------|-----------------|
| Consultation du lexique seule | 88,7 % sur l'ensemble et 81,6 % sur les mots de contenu : sous le seuil, faute de contexte pour lever les ambiguïtés (« ferme », « porte », « été »). |
| fr-compromise, des règles contextuelles | 81,0 % sur l'ensemble : sous le seuil. Gardé sur la page d'essai pour comparaison. |
| Héberger soi-même la bibliothèque et les poids | Pas rejeté mais reporté (`TODOS.md`) : 141 Mo à servir, et une licence à établir avant de redistribuer. |

**Implications :**
- Briques concernées (→ section 5) : Adaptateurs (`taggers/`) ; Interface (préchargement et
  état du modèle).
- Objectifs de qualité servis (→ section 1.2) : objectif 2, `#suitable`. Il pèse sur
  l'objectif 3, `#efficient`, au premier accès.
- Contrainte créée (→ section 2) : le site exige un navigateur qui exécute WebAssembly.
- Risques créés (→ section 11) :
  - RISK-01, indisponibilité de jsDelivr ou de Hugging Face ;
  - RISK-02, code tiers chargé sans SRI ;
  - RISK-03, licence du modèle non déclarée.

---

## ADR-003 : Grammalecte comme lexique unique

**Statut :** Acceptée

**Date :** 2026-10-03

**Contexte :**
Les contraintes ont besoin d'un dictionnaire du français :
- des lemmes ordonnés, entre lesquels le S+7 se déplace ;
- les formes, avec leur genre et leur nombre, pour réaccorder ;
- les verbes conjugués ;
- les marques d'élision.

Ce lexique doit pouvoir être redistribué dans un dépôt public et servi au navigateur. Cinq
lexiques ont été recensés le 2026-10-03 (`docs/lexiques.md`).

**Décision :**
Dériver les trois fichiers de données d'Oulipao (`lexique-oulipao.tsv`, `morpho-oulipao.tsv` et
`verbes-oulipao.tsv`) du seul lexique Grammalecte v7.7 (MPL 2.0). Le lexique complet reste hors du
dépôt. Les fichiers dérivés restent sous MPL 2.0 et portent leur notice.

**Conséquences :**

Positives :
- 54 233 lemmes de noms avec genre, et le genre et le nombre sur chaque forme : bien au-delà des
  20 000 lemmes demandés.
- Une marque explicite du h aspiré et des mots qui refusent l'élision (note `pel`), que l'élision
  exige.
- La MPL 2.0 est un copyleft au niveau du fichier : seuls les dérivés restent sous MPL, et le
  reste du dépôt peut être sous MIT.
- C'est le seul des cinq lexiques examinés qui soit encore maintenu.

Négatives :
- Le dictionnaire d'Oulipao est celui d'un correcteur orthographique : il contient des mots
  rares, grossiers ou mal formés. Le fondateur a confirmé qu'on les garde tous.
- Une seule source : ses erreurs et ses trous deviennent ceux d'Oulipao, sans recoupement possible.
- La dérivation est manuelle et reste sur le poste du mainteneur : le lexique brut (55 Mo) n'est
  pas versionné.

**Alternatives envisagées :**

| Alternative | Raison du rejet |
|-------------|-----------------|
| Lexique 3.83 | Figé depuis 2019, 30 567 lemmes seulement. Licence CC BY-SA 4.0, avec une anomalie : un lien de la page française pointe vers BY-NC. |
| GLÀFF 1.2.2 | Figé depuis 2017. CC BY-SA 3.0, qui imposerait le partage à l'identique. Formes simples seulement. |
| Morphalou 3.1 | Plus de lemmes (102 237), mais figé depuis 2016, et sous LGPL-LR (dérivés sous LGPL-LR, modifications datées). |
| Lefff 3.5 | Sous LGPL-LR, 41 947 lemmes, dernier commit en 2022, 96 Mo de JSON. |

**Implications :**
- Briques concernées (→ section 5) : Outils (dérivation), Données dérivées, Adaptateurs
  (`morphology/`, `lexicon/`).
- Objectifs de qualité servis (→ section 1.2) : objectif 2, `#suitable`.
- Contrainte créée (→ section 2) : tout fichier dérivé reste sous MPL 2.0 et doit figurer dans
  `THIRD_PARTY_LICENSES.md`.
- Risques créés (→ section 11) : RISK-07, version d'adresse des fichiers dérivés mise à jour à la
  main.

---

## ADR-004 : Un contrat de plugin interne jusqu'à la troisième contrainte

**Statut :** Acceptée

**Date :** 2026-10-03

**Contexte :**
La vision d'Oulipao est un écosystème de contraintes écrites par d'autres. Mais aujourd'hui, il
n'existe que deux contraintes (S+7 et lipogramme), et personne d'autre que le fondateur n'en
écrit. Or un format publié se paie : il faut le versionner, le documenter, garder la
compatibilité, et isoler le code tiers dans un bac à sable.

**Décision :**
Le contrat entre l'hôte et une contrainte (`src/domain/plugin.ts` et `plugin-chain.ts`, I-05) est
interne : il n'est ni versionné ni publié. On ouvrira un format quand trois contraintes existeront
et que quelqu'un d'autre voudra en écrire une.

**Conséquences :**

Positives :
- Le contrat peut changer librement pendant qu'on apprend ce qu'une contrainte demande vraiment.
  L'ajout du lipogramme l'a déjà fait évoluer : portée par mot, ressources, retrait de mots.
- Pas de bac à sable ni d'API à maintenir pour un public qui n'existe pas.

Négatives :
- Ajouter une contrainte touche encore plusieurs briques. Le lipogramme a étendu un port et deux
  adaptateurs, et le registre `installedPlugins` vit dans l'Interface. L'objectif 4 n'est donc pas
  atteint.
- L'autrice de plugins de la section 1.3 n'a rien sur quoi s'appuyer.

**Alternatives envisagées :**

| Alternative | Raison du rejet |
|-------------|-----------------|
| Publier dès maintenant un format de plugin versionné, avec un bac à sable | Prématuré avec deux contraintes et aucun auteur extérieur. Écarté par la stratégie (« Not un format de plugin publié ni un bac à sable »), à revoir quand quelqu'un d'autre voudra écrire un plugin. |

**Implications :**
- Briques concernées (→ section 5) : Domaine (contrat et chaîne), Interface (registre, rack).
- Objectifs de qualité servis (→ section 1.2) : l'objectif 4, `#flexible`, est visé mais pas
  atteint.
- Contrainte créée (→ section 2) : aucune.
- Risques créés (→ section 11) : RISK-05, ajouter une contrainte oblige à toucher plusieurs
  briques.

---

## ADR-005 : Réaccorder par des règles de voisinage, sans analyse syntaxique

**Statut :** Acceptée

**Date :** 2026-10-03

**Contexte :**
Remplacer « horloge » par un nom masculin casse l'accord du déterminant, des adjectifs, de
l'attribut et du participe. Un S+7 qui laisse « la vieille sablier » n'est plus du français, et
l'objectif 2 demande au moins 9 substitutions sur 10 accordées. Une analyse syntaxique complète
du français n'existe pas sous une forme qu'on puisse charger dans le navigateur à côté du modèle
d'étiquetage.

**Décision :**
Réaccorder par des règles de voisinage (`src/domain/s7/syntax.ts`, `agreement.ts`). Elles
couvrent le déterminant et les épithètes contigus, les adjectifs coordonnés ou apposés,
l'attribut après un verbe d'état, le participe après « être », et le pronom sujet de reprise
quand son antécédent est sans ambiguïté. Les règles sont prudentes : là où une erreur
créerait une faute absente de l'original, elles laissent le mot tel quel. Le mode « réaccord »
est le réglage par défaut. Un second mode, « parmi les noms de même genre », reste proposé : il
évite d'avoir à réaccorder.

**Conséquences :**

Positives :
- Le seuil est tenu : au moins 9 substitutions sur 10 sont accordées sur les textes de référence
  (décompte validé par le fondateur).
- Les règles sont pures, déterministes et testées par des ports factices ; chaque mot laissé
  porte sa raison, que l'inspecteur affiche.

Négatives :
- Les accords à distance (relatives, inversions, antécédents ambigus) restent faux ou ne sont pas
  faits.
- Une erreur d'étiquetage en amont, environ 1 mot sur 30, se propage dans l'accord.
- Chaque nouveau cas est une règle de plus à écrire et à tester.

**Alternatives envisagées :**

| Alternative | Raison du rejet |
|-------------|-----------------|
| Choisir le n-ième nom de même genre (mode `same-gender`), ce qui rend le réaccord inutile | Ce n'est plus le S+7 de l'Oulipo : le saut ne se fait plus dans tout le dictionnaire. Le mode est gardé comme réglage, pas comme comportement par défaut. |
| Analyse syntaxique complète (analyse en dépendances) | Aucune ne se charge dans le navigateur avec un poids raisonnable à côté du modèle d'étiquetage. Contraire à l'ADR-001 si elle tournait sur un serveur. |

**Implications :**
- Briques concernées (→ section 5) : Domaine (`s7/`, réutilisé par `lipogram/`).
- Objectifs de qualité servis (→ section 1.2) : objectif 2, `#suitable`.
- Contrainte créée (→ section 2) : aucune.
- Risques créés (→ section 11) : RISK-06, des fautes d'accord hors du voisinage immédiat, et des
  erreurs d'étiquetage qui se propagent.

---

## ADR-006 : Deux ports séparés pour la morphologie et les verbes

**Statut :** Acceptée

**Date :** 2026-10-03

**Contexte :**
Le fichier des verbes fait 18,7 Mo, soit 2,8 Mo transférés. Il ne sert qu'aux contraintes qui
visent la piste des verbes. On veut donc le charger à la demande, après la morphologie des noms
et des adjectifs, qui arrive à l'ouverture.

**Décision :**
Créer un port à part, `VerbRepository` (I-03), à côté de `MorphologyRepository` (I-02). Les
ressources des contraintes gagnent un champ facultatif `verbs?`, et l'Interface charge les verbes
la première fois qu'une instance active vise leur piste.

**Conséquences :**

Positives :
- Chaque objet reste immuable une fois construit : aucune méthode ne change de réponse selon
  l'avancement du chargement.
- Qui ne vise pas les verbes ne télécharge pas leur fichier.

Négatives :
- Un port, un adaptateur et un chargeur de plus à câbler. Les contraintes doivent aussi traiter
  l'absence des verbes : elles laissent le mot avec la raison « conjugaisons en cours de
  chargement ».

**Alternatives envisagées :**

| Alternative | Raison du rejet |
|-------------|-----------------|
| Étendre `MorphologyRepository` avec des méthodes de verbes qui rendent un résultat vide tant que rien n'est chargé | Plus simple à câbler, mais l'état caché brouille les tests et les raisons affichées. |
| Tout charger d'un coup à l'ouverture | Plusieurs mégaoctets transférés pour tous, même pour qui ne touche jamais aux verbes. |

**Implications :**
- Briques concernées (→ section 5) : Domaine (port et ressources), Adaptateurs (`morphology/`),
  Interface (chargeur), Données dérivées (`verbes-oulipao.tsv`).
- Objectifs de qualité servis (→ section 1.2) : objectif 3, `#efficient`, pour le premier
  chargement.
- Contrainte créée (→ section 2) : aucune.
- Risques créés (→ section 11) : RISK-07, version d'adresse mise à jour à la main (partagé avec
  l'ADR-003).
