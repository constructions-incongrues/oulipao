# Proposal

## Why

La revue d'ingénierie du 2026-10-04 a trouvé dans le domaine des promesses non tenues. Le dé du S+dé change dès qu'une étape en amont retire un mot, alors que la spec promet le même tirage à chaque calcul. Un mot absent du dictionnaire est expliqué comme « sans voisin ». « rendez-vous » est coupé en deux, et les espaces insécables se perdent. Le domaine contient aussi des boucles quadratiques et des copies de règles qui divergeront. C'est la voie B du plan de correction : elle ne touche que `src/domain`.

## What Changes

- Le dé du S+dé est tiré sur la position du mot dans le texte d'origine, plus sur sa position dans le texte reçu par l'étape. Un S+dé seul donne les mêmes faces qu'aujourd'hui. Un S+dé placé après une étape qui retire ou dédouble un mot peut donner d'autres faces pour les textes déjà gardés.
- Un adjectif ou un verbe laissé parce que son pas est bouché porte la raison « pas bouché », comme un nom.
- Un mot absent du dictionnaire porte la raison « absent du dictionnaire » dans le lipogramme et le tautogramme, comme dans le S+7 et les filtres de rime.
- Le découpage en mots :
  - garde d'un seul tenant les noms composés dont la seconde partie ressemble à un pronom (« rendez-vous », « on-dit ») ;
  - lit l'apostrophe U+02BC comme une apostrophe.
- Les espaces insécables (U+00A0, U+202F) devant « ; : ! ? » survivent aux retraits et aux mises en ligne.
- Performance, sans changer les sorties :
  - relecture du texte entre étapes en temps linéaire ;
  - retraits sans copie du tableau, marques indexées, strophes sans recopie ;
  - cache par jeu de lettres pour le lipogramme, mesuré avant et après sur le texte de référence 2.
- Copies prouvées identiques regroupées : reprise de la casse, choix de l'apostrophe, test d'élision. La constante « pas bouché » quitte le module du S+7.

## Capabilities

### New Capabilities

Aucune.

### Modified Capabilities

- `moteur-s7-accorde-sur-les-noms` : décalage tiré au dé sur la position d'origine ; mots bouchés signalés.
- `lipogramme` : mot inconnu signalé comme tel.
- `tautogramme-progressif` : mot inconnu signalé comme tel.
- `retrait-et-mise-en-lignes` : espaces insécables conservées.
- `interface-a-pistes-reglage-en-direct` : découpage des mots composés et de l'apostrophe U+02BC.

## Impact

- `src/domain/` :
  - `plugin.ts` et `plugin-chain.ts` : la position d'origine est transmise aux plugins ;
  - `s7/plugin.ts`, `s7/adjective-shift.ts`, `tokenizer.ts`, `mixing.ts`, `removal.ts`, `lineation/plugin.ts`, `track-sort/plugin.ts`, `edge/plugin.ts`, `rhyme/engine.ts` ;
  - `lipogram/*`, `tautogram/plugin.ts`, `neighbours.ts`, `verb.ts`, `letters.ts`.
- Tests : `test/domain/**`. Banc de référence des contraintes (sorties figées, temps avant et après) ; RISK-08 et DEBT-02 mis à jour dans `docs/arc42/11-risques-et-dette-technique.md`.
- Aucun port ni adaptateur touché, aucune dépendance nouvelle.
- Textes gardés : seul un S+dé placé après un retrait peut se rouvrir autrement (voir design.md).
