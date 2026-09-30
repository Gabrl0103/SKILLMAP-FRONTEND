const API_BASE_URL = "http://localhost:8080";

// Vista "Mi Ruta". Usa escapeHtml y showView definidos en mapa.js (disponibles tras DOMContentLoaded).

const STATUS_LABEL = { MASTERED: "Dominada", IN_PROGRESS: "En desarrollo", PENDING: "Por aprender" };
const VISIBLE_GAPS = 3; // el mockup muestra 3 brechas; "Ver detalle de brechas" despliega el resto

// ---------- Datos de ejemplo (la API todavía no los provee) ----------

// DATOS DE EJEMPLO: la API no expone urgencia por brecha. Se asigna según la posición en el
// ranking de demanda solo para reproducir el mockup. Reemplazar cuando el backend tenga el campo.
function sampleUrgencyBadge(rank) {
  return [
    { label: "Alta demanda", tone: "hot" },
    { label: "Crítica", tone: "hot" },
  ][rank] || { label: "Media", tone: "neutral" };
}

// DATOS DE EJEMPLO: la API no guarda histórico del nivel ni de la demanda. Valores fijos.
function sampleTrendData() {
  return {
    months: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    nivel: [40, 45, 52, 58, 62, 68],
    demanda: [60, 62, 65, 70, 75, 82],
  };
}

const sampleTag = `<span class="sample-tag">Datos de ejemplo</span>`;

// DATOS DE EJEMPLO: el backend todavía usa porcentajes de demanda sembrados. Cuando la demanda se calcule
// a partir de vacantes reales, pasar a false: Mi Ruta, Mapa Visual y Perfil quitan la etiqueta solos.
const DEMAND_IS_SAMPLE = true;
const SAMPLE_DEMAND_TEXT = "Demanda de ejemplo: aún no proviene de vacantes reales";

// Nota "Datos de ejemplo" + aviso de demanda, envuelta en un <p> con la clase dada. Vacía si la demanda es real.
function sampleDemandNote(className) {
  return DEMAND_IS_SAMPLE ? `<p class="${className}">${sampleTag} ${SAMPLE_DEMAND_TEXT}</p>` : "";
}

// ---------- Bloques de la vista ----------

// "Mercado Laboral" del encabezado: demanda promedio real de las brechas del objetivo.
function renderMarketDemand(gaps) {
  const el = document.getElementById("market-demand");
  if (!gaps.length) { el.hidden = true; return; }
  const avg = Math.round(gaps.reduce((sum, g) => sum + g.demandPercentage, 0) / gaps.length);
  const level =
    avg >= 70 ? { label: "Alta Demanda", tone: "high", icon: "m3 17 6-6 4 4 8-8M15 7h6v6" } :
    avg >= 40 ? { label: "Demanda Media", tone: "mid", icon: "M4 12h16M14 6l6 6-6 6" } :
                { label: "Demanda Baja", tone: "low", icon: "m3 7 6 6 4-4 8 8M15 17h6v-6" };
  el.innerHTML = `
    <p class="market-demand-label">Mercado Laboral</p>
    <p class="market-demand-value market-demand-value--${level.tone}" title="Demanda promedio de tus brechas: ${avg}%">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${level.icon}"/></svg>
      ${level.label}
    </p>
    ${sampleDemandNote("market-demand-note")}`;
  el.hidden = false;
}

function renderGauge(r) {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (r.readinessPercentage / 100) * circumference;
  const remaining = r.totalCount - r.masteredCount;
  const goal = escapeHtml(r.goalTitle);
  const message = remaining === 0
    ? `Dominas todas las habilidades clave de ${goal}.`
    : `Estás a solo ${remaining} ${remaining === 1 ? "habilidad clave" : "habilidades clave"} de alcanzar el perfil ideal para ${goal}.`;

  // Gauge compartido con el Analizador: --pct alimenta el conteo del número (styles.css); el span es el respaldo sin CSS.
  return `
    <article class="ruta-card ruta-gauge">
      <h2 class="ruta-card-title">Nivel de Preparación</h2>
      <div class="gauge-ring ruta-gauge-ring">
        <svg viewBox="0 0 160 160" role="img" aria-label="${r.readinessPercentage}% de preparación">
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke-width="18" class="gauge-track"/>
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke-width="18" class="gauge-fill"
            transform="rotate(-90 80 80)" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <p class="gauge-value" aria-hidden="true" style="--pct:${Math.round(r.readinessPercentage)};"><span>${r.readinessPercentage}%</span></p>
      </div>
      <p class="ruta-gauge-text">${message}</p>
      ${r.gaps.length ? `<button type="button" class="btn-pill" data-action="show-gaps">Ver detalle de brechas</button>` : ""}
    </article>`;
}

