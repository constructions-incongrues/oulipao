---
# gstack: design-md-format=spec
name: Oulipao
description: Une façade d'instrument en aluminium gris d'où sort une bande de papier ; les pas actifs sont percés, pas allumés.
colors:
  surface: "#d6d5d0"
  paper: "#fbfbf8"
  text: "#17171a"
  text-muted: "#4e4e54"
  rule: "#b4b3ad"
  error: "#a5231b"
  track-noun: "#005f9b"
  track-verb: "#983a08"
  track-adjective: "#004220"
  track-adverb: "#883866"
  track-other: "#24242d"
  dark-surface: "#1c1c1f"
  dark-paper: "#26262a"
  dark-text: "#ecebe6"
  dark-text-muted: "#a9a8a2"
  dark-rule: "#3a3a3f"
  dark-error: "#f2948c"
  dark-track-noun: "#33a7e9"
  dark-track-verb: "#f0a23a"
  dark-track-adjective: "#5fe5b2"
  dark-track-adverb: "#eaa8d5"
  dark-track-other: "#96928d"
typography:
  display:
    fontFamily: Big Shoulders Stencil Display
    fontWeight: 800
    fontSize: 44px
    letterSpacing: 0.01em
  body:
    fontFamily: Spectral
    fontSize: 22px
    lineHeight: 1.6
  ui:
    fontFamily: Archivo
    fontSize: 15px
    lineHeight: 1.45
  label:
    fontFamily: Archivo
    fontWeight: 600
    fontSize: 12px
    letterSpacing: 0.02em
    fontVariation: "wdth 75"
  mono:
    fontFamily: Martian Mono
    fontSize: 13px
    fontFeature: tnum
  value:
    fontFamily: Martian Mono
    fontSize: 11px
    fontFeature: tnum
  grid-word:
    fontFamily: Spectral
    fontSize: 14px
  body-narrow:
    fontFamily: Spectral
    fontSize: 19px
    lineHeight: 1.6
  display-narrow:
    fontFamily: Big Shoulders Stencil Display
    fontWeight: 800
    fontSize: 34px
    letterSpacing: 0.01em
rounded:
  sm: 2px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
components:
  key:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    borderColor: "{colors.text}"
    rounded: "{rounded.sm}"
  key-pressed:
    backgroundColor: "{colors.text}"
    textColor: "{colors.surface}"
  input:
    backgroundColor: "{colors.paper}"
    borderColor: "{colors.text}"
    rounded: "{rounded.sm}"
  output-strip:
    backgroundColor: "{colors.paper}"
    borderColor: "{colors.rule}"
---

# Oulipao

## Overview

**Creative North Star :** l'instrument perforé. Oulipao est la façade d'un séquenceur, en aluminium gris pâle. Le texte en sort sur une bande de papier, et dans la grille un pas actif est un trou percé, pas une case allumée. Le premier séquenceur était un rouleau perforé (orgues à cylindre, pianos mécaniques), et la perforation retire, comme Reznikoff qui coupe ses dépositions sans rien y ajouter.

**Chose à retenir :** « C'est un instrument pour le texte. » Chaque décision ci-dessous sert cette phrase.

**Contexte produit :** outil web personnel du fondateur, ouvert aux autres en passant ; public secondaire, le lecteur de Queneau ou de Perec. Il découpe un texte français en pistes grammaticales, y branche des contraintes oulipiennes en chaîne et montre mot à mot ce que chaque filtre a fait. Tout tourne dans le navigateur.

**Mode par surface :**
- *Operate* : tranches de piste, grille de pas, chaîne, inspecteur. Dense, sérigraphié, en grille stricte.
- *Read* : la bande de sortie. Un livre : Spectral, mesure limitée, aucune décoration.

**Sites de référence (captures du 2026-10-03) :** learningmusic.ableton.com (grille de 16 pas, un seul accent, temps forts plus lisibles) ; elektron.se/en/digitakt-ii (pas numérotés, couleur d'état, verrous de paramètres, conditions, euclidien, mode chanson) ; teenage.engineering/products/ep-133 (l'instrument comme plan coté) ; musiclab.chromeexperiments.com/Song-Maker (grille rassurante pour non-musiciens). onlinesequencer.net n'a pas pu être capturé (vérification anti-robot).

**Caractéristiques des cinq premières secondes :**
- Une façade grise sans ombre, avec des étiquettes en capitales étroites comme une sérigraphie.
- Une bande de papier perforée sur ses bords, qui porte le texte en serif.
- Une grille dont chaque colonne est un mot et chaque ligne une piste ; les pas actifs sont des trous de couleur.
- Un seul mot en pochoir : OULIPAO.

## Colors

