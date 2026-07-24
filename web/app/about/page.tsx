"use client";

import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import { useUILangContext } from "@/lib/UILangContext";
import type { UILang } from "@/lib/useUILang";

type TypeCard = { label: string; title: string; body: string; example: string };
type Pass = { title: string; body: string };
type DiffCard = { title: string; body: string };

type VisionItem = { emoji: string; title: string; body: string };

type Content = {
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: [string, string];
  sectionPWA: string;
  pwaIntro: string;
  pwaAndroid: DiffCard;
  pwaIos: DiffCard;
  sectionTypes: string;
  typesIntro: string;
  types: [TypeCard, TypeCard, TypeCard, TypeCard];
  sectionSearch: string;
  searchIntro: string;
  searchPull: string;
  passes: [Pass, Pass, Pass, Pass];
  searchOutro: string;
  sectionConcepts: string;
  conceptsIntro: string;
  domainCard: DiffCard;
  conceptCard: DiffCard;
  conceptExplain: [string, string, string];
  conceptPull: string;
  sectionSameIdea: string;
  sameIdea: [string, string];
  sectionData: string;
  data: [string, string];
  sectionOpenSource: string;
  openSource: string;
  githubLink: string;
  sectionVision: string;
  visionIntro: string;
  visionItems: [VisionItem, VisionItem, VisionItem, VisionItem, VisionItem];
  sectionContact: string;
  contact: string;
  footer: string;
};