function renderBrechas(gaps) {
  // La API ya manda las brechas ordenadas por demanda.
  const rows = gaps.map((s, i) => {
    const badge = sampleUrgencyBadge(i);
    const extra = i >= VISIBLE_GAPS;
    return `
      <li class="gap-row"${extra ? " data-extra hidden" : ""}>
        <div class="gap-head">
          <span class="gap-name">${escapeHtml(s.name)}</span>
          <span class="gap-badge gap-badge--${badge.tone}">${badge.label}</span>
        </div>
        <div class="gap-bar" aria-hidden="true"><span style="width:${s.demandPercentage}%"></span></div>
        <div class="gap-meta">
          <span>Demanda: ${s.demandPercentage}%</span>
          <span class="gap-status">${STATUS_LABEL[s.status] || STATUS_LABEL.PENDING}</span>
        </div>
      </li>`;
  }).join("");

  const body = gaps.length
    ? `<ul class="gap-list">${rows}</ul>
       <p class="ruta-sample-note">${sampleTag} ${DEMAND_IS_SAMPLE ? `${SAMPLE_DEMAND_TEXT}. ` : ""}Los badges de urgencia son simulados: la API aún no los provee.</p>`
    : `<p class="text-sm text-gray-400">No tienes brechas pendientes: ya dominas todas las habilidades de este objetivo.</p>`;

  return `
    <article id="brechas-card" class="ruta-card ruta-brechas" tabindex="-1">
      <header class="ruta-card-header">
        <h2 class="ruta-card-title">Brechas Prioritarias</h2>
        <span class="ruta-card-hint">Ordenadas por demanda</span>
      </header>
      ${body}
    </article>`;
}

function renderNextAction(topGap, goalTitle) {
  if (!topGap) return "";
  const verb = topGap.status === "IN_PROGRESS" ? "Avanza en" : "Empieza con";
  return `
    <article class="ruta-action">
      <div class="ruta-action-head">
        <span class="ruta-action-eyebrow">Siguiente acción</span>
        ${DEMAND_IS_SAMPLE ? sampleTag : ""}
      </div>
      <h2 class="ruta-action-title">${verb} ${escapeHtml(topGap.name)}</h2>
      <p class="ruta-action-text">Esta habilidad tiene un ${topGap.demandPercentage}% de demanda en vacantes de
        ${escapeHtml(goalTitle)} y es tu brecha con más demanda.</p>
      <button type="button" class="btn-pill btn-pill--light" data-action="open-map">
        Empezar ahora
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4v16l14-8z"/></svg>
      </button>
      <svg class="ruta-action-bolt" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>
    </article>`;
}

// Geometría del gráfico de tendencia (unidades del viewBox).
const TREND = { width: 520, height: 210, left: 44, right: 500, top: 14, bottom: 170, min: 38, max: 84, ticks: [40, 50, 60, 70, 80] };

function renderTrend() {
  const d = sampleTrendData();
  const { left, right, top, bottom, min, max } = TREND;
  const x = i => left + (i * (right - left)) / (d.months.length - 1);
  const y = v => bottom - ((v - min) / (max - min)) * (bottom - top);
  const path = values => values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const step = (right - left) / (d.months.length - 1);

  const grid = TREND.ticks.map(t => `
    <line x1="${left}" x2="${right}" y1="${y(t)}" y2="${y(t)}" class="trend-grid"/>
    <text x="${left - 14}" y="${y(t) + 4}" text-anchor="end" class="trend-axis">${t}</text>`).join("");
  const months = d.months.map((m, i) => `<text x="${x(i)}" y="${bottom + 26}" text-anchor="middle" class="trend-axis">${m}</text>`).join("");
  const dots = d.nivel.map((v, i) => `<circle cx="${x(i)}" cy="${y(v)}" r="4.5" class="trend-dot"/>`).join("");
  // Zonas de hover/foco más anchas que la marca: una columna por mes.
  const hits = d.months.map((m, i) => `
    <rect x="${x(i) - step / 2}" y="${top}" width="${step}" height="${bottom - top}" class="trend-hit" data-trend-i="${i}"
      tabindex="0" aria-label="${m}: tu nivel ${d.nivel[i]}, demanda del mercado ${d.demanda[i]}"/>`).join("");
  const tableRows = d.months.map((m, i) => `<tr><th scope="row">${m}</th><td>${d.nivel[i]}</td><td>${d.demanda[i]}</td></tr>`).join("");

  return `
    <article class="ruta-card ruta-trend">
      <header class="ruta-card-header">
        <h2 class="ruta-card-title">Tendencia de Habilidades</h2>
        ${sampleTag}
      </header>
      <div class="trend-plot">
        <svg viewBox="0 0 ${TREND.width} ${TREND.height}" role="img" aria-label="Tendencia de ejemplo: tu nivel frente a la demanda del mercado, enero a junio">
          ${grid}${months}
          <line class="trend-cross" x1="0" x2="0" y1="${top}" y2="${bottom}" visibility="hidden"/>
          <path d="${path(d.demanda)}" class="trend-line trend-line--demanda"/>
          <path d="${path(d.nivel)}" class="trend-line trend-line--nivel"/>
          ${dots}${hits}
        </svg>
        <div class="trend-tooltip" role="status" hidden></div>
      </div>
      <ul class="trend-legend">
        <li><span class="legend-key legend-key--nivel"></span>Tu Nivel</li>
        <li><span class="legend-key legend-key--demanda"></span>Demanda del mercado</li>
      </ul>
      <!-- sr-only va en un div: una <table> ignora width:1px y su ancho real desbordaba la página en pantallas angostas -->
      <div class="sr-only">
        <table>
          <caption>Tendencia de habilidades (datos de ejemplo)</caption>
          <thead><tr><th scope="col">Mes</th><th scope="col">Tu nivel</th><th scope="col">Demanda del mercado</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
    </article>`;
}

