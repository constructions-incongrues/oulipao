# 2. Contraintes

**Niveau de détail :** ESSENTIAL (toutes les contraintes connues et leur raison ; une catégorie
vide est signalée).

## Vue d'ensemble

Oulipao n'a ni employeur, ni client, ni contrat : une seule personne en décide. Une contrainte
s'entend donc ici comme une règle qu'on ne lève pas par un choix technique. La lever demande
soit que le fondateur change une règle qu'il impose à tout contributeur, humain ou agent de code
(`CLAUDE.md`, `DESIGN.md`), soit qu'il change le projet lui-même, soit qu'une licence ou la loi
change. Les choix techniques qu'un développeur pourrait refaire autrement sont des décisions
(section 9).

Ces contraintes laissent une grande liberté sur l'infrastructure et les bibliothèques. Elles en
laissent peu sur la forme du code (TypeScript, découpage hexagonal, zod, couverture) et sur ce
que le produit s'interdit de faire.

---

## 2.1 Contraintes techniques

| Contrainte | Raison |
|------------|--------|
| TypeScript en mode strict | Règle du projet (`CLAUDE.md`). Les types sont le premier contrôle sur un code largement écrit par des agents. |
| Architecture hexagonale : `src/domain` (pur), `src/ports`, `src/adapters`, `src/ui` ; un domaine testé avec des ports factices | Règle du projet (`CLAUDE.md`). C'est elle qui donne le découpage de la section 5. |
| Couverture de tests supérieure à 90 %, vérifiée par `npm test` | Règle du projet (`CLAUDE.md`). Elle est appliquée par le lanceur de tests lui-même, et la CI refuse de publier en dessous (section 7). |
| Entités définies par des schémas zod, dont les types TypeScript sont déduits ; toute donnée qui entre par un adaptateur est validée | Règle du projet (`CLAUDE.md`). Elle fonde la validation à la frontière (section 4.4). |
| Le système tourne dans un navigateur récent (ES2022, WebAssembly) et sous Node | Pas une contrainte imposée de l'extérieur : c'est la conséquence des ADR-001 et ADR-002. Elle est notée ici, parce que tout composant nouveau doit la respecter. |

---

## 2.2 Contraintes d'organisation et de produit

| Contrainte | Raison |
|------------|--------|
| Une seule personne, le soir et le week-end, aidée d'agents de code ; pas de budget | C'est la situation du projet (`org.md`). Rien ne doit demander une exploitation, une astreinte ou un abonnement. |
| Le fondateur est l'utilisateur principal ; les autres publics sont possibles, pas ciblés | C'est la décision produit du 2026-10-03 (`personas.md`, `objectives.md`). Elle fixe les objectifs de qualité de la section 1.2. |
| Aucune génération de texte par IA : une contrainte est toujours une règle énoncée | C'est un principe produit, sans condition de réouverture (`strategy.md`). Le modèle neuronal ne sert qu'à classer les mots. |
| Pas de compte, pas de stockage ni d'exploitation des textes chargés, pas de monétisation | C'est un choix produit (`CONTEXT.md`, question 7). Il est rendu possible par l'ADR-001. |
| Le français seulement | Hors des objectifs du trimestre (`objectives.md`). Les dictionnaires, l'étiqueteur et les règles d'accord sont propres au français. |
| La planification se fait dans `.nanopm/wiki/`, et les changements passent par OpenSpec (`openspec/`) | Règle du projet (`CLAUDE.md`). Toute évolution passe par une spec et un `design.md`, d'où viennent les ADR de la section 9. |

---

## 2.3 Contraintes réglementaires et de licence

| Contrainte | Raison |
|------------|--------|
| Les fichiers dérivés du lexique Grammalecte (`data/*.tsv`) restent sous MPL 2.0, avec leur notice et l'adresse de leur source | C'est une obligation de la MPL 2.0, qui est un copyleft au niveau du fichier. Le reste du code peut être sous MIT (ADR-003). |
| Le fichier des prononciations dérivé de GLÀFF (`data/phonetique-oulipao.tsv`) reste sous CC BY-SA 3.0, séparé du code et des fichiers Grammalecte, avec l'attribution de GLÀFF et du Wiktionnaire | C'est l'obligation de partage à l'identique de la CC BY-SA 3.0 : quiconque réutilise ce fichier doit le redistribuer sous la même licence. Le code reste sous MIT (ADR-007). |
| Chaque composant tiers est déclaré avec sa licence dans `THIRD_PARTY_LICENSES.md`, publié avec le site | Les polices sont sous SIL OFL 1.1, fr-compromise sous MIT et Transformers.js sous Apache 2.0, et ces licences demandent l'attribution. C'est aussi une exigence de la spec `mise-en-ligne`. |
| Ne pas redistribuer le modèle d'étiquetage tant que sa licence est inconnue | Sans licence déclarée, aucun droit de redistribution n'est accordé (RISK-03). Le modèle reste chargé depuis Hugging Face. |
| RGPD : Oulipao ne collecte aucune donnée personnelle ; ni traceur, ni mesure d'audience, ni cookie | Le texte ne quitte pas le navigateur (objectif 1). Le visiteur fait cependant connaître son adresse IP à GitHub Pages en ouvrant le site, et à jsDelivr et Hugging Face au premier clic, après une notice qui les nomme. Les polices sont déjà servies par le site lui-même. Voir la section 2.5. *Lecture de la situation, pas un avis juridique.* |
| Accessibilité : aucune obligation légale identifiée | Le RGAA vise les services publics et les grandes entreprises, pas un outil personnel gratuit. L'accessibilité reste un objectif de qualité (objectif 5), pas une obligation. |

