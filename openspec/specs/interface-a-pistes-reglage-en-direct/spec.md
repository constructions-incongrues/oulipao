# interface-a-pistes-reglage-en-direct Specification

## Purpose
Montrer un texte français comme une partition de pistes linguistiques sur laquelle on branche et on règle le S+7, le résultat se mettant à jour à chaque geste.

## Requirements

### Requirement: Tranche de réglage par piste
The system SHALL give each track a channel strip, at the head of its row in the step grid, showing the track's shape, its name, its word count, a mute button, a solo button and a reminder of the instances that target it; an instance that targets all five tracks SHALL be recalled once, at the head of the strips, instead of in each strip. Filters are set in the chain, not on the strip.

#### Scenario: Piste sans plugin
- **GIVEN** la piste des verbes et aucun filtre qui la vise
- **WHEN** sa tranche s'affiche
- **THEN** elle montre le carré des verbes, leur nom, leur nombre de mots, Muet et Seul, et aucun rappel de filtre

#### Scenario: Filtre sur les cinq pistes
- **GIVEN** un S+7 sur les noms puis un lipogramme sur les cinq pistes
- **WHEN** les tranches s'affichent
- **THEN** la tranche des noms rappelle « 1. S+7 », aucune tranche ne rappelle le lipogramme, et la tête des tranches dit « Toutes les pistes : 2. Lipogramme en e »

### Requirement: Plugin S+7 sur la piste des noms
The system SHALL open with an empty chain; a S+7 added to the chain targets the nouns track, enabled, with offset 7 and re-agreement mode.

#### Scenario: Ouverture
- **GIVEN** la page à pistes qui vient de s'ouvrir
- **WHEN** la chaîne s'affiche
- **THEN** elle ne porte aucune contrainte et le texte passe tel quel

#### Scenario: Ajout d'un S+7
- **GIVEN** la chaîne vide
- **WHEN** on ajoute un S+7
- **THEN** il vise les noms, actif, décalage 7, mode « réaccord »

### Requirement: Réglage en direct
The system SHALL update the resulting text when the offset changes, when the plugin is disabled or re-enabled, or when the mode changes, without tagging the text again.

#### Scenario: Changement de décalage
- **GIVEN** un texte étiqueté et le plugin actif
- **WHEN** le décalage passe de 7 à 3
- **THEN** le texte résultant change sans nouvel étiquetage

#### Scenario: Plugin coupé
- **GIVEN** un texte transformé
- **WHEN** le plugin est coupé
- **THEN** le texte résultant est le texte d'origine

### Requirement: Mute et solo
The system SHALL remove from the resulting text the words of a muted track, tightening the spacing and keeping punctuation, and SHALL keep only the words of soloed tracks when at least one track is soloed; the others track follows the same rule.

#### Scenario: Piste muette
- **GIVEN** le texte « la vieille horloge s'arrêta »
- **WHEN** la piste des adjectifs est rendue muette
- **THEN** le texte résultant est « la horloge s'arrêta »

#### Scenario: Piste en solo
- **GIVEN** un texte étiqueté
- **WHEN** la piste des verbes est mise en solo
- **THEN** le texte résultant ne contient que les verbes et la ponctuation

### Requirement: Copie du résultat
The system SHALL place the resulting text in the clipboard when the copy button is used, preceded by the original text when the result differs from it, as a notebook entry is copied.

#### Scenario: Copie
- **GIVEN** un texte résultant affiché, transformé par la chaîne
- **WHEN** le bouton de copie est actionné
- **THEN** le presse-papiers contient l'original, une ligne vide, le texte résultant et sa mention

#### Scenario: Copie du texte d'origine
- **GIVEN** un texte résultant identique à l'original (filtres coupés ou sans effet)
- **WHEN** le bouton de copie est actionné
- **THEN** le presse-papiers contient ce texte seul, sans mention

#### Scenario: Copie d'une éclipse
- **GIVEN** la forme éclipse, dont le résultat contient déjà l'original
- **WHEN** le bouton de copie est actionné
- **THEN** l'original n'est pas répété