// Crosshair + tooltip del gráfico de tendencia (mouse y teclado).
function bindTrendHover(container) {
  const plot = container.querySelector(".trend-plot");
  if (!plot) return;
  const d = sampleTrendData();
  const cross = plot.querySelector(".trend-cross");
  const tooltip = plot.querySelector(".trend-tooltip");

  const show = hit => {
    const i = Number(hit.dataset.trendI);
    const cx = Number(hit.getAttribute("x")) + Number(hit.getAttribute("width")) / 2;
    cross.setAttribute("x1", cx);
    cross.setAttribute("x2", cx);
    cross.setAttribute("visibility", "visible");
    tooltip.innerHTML = `<strong>${d.months[i]}</strong><span><i class="legend-key legend-key--nivel"></i>Tu nivel ${d.nivel[i]}</span>
      <span><i class="legend-key legend-key--demanda"></i>Demanda ${d.demanda[i]}</span>`;
    tooltip.hidden = false;
    // Posición horizontal en % del ancho; en los extremos se ancla al borde para que no se salga.
    const pct = (cx / TREND.width) * 100;
    tooltip.style.left = `${pct}%`;
    tooltip.style.transform = pct > 75 ? "translateX(-100%)" : pct < 25 ? "none" : "translateX(-50%)";
  };
  const hide = () => { cross.setAttribute("visibility", "hidden"); tooltip.hidden = true; };

  plot.addEventListener("pointerover", e => { const hit = e.target.closest(".trend-hit"); if (hit) show(hit); });
  plot.addEventListener("focusin", e => { const hit = e.target.closest(".trend-hit"); if (hit) show(hit); });
  plot.addEventListener("pointerleave", hide);
  plot.addEventListener("focusout", hide);
}

// Skeleton de carga: misma grilla y tarjetas que la vista final. El texto solo lo leen los lectores de pantalla.
function renderRutaSkeleton() {
  const gapRow = `<div><span class="skel skel-line skel-line--half"></span><span class="skel skel-bar"></span></div>`;
  return `
    <div class="ruta-grid ruta-skeleton" role="status">
      <span class="sr-only">Cargando tu ruta…</span>
      <div class="ruta-col" aria-hidden="true">
        <div class="ruta-card ruta-gauge">
          <span class="skel skel-line skel-line--title"></span>
          <span class="skel skel-ring"></span>
          <span class="skel skel-line skel-line--short"></span>
          <span class="skel skel-line skel-line--shorter"></span>
          <span class="skel skel-pill"></span>
        </div>
        <div class="skel-action"></div>
      </div>
      <div class="ruta-col" aria-hidden="true">
        <div class="ruta-card">
          <div class="ruta-card-header"><span class="skel skel-line skel-line--title"></span></div>
          <div class="gap-list">${gapRow.repeat(3)}</div>
        </div>
        <div class="ruta-card">
          <div class="ruta-card-header"><span class="skel skel-line skel-line--title"></span></div>
          <span class="skel skel-chart"></span>
        </div>
      </div>
    </div>`;
}

function renderApiError(err) {
  return `
    <div class="card p-6 md:col-span-2 border border-dashed" style="border-color:#D95F8E;">
      <p class="text-sm font-medium text-gray-700">No pudimos cargar tus datos</p>
      <p class="text-xs text-gray-400 mt-1">El servidor de SkillMap no responde. Recarga la página en unos minutos para intentarlo de nuevo.</p>
      <p class="text-xs text-gray-300 mt-2">Detalle técnico: servidor en <code>${API_BASE_URL}</code>
      (<code>./mvnw spring-boot:run</code> desde skillmap-api) · ${err.message}</p>
    </div>`;
}

