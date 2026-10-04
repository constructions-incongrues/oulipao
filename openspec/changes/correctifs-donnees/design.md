# Design

## Context

`parsePhonetics` (couche **adapters**) appelle `parseReading` (couche **domain**, `phonetics/phoneme.ts`) pour chacune des 527 934 lignes. Chaque lecture devient `{ syllables: Phoneme[][], guessed }`, et chaque symbole passe par `PhonemeSchema.safeParse`. `InMemoryPhonetics` garde ces objets dans `#byForm` et construit trois index par chaîne (`#bySound`, `#byRhyme`, `#byEnding`) dont les valeurs sont des formes. Mesuré : 3 160 ms et 611 Mo après ramasse-miettes. Le port `PhoneticsRepository` rend des `PhoneticReading` par `readings()`. `CamembertTagger` découpe le texte sur `/[^.!?…]+[.!?…]*\s*/g`, et `camembert-model.ts` passe chaque morceau au tokenizer sans troncature. Voir proposal.md pour les raisons.

## Goals / Non-Goals

**Goals :**
- Diviser la mémoire de la textbank par au moins 2,4 (sous 250 Mo), sans changer le port ni aucune réponse.
- Arrêter une donnée publiée cassée avant la mise en ligne.
- Rendre l'étiquetage reproductible, et robuste aux longs textes sans point.

**Non-Goals :**
- Charger la textbank dans un Web Worker (la mémoire resterait la même).
- Héberger le modèle (TODO à part, subordonné à sa licence).
- Changer le format des fichiers dérivés.

## Decisions

### D1. Lecture gardée en chaîne, analysée à la demande (adapters, domain)

`PhoneticEntry` garde `ipa: string` et `source`. `InMemoryPhonetics` reste dans la couche **adapters** et dépend toujours du seul port `PhoneticsRepository`, qu'il implémente. Les clés des index se calculent à la construction depuis la chaîne : phonèmes de `ipa` sans les points, rime par `rhymeOf`. Les tableaux temporaires sont libérés aussitôt. `readings(form)` analyse les lectures de cette forme au premier appel et garde le résultat dans un `Map` de la forme vers ses lectures. Seules les formes réellement consultées occupent donc des tableaux. Dans le domaine, `splitPhonemes` remplace `PhonemeSchema.safeParse(symbol)` par un `Set` des phonèmes : même ensemble, même refus. Le schéma zod reste la définition de l'entité.
*Alternative écartée :* un Web Worker. Il retire le gel mais garde les 600 Mo, et ajoute un protocole de messages.

### D2. Test de budget (adapters, tests)

Un test charge `data/phonetique-oulipao.tsv` sous `node --expose-gc`, ou bien saute avec un message clair si `gc` est absent, puis vérifie : moins de 250 Mo de tas ajoutés, et des réponses identiques sur un échantillon fixe de formes, de rimes et de finales tiré avant le changement. Le temps de chargement va dans `npm run measure`, pas dans un test, pour que la CI ne dépende pas de la vitesse de la machine. Le script `npm test` gagne `--expose-gc` pour que le test tourne en CI.

### D3. Chargement complet des fichiers publiés (tests)

Il y a déjà `test/adapters/morphology.test.ts:75` (morphologie) et `lexicon-lookup-tagger.test.ts:36` (lexique). On ajoute un test pour `data/verbes-oulipao.tsv` (`loadVerbs`) et un pour `data/phonetique-oulipao.tsv` (`loadPhonetics`, partagé avec D2). Chacun vérifie trois formes connues. La publication (`release.yml`) lance déjà `npm test` avant de déployer : la spec « Données publiées vérifiées » est tenue sans toucher à la CI.

### D4. Révision figée (adapters)

`camembert-model.ts` passe `revision: '39f044ac95da4c5fd3832cbc5658c027fc027127'` à `AutoTokenizer.from_pretrained` et à `AutoModelForTokenClassification.from_pretrained`, dans une constante `MODEL_REVISION` commentée (date de relevé : 2026-10-04 ; dernière modification du dépôt : 2024-10-08). Les URL demandées gardent les mêmes hôtes : la CSP ne change pas.

### D5. Sonder avant de découper (adapters)

On sonde d'abord : un poème de 600 mots sans ponctuation forte, mis en pistes dans l'aperçu local. Si l'étiquetage passe, aucun changement : on garde le test de la spec comme garde, en E2E manuel. S'il échoue, `CamembertTagger` découpe chaque phrase trop longue aux retours à la ligne, puis par fenêtres d'environ 400 sous-mots, coupées sur une frontière de mot. Le découpage est une fonction pure de l'adaptateur, testée seule avec un tokenizer factice.

## Risks / Trade-offs

- [`readings()` coûte une analyse au premier appel de chaque forme] → l'analyse d'une forme se mesure en microsecondes et le résultat est gardé ; les filtres de rime passent surtout par `rhyming` et `ending`, qui rendent des formes, pas des lectures.
- [Le test de budget dépend du moteur V8] → seuil large (250 Mo contre environ 600 aujourd'hui), mesuré après le ramasse-miettes.
- [L'auteur du dépôt supprime la révision figée] → le chargement échoue proprement, avec l'erreur existante et « Relancer », au lieu de dériver en silence ; le TODO d'hébergement règle le fond.
- [Le découpage en fenêtres dégrade l'étiquetage aux bords] → n'intervient que pour les phrases trop longues ; mesure de précision sur les textes de référence inchangée.

## Migration Plan

Deux PR : `perf:` index phonétique et tests des données ; `fix:` révision figée et texte long. Pas de migration de données. On revient en arrière par revert.
