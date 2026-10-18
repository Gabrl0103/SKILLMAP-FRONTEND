// Contexto y preguntas frecuentes de cada habilidad del seed (pantalla de detalle, js/skill-detalle.js).
// Objeto JS y no un .json con fetch: funciona igual con Live Server, con file:// y dentro del .exe.
// - Clave: nombre de la habilidad tal como viene del backend (seed en español; el id depende del orden de siembra).
// - es / en: qué es, por qué importa en el mercado (sin cifras: el % real lo pone la pantalla), tiempo orientativo,
//   pasos para aprenderla y preguntas frecuentes [pregunta, respuesta].
// - resources: solo documentación oficial verificada. Una habilidad sin entrada muestra un estado vacío.

const SKILL_FAQ = {
  "React": {
    es: {
      what: "React es una biblioteca de JavaScript para construir interfaces de usuario a partir de componentes reutilizables. Cada componente describe cómo se ve la interfaz según su estado, y React actualiza la página cuando ese estado cambia.",
      market: "Es una de las bibliotecas más usadas en frontend, y las ofertas de frontend y full stack suelen pedirla junto a TypeScript.",
      time: "6–10 semanas",
      steps: [
        "Repasa JavaScript moderno: módulos, funciones flecha, desestructuración y promesas.",
        "Sigue el tutorial oficial de react.dev y crea componentes con props.",
        "Maneja estado y efectos con useState y useEffect.",
        "Construye una app pequeña que consuma una API real.",
        "Añade pruebas de componentes con Testing Library.",
      ],
      faq: [
        ["¿Necesito saber JavaScript antes?", "Sí. React es JavaScript: sin bases de funciones, arrays y objetos te costará entender los componentes."],
        ["¿React es un framework?", "Es una biblioteca centrada en la interfaz. Para rutas, datos y renderizado en el servidor se combina con frameworks como Next.js."],
        ["¿Qué son los hooks?", "Funciones como useState o useEffect que dan estado y efectos a los componentes de función."],
        ["¿Componentes de clase o de función?", "De función con hooks: es lo que enseña la documentación actual. Las clases siguen apareciendo en código antiguo."],
        ["¿Qué es JSX?", "Una sintaxis parecida a HTML dentro de JavaScript que se compila a llamadas de React. Es opcional, pero casi todo el código la usa."],
      ],
    },
    en: {
      what: "React is a JavaScript library for building user interfaces out of reusable components. Each component describes how the interface looks for a given state, and React updates the page when that state changes.",
      market: "It's one of the most widely used frontend libraries, and frontend and full-stack job postings often ask for it alongside TypeScript.",
      time: "6–10 weeks",
      steps: [
        "Review modern JavaScript: modules, arrow functions, destructuring and promises.",
        "Follow the official react.dev tutorial and build components with props.",
        "Handle state and effects with useState and useEffect.",
        "Build a small app that consumes a real API.",
        "Add component tests with Testing Library.",
      ],
      faq: [
        ["Do I need to know JavaScript first?", "Yes. React is JavaScript: without a grasp of functions, arrays and objects, components will be hard to follow."],
        ["Is React a framework?", "It's a library focused on the UI. For routing, data and server rendering it's paired with frameworks like Next.js."],
        ["What are hooks?", "Functions like useState or useEffect that give function components state and side effects."],
        ["Class or function components?", "Function components with hooks: that's what the current docs teach. Classes still show up in older code."],
        ["What is JSX?", "An HTML-like syntax inside JavaScript that compiles to React calls. It's optional, but almost all code uses it."],
      ],
    },
    resources: [
      { url: "https://react.dev/learn", es: "Aprende React (react.dev)", en: "Learn React (react.dev)" },
      { url: "https://react.dev/reference/react", es: "Referencia de la API de React", en: "React API reference" },
    ],
  },

  "TypeScript": {
    es: {
      what: "TypeScript es JavaScript con tipos estáticos. El compilador revisa el código antes de ejecutarlo y avisa de errores como pasar un número donde se esperaba un texto; al final se convierte en JavaScript normal.",
      market: "Es habitual en proyectos frontend y Node.js medianos y grandes, y las ofertas de React y Next.js lo piden con frecuencia.",
      time: "3–6 semanas (con JavaScript previo)",
      steps: [
        "Aprende los tipos básicos, las uniones y la inferencia de tipos.",
        "Describe objetos con interface y type.",
        "Configura un proyecto con tsconfig y el modo strict activado.",
        "Practica genéricos y tipos utilitarios como Partial o Pick.",
        "Migra a TypeScript un proyecto pequeño de JavaScript.",
      ],
      faq: [
        ["¿Reemplaza a JavaScript?", "No. TypeScript se compila a JavaScript, que es lo que ejecutan el navegador y Node.js."],
        ["¿Hace más lento el código?", "No. Los tipos desaparecen al compilar, así que no hay coste en tiempo de ejecución."],
        ["¿interface o type?", "Ambos describen la forma de un objeto. interface se puede extender y fusionar; type admite uniones y combinaciones. Lo importante es ser consistente."],
        ["¿Qué es el modo strict?", "Una opción del tsconfig que activa comprobaciones más estrictas, como los nulos. Se recomienda en proyectos nuevos."],
        ["¿Puedo usarlo con React?", "Sí. Los componentes se escriben en archivos .tsx y las props se tipan como cualquier objeto."],
      ],
    },
    en: {
      what: "TypeScript is JavaScript with static types. The compiler checks your code before it runs and flags mistakes like passing a number where text was expected; in the end it compiles to plain JavaScript.",
      market: "It's common in medium and large frontend and Node.js projects, and React and Next.js job postings frequently ask for it.",
      time: "3–6 weeks (with prior JavaScript)",
      steps: [
        "Learn the basic types, unions and type inference.",
        "Describe objects with interface and type.",
        "Set up a project with tsconfig and strict mode on.",
        "Practice generics and utility types like Partial or Pick.",
        "Migrate a small JavaScript project to TypeScript.",
      ],
      faq: [
        ["Does it replace JavaScript?", "No. TypeScript compiles to JavaScript, which is what browsers and Node.js run."],
        ["Does it make code slower?", "No. Types are erased when compiling, so there's no runtime cost."],
        ["interface or type?", "Both describe the shape of an object. interface can be extended and merged; type supports unions and combinations. What matters is being consistent."],
        ["What is strict mode?", "A tsconfig option that turns on stricter checks, such as null checks. It's recommended for new projects."],
        ["Can I use it with React?", "Yes. Components go in .tsx files and props are typed like any other object."],
      ],
    },
    resources: [
      { url: "https://www.typescriptlang.org/docs/handbook/intro.html", es: "TypeScript Handbook", en: "TypeScript Handbook" },
      { url: "https://www.typescriptlang.org/play", es: "TypeScript Playground (pruébalo en el navegador)", en: "TypeScript Playground (try it in the browser)" },
    ],
  },

  "Next.js": {
    es: {
      what: "Next.js es un framework de React para aplicaciones web completas. Añade enrutamiento basado en archivos, renderizado en el servidor y generación estática, y permite escribir lógica de servidor en el mismo proyecto.",
      market: "Muchas empresas que usan React lo eligen para sitios rápidos y con buen SEO, por eso aparece a menudo junto a React en ofertas frontend.",
      time: "4–6 semanas (con React previo)",
      steps: [
        "Asegura bien las bases de React antes de empezar.",
        "Sigue el curso oficial Next.js Learn.",
        "Practica el App Router: layouts, páginas y rutas dinámicas.",
        "Distingue Server y Client Components y cómo se obtienen datos en cada uno.",
        "Despliega un proyecto propio y mide su rendimiento.",
      ],
      faq: [
        ["¿Necesito saber React antes?", "Sí. Next.js se construye sobre React; sin sus bases, el framework se vuelve confuso."],
        ["¿App Router o Pages Router?", "El App Router es el recomendado para proyectos nuevos. El Pages Router sigue soportado y lo verás en proyectos existentes."],
        ["¿Qué es el renderizado en el servidor?", "El HTML se genera en el servidor antes de llegar al navegador, lo que mejora la primera carga y el SEO."],
        ["¿Qué son los Server Components?", "Componentes que se ejecutan solo en el servidor y no envían su JavaScript al navegador."],
        ["¿Solo se puede desplegar en Vercel?", "No. Vercel lo mantiene, pero Next.js funciona en cualquier servidor con Node.js o en contenedores."],
      ],
    },
    en: {
      what: "Next.js is a React framework for full web applications. It adds file-based routing, server rendering and static generation, and lets you write server logic in the same project.",
      market: "Many companies that use React pick it for fast, SEO-friendly sites, so it often appears next to React in frontend job postings.",
      time: "4–6 weeks (with prior React)",
      steps: [
        "Make sure your React basics are solid before starting.",
        "Follow the official Next.js Learn course.",
        "Practice the App Router: layouts, pages and dynamic routes.",
        "Tell Server and Client Components apart and how each one fetches data.",
        "Deploy a project of your own and measure its performance.",
      ],
      faq: [
        ["Do I need to know React first?", "Yes. Next.js is built on React; without its basics the framework gets confusing."],
        ["App Router or Pages Router?", "The App Router is recommended for new projects. The Pages Router is still supported and you'll see it in existing projects."],
        ["What is server rendering?", "The HTML is generated on the server before reaching the browser, which improves the first load and SEO."],
        ["What are Server Components?", "Components that run only on the server and don't send their JavaScript to the browser."],
        ["Can I only deploy it on Vercel?", "No. Vercel maintains it, but Next.js runs on any Node.js server or in containers."],
      ],
    },
    resources: [
      { url: "https://nextjs.org/docs", es: "Documentación de Next.js", en: "Next.js documentation" },
      { url: "https://nextjs.org/learn", es: "Curso oficial Next.js Learn", en: "Official Next.js Learn course" },
    ],
  },

  "Tailwind CSS": {
    es: {
      what: "Tailwind CSS es un framework de CSS basado en clases utilitarias: en lugar de escribir hojas de estilo, combinas clases pequeñas como p-4 o text-center en el HTML. Solo genera el CSS de las clases que usas.",
      market: "Es común en proyectos React y Next.js recientes, y suele aparecer en ofertas como complemento de esas tecnologías.",
      time: "1–3 semanas (con CSS previo)",
      steps: [
        "Repasa CSS: modelo de caja, flexbox y grid.",
        "Instala Tailwind siguiendo la guía oficial de tu herramienta.",
        "Maqueta una página con clases de espaciado, color y tipografía.",
        "Usa variantes como hover: o md: para estados y tamaños de pantalla.",
        "Personaliza el tema y extrae en componentes lo que se repite.",
      ],
      faq: [
        ["¿Sustituye saber CSS?", "No. Cada clase es una propiedad de CSS; sin entender CSS no sabrás qué clase usar."],
        ["¿El HTML no queda lleno de clases?", "Sí, es el compromiso de este enfoque. Se compensa extrayendo componentes reutilizables."],
        ["¿Genera un CSS enorme?", "No. Solo incluye las clases que encuentra en tu código."],
        ["¿Se puede personalizar?", "Sí. Colores, espaciados, fuentes y puntos de corte se definen en el tema del proyecto."],
      ],
    },
    en: {
      what: "Tailwind CSS is a CSS framework built on utility classes: instead of writing stylesheets, you combine small classes like p-4 or text-center in your HTML. It only generates the CSS for the classes you use.",
      market: "It's common in recent React and Next.js projects, and it often appears in job postings as a companion to those technologies.",
      time: "1–3 weeks (with prior CSS)",
      steps: [
        "Review CSS: the box model, flexbox and grid.",
        "Install Tailwind following the official guide for your tool.",
        "Build a page with spacing, color and typography classes.",
        "Use variants like hover: or md: for states and screen sizes.",
        "Customize the theme and extract repeated parts into components.",
      ],
      faq: [
        ["Does it replace knowing CSS?", "No. Each class is a CSS property; without understanding CSS you won't know which class to use."],
        ["Doesn't the HTML fill up with classes?", "Yes, that's the trade-off of this approach. It's offset by extracting reusable components."],
        ["Does it generate huge CSS?", "No. It only includes the classes it finds in your code."],
        ["Can it be customized?", "Yes. Colors, spacing, fonts and breakpoints are defined in the project's theme."],
      ],
    },
    resources: [
      { url: "https://tailwindcss.com/docs", es: "Documentación de Tailwind CSS", en: "Tailwind CSS documentation" },
    ],
  },

  "Testing": {
    es: {
      what: "Testing es escribir código que comprueba que tu código funciona: pruebas unitarias para piezas pequeñas, de integración para varias juntas y de extremo a extremo (E2E) que usan la app como un usuario. Se ejecutan de forma automática para detectar errores antes de publicar.",
      market: "Los equipos valoran que el código llegue probado, y saber escribir pruebas aparece en ofertas de frontend, backend y móvil.",
      time: "3–6 semanas para las bases",
      steps: [
        "Entiende los tipos de prueba: unitarias, de integración y E2E.",
        "Escribe tus primeras pruebas unitarias con el framework de tu lenguaje (Jest o Vitest en JavaScript, JUnit en Java).",
        "Prueba componentes de interfaz con Testing Library.",
        "Automatiza un flujo completo con Playwright.",
        "Haz que las pruebas se ejecuten en cada cambio dentro de tu pipeline de CI.",
      ],
      faq: [
        ["¿Qué pruebo primero?", "La lógica con reglas de negocio y los errores que ya ocurrieron una vez, para que no vuelvan."],
        ["¿Qué es TDD?", "Desarrollo guiado por pruebas: escribes la prueba antes del código y luego el código mínimo para que pase."],
        ["¿Necesito un 100 % de cobertura?", "No. La cobertura mide qué líneas se ejecutan, no si las pruebas comprueban lo importante."],
        ["¿Qué es un mock?", "Un sustituto controlado de una dependencia, como una API o una base de datos, para probar una pieza aislada."],
        ["¿Unitarias o E2E?", "Las dos: muchas unitarias rápidas y unas pocas E2E para los flujos críticos."],
      ],
    },
    en: {
      what: "Testing means writing code that checks your code works: unit tests for small pieces, integration tests for several together and end-to-end (E2E) tests that use the app like a user. They run automatically to catch bugs before release.",
      market: "Teams value code that arrives tested, and writing tests shows up in frontend, backend and mobile job postings.",
      time: "3–6 weeks for the basics",
      steps: [
        "Understand the kinds of tests: unit, integration and E2E.",
        "Write your first unit tests with your language's framework (Jest or Vitest in JavaScript, JUnit in Java).",
        "Test UI components with Testing Library.",
        "Automate a full flow with Playwright.",
        "Make the tests run on every change in your CI pipeline.",
      ],
      faq: [
        ["What should I test first?", "Logic with business rules and bugs that already happened once, so they don't come back."],
        ["What is TDD?", "Test-driven development: you write the test before the code, then the minimum code to make it pass."],
        ["Do I need 100% coverage?", "No. Coverage measures which lines run, not whether the tests check what matters."],
        ["What is a mock?", "A controlled stand-in for a dependency, like an API or a database, to test a piece in isolation."],
        ["Unit or E2E?", "Both: many fast unit tests and a few E2E tests for critical flows."],
      ],
    },
    resources: [
      { url: "https://jestjs.io/docs/getting-started", es: "Jest: primeros pasos", en: "Jest: getting started" },
      { url: "https://testing-library.com/docs/", es: "Documentación de Testing Library", en: "Testing Library documentation" },
      { url: "https://playwright.dev/docs/intro", es: "Playwright: instalación y primeros pasos", en: "Playwright: installation and first steps" },
    ],
  },

  "Java": {
    es: {
      what: "Java es un lenguaje orientado a objetos y de tipado estático que se ejecuta en la máquina virtual de Java (JVM). Se usa mucho en backends empresariales, banca y sistemas de gran escala.",
      market: "Sigue siendo un pilar del backend en grandes empresas, y aparece con frecuencia en ofertas junto a Spring Boot y SQL.",
      time: "8–12 semanas para las bases",
      steps: [
        "Aprende la sintaxis, los tipos y el control de flujo.",
        "Domina la orientación a objetos: clases, interfaces y herencia.",
        "Usa colecciones, genéricos y manejo de excepciones.",
        "Practica lambdas y la API de streams.",
        "Crea un proyecto con Maven o Gradle y pruébalo con JUnit.",
      ],
      faq: [
        ["¿Qué versión aprendo?", "Una versión LTS reciente, como Java 21 o 25: tienen soporte largo y son las que usan las empresas."],
        ["¿Java y JavaScript tienen relación?", "No. Solo comparten parte del nombre; son lenguajes distintos con usos distintos."],
        ["¿Qué es la JVM?", "La máquina virtual que ejecuta el bytecode de Java. Gracias a ella el mismo programa corre en Windows, macOS o Linux."],
        ["¿Maven o Gradle?", "Ambos gestionan dependencias y compilación. Maven es más declarativo; Gradle, más flexible. Aprende el que use tu equipo."],
        ["¿Sirve para Android?", "Sí, aunque Google recomienda Kotlin para apps Android nuevas."],
      ],
    },
    en: {
      what: "Java is an object-oriented, statically typed language that runs on the Java Virtual Machine (JVM). It's widely used in enterprise backends, banking and large-scale systems.",
      market: "It remains a backend mainstay at large companies, and it often appears in job postings alongside Spring Boot and SQL.",
      time: "8–12 weeks for the basics",
      steps: [
        "Learn the syntax, types and control flow.",
        "Master object orientation: classes, interfaces and inheritance.",
        "Use collections, generics and exception handling.",
        "Practice lambdas and the streams API.",
        "Create a project with Maven or Gradle and test it with JUnit.",
      ],
      faq: [
        ["Which version should I learn?", "A recent LTS version, like Java 21 or 25: they have long-term support and are what companies use."],
        ["Are Java and JavaScript related?", "No. They only share part of the name; they're different languages with different uses."],
        ["What is the JVM?", "The virtual machine that runs Java bytecode. Thanks to it, the same program runs on Windows, macOS or Linux."],
        ["Maven or Gradle?", "Both handle dependencies and builds. Maven is more declarative; Gradle, more flexible. Learn the one your team uses."],
        ["Is it used for Android?", "Yes, although Google recommends Kotlin for new Android apps."],
      ],
    },
    resources: [
      { url: "https://dev.java/learn/", es: "Aprende Java (dev.java)", en: "Learn Java (dev.java)" },
      { url: "https://docs.oracle.com/en/java/javase/", es: "Documentación de Java SE", en: "Java SE documentation" },
    ],
  },

  "Spring Boot": {
    es: {
      what: "Spring Boot es un framework de Java para crear aplicaciones y APIs listas para producción con poca configuración. Trae un servidor web integrado, configuración automática y starters que agrupan las dependencias más comunes.",
      market: "Es la opción habitual para APIs y microservicios en Java, por eso suele pedirse junto a Java en ofertas backend.",
      time: "4–8 semanas (con Java previo)",
      steps: [
        "Asegura las bases de Java y de orientación a objetos.",
        "Genera un proyecto con Spring Initializr.",
        "Crea una API REST con controladores y validación.",
        "Guarda datos con Spring Data JPA y una base relacional.",
        "Añade pruebas y protege la API con Spring Security.",
      ],
      faq: [
        ["¿Spring y Spring Boot son lo mismo?", "No. Spring Boot es una capa sobre Spring Framework que lo configura por ti con valores razonables."],
        ["¿Necesito instalar un servidor como Tomcat?", "No. El servidor viene integrado y la app se ejecuta como un programa Java normal."],
        ["¿Qué es la inyección de dependencias?", "Spring crea los objetos que tu código necesita y se los entrega, en lugar de que cada clase los cree."],
        ["¿Qué es un starter?", "Una dependencia que agrupa las librerías y la configuración de una función, como web o acceso a datos."],
        ["¿Puedo usarlo con Kotlin?", "Sí. Spring Boot soporta Kotlin además de Java."],
      ],
    },
    en: {
      what: "Spring Boot is a Java framework for building production-ready applications and APIs with little configuration. It ships with an embedded web server, auto-configuration and starters that bundle the most common dependencies.",
      market: "It's the usual choice for Java APIs and microservices, so backend job postings tend to ask for it alongside Java.",
      time: "4–8 weeks (with prior Java)",
      steps: [
        "Make sure your Java and object-oriented basics are solid.",
        "Generate a project with Spring Initializr.",
        "Build a REST API with controllers and validation.",
        "Store data with Spring Data JPA and a relational database.",
        "Add tests and secure the API with Spring Security.",
      ],
      faq: [
        ["Are Spring and Spring Boot the same?", "No. Spring Boot is a layer on top of Spring Framework that configures it for you with sensible defaults."],
        ["Do I need to install a server like Tomcat?", "No. The server is embedded and the app runs like a regular Java program."],
        ["What is dependency injection?", "Spring creates the objects your code needs and hands them over, instead of each class creating them."],
        ["What is a starter?", "A dependency that bundles the libraries and configuration for a feature, like web or data access."],
        ["Can I use it with Kotlin?", "Yes. Spring Boot supports Kotlin as well as Java."],
      ],
    },
    resources: [
      { url: "https://spring.io/projects/spring-boot", es: "Spring Boot (sitio oficial)", en: "Spring Boot (official site)" },
      { url: "https://spring.io/guides", es: "Guías oficiales de Spring", en: "Official Spring guides" },
      { url: "https://start.spring.io", es: "Spring Initializr", en: "Spring Initializr" },
    ],
  },

  "SQL": {
    es: {
      what: "SQL es el lenguaje estándar para consultar y modificar datos en bases de datos relacionales como PostgreSQL, MySQL o SQL Server. Con él filtras, combinas y agregas información guardada en tablas.",
      market: "Lo piden ofertas muy distintas, de backend, datos y análisis, porque casi toda aplicación guarda su información en una base relacional.",
      time: "3–5 semanas para las bases",
      steps: [
        "Consulta datos con SELECT, WHERE y ORDER BY.",
        "Combina tablas con los distintos tipos de JOIN.",
        "Resume datos con GROUP BY y funciones de agregación.",
        "Diseña tablas con claves primarias, foráneas y normalización.",
        "Aprende índices y a leer el plan de una consulta con EXPLAIN.",
      ],
      faq: [
        ["¿Con qué base de datos empiezo?", "PostgreSQL o SQLite: son gratuitas y están muy bien documentadas."],
        ["¿El SQL es igual en todas las bases?", "La parte estándar sí; cada motor añade sus propias funciones y extensiones."],
        ["¿Qué es un JOIN?", "Una forma de combinar filas de varias tablas a partir de una columna que las relaciona."],
        ["¿SQL o NoSQL?", "Dependen del caso. Las bases relacionales encajan con datos estructurados y relaciones; las NoSQL, con esquemas flexibles o volúmenes muy grandes."],
        ["¿Necesito SQL si uso un ORM?", "Sí. Te ayuda a entender y optimizar las consultas que genera el ORM."],
      ],
    },
    en: {
      what: "SQL is the standard language for querying and changing data in relational databases like PostgreSQL, MySQL or SQL Server. With it you filter, combine and aggregate information stored in tables.",
      market: "Very different job postings ask for it, from backend to data and analytics, because almost every application stores its data in a relational database.",
      time: "3–5 weeks for the basics",
      steps: [
        "Query data with SELECT, WHERE and ORDER BY.",
        "Combine tables with the different kinds of JOIN.",
        "Summarize data with GROUP BY and aggregate functions.",
        "Design tables with primary keys, foreign keys and normalization.",
        "Learn indexes and how to read a query plan with EXPLAIN.",
      ],
      faq: [
        ["Which database should I start with?", "PostgreSQL or SQLite: they're free and very well documented."],
        ["Is SQL the same in every database?", "The standard part is; each engine adds its own functions and extensions."],
        ["What is a JOIN?", "A way to combine rows from several tables based on a column that relates them."],
        ["SQL or NoSQL?", "It depends on the case. Relational databases fit structured data with relationships; NoSQL fits flexible schemas or very large volumes."],
        ["Do I need SQL if I use an ORM?", "Yes. It helps you understand and optimize the queries the ORM generates."],
      ],
    },
    resources: [
      { url: "https://www.postgresql.org/docs/current/tutorial.html", es: "Tutorial de PostgreSQL", en: "PostgreSQL tutorial" },
      { url: "https://www.sqlite.org/lang.html", es: "SQL en SQLite (referencia)", en: "SQL as understood by SQLite" },
    ],
  },

  "Docker": {
    es: {
      what: "Docker empaqueta una aplicación con todo lo que necesita (dependencias, configuración y sistema base) en una imagen. Esa imagen se ejecuta como contenedor y funciona igual en tu equipo, en un servidor o en la nube.",
      market: "Los contenedores son hoy una forma habitual de desplegar software, y las ofertas de backend y DevOps suelen pedir Docker.",
      time: "2–4 semanas",
      steps: [
        "Entiende imagen, contenedor y registro.",
        "Ejecuta contenedores de imágenes oficiales, como una base de datos.",
        "Escribe un Dockerfile para tu propia aplicación.",
        "Orquesta varios servicios en local con Docker Compose.",
        "Aplica buenas prácticas: imágenes pequeñas, builds multi-stage y nada de secretos en la imagen.",
      ],
      faq: [
        ["¿Un contenedor es una máquina virtual?", "No. Comparte el núcleo del sistema anfitrión, por eso arranca más rápido y ocupa menos."],
        ["¿Imagen o contenedor?", "La imagen es la plantilla de solo lectura; el contenedor es una instancia de esa imagen en ejecución."],
        ["¿Qué es Docker Compose?", "Una herramienta para definir y arrancar varios contenedores juntos con un solo archivo YAML."],
        ["¿Docker o Kubernetes?", "Docker construye y ejecuta contenedores; Kubernetes orquesta muchos contenedores en varios servidores."],
        ["¿Funciona en Windows?", "Sí, con Docker Desktop, que en Windows usa WSL 2."],
      ],
    },
    en: {
      what: "Docker packages an application with everything it needs (dependencies, configuration and base system) into an image. That image runs as a container and behaves the same on your machine, a server or the cloud.",
      market: "Containers are now a common way to ship software, and backend and DevOps job postings often ask for Docker.",
      time: "2–4 weeks",
      steps: [
        "Understand image, container and registry.",
        "Run containers from official images, like a database.",
        "Write a Dockerfile for your own application.",
        "Run several services locally with Docker Compose.",
        "Apply good practices: small images, multi-stage builds and no secrets in the image.",
      ],
      faq: [
        ["Is a container a virtual machine?", "No. It shares the host's kernel, which is why it starts faster and takes up less space."],
        ["Image or container?", "The image is the read-only template; the container is a running instance of that image."],
        ["What is Docker Compose?", "A tool to define and start several containers together from a single YAML file."],
        ["Docker or Kubernetes?", "Docker builds and runs containers; Kubernetes orchestrates many containers across several servers."],
        ["Does it work on Windows?", "Yes, with Docker Desktop, which uses WSL 2 on Windows."],
      ],
    },
    resources: [
      { url: "https://docs.docker.com/get-started/", es: "Docker: primeros pasos", en: "Docker: get started" },
      { url: "https://docs.docker.com/compose/", es: "Documentación de Docker Compose", en: "Docker Compose documentation" },
    ],
  },

  "Python": {
    es: {
      what: "Python es un lenguaje de propósito general con una sintaxis clara y legible. Se usa en análisis de datos, inteligencia artificial, automatización y desarrollo web.",
      market: "Es el lenguaje de referencia en ciencia de datos y machine learning, y también aparece en ofertas de backend y automatización.",
      time: "6–10 semanas para las bases",
      steps: [
        "Aprende la sintaxis, los tipos y las estructuras de datos: listas, diccionarios y conjuntos.",
        "Organiza el código en funciones y módulos.",
        "Trabaja con entornos virtuales (venv) e instala paquetes con pip.",
        "Lee y escribe archivos y maneja errores con excepciones.",
        "Construye un proyecto pequeño: un script de automatización o una API sencilla.",
      ],
      faq: [
        ["¿Python 2 o Python 3?", "Python 3. Python 2 dejó de mantenerse en 2020."],
        ["¿Qué es un entorno virtual?", "Una carpeta aislada con sus propias dependencias, para que cada proyecto use sus versiones sin chocar con otros."],
        ["¿Python es lento?", "En cálculo puro es más lento que lenguajes compilados, pero librerías como NumPy hacen el trabajo pesado en código optimizado."],
        ["¿Sirve para desarrollo web?", "Sí, con frameworks como Django, Flask o FastAPI."],
      ],
    },
    en: {
      what: "Python is a general-purpose language with clear, readable syntax. It's used in data analysis, artificial intelligence, automation and web development.",
      market: "It's the go-to language for data science and machine learning, and it also shows up in backend and automation job postings.",
      time: "6–10 weeks for the basics",
      steps: [
        "Learn the syntax, types and data structures: lists, dictionaries and sets.",
        "Organize code into functions and modules.",
        "Work with virtual environments (venv) and install packages with pip.",
        "Read and write files and handle errors with exceptions.",
        "Build a small project: an automation script or a simple API.",
      ],
      faq: [
        ["Python 2 or Python 3?", "Python 3. Python 2 stopped being maintained in 2020."],
        ["What is a virtual environment?", "An isolated folder with its own dependencies, so each project uses its own versions without clashing."],
        ["Is Python slow?", "For pure computation it's slower than compiled languages, but libraries like NumPy do the heavy lifting in optimized code."],
        ["Is it used for web development?", "Yes, with frameworks like Django, Flask or FastAPI."],
      ],
    },
    resources: [
      { url: "https://docs.python.org/3/tutorial/", es: "Tutorial oficial de Python", en: "Official Python tutorial" },
      { url: "https://docs.python.org/3/library/venv.html", es: "Entornos virtuales (venv)", en: "Virtual environments (venv)" },
    ],
  },

  "Machine Learning": {
    es: {
      what: "Machine Learning es la rama de la inteligencia artificial en la que un programa aprende patrones a partir de datos en lugar de seguir reglas escritas a mano. Con esos patrones predice, clasifica o agrupa información nueva.",
      market: "Es una habilidad central en roles de ciencia de datos y en equipos que integran IA en sus productos.",
      time: "3–6 meses (con Python y estadística)",
      steps: [
        "Asegura las bases: Python, estadística y algo de álgebra lineal.",
        "Distingue aprendizaje supervisado y no supervisado.",
        "Entrena y evalúa modelos con scikit-learn: separa entrenamiento y prueba y elige métricas.",
        "Detecta el sobreajuste y usa validación cruzada.",
        "Haz un proyecto completo con un conjunto de datos real, de la limpieza a la evaluación.",
      ],
      faq: [
        ["¿Necesito mucha matemática?", "Para empezar bastan estadística, álgebra lineal y nociones de cálculo. Se profundiza según avanzas."],
        ["¿Machine Learning o deep learning?", "El deep learning es una parte del machine learning que usa redes neuronales de muchas capas."],
        ["¿Qué es el sobreajuste?", "Cuando el modelo memoriza los datos de entrenamiento y falla con datos nuevos."],
        ["¿Con qué librería empiezo?", "scikit-learn: cubre los algoritmos clásicos con una interfaz uniforme y buena documentación."],
        ["¿Necesito una GPU?", "No para el machine learning clásico. Se vuelve útil al entrenar redes neuronales grandes."],
      ],
    },
    en: {
      what: "Machine Learning is the branch of artificial intelligence where a program learns patterns from data instead of following hand-written rules. With those patterns it predicts, classifies or groups new information.",
      market: "It's a core skill in data science roles and in teams that build AI into their products.",
      time: "3–6 months (with Python and statistics)",
      steps: [
        "Get the basics down: Python, statistics and some linear algebra.",
        "Tell supervised and unsupervised learning apart.",
        "Train and evaluate models with scikit-learn: split training and test data and choose metrics.",
        "Spot overfitting and use cross-validation.",
        "Do a full project with a real dataset, from cleaning to evaluation.",
      ],
      faq: [
        ["Do I need a lot of math?", "To start, statistics, linear algebra and some calculus are enough. You go deeper as you progress."],
        ["Machine learning or deep learning?", "Deep learning is a part of machine learning that uses neural networks with many layers."],
        ["What is overfitting?", "When the model memorizes the training data and fails on new data."],
        ["Which library should I start with?", "scikit-learn: it covers the classic algorithms with a uniform interface and good documentation."],
        ["Do I need a GPU?", "Not for classic machine learning. It becomes useful when training large neural networks."],
      ],
    },
    resources: [
      { url: "https://scikit-learn.org/stable/getting_started.html", es: "scikit-learn: primeros pasos", en: "scikit-learn: getting started" },
      { url: "https://scikit-learn.org/stable/user_guide.html", es: "Guía de usuario de scikit-learn", en: "scikit-learn user guide" },
    ],
  },

  "Pandas": {
    es: {
      what: "pandas es una biblioteca de Python para manipular y analizar datos en forma de tabla. Su estructura principal, el DataFrame, permite filtrar, agrupar, combinar y limpiar datos de CSV, Excel o bases de datos.",
      market: "Es una herramienta básica del día a día en análisis y ciencia de datos con Python.",
      time: "2–4 semanas (con Python previo)",
      steps: [
        "Entiende Series y DataFrame.",
        "Carga datos desde CSV o Excel y explóralos con head, info y describe.",
        "Selecciona y filtra filas y columnas con loc e iloc.",
        "Limpia valores nulos y corrige tipos de datos.",
        "Agrupa con groupby y combina tablas con merge.",
      ],
      faq: [
        ["¿pandas o Excel?", "pandas cuando los datos son grandes o el análisis se repite: el proceso queda escrito y se puede volver a ejecutar."],
        ["¿Qué es un DataFrame?", "Una tabla con filas y columnas etiquetadas, donde cada columna puede tener su propio tipo de dato."],
        ["¿loc o iloc?", "loc selecciona por etiquetas; iloc, por posición numérica."],
        ["¿Sirve para datos muy grandes?", "pandas trabaja en memoria. Si los datos no caben, se procesan por partes o se usan otras herramientas."],
        ["¿Necesito NumPy?", "pandas está construido sobre NumPy; conocer lo básico de NumPy ayuda a entenderlo."],
      ],
    },
    en: {
      what: "pandas is a Python library for handling and analyzing tabular data. Its main structure, the DataFrame, lets you filter, group, join and clean data from CSV, Excel or databases.",
      market: "It's an everyday tool in data analysis and data science with Python.",
      time: "2–4 weeks (with prior Python)",
      steps: [
        "Understand Series and DataFrame.",
        "Load data from CSV or Excel and explore it with head, info and describe.",
        "Select and filter rows and columns with loc and iloc.",
        "Clean missing values and fix data types.",
        "Group with groupby and join tables with merge.",
      ],
      faq: [
        ["pandas or Excel?", "pandas when the data is large or the analysis repeats: the process is written down and can be run again."],
        ["What is a DataFrame?", "A table with labeled rows and columns, where each column can have its own data type."],
        ["loc or iloc?", "loc selects by labels; iloc, by numeric position."],
        ["Does it handle very large data?", "pandas works in memory. If the data doesn't fit, it's processed in chunks or with other tools."],
        ["Do I need NumPy?", "pandas is built on NumPy; knowing NumPy's basics helps you understand it."],
      ],
    },
    resources: [
      { url: "https://pandas.pydata.org/docs/getting_started/index.html", es: "pandas: primeros pasos", en: "pandas: getting started" },
      { url: "https://pandas.pydata.org/docs/user_guide/10min.html", es: "10 minutos con pandas", en: "10 minutes to pandas" },
    ],
  },

  "Estadística": {
    es: {
      what: "La estadística reúne los métodos para resumir datos, medir su variabilidad y sacar conclusiones con una incertidumbre conocida. Es la base para interpretar experimentos, métricas y modelos predictivos.",
      market: "Es un requisito habitual en ofertas de ciencia y análisis de datos, porque permite saber si un resultado es real o fruto del azar.",
      time: "6–10 semanas para las bases",
      steps: [
        "Empieza por la estadística descriptiva: media, mediana y desviación típica.",
        "Aprende probabilidad y distribuciones como la normal y la binomial.",
        "Entiende el muestreo y los intervalos de confianza.",
        "Practica contrastes de hipótesis e interpreta el p-valor.",
        "Ajusta una regresión lineal con datos reales en Python.",
      ],
      faq: [
        ["¿Descriptiva o inferencial?", "La descriptiva resume los datos que tienes; la inferencial saca conclusiones sobre una población a partir de una muestra."],
        ["¿Qué es el p-valor?", "La probabilidad de ver un resultado al menos tan extremo si la hipótesis nula fuera cierta. No es la probabilidad de que la hipótesis sea verdadera."],
        ["¿Correlación implica causalidad?", "No. Dos variables pueden moverse juntas por azar o por una tercera causa."],
        ["¿Media o mediana?", "La mediana cuando hay valores extremos, porque no se deja arrastrar por ellos."],
      ],
    },
    en: {
      what: "Statistics is the set of methods for summarizing data, measuring its variability and drawing conclusions with known uncertainty. It's the basis for interpreting experiments, metrics and predictive models.",
      market: "It's a common requirement in data science and analytics job postings, because it tells you whether a result is real or due to chance.",
      time: "6–10 weeks for the basics",
      steps: [
        "Start with descriptive statistics: mean, median and standard deviation.",
        "Learn probability and distributions like the normal and the binomial.",
        "Understand sampling and confidence intervals.",
        "Practice hypothesis tests and interpret the p-value.",
        "Fit a linear regression with real data in Python.",
      ],
      faq: [
        ["Descriptive or inferential?", "Descriptive summarizes the data you have; inferential draws conclusions about a population from a sample."],
        ["What is a p-value?", "The probability of seeing a result at least as extreme if the null hypothesis were true. It isn't the probability that the hypothesis is true."],
        ["Does correlation imply causation?", "No. Two variables can move together by chance or because of a third cause."],
        ["Mean or median?", "The median when there are extreme values, because it isn't pulled by them."],
      ],
    },
    resources: [
      { url: "https://docs.python.org/3/library/statistics.html", es: "Módulo statistics de Python", en: "Python statistics module" },
    ],
  },

  "AWS": {
    es: {
      what: "AWS (Amazon Web Services) es la plataforma de nube de Amazon. Ofrece servicios bajo demanda como servidores (EC2), almacenamiento (S3), bases de datos gestionadas (RDS) y funciones sin servidor (Lambda), que se pagan según el uso.",
      market: "Es uno de los proveedores de nube más usados, y lo piden con frecuencia ofertas de cloud, DevOps y backend.",
      time: "6–10 semanas para las bases",
      steps: [
        "Aprende los conceptos: regiones, zonas de disponibilidad, IAM y el modelo de responsabilidad compartida.",
        "Crea una cuenta y configura alertas de facturación antes de nada.",
        "Practica con EC2, S3 y RDS.",
        "Entiende las redes básicas con VPC y grupos de seguridad.",
        "Despliega una función con Lambda y prepara una certificación de nivel inicial.",
      ],
      faq: [
        ["¿Cuesta dinero practicar?", "Hay un nivel gratuito para cuentas nuevas, pero algunos servicios cobran. Configura alertas de facturación y apaga lo que no uses."],
        ["¿Qué certificación hago primero?", "AWS Certified Cloud Practitioner para los fundamentos; Solutions Architect – Associate si buscas un rol técnico."],
        ["¿Qué es IAM?", "El servicio que controla quién puede hacer qué en tu cuenta, con usuarios, roles y permisos."],
        ["¿AWS, Azure o Google Cloud?", "Los conceptos se transfieren entre proveedores. Aprende el que más aparezca en las ofertas que te interesan."],
        ["¿Qué es serverless?", "Ejecutar código sin gestionar servidores: el proveedor escala y cobra solo por el uso, como en Lambda."],
      ],
    },
    en: {
      what: "AWS (Amazon Web Services) is Amazon's cloud platform. It offers on-demand services like servers (EC2), storage (S3), managed databases (RDS) and serverless functions (Lambda), paid for by usage.",
      market: "It's one of the most widely used cloud providers, and cloud, DevOps and backend job postings ask for it frequently.",
      time: "6–10 weeks for the basics",
      steps: [
        "Learn the concepts: regions, availability zones, IAM and the shared responsibility model.",
        "Create an account and set up billing alerts before anything else.",
        "Practice with EC2, S3 and RDS.",
        "Understand basic networking with VPCs and security groups.",
        "Deploy a function with Lambda and prepare for an entry-level certification.",
      ],
      faq: [
        ["Does practicing cost money?", "There's a free tier for new accounts, but some services charge. Set up billing alerts and shut down what you don't use."],
        ["Which certification first?", "AWS Certified Cloud Practitioner for the fundamentals; Solutions Architect – Associate if you're after a technical role."],
        ["What is IAM?", "The service that controls who can do what in your account, with users, roles and permissions."],
        ["AWS, Azure or Google Cloud?", "The concepts transfer between providers. Learn the one that shows up most in the job postings you care about."],
        ["What is serverless?", "Running code without managing servers: the provider scales it and charges only for usage, as with Lambda."],
      ],
    },
    resources: [
      { url: "https://aws.amazon.com/getting-started/", es: "AWS: primeros pasos", en: "AWS: getting started" },
      { url: "https://docs.aws.amazon.com/", es: "Documentación de AWS", en: "AWS documentation" },
    ],
  },

  "Kubernetes": {
    es: {
      what: "Kubernetes es una plataforma de código abierto que orquesta contenedores: decide en qué servidor corre cada uno, los reinicia si fallan y los escala según la carga. Describes el estado deseado en archivos YAML y Kubernetes se encarga de mantenerlo.",
      market: "Es muy usado para operar contenedores en producción, y aparece en ofertas de DevOps, SRE y cloud.",
      time: "6–10 semanas (con Docker previo)",
      steps: [
        "Domina Docker y los contenedores antes de empezar.",
        "Aprende los objetos básicos: Pod, Deployment y Service.",
        "Monta un clúster local con minikube o kind y usa kubectl.",
        "Gestiona configuración con ConfigMaps y Secrets, y datos con volúmenes.",
        "Expón la app con Ingress, escálala y empaquétala con Helm.",
      ],
      faq: [
        ["¿Necesito saber Docker antes?", "Sí. Kubernetes ejecuta contenedores; sin entenderlos, sus conceptos cuestan mucho más."],
        ["¿Qué es un Pod?", "La unidad mínima que se despliega: uno o varios contenedores que comparten red y almacenamiento."],
        ["¿Lo necesito para proyectos pequeños?", "A menudo no. Su valor aparece cuando hay muchos servicios o mucha carga que gestionar."],
        ["¿Qué es Helm?", "Un gestor de paquetes para Kubernetes que agrupa y versiona los archivos de una aplicación."],
        ["¿Tengo que montar el clúster yo?", "No siempre. Los proveedores de nube ofrecen Kubernetes gestionado, como EKS en AWS, GKE en Google Cloud o AKS en Azure."],
      ],
    },
    en: {
      what: "Kubernetes is an open-source platform that orchestrates containers: it decides which server each one runs on, restarts them if they fail and scales them with the load. You describe the desired state in YAML files and Kubernetes keeps it that way.",
      market: "It's widely used to run containers in production, and it appears in DevOps, SRE and cloud job postings.",
      time: "6–10 weeks (with prior Docker)",
      steps: [
        "Master Docker and containers before starting.",
        "Learn the basic objects: Pod, Deployment and Service.",
        "Set up a local cluster with minikube or kind and use kubectl.",
        "Manage configuration with ConfigMaps and Secrets, and data with volumes.",
        "Expose the app with Ingress, scale it and package it with Helm.",
      ],
      faq: [
        ["Do I need to know Docker first?", "Yes. Kubernetes runs containers; without understanding them, its concepts are much harder."],
        ["What is a Pod?", "The smallest deployable unit: one or more containers that share networking and storage."],
        ["Do I need it for small projects?", "Often not. Its value shows when there are many services or a lot of load to manage."],
        ["What is Helm?", "A package manager for Kubernetes that bundles and versions an application's files."],
        ["Do I have to set up the cluster myself?", "Not always. Cloud providers offer managed Kubernetes, like EKS on AWS, GKE on Google Cloud or AKS on Azure."],
      ],
    },
    resources: [
      { url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/", es: "Kubernetes: lo básico (tutorial)", en: "Learn Kubernetes basics (tutorial)" },
      { url: "https://kubernetes.io/docs/concepts/", es: "Conceptos de Kubernetes", en: "Kubernetes concepts" },
    ],
  },

  "Terraform": {
    es: {
      what: "Terraform es una herramienta de infraestructura como código: describes servidores, redes y bases de datos en archivos de configuración (HCL) y Terraform los crea o modifica en la nube por ti. Así la infraestructura se versiona y se revisa como el código.",
      market: "Aparece a menudo en ofertas de cloud y DevOps, porque permite gestionar infraestructura de distintos proveedores con el mismo flujo de trabajo.",
      time: "3–5 semanas (con nociones de nube)",
      steps: [
        "Entiende qué es la infraestructura como código y por qué se usa.",
        "Instala Terraform y practica el ciclo init, plan, apply y destroy.",
        "Usa recursos, variables y outputs.",
        "Aprende cómo funciona el estado y guárdalo en un backend remoto.",
        "Organiza el código en módulos reutilizables.",
      ],
      faq: [
        ["¿Qué es el state?", "El archivo donde Terraform registra qué infraestructura creó, para saber qué cambiar en el siguiente apply."],
        ["¿plan o apply?", "plan muestra los cambios sin aplicarlos; apply los ejecuta. Revisa siempre el plan antes."],
        ["¿Solo sirve para AWS?", "No. Funciona con muchos proveedores mediante providers: AWS, Azure, Google Cloud y otros servicios."],
        ["¿Terraform u OpenTofu?", "OpenTofu es un fork abierto nacido tras el cambio de licencia de Terraform en 2023. Comparten la mayor parte del lenguaje y del flujo."],
        ["¿Terraform o Ansible?", "Terraform crea y cambia infraestructura; Ansible suele configurar el software dentro de los servidores. A menudo se usan juntos."],
      ],
    },
    en: {
      what: "Terraform is an infrastructure-as-code tool: you describe servers, networks and databases in configuration files (HCL) and Terraform creates or changes them in the cloud for you. That way infrastructure is versioned and reviewed like code.",
      market: "It often appears in cloud and DevOps job postings, because it manages infrastructure from different providers with the same workflow.",
      time: "3–5 weeks (with some cloud background)",
      steps: [
        "Understand what infrastructure as code is and why it's used.",
        "Install Terraform and practice the init, plan, apply and destroy cycle.",
        "Use resources, variables and outputs.",
        "Learn how state works and store it in a remote backend.",
        "Organize the code into reusable modules.",
      ],
      faq: [
        ["What is the state?", "The file where Terraform records what infrastructure it created, so it knows what to change on the next apply."],
        ["plan or apply?", "plan shows the changes without applying them; apply carries them out. Always review the plan first."],
        ["Is it only for AWS?", "No. It works with many providers through plugins called providers: AWS, Azure, Google Cloud and other services."],
        ["Terraform or OpenTofu?", "OpenTofu is an open fork created after Terraform's 2023 license change. They share most of the language and workflow."],
        ["Terraform or Ansible?", "Terraform creates and changes infrastructure; Ansible usually configures the software inside servers. They're often used together."],
      ],
    },
    resources: [
      { url: "https://developer.hashicorp.com/terraform/tutorials", es: "Tutoriales de Terraform", en: "Terraform tutorials" },
      { url: "https://developer.hashicorp.com/terraform/docs", es: "Documentación de Terraform", en: "Terraform documentation" },
    ],
  },

  "CI/CD": {
    es: {
      what: "CI/CD son prácticas para automatizar la entrega de software. La integración continua (CI) compila y prueba cada cambio al subirlo al repositorio; la entrega o el despliegue continuo (CD) llevan los cambios aprobados hasta producción de forma automática.",
      market: "Los equipos esperan que cada cambio pase por un pipeline automatizado, por eso CI/CD aparece en ofertas de DevOps y también de desarrollo.",
      time: "2–4 semanas",
      steps: [
        "Domina Git: ramas, pull requests y revisión de código.",
        "Crea un pipeline con GitHub Actions que ejecute las pruebas en cada push.",
        "Añade la compilación y la generación de artefactos o imágenes Docker.",
        "Despliega de forma automática a un entorno de pruebas.",
        "Gestiona secretos, aprobaciones manuales y la vuelta atrás (rollback).",
      ],
      faq: [
        ["¿Entrega o despliegue continuo?", "En la entrega continua el cambio queda listo y alguien aprueba el paso a producción; en el despliegue continuo llega solo."],
        ["¿Qué herramienta uso?", "GitHub Actions, GitLab CI o Jenkins son habituales. Los conceptos son los mismos en todas."],
        ["¿Qué es un pipeline?", "La secuencia automática de pasos, como compilar, probar y desplegar, que se ejecuta con cada cambio."],
        ["¿Dónde guardo contraseñas y keys?", "En los secretos de la herramienta de CI, nunca dentro del repositorio."],
        ["¿Necesito pruebas para tener CI?", "Sí. Sin pruebas, el pipeline solo comprueba que el código compila."],
      ],
    },
    en: {
      what: "CI/CD are practices for automating software delivery. Continuous integration (CI) builds and tests every change when it's pushed to the repository; continuous delivery or deployment (CD) takes approved changes to production automatically.",
      market: "Teams expect every change to go through an automated pipeline, so CI/CD shows up in DevOps and development job postings alike.",
      time: "2–4 weeks",
      steps: [
        "Master Git: branches, pull requests and code review.",
        "Create a GitHub Actions pipeline that runs the tests on every push.",
        "Add the build and the creation of artifacts or Docker images.",
        "Deploy automatically to a staging environment.",
        "Handle secrets, manual approvals and rollback.",
      ],
      faq: [
        ["Continuous delivery or deployment?", "With continuous delivery the change is ready and someone approves the move to production; with continuous deployment it goes out on its own."],
        ["Which tool should I use?", "GitHub Actions, GitLab CI or Jenkins are common. The concepts are the same in all of them."],
        ["What is a pipeline?", "The automatic sequence of steps, like build, test and deploy, that runs with every change."],
        ["Where do I keep passwords and keys?", "In the CI tool's secrets, never inside the repository."],
        ["Do I need tests to have CI?", "Yes. Without tests, the pipeline only checks that the code builds."],
      ],
    },
    resources: [
      { url: "https://docs.github.com/en/actions", es: "Documentación de GitHub Actions", en: "GitHub Actions documentation" },
    ],
  },

  "React Native": {
    es: {
      what: "React Native es un framework para crear apps móviles para iOS y Android con JavaScript o TypeScript y React. Comparte la mayor parte del código entre plataformas y muestra componentes nativos reales, no una página web.",
      market: "Muchas empresas lo eligen para mantener una sola base de código móvil, y aparece en ofertas móviles junto a TypeScript.",
      time: "4–8 semanas (con React previo)",
      steps: [
        "Asegura las bases de React y de TypeScript.",
        "Prepara el entorno con Expo, como recomienda la documentación oficial.",
        "Aprende los componentes básicos (View, Text, FlatList) y los estilos con flexbox.",
        "Añade navegación entre pantallas y consume una API.",
        "Prueba la app en un dispositivo real y genera una build de prueba.",
      ],
      faq: [
        ["¿Es igual que React para web?", "Comparte el modelo de componentes y estado, pero usa otros componentes: View en lugar de div, Text en lugar de p."],
        ["¿Qué es Expo?", "Un framework y conjunto de herramientas sobre React Native que simplifica crear, probar y publicar apps."],
        ["¿Necesito un Mac para iOS?", "Para compilar en local, sí (Xcode). Servicios de compilación en la nube, como EAS Build de Expo, permiten hacerlo sin Mac."],
        ["¿React Native o Flutter?", "Ambos son multiplataforma. React Native usa JavaScript y React; Flutter, el lenguaje Dart."],
      ],
    },
    en: {
      what: "React Native is a framework for building iOS and Android apps with JavaScript or TypeScript and React. It shares most of the code across platforms and renders real native components, not a web page.",
      market: "Many companies choose it to keep a single mobile codebase, and it appears in mobile job postings alongside TypeScript.",
      time: "4–8 weeks (with prior React)",
      steps: [
        "Make sure your React and TypeScript basics are solid.",
        "Set up the environment with Expo, as the official docs recommend.",
        "Learn the core components (View, Text, FlatList) and styling with flexbox.",
        "Add navigation between screens and consume an API.",
        "Test the app on a real device and create a test build.",
      ],
      faq: [
        ["Is it the same as React for the web?", "It shares the component and state model, but uses other components: View instead of div, Text instead of p."],
        ["What is Expo?", "A framework and set of tools on top of React Native that makes building, testing and publishing apps simpler."],
        ["Do I need a Mac for iOS?", "To build locally, yes (Xcode). Cloud build services, like Expo's EAS Build, let you do it without a Mac."],
        ["React Native or Flutter?", "Both are cross-platform. React Native uses JavaScript and React; Flutter, the Dart language."],
      ],
    },
    resources: [
      { url: "https://reactnative.dev/docs/getting-started", es: "Documentación de React Native", en: "React Native documentation" },
      { url: "https://docs.expo.dev/", es: "Documentación de Expo", en: "Expo documentation" },
    ],
  },

  "Kotlin": {
    es: {
      what: "Kotlin es un lenguaje moderno creado por JetBrains que se ejecuta en la JVM y es interoperable con Java. Es más conciso que Java y su sistema de tipos ayuda a evitar errores con valores nulos; Google lo recomienda para desarrollar en Android.",
      market: "Es el lenguaje preferente para apps Android nuevas y también se usa en backend, por eso aparece en ofertas móviles y de la JVM.",
      time: "4–8 semanas",
      steps: [
        "Aprende la sintaxis: val y var, null safety y data classes.",
        "Practica funciones, lambdas y colecciones.",
        "Instala Android Studio y crea interfaces con Jetpack Compose.",
        "Maneja tareas asíncronas con corrutinas.",
        "Construye una app pequeña que consuma una API.",
      ],
      faq: [
        ["¿Necesito saber Java antes?", "No es obligatorio, pero ayuda a entender el ecosistema y las librerías de la JVM."],
        ["¿Solo sirve para Android?", "No. También se usa en backend y para compartir código entre plataformas con Kotlin Multiplatform."],
        ["¿Qué es null safety?", "El compilador distingue los tipos que pueden ser nulos de los que no, y te obliga a manejar el caso nulo."],
        ["¿Qué son las corrutinas?", "La forma de Kotlin de escribir código asíncrono, como llamadas de red, sin bloquear la app y con código secuencial."],
        ["¿Qué es Jetpack Compose?", "El kit moderno de Android para construir interfaces de forma declarativa con funciones de Kotlin."],
      ],
    },
    en: {
      what: "Kotlin is a modern language created by JetBrains that runs on the JVM and interoperates with Java. It's more concise than Java and its type system helps avoid null-value errors; Google recommends it for Android development.",
      market: "It's the preferred language for new Android apps and it's also used on the backend, so it appears in mobile and JVM job postings.",
      time: "4–8 weeks",
      steps: [
        "Learn the syntax: val and var, null safety and data classes.",
        "Practice functions, lambdas and collections.",
        "Install Android Studio and build UIs with Jetpack Compose.",
        "Handle asynchronous work with coroutines.",
        "Build a small app that consumes an API.",
      ],
      faq: [
        ["Do I need to know Java first?", "It isn't required, but it helps you understand the JVM ecosystem and its libraries."],
        ["Is it only for Android?", "No. It's also used on the backend and to share code across platforms with Kotlin Multiplatform."],
        ["What is null safety?", "The compiler tells nullable types apart from non-nullable ones and makes you handle the null case."],
        ["What are coroutines?", "Kotlin's way of writing asynchronous code, like network calls, without blocking the app and with sequential-looking code."],
        ["What is Jetpack Compose?", "Android's modern toolkit for building UIs declaratively with Kotlin functions."],
      ],
    },
    resources: [
      { url: "https://kotlinlang.org/docs/home.html", es: "Documentación de Kotlin", en: "Kotlin documentation" },
      { url: "https://developer.android.com/kotlin", es: "Kotlin en Android Developers", en: "Kotlin on Android Developers" },
    ],
  },

  "Swift": {
    es: {
      what: "Swift es el lenguaje de Apple para crear apps de iOS, iPadOS, macOS, watchOS y tvOS. Es moderno, seguro con los tipos y de código abierto; con SwiftUI las interfaces se construyen de forma declarativa.",
      market: "Es el lenguaje principal del desarrollo nativo en el ecosistema Apple, y lo piden las ofertas de desarrollo iOS.",
      time: "6–10 semanas",
      steps: [
        "Aprende las bases: opcionales, structs y clases, y enums.",
        "Experimenta en Xcode con playgrounds.",
        "Construye interfaces con SwiftUI y maneja su estado.",
        "Consume una API con async/await y Codable.",
        "Prueba la app en el simulador y en un dispositivo real.",
      ],
      faq: [
        ["¿Necesito un Mac?", "Para desarrollar y publicar apps de Apple, sí: Xcode solo funciona en macOS."],
        ["¿SwiftUI o UIKit?", "SwiftUI para proyectos nuevos; UIKit sigue presente en muchas apps existentes y conviene conocerlo."],
        ["¿Qué son los opcionales?", "Tipos que pueden tener un valor o no tenerlo (nil). Swift obliga a comprobarlo antes de usarlo."],
        ["¿Swift solo sirve para Apple?", "No. También funciona en Linux y se usa en servidores, aunque su uso principal sigue siendo Apple."],
        ["¿Qué necesito para publicar en la App Store?", "Una membresía del Apple Developer Program, que es de pago."],
      ],
    },
    en: {
      what: "Swift is Apple's language for building iOS, iPadOS, macOS, watchOS and tvOS apps. It's modern, type-safe and open source; with SwiftUI, interfaces are built declaratively.",
      market: "It's the main language for native development in the Apple ecosystem, and iOS job postings ask for it.",
      time: "6–10 weeks",
      steps: [
        "Learn the basics: optionals, structs and classes, and enums.",
        "Experiment in Xcode with playgrounds.",
        "Build interfaces with SwiftUI and manage their state.",
        "Consume an API with async/await and Codable.",
        "Test the app in the simulator and on a real device.",
      ],
      faq: [
        ["Do I need a Mac?", "To develop and publish Apple apps, yes: Xcode only runs on macOS."],
        ["SwiftUI or UIKit?", "SwiftUI for new projects; UIKit is still in many existing apps and worth knowing."],
        ["What are optionals?", "Types that may hold a value or none (nil). Swift makes you check before using them."],
        ["Is Swift only for Apple?", "No. It also runs on Linux and is used on servers, although its main use is still Apple."],
        ["What do I need to publish on the App Store?", "A membership in the Apple Developer Program, which is paid."],
      ],
    },
    resources: [
      { url: "https://docs.swift.org/swift-book/", es: "The Swift Programming Language", en: "The Swift Programming Language" },
      { url: "https://developer.apple.com/tutorials/swiftui", es: "Tutoriales de SwiftUI", en: "SwiftUI tutorials" },
      { url: "https://www.swift.org/documentation/", es: "Documentación de Swift (swift.org)", en: "Swift documentation (swift.org)" },
    ],
  },
};
