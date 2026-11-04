// Vista "Objetivo": el objetivo actual arriba (su preparación y "Ver mi ruta") y debajo las otras rutas posibles, cada una
// con su compatibilidad de hoy (el % de preparación que da /api/goals/{id}/readiness), cuántas habilidades comparte con
// el objetivo actual y la demanda de su mercado. Toda la tarjeta de una ruta es el botón para elegirla: pide
// confirmación en la propia tarjeta (Esc la cancela) y, ya cambiado, un aviso ofrece "Deshacer" (vuelve al objetivo
// anterior con el mismo PUT /api/auth/me/goal). El progreso por habilidad es del usuario, no del objetivo: cambiar no
// borra nada.
// Usa fetchGoals, fetchSkills, fetchReadiness, setActiveGoal, getActiveGoalId, savedGoalId, marketLevel y renderApiError
// (dashboard.js), escapeHtml/showView (mapa.js), routeDraw (route-motif.js), friendlyError (session.js) y t, tn,
// tGoalTitle y tGoalDescription (i18n.js).

function normalizeText(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// goals: /api/goals; catalog: /api/skills ([] si falló); readiness: % de preparación por id de objetivo (null si falló).
// pending: ruta que espera confirmación; prev: objetivo anterior (para Deshacer);
// query: búsqueda; focusOnOpen: al abrir desde "Cambiar objetivo" (Perfil) el foco va al objetivo actual.
const objetivoState = { goals: null, catalog: [], readiness: new Map(), pending: null, prev: null, busy: false,
  error: null, query: "", focusOnOpen: false };

// Objetivo activo actual: el de Mi Ruta; si aún no cargó, el guardado; si no, el primero.
function currentActiveGoalId(goals) {
  const active = getActiveGoalId(); // dashboard.js
  if (goals.some(g => String(g.id) === active)) return active;
  return savedGoalId(goals) ?? (goals[0] ? String(goals[0].id) : null);
}

const goalById = id => objetivoState.goals.find(g => String(g.id) === String(id));
const goalSkillIds = goal => new Set((goal?.skills || []).map(s => s.skillId));
const goalName = goal => escapeHtml(tGoalTitle(goal.title));

// Habilidades en común entre dos objetivos
function sharedSkills(a, b) {
  const ids = goalSkillIds(b);
  return [...goalSkillIds(a)].filter(id => ids.has(id)).length;
}

// "demanda baja" del objetivo (Mercado laboral de Mi Ruta), en minúscula para ir dentro de la frase; "" sin datos
function goalDemand(goal) {
  const ids = goalSkillIds(goal);
  const level = marketLevel(objetivoState.catalog.filter(s => ids.has(s.id)), objetivoState.catalog);
  return level ? level.label.toLocaleLowerCase(getLanguage()) : "";
}

const readinessOf = goal => objetivoState.readiness.get(String(goal.id)) ?? null;

function goalMeta(goal, current) {
  const demand = goalDemand(goal);
  return [
    tn("objetivo.skills", goal.skills.length),
    current ? tn("objetivo.common", sharedSkills(goal, current)) : "",
    demand ? t("objetivo.demand", { demand }) : "",
  ].filter(Boolean).join(" · ");
}

function renderHero(goal) {
  const pct = readinessOf(goal);
  const score = pct == null ? "" : `
    <div class="objetivo-hero-score">
      <span class="objetivo-hero-score-label">${t("objetivo.readiness")}</span>
      <span class="objetivo-hero-pct">${pct}<span>%</span></span>
      <span class="objetivo-bar" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, pct))}%"></span></span>
      <span class="objetivo-hero-score-note">${t("objetivo.readinessNote")}</span>
    </div>`;
  const desc = tGoalDescription(goal.title, goal.description || "");
  return `
    <section class="ruta-card objetivo-hero" aria-labelledby="objetivo-current-title">
      <div class="objetivo-hero-main">
        <div class="objetivo-hero-head">
          <span class="objetivo-chip">${t("objetivo.current")}</span>
          <h2 id="objetivo-current-title" class="objetivo-hero-title" tabindex="-1">${goalName(goal)}</h2>
          <p class="objetivo-hero-meta">${goalMeta(goal, null)}</p>
        </div>
        ${desc ? `<p class="objetivo-hero-desc">${escapeHtml(desc)}</p>` : ""}
        <button type="button" class="btn-pill objetivo-cta" data-action="view-route">
          ${t("objetivo.viewRoute")}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
        </button>
      </div>
      ${score}
    </section>`;
}

// Partes comunes de todas las tarjetas de la rejilla (rutas y "Otro objetivo"): título con el % o la etiqueta a la derecha
// y la línea de datos
function goalCardBody(goal, current, id) {
  const pct = readinessOf(goal);
  return `
    <span class="objetivo-card-top">
      <span class="objetivo-card-title">${goalName(goal)}</span>
      ${pct == null ? "" : `<span class="objetivo-card-pct">${pct}%</span>`}
    </span>
    <span class="objetivo-card-meta" id="objetivo-meta-${id}">${goalMeta(goal, current)}</span>
    ${pct == null ? "" : `<span class="objetivo-bar objetivo-bar--thin" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, pct))}%"></span></span>`}`;
}

