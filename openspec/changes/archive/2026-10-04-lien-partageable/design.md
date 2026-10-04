# Design

## Context

Le carnet range déjà tout ce qu'il faut pour rouvrir un texte. `NotebookEntrySchema` (`src/ui/tracks/notebook.ts`) contient l'original et son étiquetage, l'état de la table, la mention, le résultat, la retouche et la filiation. « Rouvrir » passe par `reopenProblem` (`notebook-controller.ts`), puis par `restore` (`controller.ts`). `restore` attend le préchargement (`controller.preload()` : modèle et morphologie), puis reconstruit la vue sans réétiqueter. Le hasard est déterministe : la graine est gardée dans les paramètres (`dieRoll`, `julianDay` figé à la construction d'une recette).

Le presse-papiers passe déjà par la dépendance `copy` du contrôleur, branchée dans `main.ts`. `main.ts` est exclu de la couverture : tout ce qui se teste vit dans le contrôleur, le modèle de vue et les composants.

Une mesure du 2026-10-04 donne la taille du lien pour une entrée de 30 vers, avec résultat et retouche :
- pire cas, 360 mots tous différents et incompressibles : 7 067 caractères ;
- texte répétitif : 1 086 caractères.

Le seuil de 8 000 caractères tient donc avec l'étiquetage.

## Goals / Non-Goals

**Goals:**
- Un codage pur et testable sans navigateur, de l'entrée vers le fragment et du fragment vers l'entrée.
- Réutiliser « Rouvrir » pour « Rejouer », sans second chemin de restauration.
- Tout le contact avec `location`, `history` et le presse-papiers reste dans `main.ts`, derrière des dépendances du contrôleur.