// "Ver detalle de brechas": muestra las brechas ocultas y lleva la vista a la tarjeta.
function showAllGaps() {
  const card = document.getElementById("brechas-card");
  if (!card) return;
  card.querySelectorAll(".gap-row[data-extra]").forEach(row => { row.hidden = false; });
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  card.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  card.focus({ preventScroll: true });
}

// Objetivo elegido por el usuario. La API no guarda el objetivo activo, así que vive en el navegador.
const GOAL_STORAGE_KEY = "skillmap.goalId";

function readSavedGoalId() {
  try { return localStorage.getItem(GOAL_STORAGE_KEY); } catch { return null; }
}

function saveGoalId(goalId) {
  try { localStorage.setItem(GOAL_STORAGE_KEY, String(goalId)); } catch { /* sin storage: solo dura la sesión */ }
}

let goalsRequest = null; // compartida con la vista Objetivo para no pedir /api/goals dos veces

function fetchGoals() {
  if (!goalsRequest) {
    goalsRequest = fetch(`${API_BASE_URL}/api/goals`)
      .then(res => {
        if (!res.ok) throw new Error("La API respondió " + res.status);
        return res.json();
      })
      .catch(err => { goalsRequest = null; throw err; }); // si falla, se reintenta en la próxima llamada
  }
  return goalsRequest;
}

let skillsRequest = null; // compartida entre Mapa Visual y Perfil para no pedir /api/skills dos veces

function fetchSkills() {
  if (!skillsRequest) {
    skillsRequest = fetch(`${API_BASE_URL}/api/skills`)
      .then(res => {
        if (!res.ok) throw new Error("La API respondió " + res.status);
        return res.json();
      })
      .catch(err => { skillsRequest = null; throw err; }); // si falla, se reintenta en la próxima llamada
  }
  return skillsRequest;
}

// Llena el <select id="goal-selector"> con los objetivos de la API y selecciona el guardado (o el primero).
async function loadGoals() {
  const selector = document.getElementById("goal-selector");
  const goals = await fetchGoals();

  selector.innerHTML = goals.map(g => `<option value="${g.id}">${escapeHtml(g.title)}</option>`).join("");
  selector.disabled = goals.length === 0;
  const saved = readSavedGoalId();
  if (goals.some(g => String(g.id) === saved)) selector.value = saved;
  return goals;
}

// Cambia el objetivo activo: lo guarda, lo aplica al selector de Mi Ruta y recarga el dashboard.
async function setActiveGoal(goalId) {
  const selector = document.getElementById("goal-selector");
  saveGoalId(goalId);
  // Si el selector no cargó (p. ej. la API falló al abrir la app), se vuelve a llenar antes de elegir.
  if (![...selector.options].some(o => o.value === String(goalId))) await loadGoals().catch(() => {});
  selector.value = goalId;
  loadDashboard(goalId);
}

let latestRequest = 0; // evita que una respuesta vieja pise la del objetivo recién elegido

async function loadDashboard(goalId) {
  const container = document.getElementById("app-content");
  const requestId = ++latestRequest;
  document.getElementById("market-demand").hidden = true;
  container.innerHTML = renderRutaSkeleton();
  try {
    const res = await fetch(`${API_BASE_URL}/api/goals/${goalId}/readiness`);
    if (!res.ok) throw new Error("La API respondió " + res.status);
    const r = await res.json();
    if (requestId !== latestRequest) return;

    renderMarketDemand(r.gaps);
    container.innerHTML = `
      <div class="ruta-grid">
        <div class="ruta-col">${renderGauge(r)}${renderNextAction(r.gaps[0], r.goalTitle)}</div>
        <div class="ruta-col">${renderBrechas(r.gaps)}${renderTrend()}</div>
      </div>`;
    bindTrendHover(container);
  } catch (err) {
    if (requestId !== latestRequest) return;
    container.innerHTML = renderApiError(err);
  }
}

async function init() {
  const selector = document.getElementById("goal-selector");
  const container = document.getElementById("app-content");
  container.innerHTML = renderRutaSkeleton(); // mientras llegan los objetivos

  selector.addEventListener("change", () => setActiveGoal(selector.value));
  container.addEventListener("click", e => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "show-gaps") showAllGaps();
    if (action === "open-map") showView("mapa");
  });

  try {
    const goals = await loadGoals();
    if (goals.length === 0) {
      selector.innerHTML = `<option>Sin objetivos</option>`;
      container.innerHTML = `<p class="text-sm text-gray-400">Aún no hay objetivos profesionales disponibles.</p>`;
      return;
    }
    await loadDashboard(selector.value);
  } catch (err) {
    selector.innerHTML = `<option>Sin conexión</option>`;
    container.innerHTML = renderApiError(err);
  }
}

// Se espera a que carguen todos los scripts porque se usan helpers de mapa.js.
document.addEventListener("DOMContentLoaded", init);
