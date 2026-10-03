# Recensement des lexiques français

Lecture des pages officielles, des README et des fichiers de licence le 2026-10-03.
Ce qui n'a pas été lu sur une source primaire est marqué « non vérifié ». L'analyse des
obligations est une lecture des textes de licence, pas un avis juridique.

## Tableau

| Lexique | Licence exacte | Redistribution dans un dépôt public | Noms communs | Genre et nombre | Taille | Maintenance |
|---|---|---|---|---|---|---|
| Grammalecte / Dicollecte v7.7 (lexique) | MPL 2.0 | Oui ; le fichier et ses dérivés restent sous MPL 2.0 avec leur notice | 115 184 formes, 54 233 lemmes avec genre | Oui (`mas`/`fem`/`epi`, `sg`/`pl`/`inv`) | 12,3 Mo zippé | Actif (décembre 2025) |
| Lexique 3.83 | CC BY-SA 4.0 (une anomalie, voir plus bas) | Oui ; attribution et partage à l'identique | 48 287 formes, 30 567 lemmes (28 957 avec genre) | Oui | 25,9 Mo (TSV) | Figé (2019) ; Lexique 4.1 actif |
| GLÀFF 1.2.2 | CC BY-SA 3.0 | Oui ; attribution et partage à l'identique | 192 387 formes, 105 251 lemmes, tous avec genre | Oui (étiquettes GRACE, ex. `Ncms`) | 13,9 Mo compressé | Figé (2017) |
| Morphalou 3.1 | LGPL-LR | Oui ; le dérivé reste sous LGPL-LR, modifications datées | 188 912 formes, 102 237 lemmes (99 336 masculins ou féminins) | Oui (genre au lemme, nombre à la forme) | 37,8 Mo zippé (CSV) | Figé (2016) |
| Lefff 3.5 | LGPL-LR | Oui ; mêmes obligations que Morphalou | 87 611 formes, 41 947 lemmes (39 827 avec genre) | Oui (`ms`, `fp`…) | 96,1 Mo (JSON) | Dernier commit 2022 |

Les nombres de noms communs ont été comptés le 2026-10-03 sur les fichiers téléchargés
(colonne ou étiquette de catégorie « nom commun » de chaque lexique ; noms propres exclus).

Aucun de ces lexiques ne porte de clause « non commercial » ou « recherche seulement ».

Aucun fichier brut n'a une taille raisonnable pour un navigateur : il faut en extraire un
sous-ensemble, qui reste sous la licence d'origine.

## Détail et sources

### Grammalecte / Dicollecte
- Licence du lexique : « MPL : Mozilla Public License version 2.0 » — `README_lexique.txt`,
  http://grammalecte.net:8080/dir?ci=tip&name=gc_lang/fr/dictionnaire/lexique
- Le logiciel Grammalecte est sous GPL 3 ; cela ne concerne pas les dictionnaires.
- Téléchargement : https://grammalecte.net/dic/lexique-grammalecte-fr-v7.7.zip
- Jeu d'étiquettes : http://grammalecte.net:8080/raw/lexicons/French.tagset.txt?ci=tip
- Contenu annoncé : « liste des formes fléchies, avec lemme, morphologie et indice de fréquence ».

### Lexique (lexique.org)
- Licence de Lexique 3.83 : « CC BY SA40.0 » (sic) —
  https://github.com/chrplr/openlexicon/blob/master/datasets-info/Lexique383/README-Lexique.md
- **Anomalie** : sur la page d'accueil française (http://www.lexique.org/), le texte « Partage
  dans les mêmes conditions 4.0 » est un lien vers la licence CC BY-NC. La page anglaise pointe
  vers BY-SA. Trois sources sur quatre disent BY-SA ; probablement une erreur de lien, non
  confirmée. Un message aux auteurs lèverait le doute.
- Téléchargement : http://www.lexique.org/databases/Lexique383/Lexique383.tsv
- Champs : catégorie grammaticale, genre, nombre, lemme, fréquences (livres et sous-titres).

### GLÀFF
- Licence : « Creative Commons By-SA 3.0 » ; œuvre dérivée du Wiktionnaire —
  http://redac.univ-tlse2.fr/lexiques/glaff.html
- Téléchargement : http://redac.univ-tlse2.fr/lexiques/glaff/GLAFF-1.2.2.tar.bz2
- Une ligne par couple forme × étiquette : le plus commode pour compter les formes ambiguës
  (« affluent » y figure comme nom, adjectif et verbe).
- Formes simples seulement : pas de noms composés, de locutions ni de noms propres.

### Morphalou 3.1
- Licence : « LGPL-LR (Lesser General Public License For Linguistic Resources) » —
  https://repository.ortolang.fr/api/content/morphalou/latest/LISEZ-MOI.html
- Texte : https://repository.ortolang.fr/api/content/morphalou/latest/licenceLGPLLR.txt
- Un programme qui utilise la ressource peut être sous une autre licence, avec mention visible
  de la ressource et copie de la licence.

### Lefff 3.5
- Licence : « Lesser General Public License For Linguistic Resources » —
  https://gitlab.inria.fr/almanach/alexina/lefff/-/blob/master/LICENSE
- Version directement exploitable : https://huggingface.co/datasets/sagot/lefff_morpho

### Autres pistes, non retenues
- DELA/DELAF (Unitex) : LGPL-LR, mais le site précise que les ressources diffusées ne sont pas
  les dictionnaires complets — https://unitexgramlab.org/language-resources
- UniMorph français : CC BY-SA 3.0 ; présence du genre des noms non vérifiée —
  https://github.com/unimorph/fra

## Lexique retenu

**Grammalecte / Dicollecte v7.7** (MPL 2.0). Fichier ouvert et compté le 2026-10-03 :

- une ligne par forme × lemme × lecture ; une forme à plusieurs catégories occupe donc
  plusieurs lignes ;
- colonnes utiles : `Flexion`, `Lemme`, `Étiquettes` (`nom`, `adj`, `adv`, `v0`…`v3`, `mg` pour
  les mots grammaticaux, `mas`/`fem`/`epi`, `sg`/`pl`/`inv`) ;
- 115 184 formes de noms communs avec genre, 54 233 lemmes distincts ;
- les fréquences sont données par forme, pas par lecture : elles ne permettent pas de choisir
  entre deux catégories d'une même forme.

Le fichier brut (55 Mo) n'est pas versionné : le télécharger dans `data/brut/`, puis lancer
`npm run build:lexicon` pour régénérer `data/lexique-oulipao.tsv` (6,6 Mo, MPL 2.0).
