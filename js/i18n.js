// Idioma de la interfaz: español (por defecto) o inglés. Sin librerías: dos diccionarios planos y t(clave).
// - HTML estático: data-i18n (texto), data-i18n-placeholder, data-i18n-aria-label y data-i18n-title. translatePage los
//   aplica al cargar y en cada cambio de idioma.
// - Vistas dibujadas con JS: usan t() al pintar y se vuelven a pintar con el evento "skillmap:language".
// - El backend (/api/settings, campo language) es la fuente de verdad, como el tema (theme.js). Antes del login manda
//   la copia de localStorage.
// - Datos del backend (objetivos, habilidades) y sus mensajes de error se traducen aquí, sin tocar el seed: lo que no
//   está en el diccionario se muestra tal cual.
// Se carga antes que el resto de scripts: todos usan t().

const LANGUAGE_KEY = "skillmap-lang"; // misma clave que el script del <head> en index.html
const LANGUAGES = ["es", "en"];

const I18N = {
  es: {
    // Comunes
    "common.loading": "Cargando…",
    "common.soon": "Próximamente",
    "common.sample": "Datos de ejemplo",
    "common.newTab": " (se abre en otra pestaña)",
    "status.MASTERED": "Dominada",
    "status.IN_PROGRESS": "En desarrollo",
    "status.PENDING": "Por aprender",
    "category.none": "Sin categoría",
    "error.offline": "SkillMap no responde. Revisa que la app siga abierta e inténtalo de nuevo.",
    "error.server": "El servidor respondió con un error ({status}).",
    "error.loadTitle": "No pudimos cargar tus datos",
    "error.loadText": "El servidor de SkillMap no responde. Recarga la página en unos minutos para intentarlo de nuevo.",
    "error.techDetail": "Detalle técnico: servidor en {server} ({cmd} desde skillmap-api)",

    // Introducción
    "intro.skip": "Omitir",
    "intro.eyebrow": "Bienvenido",
    "intro.title": "Tu GPS de carrera",
    "intro.subtitle": "Mapea lo que sabes, mira qué piden las ofertas reales y traza la ruta hacia tu próximo rol.",
    "intro.start": "Empezar",
    "intro.chips": "SkillMap en cifras",
    "intro.chip.jobs.one": "oferta real",
    "intro.chip.jobs.other": "ofertas reales",
    "intro.chip.skills.one": "habilidad",
    "intro.chip.skills.other": "habilidades",
    "intro.chip.goals.one": "objetivo",
    "intro.chip.goals.other": "objetivos",
    "intro.slides": "Qué puedes hacer en SkillMap",
    "intro.slide1.title": "1 · Mapa de habilidades",
    "intro.slide1.text": "Mira lo que sabes y lo que te falta, en un solo mapa.",
    "intro.slide2.title": "2 · Demanda real",
    "intro.slide2.text": "Qué piden las ofertas de empleo, no lo que se supone.",
    "intro.slide3.title": "3 · Análisis con IA",
    "intro.slide3.text": "Pega una oferta y descubre qué tan compatible eres.",

    // Acceso
    "acceso.eyebrow": "Tu cuenta",
    "acceso.modes": "Elige cómo entrar",
    "acceso.login.title": "Bienvenido de nuevo",
    "acceso.login.subtitle": "Entra para seguir tu ruta donde la dejaste.",
    "acceso.login.submit": "Iniciar sesión",
    "acceso.login.busy": "Entrando…",
    "acceso.register.title": "Crea tu cuenta",
    "acceso.register.subtitle": "Tu progreso se guarda en este equipo, separado del de otras cuentas.",
    "acceso.register.submit": "Crear cuenta",
    "acceso.register.busy": "Creando cuenta…",
    "acceso.name": "Nombre",
    "acceso.email": "Correo",
    "acceso.password": "Contraseña",
    "acceso.showPassword": "Mostrar contraseña",
    "acceso.passwordHint": "Mínimo 8 caracteres.",
    "acceso.missingName": "Escribe tu nombre.",
    "acceso.missingEmail": "Escribe tu correo.",
    "acceso.missingPassword": "Escribe tu contraseña.",
    "acceso.shortPassword": "La contraseña debe tener al menos {min} caracteres.",
    "session.ended": "Tu sesión terminó. Inicia sesión de nuevo.",

    // Barra superior
    "nav.label": "Navegación principal",
    "nav.objetivo": "Objetivo",
    "nav.dashboard": "Mi Ruta",
    "nav.mapa": "Mapa Visual",
    "nav.analizador": "Analizador",
    "nav.perfil": "Perfil",
    "nav.ajustes": "Ajustes",
    "theme.label": "Tema",
    "theme.light": "Modo claro",
    "theme.dark": "Modo oscuro",
    "user.accountOf": "Cuenta de ",
    "user.logout": "Cerrar sesión",
    "user.loggingOut": "Cerrando sesión…",

    // Objetivo
    "objetivo.title": "¿Cuál es tu próximo gran salto?",
    "objetivo.subtitle": "Define tu objetivo profesional para que el GPS pueda trazar la ruta más eficiente hacia tu meta.",
    "objetivo.search": "Buscar objetivo",
    "objetivo.searchPlaceholder": "Busca un rol profesional (ej. Senior Frontend Engineer, UX Designer...)",
    "objetivo.loading": "Cargando objetivos…",
    "objetivo.empty": "Aún no hay objetivos profesionales disponibles.",
    "objetivo.noMatch": "Ningún objetivo coincide con “{query}”. Prueba con otra palabra o borra la búsqueda.",
    "objetivo.group": "Objetivos profesionales",
    "objetivo.skills.one": "{n} habilidad requerida",
    "objetivo.skills.other": "{n} habilidades requeridas",
    "objetivo.other": "Otro objetivo",
    "objetivo.otherText": "Crea tu propio rol personalizado",
    "objetivo.cta": "Trazar mi ruta personalizada",

    // Mi Ruta
    "ruta.goalEyebrow": "Objetivo actual",
    "ruta.noGoals": "Sin objetivos",
    "ruta.offline": "Sin conexión",
    "ruta.loading": "Cargando tu ruta…",
    "ruta.urgency.critical": "Crítica",
    "ruta.urgency.high": "Alta demanda",
    "ruta.urgency.medium": "Media",
    "ruta.market": "Mercado Laboral",
    "ruta.market.high": "Alta Demanda",
    "ruta.market.mid": "Demanda Media",
    "ruta.market.low": "Demanda Baja",
    "ruta.market.title": "Las habilidades de este objetivo aparecen en promedio en el {goal}% de las ofertas; las de todo el catálogo, en el {market}%",
    "ruta.gauge.title": "Nivel de Preparación",
    "ruta.gauge.aria": "{pct}% de preparación",
    "ruta.gauge.noSkills": "{goal} aún no tiene habilidades clave definidas.",
    "ruta.gauge.done": "Dominas todas las habilidades clave de {goal}.",
    "ruta.gauge.remaining.one": "Estás a solo {n} habilidad clave de alcanzar el perfil ideal para {goal}.",
    "ruta.gauge.remaining.other": "Estás a solo {n} habilidades clave de alcanzar el perfil ideal para {goal}.",
    "ruta.showGaps": "Ver detalle de brechas",
    "ruta.gaps.title": "Brechas Prioritarias",
    "ruta.gaps.hint": "Ordenadas por demanda",
    "ruta.gaps.demand": "Demanda: {pct}%",
    "ruta.gaps.none": "No tienes brechas pendientes: ya dominas todas las habilidades de este objetivo.",
    "ruta.next.eyebrow": "Siguiente acción",
    "ruta.next.progress": "Avanza en {skill}",
    "ruta.next.start": "Empieza con {skill}",
    "ruta.next.text": "Aparece en el {pct}% de las ofertas analizadas y es tu brecha con más demanda para {goal}.",
    "ruta.next.cta": "Empezar ahora",
    "ruta.trend.title": "Tendencia de Habilidades",
    "ruta.trend.months": "Ene,Feb,Mar,Abr,May,Jun",
    "ruta.trend.aria": "Tendencia de ejemplo: tu nivel frente a la demanda del mercado, enero a junio",
    "ruta.trend.point": "{month}: tu nivel {level}, demanda del mercado {demand}",
    "ruta.trend.level": "Tu Nivel",
    "ruta.trend.demand": "Demanda del mercado",
    "ruta.trend.tipLevel": "Tu nivel {n}",
    "ruta.trend.tipDemand": "Demanda {n}",
    "ruta.trend.caption": "Tendencia de habilidades (datos de ejemplo)",
    "ruta.trend.month": "Mes",
    "ruta.trend.levelCol": "Tu nivel",
    "demand.sample": "Demanda de ejemplo: aún no proviene de vacantes reales",
    "jobs.basedOn": "Basado en {n} ofertas reales",
    "jobs.routeFrom": "Ruta calculada con {n} ofertas reales",

    // Mapa Visual
    "mapa.loading": "Cargando tu mapa de habilidades…",
    "mapa.empty": "Aún no hay habilidades para mostrar en el mapa.",
    "mapa.stage": "Mapa de habilidades. Usa las flechas para recorrerlas y Enter para ver su detalle.",
    "mapa.zoom": "Zoom del mapa",
    "mapa.zoomIn": "Acercar",
    "mapa.zoomOut": "Alejar",
    "mapa.center": "Centrar mapa",
    "mapa.route": "Ruta sugerida",
    "mapa.panel": "Detalle de la habilidad",
    "mapa.node.label": "{name}, {category}, {status}, {pct}% de demanda",
    "mapa.node.sample": " (de ejemplo)",
    "mapa.node.tooltip": "{name} — {pct}% de demanda",
    "mapa.empty.title": "Selecciona una habilidad",
    "mapa.empty.text": "Haz clic en un nodo del mapa (o recórrelos con las flechas y pulsa Enter) para ver su demanda y su lugar en tu ruta.",
    "mapa.text.next": "Es tu siguiente giro hacia {goal}: la brecha con más demanda de tu ruta.",
    "mapa.text.gap": "Es la brecha {n} de {total} en tu ruta hacia {goal}, ordenada por demanda.",
    "mapa.text.masteredInGoal": "Ya la dominas y suma a tu preparación para {goal}.",
    "mapa.text.inGoal": "Forma parte de tu objetivo {goal}.",
    "mapa.text.MASTERED": "Ya la dominas.",
    "mapa.text.IN_PROGRESS": "La estás desarrollando.",
    "mapa.text.PENDING": "Aún no la has empezado.",
    "mapa.text.notInGoal": "{text} No forma parte de tu objetivo {goal}.",
    "mapa.pctOfJobs": "% de las ofertas",
    "mapa.marking": "Marcando…",
    "mapa.unmarking": "Quitando…",
    "mapa.mark": "Marcar como dominada",
    "mapa.unmark": "Quitar de dominadas",
    "mapa.selected": "{name} seleccionada. Detalle en el panel.",
    "mapa.marked": "{name} marcada como dominada.",
    "mapa.unmarked": "{name} quitada de dominadas: vuelve a Por aprender.",
    "mapa.markError": "No se pudo marcar: {error}",
    "mapa.unmarkError": "No se pudo quitar: {error}",

    // Detalle de habilidad
    "skill.context": "Ver contexto y preguntas frecuentes",
    "skill.contextFor": "Ver contexto y preguntas frecuentes de {name}",
    "skill.backTo": "Volver a {view}",
    "skill.loading": "Cargando la habilidad…",
    "skill.notFound": "No encontramos esta habilidad. Puede que ya no esté en el catálogo.",
    "skill.ofJobs": "de las ofertas",
    "skill.what": "Qué es",
    "skill.why": "Por qué importa para tu objetivo",
    "skill.why.demand": "Aparece en el {pct}% de las ofertas analizadas.",
    "skill.why.inGoal": "Forma parte de tu objetivo {goal}: es la n.º {rank} por demanda de sus {total} habilidades.",
    "skill.why.notInGoal": "No forma parte de tu objetivo {goal}.",
    "skill.why.noGoal": "Elige un objetivo para ver cómo encaja en tu ruta.",
    "skill.how": "Cómo aprenderla",
    "skill.time": "Tiempo orientativo: {time}",
    "skill.faq": "Preguntas frecuentes",
    "skill.resources": "Recursos",
    "skill.resourcesHint": "Documentación oficial",
    "skill.progress": "Tu progreso",
    "skill.empty.title": "Aún no tenemos guía para {name}",
    "skill.empty.text": "Estamos preparando qué es, cómo aprenderla y sus preguntas frecuentes. Mientras tanto, ya ves su demanda y puedes marcarla como dominada.",

    // Analizador
    "analyzer.title": "Analizador de Vacantes",
    "analyzer.subtitle": "Pega la descripción de una oferta laboral para analizar tu compatibilidad y detectar nuevas brechas.",
    "analyzer.label": "Descripción de la vacante",
    "analyzer.placeholder": "Pega aquí el texto completo de la oferta de trabajo...",
    "analyzer.emptyWarning": "Pega el texto de una oferta para analizarla.",
    "analyzer.submit": "Analizar Compatibilidad",
    "analyzer.analyzing": "Analizando…",
    "analyzer.limit": "Llegaste al límite de {max} caracteres.",
    "analyzer.aiUnavailable": "El servicio de IA no está disponible. Inténtalo de nuevo en un minuto.",
    "analyzer.timeout": "El análisis tardó demasiado. Intenta de nuevo en un minuto.",
    "analyzer.offline": "No se pudo conectar con el servidor.",
    "analyzer.match.none": "No reconocimos habilidades del catálogo en esta oferta. Prueba con la descripción completa, incluyendo requisitos y tecnologías.",
    "analyzer.match.high": "Tienes una compatibilidad alta. Dominas los requisitos principales pero te faltan un par de herramientas secundarias.",
    "analyzer.match.mid": "Tienes una compatibilidad media. Cubres parte de los requisitos; enfócate en las habilidades faltantes para acercarte al perfil.",
    "analyzer.match.low": "Tienes una compatibilidad baja. Esta vacante pide varias habilidades que aún no dominas: úsala como guía para tu ruta.",
    "analyzer.match.title": "Match con el perfil",
    "analyzer.match.aria": "{pct}% de compatibilidad",
    "analyzer.breakdown": "Desglose de Habilidades",
    "analyzer.mastered": "Habilidades dominadas",
    "analyzer.progress": "En desarrollo",
    "analyzer.missing": "Faltantes",
    "analyzer.groupEmpty": "Ninguna en esta vacante.",
    "analyzer.empty.title": "Aún no hay análisis",
    "analyzer.empty.text": "Pega la descripción de una oferta y pulsa “Analizar Compatibilidad” para ver tu porcentaje de match y las habilidades que te faltan.",
    "analyzer.stale.title": "Tu progreso cambió",
    "analyzer.stale.text": "Marcaste habilidades desde el último análisis. Pulsa “Analizar Compatibilidad” para ver tu porcentaje actualizado.",
    "analyzer.skeleton": "Analizando la oferta…",
    "analyzer.error.title": "No pudimos analizar la oferta",
    "analyzer.retry": "Reintentar",
    "analyzer.wake": "Despertando el servicio de IA, puede tardar hasta un minuto…",

    // Perfil
    "perfil.sample.bio": "Desarrollador Frontend con pasión por UX/UI y rendimiento web.",
    "perfil.sample.location": "Madrid, España",
    "perfil.sample.project1": "Diseño y desarrollo de un sistema de componentes para tiendas online con React y Tailwind.",
    "perfil.sample.project2": "Dashboard interactivo con visualización de datos en tiempo real usando Plotly y Next.js.",
    "perfil.sample.achievement1": "Primer objetivo alcanzado",
    "perfil.sample.achievement2": "Racha de 7 días de estudio",
    "perfil.sample.achievement3": "10 proyectos de código",
    "perfil.sample.pref1": "Búsqueda Activa",
    "perfil.sample.pref2": "Perfil Público",
    "perfil.photo": "Foto de perfil de {name}",
    "perfil.changePhoto": "Cambiar foto (próximamente)",
    "perfil.edit": "Editar Perfil",
    "perfil.exportCv": "Exportar CV",
    "perfil.groupMetricTitle": "Demanda promedio en vacantes de estas habilidades",
    "perfil.groupMetric": "Demanda media {n}%",
    "perfil.loadingSkills": "Cargando tus habilidades…",
    "perfil.mastered": "Dominadas",
    "perfil.masteredEmpty": "Aún no tienes habilidades dominadas.",
    "perfil.learning": "En aprendizaje",
    "perfil.learningEmpty": "No estás aprendiendo ninguna habilidad ahora mismo.",
    "perfil.skills": "Mis Habilidades",
    "perfil.projects": "Proyectos Destacados",
    "perfil.addProject": "+ Añadir Proyecto",
    "perfil.masteredStat": "Habilidades Dominadas",
    "perfil.courses": "Cursos Completados",
    "perfil.stats": "Estadísticas de Carrera",
    "perfil.achievements": "Logros recientes",
    "perfil.coursesNote": "Cursos y logros",
    "perfil.preferences": "Preferencias",

    // Ajustes
    "ajustes.eyebrow": "Ajustes",
    "ajustes.title": "Tu cabina de mando",
    "ajustes.subtitle": "Personaliza SKILLMAP y mantén tu ruta al día.",
    "ajustes.appearance": "Apariencia",
    "ajustes.theme": "Tema",
    "ajustes.light": "Claro",
    "ajustes.dark": "Oscuro",
    "ajustes.motion": "Reducir animaciones",
    "ajustes.motionDesc": "Menos movimiento en transiciones y gráficos.",
    "ajustes.language": "Idioma",
    "ajustes.themeError": "No se pudo guardar el tema: se mantiene solo hasta cerrar SkillMap.",
    "ajustes.settingError": "No se pudo guardar el ajuste: se mantiene solo hasta cerrar SkillMap.",
    "ajustes.languageError": "No se pudo guardar el idioma: se mantiene solo hasta cerrar SkillMap.",
    "ajustes.readError": "No pudimos leer tus ajustes: {error} Los cambios de tema, animaciones e idioma se aplican solo en esta sesión.",
    "ajustes.ai": "Inteligencia artificial",
    "ajustes.aiText": "El Analizador ya incluye IA. Solo agrega tu propia key si quieres usar tu cuota personal.",
    "ajustes.aiNote": "Tu key se guarda solo en este equipo y nunca se sube a ningún repositorio. El plan gratuito de Gemini tiene un límite diario de consultas.",
    "ajustes.keyHelp": "¿Cómo conseguir una key?",
    "ajustes.keyUnknown": "Estado desconocido",
    "ajustes.keySavedHidden": "Key guardada, oculta",
    "ajustes.keyEnv": "Definida por variable de entorno",
    "ajustes.keySaved": "Guardada",
    "ajustes.keyNone": "Sin key propia: el Analizador usa la IA incluida",
    "ajustes.keyChange": "Cambiar key",
    "ajustes.keyAdd": "Añadir key",
    "ajustes.keyLabel": "Key de Gemini (opcional)",
    "ajustes.keyPlaceholder": "Pega aquí tu key",
    "ajustes.save": "Guardar",
    "ajustes.saving": "Guardando…",
    "ajustes.cancel": "Cancelar",
    "ajustes.keyMissing": "Pega tu key antes de guardar.",
    "ajustes.keyOk": "Key guardada. El Analizador usará tu cuota personal.",
    "ajustes.keyError": "No se pudo guardar la key: {error}",
    "ajustes.jobs": "Ofertas de empleo",
    "ajustes.sync": "Recalcular ruta con ofertas nuevas",
    "ajustes.syncing": "Recalculando…",
    "ajustes.syncNote": "Cada fuente se actualiza como máximo cada 6 horas. Remotive pide citarlo como fuente.",
    "ajustes.footer": "SKILLMAP v0.1 · Tus datos viven solo en este equipo.",
    "ajustes.offers.one": "{n} oferta",
    "ajustes.offers.other": "{n} ofertas",
    "ajustes.realOffers.one": "oferta real",
    "ajustes.realOffers.other": "ofertas reales",
    "ajustes.sourceUpdated": "Actualizada: {date}",
    "ajustes.sourceNever": "Sin actualizar",
    "ajustes.autoSync": "{name} se actualiza solo cada {n} días",
    "ajustes.noSources": "Aún no hay fuentes sincronizadas",
    "ajustes.lastUpdate": "Última actualización: {date}",
    "ajustes.neverUpdated": "Aún no se ha actualizado",
    "ajustes.jobsError": "No pudimos leer las ofertas: {error}",
    "ajustes.synced": "{name}: actualizada · {detail}",
    "ajustes.newOffers.one": "{n} oferta nueva",
    "ajustes.newOffers.other": "{n} ofertas nuevas",
    "ajustes.noNewOffers": "sin ofertas nuevas",
    "ajustes.upToDateWait": "{name}: ya está al día · podrás actualizarla en {wait}",
    "ajustes.upToDate": "{name}: ya está al día",
    "ajustes.syncFailed": "{name}: no se pudo actualizar",
    "ajustes.syncConsulting": "Consultando las fuentes de ofertas. Puede tardar unos segundos.",
    "ajustes.syncRecalculated": "Tu ruta se recalculó con las ofertas nuevas.",
    "ajustes.syncNotEnough": "Hay ofertas nuevas, pero aún no bastan para recalcular la ruta.",
    "ajustes.syncSame": "Tu ruta sigue igual.",
    "ajustes.syncError": "No se pudo recalcular: {error}",
  },

  en: {
    "common.loading": "Loading…",
    "common.soon": "Coming soon",
    "common.sample": "Sample data",
    "common.newTab": " (opens in a new tab)",
    "status.MASTERED": "Mastered",
    "status.IN_PROGRESS": "In progress",
    "status.PENDING": "To learn",
    "category.none": "Uncategorized",
    "error.offline": "SkillMap isn't responding. Check that the app is still open and try again.",
    "error.server": "The server responded with an error ({status}).",
    "error.loadTitle": "We couldn't load your data",
    "error.loadText": "The SkillMap server isn't responding. Reload the page in a few minutes to try again.",
    "error.techDetail": "Technical detail: server at {server} ({cmd} from skillmap-api)",

    "intro.skip": "Skip",
    "intro.eyebrow": "Welcome",
    "intro.title": "Your career GPS",
    "intro.subtitle": "Map what you know, see what real job postings ask for and plot the route to your next role.",
    "intro.start": "Get started",
    "intro.chips": "SkillMap in numbers",
    "intro.chip.jobs.one": "real job posting",
    "intro.chip.jobs.other": "real job postings",
    "intro.chip.skills.one": "skill",
    "intro.chip.skills.other": "skills",
    "intro.chip.goals.one": "goal",
    "intro.chip.goals.other": "goals",
    "intro.slides": "What you can do in SkillMap",
    "intro.slide1.title": "1 · Skill map",
    "intro.slide1.text": "See what you know and what you're missing, on a single map.",
    "intro.slide2.title": "2 · Real demand",
    "intro.slide2.text": "What job postings actually ask for, not what's assumed.",
    "intro.slide3.title": "3 · AI analysis",
    "intro.slide3.text": "Paste a job posting and find out how good a match you are.",

    "acceso.eyebrow": "Your account",
    "acceso.modes": "Choose how to sign in",
    "acceso.login.title": "Welcome back",
    "acceso.login.subtitle": "Sign in to pick up your route where you left off.",
    "acceso.login.submit": "Sign in",
    "acceso.login.busy": "Signing in…",
    "acceso.register.title": "Create your account",
    "acceso.register.subtitle": "Your progress is saved on this computer, separate from other accounts.",
    "acceso.register.submit": "Create account",
    "acceso.register.busy": "Creating account…",
    "acceso.name": "Name",
    "acceso.email": "Email",
    "acceso.password": "Password",
    "acceso.showPassword": "Show password",
    "acceso.passwordHint": "At least 8 characters.",
    "acceso.missingName": "Enter your name.",
    "acceso.missingEmail": "Enter your email.",
    "acceso.missingPassword": "Enter your password.",
    "acceso.shortPassword": "The password must be at least {min} characters long.",
    "session.ended": "Your session ended. Please sign in again.",

    "nav.label": "Main navigation",
    "nav.objetivo": "Goal",
    "nav.dashboard": "My Route",
    "nav.mapa": "Visual Map",
    "nav.analizador": "Analyzer",
    "nav.perfil": "Profile",
    "nav.ajustes": "Settings",
    "theme.label": "Theme",
    "theme.light": "Light mode",
    "theme.dark": "Dark mode",
    "user.accountOf": "Account of ",
    "user.logout": "Sign out",
    "user.loggingOut": "Signing out…",

    "objetivo.title": "What's your next big leap?",
    "objetivo.subtitle": "Set your career goal so the GPS can plot the most efficient route to it.",
    "objetivo.search": "Search goal",
    "objetivo.searchPlaceholder": "Search for a role (e.g. Senior Frontend Engineer, UX Designer...)",
    "objetivo.loading": "Loading goals…",
    "objetivo.empty": "There are no career goals available yet.",
    "objetivo.noMatch": "No goal matches “{query}”. Try another word or clear the search.",
    "objetivo.group": "Career goals",
    "objetivo.skills.one": "{n} required skill",
    "objetivo.skills.other": "{n} required skills",
    "objetivo.other": "Another goal",
    "objetivo.otherText": "Create your own custom role",
    "objetivo.cta": "Plot my custom route",

    "ruta.goalEyebrow": "Current goal",
    "ruta.noGoals": "No goals",
    "ruta.offline": "Offline",
    "ruta.loading": "Loading your route…",
    "ruta.urgency.critical": "Critical",
    "ruta.urgency.high": "High demand",
    "ruta.urgency.medium": "Medium",
    "ruta.market": "Job Market",
    "ruta.market.high": "High Demand",
    "ruta.market.mid": "Medium Demand",
    "ruta.market.low": "Low Demand",
    "ruta.market.title": "This goal's skills appear on average in {goal}% of job postings; the whole catalog's, in {market}%",
    "ruta.gauge.title": "Readiness Level",
    "ruta.gauge.aria": "{pct}% ready",
    "ruta.gauge.noSkills": "{goal} doesn't have key skills defined yet.",
    "ruta.gauge.done": "You've mastered every key skill for {goal}.",
    "ruta.gauge.remaining.one": "You're only {n} key skill away from the ideal profile for {goal}.",
    "ruta.gauge.remaining.other": "You're only {n} key skills away from the ideal profile for {goal}.",
    "ruta.showGaps": "See gap details",
    "ruta.gaps.title": "Priority Gaps",
    "ruta.gaps.hint": "Sorted by demand",
    "ruta.gaps.demand": "Demand: {pct}%",
    "ruta.gaps.none": "You have no pending gaps: you've already mastered every skill for this goal.",
    "ruta.next.eyebrow": "Next action",
    "ruta.next.progress": "Keep going with {skill}",
    "ruta.next.start": "Start with {skill}",
    "ruta.next.text": "It appears in {pct}% of the analyzed job postings and it's your most in-demand gap for {goal}.",
    "ruta.next.cta": "Start now",
    "ruta.trend.title": "Skill Trend",
    "ruta.trend.months": "Jan,Feb,Mar,Apr,May,Jun",
    "ruta.trend.aria": "Sample trend: your level versus market demand, January to June",
    "ruta.trend.point": "{month}: your level {level}, market demand {demand}",
    "ruta.trend.level": "Your Level",
    "ruta.trend.demand": "Market demand",
    "ruta.trend.tipLevel": "Your level {n}",
    "ruta.trend.tipDemand": "Demand {n}",
    "ruta.trend.caption": "Skill trend (sample data)",
    "ruta.trend.month": "Month",
    "ruta.trend.levelCol": "Your level",
    "demand.sample": "Sample demand: it doesn't come from real job postings yet",
    "jobs.basedOn": "Based on {n} real job postings",
    "jobs.routeFrom": "Route calculated from {n} real job postings",

    "mapa.loading": "Loading your skill map…",
    "mapa.empty": "There are no skills to show on the map yet.",
    "mapa.stage": "Skill map. Use the arrow keys to move between skills and Enter to see their details.",
    "mapa.zoom": "Map zoom",
    "mapa.zoomIn": "Zoom in",
    "mapa.zoomOut": "Zoom out",
    "mapa.center": "Center map",
    "mapa.route": "Suggested route",
    "mapa.panel": "Skill details",
    "mapa.node.label": "{name}, {category}, {status}, {pct}% demand",
    "mapa.node.sample": " (sample)",
    "mapa.node.tooltip": "{name} — {pct}% demand",
    "mapa.empty.title": "Select a skill",
    "mapa.empty.text": "Click a node on the map (or move between them with the arrow keys and press Enter) to see its demand and its place in your route.",
    "mapa.text.next": "It's your next turn toward {goal}: the most in-demand gap on your route.",
    "mapa.text.gap": "It's gap {n} of {total} on your route to {goal}, sorted by demand.",
    "mapa.text.masteredInGoal": "You've already mastered it and it adds to your readiness for {goal}.",
    "mapa.text.inGoal": "It's part of your goal {goal}.",
    "mapa.text.MASTERED": "You've already mastered it.",
    "mapa.text.IN_PROGRESS": "You're working on it.",
    "mapa.text.PENDING": "You haven't started it yet.",
    "mapa.text.notInGoal": "{text} It isn't part of your goal {goal}.",
    "mapa.pctOfJobs": "% of job postings",
    "mapa.marking": "Marking…",
    "mapa.unmarking": "Removing…",
    "mapa.mark": "Mark as mastered",
    "mapa.unmark": "Remove from mastered",
    "mapa.selected": "{name} selected. Details in the panel.",
    "mapa.marked": "{name} marked as mastered.",
    "mapa.unmarked": "{name} removed from mastered: back to To learn.",
    "mapa.markError": "Couldn't mark it: {error}",
    "mapa.unmarkError": "Couldn't remove it: {error}",

    "skill.context": "See context and FAQ",
    "skill.contextFor": "See context and FAQ for {name}",
    "skill.backTo": "Back to {view}",
    "skill.loading": "Loading the skill…",
    "skill.notFound": "We couldn't find this skill. It may no longer be in the catalog.",
    "skill.ofJobs": "of job postings",
    "skill.what": "What it is",
    "skill.why": "Why it matters for your goal",
    "skill.why.demand": "It appears in {pct}% of the analyzed job postings.",
    "skill.why.inGoal": "It's part of your goal {goal}: #{rank} by demand among its {total} skills.",
    "skill.why.notInGoal": "It isn't part of your goal {goal}.",
    "skill.why.noGoal": "Choose a goal to see how it fits your route.",
    "skill.how": "How to learn it",
    "skill.time": "Estimated time: {time}",
    "skill.faq": "Frequently asked questions",
    "skill.resources": "Resources",
    "skill.resourcesHint": "Official documentation",
    "skill.progress": "Your progress",
    "skill.empty.title": "We don't have a guide for {name} yet",
    "skill.empty.text": "We're preparing what it is, how to learn it and its FAQ. In the meantime, you can see its demand and mark it as mastered.",

    "analyzer.title": "Job Posting Analyzer",
    "analyzer.subtitle": "Paste a job description to analyze how well you match and spot new gaps.",
    "analyzer.label": "Job description",
    "analyzer.placeholder": "Paste the full text of the job posting here...",
    "analyzer.emptyWarning": "Paste the text of a job posting to analyze it.",
    "analyzer.submit": "Analyze Match",
    "analyzer.analyzing": "Analyzing…",
    "analyzer.limit": "You reached the {max}-character limit.",
    "analyzer.aiUnavailable": "The AI service isn't available. Try again in a minute.",
    "analyzer.timeout": "The analysis took too long. Try again in a minute.",
    "analyzer.offline": "Couldn't connect to the server.",
    "analyzer.match.none": "We didn't recognize any catalog skills in this posting. Try the full description, including requirements and technologies.",
    "analyzer.match.high": "You're a strong match. You cover the main requirements but are missing a couple of secondary tools.",
    "analyzer.match.mid": "You're a moderate match. You cover part of the requirements; focus on the missing skills to get closer to the profile.",
    "analyzer.match.low": "You're a weak match. This posting asks for several skills you haven't mastered yet: use it as a guide for your route.",
    "analyzer.match.title": "Profile match",
    "analyzer.match.aria": "{pct}% match",
    "analyzer.breakdown": "Skill Breakdown",
    "analyzer.mastered": "Mastered skills",
    "analyzer.progress": "In progress",
    "analyzer.missing": "Missing",
    "analyzer.groupEmpty": "None in this posting.",
    "analyzer.empty.title": "No analysis yet",
    "analyzer.empty.text": "Paste a job description and press “Analyze Match” to see your match percentage and the skills you're missing.",
    "analyzer.stale.title": "Your progress changed",
    "analyzer.stale.text": "You've marked skills since the last analysis. Press “Analyze Match” to see your updated percentage.",
    "analyzer.skeleton": "Analyzing the job posting…",
    "analyzer.error.title": "We couldn't analyze the job posting",
    "analyzer.retry": "Retry",
    "analyzer.wake": "Waking up the AI service, this can take up to a minute…",

    "perfil.sample.bio": "Frontend developer with a passion for UX/UI and web performance.",
    "perfil.sample.location": "Madrid, Spain",
    "perfil.sample.project1": "Design and development of a component system for online stores with React and Tailwind.",
    "perfil.sample.project2": "Interactive dashboard with real-time data visualization using Plotly and Next.js.",
    "perfil.sample.achievement1": "First goal reached",
    "perfil.sample.achievement2": "7-day study streak",
    "perfil.sample.achievement3": "10 coding projects",
    "perfil.sample.pref1": "Actively Looking",
    "perfil.sample.pref2": "Public Profile",
    "perfil.photo": "Profile photo of {name}",
    "perfil.changePhoto": "Change photo (coming soon)",
    "perfil.edit": "Edit Profile",
    "perfil.exportCv": "Export CV",
    "perfil.groupMetricTitle": "Average demand for these skills in job postings",
    "perfil.groupMetric": "Average demand {n}%",
    "perfil.loadingSkills": "Loading your skills…",
    "perfil.mastered": "Mastered",
    "perfil.masteredEmpty": "You haven't mastered any skills yet.",
    "perfil.learning": "Learning",
    "perfil.learningEmpty": "You're not learning any skill right now.",
    "perfil.skills": "My Skills",
    "perfil.projects": "Featured Projects",
    "perfil.addProject": "+ Add Project",
    "perfil.masteredStat": "Mastered Skills",
    "perfil.courses": "Completed Courses",
    "perfil.stats": "Career Stats",
    "perfil.achievements": "Recent achievements",
    "perfil.coursesNote": "Courses and achievements",
    "perfil.preferences": "Preferences",

    "ajustes.eyebrow": "Settings",
    "ajustes.title": "Your control room",
    "ajustes.subtitle": "Customize SKILLMAP and keep your route up to date.",
    "ajustes.appearance": "Appearance",
    "ajustes.theme": "Theme",
    "ajustes.light": "Light",
    "ajustes.dark": "Dark",
    "ajustes.motion": "Reduce motion",
    "ajustes.motionDesc": "Less movement in transitions and charts.",
    "ajustes.language": "Language",
    "ajustes.themeError": "Couldn't save the theme: it only lasts until you close SkillMap.",
    "ajustes.settingError": "Couldn't save the setting: it only lasts until you close SkillMap.",
    "ajustes.languageError": "Couldn't save the language: it only lasts until you close SkillMap.",
    "ajustes.readError": "We couldn't read your settings: {error} Theme, motion and language changes only apply to this session.",
    "ajustes.ai": "Artificial intelligence",
    "ajustes.aiText": "The Analyzer already includes AI. Only add your own key if you want to use your personal quota.",
    "ajustes.aiNote": "Your key is only stored on this computer and is never uploaded to any repository. Gemini's free plan has a daily request limit.",
    "ajustes.keyHelp": "How do I get a key?",
    "ajustes.keyUnknown": "Unknown status",
    "ajustes.keySavedHidden": "Key saved, hidden",
    "ajustes.keyEnv": "Set by environment variable",
    "ajustes.keySaved": "Saved",
    "ajustes.keyNone": "No key of your own: the Analyzer uses the included AI",
    "ajustes.keyChange": "Change key",
    "ajustes.keyAdd": "Add key",
    "ajustes.keyLabel": "Gemini key (optional)",
    "ajustes.keyPlaceholder": "Paste your key here",
    "ajustes.save": "Save",
    "ajustes.saving": "Saving…",
    "ajustes.cancel": "Cancel",
    "ajustes.keyMissing": "Paste your key before saving.",
    "ajustes.keyOk": "Key saved. The Analyzer will use your personal quota.",
    "ajustes.keyError": "Couldn't save the key: {error}",
    "ajustes.jobs": "Job postings",
    "ajustes.sync": "Recalculate route with new postings",
    "ajustes.syncing": "Recalculating…",
    "ajustes.syncNote": "Each source updates at most every 6 hours. Remotive asks to be credited as the source.",
    "ajustes.footer": "SKILLMAP v0.1 · Your data lives only on this computer.",
    "ajustes.offers.one": "{n} posting",
    "ajustes.offers.other": "{n} postings",
    "ajustes.realOffers.one": "real job posting",
    "ajustes.realOffers.other": "real job postings",
    "ajustes.sourceUpdated": "Updated: {date}",
    "ajustes.sourceNever": "Not updated",
    "ajustes.autoSync": "{name} updates on its own every {n} days",
    "ajustes.noSources": "No sources synced yet",
    "ajustes.lastUpdate": "Last update: {date}",
    "ajustes.neverUpdated": "Not updated yet",
    "ajustes.jobsError": "We couldn't read the job postings: {error}",
    "ajustes.synced": "{name}: updated · {detail}",
    "ajustes.newOffers.one": "{n} new posting",
    "ajustes.newOffers.other": "{n} new postings",
    "ajustes.noNewOffers": "no new postings",
    "ajustes.upToDateWait": "{name}: already up to date · you can update it in {wait}",
    "ajustes.upToDate": "{name}: already up to date",
    "ajustes.syncFailed": "{name}: couldn't update",
    "ajustes.syncConsulting": "Checking the job posting sources. This can take a few seconds.",
    "ajustes.syncRecalculated": "Your route was recalculated with the new postings.",
    "ajustes.syncNotEnough": "There are new postings, but not enough yet to recalculate the route.",
    "ajustes.syncSame": "Your route stays the same.",
    "ajustes.syncError": "Couldn't recalculate: {error}",
  },
};

