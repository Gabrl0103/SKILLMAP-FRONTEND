// file:// o Live Server (localhost/127.0.0.1:5500): apunta al backend local. Si no, lo sirve el backend: mismo origen.
const API_BASE_URL = location.protocol === "file:" ||
  (location.port === "5500" && ["localhost", "127.0.0.1"].includes(location.hostname))
  ? "http://localhost:8080" : "";

// Vista "Mi Ruta". Usa escapeHtml y showView definidos en mapa.js (disponibles tras DOMContentLoaded), apiJson y
// sessionUser (session.js), SKILL_STATE_CLASS (skill-status.js), routeStopClass, routeDestination y routeDraw
// (route-motif.js), renderOffersCard y loadOffers (ofertas.js), renderSemanaCard y semanaFocus (plan-semanal.js: "Tu
// semana"), renderRitmoCard y ritmoFocus (rachas.js: "Tu ritmo") y t, tn, statusLabel, formatNumber, errorText, tSkill y
// tGoalTitle (i18n.js). Los datos se piden al iniciar sesión (loadRuta, desde session.js).

const VISIBLE_GAPS = 3; // el mockup muestra 3 brechas; "Ver más (n)", al pie de la tarjeta, despliega el resto

// ---------- Demanda ----------

// Demanda relativa a las habilidades del objetivo: tercio de mayor demanda = "Más demandada", tercio medio =
// "Intermedia", resto = "Menos demandada". Se compara por valor: habilidades con la misma demanda llevan el mismo badge.
function urgencyBadge(demand, referenceDemands) {
  const sorted = [...referenceDemands].sort((a, b) => b - a);
  const cut = third => sorted[Math.ceil((sorted.length * third) / 3) - 1];
  if (demand > 0 && demand >= cut(1)) return { label: t("ruta.urgency.critical"), tone: "hot" };
  if (demand > 0 && demand >= cut(2)) return { label: t("ruta.urgency.high"), tone: "mid" };
  return { label: t("ruta.urgency.medium"), tone: "neutral" };
}

// "Mercado Laboral": demanda media de las habilidades del objetivo frente a la de todo el catálogo.
const MARKET_HIGH_RATIO = 1.25;
const MARKET_LOW_RATIO = 0.8;

function averageDemandOf(skills) {
  return skills.reduce((sum, s) => sum + s.demandPercentage, 0) / skills.length;
}

// ---------- Datos de ejemplo ----------

// Etiqueta "Datos de ejemplo" (función: sale en el idioma vigente al pintar)
function sampleTag() {
  return `<span class="sample-tag">${t("common.sample")}</span>`;
}

// La demanda es real cuando el backend la calculó sobre ofertas (JOB_POSTINGS); si alguna habilidad aún tiene
// el valor sembrado (SEEDED), Mi Ruta, Mapa Visual y Perfil la etiquetan como datos de ejemplo (demand.sample).

function demandIsSample(skills) {
  return skills.some(s => s.demandSource !== "JOB_POSTINGS");
}

// Nota "Datos de ejemplo" + aviso de demanda, envuelta en un <p> con la clase dada. Vacía si la demanda es real.
function sampleDemandNote(className, skills) {
  return demandIsSample(skills) ? `<p class="${className}">${sampleTag()} ${t("demand.sample")}</p>` : "";
}

// "Basado en N ofertas reales · Arbeitnow, Remotive" a partir de /api/jobs/stats. Vacío si no hay ofertas.
// El Mapa Visual usa "Ruta calculada con N ofertas reales" (jobs.routeFrom).
function jobStatsText(stats, key = "jobs.basedOn") {
  if (!stats?.totalJobs) return "";
  const sources = stats.sources.filter(s => s.jobs > 0).map(s => escapeHtml(s.name)).join(", ");
  return `${t(key, { n: formatNumber(stats.totalJobs) })}${sources ? ` · ${sources}` : ""}`;
}

// ---------- Bloques de la vista ----------
// Orden de Mi Ruta: encabezado con el objetivo y la demanda del mercado en una palabra; fila 1, preparación con la ruta
// del objetivo a todo el ancho; fila 2, Tu semana con las brechas prioritarias + Tu ritmo; fila 3, tendencia + Mercado
// laboral con la comparación; fila 4, Ofertas para ti; al final, Siguiente giro a todo el ancho.

// Nivel de la demanda del objetivo frente al catálogo: null sin datos
function marketLevel(goalSkills, catalog) {
  const marketAvg = catalog.length ? averageDemandOf(catalog) : 0;
  if (!goalSkills.length || marketAvg === 0) return null;
  const goalAvg = averageDemandOf(goalSkills);
  const ratio = goalAvg / marketAvg;
  const level =
    ratio >= MARKET_HIGH_RATIO ? { label: t("ruta.market.high"), tone: "high", icon: "m3 17 6-6 4 4 8-8M15 7h6v6" } :
    ratio > MARKET_LOW_RATIO   ? { label: t("ruta.market.mid"), tone: "mid", icon: "M4 12h16M14 6l6 6-6 6" } :
                                 { label: t("ruta.market.low"), tone: "low", icon: "m3 7 6 6 4-4 8 8M15 17h6v-6" };
  return { ...level, numbers: { goal: Math.round(goalAvg), market: Math.round(marketAvg) } };
}

// "Mercado laboral" del encabezado: solo el nivel ("Demanda baja"); la comparación que lo explica está en la tarjeta
// Mercado laboral (renderMarketCard) y en el title. Sin datos, se oculta.
function renderMarketDemand(goalSkills, catalog) {
  const el = document.getElementById("market-demand");
  const level = marketLevel(goalSkills, catalog);
  if (!level) { el.hidden = true; return; }
  el.innerHTML = `
    <p class="market-demand-label">${t("ruta.market")}</p>
    <p class="market-demand-value market-demand-value--${level.tone}" title="${t("ruta.market.title", level.numbers)}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${level.icon}"/></svg>
      ${level.label}
    </p>`;
  el.hidden = false;
}

// Tarjeta "Mercado laboral": demanda media de las habilidades del objetivo y del catálogo completo. Cada barra mide el %
// real de ofertas que dice su texto (0–100), como las barras de demanda de las brechas.
// Pestaña Mercado: la comparación, las habilidades más pedidas del objetivo (MARKET_TOP, con la misma barra de % real) y
// de cuántas ofertas y fuentes sale la demanda (atribución a Remotive y Arbeitnow).
const MARKET_TOP = 5;