**Stratégie : sobre.** La façade, le papier et l'encre sont neutres. La couleur ne sert qu'à une chose, reconnaître une piste. Il n'y a pas de couleur d'accent : le focus, les verrous et les touches enfoncées sont à l'encre. L'erreur a son rouge, réservé aux messages.

**Clair ou sombre :** on suit `prefers-color-scheme`. La scène d'usage est le bureau du fondateur, le jour comme le soir ; aucune des deux lumières ne domine. Un bouton permet de forcer l'un ou l'autre.

**Contrastes (WCAG 2.2, calculés le 2026-10-03), sur la façade puis sur le papier :**

| Rôle | Clair | Contraste | Sombre | Contraste |
|---|---|---|---|---|
| Encre | `#17171a` | 12,2 / 17,3 | `#ecebe6` | 14,2 / 12,6 |
| Encre secondaire | `#4e4e54` | 5,6 / 8,0 | `#a9a8a2` | 7,1 / 6,3 |
| Noms | `#005f9b` | 4,6 / 6,5 | `#33a7e9` | 6,4 / 5,6 |
| Verbes | `#983a08` | 4,9 / 6,9 | `#f0a23a` | 8,0 / 7,1 |
| Adjectifs | `#004220` | 7,9 / 11,3 | `#5fe5b2` | 10,8 / 9,6 |
| Adverbes | `#883866` | 5,1 / 7,2 | `#eaa8d5` | 9,0 / 7,9 |
| Autres | `#24242d` | 10,5 / 14,8 | `#96928d` | 5,5 / 4,9 |
| Erreur | `#a5231b` | 5,0 / 7,1 | `#f2948c` | 7,6 / 6,7 |

Tout dépasse 4,5:1, donc les noms de piste peuvent s'écrire dans leur couleur.

Les teintes partent d'Okabe-Ito, mais cette palette ne suffisait pas sur la façade : en deutéranopie, adjectifs et autres tombaient à ΔE 3,2. `npm run check:palette` vérifie désormais la règle : contrastes d'au moins 4,5:1 sur la façade et le papier, et ΔE CIELAB d'au moins 20 entre deux pistes, en vision normale comme en deutéranopie, protanopie et tritanopie (matrices de Machado, 2009). Pour y arriver, les adjectifs sont devenus vert sapin et les « Autres » presque l'encre : sur une façade claire, seule la luminosité sépare ces pistes pour un œil daltonien.

**La couleur ne porte jamais seule l'information :** chaque piste a aussi sa forme de poinçon (voir Shapes) et son nom.

**En sombre**, la façade et le papier gardent leur hiérarchie : le papier reste un ton plus clair que la façade, il n'est pas simplement inversé.

## Typography

