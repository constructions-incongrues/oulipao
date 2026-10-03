# 4. Stratégie de solution

**Niveau de détail :** ESSENTIAL.

## Vue d'ensemble

Oulipao est un instrument personnel qui tourne entièrement dans le navigateur : le texte du
lecteur ne quitte jamais sa machine, et il n'y a ni serveur à entretenir, ni compte, ni stockage.
Tout le reste découle de ce choix. Le calcul se fait en TypeScript côté client. L'étiquetage
grammatical est confié à un modèle neuronal téléchargé une fois, puis exécuté localement. Les
contraintes puisent dans des dictionnaires statiques dérivés d'un lexique libre.

La difficulté d'Oulipao est dans la langue, pas dans l'interface. Une contrainte appliquée
mécaniquement casse le français : « la horloge », des adjectifs mal accordés. Le cœur de
l'architecture est donc un domaine pur qui sait réaccorder, élider et choisir des mots de même
fonction. Il est testé sans navigateur et isolé derrière des ports, pour qu'on puisse changer
d'étiqueteur ou de dictionnaire sans y toucher.

Le projet est mené seul, le soir et le week-end, avec des agents de code. Le dernier critère de
chaque choix est donc la simplicité d'entretien : un site statique publié par la CI, des tests
qui tournent directement sur les sources, aucun framework lourd.

---

## 4.1 Choix technologiques

| Décision | Choix | Raison |
|----------|-------|--------|
| Lieu d'exécution | Le navigateur seul ; aucun serveur applicatif | Le texte ne doit jamais partir (objectif 1). Sans serveur, il n'y a ni sécurité ni disponibilité à gérer pour un projet mené seul. |
| Langage et typage | TypeScript strict ; entités en schémas zod, types déduits | C'est une contrainte du projet (`CLAUDE.md`). Les schémas valident tout ce qui entre par un adaptateur : la sortie d'un étiqueteur, les lignes d'un dictionnaire, les gestes sur la table. |
| Étiquetage grammatical | CamemBERT (`Xenova/french-camembert-postag-model`) exécuté par Transformers.js en WASM | C'est la seule approche essayée qui tienne le seuil de 9 mots sur 10 sur chacun des textes de référence : 96,5 %, contre 88,7 % pour le lexique seul et 81,0 % pour fr-compromise (`RESULTATS.md`). Le prix : 141 Mo au premier chargement, et un modèle dont la licence n'est pas déclarée. |
| Lexique du français | Grammalecte v7.7 (MPL 2.0), réduit en trois fichiers TSV dérivés | Il peut être redistribué dans un dépôt public, il est encore maintenu, et il compte 54 233 lemmes de noms avec genre et nombre, ainsi que les marques d'élision. C'est le seul des cinq lexiques examinés à être encore maintenu. |
| Interface | Preact et gabarits htm, sans JSX | Les composants restent du TypeScript ordinaire. `node --test` les lit sans étape de compilation et les teste en les rendant en texte (`preact-render-to-string`). |
| Outillage | `tsc --noEmit`, esbuild pour assembler, `node --test` avec un seuil de couverture | Il faut un assemblage, puisque zod est une dépendance d'exécution, mais pas de chaîne de compilation pour les tests. Le seuil de 90 % est vérifié par le lanceur lui-même. |
| Hébergement et publication | GitHub Pages, publié par GitHub Actions à chaque poussée sur `main` ; licence MIT | C'est le choix du fondateur (2026-10-03). L'hébergement est gratuit, il n'y a aucune machine, et un test qui échoue empêche la publication. |
| Génération du texte | Des règles énoncées, appliquées à un dictionnaire ; ni modèle génératif ni tirage aléatoire | « La contrainte est explicite » : chaque mot nouveau doit pouvoir être expliqué, ce que montre l'inspecteur. Ce choix ne sera pas rouvert. |

---

## 4.2 Stratégie de découpage

Le système suit une architecture hexagonale, organisée par préoccupation technique autour d'un
domaine unique. Elle est imposée par `CLAUDE.md`, et elle sert deux objectifs : tester le domaine
avec des ports factices, et remplacer un étiqueteur ou un dictionnaire sans toucher aux
contraintes. Le système se découpe en cinq briques de premier niveau :

- **Interface :** monte les pages, tient l'état de la table et câble les adaptateurs sur les ports.
- **Domaine :** découpe, vérifie l'étiquetage, applique la chaîne de contraintes, réaccorde ; il
  déclare ses besoins sous forme de ports.