function renderMarketCard(goalSkills, catalog, goalTitle, jobStats = null) {
  const level = marketLevel(goalSkills, catalog);
  if (!level) {
    return `
      <section class="ruta-card ruta-market is-flat" aria-labelledby="market-title">
        <h2 id="market-title" class="ruta-card-title">${t("ruta.market")}</h2>
        <div class="route-state">${routeDraw()}<p class="text-sm text-muted">${t("ruta.market.empty")}</p></div>
      </section>`;
  }
  const bar = (pct, kind) => `<span class="market-bar" aria-hidden="true"><span class="market-bar-fill market-bar-fill--${kind}" style="width:${Math.max(0, Math.min(100, pct))}%"></span></span>`;
  const row = (label, pct, kind) => `
    <div class="market-row">
      <div class="market-row-head"><span class="market-row-name">${label}</span><span>${t("ruta.market.avg", { n: pct })}</span></div>
      ${bar(pct, kind)}
    </div>`;
  const top = [...goalSkills].sort((a, b) => b.demandPercentage - a.demandPercentage).slice(0, MARKET_TOP);
  const topList = top.length ? `
      <div class="market-top">
        <h3 class="market-top-title">${t("ruta.market.top")}</h3>
        <ul class="flat-rows" aria-label="${escapeHtml(t("ruta.market.top"))}">
          ${top.map(s => `<li class="market-top-row"><span>${escapeHtml(tSkill(s.name))}</span>${bar(s.demandPercentage, "goal")}<span>${s.demandPercentage}%</span></li>`).join("")}
        </ul>
      </div>` : "";
  const statsText = jobStatsText(jobStats, "jobs.routeFrom");
  return `
    <section class="ruta-card ruta-market is-flat" aria-labelledby="market-title">
      <h2 id="market-title" class="ruta-card-title">${t("ruta.market")}</h2>
      <div class="market-rows">
        ${row(escapeHtml(tGoalTitle(goalTitle)), level.numbers.goal, "goal")}
        ${row(t("ruta.market.catalog"), level.numbers.market, "catalog")}
      </div>
      <p class="market-text">${t("ruta.market.note", level.numbers)}</p>
      ${topList}
      ${sampleDemandNote("ruta-sample-note", goalSkills) || (statsText ? `<p class="ruta-sample-note">${statsText}</p>` : "")}
    </section>`;
}

// ---------- Pestañas de Mi Ruta ----------
// Bajo la tarjeta de preparación: Resumen (Tu semana, Tu ritmo, tendencia y Siguiente giro), Mercado y Ofertas. Patrón
// tablist: flechas, Inicio y Fin cambian de pestaña (activación automática) y solo la elegida entra con Tab. La elegida
// dura la sesión del navegador (sessionStorage) y se conserva al recargar Mi Ruta; cambiar no mueve la página: la fila de
// pestañas queda en el mismo punto de la pantalla.
const RUTA_TABS = ["summary", "market", "offers"];
const RUTA_TAB_KEY = "skillmap.ruta.tab";

function readRutaTab() {
  try {
    const saved = sessionStorage.getItem(RUTA_TAB_KEY);
    if (RUTA_TABS.includes(saved)) return saved;
  } catch { /* sin storage: Resumen */ }
  return "summary";
}

let rutaTab = readRutaTab();

function renderRutaTabs() {
  const tabs = RUTA_TABS.map(key => {
    const selected = key === rutaTab;
    return `<button type="button" class="view-tab" role="tab" id="ruta-tab-${key}" aria-controls="ruta-panel-${key}"
      aria-selected="${selected}" tabindex="${selected ? 0 : -1}">${t(`ruta.tab.${key}`)}</button>`;
  }).join("");
  return `<div class="view-tabs" role="tablist" aria-label="${escapeHtml(t("ruta.tabs"))}">${tabs}</div>`;
}

function renderRutaPanel(key, html) {
  return `<div class="view-tabpanel" role="tabpanel" id="ruta-panel-${key}" aria-labelledby="ruta-tab-${key}"${key === rutaTab ? "" : " hidden"}>${html}</div>`;
}

function selectRutaTab(key, { focus = false } = {}) {
  const tablist = document.querySelector("#app-content .view-tabs");
  if (!tablist || !RUTA_TABS.includes(key)) return;
  const before = tablist.getBoundingClientRect().top;
  rutaTab = key;
  try { sessionStorage.setItem(RUTA_TAB_KEY, key); } catch { /* sin storage: dura hasta recargar */ }
  tablist.querySelectorAll("[role='tab']").forEach(tab => {
    const selected = tab.id === `ruta-tab-${key}`;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
    if (selected && focus) tab.focus({ preventScroll: true });
  });
  document.querySelectorAll("#app-content .view-tabpanel").forEach(panel => { panel.hidden = panel.id !== `ruta-panel-${key}`; });
  const delta = tablist.getBoundingClientRect().top - before;
  if (Math.abs(delta) >= 1) window.scrollBy(0, delta);
}

function handleRutaTabKey(e) {
  const tab = e.target.closest("#app-content [role='tab']");
  if (!tab) return;
  const i = RUTA_TABS.indexOf(tab.id.replace("ruta-tab-", ""));
  const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: RUTA_TABS.length - 1 }[e.key];
  if (next === undefined) return;
  e.preventDefault();
  selectRutaTab(RUTA_TABS[(next + RUTA_TABS.length) % RUTA_TABS.length], { focus: true });
}

// Paradas de la ruta: todas las habilidades del objetivo, también las dominadas, por demanda. Las dominadas no vienen en
// r.gaps: se intercalan donde les toca por su demanda. Con la misma demanda decide el orden de la ruta (goalSkills), no el
// estado: una habilidad no salta de lugar al marcarla Dominada. Sin las habilidades del objetivo (goalSkills vacío), solo
// las brechas. Es el orden de "Tu semana" también.
function routeSkills(r, goalSkills) {
  const gapIds = new Set(r.gaps.map(s => s.id));
  const done = goalSkills.filter(s => !gapIds.has(s.id));
  const order = new Map(goalSkills.map((s, i) => [s.id, i]));
  const rank = s => order.get(s.id) ?? goalSkills.length;
  return [...r.gaps, ...done].sort((a, b) => b.demandPercentage - a.demandPercentage || rank(a) - rank(b));
}

// Con más de ROUTE_MAX_STOPS paradas la ruta se ve por tramos: ROUTE_SHOWN paradas, las dominadas más recientes (hasta
// ROUTE_RECENT) y las siguientes pendientes, en su orden; cada tramo oculto queda como un "+N" en su lugar, que despliega
// la ruta entera. Así la fila no pasa de unas 8 columnas y los nombres caben.
const ROUTE_MAX_STOPS = 7;
const ROUTE_SHOWN = 5;
const ROUTE_RECENT = 2;
let routeExpanded = false; // "+N" pulsado: la ruta completa hasta cambiar de objetivo o de usuario

function routeWindow(stops) {
  if (routeExpanded || stops.length <= ROUTE_MAX_STOPS) return stops.map(() => true);
  const isDone = s => s.status === "MASTERED";
  const done = stops.map((s, i) => i).filter(i => isDone(stops[i]))
    .sort((a, b) => String(stops[b].statusUpdatedAt || "").localeCompare(String(stops[a].statusUpdatedAt || "")));
  const pending = stops.map((s, i) => i).filter(i => !isDone(stops[i]));
  let recent = Math.min(ROUTE_RECENT, done.length);
  const next = Math.min(pending.length, ROUTE_SHOWN - recent);
  recent = Math.min(done.length, ROUTE_SHOWN - next);
  const shown = new Set([...done.slice(0, recent), ...pending.slice(0, next)]);
  return stops.map((s, i) => shown.has(i));
}

