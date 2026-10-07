// file:// o Live Server (localhost/127.0.0.1:5500): apunta al backend local. Si no, lo sirve el backend: mismo origen.
const API_BASE_URL = location.protocol === "file:" ||
  (location.port === "5500" && ["localhost", "127.0.0.1"].includes(location.hostname))
  ? "http://localhost:8080" : "";

// Vista "Mi Ruta". Usa escapeHtml y showView definidos en mapa.js (disponibles tras DOMContentLoaded).

const STATUS_LABEL = { MASTERED: "Dominada", IN_PROGRESS: "En desarrollo", PENDING: "Por aprender" };
const VISIBLE_GAPS = 3; // el mockup muestra 3 brechas; "Ver detalle de brechas" despliega el resto

// ---------- Demanda ----------

// Urgencia relativa a las habilidades del objetivo: tercio de mayor demanda = "Crítica", tercio medio =
// "Alta demanda", resto = "Media". Se compara por valor: habilidades con la misma demanda llevan el mismo badge.
function urgencyBadge(demand, referenceDemands) {
  const sorted = [...referenceDemands].sort((a, b) => b - a);
  const cut = third => sorted[Math.ceil((sorted.length * third) / 3) - 1];
  if (demand > 0 && demand >= cut(1)) return { label: "Crítica", tone: "hot" };
  if (demand > 0 && demand >= cut(2)) return { label: "Alta demanda", tone: "hot" };
  return { label: "Media", tone: "neutral" };
}

// "Mercado Laboral": demanda media de las habilidades del objetivo frente a la de todo el catálogo.
const MARKET_HIGH_RATIO = 1.25;
const MARKET_LOW_RATIO = 0.8;

function averageDemandOf(skills) {
  return skills.reduce((sum, s) => sum + s.demandPercentage, 0) / skills.length;
}

// ---------- Datos de ejemplo (la API todavía no los provee) ----------

// DATOS DE EJEMPLO: la API no guarda histórico del nivel ni de la demanda. Valores fijos.
function sampleTrendData() {
  return {
    months: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
    nivel: [40, 45, 52, 58, 62, 68],
    demanda: [60, 62, 65, 70, 75, 82],
  };
}

const sampleTag = `<span class="sample-tag">Datos de ejemplo</span>`;

// La demanda es real cuando el backend la calculó sobre ofertas (JOB_POSTINGS); si alguna habilidad aún tiene
// el valor sembrado (SEEDED), Mi Ruta, Mapa Visual y Perfil la etiquetan como datos de ejemplo.
const SAMPLE_DEMAND_TEXT = "Demanda de ejemplo: aún no proviene de vacantes reales";

function demandIsSample(skills) {
  return skills.some(s => s.demandSource !== "JOB_POSTINGS");
}

// Nota "Datos de ejemplo" + aviso de demanda, envuelta en un <p> con la clase dada. Vacía si la demanda es real.
function sampleDemandNote(className, skills) {
  return demandIsSample(skills) ? `<p class="${className}">${sampleTag} ${SAMPLE_DEMAND_TEXT}</p>` : "";
}

// "Basado en N ofertas reales · Arbeitnow, Remotive" a partir de /api/jobs/stats. Vacío si no hay ofertas.
function jobStatsText(stats) {
  if (!stats?.totalJobs) return "";
  const sources = stats.sources.filter(s => s.jobs > 0).map(s => escapeHtml(s.name)).join(", ");
  return `Basado en ${stats.totalJobs} ofertas reales${sources ? ` · ${sources}` : ""}`;
}

// ---------- Bloques de la vista ----------

