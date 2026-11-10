// Vista "Ajustes" por categorías: Apariencia, Idioma, Datos y cuenta (exportar, cerrar sesión y, desde perfil.js,
// contraseña y eliminar cuenta) y Acerca de. Usa también apiJson y logout (session.js), RITMO_KEY (rachas.js) y PLAN_KEY
// (plan-semanal.js). Las ofertas de empleo ya no se ven ni se recalculan aquí:
// el backend actualiza Arbeitnow y Remotive solo al abrir la app, y Mi Ruta y el Mapa citan las fuentes. Usa
// loadSettings, setTheme, setReduceMotion, setLanguage, getTheme y getReduceMotion (theme.js); friendlyError
// (session.js) y t y getLanguage (i18n.js).

function setStatus(id, text, tone = "") {
  const el = document.getElementById(id);
  el.textContent = text;
  el.dataset.tone = tone; // "error" | "warning" | "ok" | ""
}

// ---------- Apariencia ----------

// Radios e interruptor reflejan el estado actual (también cuando el tema cambia desde la barra superior)
function syncApariencia() {
  const theme = getTheme();
  document.querySelectorAll("input[name='ajustes-theme']").forEach(radio => { radio.checked = radio.value === theme; });
  document.querySelectorAll("input[name='ajustes-language']").forEach(radio => { radio.checked = radio.value === getLanguage(); });
  const motion = document.querySelector(".ajustes-switch[data-setting='reduceMotion']");
  motion.setAttribute("aria-checked", String(getReduceMotion()));
}

function bindApariencia() {
  document.querySelectorAll("input[name='ajustes-theme']").forEach(radio => {
    radio.addEventListener("change", () => {
      setTheme(radio.value)
        .then(() => setStatus("ajustes-apariencia-status", ""))
        .catch(() => setStatus("ajustes-apariencia-status", t("ajustes.themeError"), "warning"));
    });
  });

  // Idioma: se aplica al instante (toda la app se vuelve a pintar) y se guarda en el backend como el tema
  document.querySelectorAll("input[name='ajustes-language']").forEach(radio => {
    radio.addEventListener("change", () => {
      setLanguage(radio.value)
        .then(() => setStatus("ajustes-idioma-status", ""))
        .catch(() => setStatus("ajustes-idioma-status", t("ajustes.languageError"), "warning"));
    });
  });

  document.querySelector(".ajustes-switch[data-setting='reduceMotion']").addEventListener("click", () => {
    setReduceMotion(!getReduceMotion())
      .then(() => setStatus("ajustes-apariencia-status", ""))
      .catch(() => setStatus("ajustes-apariencia-status", t("ajustes.settingError"), "warning"));
  });
}

// ---------- Categorías ----------
// Menú de categorías (a la izquierda; arriba en pantallas angostas) y solo la elegida a la derecha. La elegida dura
// mientras la app está abierta y se marca con aria-current. Flechas arriba/abajo (o izquierda/derecha), Inicio y Fin
// recorren el menú y abren la categoría. Para sumar una categoría (Recordatorios, Sistema) basta otro botón con
// data-ajustes-cat y su sección con data-ajustes-panel en index.html.

let ajustesCat = "apariencia";

const ajustesCatButtons = () => [...document.querySelectorAll(".ajustes-nav [data-ajustes-cat]")].filter(b => !b.hidden);

// Al cambiar de categoría el panel entra con un fundido corto (motion.js) y, si es más bajo, la página no se recorta bajo
// el scroll (keepScrollRoom)
function selectAjustesCat(cat, { focus = false } = {}) {
  const buttons = ajustesCatButtons();
  if (!buttons.some(b => b.dataset.ajustesCat === cat)) cat = buttons[0]?.dataset.ajustesCat || "apariencia";
  const changed = cat !== ajustesCat;
  ajustesCat = cat;
  buttons.forEach(b => {
    if (b.dataset.ajustesCat === cat) b.setAttribute("aria-current", "true");
    else b.removeAttribute("aria-current");
  });
  keepScrollRoom(() => {
    document.querySelectorAll("#view-ajustes [data-ajustes-panel]").forEach(panel => { panel.hidden = panel.dataset.ajustesPanel !== cat; });
  });
  const panel = document.querySelector(`#view-ajustes [data-ajustes-panel="${cat}"]`);
  if (changed && panel) { motionSkipEntry(panel); motionFade(panel); }
  if (focus) buttons.find(b => b.dataset.ajustesCat === cat)?.focus();
}

