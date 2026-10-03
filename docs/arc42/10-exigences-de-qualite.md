# 10. Exigences de qualité

**Niveau de détail :** ESSENTIAL, plus le tableau des scénarios pas encore tenus (10.3), que la
section 11 reprend. QS-02 en est sorti le 2026-10-03.

## Vue d'ensemble

Cette section détaille en treize scénarios les cinq objectifs de qualité validés de la section 1.2.
Ces scénarios couvrent les propriétés Q42 suivantes : `#secure`, `#suitable`, `#efficient`,
`#flexible` et `#usable`. Chacun a une mesure vérifiable, un environnement et une priorité, et
renvoie au mécanisme qui le réalise (sections 6, 7, 8 et 9) sans le redécrire. Deux scénarios
traitent d'un fonctionnement dégradé : un distributeur indisponible (QS-12), et un code tiers
altéré (QS-02).

Les seuils viennent de la section 1.2 et des specs OpenSpec (`openspec/specs/`). Quand une spec
est moins exigeante que l'objectif, par exemple une demi-seconde contre 100 ms, les deux sont
cités. Les identifiants QS-xx sont définitifs : un scénario abandonné passe à « Retiré », sans
renumérotation.

---

## 10.1 Vue d'ensemble des exigences

| Propriété Q42 | Objectif (1.2) | Scénarios | Remarques |
|---|---|---|---|
| `#secure` | 1 | QS-01, QS-02 | Confidentialité du texte, en marche normale et face à un code tiers altéré |
| `#suitable` | 2 | QS-03, QS-04, QS-05 | Justesse de l'étiquetage et des accords ; refus d'un étiqueteur non conforme |
| `#efficient` | 3 | QS-06, QS-07, QS-08, QS-12 | Réglage en direct, mise en pistes, sobriété au premier accès, reprise après une panne |
| `#flexible` | 4 | QS-09 | Ajout d'une contrainte |
| `#usable` | 5 | QS-10, QS-11, QS-13 | Couleurs, clavier et petits écrans, mouvement réduit |

QS-12 figure sous `#efficient`, faute d'objectif `#reliable` dans la section 1.2 : c'est la
reprise de la page après la panne d'un distributeur.

---

## 10.2 Scénarios de qualité

### QS-01 : le texte ne quitte pas le navigateur

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#secure`, confidentialité |
| **Priorité** | Haute |
| **Source** | Le lecteur |
| **Stimulus** | Il colle un texte, le met en pistes, puis le transforme avec plusieurs contraintes. |
| **Environnement** | Marche normale, site publié, cache vidé, onglet réseau ouvert |
| **Réponse du système** | Tout le traitement se fait dans l'onglet. Les seules requêtes rapportent des fichiers. |
| **Mesure** | Aucune requête ne contient le texte, ni en entier ni en partie. Toutes visent `oulipao.incongru.org`, `cdn.jsdelivr.net`, `huggingface.co` ou `*.hf.co`. Aucun cookie, aucun traceur. |

**Références :** ADR-001 ; sections 7.1 et 8.2 ; spec `mise-en-ligne`, scénario « Session
observée dans l'onglet réseau ».

### QS-02 : un code tiers altéré ne peut pas envoyer le texte

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#secure`, intégrité |
| **Priorité** | Moyenne |
| **Source** | Un attaquant qui contrôle le fichier servi par jsDelivr |
| **Stimulus** | Le module Transformers.js importé tente d'envoyer le texte vers un hôte tiers. |
| **Environnement** | Fonctionnement dégradé : un distributeur compromis |
| **Réponse du système** | Le navigateur refuse la requête : la politique de sécurité du contenu n'admet que les quatre hôtes de QS-01. |
| **Mesure** | Aucune requête ne part vers un hôte hors des quatre de QS-01. Le refus apparaît dans la console. |

**Références :** RISK-02 ; sections 7.1 et 8.2 ; spec `mise-en-ligne`, « Politique de sécurité
du contenu ». **Tenu** depuis le 2026-10-03 : un `fetch` vers `https://example.com` lancé depuis la
page est refusé, et la violation de `connect-src` apparaît dans la console. Le scénario ne couvre
pas un envoi vers l'un des hôtes autorisés, faute de SRI (RISK-02).

### QS-03 : un étiquetage juste

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#suitable`, justesse |
| **Priorité** | Haute |
| **Source** | Le mainteneur |
| **Stimulus** | Il lance `npm run measure` sur les trois textes de référence de 200 mots, annotés à la main avant tout essai. |
| **Environnement** | Marche normale, étiqueteur neuronal |
| **Réponse du système** | Chaque mot reçoit une catégorie, qu'on compare à celle de la référence. |
| **Mesure** | Au moins 9 mots sur 10 bien classés **sur chacun** des trois textes. Mesuré le 2026-10-03 : 97,5 %, 97,0 % et 95,0 % (`RESULTATS.md`). |