### Requirement: États d'attente et d'échec
The system SHALL say so while the tagging model, the dictionary, the verbs or the phonetic textbank are loading, SHALL say so when loading fails, and SHALL remain usable for a new attempt. A load that receives no data for 30 seconds SHALL stop and SHALL be reported as stalled, naming what was loading, with a control to retry. Whatever the outcome of the latest attempt to put a text on tracks or to reopen a kept text, the « Mettre en pistes » control SHALL become available again once that attempt ends.

#### Scenario: Chargement en cours
- **GIVEN** un premier étiquetage
- **WHEN** le modèle se charge
- **THEN** la page indique l'attente

#### Scenario: Échec du chargement
- **GIVEN** un chargement qui échoue
- **WHEN** l'erreur survient
- **THEN** la page l'indique et permet de relancer

#### Scenario: Échec de la textbank phonétique
- **GIVEN** une chaîne avec un R+n dont la textbank ne se charge pas
- **WHEN** l'erreur survient
- **THEN** la page l'indique, les autres filtres continuent de s'appliquer, et un bouton permet de relancer

#### Scenario: Verbes ou prononciations en cours de chargement
- **GIVEN** une chaîne à laquelle on ajoute un R+n, ou une contrainte qui vise les verbes
- **WHEN** le fichier correspondant se charge
- **THEN** la page affiche « Chargement des prononciations… » ou « Chargement des verbes… » à l'endroit où s'afficherait son erreur, et retire ce message à l'arrivée du fichier

#### Scenario: Chargement calé
- **GIVEN** le chargement du modèle en cours
- **WHEN** aucune donnée n'arrive pendant 30 secondes
- **THEN** le chargement s'arrête, la page affiche « Le chargement du modèle ne progresse plus. » suivi de « Rien reçu depuis 30 secondes : la connexion est peut-être coupée. » et d'un bouton « Relancer »

#### Scenario: Réseau lent mais vivant
- **GIVEN** le chargement du modèle sur une connexion lente qui reçoit des données au moins toutes les 30 secondes
- **WHEN** le chargement dure plusieurs minutes
- **THEN** il n'est pas interrompu

#### Scenario: Réouverture pendant un chargement qui échoue
- **GIVEN** une mise en pistes lancée pendant le chargement du modèle, puis la réouverture d'un texte du carnet
- **WHEN** le chargement échoue
- **THEN** l'échec s'affiche avec « Relancer », et le bouton « Mettre en pistes » est de nouveau actif

### Requirement: Accessibilité des réglages
The system SHALL make every control reachable by keyboard and SHALL never convey the category of a word by colour alone.

#### Scenario: Navigation au clavier
- **GIVEN** la page des pistes
- **WHEN** l'utilisateur parcourt la page au clavier
- **THEN** chaque bouton, champ et sélecteur reçoit le focus et porte un libellé

### Requirement: Traitement dans le navigateur
The system SHALL process the text entirely in the browser, with no network request containing the text, including texts kept in the notebook.

#### Scenario: Session observée dans l'onglet réseau
- **GIVEN** la page des pistes ouverte avec l'onglet réseau
- **WHEN** un texte est collé, étiqueté, transformé puis gardé
- **THEN** aucune requête ne contient le texte

### Requirement: Texte résultant toujours visible
The system SHALL keep the resulting text on screen while the page scrolls: once its band would leave the top of the screen, it SHALL stay pinned at the top in a compact form showing at most four lines (three below 768 px), the rest scrolling inside the band, with the copy button still reachable on screens 768 px wide or more. While not pinned, the band SHALL take the height of its text and SHALL NOT scroll on its own.

#### Scenario: Régler la grille
- **GIVEN** un texte de 44 mots mis en pistes sur un écran de 1280 × 900
- **WHEN** l'utilisateur fait défiler la page jusqu'à la grille
- **THEN** la bande du texte résultant reste en haut de l'écran, montre quatre lignes au plus et se met à jour quand un pas est bouché

#### Scenario: Téléphone
- **GIVEN** une fenêtre de 375 px de large
- **WHEN** la page défile
- **THEN** la bande collée montre trois lignes au plus et la page ne défile pas à l'horizontale