const ROUTE_CHECK = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`;

// "+N": un tramo oculto de la ruta, en su lugar. Dice cuántas paradas guarda y de qué tipo; al tocarlo se ve la ruta entera
function renderRouteMore(hidden, i) {
  const done = hidden.filter(s => s.status === "MASTERED").length;
  const parts = [done ? tn("ruta.route.moreDone", done) : "", hidden.length - done ? tn("ruta.route.morePending", hidden.length - done) : ""]
    .filter(Boolean).join(" · ");
  return `
      <li class="prep-stop prep-stop--more" style="--i:${i};">
        <button type="button" class="prep-stop-btn" data-action="show-route" title="${escapeHtml(parts)}"
          aria-label="${escapeHtml(t("ruta.route.moreAria", { n: hidden.length, detail: parts }))}">
          <span class="prep-dot" aria-hidden="true">+${hidden.length}</span>
          <span class="prep-stop-name" aria-hidden="true">${tn("ruta.route.more", hidden.length)}</span>
          <span class="prep-stop-state" aria-hidden="true">${t("ruta.route.showAll")}</span>
        </button>
      </li>`;
}

// Ruta del objetivo (como el riel de Brechas antes del rediseño): una parada por habilidad del objetivo, en el orden de
// routeSkills, con su punto de estado (punteado = pendiente, rosa→violeta = aprendiendo, menta con ✓ = dominada: la
// parada se queda en el camino) y el nombre, que abre el contexto de la habilidad; al final, el destino (el objetivo, ya
// dicho en el h1: va oculto a lectores). Entrada: los puntos aparecen en orden (--i) y cada tramo se traza hacia la
// parada siguiente.
function renderRouteStops(stops, goalTitle) {
  if (!stops.length) return "";
  const shown = routeWindow(stops);
  const items = [];
  let hidden = [];
  const flush = () => { if (hidden.length) { items.push(renderRouteMore(hidden, items.length)); hidden = []; } };
  stops.forEach((s, i) => {
    if (!shown[i]) { hidden.push(s); return; }
    flush();
    const state = SKILL_STATE_CLASS[s.status] || "pending";
    const name = tSkill(s.name);
    items.push(`
      <li class="prep-stop prep-stop--${state}" style="--i:${items.length};">
        <button type="button" class="prep-stop-btn" data-context="${s.id}"
          aria-label="${escapeHtml(`${t("skill.contextFor", { name })} · ${statusLabel(s.status)}`)}">
          <span class="prep-dot" aria-hidden="true" data-motion="pop:route-dot-${s.id}" data-value="${state}">${state === "mastered" ? ROUTE_CHECK : ""}</span>
          <span class="prep-stop-name">${escapeHtml(name)}</span>
          <span class="prep-stop-state" aria-hidden="true">${statusLabel(s.status)}</span>
        </button>
      </li>`);
  });
  flush();
  const dest = `
      <li class="prep-stop prep-stop--dest" style="--i:${items.length};" aria-hidden="true">
        <span class="prep-dot"></span>
        <span class="prep-stop-name">${escapeHtml(tGoalTitle(goalTitle))}</span>
        <span class="prep-stop-state">${t("ruta.route.dest")}</span>
      </li>`;
  return `<ol class="prep-route" aria-label="${escapeHtml(t("ruta.route.aria"))}" style="--stops:${items.length + 1};">${items.join("")}${dest}</ol>`;
}

// "+N": la ruta entera en el mismo lugar, sin repetir la entrada; el foco pasa a la primera parada que estaba oculta
let routeStops = { stops: [], goalTitle: "", goalId: null };

function expandRoute(button) {
  const route = button.closest(".prep-route");
  if (!route) return;
  const before = new Set([...route.querySelectorAll("[data-context]")].map(el => Number(el.dataset.context)));
  routeExpanded = true;
  route.outerHTML = renderRouteStops(routeStops.stops, routeStops.goalTitle);
  const fresh = document.querySelector("#app-content .prep-route");
  fresh.classList.add("is-expanded");
  const target = [...fresh.querySelectorAll("[data-context]")].find(el => !before.has(Number(el.dataset.context)));
  (target || fresh.querySelector("[data-context]"))?.focus({ preventScroll: true });
}

// Preparación (hero a todo el ancho): anillo grande con el %, el mensaje GPS, "X de N paradas dominadas" y, debajo del
// texto, la ruta del objetivo parada por parada (stops: routeSkills)
function renderGauge(r, stops = r.gaps) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (r.readinessPercentage / 100) * circumference;
  const remaining = r.totalCount - r.masteredCount;
  const goal = escapeHtml(tGoalTitle(r.goalTitle));
  const message = r.totalCount === 0
    ? t("ruta.gauge.noSkills", { goal })
    : remaining === 0
    ? t("ruta.gauge.done", { goal })
    : tn("ruta.gauge.remaining", remaining, { goal });
  const count = r.totalCount
    ? `<p class="prep-count">${t("ruta.gauge.stops", { n: `<strong data-motion="count:ruta-mastered">${r.masteredCount}</strong>`, total: `<strong>${r.totalCount}</strong>` })}</p>` : "";

  // Gauge compartido con el Analizador: --pct alimenta el conteo del número (styles.css); el span es el respaldo sin CSS.
  return `
    <article class="ruta-card ruta-gauge" aria-labelledby="prep-title">
      <div class="prep-top">
        <div class="gauge-ring ruta-gauge-ring" data-motion="ring:ruta-gauge" data-value="${r.readinessPercentage}">
          <svg viewBox="0 0 168 168" role="img" aria-label="${t("ruta.gauge.aria", { pct: r.readinessPercentage })}">
            <defs><linearGradient id="gauge-grad-ruta" x1="0" y1="0" x2="1" y2="1"><stop offset="0"/><stop offset="1"/></linearGradient></defs>
            <circle cx="84" cy="84" r="${radius}" fill="none" stroke-width="14" class="gauge-track"/>
            <circle cx="84" cy="84" r="${radius}" fill="none" stroke-width="14" class="gauge-fill" stroke="url(#gauge-grad-ruta)"
              transform="rotate(-90 84 84)" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" style="--circ:${circumference};"/>
          </svg>
          <p class="gauge-value" aria-hidden="true" style="--pct:${Math.round(r.readinessPercentage)};"><span>${r.readinessPercentage}%</span></p>
        </div>
        <div class="prep-copy">
          <h2 id="prep-title" class="ruta-card-title">${t("ruta.gauge.title")}</h2>
          <p class="ruta-gauge-text">${message}</p>
          ${count}
        </div>
      </div>
      ${renderRouteStops(stops, r.goalTitle)}
    </article>`;
}

// Fila de una brecha fuera del plan de la semana (se ven con "Ver más"): estado, nombre que abre el detalle, demanda y
// su nivel frente a las demás habilidades del objetivo
function renderGapRow(s, demands, i) {
  const badge = urgencyBadge(s.demandPercentage, demands);
  const state = SKILL_STATE_CLASS[s.status] || "pending";
  return `
    <li class="gap-row" style="--i:${i};" data-extra hidden>
      <span class="gap-dot gap-dot--${state}" aria-hidden="true"></span>
      <button type="button" class="gap-name gap-context" data-context="${s.id}" aria-label="${escapeHtml(t("skill.contextFor", { name: tSkill(s.name) }))}">
        ${escapeHtml(tSkill(s.name))}
      </button>
      <span class="sr-only">${statusLabel(s.status)}.</span>
      <span class="gap-demand">${t("ruta.gaps.demand", { pct: s.demandPercentage })}</span>
      <span class="gap-badge gap-badge--${badge.tone}">${badge.label}</span>
    </li>`;
}

// "Tu semana · Brechas prioritarias": el plan de la semana (plan-semanal.js, con horas y estado) y, plegadas detrás de
// "Ver más (n)", las demás brechas del objetivo; las dos listas siguen el orden de las paradas de la ruta (stops). reference:
// habilidades del objetivo contra las que se calculan los niveles de demanda. Al pie, de cuántas ofertas sale la demanda o
// el aviso de datos de ejemplo.
function renderBrechas(r, reference, jobStats, catalog, goalId, stops = r.gaps) {
  const gaps = r.gaps;
  const demands = reference.map(s => s.demandPercentage);
  const semana = renderSemanaCard(gaps, catalog, goalId, r.goalTitle, demands, stops.map(s => s.id));
  const planIds = new Set(semanaPlanIds());
  const rest = gaps.filter(s => !planIds.has(s.id));
  const statsText = jobStatsText(jobStats);
  const note = demandIsSample(gaps) ? `<p class="ruta-sample-note">${sampleTag()} ${t("demand.sample")}</p>`
    : statsText ? `<p class="ruta-sample-note">${statsText}</p>` : "";
  // Mismo botón con contorno que "Ver más" de Ofertas para ti
  const more = rest.length
    ? `<button type="button" class="btn-pill btn-pill--outline gaps-more" data-action="show-gaps">${t("ruta.showGaps", { n: rest.length })}</button>
       <ul class="gap-list">${rest.map((s, i) => renderGapRow(s, demands, i)).join("")}</ul>` : "";
  const foot = more || note ? `<div class="brechas-foot">${more}${note}</div>` : "";

  return `
    <article id="brechas-card" class="ruta-card ruta-brechas is-flat" tabindex="-1" aria-labelledby="brechas-title">
      <header class="ruta-card-header">
        <h2 id="brechas-title" class="ruta-card-title" tabindex="-1">${t("ruta.week.title")}</h2>
        <span class="ruta-card-hint">${semanaRange()}</span>
      </header>
      ${semana}
      ${foot}
    </article>`;
}

function renderNextAction(topGap, goalTitle) {
  if (!topGap) return "";
  const titleKey = topGap.status === "IN_PROGRESS" ? "ruta.next.progress" : "ruta.next.start";
  return `
    <article class="ruta-action" aria-labelledby="next-title">
      <div class="ruta-action-copy">
        <div class="ruta-action-head">
          <span class="ruta-action-eyebrow">${t("ruta.next.eyebrow")}</span>
          ${demandIsSample([topGap]) ? sampleTag() : ""}
        </div>
        <h2 id="next-title" class="ruta-action-title">${t(titleKey, { skill: escapeHtml(tSkill(topGap.name)) })}</h2>
        <p class="ruta-action-text">${t("ruta.next.text", { pct: topGap.demandPercentage, goal: escapeHtml(tGoalTitle(goalTitle)) })}</p>
      </div>
      <!-- La acción principal de Mi Ruta: abre la habilidad (qué es, cómo aprenderla y su estado) -->
      <button type="button" class="btn-pill btn-pill--light" data-context="${topGap.id}">
        ${t(topGap.status === "IN_PROGRESS" ? "ruta.next.ctaProgress" : "ruta.next.cta")}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </button>
    </article>`;
}

// ---------- Tendencia de preparación ----------
// Historial real del % de preparación (GET /api/goals/{id}/readiness/history): un punto por día con cambios. Línea en
// escalones: el % se mantiene hasta el siguiente cambio. Con menos de 2 puntos, estado vacío (nunca datos inventados).

const TREND_DAYS = 30;
// Geometría del gráfico (unidades del viewBox). Eje Y fijo de 0 a 100: la pendiente no exagera cambios chicos.
const TREND = { width: 520, height: 208, left: 40, right: 496, top: 16, bottom: 168, ticks: [0, 25, 50, 75, 100] };
const DAY_MS = 86400000;

// "2026-10-19" → días desde 1970, sin zona horaria: la fecha ya viene en el día del usuario
function trendDayNumber(date) {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d) / DAY_MS;
}

function trendDateLabel(date, options = { day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat(getLanguage(), { ...options, timeZone: "UTC" }).format(new Date(trendDayNumber(date) * DAY_MS));
}

// Puntos con su posición en el viewBox: X proporcional a los días, Y al %
function trendLayout(points) {
  const { left, right, top, bottom } = TREND;
  const first = trendDayNumber(points[0].date);
  const span = Math.max(1, trendDayNumber(points[points.length - 1].date) - first);
  return points.map(p => ({
    ...p,
    x: left + ((trendDayNumber(p.date) - first) / span) * (right - left),
    y: bottom - (p.percentage / 100) * (bottom - top),
  }));
}

// "+12 pts en 30 días" o "Sin cambios en …", del primer al último punto
function trendDelta(points) {
  const first = points[0], last = points[points.length - 1];
  const delta = last.percentage - first.percentage;
  const span = tn("ruta.trend.days", trendDayNumber(last.date) - trendDayNumber(first.date));
  if (delta === 0) return { text: t("ruta.trend.flat", { span }), tone: "flat" };
  return { text: t("ruta.trend.delta", { sign: delta > 0 ? "+" : "−", n: Math.abs(delta), span }), tone: delta > 0 ? "up" : "down" };
}

function renderTrendCard(header, body) {
  return `
    <article class="ruta-card ruta-trend is-flat">
      <header class="ruta-card-header">
        <h2 class="ruta-card-title">${t("ruta.trend.title")}</h2>
        ${header}
      </header>
      ${body}
    </article>`;
}

// history: lista de { date, percentage } ordenada por fecha, o null si no se pudo cargar
function renderTrend(history) {
  if (!history) return renderTrendCard("", `<p class="text-sm text-muted">${t("ruta.trend.error")}</p>`);
  if (history.length < 2) {
    return renderTrendCard("", `<div class="route-state">${routeDraw()}<p class="text-sm text-muted">${t("ruta.trend.empty")}</p></div>`);
  }

  const pts = trendLayout(history);
  const { left, right, top, bottom } = TREND;
  const last = pts[pts.length - 1];
  const delta = trendDelta(history);
  const y = v => bottom - (v / 100) * (bottom - top);
  const longDate = date => trendDateLabel(date, { dateStyle: "long" });

  const grid = TREND.ticks.map(v => `
    <line x1="${left}" x2="${right}" y1="${y(v)}" y2="${y(v)}" class="trend-grid"/>
    <text x="${left - 8}" y="${y(v) + 4}" text-anchor="end" class="trend-axis">${v}%</text>`).join("");
  // Fechas del eje X: la primera y la última, y una intermedia si hay sitio
  const mid = pts.length > 2 ? pts[Math.floor(pts.length / 2)] : null;
  const showMid = mid && mid.x - pts[0].x > 96 && last.x - mid.x > 96;
  const dateTicks = [[pts[0], "start"], ...(showMid ? [[mid, "middle"]] : []), [last, "end"]]
    .map(([p, anchor]) => `<text x="${p.x.toFixed(1)}" y="${bottom + 24}" text-anchor="${anchor}" class="trend-axis">${trendDateLabel(p.date)}</text>`).join("");

  // Escalones: horizontal hasta el día del cambio y luego vertical al nuevo valor
  const line = pts.map((p, i) => (i ? `H${p.x.toFixed(1)} V${p.y.toFixed(1)}` : `M${p.x.toFixed(1)} ${p.y.toFixed(1)}`)).join(" ");
  const area = `${line} V${bottom} H${pts[0].x.toFixed(1)} Z`;
  const dots = pts.slice(0, -1).map(p => `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" class="trend-dot"/>`).join("");
  // Valor del punto final: encima, o debajo si no cabe
  const labelY = last.y - 16 < top ? last.y + 24 : last.y - 16;

  // Zonas de hover y foco: de la mitad hacia el punto anterior a la mitad hacia el siguiente
  const hits = pts.map((p, i) => {
    const x0 = i ? (pts[i - 1].x + p.x) / 2 : left - 8;
    const x1 = i < pts.length - 1 ? (p.x + pts[i + 1].x) / 2 : right + 8;
    return `<rect x="${x0.toFixed(1)}" y="${top}" width="${(x1 - x0).toFixed(1)}" height="${bottom - top}" class="trend-hit" data-trend-i="${i}"
      data-cx="${p.x.toFixed(1)}" tabindex="0" aria-label="${escapeHtml(t("ruta.trend.point", { date: longDate(p.date), pct: p.percentage }))}"/>`;
  }).join("");

  const summary = t("ruta.trend.aria", {
    from: history[0].percentage, start: longDate(history[0].date),
    to: last.percentage, end: longDate(last.date), delta: delta.text,
  });
  const tableRows = history.map(p => `<tr><th scope="row">${longDate(p.date)}</th><td>${p.percentage}%</td></tr>`).join("");

  return renderTrendCard(`<span class="trend-delta trend-delta--${delta.tone}">${delta.text}</span>`, `
      <div class="trend-plot">
        <svg viewBox="0 0 ${TREND.width} ${TREND.height}" role="img" aria-label="${escapeHtml(summary)}">
          ${grid}${dateTicks}
          <path d="${area}" class="trend-area"/>
          <line class="trend-cross" x1="0" x2="0" y1="${top}" y2="${bottom}" visibility="hidden"/>
          <path d="${line}" class="trend-line" pathLength="1"/>
          ${dots}
          <circle cx="${last.x.toFixed(1)}" cy="${last.y.toFixed(1)}" r="8" class="trend-dot trend-dot--last"/>
          <text x="${(last.x - 12).toFixed(1)}" y="${labelY.toFixed(1)}" text-anchor="end" class="trend-last-label">${last.percentage}%</text>
          ${hits}
        </svg>
        <div class="trend-tooltip" role="status" hidden></div>
      </div>
      <!-- sr-only va en un div: una <table> ignora width:1px y su ancho real desbordaba la página en pantallas angostas -->
      <div class="sr-only">
        <table>
          <caption>${t("ruta.trend.caption")}</caption>
          <thead><tr><th scope="col">${t("ruta.trend.dateCol")}</th><th scope="col">${t("ruta.trend.pctCol")}</th></tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>`);
}

