// Pantalla de Introducción: a pantalla completa sobre la app (#intro). Usa prefersReducedMotion (theme.js);
// fetchJobStats, fetchSkills y fetchGoals (dashboard.js); showView (mapa.js); sessionUser y setAppInert (session.js);
// openAcceso (acceso.js); t, tn y formatNumber (i18n.js).
// La ilustración es el mapa de glifos de js/intro-glifos.js (canvas 2D, startIntroMap / stopIntroMap): se arma después
// del primer pintado y se libera al salir.
// Teclado (sin pistas en pantalla): ← y → cambian de slide, Espacio pausa o reanuda el avance y las animaciones, y
// Esc, Empezar y Omitir cierran como siempre.
//
// Regla de aparición (la decide session.js al arrancar): se muestra a quien entra sin sesión válida; con sesión
// válida no. ?intro=1 la abre igual. "Empezar", "Omitir" y Esc llevan a Acceso, o a la app si ya hay sesión.
// El script del <head> pone data-intro="open" si no hay token guardado o con ?intro=1, y "checking" (la app queda
// oculta, sin parpadeo) mientras se valida el token.

const INTRO_FORCED = new URLSearchParams(location.search).get("intro") === "1";
const INTRO_SLIDES = 3;

let introOpen = false;

function setIntroState(state) {
  if (state) document.documentElement.setAttribute("data-intro", state);
  else document.documentElement.removeAttribute("data-intro");
}

// ---------- Chips: solo datos reales; si falta uno o vale 0, su chip no aparece ----------

const INTRO_CHIPS = ["jobs", "skills", "goals"]; // textos: intro.chip.<nombre>.one / .other (i18n.js)
const introChipValues = {}; // último valor de cada chip, para repintarlos al cambiar de idioma

function setIntroChip(name, value) {
  introChipValues[name] = value;
  const chip = document.querySelector(`[data-intro-chip="${name}"]`);
  const ok = Number.isFinite(value) && value > 0;
  chip.hidden = !ok;
  if (!ok) return;
  chip.querySelector("strong").textContent = formatNumber(value);
  chip.querySelector("span").textContent = tn(`intro.chip.${name}`, value);
}

// Las cifras salen de la API, que exige sesión: sin sesión los chips no aparecen
async function loadIntroChips() {
  if (!sessionUser) {
    INTRO_CHIPS.forEach(name => setIntroChip(name, null));
    return;
  }
  const [stats, skills, goals] = await Promise.all([
    fetchJobStats().catch(() => null),
    fetchSkills().catch(() => null),
    fetchGoals().catch(() => null),
  ]);
  setIntroChip("jobs", stats?.totalJobs);
  setIntroChip("skills", Array.isArray(skills) ? skills.length : null);
  setIntroChip("goals", Array.isArray(goals) ? goals.length : null);
}

// ---------- Slides ----------
// El avance lo marca la barra de la tarjeta activa (animación CSS de 4 s): al terminar pasa a la siguiente. El CSS la
// pausa con hover o foco dentro de las tarjetas y la quita con animaciones reducidas (entonces no hay avance).

function selectIntroSlide(n) {
  document.querySelectorAll(".intro-slide").forEach(slide => {
    slide.setAttribute("aria-pressed", String(slide.dataset.slide === String(n)));
  });
  document.querySelector(".intro-art").dataset.slide = String(n);
  setIntroMapSlide(n); // intro-glifos.js
}

// ← y →: slide anterior o siguiente (da la vuelta). No fija la slide: el avance automático sigue desde la nueva.
function stepIntroSlide(delta) {
  const current = Number(document.querySelector(".intro-art").dataset.slide);
  selectIntroSlide(((current - 1 + delta + INTRO_SLIDES) % INTRO_SLIDES) + 1);
}

// Espacio: pausa o reanuda el avance de las slides y las animaciones del mapa. Se anuncia para lectores de pantalla.
let introPaused = false;

function setIntroPaused(paused) {
  introPaused = paused;
  document.getElementById("intro").classList.toggle("is-paused", paused);
  setIntroMapPaused(paused); // intro-glifos.js
  document.getElementById("intro-live").textContent = t(paused ? "intro.paused" : "intro.resumed");
}

function bindIntroSlides() {
  const group = document.querySelector(".intro-slides");
  // Clic o Enter: la tarjeta queda elegida y el avance automático se detiene
  group.addEventListener("click", e => {
    const slide = e.target.closest(".intro-slide");
    if (!slide) return;
    group.classList.add("is-manual");
    selectIntroSlide(slide.dataset.slide);
  });
  group.addEventListener("animationend", e => {
    if (!e.target.matches(".intro-slide-bar > span") || group.classList.contains("is-manual")) return;
    const current = Number(document.querySelector(".intro-art").dataset.slide);
    selectIntroSlide(current % INTRO_SLIDES + 1);
  });
}

// ---------- Mapa de glifos ----------
// Se arma dos cuadros después de abrir (el primero pinta la intro) y se libera entera al salir

let introMapToken = 0; // descarta un arranque pendiente si la intro se cerró antes

function startIntroIllustration() {
  const token = ++introMapToken;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    if (token !== introMapToken || !introOpen) return;
    startIntroMap(document.querySelector(".intro-map-canvas"), Number(document.querySelector(".intro-art").dataset.slide));
  }));
}

function stopIntroIllustration() {
  introMapToken++;
  stopIntroMap();
}

// ---------- Abrir y cerrar ----------

function openIntro() {
  if (introOpen) return;
  introOpen = true;
  setIntroState("open");
  setAppInert(true);
  setIntroPaused(false);
  document.getElementById("intro-live").textContent = "";
  startIntroIllustration();
  loadIntroChips();
  document.getElementById("intro-start").focus();
}

// Oculta la intro sin decidir adónde ir (también la usa Acceso si se abre encima)
function hideIntro() {
  if (!introOpen) return;
  introOpen = false;
  stopIntroIllustration();
  setIntroState(null);
}

// Empezar, Omitir y Esc: con sesión se vuelve a Mi Ruta; sin sesión, a Acceso. Con ?intro=1 el parámetro sale de
// la URL para que recargar no la vuelva a abrir.
function closeIntro() {
  if (!introOpen) return;
  hideIntro();
  if (INTRO_FORCED) {
    const url = new URL(location.href);
    url.searchParams.delete("intro");
    history.replaceState(history.state, "", url);
  }
  if (!sessionUser) { openAcceso(); return; }
  setAppInert(false);
  showView("dashboard");
  document.querySelector(".nav-item[data-view='dashboard']")?.focus();
}

// Atajos de la intro, sin pista visible: ← → cambian de slide, Esc cierra y Espacio pausa en cualquier parte (también
// con el foco en Empezar, que se activa con Enter o clic).
function handleIntroKey(e) {
  if (!introOpen || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === "Escape") { closeIntro(); return; }
  if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
    e.preventDefault();
    stepIntroSlide(e.key === "ArrowRight" ? 1 : -1);
    return;
  }
  if (e.key === " ") {
    e.preventDefault();
    // Con animaciones reducidas no hay nada en movimiento que pausar
    if (!e.repeat && !prefersReducedMotion()) setIntroPaused(!introPaused);
  }
}

function initIntro() {
  document.querySelectorAll("[data-intro-close]").forEach(button => button.addEventListener("click", closeIntro));
  document.addEventListener("keydown", handleIntroKey);
  bindIntroSlides();
}

document.addEventListener("DOMContentLoaded", initIntro);
document.addEventListener("skillmap:language", () => INTRO_CHIPS.forEach(name => setIntroChip(name, introChipValues[name])));