// Toda la tarjeta es el botón para elegir la ruta. En espera de confirmación la tarjeta deja de ser botón (la
// confirmación lleva sus propios botones) y muestra la pregunta en su lugar.
function renderGoalCard(goal, current, index) {
  const id = String(goal.id);
  const pct = readinessOf(goal);
  const title = normalizeText(`${goal.title} ${tGoalTitle(goal.title)}`);
  const item = body => `<li class="objetivo-item" data-goal-id="${id}" data-title="${escapeHtml(title)}" style="--i:${index};">${body}</li>`;
  if (objetivoState.pending === id) {
    const busy = objetivoState.busy;
    return item(`
      <div class="objetivo-card is-pending">
        ${goalCardBody(goal, current, id)}
        <div class="objetivo-confirm" role="group" aria-labelledby="objetivo-confirm-${id}">
          <p id="objetivo-confirm-${id}">${t("objetivo.confirm", { goal: `<strong>${goalName(goal)}</strong>` })}</p>
          <div class="objetivo-card-actions">
            <button type="button" class="btn-ghost btn-ghost--strong" data-action="confirm" data-goal-id="${id}"${busy ? ` aria-busy="true" disabled` : ""}>
              ${t(busy ? "objetivo.saving" : "objetivo.confirmYes")}</button>
            <button type="button" class="btn-ghost" data-action="cancel" data-goal-id="${id}"${busy ? " disabled" : ""}>${t("objetivo.cancel")}</button>
          </div>
        </div>
      </div>`);
  }
  const label = pct == null ? t("objetivo.chooseFor", { goal: tGoalTitle(goal.title) })
    : t("objetivo.chooseForPct", { goal: tGoalTitle(goal.title), pct });
  return item(`
    <button type="button" class="objetivo-card objetivo-card--choose" data-action="choose" data-goal-id="${id}"
      aria-label="${escapeHtml(label)}" aria-describedby="objetivo-meta-${id}">
      ${goalCardBody(goal, current, id)}
      <span class="objetivo-card-cta" aria-hidden="true">${t("objetivo.choose")}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>
      </span>
    </button>`);
}

