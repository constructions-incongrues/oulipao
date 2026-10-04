# 11. Risques et dette technique

**Niveau de détail :** ESSENTIAL (matrice, puis une fiche par risque ; la dette tient dans la
matrice et dans une courte liste).

## Vue d'ensemble

Cette section suit onze risques et deux dettes. Les risques RISK-01 à RISK-07, RISK-10 et
RISK-11 viennent des champs « Risques créés » des ADR (section 9) ; les deux derniers, de
l'ADR-007 (textbank phonétique). RISK-08 et RISK-09 viennent d'objectifs de qualité
qui ne sont pas encore tenus ou pas encore vérifiés : ce sont les scénarios QS-06 et QS-11
(section 10.3). QS-02, qui relevait de RISK-02, est tenu depuis la politique de sécurité du contenu. Les deux dettes ont été relevées en écrivant les sections 6 et 5.

Aucun risque n'est critique. Trois sont de priorité haute :
- **RISK-01 :** la dépendance à deux distributeurs tiers ;
- **RISK-03 :** la licence du modèle ;
- **RISK-04 :** la perte du texte faute de sauvegarde.

RISK-11 (des filtres de rime trop lents) est passé de haute à basse le 2026-10-03, avec l'index
des rimes (changement OpenSpec `index-des-rimes`).

