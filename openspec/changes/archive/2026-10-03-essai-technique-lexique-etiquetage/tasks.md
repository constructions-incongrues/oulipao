# Tasks: Essai technique — lexique libre et étiquetage dans le navigateur

Build Plan — 8 tasks across 4 waves. Effort : S = une demi-journée, M = une journée. Total : 6 jours.

- Wave 0 (foundation, build first, then merge): Task 1
- Wave 1 (parallel after Wave 0): Tasks 2, 3, 4, 5
- Wave 2 (parallel after Wave 1): Tasks 6, 7
- Wave 3 (after Wave 2): Task 8

Max parallel width: 4. Critical path: 4 waves. Wave 0 = 8 % de l'effort.

## 1. Wave 0 — Fondation

- [x] 1.1 Dépôt, squelette et contrats partagés (S, dépend de : rien, exigences : toutes)
  - Créer le dépôt git et la configuration du projet.
  - `src/tokenize.js` : découpage du texte en mots, partagé par tous les étiqueteurs.
  - `src/categories.js` : les cinq catégories (nom, verbe, adjectif, adverbe, autre) en constante.
  - `src/taggers/index.js` : registre des étiqueteurs ; un étiqueteur est une fonction `texte -> [{mot, catégorie}]`.
  - `reference/FORMAT.md` : format JSON des textes annotés.
  - `RESULTATS.md` : trame vide (Lexiques, Approches, Ambiguïtés, Décision).
  - Acceptance : un étiqueteur factice enregistré dans le registre renvoie des catégories tirées de la constante, et un test le vérifie.

## 2. Wave 1 — En parallèle

- [x] 2.1 Corpus de référence annoté à la main (M, dépend de : 1.1, exigence : comparaison)
  - Trois textes de 200 mots, prose contemporaine, libres de droits ou écrits par le fondateur, annotés avant tout essai d'étiqueteur.
  - Fichiers : `reference/texte-1.json`, `texte-2.json`, `texte-3.json` uniquement.
  - Acceptance : les trois fichiers sont versionnés, conformes à `reference/FORMAT.md`, et n'utilisent que les cinq catégories.
  - Écart : textes écrits et annotés par l'assistant IA, non par le fondateur, qui a accepté l'annotation telle quelle le 2026-10-03.
- [x] 2.2 Recensement des lexiques et de leurs licences (M, dépend de : 1.1, exigence : recensement)
  - Examiner Lexique, Morphalou, Lefff, GLÀFF et le dictionnaire de Grammalecte : licence exacte, droit de redistribution, nombre de noms communs, présence du genre et du nombre.
  - Fichiers : `docs/lexiques.md` et le lexique retenu dans `data/`.
  - Acceptance : chaque lexique examiné a ses quatre informations ; un lexique est retenu, ou l'absence de lexique redistribuable est constatée par écrit.
- [x] 2.3 Outil de comparaison (S, dépend de : 1.1, exigence : comparaison)
  - `src/compare.js` : à partir de la sortie d'un étiqueteur et d'un fichier de référence, donner les mots bien classés sur le total, la liste des erreurs et le nombre de mots ambigus.
  - Acceptance : le test avec l'étiqueteur factice donne le score attendu sur un mini-texte de référence.
- [x] 2.4 Étiqueteur contextuel dans le navigateur (M, dépend de : 1.1, exigences : étiquetage, texte dans le navigateur)
  - `src/taggers/contextuel.js` : bibliothèque JavaScript ou petit modèle exécuté localement, enregistré dans le registre.
  - Acceptance : il étiquette un texte de 200 mots dans un navigateur sans aucune requête contenant le texte ; le poids téléchargé est noté.
  - Ajout en cours d'essai : fr-compromise (`contextuel.js`) restant sous le seuil, un second étiqueteur contextuel a été ajouté, `src/taggers/neuronal.js` (CamemBERT via Transformers.js).

## 3. Wave 2 — En parallèle

- [x] 3.1 Étiqueteur par consultation du lexique (M, dépend de : 1.1, 2.2, exigence : étiquetage)
  - `src/taggers/lexique.js` : catégorie de chaque mot par simple consultation du lexique retenu, enregistré dans le registre.
  - Acceptance : il étiquette un texte de 200 mots ; le poids téléchargé est noté.
- [x] 3.2 Page d'essai (S, dépend de : 1.1, 2.4, exigences : étiquetage, texte dans le navigateur)
  - `index.html` et `src/page.js` : coller un texte, voir chaque mot coloré par catégorie, choisir l'étiqueteur parmi ceux du registre.
  - Acceptance : la page fonctionne avec tout étiqueteur présent dans le registre.
  - GUI test (automatique si un outil de test de navigateur est disponible, sinon liste de vérification manuelle) : 1. Ouvrir la page d'essai. 2. Coller un texte de 200 mots. 3. Vérifier que chaque mot porte l'une des cinq couleurs de catégorie. 4. Changer d'étiqueteur dans le sélecteur. 5. Vérifier que les couleurs se mettent à jour. 6. Vérifier dans l'onglet réseau qu'aucune requête ne contient le texte collé.

## 4. Wave 3 — Mesures et décision

- [x] 4.1 Mesures et décision (S, dépend de : 2.1, 2.2, 2.3, 2.4, 3.1, 3.2, exigences : mesure, décision)
  - Lancer les deux étiqueteurs sur les trois textes de référence avec `src/compare.js` et remplir `RESULTATS.md` : justesse par texte et par approche, poids téléchargé, nombre de mots ambigus, résumé du recensement des lexiques.
  - Acceptance : `RESULTATS.md` se termine par une décision d'une ligne (« on continue », « on continue avec telle réserve » ou « on repose le pari »), avant le 18 octobre 2026.
