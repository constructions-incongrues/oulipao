# 11. Risques et dette technique

**Niveau de détail :** ESSENTIAL (matrice, puis une fiche par risque ; la dette tient dans la
matrice et dans une courte liste).

## Vue d'ensemble

Cette section suit neuf risques et deux dettes. Les risques RISK-01 à RISK-07 viennent des
champs « Risques créés » des ADR (section 9). RISK-08 et RISK-09 viennent d'objectifs de qualité
qui ne sont pas encore tenus ou pas encore vérifiés : ce sont les scénarios QS-06 et QS-11
(section 10.3). Le troisième scénario non tenu, QS-02, relève de RISK-02. Les deux dettes ont été relevées en écrivant les sections 6 et 5.

Aucun risque n'est critique. Trois sont de priorité haute :
- **RISK-01 :** la dépendance à deux distributeurs tiers ;
- **RISK-03 :** la licence du modèle ;
- **RISK-04 :** la perte du texte faute de sauvegarde.

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
| RISK-02 | Code tiers chargé sans vérification d'intégrité | Sécurité | Basse | Haut | Moyenne | Ouvert |
| RISK-06 | Fautes d'accord hors du voisinage, et erreurs d'étiquetage propagées | Architecture | Haute | Bas | Moyenne | Accepté |
| RISK-08 | Le réglage en direct est proche de la limite de 100 ms | Architecture | Moyenne | Moyen | Moyenne | Ouvert |
| RISK-09 | Usage au clavier et affichage à 375 px non revérifiés | Architecture | Moyenne | Moyen | Moyenne | Ouvert |
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

**Contexte :** ADR-004 ; objectif 4 de la section 1.2.

### RISK-02 : code tiers chargé sans vérification d'intégrité

| Attribut | Valeur |
|----------|--------|
| **Type** | Sécurité |
| **Description** | Transformers.js est importé depuis jsDelivr par un `import()` dynamique, sans SRI. Un fichier altéré chez le distributeur s'exécuterait dans la page. Il pourrait alors lire le texte et l'envoyer ailleurs, ce qui casserait l'objectif 1. |
| **Probabilité** | Basse : la version est épinglée, et les paquets npm publiés ne sont pas modifiables. |
| **Impact** | Haut : c'est la promesse de confidentialité qui tombe. |
| **Priorité** | Moyenne |
| **Mitigation** | Prévue : héberger la bibliothèque avec le site (voir RISK-01), ou déclarer son empreinte dans une carte d'import (`<script type="importmap">` avec `integrity`). Une politique de sécurité du contenu (CSP) qui limite `connect-src` aux trois fournisseurs empêcherait aussi l'envoi. |
| **Statut** | Ouvert |

**Contexte :** ADR-002 ; section 7.1, « Réseau et sécurité ».

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
| **Probabilité** | Moyenne : un navigateur, un téléphone ou un texte de 400 mots peut faire passer le seuil. |
| **Impact** | Moyen : le réglage cesse de paraître immédiat, ce qui est la promesse de la métaphore de la table. |
| **Priorité** | Moyenne |
| **Mitigation** | Prévue : mesurer dans le navigateur, et chercher pourquoi le texte 2 est neuf fois plus lent. Une recherche du lipogramme dans les infinitifs est le premier suspect. |
| **Statut** | Ouvert |

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

### RISK-07 : version d'adresse des fichiers dérivés mise à jour à la main

| Attribut | Valeur |
|----------|--------|
| **Type** | Intégration |
| **Description** | `MORPHOLOGY_VERSION` et `VERBS_VERSION` (`src/ui/composition.ts`) doivent changer à chaque régénération des données. Un oubli peut servir un dictionnaire plus ancien que le code qui le lit. |
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