---

## 2.4 Conventions

| Convention | Raison |
|------------|--------|
| Symboles du code en anglais ; commentaires, documentation, messages de commit et PR en français | Règle du projet (`CLAUDE.md`). Le fondateur travaille en français. |
| `DESIGN.md` fixe les polices, les couleurs, les espacements et la direction esthétique ; tout écart se demande au fondateur, et une revue d'interface signale le code qui ne le suit pas | Règle du projet (`CLAUDE.md`). Les contrastes de la palette sont vérifiés par `npm run check:palette`. |
| Toute simplification délibérée porte un commentaire `ponytail:` qui en dit la limite et la sortie | C'est l'usage du dépôt. Les dettes de la section 11 (DEBT-02) et plusieurs risques en viennent. |
| La documentation d'architecture suit arc42, dans `docs/arc42/`, avec des diagrammes Mermaid intégrés au Markdown | C'est le choix du fondateur (2026-10-03). GitHub les affiche sans outil supplémentaire. |

---

## 2.5 Une contrainte qu'Oulipao imposait aux visiteurs

Les contraintes ci-dessus pèsent sur ceux qui construisent Oulipao. Celle-ci pesait sur ceux qui
l'ouvrent, et elle n'avait été ni annoncée ni décidée comme telle. Jusqu'au 2026-10-03, le
préchargement du modèle partait dès l'ouverture de la page : la question « à l'ouverture ou au
clic » était restée non tranchée, et l'on avait gardé le comportement existant (`design.md` de la
mise en ligne, décision 6). Le défaut faisait donc office de règle.

<!-- // incongru-voix: lessig — l'adresse IP du visiteur ne part chez jsDelivr et Hugging Face qu'au premier clic, après une notice, régulée par l'architecture (chargement à la demande) — recours: ne pas cliquer ; GitHub Pages reste sans recours -->

**Avant la décision**, la grille des quatre modalités donnait ceci :

```
CONTRAINTE : en ouvrant la page, le visiteur fait connaître son adresse IP à GitHub Pages
             (inévitable : c'est l'hébergeur), puis à jsDelivr et Hugging Face (le préchargement
             du modèle part sans qu'il ait rien demandé)

  loi           Le RGPD tient l'adresse IP pour une donnée personnelle. Un tribunal allemand a
                jugé illicite, sans consentement, le chargement de polices depuis un tiers qui
                recevait ainsi l'adresse (LG München I, 20 janvier 2022, 3 O 17493/20). Le cas est
                comparable, pas identique. Lecture, pas avis juridique.
  norme         Rien : l'usage du web tient les CDN pour ordinaires, et personne ne s'en offusque.
  prix          Pour le visiteur : ne pas ouvrir la page, ou activer l'économie de données de son
                navigateur, qui retardait le chargement jusqu'à un clic. Il ignorait que ce
                réglage avait cet effet ici. Pour l'éditeur : héberger les 141 Mo (TODOS.md,
                RISK-01), ce qui est subordonné à la licence du modèle (RISK-03).
  architecture  Totale. La requête partait au chargement de la page ; aucune notification ne la
                précédait.

  RECOURS       Aucun avant la requête. Après : les droits d'accès et d'opposition s'exercent
                auprès de GitHub, jsDelivr et Hugging Face, pas auprès d'Oulipao, qui ne voit
                rien passer.
```

Deux amendements étaient possibles : prévenir et demander, ou héberger soi-même la bibliothèque et
les poids (bloqué par RISK-03).

**Décision du fondateur, 2026-10-03 : le premier amendement.** Le modèle se charge au premier clic
(changement OpenSpec `modele-au-premier-clic`). La grille devient :

```
CONTRAINTE : en ouvrant la page, le visiteur fait connaître son adresse IP à GitHub Pages
             (inévitable : c'est l'hébergeur) ; à jsDelivr et Hugging Face seulement s'il clique

  loi           Inchangée. Le transfert vers jsDelivr et Hugging Face suit désormais un geste du
                visiteur, précédé d'une notice. Lecture, pas avis juridique.
  norme         Inchangée.
  prix          Pour le visiteur : un clic, et l'attente du chargement à chaque visite (courte une
                fois le modèle en cache). Refuser ne coûte rien, sauf l'usage de l'outil.
  architecture  Partielle. Rien ne part vers jsDelivr ni Hugging Face avant « Charger le modèle »,
                « Mettre en pistes » ou « Essayer avec un exemple ». La notice les nomme, et dit
                qu'ils voient l'adresse. GitHub Pages, lui, reste contacté à l'ouverture.

  RECOURS       Avant la requête : ne pas cliquer. Après : les mêmes droits qu'avant, auprès des
                tiers. Pour GitHub Pages : aucun, tant que le site y est hébergé.
```

Ce qui reste : l'hébergeur voit l'adresse de quiconque ouvre la page, et l'accord n'est pas
mémorisé d'une visite à l'autre. Ce sont deux choix, pas deux oublis. Héberger le modèle
soi-même retirerait encore deux tiers, mais cette voie reste bloquée par RISK-03.