// Crosshair + tooltip del gráfico de tendencia (mouse y teclado).
function bindTrendHover(container, history) {
  const plot = container.querySelector(".trend-plot");
  if (!plot) return;
  const cross = plot.querySelector(".trend-cross");
  const tooltip = plot.querySelector(".trend-tooltip");

  const show = hit => {
    const p = history[Number(hit.dataset.trendI)];
    const cx = hit.dataset.cx;
    cross.setAttribute("x1", cx);
    cross.setAttribute("x2", cx);
    cross.setAttribute("visibility", "visible");
    tooltip.innerHTML = `<strong>${trendDateLabel(p.date)}</strong><span>${t("ruta.trend.tip", { pct: p.percentage })}</span>`;
    tooltip.hidden = false;
    // Posición horizontal en % del ancho; en los extremos se ancla al borde para que no se salga.
    const pct = (Number(cx) / TREND.width) * 100;
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
  const row = `<div class="skel-row"><span class="skel skel-line skel-line--half"></span><span class="skel skel-bar"></span></div>`;
  const card = (body, cls = "is-flat") => `<div class="ruta-card ${cls}"><div class="ruta-card-header"><span class="skel skel-line skel-line--title"></span></div>${body}</div>`;
  return `
    <div class="ruta-grid ruta-skeleton" role="status">
      <span class="sr-only">${t("ruta.loading")}</span>
      <div class="ruta-row ruta-row--single" aria-hidden="true">
        <div class="ruta-card ruta-gauge">
          <div class="prep-top"><span class="skel skel-ring"></span>
            <div class="prep-copy"><span class="skel skel-line skel-line--title"></span><span class="skel skel-line skel-line--short"></span>${routeDraw({ loop: true })}</div></div>
          <span class="skel skel-bar"></span>
        </div>
      </div>
      <div class="view-tabs" aria-hidden="true"><span class="view-tab"><span class="skel skel-line skel-line--short"></span></span></div>
      <div class="view-tabpanel" aria-hidden="true">
        <div class="ruta-row">
          ${card(row.repeat(3))}
          ${card(row.repeat(2))}
        </div>
        <div class="ruta-row ruta-row--single">${card(`<span class="skel skel-chart"></span>`)}</div>
      </div>
    </div>`;
}

// Error de carga: qué pasó, cómo seguir (Reintentar recarga la página; la sesión se conserva) y el detalle técnico
// plegado, para quien lo necesite sin ponerlo delante de todos
function renderApiError(err) {
  return `
    <div class="card p-6 md:col-span-2 border border-dashed border-pink api-error" role="alert">
      <p class="text-sm font-medium text-ink">${t("error.loadTitle")}</p>
      <p class="text-xs text-muted mt-1">${t("error.loadText")}</p>
      <button type="button" class="btn-pill btn-pill--outline api-error-retry" data-api-retry>${t("error.retry")}</button>
      <details class="api-error-detail">
        <summary>${t("error.techSummary")}</summary>
        <p>${t("error.techDetail", { server: `<code>${API_BASE_URL || location.origin}</code>`,
          cmd: "<code>./mvnw spring-boot:run</code>" })} · ${escapeHtml(errorText(err))}</p>
      </details>
    </div>`;
}

document.addEventListener("click", e => { if (e.target.closest("[data-api-retry]")) location.reload(); });

function revealExtraGaps(card) {
  card.querySelectorAll(".gap-row[data-extra]").forEach(row => { row.hidden = false; });
  card.querySelector(".gaps-more")?.remove(); // ya no queda nada que mostrar
}

// "Ver más (n)": muestra las brechas ocultas, quita el botón y pasa el foco a la primera nueva (como en Ofertas para ti)
function showAllGaps() {
  const card = document.getElementById("brechas-card");
  if (!card) return;
  const first = card.querySelector(".gap-row[data-extra] [data-context]");
  revealExtraGaps(card);
  first?.focus();
}

// ---------- Foco en las brechas ----------
// Recargar Mi Ruta borra las filas: la habilidad y su puesto se anotan antes y el foco se mueve al terminar el render.

let gapFocus = null; // { skillId, index } pendiente

// Dónde se abrió el detalle: en una parada de la ruta (preparación) o en la tarjeta de brechas; el foco vuelve ahí
let gapScope = "#brechas-card";

function gapLinks() {
  return [...document.querySelectorAll(`${gapScope} [data-context]`)];
}

function keepGapFocus(skillId) {
  gapFocus = { skillId, index: gapLinks().findIndex(link => Number(link.dataset.context) === skillId) };
}

// Al enlace de la habilidad; si ya no está (quedó dominada), a la brecha que ocupó su lugar o, si era la última, al título
// de la tarjeta. Espera a que termine la carga y no hace nada si el usuario ya siguió a otra vista u otro control (el
// botón "Volver" recién oculto todavía puede figurar como elemento activo).
function applyGapFocus() {
  if (!gapFocus || document.querySelector("#app-content .ruta-skeleton")) return;
  const { skillId, index } = gapFocus;
  gapFocus = null;
  const active = document.activeElement;
  const moved = active && active !== document.body && !active.closest("#view-skill");
  if (moved || document.getElementById("view-dashboard").classList.contains("hidden")) return;
  const links = gapLinks();
  const target = links.find(link => Number(link.dataset.context) === skillId) || links[index]
    || document.getElementById("brechas-title") || document.querySelector(".nav-item[data-view='dashboard']");
  if (target.closest("[data-extra]")) revealExtraGaps(document.getElementById("brechas-card"));
  target.focus();
}

// Objetivo elegido: lo guarda el backend por usuario (goalId de /api/auth/me). Antes vivía en el navegador; esa copia
// solo se lee, como respaldo para las cuentas que todavía no eligieron objetivo desde entonces.
const GOAL_STORAGE_KEY = "skillmap.goalId";

function readSavedGoalId() {
  try { return localStorage.getItem(GOAL_STORAGE_KEY); } catch { return null; }
}

// Objetivo guardado del usuario de la sesión, o el del navegador si no tiene; null si ninguno está en goals
function savedGoalId(goals) {
  const candidates = [sessionUser?.goalId, readSavedGoalId()].map(id => (id == null ? null : String(id)));
  return candidates.find(id => goals.some(g => String(g.id) === id)) ?? null;
}

let goalsRequest = null; // compartida con la vista Objetivo para no pedir /api/goals dos veces

function fetchGoals() {
  if (!goalsRequest) {
    goalsRequest = apiJson("/api/goals")
      .catch(err => { goalsRequest = null; throw err; }); // si falla, se reintenta en la próxima llamada
  }
  return goalsRequest;
}

let skillsRequest = null; // compartida entre Mapa Visual y Perfil para no pedir /api/skills dos veces

function fetchSkills() {
  if (!skillsRequest) {
    skillsRequest = apiJson("/api/skills")
      .catch(err => { skillsRequest = null; throw err; }); // si falla, se reintenta en la próxima llamada
  }
  return skillsRequest;
}

let jobStatsRequest = null; // compartida entre Mi Ruta y Mapa Visual

function fetchJobStats() {
  if (!jobStatsRequest) {
    jobStatsRequest = apiJson("/api/jobs/stats")
      .catch(err => { jobStatsRequest = null; throw err; }); // si falla, se reintenta en la próxima llamada
  }
  return jobStatsRequest;
}

// Sin caché: cada cambio de estado u objetivo puede agregar un punto, y Mi Ruta lo pide al recargarse.
function fetchReadinessHistory(goalId) {
  return apiJson(`/api/goals/${goalId}/readiness/history?days=${TREND_DAYS}`);
}

const readinessRequests = new Map(); // /api/goals/{id}/readiness por objetivo, compartida entre Mi Ruta y Mapa Visual

function fetchReadiness(goalId) {
  const key = String(goalId);
  if (!readinessRequests.has(key)) {
    readinessRequests.set(key, apiJson(`/api/goals/${key}/readiness`)
      .catch(err => { readinessRequests.delete(key); throw err; })); // si falla, se reintenta en la próxima llamada
  }
  return readinessRequests.get(key);
}

// Habilidades del objetivo (todas, también las dominadas) y catálogo completo, para comparar demandas.
async function fetchGoalDemand(goalId) {
  const [goals, catalog] = await Promise.all([fetchGoals(), fetchSkills()]);
  const goal = goals.find(g => String(g.id) === String(goalId));
  const ids = new Set((goal?.skills || []).map(s => s.skillId));
  return { goalSkills: catalog.filter(s => ids.has(s.id)), catalog };
}

// ---------- Selector de objetivo ----------
// El título del objetivo (h1 con gradiente) es un botón que abre una lista simple con los objetivos de la API
// (patrón listbox: el foco queda en la lista y aria-activedescendant marca la opción activa).

let activeGoalId = null; // objetivo que muestra Mi Ruta; lo leen Objetivo y Mapa Visual

function getActiveGoalId() {
  return activeGoalId;
}

const goalPicker = {
  button: () => document.getElementById("goal-button"),
  list: () => document.getElementById("goal-list"),
  options: () => [...document.querySelectorAll("#goal-list .goal-option")],
};

function setGoalTitle(text) {
  document.getElementById("goal-title").textContent = text;
}

// Llena la lista con los objetivos y deja seleccionado el activo.
function renderGoalOptions(goals) {
  const check = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 5 5 9-10"/></svg>`;
  goalPicker.list().innerHTML = goals.map(g => `
    <li id="goal-option-${g.id}" class="goal-option" role="option" data-goal-id="${g.id}" aria-selected="false">
      <span>${escapeHtml(tGoalTitle(g.title))}</span>${check}
    </li>`).join("");
  goalPicker.button().disabled = goals.length === 0;
}

function syncGoalPicker(goals) {
  goalPicker.options().forEach(o => o.setAttribute("aria-selected", String(o.dataset.goalId === activeGoalId)));
  const goal = goals?.find(g => String(g.id) === activeGoalId);
  if (goal) setGoalTitle(tGoalTitle(goal.title));
}

function setActiveOption(option) {
  const list = goalPicker.list();
  goalPicker.options().forEach(o => o.classList.toggle("is-active", o === option));
  if (!option) { list.removeAttribute("aria-activedescendant"); return; }
  list.setAttribute("aria-activedescendant", option.id);
  option.scrollIntoView({ block: "nearest" });
}

function openGoalList() {
  const list = goalPicker.list();
  if (!goalPicker.options().length) return;
  list.hidden = false;
  goalPicker.button().setAttribute("aria-expanded", "true");
  setActiveOption(goalPicker.options().find(o => o.dataset.goalId === activeGoalId) || goalPicker.options()[0]);
  list.focus();
}

function closeGoalList({ focusButton = true } = {}) {
  const list = goalPicker.list();
  if (list.hidden) return;
  list.hidden = true;
  goalPicker.button().setAttribute("aria-expanded", "false");
  setActiveOption(null);
  if (focusButton) goalPicker.button().focus();
}

function chooseGoal(option) {
  closeGoalList();
  if (option && option.dataset.goalId !== activeGoalId) changeGoalFromRuta(option.dataset.goalId);
}

function bindGoalPicker() {
  const button = goalPicker.button(), list = goalPicker.list();

  button.addEventListener("click", () => (list.hidden ? openGoalList() : closeGoalList()));
  button.addEventListener("keydown", e => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); openGoalList(); }
  });

  list.addEventListener("keydown", e => {
    const options = goalPicker.options();
    const current = options.findIndex(o => o.classList.contains("is-active"));
    const next = { ArrowDown: current + 1, ArrowUp: current - 1, Home: 0, End: options.length - 1 }[e.key];
    if (next !== undefined) {
      e.preventDefault();
      setActiveOption(options[Math.min(options.length - 1, Math.max(0, next))]);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      chooseGoal(options[current]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeGoalList();
    } else if (e.key === "Tab") {
      closeGoalList({ focusButton: false });
    }
  });
  list.addEventListener("click", e => {
    const option = e.target.closest(".goal-option");
    if (option) chooseGoal(option);
  });
  list.addEventListener("pointermove", e => {
    const option = e.target.closest(".goal-option");
    if (option && !option.classList.contains("is-active")) setActiveOption(option);
  });
  // Clic fuera o foco fuera: se cierra sin robar el foco
  document.addEventListener("pointerdown", e => {
    if (!e.target.closest(".goal-picker")) closeGoalList({ focusButton: false });
  });
  list.addEventListener("focusout", e => {
    if (!e.relatedTarget || !e.relatedTarget.closest(".goal-picker")) closeGoalList({ focusButton: false });
  });
}