const CONTENT: Record<string, Content> = {
  en: {
    eyebrow: "About this project",
    title: "A love letter\nto idioms.",
    subtitle: "Every language has expressions that refuse to translate. They carry too much — history, humour, the texture of daily life. This is where World Expressions starts.",
    intro: [
      "World Expressions is a free, open-source way to play with idioms from around the world. Pick a game: draw ten cards on Voyage and keep the ones that surprise you, or flip through your own collection in Révision and see what still sticks. Looking for something specific instead? Type a word, a feeling, or an idea into search, and discover how other languages name the same thing. Either way, the results are never just translations — they are windows into how different cultures think, argue, love, and joke.",
      "The database currently holds over 14,000 expressions across 7 languages — French, Turkish, Italian, English, Spanish, German, and Japanese — plus several regional Spanish variants (Mexico, Argentina, Colombia, Peru). Every entry includes a meaning; most also carry an origin story, a usage example, and cross-language equivalents wherever they exist. The project is open source, continuously expanding, and entirely free.",
    ],
    sectionPWA: "An app without an App Store",
    pwaIntro: "World Expressions can be installed on your phone or computer like an app — without going through the App Store or Play Store. This is called a PWA (Progressive Web App): the website becomes an icon on your home screen, works offline for expressions you've already viewed, and updates automatically, with nothing to download or approve. For a free, open-source side project, it's the simplest choice: no developer fees, no App Store review, one codebase for every platform.",
    pwaAndroid: {
      title: "Android, Chrome, Brave, desktop",
      body: "Installation works directly: a banner or an \"Add to Home Screen\" option appears in the browser menu.",
    },
    pwaIos: {
      title: "iPhone",
      body: "Only Safari can install it — not Chrome or Brave on iOS, since Apple restricts every iOS browser to the same engine as Safari. Open the site in Safari, tap Share, then \"Add to Home Screen\".",
    },
    sectionTypes: "What kind of expressions?",
    typesIntro: "Not every fixed phrase is the same thing. World Expressions distinguishes four main types — each with its own character and its own relationship to literal meaning.",
    types: [
      {
        label: "Proverbe · Proverb",
        title: "A complete sentence with a moral or wisdom.",
        body: "Proverbs are short, self-contained sayings — usually metaphorical — that encode collective wisdom. They function as arguments: you cite a proverb to justify or warn. They are often old, often anonymous, and very literal in imagery while very abstract in meaning.",
        example: '"Qui sème le vent récolte la tempête." — He who sows the wind shall reap the whirlwind.',
      },
      {
        label: "Expression idiomatique · Idiom",
        title: "A fixed phrase whose meaning can't be decoded word by word.",
        body: "Idioms are the beating heart of informal language. The words taken literally make no sense — or a completely different sense. They are learned as units, not assembled from parts. New speakers of a language struggle most with idioms, because no amount of vocabulary knowledge helps decode them.",
        example: '"Avoir le cafard." — To have the cockroach. Meaning: to feel sad, to be depressed.',
      },
      {
        label: "Locution",
        title: "A fixed multi-word unit that functions as a single grammatical element.",
        body: "Locutions are more grammatical animals — they behave like a single adverb, preposition, or adjective. Unlike idioms, their meaning is often guessable, but they must be used as a block. You can't rearrange the words or substitute synonyms. They give language its idiomatic rhythm.",
        example: '"En catimini." — Furtively, on the quiet, without drawing attention.',
      },
      {
        label: "Argot · Slang",
        title: "Informal register, often from specific social groups.",
        body: "Slang is language's living edge. It mutates, dates quickly, and marks belonging. A word of argot signals \"I'm part of this group, I talk like you\". Some slang goes mainstream and loses its edge; other terms stay underground forever. In French, a whole branch of argot — verlan — works by reversing syllables: \"femme\" becomes \"meuf\", \"l'envers\" becomes \"verlan\".",
        example: '"Kiffer." — To really like something. From Arabic "kif" (pleasure), via French urban slang.',
      },
    ],
    sectionSearch: "How search works",
    searchIntro: "When you type a word into the search bar, the system doesn't just look for that exact string in a database. It runs four successive passes — each broader than the previous one — and assembles the results in order of relevance.",
    searchPull: "Take an Italian user who types \"amore\". Here is exactly what happens, step by step.",
    passes: [
      {
        title: "Exact match.",
        body: "The system looks for \"amore\" appearing literally in the text of any expression across all languages. Italian expressions containing the word come up first. This pass is fast and precise — it catches the obvious results.",
      },
      {
        title: "Semantic match.",
        body: "The system searches the meaning, origin, and usage example of every expression — still looking for \"amore\". An Italian proverb whose meaning mentions love without using the word in its title will appear here. Tags are also searched at this step.",
      },
      {
        title: "Cross-language translation pass.",
        body: "The system looks for \"amore\" inside the translated versions of all expressions — including French, Spanish, and Turkish ones. A French expression like \"avoir le cœur sur la main\" (to be generous) might have an Italian translation that mentions \"amore\", and it would surface here. This is how the app bridges languages.",
      },
      {
        title: "Concept bridge.",
        body: "The system tries to match \"amore\" to known concept tags — thematic labels like love, romance, or heartbreak. If a match is found, every expression carrying that concept tag — in any language — appears under a distinct \"By concept\" section. This is the widest net: a Turkish expression about heartbreak can surface from an Italian query about love.",
      },
    ],
    searchOutro: "Results from each pass are visually separated in the results page, so you always know why an expression appeared. The four sections are labeled: In the text · By meaning · Via translations · By concept.",
    sectionConcepts: "Concepts and domains: two ways to wander",
    conceptsIntro: "Beyond search, the app offers two other ways to explore the database — and they work quite differently. Understanding the difference makes navigation much more intuitive.",
    domainCard: {
      title: "Domain",
      body: "A broad editorial category grouping many concepts. Examples: Work & ambition, Money, Human relations, Humor & irony. There are 16 domains total.",
    },
    conceptCard: {
      title: "Concept",
      body: "A specific thematic tag shared by expressions that express the same idea — regardless of language. Examples: money, friendship, death, laziness. There are 900+ concepts in the database.",
    },
    conceptExplain: [
      "When you click an emoji in the search overlay — the grid that appears when you open the search — each emoji represents a domain. Clicking it brings you to a results page filtered by that domain: all expressions belonging to any concept within it, across all languages.",
      "When you click a concept pill — the small labels that appear on expression cards or inside domain result pages — you go to a narrower view. Only expressions tagged with that specific concept appear. Searching \"friendship\" as a concept might return 40 expressions across 5 languages. Searching the Human relations domain would return hundreds, spanning friendship but also loyalty, betrayal, family, love, loneliness.",
      "Both paths lead to the same unified results page, with the same layout, the same filters, the same ability to narrow by language or country. The URL always reflects what you're browsing — /search?domain=humor or /search?concept=sarcasm — so every view is shareable.",
    ],
    conceptPull: "Domain is the neighbourhood. Concept is the street.",
    sectionSameIdea: "The \"Same idea\" section",
    sameIdea: [
      "On every expression page, below the main content, you'll find a section titled Same idea in other languages. This is the cross-lingual heart of the app.",
      "It works through concept links: every expression is connected to a thematic tag, and expressions sharing that tag are surfaced here. A French expression about luck will show its Turkish, Spanish, and Italian cousins — expressions that carry the same cultural weight, even if the images and metaphors are completely different. Each equivalent is shown with a confidence badge: Mirror (exact same meaning), Equivalent (very close), or In the same vein (related idea).",
    ],
    sectionData: "The data",
    data: [
      "The database was built from public linguistic sources and curated manually. Meanings, origins, and usage examples were written or verified entry by entry — with AI assistance for the bulk of the work, and human review for quality. Cross-language equivalents were generated by a language model (Mistral) and are scored for confidence.",
      "The database is not exhaustive — no database of expressions ever is. Languages grow, slang shifts, and what counts as a \"real\" expression is always debatable. The goal is depth over breadth: fewer expressions with richer content, rather than a raw list of thousands.",
    ],
    sectionOpenSource: "Open source",
    openSource: "The entire codebase — FastAPI backend, Next.js frontend, database scripts, enrichment pipelines — is open source on GitHub. Contributions are welcome: new expressions, corrections, translations, design improvements, or ideas.",
    githubLink: "github.com/sinsan67/world-expressions →",
    sectionVision: "What's next",
    visionIntro: "World Expressions is a living project. Here is where it is going.",
    visionItems: [
      {
        emoji: "🖼️",
        title: "Navigate by image",
        body: "Instead of typing, click an emoji to explore. Atoms (🐱 = a specific concept) and molecules (🐱🐶🐦 = a whole domain) form two levels of visual navigation — no text required. Click a domain emoji and you get all expressions that contain at least one concept from it, across every language. Click a concept emoji and you narrow to expressions sharing exactly that idea. The ambiguity of the image is the point: one emoji, dozens of expressions, seven languages.",
      },
      {
        emoji: "🌐",
        title: "Monologue and bilingual modes",
        body: "Choose how you read expressions: immersed in the original language only (monologue — ideal for language learners who want to be challenged) or always with a translation in your own language displayed alongside (bilingual — for those who want to understand everything at a glance). A single personal setting, applied consistently across the entire app.",
      },
      {
        emoji: "🎨",
        title: "Visual universes",
        body: "Three distinct atmospheres for three different registers: Everyday language (warm, familiar), Street & Slang (urban, bold), Proverbs (classical, timeless). Each universe will have its own visual identity — palette, typography, card style. The same expression might carry a different weight depending on which universe you are browsing.",
      },
      {
        emoji: "🗺️",
        title: "An interactive world map",
        body: "The Atlas page already exists. The long-term vision: click any country on a world SVG map and dive into its expressions. Regional data is already in the database for parts of France (Alsace, Bretagne). The map will grow as the data grows — eventually linking every expression to the place where it was born.",
      },
      {
        emoji: "🎮",
        title: "A third game",
        body: "Voyage and Révision are the first two. Next: explore expressions on a world map… or navigate emoji constellations, where the ambiguity of the image is the game itself. Built on the same concept system that already powers search — no separate database needed.",
      },
    ],
    sectionContact: "Get in touch",
    contact: "Questions, a correction to report, a favourite expression to suggest — all welcome. You can reach out by email or find the project on Instagram.",
    footer: "Made with curiosity. Built in public.",
  },

  fr: {
    eyebrow: "À propos du projet",
    title: "Une lettre d'amour\naux expressions du monde.",
    subtitle: "Chaque langue possède des expressions qui résistent à la traduction. Elles portent trop de choses — de l'histoire, de l'humour, la texture du quotidien. C'est là que World Expressions commence.",
    intro: [
      "World Expressions est une façon libre et open source de jouer avec les expressions idiomatiques du monde entier. Choisissez un jeu : tirez dix cartes en Voyage et gardez celles qui vous surprennent, ou parcourez votre collection en Révision pour voir ce qui reste gravé. Vous cherchez quelque chose de précis ? Tapez un mot, un sentiment ou une idée dans la recherche, et découvrez comment d'autres langues nomment la même chose. Dans tous les cas, les résultats ne sont jamais de simples traductions — ce sont des fenêtres sur la façon dont différentes cultures pensent, se disputent, aiment et plaisantent.",
      "La base de données contient plus de 14 000 expressions réparties sur 7 langues — français, turc, italien, anglais, espagnol, allemand, japonais — plus plusieurs variantes régionales de l'espagnol (Mexique, Argentine, Colombie, Pérou). Chaque entrée comprend une définition ; la plupart offrent aussi une histoire d'origine, un exemple d'utilisation et des équivalents dans d'autres langues. Le projet est open source, en constante expansion et entièrement gratuit.",
    ],
    sectionPWA: "Une appli sans App Store",
    pwaIntro: "World Expressions s'installe sur votre téléphone ou ordinateur comme une application — sans passer par l'App Store ou le Play Store. C'est ce qu'on appelle une PWA (Progressive Web App) : le site devient une icône sur votre écran d'accueil, fonctionne hors ligne pour les expressions déjà consultées, et se met à jour automatiquement, sans rien à télécharger ni à approuver. Pour un projet personnel et gratuit, c'est le choix le plus simple : pas de frais de développeur, pas de revue d'App Store, un seul code pour toutes les plateformes.",
    pwaAndroid: {
      title: "Android, Chrome, Brave, ordinateur",
      body: "L'installation fonctionne directement : un bandeau ou une option « Ajouter à l'écran d'accueil » apparaît dans le menu du navigateur.",
    },
    pwaIos: {
      title: "iPhone",
      body: "Seul Safari permet l'installation — pas Chrome ni Brave sur iOS, Apple limitant tous les navigateurs iOS au même moteur que Safari. Ouvrez le site dans Safari, appuyez sur Partager, puis « Sur l'écran d'accueil ».",
    },
    sectionTypes: "Quels types d'expressions ?",
    typesIntro: "Toutes les formules figées ne sont pas identiques. World Expressions distingue quatre grands types — chacun avec son propre caractère et sa propre relation au sens littéral.",
    types: [
      {
        label: "Proverbe",
        title: "Une phrase complète porteuse d'une morale ou d'une sagesse.",
        body: "Les proverbes sont des formules courtes et autonomes — souvent métaphoriques — qui condensent une sagesse collective. Ils fonctionnent comme des arguments : on cite un proverbe pour justifier ou prévenir. Souvent anciens, souvent anonymes, leur imagerie est très concrète là où leur sens est très abstrait.",
        example: '"Qui sème le vent récolte la tempête." — Une mise en garde universelle sur les conséquences de ses actes.',
      },
      {
        label: "Expression idiomatique",
        title: "Une formule figée dont le sens ne se décode pas mot à mot.",
        body: "Les expressions idiomatiques sont le cœur vivant du langage familier. Prises au sens littéral, les mots n'ont aucun sens — ou un sens complètement différent. Elles s'apprennent en bloc, pas assemblées depuis leurs parties. Les nouveaux locuteurs d'une langue peinent le plus avec les idiomes, car aucune connaissance du vocabulaire ne suffit à les décoder.",
        example: '"Avoir le cafard." — Posséder un cafard ? Non. Être triste, déprimé.',
      },
      {
        label: "Locution",
        title: "Un groupe de mots figé qui fonctionne comme un seul élément grammatical.",
        body: "Les locutions sont des animaux grammaticaux — elles se comportent comme un adverbe, une préposition ou un adjectif unique. Contrairement aux idiomes, leur sens est souvent devinable, mais elles doivent être utilisées en bloc. On ne peut pas réorganiser les mots ni substituer des synonymes. Elles donnent à la langue son rythme idiomatique.",
        example: '"En catimini." — Discrètement, en secret, sans attirer l\'attention.',
      },
      {
        label: "Argot",
        title: "Registre informel, souvent issu de groupes sociaux spécifiques.",
        body: "L'argot est le bord vif du langage. Il mute, se démode vite et marque l'appartenance à un groupe. Un mot d'argot signale : « je suis des vôtres, je parle comme vous ». Certains termes deviennent mainstream et perdent leur tranchant ; d'autres restent souterrains pour toujours. En français, le verlan fonctionne en inversant les syllabes : « femme » devient « meuf », « l'envers » devient « verlan ».",
        example: '"Kiffer." — Vraiment aimer quelque chose. De l\'arabe "kif" (plaisir), via l\'argot urbain français.',
      },
    ],
    sectionSearch: "Comment fonctionne la recherche",
    searchIntro: "Quand vous tapez un mot dans la barre de recherche, le système ne cherche pas simplement cette chaîne exacte dans une base de données. Il effectue quatre passes successives — chacune plus large que la précédente — et assemble les résultats par ordre de pertinence.",
    searchPull: "Prenons un utilisateur italien qui tape « amore ». Voici exactement ce qui se passe, étape par étape.",
    passes: [
      {
        title: "Correspondance exacte.",
        body: "Le système cherche « amore » apparaissant littéralement dans le texte de chaque expression, toutes langues confondues. Les expressions italiennes contenant le mot remontent en premier. Cette passe est rapide et précise — elle capture les résultats évidents.",
      },
      {
        title: "Correspondance sémantique.",
        body: "Le système fouille la définition, l'origine et l'exemple d'utilisation de chaque expression — toujours à la recherche de « amore ». Un proverbe dont la définition évoque l'amour sans utiliser le mot dans son titre apparaîtra ici. Les étiquettes (tags) sont également cherchées à cette étape.",
      },
      {
        title: "Passe de traduction croisée.",
        body: "Le système cherche « amore » à l'intérieur des versions traduites de toutes les expressions — y compris les françaises, espagnoles et turques. Une expression française comme « avoir le cœur sur la main » (être généreux) peut avoir une traduction italienne mentionnant « amore », et remontera ici. C'est ainsi que l'application fait le pont entre les langues.",
      },
      {
        title: "Pont conceptuel.",
        body: "Le système tente de faire correspondre « amore » à des étiquettes conceptuelles connues — des labels thématiques comme amour, romance ou peine de cœur. Si une correspondance est trouvée, toutes les expressions portant cette étiquette — dans toutes les langues — apparaissent dans les résultats sous une section distincte « Par concept ». C'est le filet le plus large : une expression turque sur le chagrin d'amour peut remonter depuis une recherche italienne sur l'amour.",
      },
    ],
    searchOutro: "Les résultats de chaque passe sont visuellement séparés sur la page de résultats, pour que vous sachiez toujours pourquoi une expression est apparue. Les quatre sections sont étiquetées : Dans le texte · Par le sens · Via les traductions · Par concept.",
    sectionConcepts: "Concepts et domaines : deux façons de flâner",
    conceptsIntro: "Au-delà de la recherche, l'application propose deux autres façons d'explorer la base de données — et elles fonctionnent très différemment. Comprendre cette distinction rend la navigation beaucoup plus intuitive.",
    domainCard: {
      title: "Domaine",
      body: "Une grande catégorie éditoriale regroupant de nombreux concepts. Exemples : Travail & ambition, Argent, Relations humaines, Humour & ironie. Il y a 16 domaines au total.",
    },
    conceptCard: {
      title: "Concept",
      body: "Une étiquette thématique précise partagée par des expressions qui expriment la même idée — quelle que soit la langue. Exemples : argent, amitié, mort, paresse. Il y a plus de 900 concepts dans la base de données.",
    },
    conceptExplain: [
      "Quand vous cliquez sur un emoji dans le menu de recherche — la grille qui s'affiche quand vous ouvrez la recherche — chaque emoji représente un domaine. Cliquer dessus vous amène à une page de résultats filtrée par ce domaine : toutes les expressions appartenant à n'importe quel concept qu'il contient, dans toutes les langues.",
      "Quand vous cliquez sur une pastille concept — les petites étiquettes qui apparaissent sur les cartes d'expressions ou dans les pages de domaine — vous accédez à une vue plus précise. Seules les expressions portant ce concept spécifique apparaissent. Chercher « amitié » comme concept renverrait peut-être 40 expressions dans 5 langues. Chercher le domaine Relations humaines en renverrait des centaines, couvrant l'amitié mais aussi la loyauté, la trahison, la famille, l'amour, la solitude.",
      "Les deux chemins aboutissent à la même page de résultats unifiée, avec la même mise en page, les mêmes filtres, la même capacité à affiner par langue ou par pays. L'URL reflète toujours ce que vous parcourez — /search?domain=humor ou /search?concept=sarcasme — chaque vue est donc partageable.",
    ],
    conceptPull: "Le domaine, c'est le quartier. Le concept, c'est la rue.",
    sectionSameIdea: "La section « Même idée »",
    sameIdea: [
      "Sur chaque page d'expression, sous le contenu principal, vous trouverez une section intitulée Même idée dans les autres langues. C'est le cœur multilingue de l'application.",
      "Elle fonctionne via des liens conceptuels : chaque expression est reliée à une étiquette thématique, et les expressions partageant cette étiquette sont affichées ici. Une expression française sur la chance montrera ses cousines turques, espagnoles et italiennes — des expressions qui portent le même poids culturel, même si les images et les métaphores sont complètement différentes. Chaque équivalent est affiché avec un badge de confiance : Miroir (sens exactement identique), Équivalent (très proche) ou Dans la même veine (idée apparentée).",
    ],
    sectionData: "Les données",
    data: [
      "La base de données a été construite à partir de sources linguistiques publiques et curatée manuellement. Les définitions, origines et exemples ont été écrits ou vérifiés entrée par entrée — avec l'assistance de l'IA pour la majeure partie du travail, et une révision humaine pour la qualité. Les équivalents entre langues ont été générés par un modèle de langue (Mistral) et sont notés selon leur niveau de confiance.",
      "La base n'est pas exhaustive — aucune base de données d'expressions ne l'est jamais. Les langues évoluent, l'argot se démode, et ce qui constitue une « vraie » expression est toujours discutable. L'objectif est la profondeur plutôt que la largeur : moins d'expressions avec un contenu plus riche, plutôt qu'une liste brute de milliers.",
    ],
    sectionOpenSource: "Open source",
    openSource: "L'intégralité du code — backend FastAPI, frontend Next.js, scripts de base de données, pipelines d'enrichissement — est open source sur GitHub. Les contributions sont les bienvenues : nouvelles expressions, corrections, traductions, améliorations de design ou idées.",
    githubLink: "github.com/sinsan67/world-expressions →",
    sectionVision: "Et la suite ?",
    visionIntro: "World Expressions est un projet vivant. Voici où il va.",
    visionItems: [
      {
        emoji: "🖼️",
        title: "Naviguer par image",
        body: "Plutôt que de taper un mot, cliquer sur un emoji pour explorer. Les atomes (🐱 = un concept précis) et les molécules (🐱🐶🐦 = un domaine entier) forment deux niveaux de navigation visuelle — sans saisie de texte. Cliquer sur un domaine remonte toutes les expressions qui contiennent au moins un de ses concepts, dans toutes les langues. Cliquer sur un concept cible les expressions qui partagent exactement cette idée. L'ambiguïté de l'image est le principe : un seul emoji, des dizaines d'expressions, sept langues.",
      },
      {
        emoji: "🌐",
        title: "Modes monologue et bilingue",
        body: "Choisir comment on lit les expressions : en immersion dans la langue d'origine uniquement (monologue — idéal pour les apprenants qui veulent être mis au défi) ou toujours avec une traduction dans sa propre langue affichée à côté (bilingue — pour ceux qui veulent tout comprendre d'un coup d'œil). Un réglage personnel unique, appliqué partout dans l'application.",
      },
      {
        emoji: "🎨",
        title: "Des univers visuels",
        body: "Trois atmosphères distinctes pour trois registres différents : Langage du quotidien (chaleureux, familier), Argot & Rue (urbain, affirmé), Proverbes (classique, intemporel). Chaque univers aura sa propre identité visuelle — palette, typographie, style des cartes. La même expression peut avoir un poids différent selon l'univers dans lequel on l'explore.",
      },
      {
        emoji: "🗺️",
        title: "Une carte du monde interactive",
        body: "La page Atlas existe déjà. La vision long terme : cliquer sur n'importe quel pays d'une carte SVG mondiale et plonger dans ses expressions. Des données régionales sont déjà en base pour une partie de la France (Alsace, Bretagne). La carte s'enrichira au fil des données — pour finalement relier chaque expression au lieu où elle est née.",
      },
      {
        emoji: "🎮",
        title: "Un troisième jeu",
        body: "Voyage et Révision sont les deux premiers. La suite : explorer les expressions sur une carte du monde… ou naviguer dans des constellations d'emojis, où l'ambiguïté de l'image est le jeu lui-même. Construit sur le même système de concepts qui alimente déjà la recherche — aucune base de données séparée n'est nécessaire.",
      },
    ],
    sectionContact: "Nous contacter",
    contact: "Questions, correction à signaler, expression favorite à proposer — tout est bienvenu. Vous pouvez nous contacter par e-mail ou trouver le projet sur Instagram.",
    footer: "Fait avec curiosité. Construit en public.",
  },

  es: {
    eyebrow: "Sobre este proyecto",
    title: "Una carta de amor\na los modismos.",
    subtitle: "Cada lengua tiene expresiones que se resisten a la traducción. Llevan demasiado — historia, humor, la textura de la vida cotidiana. Aquí es donde comienza World Expressions.",
    intro: [
      "World Expressions es una forma gratuita y de código abierto de jugar con modismos de todo el mundo. Elige un juego: saca diez cartas en Voyage y quédate con las que te sorprendan, o repasa tu propia colección en Révision y comprueba qué se te ha quedado grabado. ¿Buscas algo concreto? Escribe una palabra, un sentimiento o una idea en el buscador, y descubre cómo otros idiomas nombran lo mismo. En cualquier caso, los resultados nunca son simples traducciones — son ventanas a cómo diferentes culturas piensan, discuten, aman y bromean.",
      "La base de datos contiene más de 14,000 expresiones en 7 idiomas — francés, turco, italiano, inglés, español, alemán y japonés — además de varias variantes regionales del español (México, Argentina, Colombia, Perú). Cada entrada incluye un significado; la mayoría también ofrece una historia de origen, un ejemplo de uso y equivalentes en otros idiomas. El proyecto es de código abierto, se expande continuamente y es completamente gratuito.",
    ],
    sectionPWA: "Una app sin App Store",
    pwaIntro: "World Expressions se instala en tu teléfono u ordenador como una aplicación — sin pasar por la App Store o Play Store. Esto se llama PWA (Progressive Web App): el sitio se convierte en un icono en tu pantalla de inicio, funciona sin conexión para las expresiones ya consultadas, y se actualiza automáticamente, sin nada que descargar ni aprobar. Para un proyecto personal y gratuito, es la opción más simple: sin cuotas de desarrollador, sin revisión de App Store, un solo código para todas las plataformas.",
    pwaAndroid: {
      title: "Android, Chrome, Brave, ordenador",
      body: "La instalación funciona directamente: aparece un banner o una opción «Añadir a la pantalla de inicio» en el menú del navegador.",
    },
    pwaIos: {
      title: "iPhone",
      body: "Solo Safari permite instalarla — no Chrome ni Brave en iOS, ya que Apple limita todos los navegadores de iOS al mismo motor que Safari. Abre el sitio en Safari, toca Compartir y luego «Añadir a pantalla de inicio».",
    },
    sectionTypes: "¿Qué tipo de expresiones?",
    typesIntro: "No todas las frases fijas son iguales. World Expressions distingue cuatro tipos principales — cada uno con su propio carácter y su propia relación con el significado literal.",
    types: [
      {
        label: "Proverbio · Proverb",
        title: "Una frase completa con una moraleja o sabiduría.",
        body: "Los proverbios son dichos cortos y completos — generalmente metafóricos — que codifican la sabiduría colectiva. Funcionan como argumentos: citas un proverbio para justificar o advertir. Suelen ser antiguos, anónimos, y muy literales en sus imágenes aunque muy abstractos en su significado.",
        example: '"Qui sème le vent récolte la tempête." — Quien siembra vientos recoge tempestades.',
      },
      {
        label: "Expresión idiomática · Idiom",
        title: "Una frase fija cuyo significado no puede descifrarse palabra por palabra.",
        body: "Los modismos son el corazón palpitante del lenguaje informal. Las palabras tomadas literalmente no tienen sentido — o tienen un sentido completamente diferente. Se aprenden como unidades, no se ensamblan desde sus partes. Los nuevos hablantes de un idioma tienen más dificultades con los modismos, porque ningún conocimiento de vocabulario ayuda a descifrarlos.",
        example: '"Avoir le cafard." — Tener la cucaracha. Significado: estar triste, deprimido.',
      },
      {
        label: "Locución",
        title: "Una unidad de varias palabras que funciona como un único elemento gramatical.",
        body: "Las locuciones son animales más gramaticales — se comportan como un solo adverbio, preposición o adjetivo. A diferencia de los modismos, su significado suele ser adivinable, pero deben usarse en bloque. No se pueden reorganizar las palabras ni sustituir sinónimos. Dan al lenguaje su ritmo idiomático.",
        example: '"En catimini." — Furtivamente, a escondidas, sin llamar la atención.',
      },
      {
        label: "Argot · Slang",
        title: "Registro informal, a menudo proveniente de grupos sociales específicos.",
        body: "El argot es el filo vivo del lenguaje. Muta, envejece rápido y marca la pertenencia. Una palabra de argot señala «soy uno de los vuestros, hablo como vosotros». Algunos términos se vuelven mainstream y pierden su fuerza; otros permanecen en la clandestinidad para siempre. En francés, el verlan funciona invirtiendo las sílabas: «femme» se convierte en «meuf», «l'envers» en «verlan».",
        example: '"Kiffer." — Que te guste mucho algo. Del árabe "kif" (placer), a través del argot urbano francés.',
      },
    ],
    sectionSearch: "Cómo funciona la búsqueda",
    searchIntro: "Cuando escribes una palabra en la barra de búsqueda, el sistema no busca simplemente esa cadena exacta en una base de datos. Realiza cuatro pasadas sucesivas — cada una más amplia que la anterior — y ensambla los resultados por orden de relevancia.",
    searchPull: "Tomemos a un usuario italiano que escribe \"amore\". Esto es exactamente lo que ocurre, paso a paso.",
    passes: [
      {
        title: "Coincidencia exacta.",
        body: "El sistema busca \"amore\" apareciendo literalmente en el texto de cualquier expresión en todos los idiomas. Las expresiones italianas que contienen la palabra aparecen primero. Esta pasada es rápida y precisa — capta los resultados evidentes.",
      },
      {
        title: "Coincidencia semántica.",
        body: "El sistema busca en el significado, el origen y el ejemplo de uso de cada expresión — todavía buscando \"amore\". Un proverbio cuyo significado menciona el amor sin usar la palabra en su título aparecerá aquí. Las etiquetas también se buscan en este paso.",
      },
      {
        title: "Pasada de traducción cruzada.",
        body: "El sistema busca \"amore\" dentro de las versiones traducidas de todas las expresiones — incluidas las francesas, españolas y turcas. Una expresión francesa como \"avoir le cœur sur la main\" (ser generoso) podría tener una traducción italiana que mencione \"amore\", y aparecería aquí. Así es como la aplicación conecta los idiomas.",
      },
      {
        title: "Puente conceptual.",
        body: "El sistema intenta hacer coincidir \"amore\" con etiquetas conceptuales conocidas — etiquetas temáticas como amor, romance o desamor. Si se encuentra una coincidencia, todas las expresiones que llevan esa etiqueta — en cualquier idioma — aparecen bajo una sección \"Por concepto\". Esta es la red más amplia: una expresión turca sobre el desamor puede aparecer desde una búsqueda italiana sobre el amor.",
      },
    ],
    searchOutro: "Los resultados de cada pasada están separados visualmente en la página de resultados, para que siempre sepas por qué apareció una expresión. Las cuatro secciones se etiquetan: En el texto · Por el sentido · Via traducciones · Por concepto.",
    sectionConcepts: "Conceptos y dominios: dos formas de explorar",
    conceptsIntro: "Más allá de la búsqueda, la aplicación ofrece dos formas adicionales de explorar la base de datos — y funcionan de manera bastante diferente. Entender la diferencia hace que la navegación sea mucho más intuitiva.",
    domainCard: {
      title: "Dominio",
      body: "Una amplia categoría editorial que agrupa muchos conceptos. Ejemplos: Trabajo y ambición, Dinero, Relaciones humanas, Humor e ironía. Hay 16 dominios en total.",
    },
    conceptCard: {
      title: "Concepto",
      body: "Una etiqueta temática específica compartida por expresiones que expresan la misma idea — independientemente del idioma. Ejemplos: dinero, amistad, muerte, pereza. Hay más de 900 conceptos en la base de datos.",
    },
    conceptExplain: [
      "Cuando haces clic en un emoji en el menú de búsqueda — la cuadrícula que aparece cuando abres la búsqueda — cada emoji representa un dominio. Al hacer clic llegas a una página de resultados filtrada por ese dominio: todas las expresiones pertenecientes a cualquier concepto dentro de él, en todos los idiomas.",
      "Cuando haces clic en una pastilla de concepto — las pequeñas etiquetas que aparecen en las tarjetas de expresiones o en las páginas de dominio — vas a una vista más específica. Solo aparecen las expresiones etiquetadas con ese concepto. Buscar «amistad» como concepto podría devolver 40 expresiones en 5 idiomas. Buscar el dominio Relaciones humanas devolvería cientos, abarcando la amistad pero también la lealtad, la traición, la familia, el amor, la soledad.",
      "Ambos caminos llevan a la misma página de resultados unificada, con el mismo diseño, los mismos filtros, la misma capacidad de filtrar por idioma o país. La URL siempre refleja lo que estás explorando — /search?domain=humor o /search?concept=sarcasmo — por lo que cada vista es compartible.",
    ],
    conceptPull: "El dominio es el barrio. El concepto es la calle.",
    sectionSameIdea: "La sección «Misma idea»",
    sameIdea: [
      "En cada página de expresión, bajo el contenido principal, encontrarás una sección titulada La misma idea en otros idiomas. Este es el corazón multilingüe de la aplicación.",
      "Funciona mediante enlaces conceptuales: cada expresión está conectada a una etiqueta temática, y las expresiones que comparten esa etiqueta se muestran aquí. Una expresión francesa sobre la suerte mostrará a sus primas turcas, españolas e italianas — expresiones que llevan el mismo peso cultural, aunque las imágenes y metáforas sean completamente diferentes. Cada equivalente se muestra con una insignia: Espejo (mismo significado exacto), Equivalente (muy cercano) o En la misma línea (idea relacionada).",
    ],
    sectionData: "Los datos",
    data: [
      "La base de datos fue construida a partir de fuentes lingüísticas públicas y curada manualmente. Los significados, orígenes y ejemplos de uso fueron escritos o verificados entrada por entrada — con asistencia de IA para la mayor parte del trabajo, y revisión humana para la calidad. Los equivalentes entre idiomas fueron generados por un modelo de lenguaje (Mistral) y se puntúan según su nivel de confianza.",
      "La base de datos no es exhaustiva — ninguna base de datos de expresiones lo es nunca. Los idiomas evolucionan, el argot cambia, y lo que cuenta como una expresión «real» siempre es debatible. El objetivo es la profundidad sobre la amplitud: menos expresiones con contenido más rico, en lugar de una lista bruta de miles.",
    ],
    sectionOpenSource: "Código abierto",
    openSource: "Todo el código — backend FastAPI, frontend Next.js, scripts de base de datos, pipelines de enriquecimiento — es de código abierto en GitHub. Las contribuciones son bienvenidas: nuevas expresiones, correcciones, traducciones, mejoras de diseño o ideas.",
    githubLink: "github.com/sinsan67/world-expressions →",
    sectionVision: "¿Qué sigue?",
    visionIntro: "World Expressions es un proyecto vivo. Hacia aquí va.",
    visionItems: [
      {
        emoji: "🖼️",
        title: "Navegar por imagen",
        body: "En lugar de escribir, hacer clic en un emoji para explorar. Los átomos (🐱 = un concepto específico) y las moléculas (🐱🐶🐦 = un dominio completo) forman dos niveles de navegación visual — sin necesidad de texto. Hacer clic en un dominio recupera todas las expresiones que contienen al menos uno de sus conceptos, en todos los idiomas. Hacer clic en un concepto filtra las expresiones que comparten exactamente esa idea.",
      },
      {
        emoji: "🌐",
        title: "Modos monolingüe y bilingüe",
        body: "Elegir cómo se leen las expresiones: sumergido en la lengua original únicamente (monolingüe — ideal para quienes aprenden un idioma) o siempre con una traducción en su propio idioma al lado (bilingüe — para quienes quieren entenderlo todo de un vistazo). Un ajuste personal único, aplicado en toda la aplicación.",
      },
      {
        emoji: "🎨",
        title: "Universos visuales",
        body: "Tres atmósferas distintas para tres registros diferentes: Lenguaje cotidiano (cálido, familiar), Argot y calle (urbano, atrevido), Proverbios (clásico, atemporal). Cada universo tendrá su propia identidad visual — paleta, tipografía, estilo de tarjetas.",
      },
      {
        emoji: "🗺️",
        title: "Un mapa del mundo interactivo",
        body: "La página Atlas ya existe. La visión a largo plazo: hacer clic en cualquier país de un mapa SVG mundial y sumergirse en sus expresiones. Hay datos regionales en la base de datos para partes de Francia (Alsacia, Bretaña). El mapa crecerá a medida que crezcan los datos.",
      },
      {
        emoji: "🎮",
        title: "Un tercer juego",
        body: "Voyage y Révision son los dos primeros. Lo que sigue: explorar expresiones en un mapa del mundo… o navegar por constelaciones de emojis, donde la ambigüedad de la imagen es el propio juego. Construido sobre el mismo sistema de conceptos que ya impulsa la búsqueda — no hace falta una base de datos aparte.",
      },
    ],
    sectionContact: "Contacto",
    contact: "Preguntas, una corrección que reportar, una expresión favorita que sugerir — todo es bienvenido. Puedes contactarnos por correo electrónico o encontrar el proyecto en Instagram.",
    footer: "Hecho con curiosidad. Construido en público.",
  },

  it: {
    eyebrow: "Su questo progetto",
    title: "Una lettera d'amore\nai modi di dire.",
    subtitle: "Ogni lingua ha espressioni che rifiutano di farsi tradurre. Portano con sé troppe cose — storia, umorismo, la trama della vita quotidiana. È da qui che parte World Expressions.",
    intro: [
      "World Expressions è un modo gratuito e open source di giocare con i modi di dire di tutto il mondo. Scegli un gioco: pesca dieci carte in Voyage e tieni quelle che ti sorprendono, oppure sfoglia la tua collezione in Révision e scopri cosa ti è rimasto impresso. Cerchi qualcosa di preciso? Digita una parola, un sentimento o un'idea nella ricerca, e scopri come altre lingue chiamano la stessa cosa. In ogni caso, i risultati non sono mai semplici traduzioni — sono finestre su come culture diverse pensano, litigano, amano e scherzano.",
      "La banca dati contiene oggi oltre 14.000 espressioni in 7 lingue — francese, turco, italiano, inglese, spagnolo, tedesco e giapponese — più diverse varianti regionali dello spagnolo (Messico, Argentina, Colombia, Perù). Ogni voce include un significato; la maggior parte offre anche una storia d'origine, un esempio d'uso ed equivalenti in altre lingue. Il progetto è open source, in continua espansione e completamente gratuito.",
    ],
    sectionPWA: "Un'app senza App Store",
    pwaIntro: "World Expressions si installa sul telefono o sul computer come un'applicazione — senza passare dall'App Store o dal Play Store. Si chiama PWA (Progressive Web App): il sito diventa un'icona sulla schermata iniziale, funziona offline per le espressioni già consultate e si aggiorna automaticamente, senza nulla da scaricare né approvare. Per un progetto personale e gratuito è la scelta più semplice: niente quote da sviluppatore, niente revisione dell'App Store, un solo codice per tutte le piattaforme.",
    pwaAndroid: {
      title: "Android, Chrome, Brave, computer",
      body: "L'installazione funziona direttamente: nel menu del browser compare un banner o l'opzione «Aggiungi a schermata Home».",
    },
    pwaIos: {
      title: "iPhone",
      body: "Solo Safari può installarla — non Chrome né Brave su iOS, perché Apple impone a tutti i browser iOS lo stesso motore di Safari. Apri il sito in Safari, tocca Condividi, poi «Aggiungi a Home».",
    },
    sectionTypes: "Che tipo di espressioni?",
    typesIntro: "Non tutte le frasi fisse sono la stessa cosa. World Expressions distingue quattro tipi principali — ognuno con il proprio carattere e il proprio rapporto con il senso letterale.",
    types: [
      {
        label: "Proverbio · Proverb",
        title: "Una frase completa che porta una morale o una saggezza.",
        body: "I proverbi sono detti brevi e autonomi — di solito metaforici — che condensano una saggezza collettiva. Funzionano come argomenti: si cita un proverbio per giustificare o mettere in guardia. Sono spesso antichi, spesso anonimi, molto concreti nelle immagini e molto astratti nel significato.",
        example: '"Qui sème le vent récolte la tempête." — Chi semina vento raccoglie tempesta.',
      },
      {
        label: "Espressione idiomatica · Idiom",
        title: "Una frase fissa il cui senso non si decifra parola per parola.",
        body: "I modi di dire sono il cuore pulsante della lingua informale. Prese alla lettera, le parole non hanno alcun senso — o un senso completamente diverso. Si imparano in blocco, non si assemblano dai pezzi. Chi impara una lingua fatica soprattutto con i modi di dire, perché nessuna conoscenza del vocabolario aiuta a decifrarli.",
        example: '"Avoir le cafard." — Avere lo scarafaggio. Significato: essere tristi, giù di morale.',
      },
      {
        label: "Locuzione",
        title: "Un gruppo fisso di parole che funziona come un unico elemento grammaticale.",
        body: "Le locuzioni sono animali più grammaticali — si comportano come un solo avverbio, una preposizione o un aggettivo. A differenza dei modi di dire, il loro senso è spesso intuibile, ma vanno usate in blocco. Non si possono riordinare le parole né sostituire sinonimi. Danno alla lingua il suo ritmo idiomatico.",
        example: '"En catimini." — Di nascosto, in sordina, senza farsi notare.',
      },
      {
        label: "Gergo · Slang",
        title: "Registro informale, spesso nato in gruppi sociali specifici.",
        body: "Il gergo è il bordo vivo della lingua. Muta, invecchia in fretta e segna l'appartenenza. Una parola di gergo dice: «sono dei vostri, parlo come voi». Alcuni termini diventano mainstream e perdono il loro filo; altri restano sotterranei per sempre. In francese, il verlan funziona invertendo le sillabe: «femme» diventa «meuf», «l'envers» diventa «verlan».",
        example: '"Kiffer." — Amare molto qualcosa. Dall\'arabo "kif" (piacere), attraverso il gergo urbano francese.',
      },
    ],
    sectionSearch: "Come funziona la ricerca",
    searchIntro: "Quando digiti una parola nella barra di ricerca, il sistema non cerca semplicemente quella stringa esatta in una banca dati. Esegue quattro passaggi successivi — ognuno più ampio del precedente — e assembla i risultati in ordine di pertinenza.",
    searchPull: "Prendiamo un utente italiano che digita «amore». Ecco esattamente cosa succede, passo dopo passo.",
    passes: [
      {
        title: "Corrispondenza esatta.",
        body: "Il sistema cerca «amore» che appare letteralmente nel testo di ogni espressione, in tutte le lingue. Le espressioni italiane che contengono la parola emergono per prime. Questo passaggio è rapido e preciso — cattura i risultati evidenti.",
      },
      {
        title: "Corrispondenza semantica.",
        body: "Il sistema esplora il significato, l'origine e l'esempio d'uso di ogni espressione — sempre alla ricerca di «amore». Un proverbio il cui significato parla d'amore senza usare la parola nel titolo apparirà qui. Anche le etichette (tag) vengono cercate in questa fase.",
      },
      {
        title: "Passaggio di traduzione incrociata.",
        body: "Il sistema cerca «amore» dentro le versioni tradotte di tutte le espressioni — comprese quelle francesi, spagnole e turche. Un'espressione francese come «avoir le cœur sur la main» (essere generosi) può avere una traduzione italiana che menziona «amore», e riemergerà qui. È così che l'app fa da ponte tra le lingue.",
      },
      {
        title: "Ponte concettuale.",
        body: "Il sistema prova ad abbinare «amore» alle etichette concettuali note — etichette tematiche come amore, romanticismo o cuore spezzato. Se trova una corrispondenza, tutte le espressioni con quell'etichetta — in qualunque lingua — appaiono in una sezione distinta «Per concetto». È la rete più larga: un'espressione turca sul cuore spezzato può emergere da una ricerca italiana sull'amore.",
      },
    ],
    searchOutro: "I risultati di ogni passaggio sono separati visivamente nella pagina dei risultati, così sai sempre perché un'espressione è apparsa. Le quattro sezioni sono etichettate: Nel testo · Per il senso · Via traduzioni · Per concetto.",
    sectionConcepts: "Concetti e domini: due modi di vagabondare",
    conceptsIntro: "Oltre alla ricerca, l'app offre altri due modi di esplorare la banca dati — e funzionano in modo molto diverso. Capire la differenza rende la navigazione molto più intuitiva.",
    domainCard: {
      title: "Dominio",
      body: "Un'ampia categoria editoriale che raggruppa molti concetti. Esempi: Lavoro e ambizione, Denaro, Relazioni umane, Umorismo e ironia. Ci sono 16 domini in totale.",
    },
    conceptCard: {
      title: "Concetto",
      body: "Un'etichetta tematica precisa condivisa da espressioni che esprimono la stessa idea — in qualunque lingua. Esempi: denaro, amicizia, morte, pigrizia. Ci sono oltre 900 concetti nella banca dati.",
    },
    conceptExplain: [
      "Quando clicchi un emoji nel menu di ricerca — la griglia che appare quando apri la ricerca — ogni emoji rappresenta un dominio. Cliccandolo arrivi a una pagina di risultati filtrata per quel dominio: tutte le espressioni che appartengono a un qualunque concetto al suo interno, in tutte le lingue.",
      "Quando clicchi una pillola di concetto — le piccole etichette sulle schede delle espressioni o nelle pagine di dominio — arrivi a una vista più stretta. Appaiono solo le espressioni con quel concetto specifico. Cercare «amicizia» come concetto potrebbe restituire 40 espressioni in 5 lingue. Cercare il dominio Relazioni umane ne restituirebbe centinaia: amicizia ma anche lealtà, tradimento, famiglia, amore, solitudine.",
      "Entrambi i percorsi portano alla stessa pagina di risultati unificata, con lo stesso layout, gli stessi filtri, la stessa possibilità di restringere per lingua o paese. L'URL riflette sempre ciò che stai esplorando — /search?domain=humor o /search?concept=sarcasmo — quindi ogni vista è condivisibile.",
    ],
    conceptPull: "Il dominio è il quartiere. Il concetto è la strada.",
    sectionSameIdea: "La sezione «La stessa idea»",
    sameIdea: [
      "In ogni pagina di espressione, sotto il contenuto principale, trovi una sezione intitolata La stessa idea nelle altre lingue. È il cuore multilingue dell'app.",
      "Funziona tramite legami concettuali: ogni espressione è collegata a un'etichetta tematica, e le espressioni che condividono quell'etichetta emergono qui. Un'espressione francese sulla fortuna mostrerà le sue cugine turche, spagnole e italiane — espressioni che portano lo stesso peso culturale, anche se le immagini e le metafore sono completamente diverse. Ogni equivalente ha un badge di affidabilità: Specchio (significato identico), Equivalente (molto vicino) o Sulla stessa linea (idea affine).",
    ],
    sectionData: "I dati",
    data: [
      "La banca dati è stata costruita da fonti linguistiche pubbliche e curata manualmente. Significati, origini ed esempi d'uso sono stati scritti o verificati voce per voce — con l'assistenza dell'IA per il grosso del lavoro e una revisione umana per la qualità. Gli equivalenti tra lingue sono stati generati da un modello linguistico (Mistral) e hanno un punteggio di affidabilità.",
      "La banca dati non è esaustiva — nessuna banca dati di espressioni lo è mai. Le lingue crescono, il gergo cambia, e cosa conti come espressione «vera» è sempre discutibile. L'obiettivo è la profondità più che l'ampiezza: meno espressioni con contenuti più ricchi, piuttosto che una lista grezza di migliaia.",
    ],
    sectionOpenSource: "Open source",
    openSource: "Tutto il codice — backend FastAPI, frontend Next.js, script di database, pipeline di arricchimento — è open source su GitHub. I contributi sono benvenuti: nuove espressioni, correzioni, traduzioni, miglioramenti di design o idee.",
    githubLink: "github.com/sinsan67/world-expressions →",
    sectionVision: "E adesso?",
    visionIntro: "World Expressions è un progetto vivo. Ecco dove sta andando.",
    visionItems: [
      {
        emoji: "🖼️",
        title: "Navigare per immagini",
        body: "Invece di digitare, cliccare un emoji per esplorare. Gli atomi (🐱 = un concetto preciso) e le molecole (🐱🐶🐦 = un intero dominio) formano due livelli di navigazione visiva — senza testo. Cliccando un dominio emergono tutte le espressioni che contengono almeno uno dei suoi concetti, in tutte le lingue. Cliccando un concetto si arriva alle espressioni che condividono esattamente quell'idea. L'ambiguità dell'immagine è il principio: un solo emoji, decine di espressioni, sette lingue.",
      },
      {
        emoji: "🌐",
        title: "Modalità monologo e bilingue",
        body: "Scegliere come leggere le espressioni: immersi solo nella lingua originale (monologo — ideale per chi impara una lingua e vuole essere messo alla prova) o sempre con una traduzione nella propria lingua accanto (bilingue — per chi vuole capire tutto a colpo d'occhio). Un'unica impostazione personale, applicata in tutta l'app.",
      },
      {
        emoji: "🎨",
        title: "Universi visivi",
        body: "Tre atmosfere distinte per tre registri diversi: Lingua di tutti i giorni (calda, familiare), Gergo e strada (urbana, decisa), Proverbi (classica, senza tempo). Ogni universo avrà la propria identità visiva — palette, tipografia, stile delle schede.",
      },
      {
        emoji: "🗺️",
        title: "Una mappa del mondo interattiva",
        body: "La pagina Atlas esiste già. La visione a lungo termine: cliccare qualunque paese su una mappa SVG mondiale e immergersi nelle sue espressioni. Ci sono già dati regionali per parti della Francia (Alsazia, Bretagna). La mappa crescerà con i dati — fino a collegare ogni espressione al luogo dove è nata.",
      },
      {
        emoji: "🎮",
        title: "Un terzo gioco",
        body: "Voyage e Révision sono i primi due. La prossima tappa: esplorare le espressioni su una mappa del mondo… o navigare tra costellazioni di emoji, dove l'ambiguità dell'immagine è essa stessa il gioco. Costruito sullo stesso sistema di concetti che alimenta già la ricerca — nessun database separato necessario.",
      },
    ],
    sectionContact: "Contatti",
    contact: "Domande, una correzione da segnalare, un'espressione preferita da suggerire — tutto è benvenuto. Puoi scriverci per e-mail o trovare il progetto su Instagram.",
    footer: "Fatto con curiosità. Costruito in pubblico.",
  },

  tr: {
    eyebrow: "Bu proje hakkında",
    title: "Deyimlere yazılmış\nbir aşk mektubu.",
    subtitle: "Her dilde çeviriye direnen ifadeler vardır. Taşıdıkları çok şey var — tarih, mizah, gündelik hayatın dokusu. World Expressions tam burada başlıyor.",
    intro: [
      "World Expressions, dünyanın dört bir yanındaki deyimlerle oynamanın ücretsiz ve açık kaynaklı bir yoludur. Bir oyun seçin: Voyage'da on kart çekin ve sizi şaşırtanları saklayın, ya da Révision'da kendi koleksiyonunuzu gözden geçirin ve aklınızda ne kaldığını görün. Belirli bir şey mi arıyorsunuz? Aramaya bir kelime, bir duygu ya da bir fikir yazın ve farklı dillerin aynı şeyi nasıl adlandırdığını keşfedin. Her iki durumda da sonuçlar asla basit çeviriler değildir — farklı kültürlerin nasıl düşündüğüne, tartıştığına, sevdiğine ve şakalaştığına açılan pencerelerdir.",
      "Veritabanında şu anda 7 dilde 14.000'den fazla ifade var — Fransızca, Türkçe, İtalyanca, İngilizce, İspanyolca, Almanca ve Japonca — artı İspanyolcanın birkaç bölgesel çeşidi (Meksika, Arjantin, Kolombiya, Peru). Her kayıtta bir anlam bulunur; çoğunda ayrıca bir köken hikâyesi, bir kullanım örneği ve diğer dillerdeki karşılıklar da vardır. Proje açık kaynaklıdır, sürekli büyümektedir ve tamamen ücretsizdir.",
    ],
    sectionPWA: "App Store'suz bir uygulama",
    pwaIntro: "World Expressions, telefonunuza veya bilgisayarınıza bir uygulama gibi kurulabilir — App Store ya da Play Store'a uğramadan. Buna PWA (Progressive Web App) denir: site, ana ekranınızda bir simgeye dönüşür, daha önce baktığınız ifadeler için çevrimdışı çalışır ve kendini otomatik günceller; indirilecek ya da onaylanacak hiçbir şey yoktur. Ücretsiz, kişisel bir proje için en sade seçim budur: geliştirici ücreti yok, App Store incelemesi yok, tüm platformlar için tek kod.",
    pwaAndroid: {
      title: "Android, Chrome, Brave, bilgisayar",
      body: "Kurulum doğrudan çalışır: tarayıcı menüsünde bir bant ya da “Ana ekrana ekle” seçeneği belirir.",
    },
    pwaIos: {
      title: "iPhone",
      body: "Yalnızca Safari kurabilir — iOS'ta Chrome veya Brave değil; çünkü Apple, tüm iOS tarayıcılarını Safari'nin motoruyla sınırlar. Siteyi Safari'de açın, Paylaş'a dokunun, ardından “Ana Ekrana Ekle”yi seçin.",
    },
    sectionTypes: "Ne tür ifadeler?",
    typesIntro: "Her kalıplaşmış söz aynı şey değildir. World Expressions dört ana tür ayırt eder — her birinin kendi karakteri ve gerçek anlamla kendi ilişkisi vardır.",
    types: [
      {
        label: "Atasözü · Proverb",
        title: "Bir ders ya da bilgelik taşıyan eksiksiz bir cümle.",
        body: "Atasözleri kısa, kendi başına yeterli sözlerdir — genellikle mecazidir — ve ortak bir bilgeliği damıtır. Birer argüman gibi çalışırlar: haklı çıkarmak ya da uyarmak için atasözü söylenir. Çoğu eskidir, çoğu anonimdir; imgeleri son derece somut, anlamları son derece soyuttur.",
        example: '"Qui sème le vent récolte la tempête." — Rüzgâr eken fırtına biçer.',
      },
      {
        label: "Deyim · Idiom",
        title: "Anlamı kelime kelime çözülemeyen kalıplaşmış bir ifade.",
        body: "Deyimler, gündelik dilin atan kalbidir. Kelimeler gerçek anlamıyla alındığında hiçbir anlam taşımaz — ya da bambaşka bir anlam taşır. Parçalardan kurulmaz, bütün olarak öğrenilirler. Bir dili yeni öğrenenler en çok deyimlerle zorlanır; çünkü hiçbir kelime bilgisi onları çözmeye yetmez.",
        example: '"Avoir le cafard." — Hamam böceğine sahip olmak. Anlamı: hüzünlenmek, morali bozuk olmak.',
      },
      {
        label: "Kalıp söz · Locution",
        title: "Tek bir dilbilgisel öğe gibi çalışan kalıplaşmış kelime grubu.",
        body: "Kalıp sözler daha çok dilbilgisel hayvanlardır — tek bir zarf, edat ya da sıfat gibi davranırlar. Deyimlerden farklı olarak anlamları çoğu zaman tahmin edilebilir, ama blok hâlinde kullanılmaları gerekir. Kelimelerin yeri değiştirilemez, eş anlamlılar konamaz. Dile deyimsel ritmini onlar verir.",
        example: '"En catimini." — Gizlice, sessiz sedasız, dikkat çekmeden.',
      },
      {
        label: "Argo · Slang",
        title: "Genellikle belirli sosyal gruplardan doğan gayriresmî dil.",
        body: "Argo, dilin canlı kıyısıdır. Değişir, hızla eskir ve aidiyeti işaretler. Bir argo kelime şunu söyler: “Ben sizdenim, sizin gibi konuşuyorum.” Kimi terimler anaakıma karışıp keskinliğini yitirir; kimileri sonsuza dek yeraltında kalır. Fransızcada verlan, heceleri ters çevirerek çalışır: “femme” “meuf” olur, “l'envers” “verlan” olur.",
        example: '"Kiffer." — Bir şeyi çok sevmek. Arapça "kif"ten (keyif), Fransız sokak argosu yoluyla.',
      },
    ],
    sectionSearch: "Arama nasıl çalışır",
    searchIntro: "Arama çubuğuna bir kelime yazdığınızda sistem, o kelimeyi veritabanında olduğu gibi aramakla yetinmez. Her biri bir öncekinden daha geniş dört ardışık geçiş yapar ve sonuçları alaka sırasına göre birleştirir.",
    searchPull: "“Amore” yazan İtalyan bir kullanıcıyı ele alalım. Adım adım tam olarak şunlar olur.",
    passes: [
      {
        title: "Birebir eşleşme.",
        body: "Sistem, “amore” kelimesinin herhangi bir ifadenin metninde birebir geçtiği yerleri arar — tüm dillerde. Kelimeyi içeren İtalyanca ifadeler önce gelir. Bu geçiş hızlı ve nettir — bariz sonuçları yakalar.",
      },
      {
        title: "Anlamsal eşleşme.",
        body: "Sistem, her ifadenin anlamını, kökenini ve kullanım örneğini tarar — hâlâ “amore” peşindedir. Başlığında kelime geçmeyen ama anlamı aşktan söz eden bir atasözü burada belirir. Etiketler de bu adımda taranır.",
      },
      {
        title: "Diller arası çeviri geçişi.",
        body: "Sistem, “amore” kelimesini tüm ifadelerin çevrilmiş sürümlerinde arar — Fransızca, İspanyolca ve Türkçe olanlar dâhil. “Avoir le cœur sur la main” (cömert olmak) gibi bir Fransız ifadesinin İtalyanca çevirisinde “amore” geçebilir ve burada su yüzüne çıkar. Uygulama diller arasındaki köprüyü böyle kurar.",
      },
      {
        title: "Kavram köprüsü.",
        body: "Sistem, “amore” kelimesini bilinen kavram etiketleriyle eşleştirmeye çalışır — aşk, romantizm ya da kalp kırıklığı gibi tematik etiketlerle. Eşleşme bulunursa, o kavramı taşıyan tüm ifadeler — hangi dilde olursa olsun — ayrı bir “Kavram ile” bölümünde belirir. En geniş ağ budur: kalp kırıklığıyla ilgili bir Türk deyimi, aşkla ilgili bir İtalyanca aramadan çıkabilir.",
      },
    ],
    searchOutro: "Her geçişin sonuçları, sonuç sayfasında görsel olarak ayrılır; böylece bir ifadenin neden göründüğünü her zaman bilirsiniz. Dört bölümün etiketleri şunlardır: Metinde · Anlama göre · Çeviri yoluyla · Kavram ile.",
    sectionConcepts: "Kavramlar ve alanlar: gezinmenin iki yolu",
    conceptsIntro: "Aramanın ötesinde uygulama, veritabanını keşfetmenin iki yolunu daha sunar — ve ikisi oldukça farklı çalışır. Aradaki farkı anlamak, gezinmeyi çok daha sezgisel kılar.",
    domainCard: {
      title: "Alan",
      body: "Birçok kavramı bir araya getiren geniş bir editoryal kategori. Örnekler: İş ve hırs, Para, İnsan ilişkileri, Mizah ve ironi. Toplam 16 alan vardır.",
    },
    conceptCard: {
      title: "Kavram",
      body: "Aynı fikri dile getiren ifadelerin paylaştığı özgül bir tematik etiket — dil fark etmeksizin. Örnekler: para, dostluk, ölüm, tembellik. Veritabanında 900'den fazla kavram vardır.",
    },
    conceptExplain: [
      "Arama menüsünde bir emojiye tıkladığınızda — aramayı açınca beliren ızgara — her emoji bir alanı temsil eder. Tıklamak sizi o alana göre filtrelenmiş bir sonuç sayfasına götürür: içindeki herhangi bir kavrama ait tüm ifadeler, tüm dillerde.",
      "Bir kavram etiketine tıkladığınızda — ifade kartlarında ya da alan sayfalarında görünen küçük etiketler — daha dar bir görünüme geçersiniz. Yalnızca o kavramı taşıyan ifadeler görünür. “Dostluk” kavramını aramak belki 5 dilde 40 ifade döndürür. İnsan ilişkileri alanını aramak yüzlercesini döndürür: dostluğun yanı sıra sadakat, ihanet, aile, aşk, yalnızlık.",
      "İki yol da aynı birleşik sonuç sayfasına çıkar: aynı düzen, aynı filtreler, dile veya ülkeye göre aynı daraltma imkânı. URL her zaman gezindiğiniz şeyi yansıtır — /search?domain=humor ya da /search?concept=sarcasm — böylece her görünüm paylaşılabilir.",
    ],
    conceptPull: "Alan mahalledir. Kavram sokaktır.",
    sectionSameIdea: "“Aynı fikir” bölümü",
    sameIdea: [
      "Her ifade sayfasında, ana içeriğin altında Diğer dillerde aynı fikir başlıklı bir bölüm bulursunuz. Uygulamanın çok dilli kalbi burasıdır.",
      "Kavram bağlantılarıyla çalışır: her ifade tematik bir etikete bağlıdır ve o etiketi paylaşan ifadeler burada gösterilir. Şansla ilgili bir Fransız ifadesi; Türk, İspanyol ve İtalyan kuzenlerini gösterecektir — imgeler ve metaforlar bambaşka olsa da aynı kültürel ağırlığı taşıyan ifadeleri. Her karşılık bir güven rozetiyle gösterilir: Birebir (tam olarak aynı anlam), Eşdeğer (çok yakın) ya da Aynı çizgide (akraba fikir).",
    ],
    sectionData: "Veriler",
    data: [
      "Veritabanı, kamuya açık dilbilim kaynaklarından oluşturuldu ve elle derlendi. Anlamlar, kökenler ve kullanım örnekleri kayıt kayıt yazıldı ya da doğrulandı — işin büyük kısmında yapay zekâ desteğiyle, kalite için insan gözetimiyle. Diller arası karşılıklar bir dil modeli (Mistral) tarafından üretildi ve güven düzeylerine göre puanlandı.",
      "Veritabanı eksiksiz değildir — hiçbir ifade veritabanı asla değildir. Diller büyür, argo değişir ve neyin “gerçek” bir ifade sayılacağı hep tartışmalıdır. Amaç genişlikten çok derinliktir: binlerce maddelik ham bir liste yerine, daha zengin içerikli daha az ifade.",
    ],
    sectionOpenSource: "Açık kaynak",
    openSource: "Kodun tamamı — FastAPI backend, Next.js frontend, veritabanı betikleri, zenginleştirme hatları — GitHub'da açık kaynaktır. Katkılara açığız: yeni ifadeler, düzeltmeler, çeviriler, tasarım iyileştirmeleri ya da fikirler.",
    githubLink: "github.com/sinsan67/world-expressions →",
    sectionVision: "Sırada ne var",
    visionIntro: "World Expressions yaşayan bir projedir. İşte gittiği yön.",
    visionItems: [
      {
        emoji: "🖼️",
        title: "Görselle gezinmek",
        body: "Yazmak yerine bir emojiye tıklayarak keşfetmek. Atomlar (🐱 = belirli bir kavram) ve moleküller (🐱🐶🐦 = koca bir alan) iki katmanlı görsel bir gezinme oluşturur — metin gerekmez. Bir alan emojisine tıklayınca, içindeki kavramlardan en az birini taşıyan tüm ifadeler gelir, tüm dillerde. Bir kavram emojisine tıklayınca, tam o fikri paylaşan ifadelere daralırsınız. Görselin muğlaklığı işin özüdür: tek emoji, onlarca ifade, yedi dil.",
      },
      {
        emoji: "🌐",
        title: "Monolog ve iki dilli modlar",
        body: "İfadeleri nasıl okuyacağınızı seçin: yalnızca özgün dile gömülerek (monolog — zorlanmak isteyen dil öğrenenler için ideal) ya da yanında her zaman kendi dilinizde bir çeviriyle (iki dilli — her şeyi bir bakışta anlamak isteyenler için). Tek bir kişisel ayar, tüm uygulamada tutarlı biçimde uygulanır.",
      },
      {
        emoji: "🎨",
        title: "Görsel evrenler",
        body: "Üç farklı sicil için üç farklı atmosfer: Gündelik dil (sıcak, tanıdık), Argo ve sokak (kentli, cesur), Atasözleri (klasik, zamansız). Her evrenin kendi görsel kimliği olacak — palet, tipografi, kart stili.",
      },
      {
        emoji: "🗺️",
        title: "Etkileşimli bir dünya haritası",
        body: "Atlas sayfası zaten var. Uzun vadeli vizyon: dünya SVG haritasında herhangi bir ülkeye tıklayıp ifadelerine dalmak. Fransa'nın bazı bölgeleri (Alsace, Bretagne) için bölgesel veriler zaten mevcut. Harita, veriler büyüdükçe büyüyecek — sonunda her ifadeyi doğduğu yere bağlayacak.",
      },
      {
        emoji: "🎮",
        title: "Üçüncü bir oyun",
        body: "Voyage ve Révision ilk ikisi. Sırada: ifadeleri bir dünya haritasında keşfetmek… ya da görüntünün belirsizliğinin oyunun kendisi olduğu emoji takımyıldızlarında gezinmek. Aramayı zaten çalıştıran aynı kavram sisteminin üzerine kurulu — ayrı bir veritabanına gerek yok.",
      },
    ],
    sectionContact: "Bize ulaşın",
    contact: "Sorular, bildirmek istediğiniz bir düzeltme, önermek istediğiniz gözde bir deyim — hepsi başımızın üstüne. Bize e-postayla ulaşabilir ya da projeyi Instagram'da bulabilirsiniz.",
    footer: "Merakla yapıldı. Herkesin gözü önünde inşa ediliyor.",
  },

  de: {
    eyebrow: "Über dieses Projekt",
    title: "Ein Liebesbrief\nan die Redewendungen.",
    subtitle: "Jede Sprache hat Ausdrücke, die sich der Übersetzung verweigern. Sie tragen zu viel in sich — Geschichte, Humor, die Textur des Alltags. Genau hier beginnt World Expressions.",
    intro: [
      "World Expressions ist eine freie, quelloffene Art, mit Redewendungen aus aller Welt zu spielen. Wählen Sie ein Spiel: Ziehen Sie zehn Karten bei Voyage und behalten Sie die, die Sie überraschen, oder blättern Sie bei Révision durch Ihre eigene Sammlung und sehen Sie, was hängen geblieben ist. Suchen Sie etwas Bestimmtes? Tippen Sie ein Wort, ein Gefühl oder eine Idee in die Suche ein und entdecken Sie, wie andere Sprachen dasselbe benennen. So oder so: Die Ergebnisse sind nie bloße Übersetzungen — sie sind Fenster in die Art, wie verschiedene Kulturen denken, streiten, lieben und scherzen.",
      "Die Datenbank umfasst derzeit über 14.000 Ausdrücke in 7 Sprachen — Französisch, Türkisch, Italienisch, Englisch, Spanisch, Deutsch und Japanisch — plus mehrere regionale Varianten des Spanischen (Mexiko, Argentinien, Kolumbien, Peru). Jeder Eintrag enthält eine Bedeutung; die meisten bieten außerdem eine Herkunftsgeschichte, ein Anwendungsbeispiel und Entsprechungen in anderen Sprachen. Das Projekt ist Open Source, wächst ständig und ist völlig kostenlos.",
    ],
    sectionPWA: "Eine App ohne App Store",
    pwaIntro: "World Expressions lässt sich wie eine App auf Ihrem Telefon oder Computer installieren — ohne Umweg über den App Store oder Play Store. Das nennt sich PWA (Progressive Web App): Die Website wird zu einem Symbol auf Ihrem Startbildschirm, funktioniert offline für bereits angesehene Ausdrücke und aktualisiert sich automatisch — nichts muss heruntergeladen oder genehmigt werden. Für ein freies, persönliches Projekt ist das die einfachste Wahl: keine Entwicklergebühren, keine App-Store-Prüfung, eine Codebasis für alle Plattformen.",
    pwaAndroid: {
      title: "Android, Chrome, Brave, Desktop",
      body: "Die Installation funktioniert direkt: Im Browsermenü erscheint ein Banner oder die Option „Zum Startbildschirm hinzufügen“.",
    },
    pwaIos: {
      title: "iPhone",
      body: "Nur Safari kann sie installieren — nicht Chrome oder Brave auf iOS, da Apple alle iOS-Browser auf dieselbe Engine wie Safari beschränkt. Öffnen Sie die Seite in Safari, tippen Sie auf Teilen, dann „Zum Home-Bildschirm“.",
    },
    sectionTypes: "Welche Arten von Ausdrücken?",
    typesIntro: "Nicht jede feste Wendung ist dasselbe. World Expressions unterscheidet vier Haupttypen — jeder mit eigenem Charakter und eigenem Verhältnis zur wörtlichen Bedeutung.",
    types: [
      {
        label: "Sprichwort · Proverb",
        title: "Ein vollständiger Satz mit einer Moral oder Weisheit.",
        body: "Sprichwörter sind kurze, in sich geschlossene Aussprüche — meist metaphorisch —, die kollektive Weisheit verdichten. Sie funktionieren wie Argumente: Man zitiert ein Sprichwort, um zu rechtfertigen oder zu warnen. Sie sind oft alt, oft anonym, sehr konkret in ihren Bildern und sehr abstrakt in ihrer Bedeutung.",
        example: '"Qui sème le vent récolte la tempête." — Wer Wind sät, wird Sturm ernten.',
      },
      {
        label: "Redewendung · Idiom",
        title: "Eine feste Wendung, deren Sinn sich nicht Wort für Wort entschlüsseln lässt.",
        body: "Redewendungen sind das schlagende Herz der Umgangssprache. Wörtlich genommen ergeben die Wörter keinen Sinn — oder einen völlig anderen. Man lernt sie als Ganzes, nicht aus Einzelteilen zusammengesetzt. Wer eine Sprache neu lernt, kämpft am meisten mit Redewendungen, denn kein Vokabelwissen hilft, sie zu entschlüsseln.",
        example: '"Avoir le cafard." — Die Kakerlake haben. Bedeutung: traurig sein, niedergeschlagen sein.',
      },
      {
        label: "Fügung · Locution",
        title: "Eine feste Wortgruppe, die wie ein einziges grammatisches Element funktioniert.",
        body: "Fügungen sind eher grammatische Tiere — sie verhalten sich wie ein einzelnes Adverb, eine Präposition oder ein Adjektiv. Anders als bei Redewendungen ist ihr Sinn oft erratbar, aber sie müssen als Block verwendet werden. Man kann weder die Wörter umstellen noch Synonyme einsetzen. Sie geben der Sprache ihren idiomatischen Rhythmus.",
        example: '"En catimini." — Heimlich, in aller Stille, ohne Aufsehen zu erregen.',
      },
      {
        label: "Slang · Argot",
        title: "Informelles Register, oft aus bestimmten sozialen Gruppen.",
        body: "Slang ist die lebendige Kante der Sprache. Er mutiert, veraltet schnell und markiert Zugehörigkeit. Ein Slangwort signalisiert: „Ich gehöre dazu, ich rede wie ihr.“ Manche Begriffe werden Mainstream und verlieren ihre Schärfe; andere bleiben für immer im Untergrund. Im Französischen funktioniert das Verlan durch Silbenumkehr: „femme“ wird zu „meuf“, „l'envers“ zu „verlan“.",
        example: '"Kiffer." — Etwas richtig gern mögen. Aus dem Arabischen "kif" (Vergnügen), über den französischen Straßenslang.',
      },
    ],
    sectionSearch: "Wie die Suche funktioniert",
    searchIntro: "Wenn Sie ein Wort in die Suchleiste tippen, sucht das System nicht einfach nach dieser exakten Zeichenkette in einer Datenbank. Es führt vier aufeinanderfolgende Durchläufe aus — jeder breiter als der vorherige — und ordnet die Ergebnisse nach Relevanz.",
    searchPull: "Nehmen wir einen italienischen Nutzer, der „amore“ eintippt. Hier ist genau, was passiert — Schritt für Schritt.",
    passes: [
      {
        title: "Exakte Übereinstimmung.",
        body: "Das System sucht nach „amore“ im Wortlaut jedes Ausdrucks, über alle Sprachen hinweg. Italienische Ausdrücke, die das Wort enthalten, erscheinen zuerst. Dieser Durchlauf ist schnell und präzise — er fängt die offensichtlichen Ergebnisse ein.",
      },
      {
        title: "Semantische Übereinstimmung.",
        body: "Das System durchsucht Bedeutung, Herkunft und Anwendungsbeispiel jedes Ausdrucks — weiterhin auf der Suche nach „amore“. Ein Sprichwort, dessen Bedeutung von Liebe spricht, ohne das Wort im Titel zu tragen, erscheint hier. Auch die Schlagwörter (Tags) werden in diesem Schritt durchsucht.",
      },
      {
        title: "Sprachübergreifender Übersetzungsdurchlauf.",
        body: "Das System sucht nach „amore“ in den übersetzten Fassungen aller Ausdrücke — auch der französischen, spanischen und türkischen. Ein französischer Ausdruck wie „avoir le cœur sur la main“ (großzügig sein) kann eine italienische Übersetzung haben, die „amore“ erwähnt — und taucht hier auf. So schlägt die App Brücken zwischen den Sprachen.",
      },
      {
        title: "Konzeptbrücke.",
        body: "Das System versucht, „amore“ bekannten Konzept-Schlagwörtern zuzuordnen — thematischen Etiketten wie Liebe, Romantik oder Liebeskummer. Wird eine Zuordnung gefunden, erscheint jeder Ausdruck mit diesem Konzept — in jeder Sprache — in einem eigenen Abschnitt „Nach Konzept“. Das ist das weiteste Netz: Ein türkischer Ausdruck über Liebeskummer kann aus einer italienischen Suche nach Liebe auftauchen.",
      },
    ],
    searchOutro: "Die Ergebnisse jedes Durchlaufs sind auf der Ergebnisseite optisch getrennt, sodass Sie immer wissen, warum ein Ausdruck erschienen ist. Die vier Abschnitte heißen: Im Text · Nach Bedeutung · Via Übersetzungen · Nach Konzept.",
    sectionConcepts: "Konzepte und Domänen: zwei Arten zu flanieren",
    conceptsIntro: "Jenseits der Suche bietet die App zwei weitere Wege, die Datenbank zu erkunden — und sie funktionieren recht unterschiedlich. Wer den Unterschied versteht, navigiert deutlich intuitiver.",
    domainCard: {
      title: "Domäne",
      body: "Eine breite redaktionelle Kategorie, die viele Konzepte bündelt. Beispiele: Arbeit & Ehrgeiz, Geld, Menschliche Beziehungen, Humor & Ironie. Es gibt insgesamt 16 Domänen.",
    },
    conceptCard: {
      title: "Konzept",
      body: "Ein präzises thematisches Etikett, das Ausdrücke mit derselben Idee teilen — unabhängig von der Sprache. Beispiele: Geld, Freundschaft, Tod, Faulheit. Es gibt über 900 Konzepte in der Datenbank.",
    },
    conceptExplain: [
      "Wenn Sie im Suchmenü auf ein Emoji klicken — das Raster, das beim Öffnen der Suche erscheint —, steht jedes Emoji für eine Domäne. Ein Klick führt zu einer nach dieser Domäne gefilterten Ergebnisseite: alle Ausdrücke, die zu irgendeinem ihrer Konzepte gehören, in allen Sprachen.",
      "Wenn Sie auf eine Konzept-Pille klicken — die kleinen Etiketten auf den Ausdruckskarten oder in den Domänenseiten —, gelangen Sie zu einer engeren Ansicht. Nur Ausdrücke mit genau diesem Konzept erscheinen. Die Suche nach „Freundschaft“ als Konzept liefert vielleicht 40 Ausdrücke in 5 Sprachen. Die Domäne Menschliche Beziehungen lieferte Hunderte: Freundschaft, aber auch Loyalität, Verrat, Familie, Liebe, Einsamkeit.",
      "Beide Wege führen zur selben einheitlichen Ergebnisseite — gleiches Layout, gleiche Filter, gleiche Möglichkeit, nach Sprache oder Land einzugrenzen. Die URL spiegelt immer wider, was Sie gerade erkunden — /search?domain=humor oder /search?concept=sarcasm — jede Ansicht ist also teilbar.",
    ],
    conceptPull: "Die Domäne ist das Viertel. Das Konzept ist die Straße.",
    sectionSameIdea: "Der Abschnitt „Dieselbe Idee“",
    sameIdea: [
      "Auf jeder Ausdrucksseite finden Sie unter dem Hauptinhalt einen Abschnitt mit dem Titel Dieselbe Idee in anderen Sprachen. Das ist das mehrsprachige Herz der App.",
      "Er funktioniert über Konzeptverknüpfungen: Jeder Ausdruck ist mit einem thematischen Etikett verbunden, und Ausdrücke mit demselben Etikett erscheinen hier. Ein französischer Ausdruck über Glück zeigt seine türkischen, spanischen und italienischen Cousinen — Ausdrücke mit demselben kulturellen Gewicht, auch wenn Bilder und Metaphern völlig verschieden sind. Jede Entsprechung trägt ein Vertrauensabzeichen: Spiegelbild (exakt dieselbe Bedeutung), Entsprechung (sehr nah) oder Gleiche Richtung (verwandte Idee).",
    ],
    sectionData: "Die Daten",
    data: [
      "Die Datenbank wurde aus öffentlichen linguistischen Quellen aufgebaut und von Hand kuratiert. Bedeutungen, Herkünfte und Anwendungsbeispiele wurden Eintrag für Eintrag geschrieben oder geprüft — mit KI-Unterstützung für den Großteil der Arbeit und menschlicher Durchsicht für die Qualität. Die sprachübergreifenden Entsprechungen wurden von einem Sprachmodell (Mistral) erzeugt und nach Vertrauensgrad bewertet.",
      "Die Datenbank ist nicht erschöpfend — keine Ausdrucksdatenbank ist das je. Sprachen wachsen, Slang wandelt sich, und was als „echter“ Ausdruck gilt, ist immer diskutabel. Das Ziel ist Tiefe statt Breite: weniger Ausdrücke mit reicherem Inhalt statt einer rohen Liste von Tausenden.",
    ],
    sectionOpenSource: "Open Source",
    openSource: "Der gesamte Code — FastAPI-Backend, Next.js-Frontend, Datenbankskripte, Anreicherungspipelines — ist auf GitHub quelloffen. Beiträge sind willkommen: neue Ausdrücke, Korrekturen, Übersetzungen, Designverbesserungen oder Ideen.",
    githubLink: "github.com/sinsan67/world-expressions →",
    sectionVision: "Wie es weitergeht",
    visionIntro: "World Expressions ist ein lebendiges Projekt. Hierhin geht die Reise.",
    visionItems: [
      {
        emoji: "🖼️",
        title: "Über Bilder navigieren",
        body: "Statt zu tippen, ein Emoji anklicken und erkunden. Atome (🐱 = ein bestimmtes Konzept) und Moleküle (🐱🐶🐦 = eine ganze Domäne) bilden zwei Ebenen visueller Navigation — ganz ohne Text. Ein Klick auf eine Domäne liefert alle Ausdrücke, die mindestens eines ihrer Konzepte enthalten, in allen Sprachen. Ein Klick auf ein Konzept grenzt auf Ausdrücke mit genau dieser Idee ein. Die Mehrdeutigkeit des Bildes ist das Prinzip: ein Emoji, Dutzende Ausdrücke, sieben Sprachen.",
      },
      {
        emoji: "🌐",
        title: "Monolog- und Zweisprachenmodus",
        body: "Wählen, wie man Ausdrücke liest: ganz eingetaucht in die Originalsprache (Monolog — ideal für Sprachlerner, die sich herausfordern wollen) oder immer mit einer Übersetzung in der eigenen Sprache daneben (zweisprachig — für alle, die alles auf einen Blick verstehen wollen). Eine einzige persönliche Einstellung, konsequent in der ganzen App angewendet.",
      },
      {
        emoji: "🎨",
        title: "Visuelle Universen",
        body: "Drei eigene Atmosphären für drei Register: Alltagssprache (warm, vertraut), Slang & Straße (urban, kühn), Sprichwörter (klassisch, zeitlos). Jedes Universum bekommt seine eigene visuelle Identität — Palette, Typografie, Kartenstil.",
      },
      {
        emoji: "🗺️",
        title: "Eine interaktive Weltkarte",
        body: "Die Atlas-Seite gibt es bereits. Die langfristige Vision: auf ein beliebiges Land einer SVG-Weltkarte klicken und in seine Ausdrücke eintauchen. Regionale Daten liegen für Teile Frankreichs (Elsass, Bretagne) schon vor. Die Karte wächst mit den Daten — bis irgendwann jeder Ausdruck mit seinem Geburtsort verknüpft ist.",
      },
      {
        emoji: "🎮",
        title: "Ein drittes Spiel",
        body: "Voyage und Révision sind die ersten beiden. Als Nächstes: Ausdrücke auf einer Weltkarte erkunden … oder durch Emoji-Konstellationen navigieren, bei denen die Mehrdeutigkeit des Bildes das Spiel selbst ist. Gebaut auf demselben Konzeptsystem, das schon die Suche antreibt — keine separate Datenbank nötig.",
      },
    ],
    sectionContact: "Kontakt",
    contact: "Fragen, eine Korrektur, ein Lieblingsausdruck als Vorschlag — alles ist willkommen. Sie erreichen uns per E-Mail oder finden das Projekt auf Instagram.",
    footer: "Mit Neugier gemacht. Öffentlich gebaut.",
  },

  ja: {
    eyebrow: "このプロジェクトについて",
    title: "世界の言い回しへの\nラブレター。",
    subtitle: "どの言語にも、翻訳を拒む表現があります。歴史、ユーモア、日々の暮らしの手ざわり——抱えているものが多すぎるのです。World Expressions はそこから始まります。",
    intro: [
      "World Expressions は、世界中の慣用表現で遊べる無料・オープンソースの仕組みです。ゲームを選んでください。Voyage で10枚のカードを引いて、驚いたものを手元に残す。あるいは Révision で自分のコレクションをめくり返し、頭に残っているかどうかを確かめる。何か特定のものを探しているなら?検索に単語や気持ち、アイデアを入力すれば、さまざまな言語が同じものをどう名づけているかを発見できます。どちらの道でも、結果は単なる翻訳ではありません——異なる文化がどう考え、どう議論し、どう愛し、どう笑うのかを覗く窓なのです。",
      "データベースには現在、7言語で14,000以上の表現が収録されています——フランス語、トルコ語、イタリア語、英語、スペイン語、ドイツ語、日本語——さらにスペイン語の地域変種(メキシコ、アルゼンチン、コロンビア、ペルー)も。どの項目にも意味があり、多くには由来の物語、使用例、他言語での対応表現も付いています。プロジェクトはオープンソースで、拡大を続け、完全に無料です。",
    ],
    sectionPWA: "App Store のいらないアプリ",
    pwaIntro: "World Expressions は、App Store や Play Store を経由せずに、スマートフォンやパソコンにアプリのようにインストールできます。これは PWA(プログレッシブ・ウェブ・アプリ)と呼ばれる仕組みです。サイトがホーム画面のアイコンになり、一度見た表現はオフラインでも読め、自動で更新されます。ダウンロードも承認も不要。無料の個人プロジェクトには、いちばんシンプルな選択です。開発者登録料なし、App Store の審査なし、すべてのプラットフォームでひとつのコード。",
    pwaAndroid: {
      title: "Android、Chrome、Brave、パソコン",
      body: "インストールはそのまま動きます。ブラウザのメニューにバナーか「ホーム画面に追加」の項目が現れます。",
    },
    pwaIos: {
      title: "iPhone",
      body: "インストールできるのは Safari だけです——iOS の Chrome や Brave では不可。Apple がすべての iOS ブラウザに Safari と同じエンジンを課しているためです。Safari でサイトを開き、共有をタップして「ホーム画面に追加」を選んでください。",
    },
    sectionTypes: "どんな表現があるの?",
    typesIntro: "決まり文句がすべて同じというわけではありません。World Expressions は4つの主要なタイプを区別します——それぞれに個性があり、文字どおりの意味との距離感も異なります。",
    types: [
      {
        label: "ことわざ · Proverb",
        title: "教訓や知恵を宿した、完結したひとつの文。",
        body: "ことわざは短く自立した言い回しで——たいてい比喩的で——集団の知恵を凝縮しています。論拠として機能します。正当化するため、警告するために、人はことわざを引くのです。多くは古く、多くは作者不詳。イメージはきわめて具体的なのに、意味はきわめて抽象的です。",
        example: '"Qui sème le vent récolte la tempête." — 風を蒔く者は嵐を刈り取る。',
      },
      {
        label: "慣用句 · Idiom",
        title: "単語ごとに解読できない、固定された言い回し。",
        body: "慣用句はくだけた言葉の鼓動する心臓です。文字どおりに取ると意味をなさないか、まったく別の意味になります。部品から組み立てるのではなく、ひとかたまりで覚えるもの。言語の学習者が最も苦労するのが慣用句です。語彙の知識がいくらあっても解読の助けにならないからです。",
        example: '"Avoir le cafard." — ゴキブリを飼っている?いいえ。気分が沈んでいる、憂鬱だという意味です。',
      },
      {
        label: "成句 · Locution",
        title: "ひとつの文法要素として働く、固定された語のまとまり。",
        body: "成句はより文法的な生き物です——ひとつの副詞、前置詞、形容詞のようにふるまいます。慣用句と違って意味は推測できることが多いのですが、かたまりのまま使わなければなりません。語順を入れ替えることも、類義語に置き換えることもできません。言語に慣用的なリズムを与えるのは成句です。",
        example: '"En catimini." — こっそりと、ひそかに、目立たないように。',
      },
      {
        label: "俗語 · Slang",
        title: "特定の社会集団から生まれることの多い、くだけた言葉。",
        body: "俗語は言語の生きた刃です。変異し、すぐに古び、帰属を刻印します。俗語のひとことは「私は仲間だ、あなたたちと同じように話す」という合図。主流に取り込まれて切れ味を失う語もあれば、永遠にアンダーグラウンドに留まる語もあります。フランス語では、ヴェルラン(verlan)が音節をひっくり返して機能します。「femme」は「meuf」に、「l'envers」は「verlan」になるのです。",
        example: '"Kiffer." — 何かが大好きだということ。アラビア語の "kif"(快楽)から、フランスのストリートスラングを経て。',
      },
    ],
    sectionSearch: "検索のしくみ",
    searchIntro: "検索バーに単語を入力すると、システムはその文字列をデータベースから探すだけではありません。4段階のパスを順に実行し——後になるほど網が広がり——関連度順に結果を組み立てます。",
    searchPull: "「amore」と入力するイタリア語話者を例にとりましょう。何が起きるのか、順を追って正確に見ていきます。",
    passes: [
      {
        title: "完全一致。",
        body: "システムは、あらゆる言語のあらゆる表現の本文に「amore」が文字どおり現れる箇所を探します。この単語を含むイタリア語の表現が最初に出てきます。このパスは速く正確で——明白な結果を捉えます。",
      },
      {
        title: "意味の一致。",
        body: "システムは各表現の意味、由来、使用例を調べます——まだ「amore」を探しています。タイトルにその語を使わずに愛について語ることわざは、ここで現れます。タグもこの段階で検索されます。",
      },
      {
        title: "言語をまたぐ翻訳パス。",
        body: "システムは、すべての表現の翻訳版の中に「amore」を探します——フランス語、スペイン語、トルコ語のものも含めて。「avoir le cœur sur la main」(気前がよい)のようなフランス語の表現のイタリア語訳に「amore」が含まれていれば、ここで浮かび上がります。こうしてアプリは言語のあいだに橋を架けるのです。",
      },
      {
        title: "概念の橋渡し。",
        body: "システムは「amore」を既知の概念タグ——愛、ロマンス、失恋といったテーマのラベル——と照合しようとします。一致が見つかれば、その概念タグを持つすべての表現が——どの言語でも——「概念で」という独立したセクションに現れます。これが最も広い網です。失恋についてのトルコ語の表現が、愛についてのイタリア語の検索から浮かび上がることもあるのです。",
      },
    ],
    searchOutro: "各パスの結果は結果ページで視覚的に区切られているので、なぜその表現が現れたのかが常にわかります。4つのセクションのラベルは:テキスト内 · 意味で · 翻訳経由 · 概念で。",
    sectionConcepts: "概念とドメイン:さまよう2つの方法",
    conceptsIntro: "検索のほかに、アプリはデータベースを探索する2つの方法を用意しています——そして、この2つはかなり違うふるまいをします。違いを理解すると、ナビゲーションがずっと直感的になります。",
    domainCard: {
      title: "ドメイン",
      body: "多くの概念を束ねる、大きな編集上のカテゴリー。例:仕事と野心、お金、人間関係、ユーモアと皮肉。全部で16のドメインがあります。",
    },
    conceptCard: {
      title: "概念",
      body: "同じ考えを表す表現たちが共有する、精密なテーマのタグ——言語を問いません。例:お金、友情、死、怠け。データベースには900以上の概念があります。",
    },
    conceptExplain: [
      "検索メニューで絵文字をクリックすると——検索を開いたときに現れるグリッドです——それぞれの絵文字はドメインを表しています。クリックすると、そのドメインで絞り込まれた結果ページへ。中のどれかの概念に属するすべての表現が、すべての言語で表示されます。",
      "概念のタグをクリックすると——表現カードやドメインの結果ページに現れる小さなラベルです——より狭いビューに移ります。その概念を持つ表現だけが表示されます。「友情」を概念として探すと、5言語で40の表現が返ってくるかもしれません。人間関係のドメインなら数百件。友情だけでなく、忠誠、裏切り、家族、愛、孤独まで。",
      "どちらの道も、同じ統一された結果ページに行き着きます。同じレイアウト、同じフィルター、言語や国での同じ絞り込み。URL は常に今見ているものを映します——/search?domain=humor や /search?concept=sarcasm——だからどのビューも共有できます。",
    ],
    conceptPull: "ドメインは街区。概念は通り。",
    sectionSameIdea: "「同じ考え」セクション",
    sameIdea: [
      "どの表現ページにも、本文の下に他の言語での同じ考えというセクションがあります。ここがアプリの多言語の心臓部です。",
      "しくみは概念のつながりです。すべての表現はテーマのタグに結ばれ、そのタグを共有する表現がここに浮かび上がります。運についてのフランス語の表現は、トルコ語、スペイン語、イタリア語のいとこたちを見せてくれます——イメージや比喩はまったく違っても、同じ文化的な重みを担う表現たちを。各対応表現には信頼度のバッジが付きます:完全一致(意味がまったく同じ)、ほぼ同じ(とても近い)、同じ発想(関連するアイデア)。",
    ],
    sectionData: "データについて",
    data: [
      "データベースは公開されている言語資料から築かれ、手作業で整えられました。意味、由来、使用例は一項目ずつ書かれ、または検証されています——作業の大部分は AI の支援を受け、品質のために人間が見直しました。言語間の対応表現は言語モデル(Mistral)が生成し、信頼度でスコア付けされています。",
      "このデータベースは網羅的ではありません——表現のデータベースが網羅的であったためしはないのです。言語は育ち、俗語は移ろい、何が「本物の」表現かは常に議論の余地があります。目指すのは広さより深さ。何千もの生のリストではなく、より豊かな中身を持つ、より少ない表現です。",
    ],
    sectionOpenSource: "オープンソース",
    openSource: "コードのすべて——FastAPI のバックエンド、Next.js のフロントエンド、データベーススクリプト、データ拡充のパイプライン——は GitHub でオープンソースです。貢献を歓迎します。新しい表現、修正、翻訳、デザインの改善、アイデア。",
    githubLink: "github.com/sinsan67/world-expressions →",
    sectionVision: "これからのこと",
    visionIntro: "World Expressions は生きているプロジェクトです。向かう先はこちら。",
    visionItems: [
      {
        emoji: "🖼️",
        title: "画像でめぐる",
        body: "入力する代わりに、絵文字をクリックして探索する。原子(🐱 = ひとつの精密な概念)と分子(🐱🐶🐦 = まるごとのドメイン)が、テキスト不要の2段階の視覚ナビゲーションをつくります。ドメインの絵文字をクリックすれば、その概念をひとつでも含むすべての表現が、すべての言語で。概念の絵文字なら、まさにその考えを共有する表現へ絞り込み。画像の曖昧さこそが原理です。ひとつの絵文字、何十もの表現、7つの言語。",
      },
      {
        emoji: "🌐",
        title: "モノローグモードとバイリンガルモード",
        body: "表現の読み方を選べます。原語だけに浸るか(モノローグ——挑戦したい語学学習者に最適)、いつも自分の言語の訳を隣に表示するか(バイリンガル——ひと目ですべて理解したい人へ)。ひとつの個人設定が、アプリ全体に一貫して適用されます。",
      },
      {
        emoji: "🎨",
        title: "ビジュアルの宇宙",
        body: "3つの語域に3つの雰囲気を。日常のことば(あたたかく、親しみやすい)、俗語とストリート(都会的で、大胆)、ことわざ(古典的で、時を超える)。それぞれの宇宙が独自のビジュアルアイデンティティを持ちます——パレット、タイポグラフィ、カードのスタイル。",
      },
      {
        emoji: "🗺️",
        title: "インタラクティブな世界地図",
        body: "Atlas のページはすでにあります。長期のビジョンは、世界の SVG 地図で好きな国をクリックして、その国の表現に飛び込むこと。フランスの一部(アルザス、ブルターニュ)の地域データはすでに収録済み。地図はデータとともに育ち——やがてすべての表現を、それが生まれた場所に結びつけます。",
      },
      {
        emoji: "🎮",
        title: "3つ目のゲーム",
        body: "Voyage と Révision が最初の2つ。次にくるのは、世界地図で表現を探索すること……あるいは、画像の曖昧さそのものがゲームになる絵文字の星座をめぐること。検索エンジンをすでに動かしている概念システムの上に築かれます——別のデータベースは必要ありません。",
      },
    ],
    sectionContact: "お問い合わせ",
    contact: "質問、間違いの報告、お気に入りの表現の提案——なんでも歓迎です。メールで連絡するか、Instagram でプロジェクトを見つけてください。",
    footer: "好奇心とともに。公開の場で育てています。",
  },
};

