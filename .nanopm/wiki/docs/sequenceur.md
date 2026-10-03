---
type: doc
skill: recherche
provenance: assistant-researched
generated: 2026-10-03
sources: [Wikipedia Music sequencer, Analog sequencer, Arpeggiator, Euclidean rhythm, Lettrisme, Méthode S+7, Cent mille milliards de poèmes, La Vie mode d'emploi, Charles Reznikoff ; Georgia Review ; LRB ; gamebooks.org ; critiqueslibres ; Elektronauts ; openspec/specs]
---
# Le séquenceur comme modèle d'écriture sous contrainte

Recherche du 2026-10-03 : ce qu'est un séquenceur musical, et comment l'adapter à l'écriture en s'appuyant sur le lettrisme, l'Oulipo et la poésie objectiviste de Charles Reznikoff.

## 1. Ce qu'est un séquenceur

Un séquenceur ne produit aucun son. Il enregistre, édite et rejoue des **informations de déclenchement** (CV/Gate, MIDI, OSC) qu'il envoie à des instruments. Il dit quoi jouer, quand, et avec quels réglages ([Music sequencer](https://en.wikipedia.org/wiki/Music_sequencer)).

Repères historiques :

- **Années 1940** : Raymond Scott construit des séquenceurs électromécaniques à relais.
- **1964-1968** : premiers séquenceurs analogiques commerciaux, sur le Buchla 100 puis le Moog. Le **Moog 960** porte trois rangées de huit potentiomètres. Une horloge les parcourt dans l'ordre et revient au début. Chaque pas peut être joué, sauté ou renvoyer au départ. Plusieurs séquenceurs synchronisés produisent des polyrythmies ([Analog sequencer](https://en.wikipedia.org/wiki/Analog_sequencer)).
- **1977** : Roland MC-8, premier séquenceur autonome à microprocesseur.
- **1982** : la « Page R » du Fairlight associe la programmation pas à pas et la lecture d'échantillons.
- **1983** : norme MIDI.
- **Fin des années 1990 à 2001** : logiciels à boucles (ACID, Ableton Live).

Les notions retenues :

- **Saisie pas à pas ou en temps réel.** Soit on remplit une grille (souvent 16 pas), soit on enregistre en jouant puis on **quantifie**, c'est-à-dire qu'on ramène les notes sur la grille.
- **Motifs (patterns), pistes, arrangement** (mode chanson) : on enchaîne des motifs nommés.
- **Automation** : un paramètre varie dans le temps.
- **Arpégiateur** : il égrène un accord selon un ordre (montant, descendant, aller-retour, aléatoire, ordre de jeu), sur une étendue donnée. Avec le *latch*, le motif continue après qu'on a relâché les touches ([Arpeggiator](https://en.wikipedia.org/wiki/Arpeggiator)).
- **Verrous de paramètres et conditions de déclenchement** (Elektron). Un pas peut porter ses propres réglages. Il peut aussi ne se déclencher qu'avec une probabilité donnée, ou seulement certaines fois (par exemple « 3e passage sur 4 ») ([Elektronauts](https://www.elektronauts.com/t/p-locks-vs-trig-conditions/42492), une source de forum).
- **Rythme euclidien** E(k,n) : k frappes réparties aussi également que possible sur n pas. E(3,8) donne `x..x..x.` (Toussaint, 2005, [Euclidean rhythm](https://en.wikipedia.org/wiki/Euclidean_rhythm)).

## 2. Les trois courants : unité de base et geste

| Courant | Unité | Geste | Repères sourcés |
|---|---|---|---|
| **Lettrisme** | la lettre, le son, puis tout signe (hypergraphie, 1950) | décomposer le mot | Isou et Pomerand, 1945-1946. Isou, *Introduction à une nouvelle poésie et à une nouvelle musique*, Gallimard, 1947 : les phases « amplique » puis « ciselante » ([Lettrisme](https://fr.wikipedia.org/wiki/Lettrisme), [LRB](https://lrb.co.uk/the-paper/v44/n14/rye-dag-holmboe/e-bada)) |
| **Oulipo** | le mot, le vers, la structure | contraindre, combiner | S+7 de Lescure, 13 février 1961 ([S+7](https://fr.wikipedia.org/wiki/M%C3%A9thode_S%2B7)). *Cent mille milliards de poèmes*, 1961 : 14 vers × 10 variantes, soit 10¹⁴ sonnets ([wiki](https://fr.wikipedia.org/wiki/Cent_mille_milliards_de_po%C3%A8mes)). *Un conte à votre façon*, 1967 : un graphe de 21 sections et 2 fins ([gamebooks.org](https://gamebooks.org/oulipo.htm)). Perec, *Ulcérations*, 1974 : 400 vers, tous anagrammes de « ulcérations », formée des onze lettres les plus fréquentes du français ([critiqueslibres](https://www.critiqueslibres.com/livre/4315-la-cloture-et-autres-poemes-georges-perec)). *La Vie mode d'emploi*, 1978 : un bi-carré latin orthogonal d'ordre 10 répartit « 21 fois 2 séries de 10 éléments » sur les chapitres ([wiki](https://fr.wikipedia.org/wiki/La_Vie_mode_d%27emploi)) |
| **Objectivisme (Reznikoff)** | le document trouvé, la déposition | prélever, réduire, agencer, sans rien ajouter | Le mot « Objectivist » vient de l'essai de Zukofsky « Sincerity and Objectification » (*Poetry*, 1931). *Testimony* tire des comptes rendus de procès des années 1885-1915 et cherche à garder « the words of the participants ». *Holocaust* (1975) part des procès des camps nazis ([Reznikoff](https://en.wikipedia.org/wiki/Charles_Reznikoff)). *Testimony* existe d'abord en prose (1934). La version en vers est commencée dans les années 1950 et classée par **période** (1885-1890, 1891-1900…), par **région** (North, South, West) et par **thème** (« Domestic Scenes », « Railroads »…) ([Georgia Review](https://www.thegeorgiareview.com/posts/on-testimony-the-united-states-1885-1915-recitative-by-charles-reznikoff/)) |

*Exercices de style* (1947, 99 versions d'une même anecdote) apparaît dans les fiches ci-dessous. Il est cité de mémoire et n'a pas été revérifié lors de cette recherche.

## 3. Ce qu'Oulipao fait aujourd'hui (lu dans `openspec/specs`)

- Cinq pistes grammaticales, chacune avec mute et solo.
- Des filtres instanciables (S+n, lipogramme). Chacun vise ses pistes et ils s'enchaînent en série dans un ordre modifiable.
- Le réaccord.
- Un inspecteur de chaîne : une bande par filtre, et chaque mot d'origine garde sa colonne d'une bande à l'autre.

Il n'y a **pas d'axe du temps**. La fiche produit le laisse ouvert : « une timeline, un mixage, un enchaînement de plugins ? »

## 4. Tableau de correspondances

| Notion de séquenceur | Lettre | Mot | Phrase / document | Courant |
|---|---|---|---|---|
| Pas | une lettre | un mot (= une colonne de l'inspecteur) | une proposition, un vers, une déposition | les trois |
| Gate on/off | lettre gardée ou effacée | mot gardé ou tu | proposition gardée ou coupée | Reznikoff (réduction) |
| Rangées parallèles (Moog 960) | — | variantes d'un même mot | variantes d'un même vers | Queneau, *Cent mille milliards* |
| Piste | le jeu de lettres | une catégorie grammaticale | un document source | Oulipao, Reznikoff |
| Motif | motif de lettres | un réglage de chaîne | un traitement appliqué à un passage | *Exercices de style* |
| Arrangement (mode chanson) | — | — | ordre des passages et des traitements | *Testimony* (période, région, thème) |
| Quantification | — | ramener les coupes sur une grille | passer de la prose au vers | Reznikoff |
| Swing | — | alternance de longueurs | vers longs et courts en alternance | — |
| Automation | densité de lettres effacées | n du S+n qui varie | intensité qui monte au fil du texte | (Isou, par métaphore seulement) |
| Verrou de paramètre | — | réglage propre à un mot | réglage propre à un passage | variantes M±n |
| Condition / probabilité | — | le filtre agit 1 fois sur 2 | — | contre-pied de l'anti-hasard oulipien |
| Arpégiateur | lettres d'un mot réordonnées | — | — | lettrisme, Perec (*Ulcérations*) |
| Polymétrie | — | motifs de longueurs premières entre elles par piste | — | Perec (bi-carré : répartition exhaustive) |
| Saut / retour de pas | — | — | parcours de lecture | Queneau, *Un conte à votre façon* |
| Échantillon (Fairlight Page R) | — | — | fragment prélevé dans un corpus | Reznikoff |

## 5. Fiches d'idées

Phrase de test pour les exemples : *« Le vieux chat dort sur la chaise de la cuisine pendant que la pluie tombe. »* Les dépositions sont **inventées pour l'illustration**. Un « S+n(x) » désigne un résultat qui dépend du dictionnaire chargé.

### 1. Grille d'élagage

- **Origine** : pas et gates d'un séquenceur analogique.
- **Ancrage** : Reznikoff réduit la source sans rien y ajouter.
- **Mécanique** : on découpe le texte en pas (mot ou proposition). Un motif de gates de longueur L se répète sur ces pas. Un pas éteint efface son unité.
- **Exemple** : déposition « Le témoin dit qu'il avait vu l'homme sortir de l'écurie avec une lanterne, / vers dix heures, / et que le feu avait pris peu après. » En propositions avec le motif `x.x`, on obtient « Le témoin dit qu'il avait vu l'homme sortir de l'écurie avec une lanterne, / et que le feu avait pris peu après. » L'heure a disparu, et l'enchaînement devient accusateur.

### 2. Effacement euclidien

- **Origine** : rythme euclidien.
- **Ancrage** : lettrisme, la lettre comme unité.
- **Mécanique** : E(k,n) appliqué aux lettres d'un mot ou aux mots d'une piste ; on garde les frappes.
- **Exemple** : E(3,8) sur « témoigna » (pas 1, 4, 7) donne **t·o·n**. Sur les mots de la phrase de test, E(5,8) `x.xx.xx.` donne « Le chat dort la chaise la cuisine… ».

### 3. Polymétrie des pistes

- **Origine** : séquenceurs synchronisés de longueurs différentes.
- **Ancrage** : le bi-carré de Perec, qui répartit les éléments pour que chaque couple apparaisse une fois.
- **Mécanique** : chaque piste a son propre motif de réglages. Si les longueurs sont premières entre elles (par exemple 3 et 5), chaque combinaison apparaît exactement une fois sur 15 positions.
- **Exemple** : sur les noms, le motif de n `[7, 0, 2]` donne chat → S+7(chat), chaise → chaise, cuisine → S+2(cuisine), pluie → S+7(pluie).

### 4. Verrous par mot

- **Origine** : parameter lock.
- **Ancrage** : les variantes M±n du S+7.
- **Mécanique** : on enregistre un réglage sous la forme (mot, instance de filtre, paramètre, valeur) qui l'emporte sur le réglage de l'instance.
- **Exemple** : S+7 sur les noms, avec « cuisine » verrouillée à n = 1. Les autres noms restent à +7.

### 5. Conditions de déclenchement

- **Origine** : trig conditions.
- **Ancrage** : l'Oulipo, qui énonce ses règles au lieu de s'en remettre au hasard.
- **Mécanique** : l'instance n'agit que sur la k-ième occurrence sur m de sa piste. Si on veut une probabilité, elle passe par une graine affichée et rejouable, pour rester une « règle énoncée » au sens de la fiche produit.
- **Exemple** : lipogramme en e sur les noms, condition « 1:2 ». Il agit sur chat (aucun e, rien ne change) et sur cuisine (remplacée), mais pas sur chaise ni sur pluie.

### 6. Arpégiateur de lettres

- **Origine** : arpégiateur (montant, descendant, latch).
- **Ancrage** : lettrisme ; Perec, *Ulcérations*.
- **Mécanique** : les lettres d'un mot forment l'accord. En mode montant, elles sont triées. Avec le latch, la permutation d'un mot est appliquée aux mots suivants de même longueur.
- **Exemple** : « ulcérations » en montant donne **acéilnorstu**, en descendant **utsronliéca**. Une variante oulipienne n'accepte que les anagrammes présentes dans le lexique.

### 7. Rangées de variantes

- **Origine** : les rangées parallèles du Moog 960.
- **Ancrage** : *Cent mille milliards de poèmes*, qui est littéralement un séquenceur de 14 pas à 10 rangées.
- **Mécanique** : on charge N versions d'un même texte, alignées par vers. Un motif choisit la rangée de chaque pas.
- **Exemple** : avec trois versions alignées et le motif `[1,3,2,…]`, on prend le vers 1 dans la version 1, le vers 2 dans la version 3, et ainsi de suite.

### 8. Motifs et arrangement

- **Origine** : patterns et mode chanson.
- **Ancrage** : *Exercices de style* (un traitement par passage) ; le classement de *Testimony*.
- **Mécanique** : une chaîne de filtres devient un motif nommé. L'arrangement est une liste de (passage, motif).
- **Exemple** : paragraphe 1 = Origine, paragraphe 2 = A (S+7), paragraphe 3 = A+B (S+7 puis lipogramme). La contrainte s'intensifie au fil du texte.

### 9. Quantification du vers

- **Origine** : quantification et swing.
- **Ancrage** : Reznikoff fait passer *Testimony* de la prose (1934) aux vers.
- **Mécanique** : on coupe une ligne tous les k mots. Avec une force s entre 0 et 100 %, chaque coupe se déplace vers la frontière syntaxique la plus proche (ponctuation, début de proposition) dans une fenêtre donnée. Le swing alterne k et k′.
- **Exemple** : avec k = 5 et s = 0, « Le témoin dit qu'il avait / vu l'homme sortir de l'écurie… ». Avec s = 100 %, « Le témoin dit / qu'il avait vu l'homme sortir de l'écurie / avec une lanterne, »

### 10. Mode témoin

- **Origine** : un séquenceur ne fait que déclencher, il ne synthétise rien.
- **Ancrage** : chez Reznikoff, rien n'est ajouté ; « sincerity ».
- **Mécanique** : un verrou sur la chaîne qui n'accepte que les filtres soustractifs ou d'agencement (mute, élagage, quantification, arrangement) et refuse ceux qui substituent (S+n, lipogramme). Le résumé indique « aucun mot ajouté ».
- **Exemple** : la fiche 1 passe, un S+7 est refusé avec un message.

### 11. Échantillonneur de corpus

- **Origine** : la Page R du Fairlight (pas + échantillons).
- **Ancrage** : *Testimony* et *Holocaust*, tirés des comptes rendus de procès.
- **Mécanique** : les pistes deviennent des **documents** et non plus des catégories. Chaque pas de la grille prélève la phrase i du document j.
- **Exemple** : deux dépositions inventées, A et B. Le motif `A1 B1 A3 B2` donne un montage alterné, sans aucun mot ajouté.

### 12. Automation de l'intensité

- **Origine** : courbes d'automation.
- **Ancrage** : les variantes M±n. Aucune œuvre où le n varie le long du texte n'a été trouvée.
- **Mécanique** : une courbe fixe, pour chaque position, le paramètre (n du S+n) ou la part de mots touchés.
- **Exemple** : une rampe de 0 à 100 % sur le lipogramme. Le premier paragraphe est intact, le dernier n'a plus aucun e.

## 6. Partie théorique

- **Le temps, c'est la position dans le texte.** La « timeline » qui manque à Oulipao est le texte lui-même. Les colonnes de l'inspecteur sont déjà une grille de pas qui ne s'avoue pas.
- **Le séquenceur sépare le *quoi* du *quand*.** Les filtres oulipiens sont des instruments : ils transforment. Le séquenceur dit où et quand ils agissent. Oulipao mélange aujourd'hui les deux dans « pistes visées ».
- **La résolution du pas est un choix de poétique.** La lettre correspond à Isou, le mot à Lescure et Queneau, la déposition à Reznikoff. Le séquenceur ne dit rien sur la taille d'un pas, et c'est ce qui permet de réunir les trois courants dans un même modèle.
- **Générer ou agencer.** Reznikoff montre qu'un séquenceur peut se passer entièrement de synthèse : prélever, couper et ordonner suffit à produire un poème. C'est l'idée la moins exploitée pour Oulipao.
- **Là où l'analogie casse :**
  - Un texte n'a pas de tempo, et la lecture n'est pas périodique.
  - La boucle plaît à l'oreille, mais elle se voit à la lecture. Seul Reznikoff en fait une force, par la « narrative repetition ».
  - Couper un mot casse la grammaire alors qu'un silence ne casse pas une mesure. Le mute le montre déjà.
  - Le hasard, banal en musique, va contre la règle énoncée.
  - Les phases amplique et ciselante d'Isou ne donnent qu'une **métaphore** d'automation, pas une règle applicable.
  - Les sauts de pas de *Un conte à votre façon* décrivent un parcours de lecture, pas une transformation du texte. Ils relèvent de l'interface de lecture, pas de la chaîne de filtres.
- **Éthique.** Utiliser des dépositions de victimes comme « échantillons » n'est pas neutre. La sobriété de Reznikoff est une position morale, et le mode témoin la traduit dans l'outil.

## 7. Partie Oulipao (tout dans le navigateur)

| # | Réalisable ? | Ce qu'il faut | Concept existant auquel se raccrocher |
|---|---|---|---|
| 1 Élagage | oui, facile | découpage en mots (existe) ; en propositions, un découpage par la ponctuation | mute (généralisé à la position), inspecteur |
| 2 Euclide | oui, facile | calcul E(k,n), quelques lignes | nouveau type de filtre, pistes visées |
| 3 Polymétrie | oui | réglage par occurrence dans la piste | instances, pistes visées |
| 4 Verrous | oui | stockage des surcharges validé par zod | **inspecteur** : clic sur un mot, on verrouille |
| 5 Conditions | oui | compteur d'occurrences ; graine affichée | drapeau « actif » de l'instance |
| 6 Arpégiateur | oui sans lexique ; avec lexique, il faut un index d'anagrammes | tri des lettres ; lexique existant | piste « autre » ; le résultat sort du lexique |
| 7 Rangées | oui | plusieurs textes alignés | adaptateur `text-sources` |
| 8 Arrangement | oui, plus lourd | notion de passage ; chaîne par passage | chaîne ordonnée, devenue motif |
| 9 Quantification | oui | frontières syntaxiques, déduites des étiquettes et de la ponctuation | étiqueteur existant |
| 10 Mode témoin | oui, trivial | un attribut « soustractif » par type de filtre | chaîne, résumé |
| 11 Échantillonneur | oui | plusieurs sources, découpage en phrases | `text-sources` ; pistes réinterprétées |
| 12 Automation | oui | une courbe par paramètre, en fonction de la position | réglages d'instance |

Recommandation : commencer par **4 (verrous dans l'inspecteur)**, puis **1 + 10 (élagage et mode témoin)**. Les verrous ne demandent presque rien de nouveau et font de l'inspecteur un outil d'édition. Élagage et mode témoin ouvrent l'axe Reznikoff, qu'Oulipao n'a pas du tout aujourd'hui.

## Limites des sources

- Les conditions de déclenchement d'Elektron viennent d'un forum.
- *Exercices de style* est cité de mémoire.
- La méthode exacte de Reznikoff, c'est-à-dire ce qu'il gardait et ce qu'il coupait, n'est pas détaillée dans les sources consultées.