- **Adaptateurs :** branchent les ports sur le modèle neuronal, les dictionnaires, `fetch` et
  `node:fs`.
- **Données dérivées :** les trois dictionnaires TSV, servis tels quels.
- **Outils :** les scripts Node qui dérivent les données, mesurent et assemblent le site.

Les dépendances vont toujours de l'extérieur vers le domaine. Voir la section 5 pour la vue des
briques.

---

## 4.3 Approches des objectifs de qualité

| Objectif (section 1.2) | Approche architecturale | Détail |
|------------------------|-------------------------|--------|
| 1. `#secure` Le texte reste dans le navigateur | Aucun serveur applicatif. Le modèle et les dictionnaires sont téléchargés vers le navigateur ; rien ne remonte. Il n'y a aucun traceur. | Sections 3, 6.1 et 7 |
| 2. `#suitable` Un français correct | Le Domaine vérifie le contrat de l'étiqueteur (schéma et alignement mot à mot). Le moteur réaccorde déterminants, adjectifs, attributs et participes par des règles de voisinage, gère l'élision et le h aspiré, et remplace les mots-outils par un mot de même fonction. Trois textes de référence annotés à la main servent de mesure de non-régression, relancée à la main (`npm run measure`), pas en CI. | Sections 5 et 6.2 |
| 3. `#efficient` Un réglage en direct | L'étiquetage, qui est coûteux, est séparé de l'application des contraintes, qui est rapide : un geste rejoue seulement la chaîne en mémoire sur le texte déjà étiqueté. Les verbes sont chargés à la demande, et le modèle est préchargé dès l'ouverture. | Section 6.3 |
| 4. `#flexible` Ajouter une contrainte | Un contrat de plugin interne (réglages déclarés, pistes visées, application), une chaîne qui enchaîne les instances, et des ressources fournies par les ports. Cinq contraintes l'utilisent aujourd'hui ; il reste interne tant que personne d'autre n'en écrit (ADR-004). | Sections 5 (I-05) et 1.2 (état) |
| 5. `#usable` Accessible | Les couleurs sont fixées par des jetons dans `DESIGN.md`, et `check:palette` vérifie les contrastes et la distinction en daltonisme. Les composants exposent un nom accessible et des raccourcis clavier. La mise en page se replie sans défilement horizontal. | `DESIGN.md` ; section 8.9 |

---

## 4.4 Motifs d'architecture principaux

- **Ports et adaptateurs :** sur toute frontière avec le monde réel (étiqueteur, morphologie, verbes,
  source de texte). Le domaine reste pur et testable sans navigateur.
- **Racine de composition :** un seul endroit (`src/ui/composition.ts`) décide quel adaptateur
  sert quel port. Les pages ne construisent rien elles-mêmes.
- **Validation à la frontière :** tout ce qu'un adaptateur fait entrer passe par un schéma zod. Le
  domaine revérifie le contrat de l'étiqueteur au lieu de lui faire confiance.
- **État immuable et réducteur pur :** l'état de la table est un schéma zod, et chaque geste le fait
  évoluer par une fonction pure (`reduce`). Le contrôleur ne fait que relier l'état, la vue et les
  chargements.
- **Chaîne de filtres :** les contraintes sont des instances enchaînées en série, chacune relisant
  la sortie de la précédente comme un texte neuf, avec la trace du mot d'origine pour l'inspecteur.
- **Chargement paresseux qui oublie ses échecs :** le modèle, la morphologie et les verbes sont
  chargés au plus une fois. Un échec n'est pas gardé en mémoire, ce qui permet de relancer.
- **Adresse versionnée :** les fichiers dérivés portent leur version dans l'adresse, parce que le
  cache de GitHub Pages ne se règle pas.

---

## 4.5 Adéquation à l'organisation

Une seule personne écrit, maintient et utilise Oulipao, avec des agents de code. Il n'y a donc pas
de frontière d'équipe à respecter : la loi de Conway ne dit rien ici. Les frontières hexagonales
servent à autre chose. Elles permettent de confier une tâche à un agent sans qu'il ait à
comprendre tout le système, et de vérifier son travail par les tests du domaine. Le risque
d'organisation est ailleurs : la stratégie produit nomme comme premier risque le fait de
« construire au lieu d'écrire ». L'architecture n'y répond pas ; c'est l'objectif du trimestre
(section 1.1) qui le surveille.
