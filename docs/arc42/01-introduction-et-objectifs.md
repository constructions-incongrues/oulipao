# 1. Introduction et objectifs

**Niveau de détail :** ESSENTIAL.

## 1.1 Aperçu des exigences

Oulipao (« Ouvroir de Littérature Potentielle Assistée par Ordinateur ») découpe un texte français
en pistes grammaticales et y applique des contraintes oulipiennes réglables en direct, à la
manière d'un logiciel de musique assistée par ordinateur, entièrement dans le navigateur.

### Fonctions essentielles

- **Coller un texte**, ou partir du texte d'exemple.
- **Mettre en pistes :** un étiqueteur neuronal (CamemBERT, exécuté localement) range chaque mot
  dans une piste : noms, adjectifs, verbes, adverbes, ou mots-outils.
- **Enchaîner des contraintes :** cinq types (S+n, lipogramme, tri par piste, bord, mise en vers),
  chacun visant une ou plusieurs pistes. Une même contrainte peut être instanciée plusieurs fois,
  réordonnée ou coupée.
- **Partir d'une recette :** une contrainte de l'Oulipo nommée (Liponymie, Haï-kaïsation,
  Monovocalisme…), qui se réduit à une chaîne d'instances des types installés.
- **Régler en direct :** le décalage, le mode ou la lettre interdite ; muet ou solo par piste.
  Le texte se réécrit sans être réétiqueté.
- **Garder la langue correcte :** le S+7 réaccorde les déterminants, les adjectifs et l'élision ;
  les verbes gardent leur temps et leur personne.
- **Inspecter un mot :** voir ce que chaque contrainte de la chaîne en a fait, et pourquoi un mot
  a été laissé.
- **Boucher un pas, verrouiller un réglage :** une grille par mot, comme le séquenceur d'une boîte
  à rythmes.
- **Copier le résultat**, avec la mention de la chaîne qui l'a produit.

### Contexte

Il n'y a pas de douleur à soulager : « pas de douleur, une envie ». Oulipao est d'abord l'outil
personnel du fondateur, qui veut écrire avec des contraintes oulipiennes sans les appliquer à la
main. Il est ouvert en passant au lecteur de Queneau ou de Perec qui connaît le S+7 sans l'avoir
jamais essayé. La valeur tient en deux points : rendre la contrainte jouable, en tournant un
bouton et en entendant le texte changer ; et la garder lisible, parce qu'une contrainte est
toujours une règle énoncée, jamais une génération par IA. Le projet n'a ni monétisation ni
compte, et il ne garde pas les textes chargés.

L'objectif du trimestre (octobre à décembre 2026) est que le fondateur se serve d'Oulipao pour
écrire : au moins 5 textes gardés avant le 31 décembre, et au moins une séance par semaine
pendant 6 semaines.

### Références

- Vision, personas, objectifs, stratégie et feuille de route : `.nanopm/wiki/docs/` (notamment
  `product.md`, `personas.md`, `objectives.md`).
- Exigences en vigueur : `openspec/specs/` (une spec par capacité : étiquetage, interface à
  pistes, inspecteur, lipogramme, morphologie des verbes, mise en ligne…).
- Mesures de l'essai technique : `RESULTATS.md`.
- Système de design : `DESIGN.md`.

---

## 1.2 Objectifs de qualité

> Les cinq exigences de qualité qui comptent le plus. Toute décision d'architecture doit les servir.
> ✅ **Validés par le fondateur (1.3) le 2026-10-03.** Les seuils des objectifs 3 à 5 ont été proposés à partir des mesures existantes, puis acceptés tels quels.