**Références :** ADR-002 ; section 8.8. La mesure est relancée à la main, pas en CI.

### QS-04 : un S+7 accordé

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#suitable`, justesse |
| **Priorité** | Haute |
| **Source** | Le mainteneur |
| **Stimulus** | Il lance `npm run transform:references`, puis relit les grilles de `resultats/s7/`. |
| **Environnement** | Marche normale, mode « réaccord » |
| **Réponse du système** | Chaque nom est remplacé ; son déterminant, ses adjectifs, son attribut et son participe sont réaccordés, ou laissés avec leur raison. |
| **Mesure** | Au moins 9 substitutions sur 10 correctes en genre et en nombre, relues à la main sur les trois textes. Atteint, décompte validé par le fondateur. |

**Références :** ADR-005 ; RISK-06.

### QS-05 : un étiqueteur non conforme est refusé

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#suitable`, justesse |
| **Priorité** | Moyenne |
| **Source** | Un adaptateur d'étiquetage |
| **Stimulus** | Il rend un mot de trop ou de moins, un mot différent du découpage, ou une catégorie inconnue. |
| **Environnement** | Fonctionnement dégradé : étiqueteur défaillant |
| **Réponse du système** | Le Domaine refuse la sortie au lieu de la corriger. L'Interface affiche l'échec. |
| **Mesure** | Aucun texte transformé n'est affiché. Le message nomme l'étiqueteur et le mot fautif, et se termine par « Vous pouvez relancer ». C'est couvert par `test/domain/tagging.test.ts` et `test/ui/tracks/controller.test.ts`. |

**Références :** sections 6.2 et 8.4.

### QS-06 : un réglage en direct

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#efficient`, temps de réponse |
| **Priorité** | Haute |
| **Source** | Le lecteur |
| **Stimulus** | Il change un décalage, coupe une piste ou change la lettre interdite. |
| **Environnement** | Marche normale : modèle en cache, texte de 200 mots déjà en pistes, chaîne de trois contraintes |
| **Réponse du système** | La chaîne est rejouée en mémoire sans réétiquetage ; le texte, la grille et l'inspecteur sont mis à jour. |
| **Mesure** | Moins de 100 ms au 95e percentile, dans le navigateur (objectif 3). La spec est moins exigeante : moins d'une demi-seconde, avec cinq filtres (`inspecteur-de-chaine`) ou en changeant de lettre (`lipogramme`). Mesuré le 2026-10-03, sous Node seulement : 7 ms sur les textes 1 et 3, 69 ms sur le texte 2 (91 ms au maximum). |

**Références :** section 6.3 ; RISK-08. **En partie tenu** : aucune mesure dans un navigateur
(voir 10.3).

### QS-07 : une mise en pistes en moins de deux secondes

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#efficient`, temps de réponse |
| **Priorité** | Moyenne |
| **Source** | Le lecteur |
| **Stimulus** | Il colle un texte de 200 mots et lance la mise en pistes. |
| **Environnement** | Marche normale, modèle déjà en cache |
| **Réponse du système** | Étiquetage local, vérification du contrat, application de la chaîne. |
| **Mesure** | Au plus 2 s entre le clic et l'affichage des pistes. Mesuré : 1,5 s sur le texte 3 (`RESULTATS.md`). |

**Références :** section 6.2.

