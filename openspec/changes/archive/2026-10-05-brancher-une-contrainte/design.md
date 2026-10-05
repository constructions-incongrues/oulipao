# Design

## Context

Voir `proposal.md`. Ce qui existe :
- **Le catalogue** est un `<details class="browser">` dans la chaîne (`components/browser.ts:85`), replié par défaut. Après un ajout, `added()` le replie, fait défiler jusqu'à la nouvelle contrainte et y met le focus (`browser.ts:35-45`).
- **La bande** (`components/result.ts`) a déjà une ligne de note sous le texte : « Pistes coupées : … ».
- **`example()`** (`controller.ts`) place le texte suivant et appelle `run()` sans toucher à la table.
- **Une contrainte en marche** est une instance de `mixer.instances` dont `enabled` est vrai.

## Goals / Non-Goals

**Goals:**
- Un geste explicite vers le catalogue, sans prendre la main à l'utilisateur.
- Un exemple qui montre l'instrument en train d'agir.

**Non-Goals:**
- Ouvrir ou faire défiler sans geste.
- Changer le catalogue lui-même.

## Decisions

### 1. L'invite dans `Result` (couche ui)

`Result` reçoit `onBranch?: () => void`. Présent, il affiche sous le texte une ligne `p.idle` : « Aucune contrainte en marche : le texte est rendu tel quel. », suivie de la touche `button.key.branch` « Brancher une contrainte ». `app.ts` ne la passe que si aucune instance n'est en marche.

La ligne vit sous le texte, et non dans l'en-tête, parce qu'elle doit rester visible quand la bande est collée au téléphone, où l'en-tête disparaît (`tracks.html`, `.result.stuck .result-header { display: none }`).

### 2. Ouvrir le catalogue : `openBrowser(from)` dans `browser.ts` (couche ui)

La fonction trouve `details.browser` dans le document de `from` et l'ouvre. Elle fait ensuite défiler sa **première touche**, et non le catalogue entier, avec `scrollIntoView({ block: 'center', behavior })` : une fois ouvert, le catalogue dépasse l'écran, et le centrer cacherait sa première touche sous la bande collée (constaté en prévisualisation). `behavior` vaut `'auto'` si `matchMedia('(prefers-reduced-motion: reduce)')` est vrai, `'smooth'` sinon. Elle met le focus sur cette touche avec `focus({ preventScroll: true })`.

Le `block: 'center'` reprend le choix de `added()` : la bande collée couvre le haut de l'écran. Le geste reste dans le composant, à côté d'`added()`, sans passer par le contrôleur, puisqu'il ne touche à aucun état.

*Alternative écartée :* un état `browserOpen` dans le contrôleur. Il dupliquerait l'état natif du `<details>`, que le fondateur ouvre et ferme aussi à la main.

### 3. L'exemple qui joue (couche ui, contrôleur)

Dans `example()`, avant `run()` : si aucune instance n'est en marche, dispatcher `{ type: 'add-instance', plugin: 's7' }`. Le S+7 prend ses réglages par défaut (décalage 7, noms), et `dispatch` passe par le même chemin qu'un ajout depuis le catalogue.

Le premier exemple n'a pas d'abandon de boucle à craindre : aucune boucle n'existe avant une mise en pistes, et `dispatch` abandonne de toute façon une boucle en cours.

## Risks / Trade-offs

- **Un `dispatch` avant `run()` rend la page « non gardée »** (`unsaved`). → C'est sans effet : `run()` remet la page en pistes juste après, et `tagAs` repose `unsaved: true` de toute façon.
- **Le S+7 par défaut sur un exemple en vers casse le mètre.** → C'est voulu, c'est l'effet oulipien. Le fondateur l'a choisi (jam, D « S+7 seul »).