function renderObjetivo() {
  const { goals } = objetivoState;
  if (!goals.length) return `<p class="objetivo-empty">${t("objetivo.empty")}</p>`;
  const current = goalById(currentActiveGoalId(goals));
  const others = goals.filter(g => g !== current);
  const prev = objetivoState.prev && goalById(objetivoState.prev);
  const toast = prev ? `
    <div class="objetivo-toast">
      <p>${t("objetivo.changedTo", { goal: goalName(current) })}</p>
      <button type="button" class="btn-ghost btn-ghost--strong" data-action="undo">${t("objetivo.undo")}</button>
    </div>` : "";
  return `
    ${toast}
    ${renderHero(current)}
    <section class="objetivo-others" aria-labelledby="objetivo-others-title">
      <div class="objetivo-others-head">
        <div>
          <h2 id="objetivo-others-title" class="ruta-card-title" tabindex="-1">${t("objetivo.others")}</h2>
          <p class="objetivo-others-text">${t("objetivo.othersText")}</p>
        </div>
        <label class="objetivo-search">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
          <span class="sr-only">${t("objetivo.search")}</span>
          <input id="objetivo-search" type="search" autocomplete="off" placeholder="${escapeHtml(t("objetivo.searchPlaceholder"))}" value="${escapeHtml(objetivoState.query)}">
        </label>
      </div>
      <p class="objetivo-error" role="alert"${objetivoState.error ? "" : " hidden"}>${objetivoState.error ? escapeHtml(t("goal.error", { error: friendlyError(objetivoState.error) })) : ""}</p>
      <p class="objetivo-empty" hidden></p>
      <ul class="objetivo-grid">
        ${others.map((g, i) => renderGoalCard(g, current, i)).join("")}
        <!-- "Otro objetivo": misma tarjeta, todavía no disponible (borde punteado = aún no; sin acción) -->
        <li class="objetivo-item objetivo-item--otro" style="--i:${others.length};">
          <div class="objetivo-card objetivo-card--otro" aria-disabled="true">
            <span class="objetivo-card-top">
              <span class="objetivo-card-title">${t("objetivo.other")}</span>
              <span class="sample-tag">${t("common.soon")}</span>
            </span>
            <span class="objetivo-card-meta">${t("objetivo.otherText")}</span>
          </div>
        </li>
      </ul>
    </section>`;
}

// Filtra por la búsqueda y ajusta "Otro objetivo" para que la última fila de la rejilla (3 columnas) no deje huecos: ocupa
// las columnas que quedan libres en su fila, o la fila entera si empieza una nueva
function filterGoalCards() {
  const q = normalizeText(objetivoState.query.trim());
  const cards = [...document.querySelectorAll("#objetivo-content .objetivo-item[data-title]")];
  let visible = 0;
  cards.forEach(card => {
    card.hidden = !card.dataset.title.includes(q);
    if (!card.hidden) visible++;
  });
  const otro = document.querySelector("#objetivo-content .objetivo-item--otro");
  if (otro) otro.style.gridColumn = `span ${3 - (visible % 3)}`;
  const empty = document.querySelector("#objetivo-content .objetivo-empty");
  if (empty && cards.length) {
    empty.hidden = visible > 0;
    empty.textContent = visible ? "" : t("objetivo.noMatch", { query: objetivoState.query.trim() });
  }
}

// Vuelve a pintar la vista y deja el foco en el control indicado (selector CSS) o en el que lo tenía
function paintObjetivo(focusSelector) {
  const container = document.getElementById("objetivo-content");
  const active = document.activeElement;
  const keep = !focusSelector && active && container.contains(active)
    ? (active.id ? `#${active.id}` : active.dataset.action ? `[data-action='${active.dataset.action}'][data-goal-id='${active.dataset.goalId || ""}']` : null) : null;
  container.innerHTML = renderObjetivo();
  filterGoalCards();
  const target = focusSelector || keep;
  if (target) container.querySelector(target)?.focus({ preventScroll: !focusSelector });
}

function announceObjetivo(text) {
  document.getElementById("objetivo-live").textContent = text;
}

async function loadObjetivoData() {
  const goals = await fetchGoals();
  const [catalog, readiness] = await Promise.all([
    fetchSkills().catch(() => []),
    Promise.all(goals.map(g => fetchReadiness(g.id).then(r => r.readinessPercentage).catch(() => null))),
  ]);
  Object.assign(objetivoState, { goals, catalog, readiness: new Map(goals.map((g, i) => [String(g.id), readiness[i]])) });
}