// "Mercado Laboral" del encabezado: las habilidades del objetivo frente al catálogo completo. Sin datos, se oculta.
function renderMarketDemand(goalSkills, catalog) {
  const el = document.getElementById("market-demand");
  const marketAvg = catalog.length ? averageDemandOf(catalog) : 0;
  if (!goalSkills.length || marketAvg === 0) { el.hidden = true; return; }
  const goalAvg = averageDemandOf(goalSkills);
  const ratio = goalAvg / marketAvg;
  const level =
    ratio >= MARKET_HIGH_RATIO ? { label: "Alta Demanda", tone: "high", icon: "m3 17 6-6 4 4 8-8M15 7h6v6" } :
    ratio > MARKET_LOW_RATIO   ? { label: "Demanda Media", tone: "mid", icon: "M4 12h16M14 6l6 6-6 6" } :
                                 { label: "Demanda Baja", tone: "low", icon: "m3 7 6 6 4-4 8 8M15 17h6v-6" };
  const title = `Las habilidades de este objetivo aparecen en promedio en el ${Math.round(goalAvg)}% de las ofertas; `
    + `las de todo el catálogo, en el ${Math.round(marketAvg)}%`;
  el.innerHTML = `
    <p class="market-demand-label">Mercado Laboral</p>
    <p class="market-demand-value market-demand-value--${level.tone}" title="${title}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${level.icon}"/></svg>
      ${level.label}
    </p>
    ${sampleDemandNote("market-demand-note", goalSkills)}`;
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
          <defs><linearGradient id="gauge-grad-ruta" x1="0" y1="0" x2="1" y2="1"><stop offset="0"/><stop offset="1"/></linearGradient></defs>
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke-width="18" class="gauge-track"/>
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke-width="18" class="gauge-fill" stroke="url(#gauge-grad-ruta)"
            transform="rotate(-90 80 80)" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <p class="gauge-value" aria-hidden="true" style="--pct:${Math.round(r.readinessPercentage)};"><span>${r.readinessPercentage}%</span></p>
      </div>
      <p class="ruta-gauge-text">${message}</p>
      ${r.gaps.length ? `<button type="button" class="btn-pill" data-action="show-gaps">Ver detalle de brechas</button>` : ""}
    </article>`;
}

// reference: habilidades del objetivo contra las que se calculan los badges y el largo de las barras.
function renderBrechas(gaps, reference, jobStats) {
  const demands = reference.map(s => s.demandPercentage);
  const maxDemand = Math.max(0, ...demands);
  // La API ya manda las brechas ordenadas por demanda.
  const rows = gaps.map((s, i) => {
    const badge = urgencyBadge(s.demandPercentage, demands);
    const barWidth = maxDemand ? Math.min(100, (s.demandPercentage / maxDemand) * 100) : 0;
    const extra = i >= VISIBLE_GAPS;
    return `
      <li class="gap-row"${extra ? " data-extra hidden" : ""}>
        <div class="gap-head">
          <span class="gap-name">${escapeHtml(s.name)}</span>
          <span class="gap-badge gap-badge--${badge.tone}">${badge.label}</span>
        </div>
        <div class="gap-bar" aria-hidden="true"><span style="width:${barWidth}%"></span></div>
        <div class="gap-meta">
          <span>Demanda: ${s.demandPercentage}%</span>
          <span class="gap-status">${STATUS_LABEL[s.status] || STATUS_LABEL.PENDING}</span>
        </div>
      </li>`;
  }).join("");

  // Demanda sembrada: aviso de ejemplo. Demanda real: de cuántas ofertas sale.
  const statsText = jobStatsText(jobStats);
  const note = demandIsSample(gaps) ? `<p class="ruta-sample-note">${sampleTag} ${SAMPLE_DEMAND_TEXT}</p>`
    : statsText ? `<p class="ruta-sample-note">${statsText}</p>` : "";
  const body = gaps.length
    ? `<ul class="gap-list">${rows}</ul>${note}`
    : `<p class="text-sm text-muted">No tienes brechas pendientes: ya dominas todas las habilidades de este objetivo.</p>`;

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
        ${demandIsSample([topGap]) ? sampleTag : ""}
      </div>
      <h2 class="ruta-action-title">${verb} ${escapeHtml(topGap.name)}</h2>
      <p class="ruta-action-text">Aparece en el ${topGap.demandPercentage}% de las ofertas analizadas y es tu brecha
        con más demanda para ${escapeHtml(goalTitle)}.</p>
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
    <div class="card p-6 md:col-span-2 border border-dashed border-pink">
      <p class="text-sm font-medium text-ink">No pudimos cargar tus datos</p>
      <p class="text-xs text-muted mt-1">El servidor de SkillMap no responde. Recarga la página en unos minutos para intentarlo de nuevo.</p>
      <p class="text-xs text-muted mt-2">Detalle técnico: servidor en <code>${API_BASE_URL || location.origin}</code>
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

let jobStatsRequest = null; // compartida entre Mi Ruta y Mapa Visual

function fetchJobStats() {
  if (!jobStatsRequest) {
    jobStatsRequest = fetch(`${API_BASE_URL}/api/jobs/stats`)
      .then(res => {
        if (!res.ok) throw new Error("La API respondió " + res.status);
        return res.json();
      })
      .catch(err => { jobStatsRequest = null; throw err; }); // si falla, se reintenta en la próxima llamada
  }
  return jobStatsRequest;
}

// Habilidades del objetivo (todas, también las dominadas) y catálogo completo, para comparar demandas.
async function fetchGoalDemand(goalId) {
  const [goals, catalog] = await Promise.all([fetchGoals(), fetchSkills()]);
  const goal = goals.find(g => String(g.id) === String(goalId));
  const ids = new Set((goal?.skills || []).map(s => s.skillId));
  return { goalSkills: catalog.filter(s => ids.has(s.id)), catalog };
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
    const readiness = fetch(`${API_BASE_URL}/api/goals/${goalId}/readiness`).then(res => {
      if (!res.ok) throw new Error("La API respondió " + res.status);
      return res.json();
    });
    // La comparación y las estadísticas son complementarias: si fallan, la vista se muestra sin ellas.
    const [r, demand, jobStats] = await Promise.all([
      readiness,
      fetchGoalDemand(goalId).catch(() => ({ goalSkills: [], catalog: [] })),
      fetchJobStats().catch(() => null),
    ]);
    if (requestId !== latestRequest) return;

    // Sin las habilidades del objetivo, badges y barras se calculan solo entre las brechas.
    const reference = demand.goalSkills.length ? demand.goalSkills : r.gaps;
    renderMarketDemand(demand.goalSkills, demand.catalog);
    container.innerHTML = `
      <div class="ruta-grid">
        <div class="ruta-col">${renderGauge(r)}${renderNextAction(r.gaps[0], r.goalTitle)}</div>
        <div class="ruta-col">${renderBrechas(r.gaps, reference, jobStats)}${renderTrend()}</div>
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
      container.innerHTML = `<p class="text-sm text-muted-page">Aún no hay objetivos profesionales disponibles.</p>`;
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