// ---------- Datos del backend (seed en español): por nombre; lo que no está aquí se muestra tal cual ----------

const DATA_EN = {
  skills: { "Estadística": "Statistics" },
  categories: { "Calidad": "Quality", "Datos": "Data", "Móvil": "Mobile" },
  // Por título (el id depende del orden en que se sembró la base)
  goals: {
    "Frontend Senior": { title: "Senior Frontend", description: "Modern, typed and well-tested web interfaces." },
    "Backend Java": { title: "Java Backend", description: "Robust APIs with Java and Spring Boot." },
    "Data Scientist": { description: "Data analysis and predictive models with Python and Machine Learning." },
    "Cloud Architect": { description: "Scalable cloud infrastructure with AWS, containers and infrastructure as code." },
    "Mobile Lead": { description: "Native and cross-platform apps, and leading mobile teams." },
  },
};

// Mensajes de error del backend (siempre en español) → inglés. Exactos primero; después los que llevan datos.
const BACKEND_ERRORS_EN = {
  "Sesión no válida o expirada. Inicia sesión de nuevo.": "Invalid or expired session. Please sign in again.",
  "Ya existe una cuenta con ese correo.": "An account with that email already exists.",
  "Correo o contraseña incorrectos": "Incorrect email or password",
  "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.": "Too many failed attempts. Wait a few minutes and try again.",
  "El nombre debe tener entre 1 y 60 caracteres.": "The name must be between 1 and 60 characters.",
  "El correo no es válido.": "The email isn't valid.",
  "La contraseña debe tener entre 8 y 72 caracteres.": "The password must be between 8 and 72 characters.",
  "La contraseña es demasiado larga: con tildes o emojis caben menos de 72 caracteres.": "The password is too long: with accents or emojis, fewer than 72 characters fit.",
  "La descripción de la oferta no puede estar vacía.": "The job description can't be empty.",
  "La descripción de la oferta supera el máximo de 8.000 caracteres.": "The job description exceeds the 8,000-character limit.",
  "El tema no es válido. Valores permitidos: light, dark.": "The theme isn't valid. Allowed values: light, dark.",
  "El idioma no es válido. Valores permitidos: es, en.": "The language isn't valid. Allowed values: es, en.",
  "La key de Gemini no puede estar vacía.": "The Gemini key can't be empty.",
  "La key de Gemini no puede contener espacios.": "The Gemini key can't contain spaces.",
  "La key de Gemini solo puede contener letras, números y símbolos ASCII.": "The Gemini key can only contain letters, numbers and ASCII symbols.",
  "No se pudo guardar la key de Gemini en el archivo de ajustes.": "Couldn't save the Gemini key to the settings file.",
  "La key se guardó, pero la variable de entorno GEMINI_API_KEY tiene prioridad y es la que se usa. Para usar la guardada, elimina la variable y reinicia la app.":
    "The key was saved, but the GEMINI_API_KEY environment variable takes priority and is the one in use. To use the saved key, remove the variable and restart the app.",
  "El cuerpo de la petición no es un JSON válido.": "The request body isn't valid JSON.",
  "El servicio de IA no está disponible. Inténtalo de nuevo en un minuto.": "The AI service isn't available. Try again in a minute.",
  "El servicio de IA no está configurado en el servidor.": "The AI service isn't configured on the server.",
  "No se pudo conectar con el servicio de IA. Revisa tu conexión a internet.": "Couldn't connect to the AI service. Check your internet connection.",
  "Se alcanzó el límite diario de la IA. Inténtalo de nuevo mañana.": "The AI daily limit was reached. Try again tomorrow.",
  "El servicio de IA alcanzó su límite diario de consultas. Vuelve a intentarlo mañana.": "The AI service reached its daily request limit. Try again tomorrow.",
  "El servicio de IA devolvió una respuesta inválida.": "The AI service returned an invalid response.",
  "La IA devolvió una respuesta que no se pudo interpretar. Inténtalo de nuevo.": "The AI returned a response that couldn't be interpreted. Try again.",
  "No se pudo conectar con Gemini. Revisa tu conexión e inténtalo de nuevo.": "Couldn't connect to Gemini. Check your connection and try again.",
  "Error inesperado al comunicarse con Gemini.": "Unexpected error while communicating with Gemini.",
  "Se alcanzó el límite de uso gratuito de Gemini. Espera un momento e inténtalo de nuevo.": "Gemini's free usage limit was reached. Wait a moment and try again.",
  "Gemini rechazó la API key. Revisa GEMINI_API_KEY o gemini.api.key en config.properties.": "Gemini rejected the API key. Check GEMINI_API_KEY or gemini.api.key in config.properties.",
  "Gemini no está disponible en este momento. Inténtalo de nuevo en unos minutos.": "Gemini isn't available right now. Try again in a few minutes.",
  "Gemini tardó demasiado, inténtalo de nuevo.": "Gemini took too long, try again.",
  "Se agotó el cupo diario gratuito de la IA, inténtalo mañana.": "The AI's free daily quota ran out, try again tomorrow.",
};

