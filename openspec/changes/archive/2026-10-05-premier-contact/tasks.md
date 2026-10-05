# Tasks

À fusionner avant l'envoi du lien nu, le 6 octobre 2026.

## 1. L'exemple joue (ui)

- [x] 1.1 (ui) Déjà livré par #107 : sans contrainte en marche, l'exemple branche un S+7 sur les noms ; Éclipse écartée (original seul au premier écran du téléphone), aucun code dans ce changement

## 2. Phrase d'accueil sur la page vide (ui)

- [x] 2.1 (ui) Afficher la phrase d'accueil au-dessus de la saisie, à côté du bouton d'exemple, tant qu'aucun texte résultant n'existe et qu'aucune arrivée par lien n'est affichée ; libellé par défaut : « Un instrument pour jouer de la littérature potentielle : collez un texte, ajoutez une contrainte, écoutez ce qu'elle en fait. » (à confirmer par le fondateur) ; styles conformes à `DESIGN.md` ; vérifier par un test de rendu sa présence sur la page vide et pendant le chargement du modèle
- [x] 2.2 (ui) Tester que la phrase disparaît après la première mise en pistes, ne revient pas en rouvrant la saisie, et n'apparaît pas pendant une arrivée par lien ; `npm test` vert

## 3. Recette en ligne

- [x] 3.1 Sur la page servie en local, à 375 px puis en bureau : ouvrir `tracks.html`, vérifier la phrase sans défilement horizontal, cliquer « Essayer avec un exemple », vérifier que le résultat est le texte de Proust passé au S+7 et que la phrase a disparu ; capture jointe à la PR
- [x] 3.2 Mettre à jour `docs/tracks.md` (phrase d'accueil) et ouvrir la PR `feat: phrase d'accueil au premier contact`, description en français
