// Vista "Objetivo": el objetivo actual arriba (su preparación y "Ver mi ruta") y debajo las otras rutas posibles, cada una
// con su compatibilidad de hoy (el % de preparación que da /api/goals/{id}/readiness), cuántas habilidades comparte con
// el objetivo actual y la demanda de su mercado. Cada ruta se puede comparar lado a lado con la actual o elegir: elegir
// pide confirmación en la propia tarjeta y, ya cambiado, un aviso ofrece "Deshacer" (vuelve al objetivo anterior). El
// progreso por habilidad es del usuario, no del objetivo: cambiar no borra nada.
// Usa fetchGoals, fetchSkills, fetchReadiness, setActiveGoal, getActiveGoalId, savedGoalId, marketLevel y renderApiError
// (dashboard.js), escapeHtml/showView (mapa.js), routeDraw (route-motif.js), friendlyError (session.js) y t, tn,
// tGoalTitle y tGoalDescription (i18n.js).

function normalizeText(text) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// goals: /api/goals; catalog: /api/skills ([] si falló); readiness: % de preparación por id de objetivo (null si falló).
// pending: ruta que espera confirmación; compare: ruta en la comparación; prev: objetivo anterior (para Deshacer);
// query: búsqueda; focusOnOpen: al abrir desde "Cambiar objetivo" (Perfil) el foco va al objetivo actual.
const objetivoState = { goals: null, catalog: [], readiness: new Map(), pending: null, compare: null, prev: null, busy: false,
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

function renderGoalCard(goal, current, index) {
  const id = String(goal.id);
  const pct = readinessOf(goal);
  const name = goalName(goal);
  const comparing = objetivoState.compare === id;
  const title = normalizeText(`${goal.title} ${tGoalTitle(goal.title)}`);
  const actions = objetivoState.pending === id
    ? `<div class="objetivo-confirm" role="group" aria-labelledby="objetivo-confirm-${id}">
        <p id="objetivo-confirm-${id}">${t("objetivo.confirm", { goal: `<strong>${name}</strong>` })}</p>
        <div class="objetivo-card-actions">
          <button type="button" class="btn-ghost btn-ghost--strong" data-action="confirm" data-goal-id="${id}"${objetivoState.busy ? ` aria-busy="true" disabled` : ""}>
            ${t(objetivoState.busy ? "objetivo.saving" : "objetivo.confirmYes")}</button>
          <button type="button" class="btn-ghost" data-action="cancel" data-goal-id="${id}"${objetivoState.busy ? " disabled" : ""}>${t("objetivo.cancel")}</button>
        </div>
      </div>`
    : `<div class="objetivo-card-actions">
        <button type="button" class="btn-ghost" data-action="compare" data-goal-id="${id}" aria-pressed="${comparing}">${t(comparing ? "objetivo.comparing" : "objetivo.compare")}</button>
        <button type="button" class="btn-ghost btn-ghost--strong" data-action="choose" data-goal-id="${id}" aria-label="${escapeHtml(t("objetivo.chooseFor", { goal: tGoalTitle(goal.title) }))}">${t("objetivo.choose")}</button>
      </div>`;
  return `
    <li class="objetivo-card${comparing ? " is-comparing" : ""}" data-goal-id="${id}" data-title="${escapeHtml(title)}" style="--i:${index};">
      <div class="objetivo-card-top">
        <h3 class="objetivo-card-title">${name}</h3>
        ${pct == null ? "" : `<span class="objetivo-card-pct"><span class="sr-only">${t("objetivo.compatLabel")}: </span>${pct}%</span>`}
      </div>
      <p class="objetivo-card-meta">${goalMeta(goal, current)}</p>
      ${pct == null ? "" : `<span class="objetivo-bar objetivo-bar--thin" aria-hidden="true"><span style="width:${Math.max(0, Math.min(100, pct))}%"></span></span>`}
      ${actions}
    </li>`;
}

// Comparación lado a lado: compatibilidad de cada una, cuántas habilidades son solo de cada ruta y cuántas comparten
function renderCompare(current, other) {
  const a = readinessOf(current), b = readinessOf(other);
  const shared = sharedSkills(current, other);
  const curName = goalName(current), otherName = goalName(other);
  let summary = "";
  if (a != null && b != null) {
    summary = a === b ? t("objetivo.cmp.same", { a: curName, b: otherName })
      : a > b ? t("objetivo.cmp.closer", { n: a - b, a: curName, b: otherName })
      : t("objetivo.cmp.closer", { n: b - a, a: otherName, b: curName });
  }
  const tile = (label, goal, pct, only) => `
    <div class="objetivo-compare-tile">
      <span class="objetivo-compare-label">${label}</span>
      <span class="objetivo-compare-name">${goalName(goal)}</span>
      <dl class="objetivo-compare-stats">
        <div><dt>${t("objetivo.cmp.compat")}</dt><dd>${pct == null ? "—" : `${pct}%`}</dd></div>
        <div><dt>${t("objetivo.cmp.only")}</dt><dd>${only}</dd></div>
      </dl>
    </div>`;
  return `
    <section class="ruta-card objetivo-compare" aria-labelledby="objetivo-compare-title">
      <header class="ruta-card-header">
        <h2 id="objetivo-compare-title" class="ruta-card-title" tabindex="-1">${t("objetivo.cmp.title")}</h2>
        <button type="button" class="btn-ghost" data-action="close-compare">${t("objetivo.cmp.close")}</button>
      </header>
      ${summary ? `<p class="objetivo-compare-summary">${summary}</p>` : ""}
      <div class="objetivo-compare-grid">
        ${tile(t("objetivo.cmp.yours"), current, a, current.skills.length - shared)}
        ${tile(t("objetivo.cmp.other"), other, b, other.skills.length - shared)}
      </div>
      <p class="objetivo-compare-shared">${tn("objetivo.cmp.shared", shared)}</p>
      <button type="button" class="btn-ghost btn-ghost--strong" data-action="choose" data-goal-id="${other.id}">${t("objetivo.cmp.choose", { goal: otherName })}</button>
    </section>`;
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
  const compared = objetivoState.compare && goalById(objetivoState.compare);
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
        <li class="objetivo-card objetivo-card--otro" aria-disabled="true" style="--i:${others.length};">
          <span class="objetivo-otro-plus" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>
          </span>
          <span class="objetivo-card-title">${t("objetivo.other")}</span>
          <span class="objetivo-otro-text">${t("objetivo.otherText")}</span>
          <span class="sample-tag">${t("common.soon")}</span>
        </li>
      </ul>
    </section>
    ${compared && compared !== current ? renderCompare(current, compared) : ""}`;
}

function filterGoalCards() {
  const q = normalizeText(objetivoState.query.trim());
  const cards = [...document.querySelectorAll("#objetivo-content .objetivo-card[data-title]")];
  let visible = 0;
  cards.forEach(card => {
    card.hidden = !card.dataset.title.includes(q);
    if (!card.hidden) visible++;
  });
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
    Object.assign(objetivoState, { prev: undo ? null : before, pending: null, compare: null });
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
      case "compare":
        objetivoState.compare = objetivoState.compare === id ? null : id;
        paintObjetivo(objetivoState.compare ? "#objetivo-compare-title" : `[data-action='compare'][data-goal-id='${id}']`);
        break;
      case "close-compare": {
        const was = objetivoState.compare;
        objetivoState.compare = null;
        paintObjetivo(`[data-action='compare'][data-goal-id='${was}']`);
        break;
      }
      case "choose":
        objetivoState.pending = id;
        paintObjetivo(`[data-action='confirm'][data-goal-id='${id}']`);
        container.querySelector(`.objetivo-card[data-goal-id='${id}']`)?.scrollIntoView({ block: "nearest" });
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
}

// Cambio de usuario: la vista se vuelve a armar la próxima vez que se abra
document.addEventListener("skillmap:user", () => {
  Object.assign(objetivoState, { goals: null, catalog: [], readiness: new Map(), pending: null, compare: null, prev: null,
    busy: false, error: null, query: "", focusOnOpen: false });
  document.getElementById("objetivo-content").innerHTML = "";
});

// Cambio de idioma: se vuelve a pintar conservando la búsqueda, la comparación y el aviso
document.addEventListener("skillmap:language", () => {
  if (objetivoState.goals) paintObjetivo();
});

document.addEventListener("DOMContentLoaded", initObjetivo);