const BACKEND_ERROR_PATTERNS_EN = [
  [/^No se encontró la habilidad con id (\d+)$/, "Skill with id $1 not found"],
  [/^No se encontró el objetivo con id (\d+)$/, "Goal with id $1 not found"],
  [/^Alcanzaste el máximo de (\d+) análisis con IA por día\. Vuelve a intentarlo mañana\.$/, "You reached the maximum of $1 AI analyses per day. Try again tomorrow."],
  [/^La key de Gemini debe tener entre (\d+) y (\d+) caracteres\.$/, "The Gemini key must be between $1 and $2 characters."],
  [/^El campo '(.+)' no tiene un valor válido\.$/, "The field '$1' doesn't have a valid value."],
  [/^El parámetro '(.+)' no tiene un valor válido\.$/, "The parameter '$1' doesn't have a valid value."],
  [/^El cuerpo de la petición es demasiado grande \(máximo (\d+) KB\)\.$/, "The request body is too large (maximum $1 KB)."],
  [/^El servicio de IA rechazó la solicitud \(HTTP (\d+)\)\.$/, "The AI service rejected the request (HTTP $1)."],
  [/^Gemini rechazó la solicitud \(HTTP (\d+)\)\.$/, "Gemini rejected the request (HTTP $1)."],
  [/^(.+) tardó demasiado en responder\. Inténtalo más tarde\.$/, "$1 took too long to respond. Try again later."],
  [/^No se pudo conectar con (.+)\. Revisa tu conexión o inténtalo más tarde\.$/, "Couldn't connect to $1. Check your connection or try again later."],
  [/^(.+) devolvió una respuesta que no es JSON válido\.$/, "$1 returned a response that isn't valid JSON."],
  [/^(.+) devolvió una respuesta vacía\.$/, "$1 returned an empty response."],
  [/^(.+) devolvió una respuesta sin la lista de ofertas\.$/, "$1 returned a response without the list of job postings."],
  [/^(.+) alcanzó su límite de uso\. Inténtalo de nuevo en unas horas\.$/, "$1 reached its usage limit. Try again in a few hours."],
  [/^(.+) no está disponible en este momento \(HTTP (\d+)\)\. Inténtalo más tarde\.$/, "$1 isn't available right now (HTTP $2). Try again later."],
  [/^(.+) rechazó la petición \(HTTP (\d+)\)\. Puede que su API haya cambiado\.$/, "$1 rejected the request (HTTP $2). Its API may have changed."],
];