// Llena el selector con los objetivos de la API y activa el guardado (o el primero).
async function loadGoals() {
  const goals = await fetchGoals();
  renderGoalOptions(goals);
  activeGoalId = savedGoalId(goals) ?? (goals[0] ? String(goals[0].id) : null);
  syncGoalPicker(goals);
  return goals;
}

// Cambia el objetivo activo: lo guarda en el backend (PUT /api/auth/me/goal; el progreso por habilidad es del usuario y
// no cambia), lo aplica al selector y recarga Mi Ruta. Mapa Visual, Perfil y el detalle de habilidad lo leen al abrirse
// (getActiveGoalId) y se recalculan solos. Si el backend falla, sigue el objetivo anterior y el error llega a quien llamó.
async function setActiveGoal(goalId) {
  const user = await apiJson("/api/auth/me/goal", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ goalId: Number(goalId) }),
  });
  if (sessionUser?.id !== user.id) return; // cambió el usuario mientras se guardaba
  sessionUser.goalId = user.goalId;
  // Si el selector no cargó (p. ej. la API falló al abrir la app), se vuelve a llenar antes de elegir.
  const goals = await (goalPicker.options().length ? fetchGoals() : loadGoals()).catch(() => null);
  activeGoalId = String(goalId);
  syncGoalPicker(goals);
  loadDashboard(goalId, { swap: true });
  const goal = goals?.find(g => String(g.id) === activeGoalId);
  if (goal) document.getElementById("ruta-live").textContent = t("goal.changed", { goal: tGoalTitle(goal.title) });
}

