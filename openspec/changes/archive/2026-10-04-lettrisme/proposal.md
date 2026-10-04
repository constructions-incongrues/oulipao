# Proposal

## Why

Le fondateur veut jouer des techniques lettristes dans son instrument, et la vision les accueille depuis le 2026-10-04 : « matière lettriste et hasard, pourvu que chaque transformation soit une règle lisible et rejouable ». Aujourd'hui, Oulipao ne descend pas sous le mot, et sa voix dit toujours ce que la page montre. Le PRD `.nanopm/wiki/docs/prds/lettrisme-discrepance-ciselure.md` pose le pari : au moins 2 prises du carnet avec la Ciselure dans les 21 jours suivant la mise en ligne.

## What Changes

- **Discrépance.** Un choix « La voix dit : le résultat / l'original » dans le transport de l'écoute. En « original », chaque pas dit son mot d'origine pendant que la page montre le résultat. La mention de la chaîne porte alors « écouté en discrépance ».
- **Ciselure**, un nouveau moteur pour tout le texte. Le premier vers reste intact, puis chaque groupe de vers descend d'un palier : mots pleins, première syllabe écrite, voyelles, initiale, souffle. Le palier final et le nombre de vers par palier se règlent.
- **Alphabet augmenté**, un nouveau moteur livré dans une seconde vague, après un test des onomatopées dans la voix. La ponctuation et les sons /s/, /f/ et /k/ deviennent des souffles, des sifflements et des claquements.
- **Un alignement lettres ↔ sons dans le domaine phonétique**, pour savoir quelles lettres d'un mot portent un son.

Hors de ce changement : l'hypergraphie, la discrépance sur une autre piste, les cris et souffles enregistrés, l'export audio.

## Capabilities

### New Capabilities
- `ciselure` : le moteur qui défait un texte vers par vers, par paliers nommés, jusqu'au souffle.
- `alphabet-augmente` : le moteur qui remplace la ponctuation et certains sons par les « lettres » d'Isou.

### Modified Capabilities
- `monitoring-vocal` : une source de voix (le résultat ou l'original), et une mention « écouté en discrépance » à côté de « réglé en écoutant ».

## Impact

- **Domaine :** nouveaux `src/domain/chisel/`, `src/domain/body-alphabet/` ; `alignLetters` dans `src/domain/phonetics/fallback.ts` ; `src/domain/monitoring.ts` (`originalWordsAtStep`) ; `src/domain/registry.ts`.
- **Ports :** `src/ports/monitoring-preferences.ts` (champ `source`).
- **Interface :** `src/ui/tracks/listening-controller.ts`, `controller.ts`, `view-model.ts` (`withListening`), `components/transport.ts`, `app.ts`.
- **Documentation :** `docs/plugins.md`, `.nanopm/wiki/docs/catalogue-contraintes.md`.
- **Aucune nouvelle dépendance**, et aucune textbank à charger : les sons viennent des règles graphème → phonème déjà présentes.
