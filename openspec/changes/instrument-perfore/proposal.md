# Proposition : l'instrument perforé

## Why

Le 2026-10-03, le système de design a été repris de zéro (`DESIGN.md`, « l'instrument perforé »), et une page de référence a été validée par le fondateur (`~/.gstack/projects/oulipao/designs/tracks-page-instrument-20261003/finalized.html`). Le code applique encore l'ancien système (Source Serif 4, IBM Plex, `styles/tokens.css`) et n'a ni la grille de pas, ni les verrous par mot, ni la chaîne réordonnable à la souris que la référence montre. Ce changement porte la référence dans Oulipao, pour que la page soit l'instrument promis : « C'est un instrument pour le texte. »

## What Changes

- **Système de design.** `styles/tokens.css` et `fonts/` passent aux valeurs de `DESIGN.md` :
  - façade grise, papier, encre ;
  - palette des pistes tirée d'Okabe-Ito ;
  - Spectral, Archivo, Martian Mono et Big Shoulders Stencil, servies par le projet.
  Un script vérifie les contrastes et la distinction en daltonisme. `index.html` (page d'essai) suit les mêmes variables.
- **Grille de pas.** Une colonne par mot du texte d'origine, une ligne par piste, et un poinçon de forme propre à chaque piste.
  - Cliquer un pas le bouche : aucun filtre ne touche ce mot. Le recliquer le perce de nouveau.
  - La grille montre 16, 8 ou 4 pas par page selon la largeur.
  - Cliquer un mot de l'en-tête l'ouvre dans l'inspecteur.
- **Verrous par mot.** Depuis l'inspecteur, on fixe pour un mot une valeur propre d'un paramètre entier d'une instance (par exemple S+3 sur ce seul mot). Le verrou se voit sur le pas.
- **Chaîne au-dessus des pistes.**
  - Les filtres sont numérotés et leurs lignes ont la même largeur.
  - On les réordonne en glissant une poignée, ou avec les touches ↑ et ↓ au clavier et au doigt.
  - L'emplacement de filtre quitte les tranches de piste. **BREAKING** pour la spec de l'interface à pistes : la tranche n'a plus d'emplacement de plugin.
- **Texte résultant toujours visible.** La bande de sortie se colle en haut de l'écran quand on fait défiler la page, et se fait compacte : quatre lignes visibles, trois sur téléphone, le reste défile dedans.
- **Le moment signé.** Quand le texte se recalcule, une tête de lecture balaie la grille et les mots remplacés s'éclairent brièvement. Rien ne bouge si le système demande de réduire les animations.
- **Contrat des contraintes.** Une contrainte reçoit, en plus de ses pistes visées, les mots qu'elle doit laisser et les valeurs verrouillées par mot. Le S+n et le lipogramme les respectent.

Hors de ce changement : le mode témoin, l'effacement euclidien, les conditions de déclenchement et les autres fiches de `.nanopm/wiki/docs/sequenceur.md`.

## Capabilities

### New Capabilities
- `grille-de-pas` : la grille pistes × mots, ses pages, ses pas percés ou bouchés, ses poinçons et le passage vers l'inspecteur.
- `verrous-de-parametres` : la valeur propre d'un paramètre entier d'une instance pour un mot, sa pose, son retrait et son affichage.
- `systeme-de-design` : les polices servies par le projet, les contrastes et la distinction des pistes vérifiés, la couleur jamais seule, le moment signé et la réduction des animations.

### Modified Capabilities
- `interface-a-pistes-reglage-en-direct` :
  - la tranche de piste perd son emplacement de plugin et gagne son poinçon ;
  - le texte résultant reste visible quand on fait défiler la page ;
  - la page se lit dans l'ordre texte, filtres, pistes.
- `filtres-instanciables` : la chaîne est numérotée, se réordonne par glisser-déposer ou par ↑ et ↓, et s'affiche au-dessus des pistes ; la portée d'un filtre exclut les pas bouchés.
- `inspecteur-de-chaine` : il s'ouvre aussi depuis l'en-tête de la grille, et il porte les verrous du mot choisi.

## Impact

- **domain** :
  - `src/domain/plugin.ts` : le contrat `apply` prend une portée par mot (mots laissés, valeurs verrouillées) ;
  - `src/domain/plugin-chain.ts` : ramène la portée aux mots relus ;
  - `src/domain/s7/*` et `src/domain/lipogram/*` : respectent la portée.
- **ui** :
  - `src/ui/tracks/*` : état de la table (pas bouchés, verrous), grille, chaîne réordonnable, bande collée, tête de lecture ;
  - `styles/tokens.css` ;
  - `tracks.html` et `index.html`.
- **Ressources** :
  - `fonts/` : nouvelles polices woff2 et leurs licences OFL ; les anciennes sont retirées ;
  - nouveau script `scripts/check-palette.ts`.
- **Dépendances** : aucune nouvelle au moment de l'exécution. Le glisser-déposer utilise l'API native du navigateur, et Pretext n'est pas repris (la hauteur de la bande se fait en CSS).
- **Tests** : nouveaux tests du domaine (portée par mot) et de l'interface (grille, verrous, réordonnancement) ; la couverture doit rester au-dessus de 90 %.