// Desde la lista del título: el error se muestra bajo el encabezado de Mi Ruta
async function changeGoalFromRuta(goalId) {
  const error = document.getElementById("goal-error");
  error.hidden = true;
  try {
    await setActiveGoal(goalId);
  } catch (err) {
    error.textContent = t("goal.error", { error: friendlyError(err) });
    error.hidden = false;
  }
}

let latestRequest = 0; // evita que una respuesta vieja pise la del objetivo recién elegido

// quiet: recarga sin skeleton ni entrada, para un cambio hecho en la propia Mi Ruta ("Tu semana"): lo pintado sigue a
// la vista hasta que llegan los datos y el foco vuelve a donde estaba (tarjetas Tu semana y Tu ritmo)
// swap: cambio de objetivo. Sin skeleton: lo pintado se atenúa (.is-leaving) mientras llegan los datos y lo nuevo entra
// con un fundido corto y escalonado (.is-swap); el anillo va del % anterior al nuevo (motion.js)
async function loadDashboard(goalId, { quiet = false, swap = false } = {}) {
  const container = document.getElementById("app-content");
  const requestId = ++latestRequest;
  rutaStale = false;
  const focusedGap = document.activeElement?.closest(".prep-route [data-context], #brechas-card [data-context]");
  if (focusedGap) {
    gapScope = focusedGap.closest(".prep-route") ? ".prep-route" : "#brechas-card";
    keepGapFocus(Number(focusedGap.dataset.context));
  }
  const painted = Boolean(container.querySelector(".ruta-grid:not(.ruta-skeleton)"));
  const silent = quiet && painted;
  const swapping = swap && !silent && painted;
  if (swapping) container.querySelector(".ruta-grid").classList.add("is-leaving");
  else if (!silent) {
    document.getElementById("market-demand").hidden = true;
    container.innerHTML = renderRutaSkeleton();
  }
  try {
    // La comparación, las estadísticas y el historial son complementarios: si fallan, la vista se muestra sin ellos.
    const [r, demand, jobStats, history] = await Promise.all([
      fetchReadiness(goalId),
      fetchGoalDemand(goalId).catch(() => ({ goalSkills: [], catalog: [] })),
      fetchJobStats().catch(() => null),
      fetchReadinessHistory(goalId).catch(() => null),
    ]);
    if (requestId !== latestRequest) return;
    const restoreFocus = silent ? semanaFocus() || ritmoFocus() : null;

    // Sin las habilidades del objetivo, badges y barras se calculan solo entre las brechas.
    const reference = demand.goalSkills.length ? demand.goalSkills : r.gaps;
    renderMarketDemand(demand.goalSkills, demand.catalog);
    const goal = escapeHtml(tGoalTitle(r.goalTitle));
    const stops = routeSkills(r, demand.goalSkills);
    if (String(goalId) !== routeStops.goalId) routeExpanded = false; // otro objetivo: la ruta vuelve a verse por tramos
    routeStops = { stops, goalTitle: r.goalTitle, goalId: String(goalId) };
    // Filas de dos columnas (ancha + angosta); si falta la angosta, la ancha ocupa toda la fila
    const row = (...cards) => {
      const shown = cards.filter(Boolean);
      return `<div class="ruta-row${shown.length < 2 ? " ruta-row--single" : ""}">${shown.join("")}</div>`;
    };
    // Arriba la única tarjeta (preparación y ruta); debajo, las pestañas con secciones sin tarjeta
    const focusedTab = document.activeElement?.closest("#app-content [role='tab']")?.id;
    container.innerHTML = `
      <div class="ruta-grid${silent ? " is-quiet" : swapping ? " is-swap" : ""}">
        ${row(renderGauge(r, stops))}
        ${renderRutaTabs()}
        ${renderRutaPanel("summary", `
          ${row(renderBrechas(r, reference, jobStats, demand.catalog, goalId, stops), renderRitmoCard(demand.catalog, demand.goalSkills, r))}
          ${row(renderTrend(history))}
          ${row(renderNextAction(r.gaps[0], r.goalTitle))}`)}
        ${renderRutaPanel("market", row(renderMarketCard(demand.goalSkills, demand.catalog, r.goalTitle, jobStats)))}
        ${renderRutaPanel("offers", row(renderOffersCard(goal)))}
      </div>`;
    if (focusedTab) document.getElementById(focusedTab)?.focus({ preventScroll: true });
    bindTrendHover(container, history);
    settleMotion(container); // motion.js: anillo, números y barras desde el valor que se veía
    loadOffers(goal, goalId, { quiet: silent }); // ofertas.js: llega después, sin frenar el resto de la vista
    restoreFocus?.();
  } catch (err) {
    if (requestId !== latestRequest) return;
    container.innerHTML = renderApiError(err);
  }
  applyGapFocus();
}

