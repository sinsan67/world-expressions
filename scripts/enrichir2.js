// Deuxième vague d'enrichissement — objectif : atteindre ~400 expressions
// Usage : node scripts/enrichir2.js

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'expressions.json');

const NOUVELLES_EXPRESSIONS = [
  // ─── COULEURS ──────────────────────────────────────────────────────────────
  {
    id: "voir-la-vie-en-rose",
    expression: "Voir la vie en rose",
    signification: "Avoir une vision optimiste et enjouée du monde, percevoir les choses sous leur meilleur angle.",
    origine: "Rendue mondialement célèbre par Édith Piaf et sa chanson de 1945. L'expression préexistait mais la chanson l'a figée dans la langue française.",
    exemple: "Depuis qu'il a rencontré quelqu'un, il voit vraiment la vie en rose.",
    registre: "courant",
    tags: ["optimisme", "bonheur", "amour", "couleurs"],
    region: null,
    illustration: null
  },
  {
    id: "etre-vert-de-rage",
    expression: "Être vert de rage",
    signification: "Être tellement en colère qu'on en perd ses couleurs naturelles.",
    origine: "La couleur verte est associée à la bile et aux humeurs qui débordent dans la médecine ancienne. La rage intense donnait une teinte verdâtre au visage.",
    exemple: "Quand il a découvert la fraude, il était vert de rage.",
    registre: "courant",
    tags: ["colère", "émotions", "couleurs"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-blues",
    expression: "Avoir le blues",
    signification: "Avoir le cafard, ressentir une mélancolie légère et diffuse.",
    origine: "Emprunté à l'anglais américain « the blues », musique née de la communauté afro-américaine exprimant la tristesse. Le terme est entré en français au XXe siècle.",
    exemple: "En novembre, quand les jours raccourcissent, j'ai souvent le blues.",
    registre: "courant",
    tags: ["tristesse", "mélancolie", "émotions", "couleurs"],
    region: null,
    illustration: null
  },
  {
    id: "rire-jaune",
    expression: "Rire jaune",
    signification: "Rire de façon forcée pour masquer sa gêne, sa déception ou sa contrariété.",
    origine: "Le jaune est associé à la bile et aux humeurs désagréables depuis l'Antiquité. Un rire jaune est donc un rire qui cache quelque chose d'amer.",
    exemple: "Quand on l'a plaisanté sur son erreur, il a ri jaune.",
    registre: "courant",
    tags: ["embarras", "déception", "couleurs", "émotions"],
    region: null,
    illustration: null
  },
  {
    id: "broyer-du-noir",
    expression: "Broyer du noir",
    signification: "Être déprimé, ruminer des pensées sombres.",
    origine: "Métaphore picturale : broyer du noir (pigment) c'est travailler avec la couleur la plus sombre. L'expression date du XVIIe siècle.",
    exemple: "Depuis qu'il a perdu son travail, il broie du noir.",
    registre: "courant",
    tags: ["dépression", "tristesse", "couleurs", "émotions"],
    region: null,
    illustration: null
  },
  {
    id: "grey-faire-grise-mine",
    expression: "Faire grise mine",
    signification: "Accueillir quelqu'un ou quelque chose avec un air maussade, sans enthousiasme.",
    origine: "La mine grise est un visage terne, sans éclat. Faire grise mine c'est opposer une façade sans chaleur ni sourire.",
    exemple: "Il a fait grise mine quand on lui a annoncé la réunion du samedi.",
    registre: "courant",
    tags: ["mauvaise humeur", "accueil", "couleurs", "émotions"],
    region: null,
    illustration: null
  },

  // ─── CHIFFRES & MESURES ───────────────────────────────────────────────────
  {
    id: "chercher-midi-a-quatorze-heures",
    expression: "Chercher midi à quatorze heures",
    signification: "Compliquer inutilement quelque chose de simple, chercher des problèmes là où il n'y en a pas.",
    origine: "Midi est midi — chercher une heure qui n'existe pas comme « 14h » pour désigner midi, c'est s'inventer une difficulté fictive.",
    exemple: "La solution est évidente — arrête de chercher midi à quatorze heures.",
    registre: "courant",
    tags: ["complication inutile", "raisonnement", "chiffres"],
    region: null,
    illustration: null
  },
  {
    id: "faire-les-quatre-cents-coups",
    expression: "Faire les quatre cents coups",
    signification: "Mener une vie agitée et dissipée, faire des bêtises à répétition.",
    origine: "Allusion possible au tapage et à l'artillerie des assauts militaires (400 coups de canon), ou aux 400 diableries du théâtre médiéval. L'idée est celle d'un excès d'agitation.",
    exemple: "Dans sa jeunesse, il a fait les quatre cents coups avant de se calmer.",
    registre: "courant",
    tags: ["jeunesse", "bêtises", "vie agitée", "chiffres"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-etre-dans-son-premier-age",
    expression: "Ne pas être de la première jeunesse",
    signification: "Être d'un certain âge, ne plus être jeune.",
    origine: "Expression euphémistique et polie pour souligner l'âge avancé de quelqu'un sans le dire directement.",
    exemple: "La voiture n'est pas de la première jeunesse mais elle roule encore bien.",
    registre: "courant",
    tags: ["âge", "vieillesse", "euphémisme"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-cent-ans",
    expression: "Attendre cent sept ans",
    signification: "Attendre extrêmement longtemps, ou ne jamais obtenir ce qu'on espère.",
    origine: "Le chiffre 107 est arbitrairement grand et improbable — il signifie « un temps impossible ». Variante de l'hyperbole sur l'attente infinie.",
    exemple: "Si tu attends qu'il rappelle de lui-même, tu peux attendre cent sept ans.",
    registre: "familier",
    tags: ["attente", "patience", "chiffres", "déception"],
    region: null,
    illustration: null
  },

  // ─── AMOUR & RELATIONS ────────────────────────────────────────────────────
  {
    id: "avoir-le-coup-de-foudre",
    expression: "Avoir le coup de foudre",
    signification: "Tomber amoureux instantanément, dès la première rencontre.",
    origine: "Métaphore électrique : la foudre frappe brutalement et sans avertissement. L'amour soudain était ainsi décrit par les romantiques du XIXe siècle.",
    exemple: "Il l'a vue de l'autre côté de la salle et a eu le coup de foudre immédiatement.",
    registre: "courant",
    tags: ["amour", "rencontre", "émotions"],
    region: null,
    illustration: null
  },
  {
    id: "filer-le-parfait-amour",
    expression: "Filer le parfait amour",
    signification: "Vivre une relation amoureuse heureuse et harmonieuse.",
    origine: "Expression littéraire du XVIIe siècle. « Filer » au sens de « dérouler en douceur », comme on file un tissu. L'amour parfait se déroule sans accroc.",
    exemple: "Depuis leur rencontre à la fac, ils filent le parfait amour.",
    registre: "courant",
    tags: ["amour", "couple", "bonheur"],
    region: null,
    illustration: null
  },
  {
    id: "se-faire-poser-un-lapin",
    expression: "Se faire poser un lapin",
    signification: "Se faire fausser compagnie, attendre quelqu'un qui ne vient pas.",
    origine: "La lapin est depuis longtemps associé à la défection amoureuse dans l'argot. « Poser un lapin » : ne pas honorer un rendez-vous sans prévenir.",
    exemple: "J'ai attendu deux heures au café — elle m'avait posé un lapin.",
    registre: "courant",
    tags: ["déception", "rendez-vous", "relations", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "se-disputer-pour-des-broutilles",
    expression: "Se disputer pour des broutilles",
    signification: "Se quereller pour des choses sans importance.",
    origine: "La broutille désigne un menu menu branchage sans valeur. Se battre pour rien de substantiel, c'est se battre pour des broutilles.",
    exemple: "Ils s'entendent bien dans l'ensemble mais se disputent souvent pour des broutilles.",
    registre: "courant",
    tags: ["conflit", "couple", "relations", "futilité"],
    region: null,
    illustration: null
  },
  {
    id: "garder-rancune",
    expression: "Garder rancune",
    signification: "Entretenir de la rancœur, ne pas pardonner.",
    origine: "Du vieux français « rancune » (ressentiment tenace). Garder quelque chose c'est le conserver précieusement — ici un sentiment négatif qu'on ne veut pas lâcher.",
    exemple: "Il garde rancune depuis dix ans pour une remarque sans importance.",
    registre: "courant",
    tags: ["rancœur", "pardon", "relations"],
    region: null,
    illustration: null
  },
  {
    id: "se-remettre-en-question",
    expression: "Se remettre en question",
    signification: "Reconsidérer sa façon d'agir ou de penser, accepter de se critiquer soi-même.",
    origine: "Expression du XXe siècle liée à la psychanalyse et à la culture de l'introspection. Se mettre « en question » c'est accepter d'être interrogé, incertain.",
    exemple: "Après cet échec, elle a profondément remis en question sa méthode.",
    registre: "courant",
    tags: ["introspection", "remise en cause", "développement personnel"],
    region: null,
    illustration: null
  },
  {
    id: "battre-froid-a-quelqu-un",
    expression: "Battre froid à quelqu'un",
    signification: "Témoigner à quelqu'un de la froideur, lui faire sentir sa disgrâce.",
    origine: "Locution ancienne : le « froid » de l'indifférence ou du dédain. Battre froid c'est claquer des mains froides — l'inverse d'un accueil chaleureux.",
    exemple: "Depuis leur dispute, elle lui bat froid chaque fois qu'ils se croisent.",
    registre: "courant",
    tags: ["froideur", "hostilité", "relations"],
    region: null,
    illustration: null
  },
  {
    id: "etre-epris-de-quelqu-un",
    expression: "Être épris de quelqu'un",
    signification: "Être amoureux, être sous le charme de quelqu'un.",
    origine: "Du vieux français « éprendre » (saisir, enflammer). Être épris c'est avoir été saisi par l'amour comme une flamme qui embrasse.",
    exemple: "Il était visiblement épris d'elle — il ne la quittait pas des yeux.",
    registre: "soutenu",
    tags: ["amour", "admiration", "relations"],
    region: null,
    illustration: null
  },

  // ─── ÉCOLE & APPRENTISSAGE ────────────────────────────────────────────────
  {
    id: "apprendre-a-ses-depens",
    expression: "Apprendre à ses dépens",
    signification: "Apprendre une leçon douloureusement, en en subissant les conséquences.",
    origine: "« Aux dépens de » signifie « aux frais de ». Apprendre à ses propres frais c'est payer le coût d'une leçon par l'expérience.",
    exemple: "Il a appris à ses dépens qu'il faut toujours vérifier ses contrats.",
    registre: "courant",
    tags: ["expérience", "erreur", "leçon", "apprentissage"],
    region: null,
    illustration: null
  },
  {
    id: "faire-l-ecole-buissonniere",
    expression: "Faire l'école buissonnière",
    signification: "Sécher les cours, fuir l'école pour aller se promener.",
    origine: "L'école « buissonnière » est celle qu'on tient dans les buissons — à l'extérieur, en liberté. Avant que l'instruction soit obligatoire, certains enfants apprenaient ainsi.",
    exemple: "Quand le soleil brillait, il était tenté de faire l'école buissonnière.",
    registre: "courant",
    tags: ["école", "paresse", "liberté", "enfance"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-la-bosse-de",
    expression: "Avoir la bosse de quelque chose",
    signification: "Avoir un don naturel pour quelque chose.",
    origine: "La phrénologie (XIXe siècle) prétendait lire les talents dans les bosses du crâne. Avoir la bosse des maths signifiait avoir un relief crânien indiquant ce talent.",
    exemple: "Il a vraiment la bosse des langues — il en parle cinq couramment.",
    registre: "familier",
    tags: ["talent", "don naturel", "apprentissage"],
    region: null,
    illustration: null
  },
  {
    id: "repasser-une-lecon",
    expression: "Repasser sa leçon",
    signification: "Réviser, répéter mentalement ce qu'on doit dire ou faire.",
    origine: "Expression scolaire directe : repasser une leçon c'est la passer à nouveau dans sa tête pour la mémoriser.",
    exemple: "Avant l'entretien, il a repassé sa leçon dans le taxi.",
    registre: "courant",
    tags: ["préparation", "travail", "apprentissage"],
    region: null,
    illustration: null
  },
  {
    id: "en-savoir-long-sur",
    expression: "En savoir long sur quelque chose",
    signification: "Connaître beaucoup de choses sur un sujet, surtout des informations confidentielles.",
    origine: "Le « long » désigne ici une grande étendue de connaissance — savoir en longueur et en profondeur, et notamment des choses qu'on tait.",
    exemple: "Elle en sait long sur les dessous de cette affaire — mais elle ne dit rien.",
    registre: "courant",
    tags: ["connaissance", "secret", "information"],
    region: null,
    illustration: null
  },

  // ─── SANTÉ & CORPS ────────────────────────────────────────────────────────
  {
    id: "etre-sur-les-rotules",
    expression: "Être sur les rotules",
    signification: "Être épuisé, à bout de forces.",
    origine: "Les rotules sont les articulations des genoux. Être « sur les rotules » c'est être si fatigué qu'on tient à peine debout.",
    exemple: "Après douze heures de route, on était vraiment sur les rotules.",
    registre: "familier",
    tags: ["fatigue", "épuisement", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-mal-au-crane",
    expression: "Casse-tête",
    signification: "Problème compliqué à résoudre qui donne l'impression que ça fait mal à la tête.",
    origine: "Expression directe : la difficulté d'un problème est comparée à une douleur crânienne. Attestée depuis le XVIIe siècle.",
    exemple: "Cette installation IKEA est un vrai casse-tête — les instructions sont incompréhensibles.",
    registre: "courant",
    tags: ["difficulté", "problème", "intellectuel", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-avoir-la-frite",
    expression: "Avoir la frite",
    signification: "Être en forme, plein d'énergie.",
    origine: "La frite, aliment populaire associé à la jovialité et à la convivialité, a donné cette expression d'origine populaire du nord de la France.",
    exemple: "Tu as l'air en pleine forme ce matin — t'as la frite !",
    registre: "familier",
    tags: ["forme physique", "énergie", "bien-être"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-la-patate",
    expression: "Avoir la patate",
    signification: "Être de bonne humeur et en pleine forme.",
    origine: "La pomme de terre (patate) est nourrissante et populaire. « Avoir la patate » renvoie à l'énergie qu'elle procure — une vitalité simple et solide.",
    exemple: "Il a eu une bonne nuit — il a vraiment la patate aujourd'hui.",
    registre: "familier",
    tags: ["forme physique", "bonne humeur", "énergie"],
    region: null,
    illustration: null
  },
  {
    id: "se-porter-comme-le-pont-neuf",
    expression: "Se porter comme le Pont-Neuf",
    signification: "Être en excellente santé, robuste et solide.",
    origine: "Le Pont-Neuf de Paris, construit en 1606, est l'un des ponts les plus solides et les plus durables de la capitale. Sa robustesse en a fait le symbole de la bonne santé.",
    exemple: "À 90 ans, il se porte comme le Pont-Neuf — toujours debout à l'aube.",
    registre: "courant",
    tags: ["santé", "vitalité", "Paris"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-une-sante-de-fer",
    expression: "Avoir une santé de fer",
    signification: "Être très résistant physiquement, ne jamais tomber malade.",
    origine: "Le fer est le métal le plus dur et le plus résistant du quotidien. Avoir une santé de fer c'est être aussi solide et inaltérable que ce métal.",
    exemple: "Elle ne prend jamais de congé maladie — une santé de fer.",
    registre: "courant",
    tags: ["santé", "résistance", "robustesse"],
    region: null,
    illustration: null
  },
  {
    id: "menager-la-chevre-et-le-chou",
    expression: "Ménager la chèvre et le chou",
    signification: "Essayer de satisfaire deux parties opposées à la fois, éviter de prendre position.",
    origine: "Allusion à l'énigme classique du passeur qui doit traverser une rivière avec une chèvre, un chou et un loup sans qu'ils se mangent. Ménager les deux c'est chercher l'équilibre impossible.",
    exemple: "Dans ce conflit entre ses deux associés, il essaie de ménager la chèvre et le chou.",
    registre: "courant",
    tags: ["diplomatie", "équilibre", "animaux", "conflit"],
    region: null,
    illustration: null
  },

  // ─── NATURE & MÉTÉO ───────────────────────────────────────────────────────
  {
    id: "il-fait-un-temps-de-chien",
    expression: "Il fait un temps de chien",
    signification: "Le temps est très mauvais, froid et pluvieux.",
    origine: "Le chien dehors sous la pluie est l'image du malheureux contraint de subir les intempéries. Le « temps de chien » est celui qu'on ne souhaite qu'à un animal errant.",
    exemple: "On n'a pas pu faire notre pique-nique — il faisait un temps de chien.",
    registre: "familier",
    tags: ["météo", "pluie", "froid", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "entre-chien-et-loup",
    expression: "Entre chien et loup",
    signification: "À la tombée de la nuit, au crépuscule, quand la lumière est trop faible pour distinguer un chien d'un loup.",
    origine: "Expression médiévale qui désigne ce moment précis du soir où la lumière est si tamisée qu'on confond les silhouettes des animaux.",
    exemple: "On est rentrés entre chien et loup, juste avant la nuit complète.",
    registre: "courant",
    tags: ["temps", "nuit", "crépuscule", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "tomber-des-hallebardes",
    expression: "Tomber des hallebardes",
    signification: "Pleuvoir très fort, à verse.",
    origine: "La hallebarde est une arme médiévale longue et pointue. Des hallebardes tombant du ciel évoquent une pluie d'une violence redoutable.",
    exemple: "On a été surpris par l'orage — il tombait des hallebardes.",
    registre: "courant",
    tags: ["météo", "pluie", "intensité"],
    region: null,
    illustration: null
  },
  {
    id: "nager-en-plein-brouillard",
    expression: "Nager dans le brouillard",
    signification: "Ne rien comprendre à une situation, être totalement perdu.",
    origine: "Image du navigateur qui avance dans le brouillard sans visibilité — ne sait pas où il va, ne voit rien devant lui.",
    exemple: "Il nage dans le brouillard depuis le début de ce projet — personne ne lui a expliqué.",
    registre: "courant",
    tags: ["confusion", "incompréhension", "perte", "météo"],
    region: null,
    illustration: null
  },
  {
    id: "une-tempete-dans-un-verre-d-eau",
    expression: "Une tempête dans un verre d'eau",
    signification: "Une grande agitation pour un problème sans importance.",
    origine: "Image de la démesure : une tempête (phénomène immense) dans un verre d'eau (espace minuscule). La disproportion illustre la réaction excessive.",
    exemple: "Cette polémique sur le règlement intérieur, c'est une tempête dans un verre d'eau.",
    registre: "courant",
    tags: ["exagération", "futilité", "conflit", "météo"],
    region: null,
    illustration: null
  },
  {
    id: "faire-soleil-apres-la-pluie",
    expression: "Faire le beau temps après la pluie",
    signification: "Que les bonnes choses arrivent après les périodes difficiles.",
    origine: "Variante du proverbe « après la pluie, le beau temps », insistant sur la certitude que le cycle naturel ramène toujours la lumière.",
    exemple: "Ces mois de doute ont été suivis d'un beau succès — le beau temps après la pluie.",
    registre: "courant",
    tags: ["optimisme", "résilience", "météo", "proverbe"],
    region: null,
    illustration: null
  },

  // ─── MAISON & QUOTIDIEN ───────────────────────────────────────────────────
  {
    id: "mettre-de-l-ordre-dans-ses-affaires",
    expression: "Mettre de l'ordre dans ses affaires",
    signification: "Organiser ce qui était en désordre, régler ses problèmes pratiques ou administratifs.",
    origine: "Expression directe du rangement domestique élargie à la gestion de la vie en général.",
    exemple: "Avant de partir en voyage, il a mis de l'ordre dans ses affaires.",
    registre: "courant",
    tags: ["organisation", "quotidien", "gestion"],
    region: null,
    illustration: null
  },
  {
    id: "balayer-devant-sa-porte",
    expression: "Balayer devant sa porte",
    signification: "Commencer par régler ses propres problèmes avant de critiquer ceux des autres.",
    origine: "Proverbe populaire : un bon voisin balaie d'abord devant sa propre porte. Attesté depuis le XVIe siècle.",
    exemple: "Il critique la gestion des autres — il ferait mieux de balayer devant sa porte.",
    registre: "courant",
    tags: ["humilité", "critique", "proverbe", "quotidien"],
    region: null,
    illustration: null
  },
  {
    id: "faire-le-menage",
    expression: "Faire le ménage",
    signification: "Se débarrasser de ce qui ne fonctionne pas, réorganiser radicalement.",
    origine: "Le ménage domestique (nettoyer, jeter) transposé à toute situation où on élimine ce qui est inutile ou nuisible.",
    exemple: "Le nouveau directeur a fait le ménage dans l'équipe dès son arrivée.",
    registre: "courant",
    tags: ["réorganisation", "changement", "management"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-son-mot-a-dire",
    expression: "Avoir son mot à dire",
    signification: "Avoir le droit de s'exprimer, d'intervenir dans une décision.",
    origine: "Expression directe : avoir un « mot » (une prise de parole) qu'on peut légitimement prononcer dans une affaire qui nous concerne.",
    exemple: "Je suis directement concerné par ce choix — j'ai mon mot à dire.",
    registre: "courant",
    tags: ["décision", "droits", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "faire-des-pieds-et-des-mains",
    expression: "Faire des pieds et des mains",
    signification: "Tout mettre en œuvre, déployer tous les efforts possibles pour obtenir quelque chose.",
    origine: "Image d'un effort total : mobiliser jusqu'aux pieds et aux mains — tout son corps — pour atteindre un objectif.",
    exemple: "Il a fait des pieds et des mains pour obtenir ce rendez-vous.",
    registre: "courant",
    tags: ["effort", "détermination", "action", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-rouler-en-or",
    expression: "Ne pas rouler sur l'or",
    signification: "Ne pas être riche, avoir des ressources financières limitées.",
    origine: "Antithèse de « rouler sur l'or » — ne pas bénéficier de cette abondance. Manière pudique d'évoquer des difficultés financières.",
    exemple: "On aimerait partir en vacances, mais on ne roule pas sur l'or cette année.",
    registre: "courant",
    tags: ["argent", "pauvreté relative", "quotidien"],
    region: null,
    illustration: null
  },

  // ─── MENSONGE & TROMPERIE ─────────────────────────────────────────────────
  {
    id: "avoir-la-langue-fourchue",
    expression: "Avoir la langue fourchue",
    signification: "Être fourbe, dire une chose et en penser une autre.",
    origine: "La langue fourchue (fourchu = divisé en deux) est celle du serpent, symbole universel de duplicité et de tromperie.",
    exemple: "Méfie-toi de lui — il a la langue fourchue et dit ce que tu veux entendre.",
    registre: "courant",
    tags: ["tromperie", "duplicité", "méfiance", "caractère"],
    region: null,
    illustration: null
  },
  {
    id: "enjoliver-la-verite",
    expression: "Enjoliver la vérité",
    signification: "Embellir les faits, mentir partiellement en omettant ce qui dérange.",
    origine: "Enjoliver (rendre joli) appliqué à la vérité produit une image paradoxale — la vérité n'a pas besoin d'être embellie si elle l'est déjà.",
    exemple: "Il a un peu enjolivé la vérité dans son CV — ses expériences sont moins brillantes qu'il dit.",
    registre: "courant",
    tags: ["mensonge", "tromperie", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "jeter-de-la-poudre-aux-yeux",
    expression: "Jeter de la poudre aux yeux",
    signification: "Éblouir, impressionner par des apparences trompeuses pour cacher la réalité.",
    origine: "Image des prestidigitateurs qui jetaient de la poudre pour aveugler momentanément le public pendant un tour. Attestée depuis le XVIe siècle.",
    exemple: "Ces chiffres flatteurs, c'est pour jeter de la poudre aux yeux des investisseurs.",
    registre: "courant",
    tags: ["tromperie", "illusion", "manipulation", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "prendre-des-vessies-pour-des-lanternes",
    expression: "Prendre des vessies pour des lanternes",
    signification: "Se laisser tromper par des apparences grossières, prendre le faux pour le vrai.",
    origine: "Les baigneurs gonflaient des vessies d'animal pour les utiliser comme flotteurs. Un naïf pourrait confondre une vessie gonflée avec une lanterne — deux objets ronds mais sans rapport.",
    exemple: "On lui a vendu un produit sans valeur comme si c'était de l'or — il a pris des vessies pour des lanternes.",
    registre: "courant",
    tags: ["naïveté", "tromperie", "illusion"],
    region: null,
    illustration: null
  },
  {
    id: "tourner-sept-fois-sa-langue-dans-sa-bouche",
    expression: "Tourner sept fois sa langue dans sa bouche",
    signification: "Réfléchir longuement avant de parler pour éviter de dire une bêtise.",
    origine: "Proverbe populaire qui préconise la réflexion avant la parole. Le chiffre sept est symbolique de complétude et de perfection.",
    exemple: "Avant de répondre à cet e-mail à chaud, tourne sept fois ta langue dans ta bouche.",
    registre: "courant",
    tags: ["prudence", "réflexion", "communication", "proverbe"],
    region: null,
    illustration: null
  },

  // ─── ARGENT & COMMERCE ────────────────────────────────────────────────────
  {
    id: "ca-coute-la-peau-des-fesses",
    expression: "Ça coûte la peau des fesses",
    signification: "C'est extrêmement cher.",
    origine: "La peau est ce qu'on a de plus précieux et d'inaliénable. Mettre en jeu la peau de ses fesses signifie payer le prix ultime.",
    exemple: "Ce restaurant est bon mais ça coûte la peau des fesses.",
    registre: "familier",
    tags: ["argent", "prix élevé", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "faire-des-affaires-en-or",
    expression: "Faire une affaire en or",
    signification: "Réaliser une très bonne transaction, obtenir quelque chose à un prix avantageux.",
    origine: "L'or est le métal le plus précieux — une affaire en or est donc la meilleure possible. Attestée dans le commerce depuis le XVIIIe siècle.",
    exemple: "Il a acheté cet appartement avant la flambée des prix — une vraie affaire en or.",
    registre: "courant",
    tags: ["argent", "transaction", "bonne affaire"],
    region: null,
    illustration: null
  },
  {
    id: "rogner-sur-les-depenses",
    expression: "Rogner sur les dépenses",
    signification: "Réduire les dépenses, économiser en coupant sur certains postes.",
    origine: "Rogner signifie couper les bords, diminuer. Rogner sur les dépenses c'est les réduire progressivement comme on rogne une feuille.",
    exemple: "Pour partir en vacances, on a dû rogner sur les sorties toute l'année.",
    registre: "courant",
    tags: ["argent", "économie", "budget"],
    region: null,
    illustration: null
  },
  {
    id: "faire-ceinture",
    expression: "Faire ceinture",
    signification: "Se priver, manquer de quelque chose qu'on espérait.",
    origine: "Comme « se serrer la ceinture » : quand on ne mange pas à sa faim, la ceinture remplace la nourriture dans l'estomac vide. Faire ceinture c'est rien avoir.",
    exemple: "Les livraisons ont été repoussées — pour le dessert ce soir, vous ferez ceinture.",
    registre: "familier",
    tags: ["privation", "manque", "argent"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-les-poches-percees",
    expression: "Avoir les poches trouées",
    signification: "Dépenser son argent sans s'en rendre compte, être incapable d'économiser.",
    origine: "Image concrète : l'argent tombe des poches troués comme il tombe des mains d'un dépensier.",
    exemple: "Il gagne bien sa vie mais ses poches sont trouées — il n'a jamais rien de côté.",
    registre: "familier",
    tags: ["argent", "dépense", "caractère"],
    region: null,
    illustration: null
  },

  // ─── VOYAGE & DÉPLACEMENT ─────────────────────────────────────────────────
  {
    id: "aller-au-bout-du-monde",
    expression: "Aller au bout du monde",
    signification: "Aller très loin, faire un grand voyage ou un grand effort pour quelqu'un.",
    origine: "Dans l'imaginaire médiéval, le monde avait des limites physiques. Aller à son bout c'était l'aventure ultime. Aujourd'hui c'est une hyperbole pour signifier un effort sans limites.",
    exemple: "Il irait au bout du monde pour sa famille.",
    registre: "courant",
    tags: ["voyage", "dévouement", "amour", "effort"],
    region: null,
    illustration: null
  },
  {
    id: "se-perdre-en-chemin",
    expression: "Se perdre en chemin",
    signification: "S'écarter de son objectif initial, oublier ce qu'on voulait faire.",
    origine: "Image du voyageur qui s'égare. Appliqué à tout projet ou conversation qui dérive de son but premier.",
    exemple: "On voulait parler du budget et on s'est perdus en chemin à discuter de détails.",
    registre: "courant",
    tags: ["digression", "objectif", "organisation"],
    region: null,
    illustration: null
  },
  {
    id: "faire-fausse-route",
    expression: "Faire fausse route",
    signification: "Se tromper de direction, s'orienter dans la mauvaise direction.",
    origine: "Terme de navigation : prendre le mauvais chemin, se tromper de route. Transposé à toute erreur d'analyse ou de jugement.",
    exemple: "Je pense qu'on fait fausse route avec cette stratégie — les données ne confirment pas.",
    registre: "courant",
    tags: ["erreur", "stratégie", "orientation"],
    region: null,
    illustration: null
  },
  {
    id: "mettre-les-bouts",
    expression: "Mettre les bouts",
    signification: "Partir, s'en aller rapidement.",
    origine: "Argot parisien du XXe siècle. « Les bouts » désignent les pieds ou les extrémités — mettre les bouts c'est mettre les pieds en mouvement.",
    exemple: "La soirée était ennuyeuse — on a vite mis les bouts.",
    registre: "argot",
    tags: ["départ", "fuite", "argot"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-connaitre-les-ficelles",
    expression: "Connaître les ficelles du métier",
    signification: "Maîtriser les techniques secrètes ou tacites d'une profession.",
    origine: "Métaphore de la marionnette : seul celui qui connaît les ficelles sait faire bouger le spectacle. Les ficelles du métier sont les trucs des professionnels.",
    exemple: "Il débute, mais il apprend vite les ficelles du métier.",
    registre: "courant",
    tags: ["expérience", "savoir-faire", "travail"],
    region: null,
    illustration: null
  },

  // ─── EXPRESSIONS VULGAIRES & ARGOT FORT ──────────────────────────────────
  {
    id: "s-en-ficher-comme-de-l-an-quarante",
    expression: "S'en ficher comme de l'an quarante",
    signification: "Ne pas du tout s'en préoccuper.",
    origine: "L'an 40 fait référence à diverses théories — soit à une date apocalyptique qui ne s'est jamais produite, soit au calendrier révolutionnaire. Ne pas s'en inquiéter comme d'une date lointaine et fictive.",
    exemple: "Les commentaires des réseaux sociaux, je m'en fiche comme de l'an quarante.",
    registre: "familier",
    tags: ["indifférence", "détachement"],
    region: null,
    illustration: null
  },
  {
    id: "se-faire-avoir-comme-un-bleu",
    expression: "Se faire avoir comme un bleu",
    signification: "Se faire duper facilement, comme un débutant naïf.",
    origine: "Le « bleu » est le nouveau soldat, non aguerri, reconnaissable à son uniforme neuf encore teint en bleu. Par extension, tout débutant facilement manipulable.",
    exemple: "Il a acheté cette voiture sans faire vérifier — il s'est fait avoir comme un bleu.",
    registre: "familier",
    tags: ["naïveté", "tromperie", "couleurs"],
    region: null,
    illustration: null
  },
  {
    id: "se-planter",
    expression: "Se planter",
    signification: "Se tromper, faire une erreur.",
    origine: "Se planter comme on plante un couteau — un geste brusque et maladroit. Dans l'argot contemporain, se planter c'est rater complètement quelque chose.",
    exemple: "Je me suis planté dans mes calculs — à refaire.",
    registre: "familier",
    tags: ["erreur", "échec", "maladresse"],
    region: null,
    illustration: null
  },
  {
    id: "etre-a-cran",
    expression: "Être à cran",
    signification: "Être irritable, sur le point d'exploser.",
    origine: "Le cran est l'encoche qui retient le chien d'un fusil. Être « à cran » c'est être sur le point de tirer — prêt à exploser à la moindre provocation.",
    exemple: "Il est à cran depuis ce matin — ne lui parle pas de ce sujet maintenant.",
    registre: "familier",
    tags: ["irritabilité", "stress", "émotions"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-l-air-con",
    expression: "Avoir l'air con",
    signification: "Paraître stupide dans une situation embarrassante.",
    origine: "Expression directe et familière. « Con » désigne originellement le sexe féminin et par extension la bêtise dans l'argot français.",
    exemple: "Avec mon parapluie retourné par le vent, j'avais vraiment l'air con.",
    registre: "vulgaire",
    tags: ["humiliation", "maladresse", "vulgarité"],
    region: null,
    illustration: null
  },

  // ─── EXPRESSIONS SOUTENUES ────────────────────────────────────────────────
  {
    id: "tomber-en-disgrâce",
    expression: "Tomber en disgrâce",
    signification: "Perdre la faveur d'un supérieur ou du public, déchoir.",
    origine: "Expression de la cour royale : la « grâce » du roi accordait faveurs et privilèges. Tomber en disgrâce c'était perdre cette bienveillance et ses conséquences.",
    exemple: "Après le scandale, le ministre est tombé en disgrâce auprès de son parti.",
    registre: "soutenu",
    tags: ["politique", "pouvoir", "déchéance"],
    region: null,
    illustration: null
  },
  {
    id: "rendre-hommage-a",
    expression: "Rendre hommage à",
    signification: "Témoigner du respect et de la reconnaissance à quelqu'un.",
    origine: "L'hommage féodal désignait la soumission du vassal à son seigneur. Dans son sens positif modern, c'est un acte de reconnaissance et de respect.",
    exemple: "La cérémonie a rendu hommage aux soldats disparus.",
    registre: "soutenu",
    tags: ["respect", "reconnaissance", "cérémonie"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-bonne-conscience",
    expression: "Avoir bonne conscience",
    signification: "Se sentir en accord avec ses valeurs morales, ne pas avoir de remords.",
    origine: "La conscience morale, concept philosophique et religieux, est « bonne » quand elle approuve nos actes. Attestée en français depuis le XVIe siècle.",
    exemple: "J'ai tout expliqué honnêtement — j'ai bonne conscience.",
    registre: "courant",
    tags: ["morale", "intégrité", "caractère"],
    region: null,
    illustration: null
  },
  {
    id: "se-recueillir",
    expression: "Se recueillir",
    signification: "Se concentrer intérieurement, méditer, réfléchir profondément.",
    origine: "Du latin « recolligere » (rassembler). Se recueillir c'est rassembler ses pensées et ses émotions en un moment de silence intérieur.",
    exemple: "Avant de prendre cette décision importante, il a pris le temps de se recueillir.",
    registre: "soutenu",
    tags: ["méditation", "intériorité", "réflexion"],
    region: null,
    illustration: null
  },
  {
    id: "faire-amende-honorable",
    expression: "Faire amende honorable",
    signification: "Reconnaître ses torts publiquement et s'en excuser.",
    origine: "Peine infamante de l'Ancien Régime où le condamné devait reconnaître sa faute publiquement. Aujourd'hui l'expression garde le sens de reconnaître ses erreurs sans la dimension péjorative.",
    exemple: "Il a finalement fait amende honorable et présenté ses excuses devant l'équipe.",
    registre: "soutenu",
    tags: ["excuses", "reconnaissance", "honneur"],
    region: null,
    illustration: null
  },

  // ─── EXPRESSIONS AVEC CHIFFRES ────────────────────────────────────────────
  {
    id: "ne-faire-ni-une-ni-deux",
    expression: "Ne faire ni une ni deux",
    signification: "Agir sans hésiter, prendre une décision immédiatement.",
    origine: "Expression évoquant le pas de danse ou le jeu de cartes où on ne prend pas le temps de réfléchir — on agit directement.",
    exemple: "Quand il a vu l'accident, il n'a fait ni une ni deux et a appelé le 15.",
    registre: "courant",
    tags: ["décision", "rapidité", "réaction", "chiffres"],
    region: null,
    illustration: null
  },
  {
    id: "passer-un-mauvais-quart-d-heure",
    expression: "Passer un mauvais quart d'heure",
    signification: "Vivre un moment difficile ou désagréable, souvent une remontrance.",
    origine: "Le quart d'heure est une petite durée, mais suffisante pour être réprimandé ou souffrir brièvement. L'expression souligne que même un court moment peut être très pénible.",
    exemple: "Il a passé un mauvais quart d'heure avec la directrice après son retard.",
    registre: "courant",
    tags: ["difficulté", "réprimande", "temps"],
    region: null,
    illustration: null
  },
  {
    id: "se-mettre-en-quatre",
    expression: "Se mettre en quatre",
    signification: "Se donner beaucoup de mal, faire tout son possible pour quelqu'un.",
    origine: "Image d'un dévouement tel qu'on se partagerait en quatre pour pouvoir aider simultanément. Attestée depuis le XVIIe siècle.",
    exemple: "Elle s'est mise en quatre pour organiser ce repas parfait.",
    registre: "courant",
    tags: ["dévouement", "effort", "générosité", "chiffres"],
    region: null,
    illustration: null
  },
  {
    id: "de-fil-en-aiguille",
    expression: "De fil en aiguille",
    signification: "Progressivement, en passant d'une chose à une autre par enchaînements successifs.",
    origine: "Métaphore du travail de couture : le fil suit l'aiguille, chaque point menant naturellement au suivant. Une conversation ou une situation évolue ainsi par petits pas.",
    exemple: "De fil en aiguille, la discussion sur le budget a mené à une révision complète de la stratégie.",
    registre: "courant",
    tags: ["progression", "enchaînement", "récit"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-une-araignee-au-plafond",
    expression: "Avoir une araignée au plafond",
    signification: "Être un peu fou, avoir l'esprit dérangé.",
    origine: "Image loufoque et populaire : une araignée au plafond du cerveau (le plafond étant le haut de la tête) tisse ses toiles et perturbe la pensée.",
    exemple: "Il veut monter une bijouterie sur la Lune — il a une araignée au plafond.",
    registre: "familier",
    tags: ["folie légère", "excentricité", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "faire-la-sourde-oreille",
    expression: "Faire la sourde oreille",
    signification: "Faire semblant de ne pas entendre, ignorer délibérément.",
    origine: "La surdité feinte est une ruse ancienne. Faire la sourde oreille c'est opposer une infirmité simulée pour éviter de répondre.",
    exemple: "On lui a demandé de changer de méthode mais il fait la sourde oreille.",
    registre: "courant",
    tags: ["ignorance volontaire", "refus", "communication", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-macher-ses-mots",
    expression: "Ne pas mâcher ses mots",
    signification: "Parler sans détour, avec une franchise brutale.",
    origine: "Mâcher les mots c'est les adoucir, les atténuer. Ne pas les mâcher c'est les livrer crus, sans précaution.",
    exemple: "Elle n'a pas mâché ses mots sur la qualité du travail rendu.",
    registre: "courant",
    tags: ["franchise", "brutalité", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "pecher-en-eau-trouble",
    expression: "Pêcher en eau trouble",
    signification: "Profiter d'une situation confuse pour en tirer un avantage personnel.",
    origine: "Dans une eau trouble, le poisson ne voit pas le piège. Le pêcheur habile profite de la confusion pour attraper plus facilement. Attestée depuis le XVIe siècle.",
    exemple: "Pendant la crise, certains ont pêché en eau trouble en spéculant sur les masques.",
    registre: "courant",
    tags: ["opportunisme", "malhonnêteté", "crise"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-compas-dans-l-oeil",
    expression: "Avoir le compas dans l'œil",
    signification: "Évaluer avec précision à vue d'œil, avoir un sens aigu de la mesure.",
    origine: "Le compas est l'instrument de précision par excellence. L'avoir « dans l'œil » c'est avoir intégré cette précision dans sa perception visuelle.",
    exemple: "Sans mesurer, elle a placé le tableau exactement au bon endroit — elle a le compas dans l'œil.",
    registre: "courant",
    tags: ["précision", "talent", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "en-avoir-gros-sur-le-coeur",
    expression: "En avoir gros sur le cœur",
    signification: "Avoir beaucoup de peine ou de rancœur qu'on n'a pas encore exprimée.",
    origine: "Le cœur alourdi par des émotions non dites. En avoir gros c'est en avoir beaucoup — une douleur ou un ressentiment qui pèse.",
    exemple: "Elle en a gros sur le cœur depuis cette injustice mais ne dit rien.",
    registre: "courant",
    tags: ["peine", "rancœur", "émotions", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "tirer-les-vers-du-nez",
    expression: "Tirer les vers du nez",
    signification: "Obtenir des informations de quelqu'un qui ne voulait pas en donner.",
    origine: "Image grotesque et parlante : extraire quelque chose (des vers, disgracieux mais révélateurs) d'un endroit inattendu (le nez). Signifie une extraction difficile d'informations.",
    exemple: "On a dû lui tirer les vers du nez pour qu'il avoue ce qui s'était passé.",
    registre: "courant",
    tags: ["interrogation", "secret", "communication", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-y-voir-malice",
    expression: "Ne pas y voir malice",
    signification: "Ne pas interpréter quelque chose comme malveillant, prendre les choses en bonne part.",
    origine: "La malice au sens ancien désigne la mauvaise intention. Ne pas la percevoir c'est supposer la bonne foi de l'autre.",
    exemple: "Il a parlé de ton âge sans y voir malice — c'était maladroit, pas méchant.",
    registre: "courant",
    tags: ["bonne foi", "interprétation", "relations"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-un-don-de-soi",
    expression: "Se donner corps et âme",
    signification: "S'investir totalement dans quelque chose, sans rien garder pour soi.",
    origine: "Expression spirituelle et romantique : le corps (le physique) et l'âme (le spirituel) réunis dans un don total. Attestée depuis le XVIe siècle.",
    exemple: "Elle s'est donnée corps et âme à ce projet pendant trois ans.",
    registre: "courant",
    tags: ["dévouement", "passion", "engagement", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "passer-l-eponge",
    expression: "Passer l'éponge",
    signification: "Oublier une faute, pardonner, effacer une offense.",
    origine: "L'éponge efface ce qui est écrit sur une ardoise. Passer l'éponge c'est effacer les erreurs passées et repartir sur une page vierge.",
    exemple: "C'est une vieille dispute — passons l'éponge et recommençons.",
    registre: "courant",
    tags: ["pardon", "réconciliation", "relations"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-de-la-ressource",
    expression: "Avoir de la ressource",
    signification: "Être capable de trouver des solutions dans les situations difficiles, avoir des réserves.",
    origine: "La ressource désigne ce qu'on peut mobiliser dans un moment difficile. Avoir de la ressource c'est avoir des capacités cachées disponibles.",
    exemple: "Il paraissait à bout, mais il avait de la ressource — il s'en est sorti.",
    registre: "courant",
    tags: ["résilience", "débrouillardise", "capacités"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-l-estomac-dans-les-talons",
    expression: "Avoir l'estomac dans les talons",
    signification: "Avoir très faim.",
    origine: "Image comique et hyperbolique : l'estomac, vide d'être si affamé, serait « tombé » jusqu'aux talons. Attestée depuis le XVIIe siècle.",
    exemple: "On n'a rien mangé depuis ce matin — j'ai l'estomac dans les talons.",
    registre: "familier",
    tags: ["faim", "nourriture", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "sortir-du-chapeau",
    expression: "Sortir du chapeau",
    signification: "Apparaître de manière inattendue, être inventé ou produit de façon surprenante.",
    origine: "Allusion au tour du prestidigitateur qui sort un lapin de son chapeau. Ce qui sort du chapeau est imprévu et magique.",
    exemple: "Cette idée ne peut pas sortir du chapeau à la dernière minute — il faut s'y préparer.",
    registre: "courant",
    tags: ["surprise", "improvisation", "magie"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-l-eau-a-la-bouche",
    expression: "Avoir l'eau à la bouche",
    signification: "Ressentir une envie intense, avoir très envie de quelque chose.",
    origine: "La salivation augmente à la vue ou à la pensée d'un aliment appétissant — réflexe physiologique décrit par Pavlov. L'expression date du XVIIe siècle.",
    exemple: "Rien qu'à l'odeur de ce plat, j'avais l'eau à la bouche.",
    registre: "courant",
    tags: ["désir", "appétit", "nourriture", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "etre-tire-a-quatre-epingles",
    expression: "Être tiré à quatre épingles",
    signification: "Être habillé avec une élégance soignée, impeccable.",
    origine: "Autrefois on utilisait des épingles pour fixer les vêtements avec précision. Être tiré à quatre épingles c'est avoir une tenue parfaitement ajustée.",
    exemple: "Il était tiré à quatre épingles pour cet entretien — costume et cravate impeccables.",
    registre: "courant",
    tags: ["élégance", "apparence", "soin"],
    region: null,
    illustration: null
  },
  {
    id: "courir-sur-le-haricot",
    expression: "Courir sur le haricot",
    signification: "Agacer, exaspérer quelqu'un.",
    origine: "Le haricot désigne le gros orteil dans l'argot parisien du XIXe siècle (peut-être du breton « arikod »). Courir sur l'orteil de quelqu'un, c'est l'agacer.",
    exemple: "Avec ses remarques constantes, il commence à me courir sur le haricot.",
    registre: "familier",
    tags: ["agacement", "irritation", "nourriture"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-la-tete-de-l-emploi",
    expression: "Ne pas avoir la tête de l'emploi",
    signification: "Ne pas correspondre à l'image attendue pour un poste ou un rôle.",
    origine: "La « tête de l'emploi » est le physique ou l'allure associés à un métier. Ne pas l'avoir c'est décaler l'image de ce qu'on incarne.",
    exemple: "Il est excellent acteur mais n'a pas la tête de l'emploi pour ce rôle de séducteur.",
    registre: "courant",
    tags: ["apparence", "travail", "casting"],
    region: null,
    illustration: null
  },
  {
    id: "se-noyer-dans-les-details",
    expression: "Se noyer dans les détails",
    signification: "Perdre de vue l'essentiel en s'attardant sur des points secondaires.",
    origine: "Image de la noyade : être submergé par une multitude de petits éléments au point de ne plus voir le tableau d'ensemble.",
    exemple: "La réunion a duré trois heures parce qu'on s'est noyés dans les détails.",
    registre: "courant",
    tags: ["dispersion", "perfectionnisme", "travail"],
    region: null,
    illustration: null
  },
  {
    id: "mettre-les-points-sur-les-i",
    expression: "Mettre les points sur les i",
    signification: "Préciser les choses clairement, sans ambiguïté possible.",
    origine: "La lettre « i » est incomplète sans son point. Mettre les points c'est compléter ce qui était imprécis, clarifier définitivement.",
    exemple: "Il a mis les points sur les i : les retards ne seraient plus tolérés.",
    registre: "courant",
    tags: ["clarté", "communication", "précision"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-vent-en-face",
    expression: "Avoir le vent en face",
    signification: "Rencontrer des difficultés persistantes, avancer contre l'adversité.",
    origine: "Expression maritime : naviguer vent en face demande bien plus d'effort et de temps que d'avoir le vent dans le dos. Lutter contre les éléments.",
    exemple: "Depuis la crise, cette petite entreprise a le vent en face.",
    registre: "courant",
    tags: ["difficultés", "adversité", "persévérance", "mer"],
    region: null,
    illustration: null
  },
  {
    id: "plier-bagage",
    expression: "Plier bagage",
    signification: "Partir, quitter un endroit définitivement.",
    origine: "Image du voyageur ou du soldat qui range ses affaires dans sa valise pour partir. Attestée depuis le XVIIe siècle.",
    exemple: "Après dix ans dans cette ville, il a décidé de plier bagage.",
    registre: "courant",
    tags: ["départ", "changement", "voyage"],
    region: null,
    illustration: null
  },
  {
    id: "tenir-bon",
    expression: "Tenir bon",
    signification: "Résister, ne pas céder malgré la pression ou les difficultés.",
    origine: "Expression simple et robuste : « tenir » (maintenir sa position) + « bon » (solidement). Le marin qui tient bon son cap, le soldat qui ne recule pas.",
    exemple: "C'est dur en ce moment, mais il faut tenir bon.",
    registre: "courant",
    tags: ["résistance", "persévérance", "courage"],
    region: null,
    illustration: null
  },
  {
    id: "voir-midi-a-sa-porte",
    expression: "Voir midi à sa porte",
    signification: "Ne voir que ce qui nous arrange, interpréter les choses de façon trop personnelle.",
    origine: "Proverbe populaire : chacun voit midi selon l'orientation de sa maison — son propre point de vue prime sur la réalité objectif.",
    exemple: "Il voit midi à sa porte — il pense que tous les efforts de l'équipe lui sont destinés.",
    registre: "courant",
    tags: ["égocentrisme", "point de vue", "proverbe"],
    region: null,
    illustration: null
  },
  {
    id: "chanter-victoire",
    expression: "Chanter victoire",
    signification: "Se vanter d'une victoire, crier son succès.",
    origine: "Allusion aux chants de triomphe des armées victorieuses. Se réjouir bruyamment et publiquement d'un succès.",
    exemple: "Il chante victoire mais le contrat n'est pas encore signé.",
    registre: "courant",
    tags: ["vanité", "prématuré", "succès"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-avoir-froid-aux-yeux",
    expression: "Ne pas avoir froid aux yeux",
    signification: "Être audacieux, courageux, ne pas avoir peur.",
    origine: "Le froid aux yeux représente la paralysie par la peur — les yeux qui s'engèlent de terreur. Ne pas l'avoir c'est regarder le danger en face sans frémir.",
    exemple: "Elle est partie seule faire le tour du monde en voilier — elle n'a vraiment pas froid aux yeux.",
    registre: "courant",
    tags: ["courage", "audace", "caractère"],
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
console.log(`\nTotal après ajout : ${total.length} expressions`);
console.log('Fichier sauvegardé.');
