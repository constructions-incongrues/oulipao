# Design

## Context

Le préchargement est lancé par le contrôleur de la page à pistes (`createTracksController`, couche ui), à son démarrage, sauf si le navigateur signale `saveData`. Il charge en parallèle le modèle (jsDelivr, Hugging Face) et la morphologie (le site lui-même). La mise en pistes attend déjà le préchargement : `run()` appelle `preload()`, qui rejoint un chargement en cours ou en lance un. L'état `waiting` du modèle et son bouton « Charger le modèle (141 Mo) » existent déjà, pour l'économie de données.

## Goals / Non-Goals

**Goals :**
- Aucune requête vers un tiers avant un clic.
- Le chemin le plus court reste d'un seul clic : coller, puis « Mettre en pistes ».

**Non-Goals :**
- Mémoriser l'accord d'une visite à l'autre.
- Héberger le modèle soi-même (RISK-01, bloqué par RISK-03).
- Toucher à la page d'essai, qui ne précharge rien.

## Decisions

### 1. L'état `waiting` devient l'état de départ de toute visite (ui)

`start()` ne lance plus rien : le modèle reste en `waiting` jusqu'au premier appel de `preload()`, que déclenchent « Charger le modèle », `run()` et `example()`. La dépendance `saveData` et la lecture de `navigator.connection` dans `main.ts` sont retirées : elles n'ont plus d'effet.

*Pourquoi pas garder le préchargement et seulement ajouter une notice :* la notice arriverait après la requête ; elle informerait sans permettre de refuser.

### 2. « Mettre en pistes » vaut accord (ui)

Le bouton est actif quand le modèle est en `waiting`, `ready` ou `error` ; il n'est désactivé que pendant le chargement et l'étiquetage. Comme `run()` attend déjà `preload()`, un clic charge puis met en pistes. La notice est affichée juste sous le bouton, avant le clic.

*Pourquoi pas exiger « Charger le modèle » d'abord :* deux clics au lieu d'un pour l'usage principal, sans information de plus, puisque la notice est sous les yeux.

### 3. La notice reprend la ligne `Loading` en état `waiting` (ui)

Le texte d'économie de données est remplacé par : « Le modèle se télécharge une fois depuis jsDelivr et Hugging Face, qui voient alors votre adresse. Votre texte, lui, reste dans ce navigateur. » Mêmes classes (`.loading`, `.load`) : aucun style nouveau, rien qui s'écarte de `DESIGN.md`.

### 4. La morphologie suit le modèle (ui)

Elle reste chargée avec le modèle, au premier clic, bien qu'elle vienne du site lui-même. La charger à l'ouverture n'apporterait rien tant que le modèle n'est pas là.

### Couches et ports

Aucun module nouveau. Seule la couche ui change ; aucun port, aucun adaptateur.

## Risks / Trade-offs

- **[Attente au premier usage, à chaque visite]** Le chargement ne commence qu'au clic. → Après la première visite, le cache du navigateur le rend court ; la barre d'avancement reste.
- **[Un clic sur « Mettre en pistes » vaut accord]** C'est moins explicite qu'un bouton dédié. → La notice est affichée sous le bouton avant tout clic, et « Charger le modèle » reste disponible pour qui veut charger sans rien mettre en pistes.

## Migration Plan

Aucune donnée à migrer. Publié à la fusion sur `main`, comme tout changement ; retour arrière par un revert.
