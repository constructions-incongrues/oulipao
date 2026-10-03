# Design : lien vers le dépôt GitHub

## Context

- La barre de marque de la page à pistes (`src/ui/tracks/app.ts`) contient la marque, le sous-titre en sérigraphie (`.silk`, `flex: 1`) et la touche « Clair / sombre ». Sous 768 px, le sous-titre est masqué (`tracks.html`).
- La page d'essai (`index.html`, publiée en `essai.html`) n'a pas de barre : un titre, puis un paragraphe d'introduction.
- Le système de design (`DESIGN.md`) n'a pas de style de lien dans l'interface ; les touches de façade sont des boutons à contour d'encre.

## Goals / Non-Goals

**Goals :** un lien vers le dépôt, visible à toutes les largeurs, sur les deux pages.

**Non-Goals :** un pied de page, un lien vers les licences, une icône GitHub (pas de marque d'un tiers dans l'interface ; le libellé suffit).

## Decisions

### 1. Le lien prend l'allure d'une touche de façade (ui)

Dans la barre de marque, entre le sous-titre et « Clair / sombre » :

```html
<a class="key source-link" href="https://github.com/constructions-incongrues/oulipao">Code source</a>
```

- `tracks.html` ajoute la règle `a.key`, qui reprend le style des touches (contour d'encre, sérigraphie, rayon 2 px) et retire le soulignement ; un `display: inline-flex; align-items: center` aligne le texte comme dans un bouton.
- Le sous-titre gardant `flex: 1`, le lien et la touche se rangent à droite. Sous 768 px, le sous-titre disparaît : la marque, le lien et la touche tiennent sur une ligne (vérifié à 375 px pendant l'implémentation).
- L'adresse du dépôt est une constante exportée par `app.ts` (`SOURCE_URL`), testée.

*Pourquoi une touche et pas un lien souligné :* la barre est une façade d'instrument. Une touche de plus à côté de « Clair / sombre » reste dans le même vocabulaire, alors qu'un lien bleu souligné y serait le seul élément d'un autre registre.

### 2. Sur la page d'essai, un lien dans le texte (pages)

`index.html` ajoute au paragraphe d'introduction : « Le code est ouvert : <a href="…">Code source</a>. » Cette page n'a pas de barre ; un lien dans la phrase suffit.

### Couches

Seulement la couche ui et les pages HTML. Aucun port, aucun module nouveau.

## Risks / Trade-offs

- **Trois éléments à droite sur téléphone.** Si la barre déborde à 375 px, on réduit le libellé à « Code », sans changer l'exigence. La tâche de vérification le tranche.