Les quatre polices sont sous licence SIL OFL 1.1 et servies par le projet via `@fontsource` (vérifié le 2026-10-03 sur l'API Fontsource). Aucune requête ne part vers un serveur de polices.

| Rôle | Police | Paquet | Usage |
|---|---|---|---|
| Lecture | Spectral 400, 600, italique 400 | `@fontsource/spectral` | bande de sortie, mots de la grille et de l'inspecteur |
| Interface | Archivo variable, largeur 100 | `@fontsource-variable/archivo` | réglages, messages, corps de l'interface |
| Sérigraphie | Archivo variable, largeur 75, 600 à 700, capitales | même paquet | étiquettes de façade, noms de piste, libellés des touches |
| Valeurs | Martian Mono variable, chiffres tabulaires | `@fontsource-variable/martian-mono` | numéros de pas, paramètres, compteurs, graines |
| Marque | Big Shoulders Stencil Display, 800 | `@fontsource-variable/big-shoulders-stencil-display` | le mot OULIPAO, nulle part ailleurs |

**Pourquoi :**
- Spectral, dessinée par Production Type (Paris) pour la lecture à l'écran, donne au texte lu la dignité d'un livre.
- La largeur variable d'Archivo fournit la sérigraphie sans ajouter de police.
- Martian Mono, large, garde lisibles les valeurs qu'on tourne en direct.
- Le pochoir est une lettre trouée : il redit la perforation, mais seulement dans la marque.

**Échelle :** marque 44 px (34 px sous 768 px) ; lecture 22 px (19 px sous 768 px), mesure 62ch ; interface 15 px ; sérigraphie 12 à 13 px ; valeurs 11 à 14 px (numéros de pas, compteurs et verrous à 11 px, mots de la grille à 14 px). Chaque taille a son jeton dans `styles/tokens.css` (`--size-value`, `--size-grid-word`, `--size-read-narrow`, `--size-mark-narrow`…).

## Layout

- **Une grille stricte, comme un rack.** De haut en bas : la barre de marque, la bande de sortie, la saisie, la chaîne de filtres, la grille des pistes (tranches à gauche sur 236 px, 116 px sur téléphone, puis une colonne par mot), l'inspecteur. On lit, on règle les filtres, on perce les pas.
- **Un pas égale un mot.** Les colonnes de la grille et celles de l'inspecteur s'alignent sur le même mot d'origine.
- **Pages de pas :** 16 pas par page quand la grille fait au moins 1024 px, 8 à partir de 640 px, 4 en dessous, comme la touche PAGE d'un séquenceur. Au-delà de six pages, des flèches remplacent la liste des pages. Le pas qui était en tête de page reste visible quand la largeur change.
- **Temps forts :** le numéro de pas est en gras tous les quatre pas (1, 5, 9, 13…).
- **La bande de sortie reste visible.** Collée en haut de l'écran dès qu'on descend, elle se fait compacte (17 px, quatre lignes, trois sur téléphone) avec un filet d'encre ; le reste du texte défile dans la bande. Sur téléphone, collée, elle ne garde que le texte, sans touches.
- **Le transport dans l'en-tête de la grille.** « Écouter », le tempo et la voix se placent entre le titre de la grille et ses pages, comme sur la façade d'un séquenceur. Le raccourci est écrit en touche de clavier, en Martian Mono.
- **La chaîne au-dessus des pistes.** Une ligne par filtre, toutes de même largeur, en colonnes fixes : poignée, numéro, nom, réglages (25rem), pistes visées, marche, touches. Les réglages qui ne tiennent pas dans leur colonne passent à la ligne à l'intérieur, et la ligne du filtre s'allonge. Sous le titre de la chaîne, une phrase d'état dit ce que la chaîne a fait. Sous 1024 px, chaque ligne passe sur plusieurs rangs.
- **Largeur maximale de la page :** 1240 px.
- **Petit écran :** la page ne défile jamais horizontalement (vérifié à 375, 768 et 1440 px).
- **Densité :** multiples de 4 px. Lignes de piste de 48 px. Une touche a un rembourrage de 4 px sur 8.
- **Au doigt :** sous 768 px, toute touche fait au moins 44 px de haut, comme les listes, les champs et les dépliants ; les pas, 48 px de haut et au moins 44 px de large. Dans une ligne de filtre, la marche et ↑ ↓ partagent un rang, Dupliquer et Retirer le suivant.

## Elevation & Depth

Pas d'ombre, pas de dégradé, pas de flou, pas de carte. Les zones sont séparées par des filets de 1 px. Le seul relief est en creux : les trous de la grille et les perforations des bords de la bande de sortie.

## Shapes

Le rayon est de 2 px, pour les touches, les champs et les emplacements de filtre. Les trous ont une forme propre à leur piste :

| Piste | Poinçon |
|---|---|
| Noms | rond |
| Verbes | carré |
| Adjectifs | fente horizontale |
| Adverbes | triangle |
| Autres | croix |

Un pas où le filtre agit montre le poinçon plein. Un pas de la piste où le filtre n'agit pas montre le contour seul. Un pas qui n'est pas dans la piste reste vide.

Le poinçon plein dit aussi l'issue, sans couleur nouvelle : à pleine taille, le mot a changé ; réduit de moitié, le filtre l'a laissé inchangé ; barré d'un trait d'encre, il est retiré.

## Components

- **Touche (Muet, Seul, Actif) :** contour d'encre de 1 px, sérigraphie. Le geste principal d'un panneau (« Mettre en pistes ») a un contour de 2 px, à taille égale. Enfoncée : fond d'encre, texte couleur façade. Focus visible : contour d'encre de 2 px décalé de 2 px.
- **Pas :** un bouton par mot de la piste. Un clic le bouche (aucun filtre ne touche le mot) ou le rouvre. Son nom accessible donne la piste, le mot, l'état (« percé, le filtre agit », « bouché, laissé tel quel »), l'issue (« mot changé », « mot retiré », « mot inchangé ») et ses verrous.
- **En-tête de la grille :** chaque mot est un bouton qui l'ouvre dans l'inspecteur ; la colonne choisie passe sur fond papier.
- **Verrou de paramètre :** posé dans l'inspecteur, un champ par paramètre entier dans la bande de l'instance (« S+3 sur ce mot ») ; vidé, il tombe. Sur le pas, une petite étiquette carrée à l'encre, en Martian Mono, dans l'angle. Une valeur hors bornes est refusée près du champ.
- **Ligne de filtre :** contour d'encre ; s'il est coupé, contour en tirets et encre secondaire. Une poignée pointillée à gauche : on la tire pour réordonner, un trait d'encre de 3 px marque la place. Les touches ↑ et ↓ font la même chose au clavier et au doigt.
- **Champ de paramètre :** fond papier, Martian Mono centré.
- **Message d'erreur :** filet rouge au-dessus, le début du message en rouge et en gras, la suite à l'encre. Il est placé dans la zone concernée.
- **Bande de sortie :** fond papier, perforations sur les bords. Un mot remplacé est souligné de 2 px dans la couleur de sa piste.

## Do's and Don'ts

- **Do :** écrire chaque couleur, police et taille dans les variables de `styles/tokens.css`, jamais en dur.
- **Do :** donner à chaque piste sa couleur, sa forme de poinçon et son nom, toujours ensemble.
- **Do :** aligner la grille et l'inspecteur colonne par colonne sur le mot d'origine.
- **Do :** garder Spectral pour tout texte qu'on lit et Archivo pour tout ce qu'on règle.
- **Don't :** allumer un pas (lueur, néon, pad éclairé) ; un pas actif est percé.
- **Don't :** utiliser le pochoir en dehors du mot OULIPAO.
- **Don't :** ajouter une couleur d'accent ; le focus et l'état se marquent à l'encre.
- **Don't :** glisser vers l'orgue de foire (kraft, manivelle, cuivre) ; c'est un instrument, pas un objet d'atelier.
- **Don't :** mettre une ombre, une carte ou un dégradé.

## Motion

- **Approche :** fonctionnelle.
- **Easing :** entrée en ease-out, sortie en ease-in, déplacement en ease-in-out.
- **Durées :** micro 50 à 100 ms ; court 150 à 250 ms ; le moment signé 300 ms.
- **Le moment signé :** quand le texte se recalcule, une tête de lecture d'encre balaie la grille de gauche à droite, et les mots remplacés de la bande de sortie s'éclairent brièvement de la couleur de leur piste.
- Rien ne bouge si le système demande de réduire les animations.

## Decisions Log

| Date | Décision | Raison |
|------|----------|--------|
| 2026-10-03 | Système repris de zéro : « l'instrument perforé » | /design-consultation, sur la phrase « C'est un instrument pour le texte », la recherche sur le séquenceur (`.nanopm/wiki/docs/sequenceur.md`) et cinq sites de référence. Remplace le système du 2026-10-03 matin (Source Serif 4, IBM Plex), sauvegardé dans `DESIGN.md.bak`. |
| 2026-10-03 | Pas actif = trou ; un poinçon par piste ; Martian Mono | Idées reprises de la proposition indépendante du sous-agent Claude (« carton d'orgue de Barbarie ») ; le kraft, la manivelle et la tête de lecture fixe ont été écartés. Codex était indisponible. |
| 2026-10-03 | Palette des pistes ajustée par `npm run check:palette` | L'Okabe-Ito adaptée échouait (12 paires sous ΔE 20, dont adjectifs et autres à 3,2 en deutéranopie). On a cherché les teintes conformes les plus proches de celles d'origine. En clair : noms `#005f9b`, adjectifs `#004220`, adverbes `#883866`, autres `#24242d`. En sombre : noms `#33a7e9`, adjectifs `#5fe5b2`, adverbes `#eaa8d5`, autres `#96928d`. Les verbes ne changent pas. |
| 2026-10-03 | Système porté dans le code | Changement OpenSpec `instrument-perfore` : `styles/tokens.css`, `fonts/`, grille de pas, verrous, chaîne réordonnable, bande collée. Pretext, utilisé dans la page de référence, n'est pas repris : la hauteur de la bande se fait en CSS. |
| 2026-10-04 | Tailles toutes en jetons, seuil étroit à 768 px, cibles de 44 px | Revue de design du plan de correction (DD8 à DD10, DD12) : les tailles en dur de `tracks.html` deviennent les jetons `--size-value` (11 px), `--size-grid-word` (14 px), `--size-read-narrow` (19 px) et `--size-mark-narrow` (34 px) ; le verrou passe de 9 à 11 px. Le seuil de 768 px, vérifié en usage, remplace les 640 px écrits ici. Rembourrage des touches sur la grille de 4 px ; touches de 44 px au doigt (elles étaient à 32). |
| 2026-10-04 | Inspecteur sur les colonnes de la grille ; transport dans l'en-tête de la grille ; phrase d'état dans la chaîne ; bande collée sans touches au téléphone | Critique de design du 2026-10-04 (`/design:design-critique`), changements `critique-de-design` et `critique-de-design-suite`. |
| 2026-10-04 | Issue du pas (poinçon réduit ou barré) ; geste principal à 2 px ; 44 px pour tous les contrôles au doigt | Deuxième critique de design du 2026-10-04, accordée par le fondateur (« traite toutes les recos ») ; changement `critique-de-design-3`. |
