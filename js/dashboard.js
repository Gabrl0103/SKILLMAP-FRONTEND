// file:// o Live Server (localhost/127.0.0.1:5500): apunta al backend local. Si no, lo sirve el backend: mismo origen.
const API_BASE_URL = location.protocol === "file:" ||
  (location.port === "5500" && ["localhost", "127.0.0.1"].includes(location.hostname))
  ? "http://localhost:8080" : "";

// Vista "Mi Ruta". Usa escapeHtml y showView definidos en mapa.js (disponibles tras DOMContentLoaded), apiJson y
// sessionUser (session.js), SKILL_STATE_CLASS (skill-status.js), routeStopClass, routeDestination y routeDraw
// (route-motif.js), renderOffersCard y loadOffers (ofertas.js) y t, tn, statusLabel, formatNumber, errorText, tSkill y
// tGoalTitle (i18n.js). Los datos se
// piden al iniciar sesión (loadRuta, desde session.js).

const VISIBLE_GAPS = 3; // el mockup muestra 3 brechas; "Ver detalle de brechas" despliega el resto

// ---------- Demanda ----------

// Urgencia relativa a las habilidades del objetivo: tercio de mayor demanda = "Crítica", tercio medio =
// "Alta demanda", resto = "Media". Se compara por valor: habilidades con la misma demanda llevan el mismo badge.
function urgencyBadge(demand, referenceDemands) {
  const sorted = [...referenceDemands].sort((a, b) => b - a);
  const cut = third => sorted[Math.ceil((sorted.length * third) / 3) - 1];
  if (demand > 0 && demand >= cut(1)) return { label: t("ruta.urgency.critical"), tone: "hot" };
  if (demand > 0 && demand >= cut(2)) return { label: t("ruta.urgency.high"), tone: "hot" };
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

// "Mercado Laboral" del encabezado: las habilidades del objetivo frente al catálogo completo. Sin datos, se oculta.
function renderMarketDemand(goalSkills, catalog) {
  const el = document.getElementById("market-demand");
  const marketAvg = catalog.length ? averageDemandOf(catalog) : 0;
  if (!goalSkills.length || marketAvg === 0) { el.hidden = true; return; }
  const goalAvg = averageDemandOf(goalSkills);
  const ratio = goalAvg / marketAvg;
  const level =
    ratio >= MARKET_HIGH_RATIO ? { label: t("ruta.market.high"), tone: "high", icon: "m3 17 6-6 4 4 8-8M15 7h6v6" } :
    ratio > MARKET_LOW_RATIO   ? { label: t("ruta.market.mid"), tone: "mid", icon: "M4 12h16M14 6l6 6-6 6" } :
                                 { label: t("ruta.market.low"), tone: "low", icon: "m3 7 6 6 4-4 8 8M15 17h6v-6" };
  const title = t("ruta.market.title", { goal: Math.round(goalAvg), market: Math.round(marketAvg) });
  el.innerHTML = `
    <p class="market-demand-label">${t("ruta.market")}</p>
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
  const goal = escapeHtml(tGoalTitle(r.goalTitle));
  const message = r.totalCount === 0
    ? t("ruta.gauge.noSkills", { goal })
    : remaining === 0
    ? t("ruta.gauge.done", { goal })
    : tn("ruta.gauge.remaining", remaining, { goal });

  // Gauge compartido con el Analizador: --pct alimenta el conteo del número (styles.css); el span es el respaldo sin CSS.
  return `
    <article class="ruta-card ruta-gauge">
      <h2 class="ruta-card-title">${t("ruta.gauge.title")}</h2>
      <div class="gauge-ring ruta-gauge-ring">
        <svg viewBox="0 0 160 160" role="img" aria-label="${t("ruta.gauge.aria", { pct: r.readinessPercentage })}">
          <defs><linearGradient id="gauge-grad-ruta" x1="0" y1="0" x2="1" y2="1"><stop offset="0"/><stop offset="1"/></linearGradient></defs>
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke-width="18" class="gauge-track"/>
          <circle cx="80" cy="80" r="${radius}" fill="none" stroke-width="18" class="gauge-fill" stroke="url(#gauge-grad-ruta)"
            transform="rotate(-90 80 80)" stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
        </svg>
        <p class="gauge-value" aria-hidden="true" style="--pct:${Math.round(r.readinessPercentage)};"><span>${r.readinessPercentage}%</span></p>
      </div>
      <p class="ruta-gauge-text">${message}</p>
      ${r.gaps.length ? `<button type="button" class="btn-pill" data-action="show-gaps">${t("ruta.showGaps")}</button>` : ""}
    </article>`;
}

// reference: habilidades del objetivo contra las que se calculan los badges y el largo de las barras. Las brechas van
// unidas por el riel del Motivo de Ruta (un punto de control por brecha, con su estado) hasta el objetivo.
function renderBrechas(gaps, reference, jobStats, goalTitle) {
  const demands = reference.map(s => s.demandPercentage);
  const maxDemand = Math.max(0, ...demands);
  // La API ya manda las brechas ordenadas por demanda.
  const rows = gaps.map((s, i) => {
    const badge = urgencyBadge(s.demandPercentage, demands);
    const barWidth = maxDemand ? Math.min(100, (s.demandPercentage / maxDemand) * 100) : 0;
    const extra = i >= VISIBLE_GAPS;
    // --i: orden de entrada del punto; las brechas ocultas entran desde 0 al mostrarse
    return `
      <li class="gap-row ${routeStopClass(s.status)}" style="--i:${extra ? i - VISIBLE_GAPS : i};"${extra ? " data-extra hidden" : ""}>
        <div class="gap-head">
          <span class="gap-name">${escapeHtml(tSkill(s.name))}</span>
          <span class="gap-badge gap-badge--${badge.tone}">${badge.label}</span>
        </div>
        <div class="gap-bar" aria-hidden="true"><span style="width:${barWidth}%"></span></div>
        <div class="gap-meta">
          <span>${t("ruta.gaps.demand", { pct: s.demandPercentage })}</span>
          <span class="mapa-chip mapa-chip--${SKILL_STATE_CLASS[s.status] || "pending"} gap-status">${statusLabel(s.status)}</span>
        </div>
        <button type="button" class="gap-context" data-context="${s.id}" aria-label="${escapeHtml(t("skill.contextFor", { name: tSkill(s.name) }))}">
          ${t("skill.context")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </li>`;
  }).join("");

  // Demanda sembrada: aviso de ejemplo. Demanda real: de cuántas ofertas sale.
  const statsText = jobStatsText(jobStats);
  const note = demandIsSample(gaps) ? `<p class="ruta-sample-note">${sampleTag()} ${t("demand.sample")}</p>`
    : statsText ? `<p class="ruta-sample-note">${statsText}</p>` : "";
  const destination = routeDestination(escapeHtml(tGoalTitle(goalTitle)), Math.min(gaps.length, VISIBLE_GAPS));
  const body = gaps.length
    ? `<ul class="gap-list route-rail">${rows}</ul>${destination}${note}`
    : `<div class="route-state">${routeDraw()}<p class="text-sm text-muted">${t("ruta.gaps.none")}</p></div>`;

  return `
    <article id="brechas-card" class="ruta-card ruta-brechas" tabindex="-1">
      <header class="ruta-card-header">
        <h2 id="brechas-title" class="ruta-card-title" tabindex="-1">${t("ruta.gaps.title")}</h2>
        <span class="ruta-card-hint">${t("ruta.gaps.hint")}</span>
      </header>
      ${body}
    </article>`;
}

function renderNextAction(topGap, goalTitle) {
  if (!topGap) return "";
  const titleKey = topGap.status === "IN_PROGRESS" ? "ruta.next.progress" : "ruta.next.start";
  return `
    <article class="ruta-action">
      <div class="ruta-action-head">
        <span class="ruta-action-eyebrow">${t("ruta.next.eyebrow")}</span>
        ${demandIsSample([topGap]) ? sampleTag() : ""}
      </div>
      <h2 class="ruta-action-title">${t(titleKey, { skill: escapeHtml(tSkill(topGap.name)) })}</h2>
      <p class="ruta-action-text">${t("ruta.next.text", { pct: topGap.demandPercentage, goal: escapeHtml(tGoalTitle(goalTitle)) })}</p>
      <button type="button" class="btn-pill btn-pill--light" data-action="open-map">
        ${t("ruta.next.cta")}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M6 4v16l14-8z"/></svg>
      </button>
      <svg class="ruta-action-bolt" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z"/></svg>
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
    <article class="ruta-card ruta-trend">
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
  const gapRow = `<div><span class="skel skel-line skel-line--half"></span><span class="skel skel-bar"></span></div>`;
  return `
    <div class="ruta-grid ruta-skeleton" role="status">
      <span class="sr-only">${t("ruta.loading")}</span>
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
          <div class="ruta-card-header"><span class="skel skel-line skel-line--title"></span>${routeDraw({ loop: true })}</div>
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
      <p class="text-sm font-medium text-ink">${t("error.loadTitle")}</p>
      <p class="text-xs text-muted mt-1">${t("error.loadText")}</p>
      <p class="text-xs text-muted mt-2">${t("error.techDetail", { server: `<code>${API_BASE_URL || location.origin}</code>`,
        cmd: "<code>./mvnw spring-boot:run</code>" })} · ${escapeHtml(errorText(err))}</p>
    </div>`;
}

function revealExtraGaps(card) {
  card.querySelectorAll(".gap-row[data-extra]").forEach(row => { row.hidden = false; });
}

// "Ver detalle de brechas": muestra las brechas ocultas y lleva la vista a la tarjeta.
function showAllGaps() {
  const card = document.getElementById("brechas-card");
  if (!card) return;
  revealExtraGaps(card);
  card.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
  card.focus({ preventScroll: true });
}

// ---------- Foco en las brechas ----------
// Recargar Mi Ruta borra las filas: la habilidad y su puesto se anotan antes y el foco se mueve al terminar el render.

let gapFocus = null; // { skillId, index } pendiente

function gapLinks() {
  return [...document.querySelectorAll("#brechas-card [data-context]")];
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
  loadDashboard(goalId);
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

async function loadDashboard(goalId) {
  const container = document.getElementById("app-content");
  const requestId = ++latestRequest;
  rutaStale = false;
  const focusedGap = document.activeElement?.closest("#brechas-card [data-context]");
  if (focusedGap) keepGapFocus(Number(focusedGap.dataset.context));
  document.getElementById("market-demand").hidden = true;
  container.innerHTML = renderRutaSkeleton();
  try {
    // La comparación, las estadísticas y el historial son complementarios: si fallan, la vista se muestra sin ellos.
    const [r, demand, jobStats, history] = await Promise.all([
      fetchReadiness(goalId),
      fetchGoalDemand(goalId).catch(() => ({ goalSkills: [], catalog: [] })),
      fetchJobStats().catch(() => null),
      fetchReadinessHistory(goalId).catch(() => null),
    ]);
    if (requestId !== latestRequest) return;

    // Sin las habilidades del objetivo, badges y barras se calculan solo entre las brechas.
    const reference = demand.goalSkills.length ? demand.goalSkills : r.gaps;
    renderMarketDemand(demand.goalSkills, demand.catalog);
    const goal = escapeHtml(tGoalTitle(r.goalTitle));
    container.innerHTML = `
      <div class="ruta-grid">
        <div class="ruta-col">${renderGauge(r)}${renderNextAction(r.gaps[0], r.goalTitle)}</div>
        <div class="ruta-col">${renderBrechas(r.gaps, reference, jobStats, r.goalTitle)}${renderOffersCard(goal)}${renderTrend(history)}</div>
      </div>`;
    bindTrendHover(container, history);
    loadOffers(goal, goalId); // ofertas.js: llega después, sin frenar el resto de la vista
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
  document.getElementById("change-goal").addEventListener("click", openGoalSelection); // objetivo.js
  document.getElementById("app-content").addEventListener("click", e => {
    const context = e.target.closest("[data-context]");
    if (context) { openSkillDetail(Number(context.dataset.context), context); return; } // skill-detalle.js
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "show-gaps") showAllGaps();
    if (action === "open-map") showView("mapa");
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
// vista (se abrió mientras se guardaba), se recarga ya.
document.addEventListener("skillmap:progress", () => {
  skillsRequest = null;
  readinessRequests.clear();
  rutaStale = true;
  if (!document.getElementById("view-dashboard").classList.contains("hidden")) openRuta();
});

// Se espera a que carguen todos los scripts porque se usan helpers de mapa.js.
document.addEventListener("DOMContentLoaded", initRuta);