RISK-05 (le coût d'une nouvelle contrainte) est passé de haute à moyenne le 2026-10-03 : trois
contraintes ont été ajoutées sans toucher aux ports ni aux adaptateurs.

Deux d'entre eux (RISK-03 et RISK-04) sont acceptés pour la v1, chacun avec sa raison.

Le premier risque du projet n'est pas technique. La stratégie (`strategy.md`) le nomme
« construire au lieu d'écrire » : chaque soirée part dans une nouvelle fonction, et aucun texte
n'est gardé. Il est suivi là-bas, avec son déclencheur : trois semaines sans texte gardé alors que
des commits continuent.

Les identifiants sont définitifs. Un élément résolu passe à « Clos » ; il n'est ni retiré ni
renuméroté.

---

## 11.1 Matrice des risques et de la dette

*Classée par priorité, de la plus haute à la plus basse. Priorité = probabilité × impact, selon
le tableau du toolkit.*

| ID | Titre | Type | Probabilité | Impact | Priorité | Statut |
|----|-------|------|-------------|--------|----------|--------|
| RISK-01 | jsDelivr ou Hugging Face indisponible, ou le modèle retiré | Dépendance | Moyenne | Haut | Haute | Ouvert |
| RISK-03 | Licence du modèle d'étiquetage non déclarée | Données et conformité | Haute | Moyen | Haute | Accepté |
| RISK-04 | Le texte est perdu quand l'onglet se ferme | Données | Haute | Moyen | Haute | Accepté |
| RISK-05 | Ajouter une contrainte oblige à toucher plusieurs briques | Architecture | Moyenne | Moyen | Moyenne | Ouvert |
| RISK-06 | Fautes d'accord hors du voisinage, et erreurs d'étiquetage propagées | Architecture | Haute | Bas | Moyenne | Accepté |
| RISK-08 | Le réglage en direct est proche de la limite de 100 ms | Architecture | Basse | Moyen | Basse | Atténué |
| RISK-09 | Usage au clavier et affichage à 375 px non revérifiés | Architecture | Moyenne | Moyen | Moyenne | Ouvert |
| RISK-10 | Des rimes fausses : prononciations devinées, justesse pas encore relue | Données | Moyenne | Moyen | Moyenne | Ouvert |
| RISK-02 | Code tiers chargé sans vérification d'intégrité | Sécurité | Basse | Moyen | Basse | Atténué |
| RISK-11 | Les filtres de rime sont plus lents que le réglage en direct ne le permet | Architecture | Basse | Moyen | Basse | Atténué |
| RISK-07 | Version d'adresse des fichiers dérivés mise à jour à la main | Intégration | Moyenne | Bas | Basse | Ouvert |
| DEBT-01 | Un préchargement raté arrête la mise en pistes sans message propre | Accidentelle | — | Bas | Basse | Ouvert |
| DEBT-02 | Le découpage en mots garde les mots composés d'un seul tenant | Délibérée | — | Bas | Basse | Ouvert |

---

## 11.2 Risques techniques

### RISK-01 : jsDelivr ou Hugging Face indisponible, ou le modèle retiré

| Attribut | Valeur |
|----------|--------|
| **Type** | Dépendance |
| **Description** | Si jsDelivr ne sert plus Transformers.js, ou si Hugging Face ne sert plus les poids (panne, changement d'adresse, dépôt `Xenova/…` supprimé par son auteur), aucune mise en pistes n'est possible. |
| **Probabilité** | Moyenne. Les pannes sont rares, mais le modèle appartient à un compte tiers, sans engagement. Hugging Face a déjà changé sa façon de servir les fichiers (redirection vers `*.hf.co`). |
| **Impact** | Haut : la fonction principale est perdue. |
| **Priorité** | Haute |
| **Mitigation** | Actuelle : l'échec s'affiche, et on peut relancer (section 6.4). Prévue : héberger la bibliothèque et les poids avec le site (`TODOS.md`). C'est subordonné à RISK-03. |
| **Statut** | Ouvert |

**Contexte :** l'ADR-002 accepte les deux tiers pour la v1. La version de la bibliothèque est
épinglée (4.3.0) ; celle des poids ne l'est pas, car l'adresse vise la branche `main` du dépôt.

### RISK-03 : licence du modèle d'étiquetage non déclarée

| Attribut | Valeur |
|----------|--------|
| **Type** | Données et conformité |
| **Description** | `Xenova/french-camembert-postag-model` ne déclare aucune licence. On ne sait pas si l'on a le droit de le redistribuer. |
| **Probabilité** | Haute que la question reste ouverte, puisque rien ne la fait avancer d'elle-même. |
| **Impact** | Moyen. Ce n'est pas bloquant tant qu'Oulipao ne fait que pointer vers Hugging Face, mais cela bloque la mitigation de RISK-01. Si la redistribution est interdite, il faudra un autre modèle, ou en entraîner un. |
| **Priorité** | Haute |
| **Mitigation** | Aucune pour l'instant. `THIRD_PARTY_LICENSES.md` déclare la licence comme inconnue. |
| **Statut** | Accepté pour la v1, par le fondateur (`design.md` de la mise en ligne, 2026-10-03) : le site ne redistribue pas le modèle. À rouvrir avant tout hébergement des poids. |

**Contexte :** ADR-002.

### RISK-04 : le texte est perdu quand l'onglet se ferme

| Attribut | Valeur |
|----------|--------|
| **Type** | Données |
| **Description** | Rien n'est sauvegardé : ni le texte, ni la chaîne, ni ses réglages. Refermer ou recharger l'onglet fait perdre ce qui n'a pas été copié. |
| **Probabilité** | Haute : c'est l'usage ordinaire d'un navigateur. |
| **Impact** | Moyen : une séance d'écriture est perdue ; les textes gardés ont été copiés. |
| **Priorité** | Haute |
| **Mitigation** | Le bouton de copie joint au texte la mention de la chaîne, ce qui permet de la refaire à la main. |
| **Statut** | Accepté : « comptes, sauvegarde de projets » sont hors des objectifs du trimestre, à revoir « quand le fondateur perd un travail faute de sauvegarde » (`objectives.md`). Une sauvegarde locale dans le navigateur respecterait l'ADR-001. |

**Contexte :** ADR-001.

### RISK-05 : ajouter une contrainte oblige à toucher plusieurs briques

| Attribut | Valeur |
|----------|--------|
| **Type** | Architecture |
| **Description** | Le lipogramme a dû étendre le port `MorphologyRepository`, deux adaptateurs et l'Interface. Les trois contraintes suivantes (tri par piste, bord, mise en vers, PR #9) n'ont touché que leurs répertoires du Domaine, le contrat partagé et l'Interface : le registre `installedPlugins`, le rack et les recettes. Une contrainte qui demande au dictionnaire des données qu'il n'offre pas encore touchera de nouveau un port et un adaptateur. |
| **Probabilité** | Moyenne : les contraintes de forme (retrait, lignes) n'ont besoin d'aucune donnée nouvelle ; les contraintes lexicales en auront parfois besoin. *Révisée le 2026-10-03 (elle était haute).* |
| **Impact** | Moyen : le travail est plus lent et plus risqué pour un projet mené seul. Le registre et les recettes dans l'Interface restent un passage obligé. |
| **Priorité** | Moyenne |
| **Mitigation** | Le test de l'objectif 4 a réussi avec la troisième contrainte, puis la quatrième et la cinquième. Reste à prévoir : dans le Domaine, un registre qui évite de modifier l'Interface pour chaque type. |
| **Statut** | Ouvert |

**Contexte :** ADR-004 ; objectif 4 de la section 1.2. La PR #26 l'a confirmé pour une contrainte
lexicale : les filtres de rime ont demandé un port (I-06) et deux adaptateurs, comme prévu.

### RISK-06 : fautes d'accord hors du voisinage, et erreurs d'étiquetage propagées

| Attribut | Valeur |
|----------|--------|
| **Type** | Architecture |
| **Description** | Les règles de voisinage ne couvrent pas les accords à distance : relatives, inversions, antécédents ambigus. Un mot mal étiqueté, environ 1 sur 30, est remplacé ou accordé à tort. |
| **Probabilité** | Haute : cela arrive dans presque tout texte un peu long. |
| **Impact** | Bas : le seuil de 9 substitutions sur 10 accordées est tenu, et l'inspecteur dit pourquoi un mot a été laissé. |
| **Priorité** | Moyenne |
| **Mitigation** | Règles prudentes : un mot reste tel quel plutôt que de recevoir une faute absente de l'original. Les textes de référence servent de mesure de non-régression, relancée à la main (`npm run measure`), pas en CI. |
| **Statut** | Accepté (ADR-005) : une analyse syntaxique complète n'a pas sa place dans le navigateur. |

**Contexte :** ADR-005 ; objectif 2 de la section 1.2.

### RISK-08 : le réglage en direct est proche de la limite de 100 ms

| Attribut | Valeur |
|----------|--------|
| **Type** | Architecture |
| **Description** | Sous Node, avec trois contraintes enchaînées, le texte de référence 2 prend 69 ms au 95e percentile, avec un maximum de 91 ms, contre 7 ms pour les deux autres textes. Rien n'a été mesuré dans un navigateur, ni sur un texte plus long ou une chaîne plus longue. |
| **Probabilité** | Basse depuis le 2026-10-04 (chaînes du banc sous 7 ms sous Node) ; elle était moyenne : un navigateur, un téléphone ou un texte de 400 mots peut faire passer le seuil. |
| **Impact** | Moyen : le réglage cesse de paraître immédiat, ce qui est la promesse de la métaphore de la table. |
| **Priorité** | Basse |
| **Mitigation** | Faite (changement `correctifs-domaine`, 2026-10-04) : le suspect était bien la recherche du voisin, et d'abord celle des verbes, qui faisait le tour des infinitifs. Le lipogramme ne visite plus que les formes qui évitent ses lettres (calculées une fois par jeu de lettres, sur des formes nues calculées une fois par dictionnaire), et la chaîne relit les textes en temps linéaire. Banc de référence (`node scripts/chain-golden.ts --time`, Node, p95) : lipogramme en « e » sur le texte 2, 240 → 6 ms ; lettres permises, 444 → 7 ms ; toutes les chaînes du banc sous 7 ms. Prix : environ 0,7 s à la première utilisation du lipogramme dans une session, puis environ 0,1 s par nouveau jeu de lettres. Une chaîne de mise en page sur 40 000 mots passe de 6,2 s à 0,2 s. Reste : mesurer dans le navigateur et sur un téléphone. |
| **Statut** | Atténué : reste à mesurer dans un navigateur et sur un téléphone. |

**Contexte :** objectif 3 de la section 1.2 ; section 6.3.

### RISK-09 : usage au clavier et affichage à 375 px non revérifiés

| Attribut | Valeur |
|----------|--------|
| **Type** | Architecture |
| **Description** | Les contrastes et la distinction en daltonisme sont vérifiés par `check:palette` à chaque exécution. L'usage de tous les gestes au clavier et l'absence de défilement horizontal à 375 px ont été vérifiés une fois (`DESIGN.md`), mais pas depuis l'ajout de l'inspecteur, de la grille et des filtres instanciables. Aucun test ne les garde. |
| **Probabilité** | Moyenne : l'interface a beaucoup changé depuis. |
| **Impact** | Moyen : l'objectif 5 est peut-être déjà rompu sans qu'on le sache. |
| **Priorité** | Moyenne |
| **Mitigation** | Prévue : refaire une vérification à 375, 768 et 1440 px et au clavier seul. Ajouter un test qui vérifie les noms accessibles des composants rendus en texte. |
| **Statut** | Ouvert |

**Contexte :** objectif 5 de la section 1.2.

### RISK-10 : des rimes fausses

| Attribut | Valeur |
|----------|--------|
| **Type** | Données |
| **Description** | 19,6 % des formes de Grammalecte sont absentes de GLÀFF et reçoivent une prononciation devinée par des règles, donc une rime plausible mais pas sûre. Les prononciations du Wiktionnaire peuvent elles-mêmes manquer pour une forme fléchie. La justesse des rimes (9 sur 10, sur trois textes de 200 mots au R+7) n'est pas encore relue. |
| **Probabilité** | Moyenne : GLÀFF couvre quatre formes sur cinq, et les noms composés devinés sont rarement en fin de vers. |
| **Impact** | Moyen : une rime fausse défait la contrainte elle-même. L'objectif 2 n'est pas encore vérifié pour les rimes. |
| **Priorité** | Moyenne |
| **Mitigation** | Un mot dont la prononciation est devinée porte la raison « prononciation devinée », et l'inspecteur la montre. Prévue : la relecture des rimes par le fondateur (tâche 10.2 de la textbank). |
| **Statut** | Ouvert |

**Contexte :** ADR-007 ; objectif 2 de la section 1.2.

### RISK-02 : code tiers chargé sans vérification d'intégrité

| Attribut | Valeur |
|----------|--------|
| **Type** | Sécurité |
| **Description** | Transformers.js est importé depuis jsDelivr par un `import()` dynamique, sans SRI. Un fichier altéré chez le distributeur s'exécuterait dans la page. Il pourrait alors lire le texte. Depuis le 2026-10-03, la politique de sécurité du contenu l'empêche de l'envoyer ailleurs que vers le site, jsDelivr ou Hugging Face. Il pourrait encore viser ces hôtes-là, ou fausser l'étiquetage. |
| **Probabilité** | Basse : la version est épinglée, et les paquets npm publiés ne sont pas modifiables. |
| **Impact** | Moyen, depuis la CSP : l'envoi vers un hôte quelconque est bloqué, il ne reste que les hôtes autorisés, qui sont des distributeurs en lecture. *Révisé le 2026-10-03 (il était haut).* |
| **Priorité** | Basse |
| **Mitigation** | Faite : une politique de sécurité du contenu borne `connect-src` aux trois fournisseurs (spec `mise-en-ligne`, QS-02). Prévue : héberger la bibliothèque avec le site (voir RISK-01), ou déclarer son empreinte dans une carte d'import (`<script type="importmap">` avec `integrity`). |
| **Statut** | Atténué : reste ouvert tant qu'il n'y a pas de SRI. |

**Contexte :** ADR-002 ; sections 7.1 et 8.2.

### RISK-11 : les filtres de rime sont plus lents que le réglage en direct ne le permet

| Attribut | Valeur |
|----------|--------|
| **Type** | Architecture |
| **Description** | Pour trouver le n-ième voisin qui rime, le moteur parcourait tout le dictionnaire d'une catégorie (environ 54 000 noms), en prononçant chaque candidat. Mesuré le 2026-10-03 sous Node, sur les trois textes de référence de 200 mots, toutes les pistes, au 95e percentile : R+1 de 0,3 à 1,1 s, R+3 de 1,2 à 1,7 s, homophonies de 2,8 à 4,0 s. |
| **Probabilité** | Basse depuis l'index des rimes : R+1 de 27 à 87 ms, R+3 de 57 à 89 ms, homophonies de 5 à 6 ms, dans les mêmes conditions. Dans le navigateur, un changement de décalage d'un R+n sur toutes les pistes d'un poème de quatre vers prend de 23 à 82 ms. Les filtres de vers de #33 (monorime, schéma de rimes, antérime, rime berrychonne), qui dépassaient jusqu'à 1,2 s en vers, passent de 0,4 à 19 ms depuis le changement `index-des-rimes-vers`. Le R+7 par défaut, irrégulier en vers (56 à 237 ms), passe de 6 à 17 ms depuis l'index des finales : le coût venait des mots qui ne pouvaient pas rimer à la richesse demandée. *Révisée le 2026-10-03 (elle était haute).* |
| **Impact** | Moyen : le réglage cesserait de paraître immédiat dès qu'un filtre de rime est dans la chaîne (objectif 3, QS-06). |
| **Priorité** | Basse |
| **Mitigation** | Faite : la dérivation écrit une prononciation pour chaque forme candidate, y compris empruntée ou devinée. La textbank rend les formes d'une rime (`rhyming`), et la recherche du voisin ne visite que leurs lemmes, dont les positions sont gardées d'un passage à l'autre. Les sorties sont identiques mot à mot sur les textes de référence. Pour les verbes, les candidates sont aussi filtrées par le temps et la personne. Les filtres qui exigent une richesse ne prennent que les formes qui partagent la finale exigée, et un mot trop court pour rimer n'en a aucune (index des finales). Faite aussi (changement `correctifs-donnees`, 2026-10-04) : la textbank garde chaque prononciation en chaîne et ne l'analyse qu'à la demande ; son chargement retient 185 Mo au lieu de 611 Mo, pour 2,4 s au lieu de 3,2 s sous Node, et un test borne la mémoire à 250 Mo sur le fichier réel. Reste : le premier passage d'un filtre de rime dans une session coûte jusqu'à 244 ms ; le cas « ne rime plus » du schéma de rimes et l'antirime parcourent encore tout le dictionnaire. |
| **Statut** | Atténué : la cible tient sous Node et dans le navigateur. Reste à mesurer sur un téléphone (RISK-08). |

**Contexte :** ADR-007 ; objectif 3 de la section 1.2 ; voisin de RISK-08.

### RISK-07 : version d'adresse des fichiers dérivés mise à jour à la main

| Attribut | Valeur |
|----------|--------|
| **Type** | Intégration |
| **Description** | `MORPHOLOGY_VERSION`, `VERBS_VERSION` et `PHONETICS_VERSION` (`src/ui/composition.ts`) doivent changer à chaque régénération des données. Un oubli peut servir un dictionnaire plus ancien que le code qui le lit. |
| **Probabilité** | Moyenne : l'étape est manuelle, et rien ne la vérifie. |
| **Impact** | Bas : GitHub Pages sert ces fichiers avec `cache-control: max-age=600` et un `etag`. L'ancienne copie ne survit donc pas plus de dix minutes (vérifié le 2026-10-03). |
| **Priorité** | Basse |
| **Mitigation** | Possible : dériver la version d'une empreinte du fichier au moment de `build:site`. |
| **Statut** | Ouvert |

**Contexte :** ADR-003 et ADR-006 ; section 7.1, « Réplication et mise à l'échelle ».

---

## 11.3 Dette technique

| ID | Brique (section 5) | Ce qui manque | Conséquence | Correction |
|----|--------------------|---------------|-------------|------------|
| DEBT-01 | Interface | Si le préchargement échoue pendant une mise en pistes, celle-ci s'arrête sans message propre. Seul l'état d'erreur du modèle s'affiche (section 6.2). Dette accidentelle. | Le lecteur ne sait pas que sa demande a été abandonnée, ni qu'il doit relancer. | Afficher un message dans la zone de saisie ; quelques lignes dans le contrôleur et un test. |
| DEBT-02 | Domaine | Le découpage en mots suit des règles minimales : « peut-être » et « porte-monnaie » restent un seul mot (commentaire `ponytail:` de `tokenizer.ts`). Dette délibérée. | Ces mots échappent aux contraintes, ou sont mal étiquetés. | À affiner « si la mesure le montre » : ajouter des mots composés aux textes de référence, puis découper selon le lexique. Moins d'un jour. |
