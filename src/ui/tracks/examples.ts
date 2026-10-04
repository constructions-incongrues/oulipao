/** Un texte d'exemple du domaine public, avec de quoi le nommer. */
export interface Example {
  readonly author: string;
  readonly title: string;
  readonly year: number;
  readonly text: string;
}

/**
 * Les exemples, dans l'ordre de la rotation (spec `interface-a-pistes-reglage-en-direct`) : une
 * prose, puis des vers, un par ligne, strophes séparées par une ligne vide. Recopiés de Wikisource.
 */
export const EXAMPLES: readonly Example[] = [
  {
    // fr.wikisource.org/wiki/Du_côté_de_chez_Swann/Partie_1 — coupé à la fin de la troisième phrase.
    author: 'Marcel Proust',
    title: 'Du côté de chez Swann',
    year: 1913,
    text: 'Longtemps, je me suis couché de bonne heure. Parfois, à peine ma bougie éteinte, mes yeux se fermaient si vite que je n’avais pas le temps de me dire : « Je m’endors. » Et, une demi-heure après, la pensée qu’il était temps de chercher le sommeil m’éveillait ; je voulais poser le volume que je croyais avoir encore dans les mains et souffler ma lumière ; je n’avais pas cessé en dormant de faire des réflexions sur ce que je venais de lire, mais ces réflexions avaient pris un tour un peu particulier ; il me semblait que j’étais moi-même ce dont parlait l’ouvrage : une église, un quatuor, la rivalité de François Ier et de Charles-Quint.',
  },
  {
    // fr.wikisource.org/wiki/Fables_de_La_Fontaine_(éd._1874)/Le_Corbeau_et_le_Renard
    author: 'Jean de La Fontaine',
    title: 'Le Corbeau et le Renard',
    year: 1668,
    text: `Maître corbeau, sur un arbre perché,
Tenait en son bec un fromage.
Maître renard, par l’odeur alléché,
Lui tint à peu près ce langage :
Hé ! bonjour, monsieur du corbeau.
Que vous êtes joli ! que vous me semblez beau !
Sans mentir, si votre ramage
Se rapporte à votre plumage,
Vous êtes le phénix des hôtes de ces bois.
À ces mots le corbeau ne se sent pas de joie ;
Et, pour montrer sa belle voix,
Il ouvre un large bec, laisse tomber sa proie.
Le renard s’en saisit, et dit : Mon bon monsieur,
Apprenez que tout flatteur
Vit aux dépens de celui qui l’écoute :
Cette leçon vaut bien un fromage, sans doute.
Le corbeau, honteux et confus,
Jura, mais un peu tard, qu’on ne l’y prendrait plus.`,
  },
  {
    // fr.wikisource.org/wiki/Poésies_(Rimbaud)/éd._Vanier,_1895/Le_Dormeur_du_val
    author: 'Arthur Rimbaud',
    title: 'Le Dormeur du val',
    year: 1870,
    text: `C’est un trou de verdure où chante une rivière
Accrochant follement aux herbes des haillons
D’argent ; où le soleil, de la montagne fière,
Luit : c’est un petit val qui mousse de rayons.

Un soldat jeune, bouche ouverte, tête nue,
Et la nuque baignant dans le frais cresson bleu,
Dort ; il est étendu dans l’herbe, sous la nue,
Pâle dans son lit vert où la lumière pleut.

Les pieds dans les glaïeuls, il dort. Souriant comme
Sourirait un enfant malade, il fait un somme :
Nature, berce-le chaudement : il a froid.

Les parfums ne font pas frissonner sa narine ;
Il dort dans le soleil, la main sur sa poitrine
Tranquille. Il a deux trous rouges au côté droit.`,
  },
  {
    // fr.wikisource.org/wiki/Poèmes_saturniens_(1866)/Chanson_d’automne
    author: 'Paul Verlaine',
    title: 'Chanson d’automne',
    year: 1866,
    text: `Les sanglots longs
Des violons
De l’automne
Blessent mon cœur
D’une langueur
Monotone.

Tout suffocant
Et blême, quand
Sonne l’heure,
Je me souviens
Des jours anciens
Et je pleure ;

Et je m’en vais
Au vent mauvais
Qui m’emporte
Deçà, delà,
Pareil à la
Feuille morte.`,
  },
  {
    // fr.wikisource.org/wiki/Les_Contemplations/« Demain,_dès_l’aube,_à_l’heure_où_blanchit_la_campagne »
    author: 'Victor Hugo',
    title: 'Demain, dès l’aube',
    year: 1856,
    text: `Demain, dès l’aube, à l’heure où blanchit la campagne,
Je partirai. Vois-tu, je sais que tu m’attends.
J’irai par la forêt, j’irai par la montagne.
Je ne puis demeurer loin de toi plus longtemps.

Je marcherai les yeux fixés sur mes pensées,
Sans rien voir au dehors, sans entendre aucun bruit,
Seul, inconnu, le dos courbé, les mains croisées,
Triste, et le jour pour moi sera comme la nuit.

Je ne regarderai ni l’or du soir qui tombe,
Ni les voiles au loin descendant vers Harfleur,
Et quand j’arriverai, je mettrai sur ta tombe
Un bouquet de houx vert et de bruyère en fleur.`,
  },
];

/** L'exemple que la saisie contient tel quel, s'il y en a un. */
export const exampleOf = (input: string): Example | undefined => EXAMPLES.find((example) => example.text === input);