const fallback = (lang: string): Content => CONTENT[lang] ?? CONTENT.en;

const s = {
  page: { flex: 1, padding: "2rem 2rem 6rem", maxWidth: 700, margin: "0 auto" } as React.CSSProperties,
  eyebrow: { fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "var(--terra)", marginBottom: "0.6rem" } as React.CSSProperties,
  title: { fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 2.8rem)", fontStyle: "italic", color: "var(--ink)", lineHeight: 1.15, marginBottom: "0.5rem", whiteSpace: "pre-line" as const } as React.CSSProperties,
  subtitle: { fontFamily: "var(--font-hand)", fontSize: "1rem", color: "var(--ink-softer)", fontStyle: "italic", marginBottom: "3rem", lineHeight: 1.6 } as React.CSSProperties,
  sectionTitle: { fontFamily: "var(--font-display)", fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--terra)", marginBottom: "1rem", marginTop: "3rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--paper-edge)" } as React.CSSProperties,
  body: { fontFamily: "var(--font-display)", fontSize: "0.92rem", color: "var(--ink-soft)", lineHeight: 1.85, marginBottom: "1.1rem" } as React.CSSProperties,
  pull: { borderLeft: "2px solid var(--terra)", paddingLeft: "1.1rem", fontFamily: "var(--font-hand)", fontSize: "1rem", fontStyle: "italic", color: "var(--ink)", lineHeight: 1.6, margin: "1.75rem 0" } as React.CSSProperties,
  typeCard: { background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: 10, padding: "1rem 1.1rem", marginBottom: "0.75rem" } as React.CSSProperties,
  typeLabel: { fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--plum)", marginBottom: "0.3rem" } as React.CSSProperties,
  typeTitle: { fontFamily: "var(--font-display)", fontSize: "0.95rem", color: "var(--ink)", marginBottom: "0.35rem", fontWeight: 600 } as React.CSSProperties,
  typeBody: { fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.65, marginBottom: "0.4rem" } as React.CSSProperties,
  example: { fontFamily: "var(--font-hand)", fontSize: "0.88rem", fontStyle: "italic", color: "var(--ink-softer)" } as React.CSSProperties,
  passStep: { display: "flex", gap: "0.85rem", marginBottom: "1rem", alignItems: "flex-start" } as React.CSSProperties,
  passNum: { flexShrink: 0, width: 24, height: 24, borderRadius: "50%", background: "var(--plum)", color: "#fff", fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2 } as React.CSSProperties,
  passBody: { fontFamily: "var(--font-body)", fontSize: "0.83rem", color: "var(--ink-soft)", lineHeight: 1.65 } as React.CSSProperties,
  diffRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" } as React.CSSProperties,
  codeInline: { fontFamily: "monospace", fontSize: "0.8rem", background: "var(--paper-edge)", color: "var(--ink)", padding: "1px 5px", borderRadius: 4 } as React.CSSProperties,
  link: { fontFamily: "var(--font-body)", fontSize: "0.88rem", color: "var(--plum)", textDecoration: "none", borderBottom: "1px solid var(--plum)", paddingBottom: 1, fontWeight: 500, display: "inline-block", marginRight: "1rem", marginTop: "0.5rem" } as React.CSSProperties,
  footer: { marginTop: "4rem", paddingTop: "1.5rem", borderTop: "1px solid var(--paper-edge)", fontFamily: "var(--font-hand)", fontSize: "0.88rem", fontStyle: "italic", color: "var(--ink-faint)" } as React.CSSProperties,
};