#### Scenario: Poème long en haut de page
- **GIVEN** un poème de 30 vers mis en pistes, la page en haut
- **WHEN** l'utilisateur fait tourner la molette au-dessus de la bande
- **THEN** c'est la page qui défile, pas la bande

### Requirement: Ordre de la page
The system SHALL present, from top to bottom: the resulting text, the notebook panel, the source text, the filter chain, the step grid with its track strips, then the inspector. The notebook panel SHALL NOT be pinned with the resulting text.

#### Scenario: Lecture au clavier
- **GIVEN** la page des pistes
- **WHEN** l'utilisateur la parcourt avec la touche Tab
- **THEN** il atteint la copie du texte et le bouton « Garder », puis l'en-tête du carnet, puis la saisie, puis les filtres, puis les pistes et leurs pas, puis l'inspecteur

#### Scenario: Carnet replié en haut de page
- **GIVEN** un texte mis en pistes et un carnet de 3 entrées, replié
- **WHEN** l'utilisateur fait défiler la page jusqu'à la grille
- **THEN** seule la bande du texte résultant reste collée en haut de l'écran ; le carnet replié n'occupe qu'une ligne sous elle

### Requirement: Syllabes par vers
The system SHALL show, next to each line of the result text, its syllable count, counted from the pronunciations of the textbank and including a final mute e before a consonant inside the line, as well as the e of a final « -es » or « -ent » before a vowel inside the line (the liaison makes it heard), once the textbank is loaded; the count SHALL be hidden when the chain has no phonetic filter.

#### Scenario: Alexandrin
- **GIVEN** une chaîne avec un filtre phonétique et le vers « Je fais souvent ce rêve étrange et pénétrant »
- **WHEN** le texte résultant s'affiche
- **THEN** ce vers porte le compte 12

#### Scenario: E muet porté par la liaison
- **GIVEN** une chaîne avec un filtre phonétique et le vers « Ni les voiles au loin descendant vers Harfleur »
- **WHEN** le texte résultant s'affiche
- **THEN** ce vers porte le compte 12, le e de « voiles » comptant devant « au »

#### Scenario: Sans filtre phonétique
- **GIVEN** une chaîne sans filtre phonétique
- **WHEN** le texte résultant s'affiche
- **THEN** aucun compte de syllabes n'apparaît

### Requirement: Vers recopiés dans le texte résultant
The system SHALL mark each refrain line of the resulting text as a copy of the line it repeats, visibly and for screen readers; selecting a word of a copy SHALL open in the inspector the original word it repeats; the copy button SHALL copy the resulting text with its refrains and without the marks.

#### Scenario: Clic sur un refrain
- **GIVEN** un rondel affiché
- **WHEN** on clique un mot du vers 7
- **THEN** l'inspecteur s'ouvre sur ce mot dans le vers 1, et le vers 7 se signale comme la copie du vers 1

#### Scenario: Copie d'un rondel
- **GIVEN** un rondel affiché
- **WHEN** le bouton de copie est actionné
- **THEN** le presse-papiers contient les treize vers en trois strophes, sans marque de copie

### Requirement: Texte normalisé à l'entrée
The system SHALL normalise every source text to Unicode composed form (NFC) as soon as it enters — typed, pasted, or restored from the notebook — before tagging, so that a decomposed accent (a letter followed by a combining mark) is treated exactly like the precomposed letter.

#### Scenario: Accents décomposés
- **GIVEN** le texte « été » écrit avec un « e » suivi d'un accent aigu combinant, et le même texte écrit en caractères précomposés
- **WHEN** chacun est mis en pistes avec un S+7
- **THEN** les deux textes résultants sont identiques

### Requirement: Raccourci de l'écoute signalé
The system SHALL declare the space-bar shortcut of the play control to assistive technology and SHALL print « Espace » as a keyboard key beside that control on screens 768 px wide or more. When no French voice is available, the space bar SHALL keep its ordinary effect, including activating the focused button.

#### Scenario: Raccourci déclaré
- **GIVEN** un texte mis en pistes
- **WHEN** un lecteur d'écran atteint la touche d'écoute
- **THEN** il annonce le raccourci de la barre d'espace

