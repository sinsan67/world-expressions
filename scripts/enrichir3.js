// Troisième vague — comblement pour atteindre 400
// Usage : node scripts/enrichir3.js

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'expressions.json');

const NOUVELLES_EXPRESSIONS = [
  {
    id: "faire-une-pierre-deux-coups",
    expression: "Faire d'une pierre deux coups",
    signification: "Atteindre deux objectifs avec une seule action.",
    origine: "Image du chasseur qui abat deux oiseaux d'un seul lancer de pierre — efficacité maximale avec un effort minimal. Variante directe de « tuer deux oiseaux d'une pierre ».",
    exemple: "En allant à Lyon pour le travail, il a rendu visite à sa famille — d'une pierre deux coups.",
    registre: "courant",
    tags: ["efficacité", "pragmatisme"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-diable-au-corps",
    expression: "Avoir le diable au corps",
    signification: "Être animé d'une énergie ou d'une passion débordante, parfois incontrôlable.",
    origine: "Expression religieuse médiévale : la possession démoniaque expliquait les comportements excessifs. Aujourd'hui, elle désigne simplement une vitalité extraordinaire.",
    exemple: "Ce gamin a le diable au corps — impossible de le calmer.",
    registre: "courant",
    tags: ["énergie", "vitalité", "intensité", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "en-pincer-pour-quelqu-un",
    expression: "En pincer pour quelqu'un",
    signification: "Être amoureux de quelqu'un.",
    origine: "Argot du XIXe siècle. « Pincer » au sens de « attraper » — être pincé par l'amour c'est être saisi par ce sentiment.",
    exemple: "Tout le monde a vu qu'il en pinçait pour la nouvelle stagiaire.",
    registre: "familier",
    tags: ["amour", "séduction", "émotions"],
    region: null,
    illustration: null
  },
  {
    id: "tailleur-une-bavette",
    expression: "Tailler une bavette",
    signification: "Bavarder longuement et agréablement.",
    origine: "La bavette, petite pièce de tissu que portaient les enfants pour ne pas se salir, est associée à la bouche qui « bave » (parle). Tailler se rapporte à la taille du tissu — couper court ou long.",
    exemple: "On s'est posés dans un café pour tailler une bavette pendant des heures.",
    registre: "familier",
    tags: ["conversation", "sociabilité", "amitié"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-dernier-mot",
    expression: "Avoir le dernier mot",
    signification: "Remporter une dispute, imposer sa position finale.",
    origine: "Dans une joute verbale, celui qui parle en dernier a souvent l'avantage de conclure. Avoir le dernier mot c'est clore le débat à son avantage.",
    exemple: "Il faut toujours qu'elle ait le dernier mot dans toutes les discussions.",
    registre: "courant",
    tags: ["conflit", "victoire", "communication", "caractère"],
    region: null,
    illustration: null
  },
  {
    id: "la-moutarde-monte-au-nez",
    expression: "La moutarde lui monte au nez",
    signification: "La colère commence à monter, on est sur le point de s'emporter.",
    origine: "La moutarde piquante provoque une sensation de brûlure qui monte vers les narines. Cette image olfactive et physique traduit parfaitement la montée d'une irritation.",
    exemple: "Quand il l'a entendu se vanter une troisième fois, la moutarde lui est montée au nez.",
    registre: "courant",
    tags: ["colère", "irritation", "émotions", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "ne-rien-avoir-dans-le-ventre",
    expression: "Ne rien avoir dans le ventre",
    signification: "Manquer de courage et de détermination.",
    origine: "Le ventre (siège des « tripes ») représente dans la culture populaire le courage viscéral. Ne rien y avoir c'est être creux, sans force intérieure.",
    exemple: "Il a reculé face au premier obstacle — il n'a rien dans le ventre.",
    registre: "familier",
    tags: ["lâcheté", "manque de courage", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "partir-dans-tous-les-sens",
    expression: "Partir dans tous les sens",
    signification: "Manquer de cohérence, aller dans des directions multiples et contradictoires.",
    origine: "Image du mouvement désordonné, sans cap — quelqu'un ou quelque chose qui se disperse sans direction claire.",
    exemple: "La réunion est partie dans tous les sens — on n'a rien décidé.",
    registre: "courant",
    tags: ["désorganisation", "confusion", "travail"],
    region: null,
    illustration: null
  },
  {
    id: "mettre-son-nez-dans-les-affaires",
    expression: "Mettre son nez dans les affaires des autres",
    signification: "S'immiscer dans ce qui ne nous regarde pas.",
    origine: "Le nez fourré partout est le signe de l'indiscret. Mettre son nez dans les affaires c'est s'y introduire sans y être invité.",
    exemple: "Il met toujours son nez dans les affaires des autres — rien n'est privé avec lui.",
    registre: "courant",
    tags: ["indiscrétion", "curieux", "relations", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "se-gratter-la-tete",
    expression: "Se gratter la tête",
    signification: "Être perplexe, chercher une solution à un problème difficile.",
    origine: "Geste universel de la réflexion intense — se gratter la tête en signe de perplexité est un comportement spontané transposé en expression.",
    exemple: "On s'est tous gratté la tête face à cette équation — personne n'avait la réponse.",
    registre: "courant",
    tags: ["perplexité", "réflexion", "problème", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "mettre-la-puce-a-l-oreille",
    expression: "Mettre la puce à l'oreille de quelqu'un",
    signification: "Éveiller les soupçons de quelqu'un, lui donner une information qui l'alerte.",
    origine: "Variante active de « avoir la puce à l'oreille » — c'est l'action de placer l'inquiétude dans l'oreille d'autrui.",
    exemple: "Sa réponse évasive m'a mis la puce à l'oreille.",
    registre: "courant",
    tags: ["suspicion", "alerte", "communication", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "se-faire-une-montagne",
    expression: "Se faire une montagne de quelque chose",
    signification: "Exagérer la difficulté d'une tâche, s'en effrayer plus que nécessaire.",
    origine: "Image de la montagne inaccessible appliquée à ce qui est en réalité surmontable. La montagne symbolise un obstacle que l'esprit grossit.",
    exemple: "Il s'est fait une montagne de ce déménagement — ça s'est très bien passé.",
    registre: "courant",
    tags: ["exagération", "peur", "obstacle"],
    region: null,
    illustration: null
  },
  {
    id: "tout-feu-tout-flamme",
    expression: "Être tout feu tout flamme",
    signification: "Être très enthousiaste, débordant d'ardeur pour quelque chose.",
    origine: "Image de l'intensité du feu — la flamme vive représente un enthousiasme brûlant et immédiat. Souvent suivi d'un essoufflement.",
    exemple: "Au début du projet elle était tout feu tout flamme, mais après un mois l'enthousiasme est retombé.",
    registre: "courant",
    tags: ["enthousiasme", "ardeur", "motivation"],
    region: null,
    illustration: null
  },
  {
    id: "prendre-les-devants",
    expression: "Prendre les devants",
    signification: "Agir avant les autres, anticiper pour être en position favorable.",
    origine: "Expression militaire : prendre les positions de devant donne l'avantage stratégique. Appliquée à toute situation où l'initiative crée un avantage.",
    exemple: "Elle a pris les devants en contactant le client avant l'appel d'offres.",
    registre: "courant",
    tags: ["initiative", "stratégie", "anticipation"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-un-cheveu-sur-la-langue",
    expression: "Avoir un cheveu sur la langue",
    signification: "Avoir du mal à prononcer les S, zozoter.",
    origine: "Image comique : un cheveu coincé sur la langue gênerait la prononciation. L'expression désigne les défauts d'articulation, particulièrement le zézaiement.",
    exemple: "Il a un léger cheveu sur la langue — ça le rend attendrissant.",
    registre: "courant",
    tags: ["langage", "corps", "prononciation"],
    region: null,
    illustration: null
  },
  {
    id: "se-tirer-une-balle-dans-le-pied",
    expression: "Se tirer une balle dans le pied",
    signification: "Agir contre ses propres intérêts, provoquer soi-même ses propres malheurs.",
    origine: "Image du soldat qui, volontairement ou par maladresse, se blesse au pied — ce qui l'exempte de combattre mais l'invalide. Transposée à toute action qui se retourne contre soi.",
    exemple: "En critiquant le jury, il s'est tiré une balle dans le pied.",
    registre: "courant",
    tags: ["erreur stratégique", "autodestruction", "maladresse"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-une-case-en-moins",
    expression: "Avoir une case en moins",
    signification: "Être un peu fou, manquer de bon sens.",
    origine: "Métaphore du cerveau comme tableau de cases (cellules). En avoir une en moins, c'est avoir un manque mental. Expression récente, popularisée au XXe siècle.",
    exemple: "Qui déménage en décembre sous la neige ? Il a une case en moins.",
    registre: "familier",
    tags: ["folie légère", "manque de jugement", "excentricité"],
    region: null,
    illustration: null
  },
  {
    id: "laisser-en-plan",
    expression: "Laisser en plan",
    signification: "Abandonner quelqu'un ou quelque chose brusquement, sans prévenir.",
    origine: "Laisser « en plan » vient du sens architectural : laisser un chantier en plan c'est l'abandonner à l'état de plan, inachevé.",
    exemple: "Il a tout laissé en plan le jour J sans explication.",
    registre: "familier",
    tags: ["abandon", "trahison", "relations"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-la-gueule-de-bois",
    expression: "Avoir la gueule de bois",
    signification: "Souffrir du lendemain après une soirée trop arrosée — maux de tête, nausées.",
    origine: "La bouche sèche et douloureuse après une nuit de boisson est comparée au bois — une matière inerte, dure et sans vie. Attestée depuis le XIXe siècle.",
    exemple: "Après la fête, tout le monde avait la gueule de bois le mardi matin.",
    registre: "familier",
    tags: ["alcool", "lendemain", "santé"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-vendre-la-peche",
    expression: "Avoir la pêche",
    signification: "Être dynamique, en pleine forme, débordant d'énergie.",
    origine: "La pêche, fruit plein de vitalité et de fraîcheur, est utilisée ici comme symbole d'énergie. L'expression est populaire en France depuis les années 80.",
    exemple: "Il revient de vacances avec la pêche — méconnaissable.",
    registre: "familier",
    tags: ["énergie", "forme physique", "vitalité"],
    region: null,
    illustration: null
  },
  {
    id: "tracer-sa-route",
    expression: "Tracer sa route",
    signification: "Avancer dans sa vie selon ses propres choix, sans se laisser distraire.",
    origine: "Image du voyageur ou du pionnier qui trace lui-même son chemin là où il n'y en a pas. Symbole d'autonomie et de détermination.",
    exemple: "Malgré les critiques, elle trace sa route et réussit à sa façon.",
    registre: "courant",
    tags: ["autonomie", "détermination", "vie"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-s-en-laisser-conter",
    expression: "Ne pas s'en laisser conter",
    signification: "Ne pas se laisser duper, être perspicace et méfiant.",
    origine: "« Conter » au sens ancien de « raconter des histoires ». Ne pas se laisser conter c'est ne pas croire aux belles histoires qu'on nous raconte.",
    exemple: "Elle a de l'expérience — elle ne s'en laisse pas conter.",
    registre: "courant",
    tags: ["méfiance", "expérience", "sagacité"],
    region: null,
    illustration: null
  },
  {
    id: "reprendre-du-poil-de-la-bete",
    expression: "Reprendre du poil de la bête",
    signification: "Retrouver de l'énergie ou de la combativité après une période difficile.",
    origine: "Vieille croyance populaire : mordre par un animal enragé, on se soignait avec un poil de cette même bête. Par extension, reprendre des forces là où on les avait perdues.",
    exemple: "Il était épuisé après cette maladie mais a repris du poil de la bête en deux semaines.",
    registre: "courant",
    tags: ["récupération", "énergie", "résilience", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "donner-le-la",
    expression: "Donner le la",
    signification: "Donner le ton, fixer le niveau ou l'exemple à suivre.",
    origine: "Expression musicale : le « la » est la note de référence sur laquelle tous les musiciens s'accordent. Donner le la c'est fixer la référence commune.",
    exemple: "C'est le chef de projet qui donne le la — si lui est motivé, l'équipe suit.",
    registre: "courant",
    tags: ["leadership", "exemple", "travail", "musique"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-avoir-les-deux-pieds-dans-le-meme-sabot",
    expression: "Ne pas avoir les deux pieds dans le même sabot",
    signification: "Être débrouillard, actif, ne pas être empêtré dans ses problèmes.",
    origine: "Le sabot est chaussure paysanne inconfortable. Avoir les deux pieds dans un seul sabot c'est être immobilisé. Ne pas l'avoir c'est donc être libre de ses mouvements.",
    exemple: "Pour gérer deux enfants et un travail exigeant, elle n'a pas les deux pieds dans le même sabot.",
    registre: "courant",
    tags: ["débrouillardise", "énergie", "compétence", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "se-casser-en-quatre",
    expression: "Se casser en quatre",
    signification: "Faire tout son possible pour aider, se démener sans compter.",
    origine: "Variante de « se mettre en quatre » avec l'idée d'un effort si intense qu'on se brise pour y arriver.",
    exemple: "Il s'est cassé en quatre pour livrer le projet dans les délais.",
    registre: "courant",
    tags: ["effort", "dévouement", "travail"],
    region: null,
    illustration: null
  },
  {
    id: "couper-court",
    expression: "Couper court",
    signification: "Mettre fin rapidement à quelque chose, interrompre sans détour.",
    origine: "Couper le plus court chemin — terminer sans détour. Couper court à une conversation ou à une action c'est la clore rapidement.",
    exemple: "Il a coupé court à la réunion en annonçant sa décision finale.",
    registre: "courant",
    tags: ["décision", "rapidité", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-deux-gauches",
    expression: "Avoir deux mains gauches",
    signification: "Être très maladroit.",
    origine: "La main gauche étant traditionnellement la main faible pour les droitiers, avoir deux mains gauches signifie être doublement maladroit.",
    exemple: "Ne lui demande pas de monter une étagère — il a deux mains gauches.",
    registre: "familier",
    tags: ["maladresse", "corps", "incompétence"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-quelque-chose-dans-le-sang",
    expression: "Avoir quelque chose dans le sang",
    signification: "Avoir une aptitude ou une passion profondément ancrée, héréditaire.",
    origine: "Le sang comme véhicule de l'hérédité et du caractère inné. Ce qui est « dans le sang » est constitutif de la personne.",
    exemple: "Elle a la musique dans le sang — toute sa famille était musicienne.",
    registre: "courant",
    tags: ["talent inné", "héritage", "passion", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "tirer-son-epingle-du-jeu",
    expression: "Tirer son épingle du jeu",
    signification: "Se sortir habilement d'une situation difficile, s'en sortir à son avantage.",
    origine: "Jeu de lancer d'épingles où l'enjeu est de récupérer sa mise. Tirer son épingle c'est récupérer ce qu'on avait misé — partir sans perte.",
    exemple: "Dans ce projet chaotique, elle a réussi à tirer son épingle du jeu.",
    registre: "courant",
    tags: ["débrouillardise", "habileté", "succès"],
    region: null,
    illustration: null
  },
  {
    id: "faire-une-croix-sur",
    expression: "Faire une croix sur quelque chose",
    signification: "Renoncer définitivement à quelque chose, l'effacer de ses plans.",
    origine: "Croix sur une liste ou sur un registre : ce qu'on barre ne compte plus. Faire une croix c'est annuler définitivement.",
    exemple: "Il a fait une croix sur ses économies après cet investissement raté.",
    registre: "courant",
    tags: ["abandon", "renoncement", "deuil"],
    region: null,
    illustration: null
  },
  {
    id: "y-aller-franco",
    expression: "Y aller franco",
    signification: "Agir franchement et directement, sans détour ni ménagement.",
    origine: "Du latin « francus » (libre, sans contrainte). Y aller franco c'est agir librement, sans entraves ni précautions.",
    exemple: "Si tu n'es pas content, dis-le-lui franco plutôt que de te plaindre dans mon dos.",
    registre: "familier",
    tags: ["franchise", "directivité", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "tourner-casaque",
    expression: "Tourner casaque",
    signification: "Changer brusquement de camp ou d'opinion.",
    origine: "La casaque est un vêtement court. Retourner sa veste rapidement était le signe du traître ou du déserteur qui changeait de camp. Synonyme de « retourner sa veste ».",
    exemple: "Dès que les sondages ont changé, il a tourné casaque.",
    registre: "courant",
    tags: ["trahison", "opportunisme", "politique"],
    region: null,
    illustration: null
  },
  {
    id: "faire-le-mort",
    expression: "Faire le mort",
    signification: "Feindre l'inaction ou l'absence pour éviter une situation, se faire discret.",
    origine: "Image de l'animal qui feint la mort pour tromper le prédateur. Au sens figuré, se faire invisible pour éviter les problèmes.",
    exemple: "Quand les ennuis arrivent, il fait le mort et laisse les autres gérer.",
    registre: "familier",
    tags: ["fuite", "lâcheté", "évitement"],
    region: null,
    illustration: null
  },
  {
    id: "faire-des-gorges-chaudes",
    expression: "Faire des gorges chaudes de quelque chose",
    signification: "Se moquer, triompher bruyamment de quelque chose.",
    origine: "La « gorge chaude » est ce que les fauconniers donnaient au rapace — une nourriture savoureuse. Faire des gorges chaudes de quelque chose, c'est s'en délecter comme d'un bon repas.",
    exemple: "Ses adversaires ont fait des gorges chaudes de son erreur lors du débat.",
    registre: "soutenu",
    tags: ["moquerie", "triomphe", "schadenfreude"],
    region: null,
    illustration: null
  },
  {
    id: "ca-ne-mange-pas-de-pain",
    expression: "Ça ne mange pas de pain",
    signification: "Cela n'a aucun inconvénient, ça ne coûte rien d'essayer.",
    origine: "Le pain étant la base de la subsistance, quelque chose qui « ne mange pas de pain » ne consomme pas de ressources essentielles — ne coûte rien.",
    exemple: "Envoie cette candidature — ça ne mange pas de pain.",
    registre: "courant",
    tags: ["facilité", "gratuité", "risque nul"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-bonne-mine",
    expression: "Avoir bonne mine",
    signification: "Avoir l'air en bonne santé, ou ironiquement, s'être mis dans une situation embarrassante.",
    origine: "La « mine » c'est le visage, l'expression. Avoir bonne mine au sens littéral, c'est avoir l'air en forme. Au sens ironique : « tu as bonne mine » = tu t'es bien débrouillé (sarcastique).",
    exemple: "Si tu rates ce rendez-vous, t'auras vraiment bonne mine devant le client.",
    registre: "courant",
    tags: ["apparence", "ironie", "santé"],
    region: null,
    illustration: null
  },
  {
    id: "perdre-le-fil",
    expression: "Perdre le fil",
    signification: "Perdre le fil de ses idées, ne plus savoir où on en était.",
    origine: "Métaphore du fil conducteur d'un discours ou d'une réflexion. Comme le fil d'Ariane dans le labyrinthe — le perdre c'est se retrouver sans repère.",
    exemple: "Il a été interrompu si souvent qu'il a perdu le fil de sa démonstration.",
    registre: "courant",
    tags: ["concentration", "mémoire", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "donner-carte-blanche",
    expression: "Donner carte blanche",
    signification: "Accorder une liberté totale, laisser quelqu'un agir à sa guise.",
    origine: "La carte blanche (feuille vierge) remise à un agent signifiait qu'on lui faisait confiance pour remplir les conditions lui-même — liberté absolue d'action.",
    exemple: "Le directeur lui a donné carte blanche pour recruter l'équipe.",
    registre: "courant",
    tags: ["liberté", "confiance", "délégation"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-cafard-le-soir",
    expression: "Avoir du vague à l'âme",
    signification: "Ressentir une mélancolie douce et indéfinissable.",
    origine: "Expression romantique du XIXe siècle. Le « vague » (flou, indéfini) appliqué à l'âme décrit ce sentiment de tristesse sans cause précise.",
    exemple: "En automne, il a souvent du vague à l'âme quand les jours raccourcissent.",
    registre: "soutenu",
    tags: ["mélancolie", "tristesse", "émotions"],
    region: null,
    illustration: null
  },
  {
    id: "s-endormir-sur-ses-lauriers",
    expression: "S'endormir sur ses lauriers",
    signification: "Se reposer trop longtemps sur un succès passé, cesser de progresser.",
    origine: "Les lauriers couronnaient les vainqueurs dans l'Antiquité grecque et romaine. S'y endormir c'est se satisfaire de gloires passées au lieu de continuer à se battre.",
    exemple: "Un succès ne suffit pas — impossible de s'endormir sur ses lauriers dans ce secteur.",
    registre: "courant",
    tags: ["complacence", "succès", "progrès"],
    region: null,
    illustration: null
  },
  {
    id: "aller-droit-au-but",
    expression: "Aller droit au but",
    signification: "Traiter directement l'essentiel sans passer par des détours inutiles.",
    origine: "Image de la trajectoire directe — la ligne droite est le chemin le plus court entre deux points. Aller droit au but c'est choisir l'efficacité sur la forme.",
    exemple: "On n'a pas le temps pour les politesses — allons droit au but.",
    registre: "courant",
    tags: ["efficacité", "franchise", "communication"],
    region: null,
    illustration: null
  },
];

// Lecture du fichier existant
const existantes = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
const idsExistants = new Set(existantes.map(e => e.id));

// Filtrage des doublons
const nouvelles = NOUVELLES_EXPRESSIONS.filter(e => !idsExistants.has(e.id));
const doublons = NOUVELLES_EXPRESSIONS.filter(e => idsExistants.has(e.id));

console.log(`Expressions existantes : ${existantes.length}`);
console.log(`Nouvelles à ajouter    : ${nouvelles.length}`);
console.log(`Doublons ignorés       : ${doublons.length}`);
if (doublons.length > 0) {
  console.log('IDs en doublon :', doublons.map(e => e.id).join(', '));
}

// Fusion et sauvegarde
const total = [...existantes, ...nouvelles];
fs.writeFileSync(DATA_PATH, JSON.stringify(total, null, 2), 'utf8');

const registres = total.reduce((acc, e) => { acc[e.registre] = (acc[e.registre]||0)+1; return acc; }, {});
const tags = total.flatMap(e => e.tags);
const tagCount = Object.keys(tags.reduce((acc, t) => { acc[t] = true; return acc; }, {})).length;

console.log(`\nTotal après ajout : ${total.length} expressions`);
console.log('Registres :', registres);
console.log('Tags distincts :', tagCount);
console.log('Fichier sauvegardé.');