function diffCard(accent: string): React.CSSProperties {
  return { background: "var(--paper)", border: `1.5px solid ${accent}`, borderRadius: 10, padding: "0.9rem 1rem" };
}
function diffTitle(accent: string): React.CSSProperties {
  return { fontFamily: "var(--font-body)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: accent, marginBottom: "0.35rem" };
}
const diffBody: React.CSSProperties = { fontFamily: "var(--font-body)", fontSize: "0.8rem", color: "var(--ink-soft)", lineHeight: 1.55 };

export default function AboutPage() {
  const { uiLang } = useUILangContext();

  const t = fallback(uiLang);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cream)" }}>
      <Sidebar uiLang={uiLang} />
      <main className="wex-main" style={s.page}>
        <div style={s.eyebrow}>{t.eyebrow}</div>
        <h1 style={s.title}>{t.title}</h1>
        <p style={s.subtitle}>{t.subtitle}</p>

        <p style={s.body}>{t.intro[0]}</p>
        <p style={s.body}>{t.intro[1]}</p>

        {/* PWA */}
        <div style={s.sectionTitle}>{t.sectionPWA}</div>
        <p style={s.body}>{t.pwaIntro}</p>
        <div style={s.diffRow}>
          <div style={diffCard("var(--terra)")}>
            <div style={diffTitle("var(--terra)")}>{t.pwaAndroid.title}</div>
            <p style={diffBody}>{t.pwaAndroid.body}</p>
          </div>
          <div style={diffCard("var(--plum)")}>
            <div style={diffTitle("var(--plum)")}>{t.pwaIos.title}</div>
            <p style={diffBody}>{t.pwaIos.body}</p>
          </div>
        </div>

        {/* Expression types */}
        <div style={s.sectionTitle}>{t.sectionTypes}</div>
        <p style={s.body}>{t.typesIntro}</p>
        {t.types.map((type) => (
          <div key={type.label} style={s.typeCard}>
            <div style={s.typeLabel}>{type.label}</div>
            <div style={s.typeTitle}>{type.title}</div>
            <p style={s.typeBody}>{type.body}</p>
            <span style={s.example}>{type.example}</span>
          </div>
        ))}

        {/* Search */}
        <div style={s.sectionTitle}>{t.sectionSearch}</div>
        <p style={s.body}>{t.searchIntro}</p>
        <div style={s.pull}>{t.searchPull}</div>
        {t.passes.map((pass, i) => (
          <div key={i} style={s.passStep}>
            <div style={s.passNum}>{i + 1}</div>
            <div style={s.passBody}>
              <strong style={{ color: "var(--ink)" }}>{pass.title}</strong>{" "}{pass.body}
            </div>
          </div>
        ))}
        <p style={{ ...s.body, marginTop: "0.75rem" }}>{t.searchOutro}</p>

        {/* Concepts & domains */}
        <div style={s.sectionTitle}>{t.sectionConcepts}</div>
        <p style={s.body}>{t.conceptsIntro}</p>
        <div style={s.diffRow}>
          <div style={diffCard("var(--terra)")}>
            <div style={diffTitle("var(--terra)")}>{t.domainCard.title}</div>
            <p style={diffBody}>{t.domainCard.body}</p>
          </div>
          <div style={diffCard("var(--plum)")}>
            <div style={diffTitle("var(--plum)")}>{t.conceptCard.title}</div>
            <p style={diffBody}>{t.conceptCard.body}</p>
          </div>
        </div>
        <p style={s.body}>{t.conceptExplain[0]}</p>
        <p style={s.body}>{t.conceptExplain[1]}</p>
        <div style={s.pull}>{t.conceptPull}</div>
        <p style={s.body}>{t.conceptExplain[2]}</p>

        {/* Same idea */}
        <div style={s.sectionTitle}>{t.sectionSameIdea}</div>
        <p style={s.body}>{t.sameIdea[0]}</p>
        <p style={s.body}>{t.sameIdea[1]}</p>

        {/* Data */}
        <div style={s.sectionTitle}>{t.sectionData}</div>
        <p style={s.body}>{t.data[0]}</p>
        <p style={s.body}>{t.data[1]}</p>

        {/* Open source */}
        <div style={s.sectionTitle}>{t.sectionOpenSource}</div>
        <p style={s.body}>{t.openSource}</p>
        <a href="https://github.com/sinsan67/world-expressions" target="_blank" rel="noopener noreferrer" style={s.link}>
          {t.githubLink}
        </a>

        {/* Vision */}
        <div style={{ ...s.sectionTitle, marginTop: "3rem" }}>{t.sectionVision}</div>
        <p style={s.body}>{t.visionIntro}</p>
        {t.visionItems.map((item) => (
          <div key={item.title} style={{ display: "flex", gap: "1rem", marginBottom: "0.85rem", background: "var(--paper)", border: "1px solid var(--paper-edge)", borderRadius: 10, padding: "1rem 1.1rem" }}>
            <span style={{ fontSize: "1.4rem", flexShrink: 0, lineHeight: 1.4, marginTop: 1 }}>{item.emoji}</span>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontSize: "0.95rem", color: "var(--ink)", fontWeight: 600, marginBottom: "0.3rem" }}>{item.title}</div>
              <p style={{ fontFamily: "var(--font-body)", fontSize: "0.82rem", color: "var(--ink-soft)", lineHeight: 1.65, margin: 0 }}>{item.body}</p>
            </div>
          </div>
        ))}

        {/* Contact */}
        <div style={{ ...s.sectionTitle, marginTop: "2.5rem" }}>{t.sectionContact}</div>
        <p style={s.body}>{t.contact}</p>
        <div>
          <a href="mailto:worldsexpressions@proton.me" style={s.link}>worldsexpressions@proton.me →</a>
          <a href="https://www.instagram.com/world.expressions" target="_blank" rel="noopener noreferrer" style={s.link}>@world.expressions →</a>
        </div>

        <p style={s.footer}>{t.footer}</p>
      </main>
      <BottomNav uiLang={uiLang} />
    </div>
  );
}
