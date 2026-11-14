// Copia local de tema, animaciones e idioma antes del primer pintado (sin parpadeo). Va en el <head> como script
// externo (no en línea: la Content-Security-Policy del backend solo permite scripts del propio origen). El backend
// manda: js/theme.js la corrige si difiere. Mismas claves que js/theme.js y js/i18n.js
try {
  var savedTheme = localStorage.getItem("skillmap-theme");
  if (savedTheme === "light" || savedTheme === "dark") document.documentElement.setAttribute("data-theme", savedTheme);
  if (localStorage.getItem("skillmap-motion") === "reduced") document.documentElement.setAttribute("data-motion", "reduced");
  if (localStorage.getItem("skillmap-lang") === "en") document.documentElement.lang = "en"; // textos: js/i18n.js
} catch (e) {}
// Introducción (js/intro.js): sin sesión guardada o con ?intro=1 se abre ya; con sesión guardada la app queda oculta
// mientras js/session.js valida el token. Misma clave que js/session.js
var hasSession = false;
try { hasSession = Boolean(localStorage.getItem("skillmap.session")); } catch (e) {}
document.documentElement.setAttribute("data-intro", !hasSession || /[?&]intro=1(&|$)/.test(location.search) ? "open" : "checking");