async function openObjetivo() {
  const container = document.getElementById("objetivo-content");
  if (!objetivoState.goals) container.innerHTML = `<p class="route-state text-sm text-muted-page" role="status">${routeDraw({ loop: true })}${t("objetivo.loading")}</p>`;
  try {
    await loadObjetivoData(); // con caché; la preparación se vuelve a pedir si cambió el progreso
  } catch (err) {
    container.innerHTML = renderApiError(err); // se reintenta la próxima vez que se abra la vista
    return;
  }
  Object.assign(objetivoState, { pending: null, error: null });
  paintObjetivo(objetivoState.focusOnOpen ? "#objetivo-current-title" : null);
  objetivoState.focusOnOpen = false;
}

// "Cambiar objetivo" (Perfil): la vista Objetivo con el foco en el objetivo actual
function openGoalSelection() {
  objetivoState.focusOnOpen = true;
  showView("objetivo");
  window.scrollTo(0, 0);
}

// Cambia el objetivo (confirmado o desde Deshacer). Si falla, sigue el anterior y el error queda sobre la lista.
async function switchGoal(goalId, { undo = false } = {}) {
  if (objetivoState.busy) return;
  const before = currentActiveGoalId(objetivoState.goals);
  Object.assign(objetivoState, { busy: true, error: null });
  paintObjetivo();
  try {
    await setActiveGoal(goalId); // dashboard.js: guarda en el backend y recalcula Mi Ruta
    Object.assign(objetivoState, { prev: undo ? null : before, pending: null });
    const goal = goalById(goalId);
    announceObjetivo(t(undo ? "objetivo.undone" : "goal.changed", { goal: tGoalTitle(goal.title) }));
  } catch (err) {
    objetivoState.error = err;
  }
  objetivoState.busy = false;
  paintObjetivo(objetivoState.error ? null : "#objetivo-current-title");
  if (!objetivoState.error) window.scrollTo({ top: 0 });
}

function initObjetivo() {
  const container = document.getElementById("objetivo-content");
  container.addEventListener("input", e => {
    if (e.target.id !== "objetivo-search") return;
    objetivoState.query = e.target.value;
    filterGoalCards();
  });
  container.addEventListener("click", e => {
    const button = e.target.closest("[data-action]");
    if (!button || button.disabled) return;
    const id = button.dataset.goalId;
    switch (button.dataset.action) {
      case "view-route":
        showView("dashboard");
        window.scrollTo(0, 0);
        document.getElementById("goal-button").focus();
        break;
      case "choose":
        objetivoState.pending = id;
        paintObjetivo(`[data-action='confirm'][data-goal-id='${id}']`);
        container.querySelector(`.objetivo-item[data-goal-id='${id}']`)?.scrollIntoView({ block: "nearest" });
        break;
      case "cancel":
        objetivoState.pending = null;
        paintObjetivo(`[data-action='choose'][data-goal-id='${id}']`);
        break;
      case "confirm":
        switchGoal(id);
        break;
      case "undo":
        if (objetivoState.prev) switchGoal(objetivoState.prev, { undo: true });
        break;
    }
  });
  // Esc en la confirmación la cancela y devuelve el foco a la tarjeta
  container.addEventListener("keydown", e => {
    if (e.key !== "Escape" || !objetivoState.pending || objetivoState.busy || !e.target.closest(".objetivo-confirm")) return;
    e.preventDefault();
    const id = objetivoState.pending;
    objetivoState.pending = null;
    paintObjetivo(`[data-action='choose'][data-goal-id='${id}']`);
  });
}

// Cambio de usuario: la vista se vuelve a armar la próxima vez que se abra
document.addEventListener("skillmap:user", () => {
  Object.assign(objetivoState, { goals: null, catalog: [], readiness: new Map(), pending: null, prev: null,
    busy: false, error: null, query: "", focusOnOpen: false });
  document.getElementById("objetivo-content").innerHTML = "";
});

// Cambio de idioma: se vuelve a pintar conservando la búsqueda, la confirmación y el aviso
document.addEventListener("skillmap:language", () => {
  if (objetivoState.goals) paintObjetivo();
});

document.addEventListener("DOMContentLoaded", initObjetivo);