let rutaStale = false; // el progreso cambió (habilidad marcada en el Mapa): se recarga al volver a Mi Ruta

function initRuta() {
  setGoalTitle(t("common.loading"));
  document.getElementById("app-content").innerHTML = renderRutaSkeleton(); // hasta que haya sesión y lleguen los datos
  bindGoalPicker();
  document.getElementById("app-content").addEventListener("keydown", handleRutaTabKey);
  document.getElementById("app-content").addEventListener("click", e => {
    const tab = e.target.closest("[role='tab']");
    if (tab) { selectRutaTab(tab.id.replace("ruta-tab-", "")); return; }
    const context = e.target.closest("[data-context]");
    if (context) gapScope = context.closest(".prep-route") ? ".prep-route" : "#brechas-card";
    if (context) { openSkillDetail(Number(context.dataset.context), context); return; } // skill-detalle.js
    const actionEl = e.target.closest("[data-action]");
    if (actionEl?.dataset.action === "show-gaps") showAllGaps();
    if (actionEl?.dataset.action === "show-route") expandRoute(actionEl);
  });
}

// Al iniciar sesión: objetivos y ruta del usuario
async function loadRuta() {
  const container = document.getElementById("app-content");
  container.innerHTML = renderRutaSkeleton(); // mientras llegan los objetivos
  const requestId = ++latestRequest;
  try {
    const goals = await loadGoals();
    if (requestId !== latestRequest) return;
    if (goals.length === 0) {
      setGoalTitle(t("ruta.noGoals"));
      container.innerHTML = `<p class="text-sm text-muted-page">${t("objetivo.empty")}</p>`;
      return;
    }
    await loadDashboard(activeGoalId);
  } catch (err) {
    if (requestId !== latestRequest) return;
    setGoalTitle(t("ruta.offline"));
    container.innerHTML = renderApiError(err);
  }
}