**Non-Goals:**
- Comparer le rejeu au résultat transporté (l'écart signalé vient après la v0).
- Une route ou une page séparée : la vue d'arrivée est un état de la page des pistes.

## Decisions

### 1. Le codec vit dans `src/ui/tracks/share-link.ts` (couche ui)

L'entrée du carnet et son schéma vivent dans `src/ui/tracks`, pas dans le domaine ; le codec les suit. Il exporte deux fonctions :
- `encodeEntry(entry): Promise<string>` rend le fragment sans `#` ;
- `decodeFragment(fragment): Promise<SharedEntry | 'unreadable' | undefined>` rend `undefined` pour un fragment étranger.

Il dépend seulement de `CompressionStream` et `DecompressionStream`, natifs dans les navigateurs visés et dans Node 18 et plus : les tests tournent sans faux. Aucun port nouveau : la compression est un calcul, pas un effet de bord.

*Alternative écartée* : un port `Compressor` avec un adaptateur. Il n'aurait qu'une implémentation et n'isolerait rien.

### 2. Format : `v1.` + base64url(deflate-raw(JSON))

`SharedEntrySchema = NotebookEntrySchema.omit({ id: true, keptAt: true })`. Le décodage valide par ce schéma ; toute erreur (base64, décompression, JSON, zod) rend `'unreadable'`. Le préfixe de version permet un `v2` futur sans casser les liens en circulation. Le préfixe est testé avant tout décodage : un `#haut` n'est pas un lien d'Oulipao, et la page s'ouvre normalement, sans message.

*Alternatives écartées* :
- JSON en clair encodé pour l'URL : environ trois fois plus long.
- `lz-string` : c'est une dépendance npm pour un gain marginal sur `deflate-raw`.

### 3. L'étiquetage voyage

Les verrous et les pas bouchés désignent les mots par leur position. Réétiqueter à l'arrivée risquerait de décaler ces positions si l'étiqueteur a changé, et coûterait le chargement du modèle avant même de lire. La mesure ci-dessus montre que le lien reste sous 8 000 caractères avec l'étiquetage.

### 4. L'état d'arrivée dans `TracksState`

Quatre champs s'ajoutent à l'état :
- `arrival?: SharedEntry` : la vue d'arrivée est ouverte ;
- `arrivalMessage: string` : vaut « Ce lien n'est pas lisible » pour un fragment illisible ;
- `arrivalError?: ErrorText` : la raison pour laquelle l'entrée reçue ne peut pas être rouverte ;
- `sharedLink?: string` : l'adresse à afficher quand le presse-papiers est refusé.

Le contrôleur reçoit deux nouvelles dépendances :
- `shareBase: string`, l'adresse du site sans fragment ;
- `arrival?: Promise<SharedEntry | 'unreadable' | undefined>`, le décodage du fragment lancé par `main.ts` au démarrage.

`main.ts` lit `location.hash`, lance `decodeFragment`, puis efface le fragment avec `history.replaceState(null, '', location.pathname + location.search)`. Il le fait dès la lecture, avant tout décodage, pour qu'un rechargement pendant le décodage ne relise pas le fragment.

### 5. « Rejouer » est `restore` sur une entrée reçue

Le contrôleur expose `replayArrival()`. Après le chargement (décision 6), il appelle `reopenProblem` sur l'entrée reçue, complétée d'un `id` et d'un `keptAt` fictifs que rien ne garde. Une entrée refusée laisse la vue ouverte avec `arrivalError` (le même texte que `cannotReopen`). Sinon, il appelle `restore` et ferme l'arrivée. Après « Rejouer », `lastKept` ne doit pas désigner une entrée du carnet : le texte rejoué n'est pas gardé chez le destinataire, et le premier « Garder » crée une nouvelle entrée.

### 6. Le chargement attend « Rejouer »

La spec `mise-en-ligne` veut qu'aucune requête ne parte vers jsDelivr ou Hugging Face avant le premier clic. L'ouverture d'un lien ne charge donc rien, et « Rejouer » est ce premier clic (décision du fondateur, 2026-10-04).

`replayArrival()` procède dans cet ordre :
1. la confirmation si un texte en cours n'est pas gardé ;
2. `controller.preload()`, pendant lequel `state.model.status` vaut `loading` et le bouton est désactivé avec « Chargement… » ;
3. en cas d'échec (`error`), la vue reste ouverte et affiche `state.model.error`, et le bouton, toujours actif, relance le chargement ;
4. en cas de succès, la suite décrite en décision 5.

*Alternative écartée* : charger dès l'arrivée, en tenant l'ouverture du lien pour un consentement. Il aurait fallu amender `mise-en-ligne`.

### 7. « Partager » dans le carnet

`notebook-controller.ts` gagne `shareEntry(id)` : il code l'entrée, copie `shareBase + '#' + fragment` par `host.copy`, puis pose le message « Lien copié. », ou « Lien copié ; il est long, certaines messageries le coupent. » au-delà de 8 000 caractères. Si la copie échoue, il pose `sharedLink` pour que le carnet affiche un champ en lecture seule, présélectionné. Le bouton se place à côté de « Copier » dans `components/notebook.ts`, avec le même style.

### 8. Le composant d'arrivée

`src/ui/tracks/components/arrival.ts` est un composant Preact. Il affiche, dans l'ordre :
1. le texte (la retouche quand elle existe, le résultat produit à côté) ;
2. l'ancêtre, quand il y a une filiation ;
3. l'original ;
4. la mention ;
5. les boutons « Rejouer » et « Fermer ».

Il réutilise la mise en regard de `components/result.ts` quand elle convient. Le style suit `DESIGN.md`. Le focus passe sur le titre de la vue à l'ouverture, et les boutons ont des libellés explicites.

## Risks / Trade-offs

- [Lexique ou étiqueteur modifié entre l'envoi et l'ouverture, rejeu différent du texte reçu] → Le texte reçu reste affiché dans la vue d'arrivée tant qu'elle est ouverte. Le signalement explicite de l'écart vient après la v0.
- [« Rejouer » attend un chargement de plusieurs mégaoctets au premier clic] → Le bouton dit « Chargement… » et la vue reste lisible pendant l'attente ; c'est le même délai qu'au premier « Mettre en pistes ».
- [Une messagerie tronque le lien] → Le décodage échoue proprement (« Ce lien n'est pas lisible »), et l'avertissement au-delà de 8 000 caractères prévient l'auteur.
- [Fragment malveillant, avec un texte énorme ou un JSON piégé] → La validation zod refuse toute forme inattendue. Le texte est rendu par Preact, donc échappé. La décompression se borne à 1 Mo : au-delà, le lien est illisible.
- [`CompressionStream` absent d'un vieux navigateur] → « Partager » et l'arrivée échouent avec un message. Le reste de l'outil fonctionne.

## Migration Plan

Pas de migration : aucun format stocké ne change. Le préfixe `v1.` réserve l'évolution. Le retour arrière consiste à retirer le bouton : les liens déjà envoyés ouvrent alors l'outil normal, puisque le fragment est ignoré.