#### Scenario: Étiquette sur petit écran
- **GIVEN** la page à 375 px de large
- **WHEN** la console d'écoute s'affiche
- **THEN** la touche « Espace » n'apparaît pas

#### Scenario: Sans voix française
- **GIVEN** aucune voix française installée et le focus sur la touche « Muet » de la piste des noms
- **WHEN** l'utilisateur appuie sur la barre d'espace
- **THEN** la piste des noms devient muette

### Requirement: Exemples en rotation
The system SHALL offer five public-domain example texts, in this fixed order: Proust, « Longtemps, je me suis couché de bonne heure » (opening of *Du côté de chez Swann*, 1913); La Fontaine, *Le Corbeau et le Renard* (1668); Rimbaud, *Le Dormeur du val* (1870); Verlaine, *Chanson d'automne* (1866); Hugo, *Demain, dès l'aube* (1856). Each text SHALL hold at most 150 words and verse texts SHALL keep one line per verse and a blank line between stanzas.

The example button SHALL be shown in the open input whenever the input is empty or holds one of the example texts unchanged, before and after a first run alike, and SHALL be hidden otherwise. Its label SHALL be « Essayer avec un exemple » until it has been used once in the visit, then « Autre exemple ». Each click SHALL place the next example text in the input and run it, the first click of a visit placing the first text and the click after the last text placing the first again. When no constraint is enabled, the click SHALL first add an S+7 on nouns with its default settings, so that the example plays; otherwise the current chain SHALL be kept unchanged. Nothing about the rotation SHALL be stored beyond the visit.

Whenever the input holds one of the example texts unchanged, a line SHALL name its author, title and year under the input, and the folded input SHALL name them too.

#### Scenario: Premier essai
- **GIVEN** une première visite, la saisie vide
- **WHEN** on clique « Essayer avec un exemple »
- **THEN** un S+7 sur les noms est branché, le début de *Du côté de chez Swann* est mis en pistes avec ses noms remplacés, la mention « Marcel Proust, Du côté de chez Swann (1913) » s'affiche, et le bouton se lit « Autre exemple » quand on rouvre la saisie

#### Scenario: Exemple suivant avec la même chaîne
- **GIVEN** le texte de Proust mis en pistes avec un S+7 branché
- **WHEN** on rouvre la saisie et clique « Autre exemple »
- **THEN** *Le Corbeau et le Renard* est mis en pistes, toujours avec le S+7 branché

#### Scenario: Retour au premier texte
- **GIVEN** *Demain, dès l'aube* mis en pistes comme cinquième exemple
- **WHEN** on clique « Autre exemple »
- **THEN** le texte de Proust est de nouveau mis en pistes

#### Scenario: Texte collé protégé
- **GIVEN** un texte collé dans la saisie, ou un exemple retouché d'un seul caractère
- **WHEN** la saisie s'affiche
- **THEN** le bouton d'exemple n'apparaît pas, et aucune mention de source non plus

#### Scenario: Nouvelle visite
- **GIVEN** une visite précédente arrêtée sur le troisième exemple
- **WHEN** on rouvre la page et clique « Essayer avec un exemple »
- **THEN** c'est le texte de Proust qui est mis en pistes

#### Scenario: Chaîne déjà en marche
- **GIVEN** un lipogramme en e en marche, sans autre contrainte
- **WHEN** on clique « Essayer avec un exemple »
- **THEN** le texte de Proust est mis en pistes avec le seul lipogramme, sans S+7 ajouté

#### Scenario: Contraintes toutes coupées
- **GIVEN** une chaîne d'un S+7 coupé
- **WHEN** on clique « Essayer avec un exemple »
- **THEN** un S+7 sur les noms en marche s'ajoute en fin de chaîne, et le S+7 coupé reste coupé

### Requirement: Texte long sans ponctuation
The system SHALL put on tracks a text of up to 600 words that contains no sentence-ending punctuation, such as a poem without full stops, giving every word one of the five categories, instead of failing the whole tagging.

#### Scenario: Poème sans point
- **GIVEN** un poème de 600 mots, en vers, sans aucun point, point d'exclamation, point d'interrogation ni points de suspension
- **WHEN** l'utilisateur le met en pistes
- **THEN** chaque mot reçoit une des cinq catégories et la grille s'affiche