// ---------- API ----------

function readSavedLanguage() {
  try {
    const saved = localStorage.getItem(LANGUAGE_KEY);
    return LANGUAGES.includes(saved) ? saved : "es";
  } catch { return "es"; }
}

let currentLanguage = readSavedLanguage();

function getLanguage() {
  return currentLanguage;
}

// t("clave", { n: 3 }): texto del idioma actual con {n} reemplazado. Sin traducción, el español; sin clave, la clave.
function t(key, params = {}) {
  const text = I18N[currentLanguage][key] ?? I18N.es[key] ?? key;
  return text.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

// Singular o plural: usa "clave.one" o "clave.other" y pasa n como parámetro
function tn(key, n, params = {}) {
  return t(`${key}.${n === 1 ? "one" : "other"}`, { n, ...params });
}

// MASTERED, IN_PROGRESS o PENDING; un estado desconocido cuenta como PENDING
function statusLabel(status) {
  return t(`status.${status}` in I18N.es ? `status.${status}` : "status.PENDING");
}

// "1.234" en español y "1,234" en inglés (también con 4 cifras, como el contador del Analizador)
function formatNumber(n) {
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, currentLanguage === "en" ? "," : ".");
}

function tSkill(name) {
  return currentLanguage === "en" ? DATA_EN.skills[name] ?? name : name;
}

