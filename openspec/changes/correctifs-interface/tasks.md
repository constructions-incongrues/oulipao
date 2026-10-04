# Tasks

## 1. Restructuration du contrôleur (PR `refactor:` à part, comportement inchangé)

- [x] 1.1 (ui) Extraire `src/ui/tracks/notebook-controller.ts` (garde, réouverture, suppression, import, export) derrière `createTracksController` ; vérifier que `test/ui/tracks/notebook-controller.test.ts` passe sans changer une assertion
- [x] 1.2 (ui) Extraire `src/ui/tracks/listening-controller.ts` (lecture, tempo, voix, raccourci) ; vérifier que `test/ui/tracks/monitoring-controller.test.ts` et `controller.test.ts` passent sans changer une assertion
- [x] 1.3 (domain, ui) Déplacer `installedPlugins` vers `src/domain/registry.ts`, importé par `mixer-state.ts` (qui le réexporte pour ne pas toucher aux tests) et `app.ts` ; `npm test` vert sans changer d'assertion, couverture ≥ 90 %
- [x] 1.4 Annoter `controller.ts` d'un diagramme ASCII de la façade et de ses deux contrôleurs ; `npm run typecheck` vert

## 2. Carnet et stockage

- [x] 2.1 (ui) `parseNotebook` rend les entrées rejetées brutes ; la sérialisation les réécrit dans `entries` ; tests : une entrée rejetée survit à un « Garder », à une suppression et à une retouche
- [x] 2.2 (ui) Copier un carnet illisible en entier sous `oulipao.notebook.bak` avant la première écriture, sans jamais écraser une copie existante ; test avec un JSON cassé et un mauvais fichier
- [x] 2.3 (ui) Relire et fusionner le stockage avant chaque écriture (garder, supprimer, retoucher, importer) ; test avec deux contrôleurs sur un stockage partagé
- [x] 2.4 (ui) Écouter l'événement `storage` sur la clé du carnet dans `main.ts` et rafraîchir l'état par une fonction testée ; test de la fonction de rafraîchissement
- [x] 2.5 (ui) Valider la réouverture : `plugin.parse` sur chaque instance, nombre de mots étiquetés égal à celui du texte, verrous dans les bornes, reconstruction sous `try` ; tests : décalage 500, étiquetage désaligné, table inchangée après échec
- [x] 2.6 (ui) Exporter aussi les entrées rejetées, telles quelles ; test de l'aller-retour avec une entrée illisible
- [x] 2.7 (adapters) `safeStorage(getter)` : tente le getter, renvoie un `Storage` en mémoire marqué `persistent: false` en cas d'échec ; protéger aussi `read` et `write` du carnet ; tests avec un getter qui lève
- [x] 2.8 (ui) Câbler `safeStorage` dans `main.ts` et exposer `persistent` ; avertissement permanent en tête du carnet et message « Gardé pour cette séance. Exportez le carnet pour le conserver. » ; tests du rendu et du message
- [x] 2.9 (ui) Textes des avis : « N texte(s) illisible(s) par cette version, conservé(s) : ils restent dans l'export du carnet. » et « Le carnet est illisible. Copie de secours gardée dans le navigateur. » ; tests des textes exacts, au singulier et au pluriel

## 3. Messages et chargements