### Requirement: Découpage des mots composés
The system SHALL keep as one word a hyphenated compound whose second part looks like a pronoun when it belongs to a fixed list of lexicalised compounds (at least « rendez-vous », « on-dit », « chez-soi », « chez-moi », « m'as-tu-vu »), while still splitting a verb from its clitic pronoun (« dit-il », « donne-le »). It SHALL treat the modifier letter apostrophe (U+02BC) as an apostrophe, like « ' » and « ’ ».

#### Scenario: Nom composé
- **GIVEN** le texte « Le rendez-vous est pris. »
- **WHEN** il est mis en pistes
- **THEN** « rendez-vous » est un seul mot de la piste des noms

#### Scenario: Verbe et pronom
- **GIVEN** le texte « Viens, dit-il. »
- **WHEN** il est mis en pistes
- **THEN** « dit » et « il » sont deux mots

#### Scenario: Apostrophe modificative
- **GIVEN** le texte « lʼarbre » écrit avec l'apostrophe U+02BC
- **WHEN** il est mis en pistes
- **THEN** « l » et « arbre » sont découpés comme avec « l'arbre »

### Requirement: Ponctuation française insécable
The system SHALL display the result text with a narrow no-break space before « ; », « ! » and « ? », and a no-break space before « : » and « » » and after « « », so that no line starts with these marks; the copied text SHALL stay unchanged.

#### Scenario: Point-virgule en fin de ligne
- **GIVEN** un texte résultant « … m'éveillait ; je voulais … » qui se coupe à cet endroit
- **WHEN** la bande l'affiche
- **THEN** « ; » reste en fin de ligne avec « m'éveillait », et la ligne suivante commence par « je »

#### Scenario: Copie
- **WHEN** l'utilisateur copie le texte résultant
- **THEN** le presse-papiers reçoit les espaces ordinaires du texte

### Requirement: Écoute dans l'en-tête de la grille
The system SHALL place the listening controls (play, tempo, voice) in the header of the step grid, between its title and its page keys.

#### Scenario: Texte mis en pistes
- **GIVEN** un texte mis en pistes
- **WHEN** la grille s'affiche
- **THEN** son en-tête montre, dans l'ordre, son titre, « Écouter », le tempo, la voix, puis les pages

### Requirement: Phrase d'état dans la chaîne
The system SHALL announce what the chain did to the text in a status sentence placed under the chain's title, and SHALL NOT show the chain's own empty message when that sentence already says there is no constraint.

#### Scenario: Une contrainte
- **GIVEN** un S+7 qui remplace 19 noms sur 20
- **WHEN** la chaîne s'affiche
- **THEN** sous « Contraintes », la phrase « S+7 sur les noms : 19 noms remplacés sur 20. » est lue par les lecteurs d'écran

#### Scenario: Aucune contrainte
- **GIVEN** un texte mis en pistes et une chaîne vide
- **WHEN** la chaîne s'affiche
- **THEN** elle dit « Aucune contrainte : texte d'origine. » une seule fois

### Requirement: Bande collée réduite au texte au téléphone
Below 768 px, the system SHALL hide the header of the pinned result strip (its title, keys and form choice) and SHALL keep only its text; the header SHALL come back when the strip is no longer pinned.

#### Scenario: On descend
- **GIVEN** la page à 375 px de large et un texte mis en pistes
- **WHEN** l'utilisateur descend jusqu'à la grille
- **THEN** la bande collée ne montre que trois lignes de texte, sans touches

### Requirement: Phrases qui commencent par une majuscule
The system SHALL start each sentence of the status line and each inspector band label with a capital letter; the mention appended to a copy SHALL keep its own case.

#### Scenario: Lipogramme
- **GIVEN** un lipogramme en e dans la chaîne
- **WHEN** la phrase d'état s'affiche
- **THEN** elle dit « Lipogramme en e : … »

### Requirement: Geste principal de la saisie
The system SHALL mark « Mettre en pistes » as the main key of the source panel with a 2 px ink outline, at the same size as the other keys and without an accent colour.

#### Scenario: Saisie dépliée
- **GIVEN** la saisie dépliée
- **WHEN** l'utilisateur la regarde
- **THEN** « Mettre en pistes » a un contour de 2 px et « Essayer avec un exemple » un contour de 1 px

### Requirement: Texte d'un seul vers sous une mise en page par vers
The system SHALL add to the status sentence « Le texte n'a qu'un vers : collez un poème, ou mettez-le d'abord en vers. » when a Bord instance acts on a text of a single line and no step before it has put the text into lines.

#### Scenario: Haï-kaïsation sur de la prose
- **GIVEN** l'extrait de Proust, d'un seul paragraphe
- **WHEN** on branche Haï-kaïsation
- **THEN** la phrase d'état dit « Haï-kaïsation : 117 mots retirés. Le texte n'a qu'un vers : collez un poème, ou mettez-le d'abord en vers. »

#### Scenario: Après une mise en vers
- **GIVEN** le même extrait, une mise en vers tous les 8 mots puis un Bord
- **WHEN** la phrase d'état s'affiche
- **THEN** elle ne parle pas d'un seul vers

### Requirement: Brancher une contrainte depuis la bande
While a text is on tracks and no constraint is enabled, the system SHALL show under the resulting text the line « Aucune contrainte en marche : le texte est rendu tel quel. » with a « Brancher une contrainte » control, also when the result strip is stuck to the top of the screen. Using the control SHALL open the constraint catalogue, scroll it into view below the stuck strip (instantly when reduced motion is requested), and move the focus to its first control. The line SHALL disappear as soon as a constraint is enabled. Nothing SHALL open or scroll without this gesture.

#### Scenario: Premier texte, chaîne vide
- **GIVEN** un texte collé, aucune contrainte
- **WHEN** l'utilisateur le met en pistes
- **THEN** la bande montre le texte inchangé, puis « Aucune contrainte en marche : le texte est rendu tel quel. » et la touche « Brancher une contrainte » ; l'écran n'a pas bougé

#### Scenario: Brancher
- **GIVEN** l'invite affichée, le catalogue replié deux écrans plus bas
- **WHEN** l'utilisateur actionne « Brancher une contrainte »
- **THEN** le catalogue s'ouvre, l'écran défile jusqu'à lui, et le focus est sur sa première touche

#### Scenario: Une contrainte en marche
- **GIVEN** l'invite affichée
- **WHEN** l'utilisateur ajoute un S+7 depuis le catalogue
- **THEN** l'invite disparaît et la bande montre les noms remplacés

#### Scenario: Chaîne montée
- **GIVEN** un S+7 en marche
- **WHEN** l'utilisateur met un autre texte en pistes
- **THEN** aucune invite ne s'affiche

### Requirement: Phrase d'accueil sur la page vide
While no resulting text exists and no shared-link arrival is shown, the system SHALL display, above the source input and next to the example button, one welcome sentence that names Oulipao as an instrument and its three gestures: paste a text, add a constraint, listen to what it does. The sentence SHALL be plain text read by screen readers, SHALL follow the design system, and SHALL fit a 375 px wide screen without horizontal scrolling. It SHALL disappear as soon as a resulting text exists and SHALL NOT come back during the visit.

#### Scenario: Première ouverture
- **GIVEN** une première visite, sans paramètre dans l'adresse
- **WHEN** la page s'affiche
- **THEN** la phrase d'accueil est visible au-dessus de la saisie, à côté de « Essayer avec un exemple »

#### Scenario: Pendant le chargement du modèle
- **GIVEN** la page vide et le modèle d'étiquetage en cours de chargement
- **WHEN** la barre de progression s'affiche
- **THEN** la phrase d'accueil reste visible

#### Scenario: Après la première mise en pistes
- **GIVEN** la phrase d'accueil visible
- **WHEN** un texte est mis en pistes et le texte résultant apparaît
- **THEN** la phrase d'accueil n'est plus affichée, même si l'on rouvre la saisie

#### Scenario: Arrivée par un lien partagé
- **GIVEN** une adresse qui porte une entrée de carnet partagée
- **WHEN** la page s'affiche avec l'action « Rejouer »
- **THEN** la phrase d'accueil n'est pas affichée
