// Pantalla de Introducción: a pantalla completa sobre la app (#intro). Usa fetchSettings, saveSettings y
// prefersReducedMotion (theme.js); fetchJobStats, fetchSkills y fetchGoals (dashboard.js); showView (mapa.js).
//
// Regla de aparición: hoy no hay cuentas, así que showIntro de /api/settings hace de "intro pendiente" (true por
// defecto). Si el backend no responde o showIntro es false, no se muestra. ?intro=1 la fuerza sin tocar lo guardado.
// Fase usuarios: pasar a marcador por usuario (se muestra a quien no tenga sesión/cuenta).
// El script del <head> pone data-intro="checking" (la app queda oculta, sin parpadeo) u "open" con ?intro=1.

const INTRO_FORCED = new URLSearchParams(location.search).get("intro") === "1";
const INTRO_TIMEOUT = 2000; // sin respuesta del backend en este tiempo, la app se muestra sin intro
const INTRO_SLIDES = 3;
const introNumber = new Intl.NumberFormat("es");

let introOpen = false;

function setIntroState(state) {
  if (state) document.documentElement.setAttribute("data-intro", state);
  else document.documentElement.removeAttribute("data-intro");
}

// Mientras la intro está abierta, la barra superior y las vistas no reciben foco ni clics
function setAppInert(inert) {
  document.querySelectorAll(".topbar, .app-main").forEach(el => { el.inert = inert; });
}

// ---------- Chips: solo datos reales; si falta uno o vale 0, su chip no aparece ----------

const INTRO_CHIPS = {
  jobs: ["oferta real", "ofertas reales"],
  skills: ["habilidad", "habilidades"],
  goals: ["objetivo", "objetivos"],
};

function setIntroChip(name, value) {
  const chip = document.querySelector(`[data-intro-chip="${name}"]`);
  const ok = Number.isFinite(value) && value > 0;
  chip.hidden = !ok;
  if (!ok) return;
  chip.querySelector("strong").textContent = introNumber.format(value);
  chip.querySelector("span").textContent = INTRO_CHIPS[name][value === 1 ? 0 : 1];
}

async function loadIntroChips() {
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

// ---------- Fondo: puntos y nodos que derivan despacio (canvas, ~30 fps) ----------
// Se detiene con la pestaña oculta y al cerrar la intro; con animaciones reducidas se dibuja una vez, quieto.

const introBg = { canvas: null, ctx: null, points: [], raf: 0, last: 0, w: 0, h: 0, dot: "", line: "" };
const INTRO_BG_POINTS = 36, INTRO_BG_LINK = 150, INTRO_BG_FRAME = 33;

function readIntroBgColors() {
  const style = getComputedStyle(document.documentElement);
  introBg.dot = style.getPropertyValue("--intro-particle").trim();
  introBg.line = style.getPropertyValue("--intro-particle-line").trim();
}

function resizeIntroBg() {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  introBg.w = window.innerWidth;
  introBg.h = window.innerHeight;
  introBg.canvas.width = Math.round(introBg.w * dpr);
  introBg.canvas.height = Math.round(introBg.h * dpr);
  introBg.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function seedIntroBg() {
  introBg.points = Array.from({ length: INTRO_BG_POINTS }, (_, i) => ({
    x: Math.random() * introBg.w,
    y: Math.random() * introBg.h,
    r: i % 6 === 0 ? 3.5 : 1.6, // uno de cada seis es un "nodo"; el resto, puntos
    vx: (Math.random() - 0.5) * 0.25,
    vy: (Math.random() - 0.5) * 0.25,
  }));
}

function drawIntroBg() {
  const { ctx, points, w, h } = introBg;
  ctx.clearRect(0, 0, w, h);
  // Conexiones solo desde los nodos, más tenues cuanto más lejos
  ctx.strokeStyle = introBg.line;
  ctx.lineWidth = 1;
  points.forEach(a => {
    if (a.r < 3) return;
    points.forEach(b => {
      if (a === b) return;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > INTRO_BG_LINK) return;
      ctx.globalAlpha = 1 - d / INTRO_BG_LINK;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
  });
  ctx.globalAlpha = 1;
  ctx.fillStyle = introBg.dot;
  points.forEach(p => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  });
}

function tickIntroBg(time) {
  introBg.raf = requestAnimationFrame(tickIntroBg);
  if (time - introBg.last < INTRO_BG_FRAME) return;
  introBg.last = time;
  introBg.points.forEach(p => {
    p.x = (p.x + p.vx + introBg.w) % introBg.w;
    p.y = (p.y + p.vy + introBg.h) % introBg.h;
  });
  drawIntroBg();
}

function stopIntroBg() {
  cancelAnimationFrame(introBg.raf);
  introBg.raf = 0;
}

function startIntroBg() {
  if (!introOpen) return;
  readIntroBgColors();
  if (prefersReducedMotion() || document.hidden) {
    stopIntroBg();
    drawIntroBg();
    return;
  }
  if (!introBg.raf) introBg.raf = requestAnimationFrame(tickIntroBg);
}

function initIntroBg() {
  if (introBg.canvas) return;
  introBg.canvas = document.querySelector(".intro-bg");
  introBg.ctx = introBg.canvas.getContext("2d");
  resizeIntroBg();
  seedIntroBg();
  document.addEventListener("visibilitychange", () => (document.hidden ? stopIntroBg() : startIntroBg()));
  window.addEventListener("resize", () => {
    if (!introOpen) return;
    resizeIntroBg();
    drawIntroBg();
  });
  // Tema o animaciones cambiados (p. ej. llega la respuesta del backend con la intro ya abierta)
  document.addEventListener("skillmap:settings", startIntroBg);
}

// ---------- Abrir y cerrar ----------

function openIntro() {
  if (introOpen) return;
  introOpen = true;
  setIntroState("open");
  setAppInert(true);
  initIntroBg();
  startIntroBg();
  loadIntroChips();
  document.getElementById("intro-start").focus();
}

// Empezar, Omitir y Esc. La intro queda vista (PATCH en segundo plano: sin backend se cierra igual) y se vuelve a la
// vista inicial de la app. Con ?intro=1 no se guarda nada y el parámetro sale de la URL.
function closeIntro() {
  if (!introOpen) return;
  introOpen = false;
  stopIntroBg();
  setIntroState(null);
  setAppInert(false);
  if (INTRO_FORCED) {
    const url = new URL(location.href);
    url.searchParams.delete("intro");
    history.replaceState(history.state, "", url);
  } else {
    saveSettings({ showIntro: false }).catch(() => { /* sin backend: se volverá a mostrar la próxima vez */ });
  }
  showView("dashboard");
  document.querySelector(".nav-item[data-view='dashboard']")?.focus();
}

async function decideIntro() {
  if (INTRO_FORCED) { openIntro(); return; }
  const timeout = new Promise(resolve => setTimeout(() => resolve(null), INTRO_TIMEOUT));
  const settings = await Promise.race([fetchSettings().catch(() => null), timeout]);
  if (settings?.showIntro === true) openIntro();
  else setIntroState(null);
}

function initIntro() {
  document.querySelectorAll("[data-intro-close]").forEach(button => button.addEventListener("click", closeIntro));
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && introOpen) closeIntro();
  });
  bindIntroSlides();
  decideIntro();
}

document.addEventListener("DOMContentLoaded", initIntro);