// Al abrir Mi Ruta desde la barra superior (showView en mapa.js)
function openRuta() {
  if (!rutaStale || !activeGoalId) return;
  rutaStale = false;
  loadDashboard(activeGoalId);
}

// Cambio de usuario: fuera las cachés y lo pintado; una respuesta en vuelo del usuario anterior se descarta
document.addEventListener("skillmap:user", () => {
  goalsRequest = null;
  skillsRequest = null;
  jobStatsRequest = null;
  readinessRequests.clear();
  latestRequest++;
  rutaStale = false;
  gapFocus = null;
  activeGoalId = null;
  routeExpanded = false;
  routeStops = { stops: [], goalTitle: "", goalId: null };
  rutaTab = "summary"; // otra cuenta: Mi Ruta abre en Resumen
  try { sessionStorage.removeItem(RUTA_TAB_KEY); } catch { /* sin storage */ }
  closeGoalList({ focusButton: false });
  goalPicker.list().innerHTML = "";
  goalPicker.button().disabled = true;
  setGoalTitle(t("common.loading"));
  document.getElementById("goal-error").hidden = true;
  document.getElementById("market-demand").hidden = true;
  document.getElementById("app-content").innerHTML = renderRutaSkeleton();
});

// Cambio de idioma: con sesión se vuelve a pintar todo (las peticiones están en caché); sin ella, el estado de carga
document.addEventListener("skillmap:language", () => {
  if (sessionUser) { loadRuta(); return; }
  setGoalTitle(t("common.loading"));
  document.getElementById("app-content").innerHTML = renderRutaSkeleton();
});

// Progreso cambiado (habilidad marcada o quitada): habilidades y preparación se vuelven a pedir. Si Mi Ruta está a la
// vista (el cambio se hizo en "Tu semana", o se abrió mientras se guardaba en otra vista), se recarga ya, sin skeleton.
document.addEventListener("skillmap:progress", () => {
  skillsRequest = null;
  readinessRequests.clear();
  rutaStale = true;
  if (!document.getElementById("view-dashboard").classList.contains("hidden") && activeGoalId) {
    loadDashboard(activeGoalId, { quiet: true });
  }
});

// Se espera a que carguen todos los scripts porque se usan helpers de mapa.js.
document.addEventListener("DOMContentLoaded", initRuta);