| Priorité | Objectif de qualité | Scénario concret |
|:--------:|---------------------|------------------|
| 1 | `#secure` **Le texte reste dans le navigateur** | Sur le site publié, cache vidé, onglet réseau ouvert : on colle un texte, on le met en pistes et on le transforme. Aucune requête ne contient le texte, et toutes les requêtes visent l'un de trois fournisseurs : le site (`oulipao.incongru.org`), jsDelivr (`cdn.jsdelivr.net`) ou Hugging Face (`huggingface.co`, et `*.hf.co` vers lequel il redirige les poids). Aucun traceur. *Atteint (spec `mise-en-ligne`).* |
| 2 | `#suitable` **Un français correct** | Sur chacun des trois textes de référence de 200 mots (`reference/`), au moins 9 mots sur 10 sont étiquetés dans la bonne catégorie, et au moins 9 substitutions S+7 sur 10 sont accordées en genre et en nombre (relecture à la main). *Atteint : 96,5 % de mots bien étiquetés sur l'ensemble, 95,0 % au plus bas (`RESULTATS.md`).* |
| 3 | `#efficient` **Un réglage en direct** | Modèle en cache, texte de 200 mots, chaîne de trois contraintes. Un geste sur la table (un décalage, une piste muette) réécrit le texte en moins de 100 ms au 95e percentile, et une mise en pistes prend au plus 2 s. *Mesuré le 2026-10-03, sous Node, avec S+7 sur les noms, S+7 sur les adjectifs et lipogramme sur toutes les pistes : 7 ms au 95e percentile sur les textes 1 et 3, mais 69 ms sur le texte 2, avec un maximum de 91 ms. Mise en pistes : 1,5 s dans le navigateur (`RESULTATS.md`). Le réglage en direct n'a pas encore été mesuré dans un navigateur.* |
| 4 | `#flexible` **Ajouter une contrainte** | Une nouvelle contrainte s'ajoute dans son propre répertoire de `src/domain/` et dans le registre des plugins (`installedPlugins`, tenu par l'Interface dans `src/ui/tracks/mixer-state.ts`), sans modifier l'étiquetage, les ports ni les adaptateurs existants. `npm test` impose une couverture d'au moins 90 % en lignes, branches et fonctions. *Atteint depuis la PR #9 (commit `a265b4f`) : trois contraintes (tri par piste, bord, mise en vers) ont été ajoutées dans leurs répertoires de `src/domain/`, avec le contrat partagé, le registre et les recettes de l'Interface, sans toucher ni aux ports ni aux adaptateurs. Avant elles, le lipogramme (commit `9085451`) avait dû étendre un port et deux adaptateurs : une contrainte qui demande des données nouvelles au dictionnaire le fera encore.* |
| 5 | `#usable` **Accessible** | Tous les couples texte/fond de la palette atteignent un contraste d'au moins 4,5:1 (WCAG 2.2), dans les thèmes clair et sombre. Les pistes restent distinctes en daltonisme (ΔE ≥ 20, simulations de Machado 2009). `npm run check:palette` échoue en nommant chaque paire fautive. Tous les gestes de la table sont faisables au clavier, et la page ne défile jamais à l'horizontale à 375 px. *En partie vérifié : `check:palette` passe pour les contrastes et le daltonisme ; l'usage au clavier et l'affichage à 375 px n'ont pas été revérifiés depuis `DESIGN.md`.* |

Les scénarios détaillés (QS-01 à QS-13) sont dans la section 10.

---

## 1.3 Parties prenantes

| Rôle | Contact | Attentes envers l'architecture |
|------|---------|--------------------------------|
| Fondateur : auteur, mainteneur (le « Mainteneur » des sections 5 et 7) et utilisateur principal | Dépôt `constructions-incongrues/oulipao` | Écrire avec l'outil chaque semaine ; le faire évoluer seul, le soir et le week-end, sans infrastructure à entretenir ; ajouter une contrainte sans tout reprendre. |
| Lecteur de Queneau ou de Perec (visiteur occasionnel) | — (aucun compte, aucune mesure d'audience) | Essayer le S+7 sans rien installer, sans que son texte parte ailleurs, et obtenir un résultat qui reste du français. |
| Développeuse de creative coding (auteur de plugins, plus tard) | — | Comprendre le contrat de plugin et l'endroit où brancher une contrainte. Ce contrat reste interne (`src/domain/plugin.ts`, ADR-004) : cinq contraintes existent, mais personne d'autre que le fondateur n'en écrit encore. |
| Agents de code qui contribuent au dépôt | `CLAUDE.md` | Des frontières nettes (domaine pur, ports, adaptateurs), des noms stables d'une section à l'autre, des exigences testables. |

**Validation des objectifs de qualité :** le fondateur.
