"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/home/Sidebar";
import BottomNav from "@/components/home/BottomNav";
import LangBar from "@/components/ui/LangBar";

type UILang = "fr" | "en" | "es" | "it" | "tr" | "de" | "ja";

type TypeCard = { label: string; title: string; body: string; example: string };
type Pass = { title: string; body: string };
type DiffCard = { title: string; body: string };

type Content = {
  eyebrow: string;
  title: string;
  subtitle: string;
  intro: [string, string];
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
      "World Expressions is a free, open-source database of idiomatic expressions from around the world. You type a word, a feeling, or an idea — and discover how different languages name the same thing. The results are not just translations: they are windows into how different cultures think, argue, love, and joke.",
      "The database currently holds over 1 500 expressions across French, English, Spanish, Italian, and Turkish. Each entry includes a meaning, an origin story, a usage example, and cross-language equivalents wherever they exist. The project is open source, continuously expanding, and entirely free.",
    ],
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
        body: "The system tries to match \"amore\" to known concept tags — thematic labels like love, romance, or heartbreak. If a match is found, every expression carrying that concept tag — in any language — appears under a distinct \"Same concept\" section. This is the widest net: a Turkish expression about heartbreak can surface from an Italian query about love.",
      },
    ],
    searchOutro: "Results from each pass are visually separated in the results page, so you always know why an expression appeared. The four sections are labeled: Exact match · By meaning · Same concept · Via translations.",
    sectionConcepts: "Concepts and domains: two ways to wander",
    conceptsIntro: "Beyond search, the app offers two other ways to explore the database — and they work quite differently. Understanding the difference makes navigation much more intuitive.",
    domainCard: {
      title: "Domain",
      body: "A broad editorial category grouping many concepts. Examples: Work & ambition, Money, Human relations, Humor & irony. There are 16 domains total.",
    },
    conceptCard: {
      title: "Concept",
      body: "A specific thematic tag shared by expressions that express the same idea — regardless of language. Examples: money, friendship, death, laziness. There are 540+ concepts in the database.",
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
    sectionContact: "Get in touch",
    contact: "Questions, a correction to report, a favourite expression to suggest — all welcome. You can reach out by email or find the project on Instagram.",
    footer: "Made with curiosity. Built in public.",
  },

  fr: {
    eyebrow: "À propos du projet",
    title: "Une lettre d'amour\naux idiotismes.",
    subtitle: "Chaque langue possède des expressions qui résistent à la traduction. Elles portent trop de choses — de l'histoire, de l'humour, la texture du quotidien. C'est là que World Expressions commence.",
    intro: [
      "World Expressions est une base de données libre et open source d'expressions idiomatiques du monde entier. Vous tapez un mot, un sentiment ou une idée — et vous découvrez comment différentes langues nomment la même chose. Les résultats ne sont pas de simples traductions : ce sont des fenêtres sur la façon dont différentes cultures pensent, se disputent, aiment et plaisantent.",
      "La base de données contient actuellement plus de 1 500 expressions en français, anglais, espagnol, italien et turc. Chaque entrée comprend une définition, une histoire d'origine, un exemple d'utilisation et des équivalents dans d'autres langues. Le projet est open source, en constante expansion et entièrement gratuit.",
    ],
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
        body: "Le système tente de faire correspondre « amore » à des étiquettes conceptuelles connues — des labels thématiques comme amour, romance ou peine de cœur. Si une correspondance est trouvée, toutes les expressions portant cette étiquette — dans toutes les langues — apparaissent dans les résultats sous une section distincte « Même concept ». C'est le filet le plus large : une expression turque sur le chagrin d'amour peut remonter depuis une recherche italienne sur l'amour.",
      },
    ],
    searchOutro: "Les résultats de chaque passe sont visuellement séparés sur la page de résultats, pour que vous sachiez toujours pourquoi une expression est apparue. Les quatre sections sont étiquetées : Correspondance exacte · Par le sens · Même concept · Via les traductions.",
    sectionConcepts: "Concepts et domaines : deux façons de flâner",
    conceptsIntro: "Au-delà de la recherche, l'application propose deux autres façons d'explorer la base de données — et elles fonctionnent très différemment. Comprendre cette distinction rend la navigation beaucoup plus intuitive.",
    domainCard: {
      title: "Domaine",
      body: "Une grande catégorie éditoriale regroupant de nombreux concepts. Exemples : Travail & ambition, Argent, Relations humaines, Humour & ironie. Il y a 16 domaines au total.",
    },
    conceptCard: {
      title: "Concept",
      body: "Une étiquette thématique précise partagée par des expressions qui expriment la même idée — quelle que soit la langue. Exemples : argent, amitié, mort, paresse. Il y a 540+ concepts dans la base de données.",
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
    sectionContact: "Nous contacter",
    contact: "Questions, correction à signaler, expression favorite à proposer — tout est bienvenu. Vous pouvez nous contacter par e-mail ou trouver le projet sur Instagram.",
    footer: "Fait avec curiosité. Construit en public.",
  },

  es: {
    eyebrow: "Sobre este proyecto",
    title: "Una carta de amor\na los modismos.",
    subtitle: "Cada lengua tiene expresiones que se resisten a la traducción. Llevan demasiado — historia, humor, la textura de la vida cotidiana. Aquí es donde comienza World Expressions.",
    intro: [
      "World Expressions es una base de datos gratuita y de código abierto de expresiones idiomáticas de todo el mundo. Escribe una palabra, un sentimiento o una idea — y descubre cómo diferentes idiomas nombran lo mismo. Los resultados no son simples traducciones: son ventanas a cómo diferentes culturas piensan, discuten, aman y bromean.",
      "La base de datos contiene actualmente más de 1 500 expresiones en francés, inglés, español, italiano y turco. Cada entrada incluye un significado, una historia de origen, un ejemplo de uso y equivalentes en otros idiomas. El proyecto es de código abierto, se expande continuamente y es completamente gratuito.",
    ],
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
        body: "El sistema intenta hacer coincidir \"amore\" con etiquetas conceptuales conocidas — etiquetas temáticas como amor, romance o desamor. Si se encuentra una coincidencia, todas las expresiones que llevan esa etiqueta — en cualquier idioma — aparecen bajo una sección \"Mismo concepto\". Esta es la red más amplia: una expresión turca sobre el desamor puede aparecer desde una búsqueda italiana sobre el amor.",
      },
    ],
    searchOutro: "Los resultados de cada pasada están separados visualmente en la página de resultados, para que siempre sepas por qué apareció una expresión. Las cuatro secciones se etiquetan: Coincidencia exacta · Por significado · Mismo concepto · Vía traducciones.",
    sectionConcepts: "Conceptos y dominios: dos formas de explorar",
    conceptsIntro: "Más allá de la búsqueda, la aplicación ofrece dos formas adicionales de explorar la base de datos — y funcionan de manera bastante diferente. Entender la diferencia hace que la navegación sea mucho más intuitiva.",
    domainCard: {
      title: "Dominio",
      body: "Una amplia categoría editorial que agrupa muchos conceptos. Ejemplos: Trabajo y ambición, Dinero, Relaciones humanas, Humor e ironía. Hay 16 dominios en total.",
    },
    conceptCard: {
      title: "Concepto",
      body: "Una etiqueta temática específica compartida por expresiones que expresan la misma idea — independientemente del idioma. Ejemplos: dinero, amistad, muerte, pereza. Hay más de 540 conceptos en la base de datos.",
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
    sectionContact: "Contacto",
    contact: "Preguntas, una corrección que reportar, una expresión favorita que sugerir — todo es bienvenido. Puedes contactarnos por correo electrónico o encontrar el proyecto en Instagram.",
    footer: "Hecho con curiosidad. Construido en público.",
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
  const [uiLang, setUiLang] = useState<UILang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("wex_lang");
    if (stored) setUiLang(stored as UILang);
  }, []);

  const t = fallback(uiLang);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--cream)" }}>
      <Sidebar uiLang={uiLang} />
      <main className="wex-main" style={s.page}>
        <div style={{ marginBottom: "2.5rem" }}>
          <LangBar uiLang={uiLang} onLangChange={setUiLang} />
        </div>

        <div style={s.eyebrow}>{t.eyebrow}</div>
        <h1 style={s.title}>{t.title}</h1>
        <p style={s.subtitle}>{t.subtitle}</p>

        <p style={s.body}>{t.intro[0]}</p>
        <p style={s.body}>{t.intro[1]}</p>

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