### QS-08 : le premier accès ne télécharge que le nécessaire

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#efficient`, sobriété |
| **Priorité** | Moyenne |
| **Source** | Le lecteur, à sa première visite |
| **Stimulus** | Il ouvre la page, attend sans cliquer, puis met un texte en pistes sans viser les verbes. |
| **Environnement** | Marche normale, cache vide |
| **Réponse du système** | Le modèle et la morphologie arrivent, avec une barre de progression. Les verbes attendent qu'une contrainte active les vise. Avant le premier clic, rien ne part vers un tiers. |
| **Mesure** | `verbes-oulipao.tsv` n'est jamais demandé tant qu'aucune instance active ne vise les verbes. Aucune requête vers jsDelivr ni Hugging Face avant le premier clic, à chaque visite (vérifié le 2026-10-03 : première requête vers `cdn.jsdelivr.net` au moment du clic, 20 s après l'ouverture). Les dictionnaires sont transférés compressés : 2,8 Mo pour 18,7 Mo de verbes. |

**Références :** ADR-006 ; sections 6.1 et 6.3 ; spec `morphologie-des-verbes`.

### QS-09 : ajouter une contrainte sans toucher aux ports

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#flexible`, modifiabilité |
| **Priorité** | Moyenne |
| **Source** | Le fondateur, ou un agent de code |
| **Stimulus** | Il ajoute un type de contrainte qui n'a pas besoin de données nouvelles du dictionnaire. |
| **Environnement** | Développement |
| **Réponse du système** | La contrainte vit dans son répertoire de `src/domain/`, derrière le contrat de plugin, et s'inscrit dans le registre de l'Interface. |
| **Mesure** | Le diff ne touche ni `src/ports/` ni `src/adapters/`, et `npm test` passe avec une couverture d'au moins 90 %. Tenu par la PR #9 : tri par piste, bord et mise en vers, commit `a265b4f`. |

**Références :** ADR-004 ; RISK-05.

### QS-10 : des couleurs lisibles par tous

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#usable`, accessibilité |
| **Priorité** | Moyenne |
| **Source** | Le mainteneur |
| **Stimulus** | Il modifie la palette de `DESIGN.md`, puis lance `npm run check:palette`. |
| **Environnement** | Thèmes clair et sombre |
| **Réponse du système** | Le script calcule chaque contraste, puis l'écart entre les pistes sous trois simulations de daltonisme. |
| **Mesure** | Tout couple texte/fond atteint au moins 4,5:1, et toute paire de pistes un ΔE d'au moins 20 (simulations de Machado 2009). Sinon, le script échoue en nommant la paire fautive. |

**Références :** section 8.9.

### QS-11 : la table au clavier et sur un téléphone

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#usable`, accessibilité |
| **Priorité** | Moyenne |
| **Source** | Un lecteur au clavier seul, ou sur un écran de 375 px |
| **Stimulus** | Il met un texte en pistes, ajoute et réordonne des contraintes, ouvre l'inspecteur et copie le résultat. |
| **Environnement** | Marche normale, à 375, 768 et 1440 px de large |
| **Réponse du système** | Chaque geste a son équivalent au clavier ; la partition revient à la ligne. |
| **Mesure** | Le parcours se fait de bout en bout sans souris. Aucun défilement horizontal aux trois largeurs. |

**Références :** section 8.9 ; RISK-09. **Pas revérifié** depuis les derniers ajouts à
l'interface (voir 10.3).

### QS-12 : la page se relève après la panne d'un distributeur

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#efficient`, reprise (faute d'objectif `#reliable`) |
| **Priorité** | Moyenne |
| **Source** | Hugging Face ou jsDelivr |
| **Stimulus** | Le téléchargement du modèle échoue (réseau coupé, distributeur indisponible), puis revient. |
| **Environnement** | Fonctionnement dégradé, puis rétabli |
| **Réponse du système** | La page affiche l'échec dans une zone `role="alert"`, avec « Relancer ». Le chargeur a oublié l'échec. |
| **Mesure** | Après « Relancer », le modèle se charge sans recharger la page, et une mise en pistes aboutit. La saisie reste intacte entre-temps. C'est couvert par `test/ui/tracks/controller.test.ts` (« relancer recharge vraiment »). |

**Références :** sections 6.4 et 8.4 ; RISK-01.

### QS-13 : aucun mouvement quand le système le demande

| Attribut | Valeur |
|----------|--------|
| **Propriété** | `#usable`, accessibilité |
| **Priorité** | Basse |
| **Source** | Un lecteur dont le système demande de réduire les animations |
| **Stimulus** | Il change un décalage. |
| **Environnement** | Marche normale, `prefers-reduced-motion: reduce` |
| **Réponse du système** | Le texte et la grille se mettent à jour, sans tête de lecture ni éclat. |
| **Mesure** | Aucune animation. Sans cette préférence, l'animation dure au plus 300 ms. |

**Références :** spec `systeme-de-design`.

---

## 10.3 Scénarios pas encore tenus

| ID | Scénario | État actuel | Cible | Ce qu'il faut changer |
|----|----------|-------------|-------|-----------------------|
| QS-06 | Un réglage en direct | Sous Node : 69 ms au 95e percentile sur le texte 2 ; rien dans un navigateur | Moins de 100 ms au 95e percentile dans le navigateur | Mesurer dans un navigateur, et sur téléphone ; chercher pourquoi le texte 2 est neuf fois plus lent (RISK-08) |
| QS-11 | La table au clavier et sur un téléphone | Vérifié une fois, avant l'inspecteur, la grille, les filtres instanciables et les recettes | Parcours complet sans souris ; pas de défilement à 375, 768 et 1440 px | Refaire la vérification ; ajouter un test des noms accessibles dans les composants rendus en texte (RISK-09) |