function tCategory(category) {
  if (!category) return t("category.none");
  return currentLanguage === "en" ? DATA_EN.categories[category] ?? category : category;
}

function tGoalTitle(title) {
  return currentLanguage === "en" ? DATA_EN.goals[title]?.title ?? title : title;
}

function tGoalDescription(title, description) {
  return currentLanguage === "en" ? DATA_EN.goals[title]?.description ?? description : description;
}

// Mensaje del backend en el idioma actual; uno desconocido, tal cual
function tError(message) {
  if (currentLanguage === "es" || !message) return message;
  if (BACKEND_ERRORS_EN[message]) return BACKEND_ERRORS_EN[message];
  const pattern = BACKEND_ERROR_PATTERNS_EN.find(([re]) => re.test(message));
  return pattern ? message.replace(pattern[0], pattern[1]) : message;
}

// Error propio de la interfaz: guarda la clave para mostrarse en el idioma vigente aunque este cambie después
function i18nError(key, params = {}) {
  const err = new Error(t(key, params));
  err.i18nKey = key;
  err.params = params;
  return err;
}

// Texto de un error para mostrar: los propios por su clave y los del backend por el diccionario
function errorText(err) {
  return err.i18nKey ? t(err.i18nKey, err.params) : tError(err.message);
}

// Textos fijos del HTML (data-i18n*) en el idioma actual
function translatePage(root = document) {
  root.querySelectorAll("[data-i18n]").forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-placeholder]").forEach(el => { el.placeholder = t(el.dataset.i18nPlaceholder); });
  root.querySelectorAll("[data-i18n-aria-label]").forEach(el => { el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel)); });
  root.querySelectorAll("[data-i18n-title]").forEach(el => { el.title = t(el.dataset.i18nTitle); });
}

// Cambia el idioma sin recargar: textos fijos al instante y aviso a las vistas para que se vuelvan a pintar
function applyLanguage(lang) {
  if (!LANGUAGES.includes(lang)) return;
  const changed = lang !== currentLanguage;
  currentLanguage = lang;
  document.documentElement.lang = lang;
  try { localStorage.setItem(LANGUAGE_KEY, lang); } catch (e) { /* almacenamiento bloqueado: solo falta la copia local */ }
  if (!changed) return;
  translatePage();
  document.dispatchEvent(new CustomEvent("skillmap:language"));
}

document.documentElement.lang = currentLanguage;
if (currentLanguage !== "es") translatePage(); // el HTML viene en español
