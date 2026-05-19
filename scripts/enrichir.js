// Script d'enrichissement de la base d'expressions
// Usage : node scripts/enrichir.js

const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data', 'expressions.json');

const NOUVELLES_EXPRESSIONS = [
  // ─── ANIMAUX ───────────────────────────────────────────────────────────────
  {
    id: "quand-le-chat-n-est-pas-la-les-souris-dansent",
    expression: "Quand le chat n'est pas là, les souris dansent",
    signification: "En l'absence du responsable, les subordonnés profitent de leur liberté.",
    origine: "Proverbe médiéval attesté en français dès le XIVe siècle, fondé sur l'observation de la vie naturelle : les souris s'aventurent quand le prédateur est absent.",
    exemple: "Dès que le directeur est parti en déplacement, toute l'équipe a raccourci ses journées — quand le chat n'est pas là, les souris dansent.",
    registre: "standard",
    tags: ["proverbe", "autorité", "travail", "liberté"],
    region: null,
    illustration: null
  },
  {
    id: "se-jeter-dans-la-gueule-du-loup",
    expression: "Se jeter dans la gueule du loup",
    signification: "Se mettre délibérément dans une situation dangereuse.",
    origine: "Métaphore tirée de la fable « Le Loup et l'Agneau » de La Fontaine et de l'image du loup comme prédateur ultime dans la culture rurale française.",
    exemple: "Aller négocier seul avec ces créanciers, c'est se jeter dans la gueule du loup.",
    registre: "standard",
    tags: ["danger", "imprudence", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "il-y-a-anguille-sous-roche",
    expression: "Il y a anguille sous roche",
    signification: "Il se passe quelque chose de suspect, de caché.",
    origine: "Attestée au XVIe siècle. L'anguille, poisson qui se cache dans les fentes des rochers, est associée à la dissimulation et à la ruse.",
    exemple: "Il sourit trop et évite mon regard — il y a anguille sous roche.",
    registre: "standard",
    tags: ["méfiance", "secret", "suspicion", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "payer-en-monnaie-de-singe",
    expression: "Payer en monnaie de singe",
    signification: "Ne pas payer ce qu'on doit, ou payer avec de fausses promesses.",
    origine: "Au Moyen Âge, les bateleurs avec leurs singes dressés pouvaient payer leur péage en faisant gambader leurs animaux. Cette « monnaie » en tours remplaçait l'argent sonnant.",
    exemple: "Il m'a remercié avec de belles paroles mais m'a payé en monnaie de singe — toujours pas remboursé.",
    registre: "standard",
    tags: ["argent", "tromperie", "animaux", "histoire"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-la-puce-a-l-oreille",
    expression: "Avoir la puce à l'oreille",
    signification: "Avoir un doute, être mis en éveil par un soupçon.",
    origine: "Attestée au XVe siècle. La puce dans l'oreille provoque une gêne persistante qui oblige à rester attentif — métaphore de l'inquiétude qui ne quitte pas.",
    exemple: "Sa réponse évasive m'a mis la puce à l'oreille : quelque chose ne tournait pas rond.",
    registre: "standard",
    tags: ["méfiance", "intuition", "suspicion", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "etre-une-bete-noire",
    expression: "Être la bête noire de quelqu'un",
    signification: "Être ce qu'une personne redoute ou déteste par-dessus tout.",
    origine: "La couleur noire est traditionnellement associée au mal et à la malchance. La bête noire est le cauchemar que l'on fuit.",
    exemple: "Les réunions du lundi matin, c'est ma bête noire depuis des années.",
    registre: "standard",
    tags: ["aversion", "peur", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "faire-l-autruche",
    expression: "Faire l'autruche",
    signification: "Refuser de voir la réalité, ignorer délibérément un problème.",
    origine: "Fondée sur la croyance (fausse mais populaire) que l'autruche cache sa tête dans le sable pour ne pas voir le danger.",
    exemple: "Il sait que son entreprise va mal, mais il fait l'autruche et ne prend aucune décision.",
    registre: "standard",
    tags: ["déni", "lâcheté", "animaux", "comportement"],
    region: null,
    illustration: null
  },
  {
    id: "courir-deux-lievres-a-la-fois",
    expression: "Courir deux lièvres à la fois",
    signification: "Vouloir faire deux choses en même temps et risquer de n'en réussir aucune.",
    origine: "Proverbe issu de la pratique de la chasse : un chasseur qui poursuit deux lièvres à la fois n'en attrape généralement aucun.",
    exemple: "Tu veux lancer deux startups en même temps ? Attention à ne pas courir deux lièvres à la fois.",
    registre: "standard",
    tags: ["dispersion", "proverbe", "animaux", "travail"],
    region: null,
    illustration: null
  },
  {
    id: "a-bon-chat-bon-rat",
    expression: "À bon chat, bon rat",
    signification: "À adversaire habile, adversaire de même force ; les deux partis se valent.",
    origine: "Proverbe français attesté depuis le XVIe siècle, fondé sur l'opposition naturelle entre le chat prédateur et le rat sa proie, qui peut résister.",
    exemple: "Dans ce procès, les deux avocats sont excellents — à bon chat, bon rat.",
    registre: "standard",
    tags: ["proverbe", "rivalité", "animaux", "égalité"],
    region: null,
    illustration: null
  },
  {
    id: "donner-des-perles-aux-cochons",
    expression: "Donner des perles aux cochons",
    signification: "Offrir quelque chose de précieux à quelqu'un incapable de l'apprécier.",
    origine: "Expression biblique (Matthieu 7:6 : « Ne jetez pas vos perles devant les pourceaux »). Passée dans la langue courante avec les cochons à la place des pourceaux.",
    exemple: "Lui expliquer la beauté de cette architecture, c'est donner des perles aux cochons.",
    registre: "standard",
    tags: ["mépris", "incompréhension", "animaux", "culture"],
    region: null,
    illustration: null
  },
  {
    id: "il-y-a-un-os",
    expression: "Il y a un os",
    signification: "Il y a un problème, un obstacle imprévu.",
    origine: "Métaphore culinaire : l'os dans la viande représente ce qui bloque, ce sur quoi on bute. Attestée au XIXe siècle dans l'argot parisien.",
    exemple: "Le projet était bien lancé, mais il y a un os : on n'a pas le budget.",
    registre: "informal",
    tags: ["problème", "obstacle", "difficulté"],
    region: null,
    illustration: null
  },
  {
    id: "mordre-la-poussiere",
    expression: "Mordre la poussière",
    signification: "Subir une défaite humiliante, échouer complètement.",
    origine: "Image du guerrier terrassé qui tombe face contre terre. Popularisée par la littérature épique et les récits de combats.",
    exemple: "Ils se croyaient imbattables, mais ils ont mordu la poussière au championnat.",
    registre: "standard",
    tags: ["défaite", "échec", "humiliation"],
    region: null,
    illustration: null
  },
  {
    id: "un-froid-de-canard",
    expression: "Un froid de canard",
    signification: "Un froid intense, glacial.",
    origine: "Le canard est réputé pour se trouver dans des endroits humides et froids (marais, étangs gelés) que les chasseurs fréquentent en hiver. Ce froid typique des parties de chasse est devenu synonyme de grand froid.",
    exemple: "Ne sors pas sans manteau, il fait un froid de canard ce matin.",
    registre: "informal",
    tags: ["météo", "froid", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "se-tenir-a-carreau",
    expression: "Se tenir à carreau",
    signification: "Se tenir bien, éviter de faire des bêtises, rester prudent.",
    origine: "Au jeu de cartes, le carreau est une couleur « sage » par rapport au cœur (passion) ou au trèfle (chance). Tenir le bon jeu de carreaux signifiait jouer serré.",
    exemple: "Depuis son dernier avertissement, il se tient à carreau.",
    registre: "informal",
    tags: ["prudence", "comportement", "jeu"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-loup-dans-les-dents",
    expression: "Avoir le loup dans les dents",
    signification: "Être agressif, déterminé et prêt à se battre.",
    origine: "Image du loup, prédateur qui attaque avec ses crocs. Utilisée pour décrire quelqu'un de combatif qui n'hésite pas à mordre.",
    exemple: "Dans cette négociation, il avait le loup dans les dents — il n'a rien lâché.",
    registre: "standard",
    tags: ["combativité", "agressivité", "animaux", "travail"],
    region: null,
    illustration: null
  },
  {
    id: "il-pleut-des-cordes",
    expression: "Il pleut des cordes",
    signification: "Il pleut très fort, à verse.",
    origine: "Image des filets de pluie aussi épais et serrés que des cordes. Attestée depuis le XVIIe siècle en français.",
    exemple: "On ne peut pas sortir, il pleut des cordes depuis ce matin.",
    registre: "standard",
    tags: ["météo", "pluie"],
    region: null,
    illustration: null
  },
  {
    id: "apres-la-pluie-le-beau-temps",
    expression: "Après la pluie, le beau temps",
    signification: "Les mauvaises périodes finissent toujours par passer et céder place à des moments meilleurs.",
    origine: "Proverbe populaire fondé sur l'observation météorologique, utilisé comme consolation depuis le Moyen Âge.",
    exemple: "Tu traverses une période difficile, mais après la pluie le beau temps — ça finira par aller mieux.",
    registre: "standard",
    tags: ["proverbe", "optimisme", "réconfort", "météo"],
    region: null,
    illustration: null
  },

  // ─── CORPS HUMAIN ──────────────────────────────────────────────────────────
  {
    id: "avoir-du-nez",
    expression: "Avoir du nez",
    signification: "Avoir de l'intuition, du flair, sentir les choses à l'avance.",
    origine: "Métaphore olfactive : le flair du chasseur ou du détective qui « sent » quelque chose avant de le voir. Attestée depuis le XVIIe siècle.",
    exemple: "Elle a eu du nez d'investir dans cette entreprise il y a cinq ans.",
    registre: "standard",
    tags: ["intuition", "intelligence", "prévoyance", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "mener-par-le-bout-du-nez",
    expression: "Mener par le bout du nez",
    signification: "Dominer totalement quelqu'un, lui faire faire ce qu'on veut.",
    origine: "Allusion à l'anneau passé dans le nez des taureaux et des buffles pour les conduire. Attestée au XVIe siècle.",
    exemple: "Elle le mène par le bout du nez — il est incapable de lui dire non.",
    registre: "standard",
    tags: ["domination", "manipulation", "relations", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "se-casser-le-nez",
    expression: "Se casser le nez",
    signification: "Échouer dans une tentative, ou trouver porte close en se rendant quelque part.",
    origine: "Image de la chute sur le nez, partie saillante du visage qui porte le choc. Métaphore d'un échec frontal.",
    exemple: "Je suis allé à la mairie mais elle était fermée — je me suis cassé le nez.",
    registre: "informal",
    tags: ["échec", "déception", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "en-avoir-plein-les-bottes",
    expression: "En avoir plein les bottes",
    signification: "Être épuisé d'avoir marché, ou plus généralement, être à bout de forces.",
    origine: "Expression du monde rural et militaire : les soldats ou les paysans qui ont marché toute la journée ont littéralement les pieds douloureux dans leurs bottes.",
    exemple: "On a fait quinze kilomètres dans la montagne, j'en avais plein les bottes en arrivant au refuge.",
    registre: "informal",
    tags: ["fatigue", "épuisement", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-quelqu-un-dans-le-nez",
    expression: "Avoir quelqu'un dans le nez",
    signification: "Ne pas supporter quelqu'un, lui en vouloir.",
    origine: "Référence à l'odorat : quelque chose qui « sent mauvais » évoque instinctivement le rejet. Avoir quelqu'un « dans le nez » c'est le ressentir comme une odeur désagréable.",
    exemple: "Depuis leur dispute, il l'a dans le nez et refuse de travailler avec elle.",
    registre: "informal",
    tags: ["antipathie", "hostilité", "relations", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "montrer-les-dents",
    expression: "Montrer les dents",
    signification: "Montrer son hostilité, menacer, manifester qu'on est prêt à se défendre.",
    origine: "Comportement animal universel : l'animal qui grogne en montrant ses crocs signale le danger. Transposé à l'être humain pour exprimer une attitude agressive.",
    exemple: "Face aux critiques, il a montré les dents — personne n'a osé insister.",
    registre: "standard",
    tags: ["menace", "agressivité", "défense", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "serrer-les-dents",
    expression: "Serrer les dents",
    signification: "Endurer une situation difficile sans se plaindre, persévérer malgré la douleur.",
    origine: "Image physiologique du sportif ou du blessé qui serre la mâchoire pour supporter la douleur sans crier. Symbole de résistance stoïque.",
    exemple: "Les derniers mois ont été durs, mais on a serré les dents et on s'en est sortis.",
    registre: "standard",
    tags: ["courage", "endurance", "persévérance", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "les-doigts-dans-le-nez",
    expression: "Les doigts dans le nez",
    signification: "Très facilement, sans aucun effort.",
    origine: "Image d'une activité si peu exigeante qu'on peut la faire distraitement, sans même s'y concentrer — comme un enfant qui se cure le nez sans y penser.",
    exemple: "Il a réussi cet examen les doigts dans le nez — il n'avait même pas révisé.",
    registre: "informal",
    tags: ["facilité", "aisance", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "se-mordre-les-doigts",
    expression: "Se mordre les doigts",
    signification: "Regretter amèrement une décision ou une action.",
    origine: "Geste naturel d'expression du regret intense : se mordre les doigts de rage ou de dépit. Connu depuis l'Antiquité.",
    exemple: "Il s'est mordu les doigts d'avoir refusé cette offre d'emploi.",
    registre: "standard",
    tags: ["regret", "erreur", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "perdre-pied",
    expression: "Perdre pied",
    signification: "Ne plus maîtriser une situation, être dépassé par les événements.",
    origine: "Métaphore aquatique : le nageur qui perd pied ne touche plus le fond et risque de se noyer. Transposée à toute situation où l'on n'a plus de contrôle.",
    exemple: "Face à l'afflux de questions techniques, il a commencé à perdre pied.",
    registre: "standard",
    tags: ["dépassé", "difficulté", "perte de contrôle", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-les-mains-liees",
    expression: "Avoir les mains liées",
    signification: "Ne pas avoir la liberté d'agir, être contraint par des règles ou des circonstances.",
    origine: "Image concrète de la captivité : les mains attachées empêchent tout mouvement. Métaphore attestée depuis le XVIIe siècle.",
    exemple: "Je voudrais t'aider mais j'ai les mains liées — c'est la direction qui décide.",
    registre: "standard",
    tags: ["contrainte", "impuissance", "liberté", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-dos-large",
    expression: "Avoir le dos large",
    signification: "Servir de bouc émissaire, supporter les reproches à la place des autres.",
    origine: "Image d'une personne solide dont le dos peut porter de lourds fardeaux. Les accusateurs chargent quelqu'un dont le « dos est assez large » pour tout porter.",
    exemple: "Chaque fois qu'il y a un problème dans l'équipe, c'est lui qui a le dos large.",
    registre: "standard",
    tags: ["injustice", "bouc émissaire", "responsabilité", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "retourner-sa-veste",
    expression: "Retourner sa veste",
    signification: "Changer d'opinion ou de camp de façon opportuniste, sans principe.",
    origine: "Au XVIIe siècle, certains soldats retournaient leur veste (dont l'envers était d'une autre couleur) pour passer dans le camp adverse sans être reconnus. Symbole de traîtrise.",
    exemple: "Dès que le gouvernement a changé, il a retourné sa veste et soutenu l'opposition.",
    registre: "standard",
    tags: ["trahison", "opportunisme", "politique", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-sang-froid",
    expression: "Avoir du sang-froid",
    signification: "Garder son calme dans une situation difficile ou dangereuse.",
    origine: "Métaphore physiologique : un sang « froid » (non bouillonnant de peur ou de colère) est le signe d'une maîtrise de soi. Opposé au « sang chaud » de l'emporté.",
    exemple: "Malgré l'accident, elle a gardé son sang-froid et organisé les secours.",
    registre: "standard",
    tags: ["calme", "maîtrise de soi", "sang-froid", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "sauter-aux-yeux",
    expression: "Sauter aux yeux",
    signification: "Être évident, se voir immédiatement, être impossible à ignorer.",
    origine: "Image d'une chose qui « bondit » vers les yeux avec une telle force qu'on ne peut pas la manquer.",
    exemple: "L'erreur dans le rapport saute aux yeux — comment ont-ils pu ne pas la voir ?",
    registre: "standard",
    tags: ["évidence", "clarté", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-coeur-sur-la-main",
    expression: "Avoir le cœur sur la main",
    signification: "Être très généreux, prêt à tout donner.",
    origine: "Image du cœur tenu ouvertement dans la main, offert à tous. Symbole de générosité sans calcul.",
    exemple: "Elle a le cœur sur la main — elle aiderait n'importe qui sans rien demander en retour.",
    registre: "standard",
    tags: ["générosité", "altruisme", "caractère", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-les-chevilles-qui-enflent",
    expression: "Avoir les chevilles qui enflent",
    signification: "Être vaniteux, avoir une trop haute opinion de soi depuis un succès.",
    origine: "Image humoristique : la tête qui enfle d'orgueil ferait enfler aussi les chevilles, parties basses du corps, pour se moquer de la prétention.",
    exemple: "Depuis qu'il a eu une promotion, il a vraiment les chevilles qui enflent.",
    registre: "informal",
    tags: ["vanité", "orgueil", "arrogance", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "en-avoir-jusqu-au-cou",
    expression: "En avoir jusqu'au cou",
    signification: "Être plongé jusqu'au cou dans une situation difficile, en avoir assez.",
    origine: "Image d'une immersion presque totale : le niveau monte et atteint le cou, juste avant la noyade. Signifie qu'on est au bord du seuil critique.",
    exemple: "J'en ai jusqu'au cou avec ce dossier — ça fait trois semaines que je ne dors plus.",
    registre: "informal",
    tags: ["surcharge", "épuisement", "difficultés", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-la-tete-sur-les-epaules",
    expression: "Avoir la tête sur les épaules",
    signification: "Être raisonnable, pragmatique, avoir les pieds sur terre.",
    origine: "Image d'une personne bien équilibrée dont la tête est solidement posée sur les épaules — à l'opposé de quelqu'un « dans les nuages ».",
    exemple: "Malgré son jeune âge, il a vraiment la tête sur les épaules.",
    registre: "standard",
    tags: ["sagesse", "pragmatisme", "caractère", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "prendre-a-bras-le-corps",
    expression: "Prendre à bras-le-corps",
    signification: "S'attaquer à un problème avec énergie et détermination.",
    origine: "Image de la lutte : saisir son adversaire à bras-le-corps pour l'immobiliser. Transposée à tout défi qu'on affronte frontalement.",
    exemple: "Il faut prendre ce problème à bras-le-corps plutôt que d'attendre qu'il s'aggrave.",
    registre: "standard",
    tags: ["détermination", "action", "courage", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-la-main-verte",
    expression: "Avoir la main verte",
    signification: "Avoir le don de faire pousser les plantes, être doué pour le jardinage.",
    origine: "Calque de l'anglais « green thumb » (pouce vert). L'expression s'est répandue en français au XXe siècle pour désigner les personnes qui réussissent à faire prospérer les plantes.",
    exemple: "Ses tomates sont magnifiques — elle a vraiment la main verte.",
    registre: "standard",
    tags: ["jardinage", "nature", "talent", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "travailler-d-arrache-pied",
    expression: "Travailler d'arrache-pied",
    signification: "Travailler avec acharnement, sans relâche.",
    origine: "L'expression évoque l'effort physique intense au point d'avoir l'impression que ses pieds sont arrachés du sol. Attestée au XVIIe siècle.",
    exemple: "Elle a travaillé d'arrache-pied pendant six mois pour préparer ce projet.",
    registre: "standard",
    tags: ["travail", "acharnement", "effort", "corps"],
    region: null,
    illustration: null
  },

  // ─── ARGENT & TRAVAIL ──────────────────────────────────────────────────────
  {
    id: "rouler-sur-l-or",
    expression: "Rouler sur l'or",
    signification: "Être très riche, avoir de l'argent en abondance.",
    origine: "Image d'un sol tapissé d'or sur lequel on roule — métaphore de la richesse extrême connue depuis le XVIIe siècle.",
    exemple: "Ce n'est pas parce qu'il conduit une belle voiture qu'il roule sur l'or.",
    registre: "standard",
    tags: ["argent", "richesse"],
    region: null,
    illustration: null
  },
  {
    id: "faire-des-economies-de-bouts-de-chandelle",
    expression: "Faire des économies de bouts de chandelle",
    signification: "Faire des économies dérisoires sur des détails insignifiants tout en gaspillant sur l'essentiel.",
    origine: "La chandelle était précieuse et coûteuse. Brûler le bout restant plutôt que de le jeter était une économie minuscule. Devenu symbole des petites épargnes sans vision.",
    exemple: "Il refuse d'imprimer en couleur pour économiser mais gaspille en frais de déplacement — il fait des économies de bouts de chandelle.",
    registre: "standard",
    tags: ["argent", "mesquinerie", "économie"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-de-la-bouteille",
    expression: "Avoir de la bouteille",
    signification: "Avoir de l'expérience, être aguerri par les années.",
    origine: "Métaphore viticole : un vin « qui a de la bouteille » a vieilli et s'est bonifié avec le temps. Transposée à l'expérience humaine.",
    exemple: "Pour ce poste délicat, on cherche quelqu'un qui a de la bouteille.",
    registre: "standard",
    tags: ["expérience", "maturité", "travail"],
    region: null,
    illustration: null
  },
  {
    id: "tirer-les-ficelles",
    expression: "Tirer les ficelles",
    signification: "Agir en coulisse pour manipuler les autres, être le vrai maître d'une situation.",
    origine: "Métaphore du marionnettiste qui tire les fils pour faire bouger ses personnages. L'expression désigne celui qui dirige sans être visible.",
    exemple: "Le PDG officiel n'est qu'une façade — c'est son associé qui tire les ficelles.",
    registre: "standard",
    tags: ["manipulation", "pouvoir", "politique", "discrétion"],
    region: null,
    illustration: null
  },
  {
    id: "tourner-en-rond",
    expression: "Tourner en rond",
    signification: "Ne pas avancer, revenir toujours au même point sans trouver de solution.",
    origine: "Image de l'animal en cage ou de l'homme perdu dans un bois, qui tourne sans trouver d'issue. Métaphore de l'inefficacité stérile.",
    exemple: "Ça fait deux heures qu'on discute de ce problème — on tourne en rond.",
    registre: "standard",
    tags: ["blocage", "inefficacité", "travail"],
    region: null,
    illustration: null
  },
  {
    id: "batir-des-chateaux-en-espagne",
    expression: "Bâtir des châteaux en Espagne",
    signification: "Se faire des illusions, faire des projets irréalisables.",
    origine: "Au Moyen Âge, l'Espagne était pour les Français un pays lointain et mal connu. Posséder des terres là-bas était une chimère. L'expression est attestée depuis le XIIIe siècle.",
    exemple: "Il parle de partir vivre à Tahiti avec ses économies — il bâtit des châteaux en Espagne.",
    registre: "standard",
    tags: ["illusion", "rêverie", "irréalisme"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-chomer",
    expression: "Ne pas chômer",
    signification: "Être très actif, ne pas rester sans rien faire.",
    origine: "Le chômage désigne originellement l'inactivité forcée (chômer = s'arrêter de travailler). Ne pas chômer c'est donc ne jamais s'arrêter.",
    exemple: "Depuis le lancement du projet, il ne chôme pas — réunions tous les jours.",
    registre: "standard",
    tags: ["travail", "activité", "productivité"],
    region: null,
    illustration: null
  },
  {
    id: "mettre-la-main-a-la-pate",
    expression: "Mettre la main à la pâte",
    signification: "Participer activement à un travail, s'impliquer concrètement.",
    origine: "Image boulangère : mettre les mains dans la pâte signifie travailler physiquement, s'y mettre vraiment. Attestée depuis le XVIIe siècle.",
    exemple: "Au lieu de donner des ordres, il devrait mettre la main à la pâte avec son équipe.",
    registre: "standard",
    tags: ["travail", "implication", "action"],
    region: null,
    illustration: null
  },
  {
    id: "prendre-du-galon",
    expression: "Prendre du galon",
    signification: "Monter en grade, obtenir une promotion, progresser dans sa carrière.",
    origine: "Le galon militaire est la bande ornementale sur l'uniforme qui indique le grade. Gagner des galons signifie monter en hiérarchie.",
    exemple: "En trois ans, il a pris du galon et dirige maintenant une équipe de vingt personnes.",
    registre: "standard",
    tags: ["carrière", "promotion", "travail"],
    region: null,
    illustration: null
  },
  {
    id: "se-retrouver-le-bec-dans-l-eau",
    expression: "Se retrouver le bec dans l'eau",
    signification: "Se retrouver sans rien, déçu d'une attente qui n'aboutit pas.",
    origine: "Image de l'oiseau dont le bec effleure l'eau sans pouvoir boire ou attraper de proie — attente vaine qui ne donne rien.",
    exemple: "On lui avait promis un poste, puis la direction a changé d'avis — il s'est retrouvé le bec dans l'eau.",
    registre: "standard",
    tags: ["déception", "espoir déçu", "travail"],
    region: null,
    illustration: null
  },
  {
    id: "etre-dans-les-choux",
    expression: "Être dans les choux",
    signification: "Être en difficulté, être en mauvaise posture, ou être loin du résultat attendu.",
    origine: "Expression ancienne dont l'origine est incertaine — peut-être liée aux nouvelles-nés « trouvés dans les choux » (expression enfantine), ou à l'idée d'être perdu dans un champ de végétaux denses.",
    exemple: "Avec ce retard de livraison, on est dans les choux pour tenir le délai.",
    registre: "informal",
    tags: ["difficulté", "problème", "échec"],
    region: null,
    illustration: null
  },

  // ─── COMMUNICATION & VÉRITÉ ────────────────────────────────────────────────
  {
    id: "dire-ses-quatre-verites",
    expression: "Dire ses quatre vérités à quelqu'un",
    signification: "Dire franchement à quelqu'un ce qu'on pense de lui, sans ménagement.",
    origine: "L'expression « quatre vérités » insiste sur la totalité et la franchise — comme si on déballait tout sans retenue. Attestée depuis le XVIIIe siècle.",
    exemple: "Elle en avait assez de ses mensonges et lui a dit ses quatre vérités.",
    registre: "standard",
    tags: ["honnêteté", "franchise", "communication", "conflit"],
    region: null,
    illustration: null
  },
  {
    id: "mettre-son-grain-de-sel",
    expression: "Mettre son grain de sel",
    signification: "S'immiscer dans une conversation ou une affaire qui ne nous concerne pas, donner son avis sans qu'on le demande.",
    origine: "Le sel est un condiment que certains ajoutent à tout sans réfléchir. L'image est celle de l'indiscret qui assaisonne les propos des autres.",
    exemple: "Il faut toujours qu'il mette son grain de sel quand on parle entre collègues.",
    registre: "standard",
    tags: ["indiscrétion", "intrusion", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "en-faire-des-tonnes",
    expression: "En faire des tonnes",
    signification: "Exagérer, en rajouter dans les pleurs, le théâtre ou les efforts ostentatoires.",
    origine: "La tonne (unité de poids) est utilisée de façon hyperbolique pour signifier une quantité excessive de quelque chose — ici une démonstration hors de proportion.",
    exemple: "Il a eu un léger rhume mais il en a fait des tonnes devant toute la famille.",
    registre: "informal",
    tags: ["exagération", "théâtralité", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "parler-dans-le-vide",
    expression: "Parler dans le vide",
    signification: "S'exprimer sans que personne n'écoute ou ne prête attention.",
    origine: "Image physique du son qui se perd dans un espace vide, sans obstacle pour le recevoir — personne ne capte le message.",
    exemple: "J'ai répété mes instructions dix fois — je parle dans le vide.",
    registre: "standard",
    tags: ["communication", "incompréhension", "frustration"],
    region: null,
    illustration: null
  },
  {
    id: "appeler-un-chat-un-chat",
    expression: "Appeler un chat un chat",
    signification: "Nommer les choses clairement, sans euphémisme ni détour.",
    origine: "Tirée d'un vers de Boileau (1636-1711) : « J'appelle un chat un chat et Rolet un fripon ». Boileau revendiquait de nommer directement les choses et les gens.",
    exemple: "Soyons directs : appelons un chat un chat — ce projet est un échec.",
    registre: "standard",
    tags: ["franchise", "clarté", "communication", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "couper-les-cheveux-en-quatre",
    expression: "Couper les cheveux en quatre",
    signification: "S'attarder sur des détails infimes, être excessivement pointilleux.",
    origine: "Image d'une précision poussée à l'absurde : il est impossible de couper un cheveu en quatre morceaux — c'est donc une querelle ou une analyse stérile.",
    exemple: "On perd du temps à couper les cheveux en quatre — on devrait trancher et avancer.",
    registre: "standard",
    tags: ["perfectionnisme", "rigueur excessive", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "parler-a-tort-et-a-travers",
    expression: "Parler à tort et à travers",
    signification: "Parler sans réfléchir, dire n'importe quoi.",
    origine: "L'expression combine deux notions : « tort » (ce qui est faux ou injuste) et « travers » (ce qui est de biais, sans droiture). Parler dans ces deux directions c'est parler sans cohérence.",
    exemple: "Il ne sait rien du sujet mais parle à tort et à travers.",
    registre: "standard",
    tags: ["imprudence", "légèreté", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "vendre-la-meche",
    expression: "Vendre la mèche",
    signification: "Révéler un secret, trahir un complot ou une surprise.",
    origine: "Référence à la mèche d'un pétard ou d'un engin explosif : révéler où elle se trouve désamorce le plan. Ou allusion à la mèche d'une lanterne qu'on montre et qui révèle qu'on est là.",
    exemple: "La surprise était gâchée — quelqu'un avait vendu la mèche.",
    registre: "standard",
    tags: ["trahison", "secret", "révélation"],
    region: null,
    illustration: null
  },

  // ─── SITUATIONS & RÉSULTATS ────────────────────────────────────────────────
  {
    id: "c-est-la-croix-et-la-banniere",
    expression: "C'est la croix et la bannière",
    signification: "C'est extrêmement difficile à obtenir ou à faire, cela demande beaucoup d'efforts ou de démarches.",
    origine: "Dans les processions religieuses, la croix et la bannière (grande pièce d'étoffe brodée) étaient portées en tête — un déploiement solennel et compliqué à organiser.",
    exemple: "Pour obtenir un rendez-vous dans ce service, c'est la croix et la bannière.",
    registre: "standard",
    tags: ["difficulté", "bureaucratie", "effort"],
    region: null,
    illustration: null
  },
  {
    id: "arriver-comme-un-cheveu-sur-la-soupe",
    expression: "Arriver comme un cheveu sur la soupe",
    signification: "Arriver à un moment très inopportun, mal à propos.",
    origine: "Image d'un cheveu qui atterrit dans un plat — indésirable, inattendu et qui gâche le moment. Attestée depuis le XIXe siècle.",
    exemple: "Il est arrivé au beau milieu de notre dispute — comme un cheveu sur la soupe.",
    registre: "standard",
    tags: ["maladresse", "mauvais timing", "situations"],
    region: null,
    illustration: null
  },
  {
    id: "c-est-du-gateau",
    expression: "C'est du gâteau",
    signification: "C'est très facile, sans difficulté.",
    origine: "Le gâteau représente quelque chose d'agréable et facile à consommer. Calque possible de l'anglais « piece of cake ».",
    exemple: "Ce niveau du jeu ? C'est du gâteau, j'ai gagné du premier coup.",
    registre: "informal",
    tags: ["facilité", "simplicité"],
    region: null,
    illustration: null
  },
  {
    id: "prendre-la-tangente",
    expression: "Prendre la tangente",
    signification: "S'esquiver habilement, éviter une situation difficile ou une question gênante.",
    origine: "Terme mathématique : la tangente est une ligne qui frôle un cercle sans l'intersecter. « Partir en tangente » c'est s'échapper sans affrontement direct.",
    exemple: "Quand on lui a posé la question sur les finances, il a pris la tangente.",
    registre: "standard",
    tags: ["fuite", "évitement", "discrétion"],
    region: null,
    illustration: null
  },
  {
    id: "tomber-de-haut",
    expression: "Tomber de haut",
    signification: "Être profondément déçu, désillusionné après s'être fait beaucoup d'illusions.",
    origine: "Image de la chute depuis une hauteur : plus on est monté haut (dans ses espérances), plus la chute est rude.",
    exemple: "Il pensait être élu facilement — il est tombé de haut quand il a vu les résultats.",
    registre: "standard",
    tags: ["déception", "illusion", "espoir déçu"],
    region: null,
    illustration: null
  },
  {
    id: "passer-a-la-trappe",
    expression: "Passer à la trappe",
    signification: "Être oublié, supprimé, disparaître sans laisser de trace.",
    origine: "La trappe est une porte dans le sol ou le plafond par laquelle on fait disparaître quelque chose ou quelqu'un. En théâtre, les acteurs passent par les trappes pour disparaître de la scène.",
    exemple: "Toutes ses propositions sont passées à la trappe sans même être discutées.",
    registre: "informal",
    tags: ["oubli", "élimination", "échec"],
    region: null,
    illustration: null
  },
  {
    id: "tomber-a-l-eau",
    expression: "Tomber à l'eau",
    signification: "Échouer, ne pas se réaliser en parlant d'un projet.",
    origine: "Image d'un objet qu'on laisse tomber à l'eau — il coule et est perdu. Métaphore d'un projet qui sombre.",
    exemple: "Le voyage en Italie est tombé à l'eau — on n'a pas eu les congés.",
    registre: "standard",
    tags: ["échec", "annulation", "déception"],
    region: null,
    illustration: null
  },
  {
    id: "passer-l-arme-a-gauche",
    expression: "Passer l'arme à gauche",
    signification: "Mourir.",
    origine: "Expression militaire : au repos, les soldats portent l'arme à gauche. Un mort ne peut plus la porter qu'à gauche. Attestée depuis le XIXe siècle.",
    exemple: "Le vieux chêne du jardin a fini par passer l'arme à gauche cet hiver.",
    registre: "informal",
    tags: ["mort", "fin", "euphémisme"],
    region: null,
    illustration: null
  },
  {
    id: "monter-en-fleche",
    expression: "Monter en flèche",
    signification: "Augmenter très rapidement, progresser à toute vitesse.",
    origine: "Image de la flèche décochée qui monte verticalement avec une grande vélocité. Utilisée depuis le XIXe siècle pour qualifier une hausse rapide.",
    exemple: "Les prix de l'immobilier ont monté en flèche ces dernières années.",
    registre: "standard",
    tags: ["progression", "hausse", "rapidité"],
    region: null,
    illustration: null
  },
  {
    id: "aller-a-vau-l-eau",
    expression: "Aller à vau-l'eau",
    signification: "Se dégrader progressivement, aller à la dérive.",
    origine: "« Vau-l'eau » vient de « val d'eau » — le fond du courant. Une chose qui va à vau-l'eau est emportée par le courant sans résistance.",
    exemple: "Depuis le départ du directeur, l'entreprise va à vau-l'eau.",
    registre: "standard",
    tags: ["déclin", "échec", "dégradation"],
    region: null,
    illustration: null
  },
  {
    id: "revenir-de-loin",
    expression: "Revenir de loin",
    signification: "S'en être sorti de justesse après une situation très grave.",
    origine: "Métaphore du voyage depuis un lieu très éloigné — ici la mort ou la catastrophe. On est allé très loin dans le danger avant d'en revenir.",
    exemple: "Après son accident cardiaque, les médecins l'ont dit : il revenait de loin.",
    registre: "standard",
    tags: ["survie", "chance", "santé"],
    region: null,
    illustration: null
  },
  {
    id: "faire-contre-mauvaise-fortune-bon-coeur",
    expression: "Faire contre mauvaise fortune bon cœur",
    signification: "Accepter une situation difficile avec résignation et bonne humeur.",
    origine: "Proverbe classique attesté depuis le XVIIe siècle. La « mauvaise fortune » désigne les coups du destin — on les affronte en gardant « bon cœur » (bonne disposition d'esprit).",
    exemple: "Le voyage était raté mais on a fait contre mauvaise fortune bon cœur — on a improvisé.",
    registre: "standard",
    tags: ["résilience", "acceptation", "optimisme", "proverbe"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-y-aller-par-quatre-chemins",
    expression: "Ne pas y aller par quatre chemins",
    signification: "Être direct, aller droit au but sans détour.",
    origine: "Image de celui qui choisit le chemin le plus court plutôt que de prendre quatre routes différentes pour arriver au même endroit.",
    exemple: "Il n'y est pas allé par quatre chemins — il a dit directement que le projet était mauvais.",
    registre: "standard",
    tags: ["franchise", "directivité", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "casser-la-glace",
    expression: "Casser la glace",
    signification: "Briser la gêne ou la réserve qui existe entre des personnes qui ne se connaissent pas.",
    origine: "Métaphore maritime : les brise-glace ouvrent la voie dans des eaux gelées. Par extension, rompre la « glace » des relations froides ou formelles.",
    exemple: "Une bonne blague au début de la réunion a suffi à casser la glace.",
    registre: "standard",
    tags: ["relations", "sociabilité", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "etre-sur-du-velours",
    expression: "Être sur du velours",
    signification: "Être dans une situation très confortable, sans risque.",
    origine: "Le velours est une étoffe douce et précieuse. Être « sur du velours » c'est être installé dans la douceur et le confort, à l'abri de tout souci.",
    exemple: "Avec ce contrat signé pour trois ans, ils sont sur du velours.",
    registre: "standard",
    tags: ["confort", "sécurité", "sérénité"],
    region: null,
    illustration: null
  },

  // ─── CARACTÈRE & PERSONNALITÉ ──────────────────────────────────────────────
  {
    id: "etre-un-cordon-bleu",
    expression: "Être un cordon bleu",
    signification: "Être un excellent cuisinier.",
    origine: "L'Ordre du Saint-Esprit, au XVIe siècle, était distingué par un large ruban bleu. Ses membres festoyaient luxueusement. Le « cordon bleu » est devenu synonyme de gastronomie d'excellence.",
    exemple: "Sa grand-mère est un vrai cordon bleu — ses repas sont inoubliables.",
    registre: "standard",
    tags: ["cuisine", "talent", "gastronomie"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-etre-la-mer-a-boire",
    expression: "Ce n'est pas la mer à boire",
    signification: "Ce n'est pas si difficile ou si terrible que ça.",
    origine: "Allusion hyperbolique : boire toute la mer serait impossible. Si la tâche est « moins difficile que boire la mer », c'est donc faisable.",
    exemple: "Rédiger ce rapport en une journée ? Ce n'est pas la mer à boire.",
    registre: "standard",
    tags: ["facilité", "relativisation"],
    region: null,
    illustration: null
  },
  {
    id: "etre-a-la-hauteur",
    expression: "Être à la hauteur",
    signification: "Répondre aux attentes, avoir les compétences requises pour une situation.",
    origine: "Métaphore d'élévation : être au bon niveau (hauteur) pour atteindre ce qui est demandé. Attestée depuis le XIXe siècle.",
    exemple: "C'est une grosse responsabilité — espérons qu'il sera à la hauteur.",
    registre: "standard",
    tags: ["compétence", "performance", "travail"],
    region: null,
    illustration: null
  },
  {
    id: "faire-le-beau",
    expression: "Faire le beau",
    signification: "Se pavaner, chercher à se faire admirer.",
    origine: "Expression tirée du comportement du chien assis sur ses pattes arrières qui « fait le beau » pour son maître. Transposée ironiquement à l'être humain qui minaudie.",
    exemple: "Il fait le beau devant les caméras mais n'est jamais là quand on a besoin de lui.",
    registre: "informal",
    tags: ["vanité", "ostentation", "comportement"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-bon-coeur",
    expression: "Avoir bon cœur",
    signification: "Être généreux, bienveillant, empathique par nature.",
    origine: "Le cœur est depuis l'Antiquité le siège métaphorique des sentiments. Un « bon cœur » est une disposition naturelle à la bonté.",
    exemple: "Il a bon cœur — dès qu'il voit quelqu'un dans le besoin, il cherche à aider.",
    registre: "standard",
    tags: ["générosité", "bienveillance", "caractère"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-etre-commode",
    expression: "Ne pas être commode",
    signification: "Avoir un caractère difficile, être peu accommodant.",
    origine: "Le terme « commode » (du latin commodus : convenable, agréable) s'applique à quelqu'un avec qui la vie est facile. Son contraire décrit un caractère difficile.",
    exemple: "Son chef n'est pas commode — il faut marcher sur des œufs avec lui.",
    registre: "standard",
    tags: ["caractère", "relations", "difficulté"],
    region: null,
    illustration: null
  },

  // ─── NOURRITURE & BOISSON ─────────────────────────────────────────────────
  {
    id: "mettre-de-l-eau-dans-son-vin",
    expression: "Mettre de l'eau dans son vin",
    signification: "Modérer ses prétentions, faire des concessions, être moins intransigeant.",
    origine: "Autrefois, on coupait le vin d'eau pour le rendre moins fort. Adoucir sa position c'est donc y ajouter de l'eau — la diluer.",
    exemple: "Si tu veux qu'on trouve un accord, il va falloir mettre de l'eau dans ton vin.",
    registre: "standard",
    tags: ["concession", "compromis", "négociation"],
    region: null,
    illustration: null
  },
  {
    id: "casser-la-croute",
    expression: "Casser la croûte",
    signification: "Manger rapidement, prendre une collation.",
    origine: "La croûte du pain était la partie dure qui se cassait en mangeant. « Casser la croûte » évoque un repas simple et rapide, souvent debout.",
    exemple: "On va s'arrêter au bord de la route pour casser la croûte.",
    registre: "informal",
    tags: ["nourriture", "repas", "quotidien"],
    region: null,
    illustration: null
  },
  {
    id: "en-faire-tout-un-plat",
    expression: "En faire tout un plat",
    signification: "Faire toute une histoire pour quelque chose de peu important, dramatiser à l'excès.",
    origine: "Image d'un repas : transformer un petit incident en festin élaboré — faire d'une chose simple quelque chose de démesuré.",
    exemple: "Il a raté un bus et en fait tout un plat — tu aurais cru que c'était la fin du monde.",
    registre: "informal",
    tags: ["exagération", "dramatisation", "comportement"],
    region: null,
    illustration: null
  },
  {
    id: "manger-dans-la-main-de-quelqu-un",
    expression: "Manger dans la main de quelqu'un",
    signification: "Être totalement soumis à quelqu'un, être entièrement docile.",
    origine: "Image de l'animal domestiqué qui mange dans la main de son maître — signe de soumission complète et de confiance (ou de dépendance).",
    exemple: "Après quelques semaines, il mangeait dans la main du directeur.",
    registre: "standard",
    tags: ["soumission", "dépendance", "relations"],
    region: null,
    illustration: null
  },
  {
    id: "manger-a-tous-les-rateliers",
    expression: "Manger à tous les râteliers",
    signification: "Profiter de toutes les sources de revenus ou d'avantages, sans scrupule.",
    origine: "Le râtelier est la mangeoire des animaux dans une étable. Un animal qui mangerait à tous les râteliers serait infiniment opportuniste.",
    exemple: "Il a des clients dans des camps opposés — il mange à tous les râteliers.",
    registre: "standard",
    tags: ["opportunisme", "argent", "morale"],
    region: null,
    illustration: null
  },
  {
    id: "c-est-du-pain-beni",
    expression: "C'est du pain bénit",
    signification: "C'est une occasion rêvée, une aubaine qu'on ne pouvait espérer mieux.",
    origine: "Le pain bénit distribué à la messe était un don gratuit et précieux pour les plus pauvres. Par extension, toute bonne fortune inespérée.",
    exemple: "Pour nos concurrents, notre retard est du pain bénit.",
    registre: "standard",
    tags: ["aubaine", "chance", "opportunité"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-ventre-plein",
    expression: "Avoir le ventre plein",
    signification: "Être repu, ne plus avoir faim — ou par extension, être satisfait et sans ambition.",
    origine: "Expression directement liée à la satiété alimentaire. Employée au sens figuré pour quelqu'un qui n'a plus d'appétit pour quoi que ce soit.",
    exemple: "Depuis qu'il a eu sa promotion, il a le ventre plein — plus aucune ambition.",
    registre: "standard",
    tags: ["nourriture", "satisfaction", "ambition"],
    region: null,
    illustration: null
  },
  {
    id: "vouloir-le-beurre-et-l-argent-du-beurre",
    expression: "Vouloir le beurre et l'argent du beurre",
    signification: "Vouloir tout avoir sans rien sacrifier, être trop gourmand.",
    origine: "Proverbe paysan : après avoir vendu le beurre, on ne peut plus le manger. Vouloir garder les deux est une impossibilité logique que cette expression tourne en dérision.",
    exemple: "Il veut un salaire élevé avec peu d'heures — il veut le beurre et l'argent du beurre.",
    registre: "standard",
    tags: ["cupidité", "exigences", "proverbe"],
    region: null,
    illustration: null
  },
  {
    id: "se-sucrer-les-fraises",
    expression: "Se sucrer les fraises",
    signification: "Avoir les mains qui tremblent (signe de grand âge) — ou plus rarement, se servir généreusement.",
    origine: "Image du vieillard qui, en tentant de saupoudrer ses fraises de sucre, en met partout à cause du tremblement de ses mains.",
    exemple: "Le pauvre, il se sucre les fraises — il faudrait qu'il voie un médecin.",
    registre: "informal",
    tags: ["vieillesse", "santé", "corps"],
    region: null,
    illustration: null
  },

  // ─── ÉMOTIONS & ÉTATS ─────────────────────────────────────────────────────
  {
    id: "avoir-la-chair-de-poule",
    expression: "Avoir la chair de poule",
    signification: "Avoir la peau qui se hérisse sous l'effet du froid ou d'une forte émotion.",
    origine: "La peau hérissée ressemble à la peau d'une volaille plumée. Cette réaction physique naturelle (horripilation) est universelle.",
    exemple: "Ce violoniste est époustouflant — j'avais la chair de poule.",
    registre: "standard",
    tags: ["émotions", "frisson", "corps", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-avoir-les-yeux-en-face-des-trous",
    expression: "Ne pas avoir les yeux en face des trous",
    signification: "Être dans un état d'abrutissement tel qu'on ne voit pas ce qui est évident.",
    origine: "Expression humoristique suggérant que les yeux sont si mal alignés qu'ils ne regardent pas dans la bonne direction. Souvent utilisée pour qualifier quelqu'un qui manque de sommeil.",
    exemple: "Tu n'as pas dormi ? Tu n'as pas les yeux en face des trous ce matin.",
    registre: "informal",
    tags: ["fatigue", "torpeur", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "etre-sur-les-nerfs",
    expression: "Être sur les nerfs",
    signification: "Être très nerveux, tendu, irritable.",
    origine: "Le nerf est associé à la tension physique et psychique depuis l'Antiquité médicale. Être « sur » ses nerfs c'est n'être plus que tension.",
    exemple: "Avant l'entretien, il était sur les nerfs depuis le matin.",
    registre: "standard",
    tags: ["stress", "nervosité", "émotions"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-la-larme-a-l-oeil",
    expression: "Avoir la larme à l'œil",
    signification: "Être ému aux larmes, prêt à pleurer.",
    origine: "Image directe de l'émotion visible : la larme qui se forme dans l'œil avant de couler, signe de la sensibilité à fleur de peau.",
    exemple: "À la fin du film, la moitié de la salle avait la larme à l'œil.",
    registre: "standard",
    tags: ["émotions", "tristesse", "sensibilité", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-coeur-gros",
    expression: "Avoir le cœur gros",
    signification: "Être très triste, avoir de la peine.",
    origine: "Le cœur « gros » est celui qui pèse d'émotion, alourdi par le chagrin. Métaphore physique de la tristesse qui oppresse.",
    exemple: "Il avait le cœur gros quand il a quitté la ville où il avait grandi.",
    registre: "standard",
    tags: ["tristesse", "chagrin", "émotions", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "etre-aux-anges",
    expression: "Être aux anges",
    signification: "Être dans un état de bonheur intense, de félicité.",
    origine: "Les anges représentent dans la tradition chrétienne la béatitude céleste. Être « aux anges » c'est être dans cet état de joie pure et sereine.",
    exemple: "Quand elle a appris la nouvelle, elle était aux anges.",
    registre: "standard",
    tags: ["bonheur", "joie", "émotions"],
    region: null,
    illustration: null
  },
  {
    id: "peter-de-sante",
    expression: "Péter de santé",
    signification: "Être en excellente forme physique, déborder de vitalité.",
    origine: "Le verbe « péter » au sens vieilli de « claquer, éclater » — péter de santé c'est en avoir à revendre, en déborder.",
    exemple: "À 80 ans, il pète de santé — il court encore chaque matin.",
    registre: "informal",
    tags: ["santé", "vitalité", "forme physique"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-coeur-a-l-ouvrage",
    expression: "Avoir le cœur à l'ouvrage",
    signification: "Travailler avec enthousiasme et motivation.",
    origine: "« L'ouvrage » désigne le travail manuel ou intellectuel. Y mettre son cœur (siège des sentiments) c'est y mettre de la passion, pas seulement de l'application.",
    exemple: "Ce matin, je n'ai vraiment pas le cœur à l'ouvrage — impossible de me concentrer.",
    registre: "standard",
    tags: ["motivation", "travail", "émotions"],
    region: null,
    illustration: null
  },
  {
    id: "perdre-la-tete",
    expression: "Perdre la tête",
    signification: "Devenir fou, ou agir de façon irrationnelle sous l'effet d'une émotion forte.",
    origine: "La tête est le siège de la raison. La perdre c'est perdre le contrôle de sa pensée. Peut aussi évoquer la décapitation — perdre la vie.",
    exemple: "Il a perdu la tête quand il a appris la trahison de son associé.",
    registre: "standard",
    tags: ["folie", "émotions", "perte de contrôle", "corps"],
    region: null,
    illustration: null
  },

  // ─── TEMPS & RYTHME ────────────────────────────────────────────────────────
  {
    id: "en-deux-temps-trois-mouvements",
    expression: "En deux temps trois mouvements",
    signification: "Très rapidement, en un rien de temps.",
    origine: "Expression tirée de la danse ou de la musique militaire : les « temps » et « mouvements » sont des unités rythmiques très courtes. Faire quelque chose en ces temps minimaux, c'est aller très vite.",
    exemple: "Il a réparé le robinet en deux temps trois mouvements — un vrai pro.",
    registre: "standard",
    tags: ["rapidité", "efficacité", "temps"],
    region: null,
    illustration: null
  },
  {
    id: "brûler-les-etapes",
    expression: "Brûler les étapes",
    signification: "Aller trop vite, sauter des étapes nécessaires.",
    origine: "Référence aux relais de poste : « brûler » une étape c'était ne pas s'y arrêter pour se reposer, risquant d'épuiser les chevaux. Par extension, agir avec une précipitation dangereuse.",
    exemple: "Il a voulu brûler les étapes et lancer le produit sans tests — erreur.",
    registre: "standard",
    tags: ["précipitation", "imprudence", "temps"],
    region: null,
    illustration: null
  },
  {
    id: "perdre-son-temps",
    expression: "Perdre son temps",
    signification: "S'occuper à des choses inutiles, gaspiller un temps qui pourrait être mieux employé.",
    origine: "Expression simple et directe attestée depuis le Moyen Âge — le temps est perçu comme une ressource précieuse depuis longtemps.",
    exemple: "À discuter avec lui, on perd son temps — il ne veut rien entendre.",
    registre: "standard",
    tags: ["temps", "inefficacité", "frustration"],
    region: null,
    illustration: null
  },
  {
    id: "remettre-au-lendemain",
    expression: "Remettre au lendemain",
    signification: "Procrastiner, repousser sans cesse ce qu'on pourrait faire maintenant.",
    origine: "Expression directe liée au proverbe « Il ne faut pas remettre au lendemain ce qu'on peut faire le jour même ». Attestée depuis le XVIIe siècle.",
    exemple: "Il remet tout au lendemain — la déclaration fiscale attend depuis trois semaines.",
    registre: "standard",
    tags: ["procrastination", "temps", "organisation"],
    region: null,
    illustration: null
  },
  {
    id: "faire-le-pont",
    expression: "Faire le pont",
    signification: "Prendre un ou deux jours de congé entre un jour férié et un week-end pour créer une période continue.",
    origine: "Métaphore architecturale : on « construit un pont » entre le jour férié et le week-end pour que les jours de repos se rejoignent sans interruption.",
    exemple: "Le 14 juillet tombe un jeudi cette année — tout le monde fera le pont.",
    registre: "standard",
    tags: ["travail", "congés", "organisation", "temps"],
    region: null,
    illustration: null
  },
  {
    id: "c-est-une-autre-paire-de-manches",
    expression: "C'est une autre paire de manches",
    signification: "C'est un problème différent, beaucoup plus compliqué.",
    origine: "Autrefois, les manches des vêtements étaient souvent amovibles et constituaient un accessoire précieux. Une « paire de manches » représentait quelque chose d'un autre ordre.",
    exemple: "Réparer un vélo c'est facile, mais une voiture c'est une autre paire de manches.",
    registre: "standard",
    tags: ["difficulté", "comparaison", "nuance"],
    region: null,
    illustration: null
  },

  // ─── SOCIÉTÉ & RELATIONS ──────────────────────────────────────────────────
  {
    id: "faire-la-pluie-et-le-beau-temps",
    expression: "Faire la pluie et le beau temps",
    signification: "Avoir un pouvoir considérable, décider de tout dans un groupe.",
    origine: "Allusion au pouvoir divin sur les éléments naturels. Seul un être tout-puissant peut « faire » la pluie et le soleil. Attestée depuis le XVIIe siècle.",
    exemple: "Dans ce village, c'est le maire qui fait la pluie et le beau temps.",
    registre: "standard",
    tags: ["pouvoir", "influence", "autorité"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-etre-sorti-de-l-auberge",
    expression: "Ne pas être sorti de l'auberge",
    signification: "Être loin d'en avoir fini avec ses problèmes, avoir encore beaucoup à surmonter.",
    origine: "L'auberge représentait autrefois une étape sur un long voyage. Ne pas en être sorti c'est ne pas encore avoir repris la route — être encore au milieu des difficultés.",
    exemple: "Avec tous les bugs qu'il reste à corriger, on n'est pas sortis de l'auberge.",
    registre: "standard",
    tags: ["difficulté", "problème", "persévérance"],
    region: null,
    illustration: null
  },
  {
    id: "tenir-la-chandelle",
    expression: "Tenir la chandelle",
    signification: "Se retrouver à être le troisième dans un couple, être de trop.",
    origine: "Au Moyen Âge, les serviteurs éclairaient les rendez-vous galants avec une chandelle — ils assistaient à la scène sans y participer. Être celui qui tient la chandelle c'est être exclu de la relation.",
    exemple: "Toute la soirée, j'ai tenu la chandelle pendant que mes amis flirtaient.",
    registre: "standard",
    tags: ["relations", "amour", "solitude"],
    region: null,
    illustration: null
  },
  {
    id: "couper-les-ponts",
    expression: "Couper les ponts",
    signification: "Rompre définitivement toute relation avec quelqu'un.",
    origine: "Image militaire : couper les ponts derrière soi empêche l'ennemi d'avancer mais aussi toute retraite. Rompre définitivement une relation sans retour possible.",
    exemple: "Après leur rupture violente, elle a coupé les ponts avec toute sa famille.",
    registre: "standard",
    tags: ["relations", "rupture", "famille"],
    region: null,
    illustration: null
  },
  {
    id: "marcher-sur-des-oeufs",
    expression: "Marcher sur des œufs",
    signification: "Agir avec une extrême prudence dans une situation délicate.",
    origine: "Image concrète : marcher sur des œufs sans les casser demande une légèreté et une attention extrêmes. Métaphore de la précaution absolue.",
    exemple: "Avec ce client susceptible, il faut marcher sur des œufs.",
    registre: "standard",
    tags: ["prudence", "délicatesse", "relations"],
    region: null,
    illustration: null
  },
  {
    id: "jeter-un-froid",
    expression: "Jeter un froid",
    signification: "Créer un malaise soudain dans une conversation ou une réunion.",
    origine: "Image de la brusque baisse de température qui saisit une assemblée — un froid métaphorique qui coupe l'enthousiasme et installe le silence.",
    exemple: "Sa remarque sur les salaires a jeté un froid dans la réunion.",
    registre: "standard",
    tags: ["malaise", "silence", "relations", "communication"],
    region: null,
    illustration: null
  },
  {
    id: "faire-bonne-figure",
    expression: "Faire bonne figure",
    signification: "Se montrer sous son meilleur jour, afficher une contenance positive malgré les difficultés.",
    origine: "La « figure » désigne le visage, mais aussi le maintien et l'apparence. Faire bonne figure c'est présenter une belle façade quelles que soient les circonstances.",
    exemple: "Malgré sa déception, elle a fait bonne figure à la cérémonie.",
    registre: "standard",
    tags: ["façade", "dignité", "relations"],
    region: null,
    illustration: null
  },
  {
    id: "prendre-la-mouche",
    expression: "Prendre la mouche",
    signification: "Se vexer très facilement, s'offenser pour peu de chose.",
    origine: "Image d'un cheval qui s'agite et rue dès qu'une mouche le pique — réaction disproportionnée à une petite irritation.",
    exemple: "Il prend la mouche dès qu'on lui fait la moindre remarque.",
    registre: "standard",
    tags: ["susceptibilité", "caractère", "relations", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "passer-sous-silence",
    expression: "Passer sous silence",
    signification: "Ne pas mentionner quelque chose, l'omettre volontairement.",
    origine: "Le silence recouvre comme une couverture ce qu'on ne dit pas. Passer sous silence c'est le laisser dans l'obscurité de l'indicible.",
    exemple: "Dans son rapport, il a passé sous silence les problèmes financiers.",
    registre: "standard",
    tags: ["dissimulation", "communication", "omission"],
    region: null,
    illustration: null
  },

  // ─── ARGOT MODERNE ────────────────────────────────────────────────────────
  {
    id: "c-est-chelou",
    expression: "C'est chelou",
    signification: "C'est bizarre, louche, suspect.",
    origine: "Verlan de « louche » (chelou = louche à l'envers). L'argot verlan inverse les syllabes des mots pour créer un code langagier propre aux jeunes banlieues des années 80.",
    exemple: "Ce type qui nous suit depuis tout à l'heure, c'est chelou.",
    registre: "slang",
    tags: ["verlan", "suspicion", "méfiance", "jeunes"],
    region: null,
    illustration: null
  },
  {
    id: "c-est-ouf",
    expression: "C'est ouf",
    signification: "C'est fou, c'est incroyable (en bien ou en mal).",
    origine: "Verlan de « fou ». Utilisé positivement (impressionnant) ou négativement (incroyable).",
    exemple: "Ce concert était ouf — une ambiance de dingue.",
    registre: "slang",
    tags: ["verlan", "intensité", "enthousiasme", "jeunes"],
    region: null,
    illustration: null
  },
  {
    id: "c-est-relou",
    expression: "C'est relou",
    signification: "C'est lourd, pénible, ennuyeux.",
    origine: "Verlan de « lourd ». Désigne ce qui est pesant, sans intérêt ou qui agace.",
    exemple: "Refaire tout le rapport à cause d'une erreur de chiffre, c'est vraiment relou.",
    registre: "slang",
    tags: ["verlan", "ennui", "frustration", "jeunes"],
    region: null,
    illustration: null
  },
  {
    id: "pecho-quelqu-un",
    expression: "Pécho quelqu'un",
    signification: "Séduire quelqu'un, l'embrasser ou coucher avec lui.",
    origine: "Verlan de « choper » (attraper). Pécho a pris le sens de conquête amoureuse ou physique dans l'argot des banlieues.",
    exemple: "Il a pécho une fille à la soirée d'hier.",
    registre: "slang",
    tags: ["verlan", "séduction", "amour", "jeunes"],
    region: null,
    illustration: null
  },
  {
    id: "c-est-la-teuf",
    expression: "C'est la teuf",
    signification: "C'est la fête.",
    origine: "Verlan de « fête ». Terme typique du vocabulaire des jeunes depuis les années 90.",
    exemple: "Ce week-end c'est la teuf chez moi — vous êtes tous invités.",
    registre: "slang",
    tags: ["verlan", "fête", "jeunes"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-la-flemme",
    expression: "Avoir la flemme",
    signification: "Avoir la paresse, ne pas avoir envie de faire un effort.",
    origine: "Du grec « phlegme » (humeur froide et lente selon la médecine ancienne). La flemme désigne cet état de mollesse et d'indolence.",
    exemple: "J'aurais dû aller courir mais j'avais la flemme — j'ai regardé une série.",
    registre: "informal",
    tags: ["paresse", "motivation", "quotidien"],
    region: null,
    illustration: null
  },
  {
    id: "se-faire-la-belle",
    expression: "Se faire la belle",
    signification: "S'évader, fuir, s'échapper.",
    origine: "Argot des prisons et des mauvais garçons au XIXe siècle. « La belle » désignait la liberté ou une échappée réussie.",
    exemple: "Les deux prisonniers ont réussi à se faire la belle pendant le transfert.",
    registre: "slang",
    tags: ["fuite", "évasion", "liberté"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-cafard-de-quelqu-un",
    expression: "Balancer quelqu'un",
    signification: "Dénoncer quelqu'un, le trahir en le signalant aux autorités.",
    origine: "Le verbe balancer dans ce sens est attesté dans l'argot du XIXe siècle. Il rejoint l'image de « balancer » une information comme on jette quelque chose.",
    exemple: "C'est son propre frère qui l'a balancé à la police.",
    registre: "slang",
    tags: ["trahison", "dénonciation", "conflit"],
    region: null,
    illustration: null
  },
  {
    id: "en-avoir-sa-claque",
    expression: "En avoir sa claque",
    signification: "En avoir assez, être excédé.",
    origine: "La claque est une gifle. « En avoir sa claque » c'est avoir reçu suffisamment de coups (métaphoriques) pour être à bout.",
    exemple: "J'en ai ma claque de ces réunions qui n'aboutissent à rien.",
    registre: "informal",
    tags: ["exaspération", "épuisement", "ras-le-bol"],
    region: null,
    illustration: null
  },
  {
    id: "bouffer-a-l-oeil",
    expression: "Manger à l'œil",
    signification: "Manger gratuitement, sans payer.",
    origine: "L'expression « à l'œil » au sens de « gratuitement » vient de l'argot du XIXe siècle. L'œil représentait le zéro, donc le fait de ne rien payer.",
    exemple: "Il a des amis partout — il mange souvent à l'œil dans les restaurants.",
    registre: "informal",
    tags: ["argent", "gratuité", "opportunisme"],
    region: null,
    illustration: null
  },

  // ─── PROVERBES & SAGESSE ──────────────────────────────────────────────────
  {
    id: "la-nuit-tous-les-chats-sont-gris",
    expression: "La nuit, tous les chats sont gris",
    signification: "Dans l'obscurité, les différences s'effacent ; on ne peut plus distinguer les qualités.",
    origine: "Proverbe attesté depuis le XVIe siècle, fondé sur l'observation que l'obscurité neutralise les couleurs et les nuances.",
    exemple: "Il prétend que ce produit est premium, mais dans notre usage la nuit tous les chats sont gris.",
    registre: "standard",
    tags: ["proverbe", "égalité", "perception", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "qui-trop-embrasse-mal-etreint",
    expression: "Qui trop embrasse mal étreint",
    signification: "Vouloir faire trop de choses à la fois mène à n'en réussir aucune.",
    origine: "Proverbe médiéval : embrasser au sens ancien signifie enserrer, saisir dans ses bras. Qui veut saisir trop large finit par ne rien tenir.",
    exemple: "Trois projets en même temps ? Qui trop embrasse mal étreint.",
    registre: "standard",
    tags: ["proverbe", "dispersion", "sagesse"],
    region: null,
    illustration: null
  },
  {
    id: "les-murs-ont-des-oreilles",
    expression: "Les murs ont des oreilles",
    signification: "Il faut faire attention à ce qu'on dit car on peut être écouté sans le savoir.",
    origine: "Expression attestée depuis le XVIe siècle. Elle rappelle que les espaces n'offrent jamais de confidentialité totale.",
    exemple: "Parle moins fort dans le couloir — les murs ont des oreilles.",
    registre: "standard",
    tags: ["discrétion", "secret", "prudence", "proverbe"],
    region: null,
    illustration: null
  },
  {
    id: "on-ne-fait-pas-d-omelette-sans-casser-des-oeufs",
    expression: "On ne fait pas d'omelette sans casser des œufs",
    signification: "Toute réussite implique des sacrifices et des actions qui peuvent paraître dures.",
    origine: "Proverbe culinaire français connu depuis le XVIIIe siècle. Attribué parfois à Robespierre ou Napoléon mais d'origine populaire.",
    exemple: "Il a fallu réduire les effectifs — on ne fait pas d'omelette sans casser des œufs.",
    registre: "standard",
    tags: ["proverbe", "sacrifice", "pragmatisme", "nourriture"],
    region: null,
    illustration: null
  },
  {
    id: "mieux-vaut-tard-que-jamais",
    expression: "Mieux vaut tard que jamais",
    signification: "Il vaut mieux faire quelque chose en retard que de ne pas le faire du tout.",
    origine: "Traduction du latin « Melius est sero quam numquam » (Tite-Live). Proverbe universel attesté dans de nombreuses langues.",
    exemple: "Tu m'offres des excuses avec deux ans de retard, mais mieux vaut tard que jamais.",
    registre: "standard",
    tags: ["proverbe", "temps", "optimisme"],
    region: null,
    illustration: null
  },
  {
    id: "l-habit-ne-fait-pas-le-moine",
    expression: "L'habit ne fait pas le moine",
    signification: "Les apparences sont trompeuses, on ne peut pas juger quelqu'un sur son apparence.",
    origine: "Proverbe médiéval : un homme en habit de moine n'est pas forcément pieux. Attesté en français depuis le XIVe siècle.",
    exemple: "Ce candidat en costume bon marché était le plus qualifié — l'habit ne fait pas le moine.",
    registre: "standard",
    tags: ["proverbe", "apparence", "jugement"],
    region: null,
    illustration: null
  },
  {
    id: "pierre-qui-roule-n-amasse-pas-mousse",
    expression: "Pierre qui roule n'amasse pas mousse",
    signification: "Quelqu'un qui change souvent de situation ne construit rien de durable.",
    origine: "Proverbe attesté depuis le XVIe siècle. La mousse (végétal) a besoin de temps et de stabilité pour se former sur une pierre immobile.",
    exemple: "Il change de ville chaque année — pierre qui roule n'amasse pas mousse.",
    registre: "standard",
    tags: ["proverbe", "stabilité", "carrière"],
    region: null,
    illustration: null
  },
  {
    id: "les-absents-ont-toujours-tort",
    expression: "Les absents ont toujours tort",
    signification: "Ceux qui ne sont pas là ne peuvent pas se défendre et finissent par être blâmés.",
    origine: "Proverbe populaire qui reflète la réalité sociale : les présents ont l'avantage de pouvoir s'expliquer et influencer le cours des choses.",
    exemple: "Il n'était pas à la réunion — les absents ont toujours tort, on lui a mis tout sur le dos.",
    registre: "standard",
    tags: ["proverbe", "justice", "relations"],
    region: null,
    illustration: null
  },
  {
    id: "il-ne-faut-pas-vendre-la-peau-de-l-ours",
    expression: "Ne vendons pas la peau de l'ours avant de l'avoir tué",
    signification: "Ne comptons pas sur quelque chose qui n'est pas encore acquis.",
    origine: "Fable de La Fontaine « L'Ours et les deux Compagnons » (1678). Deux chasseurs vendent la peau de l'ours avant de l'avoir tué — l'ours leur échappe.",
    exemple: "On célèbre la victoire avant le match ? Ne vendons pas la peau de l'ours.",
    registre: "standard",
    tags: ["proverbe", "prudence", "optimisme prématuré", "animaux"],
    region: null,
    illustration: null
  },
  {
    id: "un-tien-vaut-mieux-que-deux-tu-l-auras",
    expression: "Un tiens vaut mieux que deux tu l'auras",
    signification: "Ce qu'on possède déjà vaut mieux que ce qu'on espère obtenir.",
    origine: "Proverbe de La Fontaine (Le Petit Poisson et le Pêcheur, 1668). Sagesse pragmatique : la certitude vaut plus que la promesse.",
    exemple: "Accepte cette offre plutôt que d'attendre mieux — un tiens vaut mieux que deux tu l'auras.",
    registre: "standard",
    tags: ["proverbe", "prudence", "certitude"],
    region: null,
    illustration: null
  },

  // ─── EXPRESSIONS IMAGÉES & PITTORESQUES ───────────────────────────────────
  {
    id: "avoir-du-mal-a-joindre-les-deux-bouts",
    expression: "Avoir du mal à joindre les deux bouts",
    signification: "Avoir du mal à équilibrer ses revenus et ses dépenses, vivre avec peu.",
    origine: "Métaphore couturière ou comptable : « joindre les deux bouts » d'un tissu ou d'un budget, c'est faire se rejoindre le début et la fin du mois.",
    exemple: "Avec un seul salaire pour cinq, ils avaient du mal à joindre les deux bouts.",
    registre: "standard",
    tags: ["argent", "pauvreté", "difficultés financières"],
    region: null,
    illustration: null
  },
  {
    id: "donner-un-coup-de-pouce",
    expression: "Donner un coup de pouce",
    signification: "Aider légèrement quelqu'un, lui donner un petit avantage.",
    origine: "Le pouce est le doigt le plus fort de la main. Un « coup de pouce » est une petite poussée, une aide discrète mais efficace.",
    exemple: "Il a eu un coup de pouce de son père pour décrocher ce stage.",
    registre: "standard",
    tags: ["aide", "soutien", "relations"],
    region: null,
    illustration: null
  },
  {
    id: "sauter-le-pas",
    expression: "Sauter le pas",
    signification: "Se décider à franchir un cap difficile, prendre une décision importante.",
    origine: "Image du fossé ou du ruisseau qu'on hésite à traverser. Sauter le pas c'est prendre son élan et passer de l'autre côté malgré l'hésitation.",
    exemple: "Ça fait un an qu'il envisage de quitter son emploi — il hésite à sauter le pas.",
    registre: "standard",
    tags: ["décision", "courage", "changement"],
    region: null,
    illustration: null
  },
  {
    id: "mettre-les-bouchees-doubles",
    expression: "Mettre les bouchées doubles",
    signification: "Travailler deux fois plus vite, redoubler d'efforts pour rattraper un retard.",
    origine: "Manger de grosses bouchées permet de terminer un repas deux fois plus vite. Transposé au travail : avancer à toute vitesse pour compenser.",
    exemple: "On a pris du retard la semaine dernière — il faut mettre les bouchées doubles.",
    registre: "standard",
    tags: ["travail", "effort", "rattrapage"],
    region: null,
    illustration: null
  },
  {
    id: "aller-de-soi",
    expression: "Aller de soi",
    signification: "Être évident, ne pas avoir besoin d'explication.",
    origine: "Expression elliptique : quelque chose qui « va de soi » se comprend sans qu'on le dise — c'est une vérité ou une logique naturelle.",
    exemple: "Il va de soi que vous serez remboursés si le produit est défectueux.",
    registre: "standard",
    tags: ["évidence", "logique"],
    region: null,
    illustration: null
  },
  {
    id: "jeter-l-eponge",
    expression: "Jeter l'éponge",
    signification: "Abandonner, reconnaître sa défaite.",
    origine: "Terme boxe : quand un entraîneur jette l'éponge (utilisée pour soigner le boxeur) sur le ring, il signifie l'arrêt du combat — l'abandon.",
    exemple: "Après trois refus de sa candidature, il a jeté l'éponge.",
    registre: "standard",
    tags: ["abandon", "défaite", "sport"],
    region: null,
    illustration: null
  },
  {
    id: "faire-les-frais-de",
    expression: "Faire les frais de quelque chose",
    signification: "Être la victime d'une situation, en payer le prix.",
    origine: "Au sens propre, « faire les frais » c'est payer les dépenses. Par extension, celui qui fait les frais d'une situation en supporte les conséquences négatives.",
    exemple: "Les salariés ont fait les frais des mauvaises décisions de la direction.",
    registre: "standard",
    tags: ["injustice", "conséquences", "victime"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-la-partie-belle",
    expression: "Avoir la partie belle",
    signification: "Être dans une position avantageuse, avoir le beau rôle.",
    origine: "Terme de jeu : avoir « la belle » (la bonne main, le bon jeu) signifiait être en position de force. Par extension, bénéficier d'un avantage.",
    exemple: "Vous avez la partie belle à critiquer le travail sans avoir à le faire.",
    registre: "standard",
    tags: ["avantage", "position", "critique"],
    region: null,
    illustration: null
  },
  {
    id: "ne-pas-y-aller-de-main-morte",
    expression: "Ne pas y aller de main morte",
    signification: "Y aller fort, sans retenue ni ménagement.",
    origine: "La « main morte » est une main inerte, sans force. Ne pas y aller de main morte c'est donc utiliser toute sa force, ne pas se retenir.",
    exemple: "Le critique n'y est pas allé de main morte — il a démoli tout le livre.",
    registre: "standard",
    tags: ["intensité", "brutalité", "franchise"],
    region: null,
    illustration: null
  },
  {
    id: "faire-feu-de-tout-bois",
    expression: "Faire feu de tout bois",
    signification: "Utiliser tous les moyens disponibles pour arriver à ses fins.",
    origine: "Pour allumer un feu, on brûle tout ce qu'on trouve — même le bois vert ou de mauvaise qualité. Métaphore de l'adaptation et du pragmatisme.",
    exemple: "En période de crise, l'entreprise a fait feu de tout bois pour survivre.",
    registre: "standard",
    tags: ["débrouillardise", "pragmatisme", "ressources"],
    region: null,
    illustration: null
  },
  {
    id: "etre-en-bonne-voie",
    expression: "Être en bonne voie",
    signification: "Progresser dans la bonne direction, s'approcher d'un objectif.",
    origine: "Image du voyageur sur le bon chemin — la voie mène à destination. Attestée depuis le XVIIe siècle.",
    exemple: "Les négociations avancent — on est en bonne voie pour signer avant la fin du mois.",
    registre: "standard",
    tags: ["progrès", "optimisme", "objectif"],
    region: null,
    illustration: null
  },
  {
    id: "jouer-sur-les-deux-tableaux",
    expression: "Jouer sur les deux tableaux",
    signification: "Ménager les deux parties d'un conflit pour tirer avantage des deux.",
    origine: "Métaphore du joueur qui mise sur les deux cases d'un jeu — stratégie de double assurance mais aussi de duplicité.",
    exemple: "Il entretient de bonnes relations avec les deux factions — il joue sur les deux tableaux.",
    registre: "standard",
    tags: ["opportunisme", "stratégie", "diplomatie"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-un-faible-pour",
    expression: "Avoir un faible pour quelqu'un",
    signification: "Avoir une préférence ou une tendresse particulière pour quelqu'un.",
    origine: "Le « faible » désigne une vulnérabilité affective — on a un point faible pour quelqu'un ou quelque chose qui nous touche plus que de raison.",
    exemple: "Le professeur avait un faible pour cet élève curieux et travailleur.",
    registre: "standard",
    tags: ["affection", "préférence", "relations"],
    region: null,
    illustration: null
  },
  {
    id: "prendre-le-taureau-par-les-cornes",
    expression: "Prendre le problème à bras-le-corps",
    signification: "Affronter directement et courageusement une difficulté.",
    origine: "Image du torero ou du paysan qui saisit le taureau par ses cornes — affrontement direct avec le danger le plus évident.",
    exemple: "Plutôt que de fuir la conversation difficile, il a pris le problème à bras-le-corps.",
    registre: "standard",
    tags: ["courage", "action", "détermination"],
    region: null,
    illustration: null
  },
  {
    id: "entre-les-deux-mon-coeur-balance",
    expression: "Entre les deux mon cœur balance",
    signification: "Hésiter entre deux options également attrayantes.",
    origine: "Citation tirée d'une fable de La Fontaine — « Maître Corbeau et Maître Renard ». Devenu une expression populaire pour l'indécision.",
    exemple: "La montagne ou la mer cet été ? Entre les deux mon cœur balance.",
    registre: "standard",
    tags: ["hésitation", "indécision", "choix"],
    region: null,
    illustration: null
  },
  {
    id: "s-en-mordre-les-pouces",
    expression: "S'en mordre les pouces",
    signification: "Regretter une décision trop tard.",
    origine: "Geste de frustration intense : se mordre les pouces de rage ou de dépit après avoir commis une erreur. Variante plus intense de « se mordre les doigts ».",
    exemple: "Il a refusé l'offre en pensant qu'une meilleure viendrait — il s'en est mordu les pouces.",
    registre: "standard",
    tags: ["regret", "erreur", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-un-grain",
    expression: "Avoir un grain",
    signification: "Être un peu fou, avoir un comportement légèrement excentrique.",
    origine: "Allusion au grain de sable ou à la petite anomalie qui perturbe un mécanisme. Avoir « un grain » c'est avoir quelque chose qui dérègle la raison.",
    exemple: "Il est attachant mais tout le monde s'accorde à dire qu'il a un grain.",
    registre: "informal",
    tags: ["folie légère", "excentricité", "caractère"],
    region: null,
    illustration: null
  },
  {
    id: "ca-ne-casse-pas-des-briques",
    expression: "Ça ne casse pas des briques",
    signification: "Ce n'est pas extraordinaire, c'est médiocre.",
    origine: "La brique est un matériau résistant. Quelque chose qui ne « casse pas des briques » n'a pas la force d'impressionner.",
    exemple: "Le film était correct mais ça ne cassait pas des briques.",
    registre: "informal",
    tags: ["médiocrité", "déception", "appréciation"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-les-foies",
    expression: "Avoir les foies",
    signification: "Avoir très peur, être lâche.",
    origine: "Dans la médecine ancienne, le foie (siège de la bile) était associé à la peur et au courage. « Avoir les foies » c'est sentir son courage flancher.",
    exemple: "Au moment de sauter en parachute, j'avais les foies.",
    registre: "informal",
    tags: ["peur", "lâcheté", "corps"],
    region: null,
    illustration: null
  },
  {
    id: "etre-dans-le-collimateur",
    expression: "Être dans le collimateur de quelqu'un",
    signification: "Être surveillé ou visé par quelqu'un qui cherche à vous prendre en faute.",
    origine: "Le collimateur est le dispositif de visée d'une arme à feu. Être dans le collimateur c'est être dans la ligne de mire de quelqu'un.",
    exemple: "Depuis son retard répété, il est dans le collimateur de son responsable.",
    registre: "standard",
    tags: ["surveillance", "pression", "travail"],
    region: null,
    illustration: null
  },
  {
    id: "la-balle-est-dans-son-camp",
    expression: "La balle est dans son camp",
    signification: "C'est à lui de décider ou d'agir, c'est son tour de se manifester.",
    origine: "Expression sportive (tennis, football) : la balle dans le camp adverse signifie que c'est à l'autre équipe de jouer. Transposée aux négociations et aux relations.",
    exemple: "Je lui ai fait ma proposition — maintenant la balle est dans son camp.",
    registre: "standard",
    tags: ["responsabilité", "décision", "sport", "négociation"],
    region: null,
    illustration: null
  },
  {
    id: "prendre-le-large",
    expression: "Prendre le large",
    signification: "Fuir, partir précipitamment pour éviter une situation.",
    origine: "Expression maritime : s'éloigner du port vers le large, loin du danger ou des contraintes côtières. Prendre la fuite en mer ouverte.",
    exemple: "Quand les ennuis ont commencé, il a pris le large.",
    registre: "standard",
    tags: ["fuite", "liberté", "mer"],
    region: null,
    illustration: null
  },
  {
    id: "avoir-le-vent-en-poupe",
    expression: "Avoir le vent en poupe",
    signification: "Connaître le succès, progresser favorablement.",
    origine: "Expression maritime : le vent en poupe (à l'arrière du bateau) propulse le navire sans effort. Aller avec le vent c'est progresser naturellement.",
    exemple: "Depuis sa dernière sortie médiatique, ce jeune acteur a le vent en poupe.",
    registre: "standard",
    tags: ["succès", "progression", "mer"],
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