function bindAjustesNav() {
  const nav = document.querySelector(".ajustes-nav");
  nav.addEventListener("click", e => {
    const button = e.target.closest("[data-ajustes-cat]");
    if (button) selectAjustesCat(button.dataset.ajustesCat);
  });
  nav.addEventListener("keydown", e => {
    const buttons = ajustesCatButtons();
    const i = buttons.indexOf(e.target.closest("[data-ajustes-cat]"));
    if (i < 0) return;
    const next = { ArrowDown: i + 1, ArrowRight: i + 1, ArrowUp: i - 1, ArrowLeft: i - 1, Home: 0, End: buttons.length - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    selectAjustesCat(buttons[(next + buttons.length) % buttons.length].dataset.ajustesCat, { focus: true });
  });
}

// ---------- Datos y cuenta ----------

// Exportar mis datos: lo que guarda el backend (GET /api/auth/me/export: perfil, objetivo, habilidades, enlaces,
// proyectos, análisis e historial de preparación) más lo que vive solo en este equipo para la cuenta (metas y rachas de
// "Tu ritmo" y los planes de "Tu semana", en localStorage). Sin contraseña, tokens ni claves. En el .exe se guarda con el
// diálogo del sistema (cenitDesktop.saveJson, como el CV); en el navegador, como descarga.
function localAccountData() {
  const id = sessionUser?.id;
  const out = { weeklyRhythm: null, weeklyPlans: {} };
  if (id == null) return out;
  try {
    const ritmo = localStorage.getItem(`${RITMO_KEY}.${id}`); // rachas.js
    if (ritmo) out.weeklyRhythm = JSON.parse(ritmo);
    const prefix = `${PLAN_KEY}.${id}.`; // plan-semanal.js
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(prefix)) out.weeklyPlans[key.slice(prefix.length)] = JSON.parse(localStorage.getItem(key));
    }
  } catch { /* sin storage o dato ilegible: se exporta lo que se pudo leer */ }
  return out;
}

function exportFileName() {
  const day = new Date().toISOString().slice(0, 10);
  return `Cenit-${t("ajustes.exportFile")}-${day}.json`;
}

async function exportMyData() {
  const button = document.getElementById("ajustes-export");
  if (button.getAttribute("aria-busy") === "true") return;
  button.setAttribute("aria-busy", "true");
  button.querySelector("[data-label]").textContent = t("ajustes.exporting");
  setStatus("ajustes-export-status", "");
  try {
    const data = await apiJson("/api/auth/me/export");
    const text = JSON.stringify({ ...data, local: localAccountData() }, null, 2);
    const name = exportFileName();
    if (window.cenitDesktop?.saveJson) {
      const result = await window.cenitDesktop.saveJson(name, text);
      if (result?.ok) setStatus("ajustes-export-status", t("ajustes.exportDone", { file: result.fileName }), "ok");
      else if (!result?.canceled) setStatus("ajustes-export-status", t("ajustes.exportError", { error: "" }).trim(), "error");
    } else {
      const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
      const link = Object.assign(document.createElement("a"), { href: url, download: name });
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("ajustes-export-status", t("ajustes.exportDone", { file: name }), "ok");
    }
  } catch (err) {
    setStatus("ajustes-export-status", t("ajustes.exportError", { error: friendlyError(err) }), "error");
  } finally {
    button.removeAttribute("aria-busy");
    button.querySelector("[data-label]").textContent = t("ajustes.exportButton");
  }
}

// Acerca de: la versión la da la app de escritorio (package.json, por IPC); en el navegador no hay versión empaquetada
async function showAppVersion() {
  const el = document.getElementById("ajustes-version");
  let version = "";
  try { version = (await window.cenitDesktop?.version?.()) || ""; } catch { /* sin IPC */ }
  el.textContent = version || t("ajustes.versionWeb");
}

// ---------- Vista ----------

// Cada apertura vuelve a leer ajustes (tema, animaciones e idioma guardados)
function openAjustes() {
  selectAjustesCat(ajustesCat);
  showAppVersion();
  syncApariencia();
  loadSettings({ fresh: true })
    .then(() => setStatus("ajustes-apariencia-status", ""))
    .catch(err => setStatus("ajustes-apariencia-status", t("ajustes.readError", { error: friendlyError(err) }), "warning"))
    .finally(syncApariencia);
}

function initAjustes() {
  bindApariencia();
  bindAjustesNav();
  selectAjustesCat(ajustesCat);
  document.getElementById("ajustes-export").addEventListener("click", exportMyData);
  document.getElementById("ajustes-logout").addEventListener("click", () => logout()); // session.js
  // Tema o animaciones cambiados desde otro sitio (barra superior, respuesta del backend)
  document.addEventListener("skillmap:settings", syncApariencia);
  syncApariencia();
}

// Cambio de usuario: no quedan mensajes de la sesión anterior
document.addEventListener("skillmap:user", () => {
  ["ajustes-apariencia-status", "ajustes-idioma-status", "ajustes-export-status"].forEach(id => setStatus(id, ""));
  selectAjustesCat("apariencia"); // otra cuenta: Ajustes abre en la primera categoría
});

// Cambio de idioma: se vuelve a pintar lo dibujado con JS. Los avisos de guardado se borran (eran del otro idioma)
document.addEventListener("skillmap:language", () => {
  ["ajustes-apariencia-status", "ajustes-idioma-status", "ajustes-export-status"].forEach(id => setStatus(id, ""));
  showAppVersion();
  syncApariencia();
});

document.addEventListener("DOMContentLoaded", initAjustes);