- [x] 3.1 (ui) Composant `ErrorMessage` `{ lead, detail }` (role=alert, filet, tête en strong, touche optionnelle) dans `src/ui/tracks/components/` ; tests de rendu
- [x] 3.2 (ui) Passer au composant les erreurs du modèle, des verbes, des prononciations et les échecs du carnet (rouvrir, garder, supprimer, importer) ; les avis restent en `.notebook-message[role=status]` ; tests : role=alert pour les échecs, role=status pour les avis
- [x] 3.3 (adapters) `fetchTextSource` : lecture par flux, minuteur d'inactivité de 30 s réarmé à chaque morceau, `StalledError` nommant la ressource ; tests avec une source qui cale et une source lente mais vivante
- [x] 3.4 (adapters) Préchargement du modèle : minuteur réarmé à chaque rappel de progression de Transformers.js, même `StalledError` ; test avec un classifieur factice qui cesse de progresser
- [x] 3.5 (ui) Message de chargement calé : tête « Le chargement <du modèle | du dictionnaire | des verbes | des prononciations> ne progresse plus. », détail « Rien reçu depuis 30 secondes : la connexion est peut-être coupée. », touche « Relancer » ; tests des quatre ressources
- [x] 3.6 (ui) Lignes d'état « Chargement des verbes… » et « Chargement des prononciations… » (role=status) à l'emplacement de leur erreur ; tests chargement, succès, échec
- [x] 3.7 (ui) `run` et `reopen` remettent `tagging: false` pour l'essai le plus récent, quelle qu'en soit l'issue ; test de la course run → reopen → échec du préchargement

## 4. Saisie et écoute

- [x] 4.1 (ui) Normaliser en NFC dans `setInput` et à la réouverture ; test : « été » décomposé et précomposé donnent le même texte résultant avec un S+7
- [x] 4.2 (ui) `aria-keyshortcuts="Space"` sur la touche Écouter, sérigraphie « ESPACE » (`.silk`) sous la touche, masquée sous 768 px, `title` retiré ; test de l'attribut et de l'étiquette dans `test/ui/tracks/transport.test.ts`
- [x] 4.3 (ui) Sans voix française, ne plus avaler la barre d'espace : sortir de `main.ts` une fonction testée qui décide si l'événement est intercepté ; tests : avec voix sur une touche (intercepté, spec `monitoring-vocal`), sans voix (non intercepté), dans un champ (non intercepté)

## 5. Système de design

- [ ] 5.1 Ajouter `--size-value`, `--size-grid-word`, `--size-read-narrow` et `--size-mark-narrow` à `styles/tokens.css` ; remplacer toutes les tailles de police en pixels de `tracks.html` par des jetons (le verrou passe à 11 px) ; vérifier par recherche qu'aucune taille de police en px ne reste hors des jetons
- [ ] 5.2 Regrouper les quatre styles de touche de `tracks.html` en un sélecteur commun avec `padding: var(--space-1) var(--space-2)` ; contrôle visuel à 375, 768 et 1440 px
- [ ] 5.3 Sous 768 px, `min-height: 44px` pour les touches et les pas, `min-width: 44px` pour les pas ; contrôle à 375 px : aucun défilement horizontal
- [ ] 5.4 Mettre à jour DESIGN.md : front matter `typography` (valeurs 11 px, mots de la grille 14 px, tailles étroites), « Échelle » avec le seuil de 768 px, ligne au journal des décisions ; `npm run check:palette` vert

## 6. Finitions

- [ ] 6.1 (ui) Envoi différé d'environ 150 ms des paramètres texte (`components/control.ts`) ; test avec une horloge factice : une seule mise à jour pour une rafale de frappes, résultat en moins d'une demi-seconde
- [ ] 6.2 (ui) Différer `URL.revokeObjectURL` après le clic d'export dans `main.ts`, par une fonction testée
- [ ] 6.3 (adapters) `lexicon-lookup-tagger.ts` ne garde pas un échec de chargement ; test : échec puis succès au second appel
- [ ] 6.4 (ui) `test/ui/tracks/recipes.test.ts` compare `recipes.length` à `RECIPES.length` au lieu d'un nombre figé

## 7. Vérification d'ensemble

- [ ] 7.1 `npm run typecheck` et `npm test` verts, couverture ≥ 90 % en lignes, branches et fonctions
- [ ] 7.2 Contrôle dans le navigateur (aperçu local) : stockage bloqué, deux onglets, chargement coupé puis relancé, clavier seul, thème sombre, 375, 768 et 1440 px
