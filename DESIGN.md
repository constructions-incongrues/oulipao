# Système de design de Potao

Écrit à partir de la revue de design du 2026-10-03 (décisions 14, 15 et 18,
`openspec/changes/archive/2026-10-03-interface-a-pistes-reglage-en-direct/design.md`). Les valeurs vivent dans
`styles/tokens.css`, que chargent la page des pistes (`tracks.html`) et la page d'essai
(`index.html`). Une page n'écrit aucune couleur, police ou taille en dur : elle utilise ces
variables.

## Principe

Ce qui se lit d'abord, c'est le texte résultant. Les réglages viennent ensuite, puis
l'explication. La couleur sert à une seule chose : reconnaître une piste. Le reste de la page
est neutre.

## Polices

Les trois polices sont servies par le projet (`fonts/`, licence SIL OFL 1.1, fichiers de
`@fontsource` 5.3.0, sous-ensemble latin). Aucune requête ne part vers un serveur de polices.

| Variable | Police | Usage |
|---|---|---|
| `--font-read` | Source Serif 4, 400 et 600 | texte résultant, titre de la page |
| `--font-ui` | IBM Plex Sans, 400 et 600 | réglages, boutons, messages |
| `--font-mono` | IBM Plex Mono, 400 | partition : les colonnes de caractères s'y alignent |

## Tailles

| Variable | Valeur | Usage |
|---|---|---|
| `--size-small` | 13 px | compteurs, noms de piste, aides |
| `--size-ui` | 15 px | réglages, corps de l'interface |
| `--size-read` | 19 px | texte résultant |
| `--size-title` | 24 px | titre |
| `--measure` | 65ch | largeur maximale du texte résultant |

## Espacements, rayon, filets

Espacements en multiples de 4 px : `--space-1` (4), `--space-2` (8), `--space-3` (12),
`--space-4` (16), `--space-6` (24), `--space-8` (32). Un seul rayon, `--radius` (4 px), et un
seul filet, `--rule` (1 px). Pas d'ombre, pas de dégradé, pas de carte : les zones sont séparées
par des filets.

## Couleurs

Fond neutre ; blanc cassé et encre en clair, l'inverse en sombre (`prefers-color-scheme`).

| Variable | Clair | Sombre | Contraste sur le fond (clair / sombre) |
|---|---|---|---|
| `--fg` | `#1d1c1a` | `#ece9e2` | 16,3 / — |
| `--muted` | `#5f5b54` | `#a8a399` | 6,5 / 7,2 |
| `--focus` | `#103193` | `#6c8def` | 10,7 / 5,8 |
| `--error` | `#b3261e` | `#f2948c` | 6,3 / 8,1 |

### Pistes

| Piste | Variable | Clair | Contraste | Sombre | Contraste |
|---|---|---|---|---|---|
| Noms | `--noun` | `#9b3908` | 6,75 | `#f46a25` | 5,97 |
| Verbes | `--verb` | `#103193` | 10,69 | `#6c8def` | 5,76 |
| Adjectifs | `--adjective` | `#0b8447` | 4,57 | `#a8f0cc` | 13,78 |
| Adverbes | `--adverb` | `#6f206f` | 9,53 | `#e8b0e8` | 10,17 |
| Autres | `--other` | `#56524d` | 7,42 | `#9f9993` | 6,42 |

Contraste calculé selon WCAG 2.2 sur `--bg` : toutes les pistes dépassent 4,5:1, au-delà des
3:1 demandés pour les éléments graphiques. Les mêmes teintes servent dans les deux thèmes
(orange, bleu, vert, violet, gris), seule la luminosité change.

Distinction en cas de daltonisme : chaque palette a été simulée en deutéranopie, protanopie et
tritanopie (matrices de Machado, 2009), puis l'écart entre les deux pistes les plus proches a
été mesuré (ΔE dans l'espace CIELAB). Écart minimal, toutes simulations comprises : 20 en clair,
24 en sombre. Une première palette (vert et gris) tombait à 1 en deutéranopie ; elle a été
écartée. La couleur ne porte jamais seule l'information : chaque piste est aussi nommée.

## Mouvement

Un seul : les mots qui viennent de changer dans le texte résultant s'éclairent pendant un tiers
de seconde. Rien ne bouge si le système demande de réduire les animations.
