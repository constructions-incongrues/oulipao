# Proposal

## Why

La revue d'ingénierie et la revue de design du 2026-10-04 ont trouvé, dans la page des pistes, des défauts qui font perdre du travail ou figent l'outil. Une entrée du carnet que la version en ligne ne sait plus lire est effacée au premier « Garder ». Deux onglets s'écrasent l'un l'autre. Un navigateur qui bloque le stockage affiche une page blanche. Un chargement qui cale ne propose jamais de relancer. La page applique aussi mal son propre système de design : le message d'erreur n'a pas sa forme, et des tailles sont écrites en dur. C'est la voie A du plan de correction, la seule qui touche `src/ui`.

## What Changes

- Restructuration sans changement de comportement : le contrôleur des pistes devient une façade qui compose un contrôleur du carnet et un contrôleur de l'écoute ; le registre des contraintes passe dans le domaine (`src/domain/registry.ts`, mitigation prévue de RISK-05) ; les recettes restent dans l'interface. Elle part dans une PR séparée, avant les correctifs.
- Carnet :
  - les entrées illisibles sont conservées telles quelles et figurent dans l'export ;
  - un carnet illisible en entier est copié en secours avant toute écriture ;
  - chaque écriture relit et fusionne le stockage, et les autres onglets se mettent à jour ;
  - la réouverture valide les réglages et dit pourquoi elle échoue ;
  - les échecs prennent le composant d'erreur, les avis restent discrets.
- Stockage inaccessible : la page démarre avec un carnet de séance et un avertissement permanent en tête du carnet. « Garder » invite alors à exporter.
- Chargements :
  - un chargement sans progrès pendant 30 s s'arrête avec un message dédié et « Relancer » ;
  - les verbes et les prononciations annoncent leur chargement ;
  - « Mettre en pistes » ne reste plus bloqué après un échec concurrent.
- Saisie : le texte est normalisé en NFC dès qu'il entre.
- Écoute : le raccourci de la barre d'espace est déclaré aux technologies d'assistance et gravé sous la touche. Sans voix française, la barre d'espace garde son effet ordinaire.
- Système de design :
  - message d'erreur conforme à DESIGN.md (filet rouge, tête en rouge gras, détail à l'encre) ;
  - quatre jetons de taille et DESIGN.md corrigé pour le seuil de 768 px ;
  - padding des touches sur la grille de 4 px ;
  - cibles tactiles de 44 px sous 768 px.
- Finitions :
  - un paramètre texte ne relance la chaîne qu'au repos de la saisie (environ 150 ms) ;
  - le fichier exporté n'est plus révoqué avant son téléchargement ;
  - le test des recettes compare au catalogue au lieu d'un nombre figé ;
  - un échec de chargement du lexique sur la page d'essai n'est plus gardé.

Le comportement de la barre d'espace sur une touche focalisée ne change pas : il est spécifié par `monitoring-vocal` (lancer l'écoute sans activer la touche).

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `carnet-de-textes-gardes` : persistance (entrées illisibles conservées, copie de secours, stockage inaccessible, plusieurs onglets), réouverture validée, export complet, messages du carnet.
- `interface-a-pistes-reglage-en-direct` : états d'attente et d'échec (chargement calé, chargements annoncés, bouton jamais bloqué), texte normalisé à l'entrée, raccourci de l'écoute signalé.
- `systeme-de-design` : message d'erreur conforme, tailles en jetons, cibles tactiles sur petit écran.
- `essai-technique-lexique-etiquetage` : relance possible après un échec de chargement du lexique.

## Impact

- `src/ui/tracks/` : `controller.ts` (façade), nouveaux `notebook-controller.ts` et `listening-controller.ts`, `notebook.ts`, `app.ts`, `main.ts`, `mixer-state.ts`, `recipes.ts`, composants `notebook.ts`, `source.ts`, `transport.ts`, `control.ts`.
- `src/ui/composition.ts`, `src/adapters/storage/`, `src/adapters/text-sources/fetch-text-source.ts`, `src/adapters/taggers/camembert-model.ts`, `src/adapters/taggers/lexicon-lookup-tagger.ts`.
- `tracks.html`, `styles/tokens.css`, `DESIGN.md`.
- Tests : `test/ui/tracks/*`, `test/adapters/*`. Les trois fichiers de tests du contrôleur restent inchangés pendant la restructuration.
- Aucune dépendance nouvelle. Le format du carnet ne change pas (`version: 1`) : les entrées illisibles restent dans le même tableau `entries`, telles quelles.
