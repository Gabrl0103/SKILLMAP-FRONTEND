// Tarjeta "Tu semana" de Mi Ruta: plan de estudio de 3 habilidades para la semana (lunes a domingo, en la hora local
// del equipo). Sale de las brechas del objetivo: primero las que ya están en Aprendiendo y, dentro, por demanda del
// mercado. Cada una lleva horas sugeridas (planHours), una casilla para marcar el avance de la semana y el selector
// Pendiente / Aprendiendo / Dominada (skill-status.js), que guarda con PUT /api/skills/{id}/status.
// El backend no guarda planes: el plan vive en localStorage por usuario y objetivo ("skillmap.plan.{userId}.{goalId}":
// { week, ids, done }) y se rehace el primer día que se abre Mi Ruta en una semana nueva. Sin storage, dura hasta
// recargar (planMemory). Las semanas (weekStart, weekKey) también las usa rachas.js.
// La pinta loadDashboard (dashboard.js). Usa escapeHtml (mapa.js), sessionUser y friendlyError (session.js),
// renderStatusPicker, bindStatusPicker, focusStatusPicker, saveSkillStatus y SKILL_STATES (skill-status.js), routeDraw
// (route-motif.js) y t, tn, statusLabel, tSkill, tCategory, tGoalTitle y getLanguage (i18n.js).

const PLAN_SIZE = 3;
const PLAN_KEY = "skillmap.plan";

// ---------- Semanas: de lunes a domingo, en la hora local ----------

function weekStart(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // getDay: 0 = domingo
  return start;
}

// "2026-11-02": fecha local, sin hora (se compara como texto)
function dayKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

const weekKey = (date = new Date()) => dayKey(weekStart(date));

// Semana de una fecha ISO del backend (statusUpdatedAt); null sin fecha
const weekKeyOf = iso => (iso ? weekKey(new Date(iso)) : null);

// La semana anterior a una clave de semana
function previousWeekKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d - 7));
}

// ---------- Plan ----------

// Horas sugeridas por semana. Regla simple: la API no tiene la dificultad de cada habilidad, así que pesa la demanda
// del mercado. 2 h de base + 1 h por cada 25 % de demanda, redondeado hacia arriba (1–25 % → 3 h, 26–50 % → 4 h,
// 51–75 % → 5 h, 76–100 % → 6 h); 1 h menos si ya la estás aprendiendo (el arranque ya está hecho). Entre 2 y 6 h.
function planHours(skill) {
  const demand = Math.max(0, Math.min(100, Number(skill.demandPercentage) || 0));
  const hours = 2 + Math.ceil(demand / 25) - (skill.status === "IN_PROGRESS" ? 1 : 0);
  return Math.max(2, Math.min(6, hours));
}

// Las brechas que entran al plan: primero las que ya estás aprendiendo; dentro, por demanda (sort es estable: con la
// misma demanda queda el orden de la API)
function pickPlan(gaps) {
  const learningFirst = s => (s.status === "IN_PROGRESS" ? 0 : 1);
  return [...gaps].sort((a, b) => learningFirst(a) - learningFirst(b) || b.demandPercentage - a.demandPercentage)
    .slice(0, PLAN_SIZE).map(s => s.id);
}

const planMemory = new Map(); // respaldo sin localStorage

function readPlan(key) {
  try {
    const plan = JSON.parse(localStorage.getItem(key));
    if (!plan || typeof plan.week !== "string" || !Array.isArray(plan.ids)) return planMemory.get(key) ?? null;
    return { week: plan.week, ids: plan.ids.filter(Number.isInteger), done: (plan.done || []).filter(Number.isInteger) };
  } catch { return planMemory.get(key) ?? null; }
}

function savePlan(key, plan) {
  planMemory.set(key, plan);
  try { localStorage.setItem(key, JSON.stringify(plan)); } catch { /* sin storage: el plan dura hasta recargar */ }
}

// key: storage del plan; plan: { week, ids, done }; skills: habilidades del plan por id (con el estado al día); goal:
// título del objetivo ya traducido; busy: id que se está guardando; error/errorId: último error y su habilidad
const semana = { key: null, plan: null, skills: new Map(), goal: "", busy: null, error: null, errorId: null };

// El plan guardado de esta semana o uno nuevo. Se rehace al cambiar de semana o si se armó sin brechas y ahora hay.
// Las habilidades que ya no existen salen del plan; las dominadas se quedan (son el avance de la semana).
function prepareSemana(gaps, catalog, goalId, goalTitle) {
  const key = `${PLAN_KEY}.${sessionUser?.id ?? "anon"}.${goalId}`;
  const skills = new Map([...gaps, ...catalog].map(s => [s.id, s]));
  const week = weekKey();
  let plan = readPlan(key);
  if (!plan || plan.week !== week || (!plan.ids.length && gaps.length)) plan = { week, ids: pickPlan(gaps), done: [] };
  plan.ids = plan.ids.filter(id => skills.has(id));
  plan.done = plan.done.filter(id => plan.ids.includes(id));
  savePlan(key, plan);
  Object.assign(semana, { key, plan, skills, goal: escapeHtml(tGoalTitle(goalTitle)), busy: null, error: null, errorId: null });
}

// ---------- Marcado ----------

function semanaRange() {
  const start = weekStart();
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
  const format = new Intl.DateTimeFormat(getLanguage(), { day: "numeric", month: "short" });
  return t("semana.range", { from: format.format(start), to: format.format(end) });
}

function renderSemanaRow(skill) {
  const done = semana.plan.done.includes(skill.id);
  const hours = planHours(skill);
  const name = escapeHtml(tSkill(skill.name));
  const meta = [skill.category ? escapeHtml(tCategory(skill.category)) : "", t("semana.demand", { pct: skill.demandPercentage })]
    .filter(Boolean).join(" · ");
  return `
    <li class="semana-row${done ? " is-done" : ""}" data-plan-row="${skill.id}">
      <input type="checkbox" class="semana-check" id="semana-check-${skill.id}" data-plan-check="${skill.id}"${done ? " checked" : ""}
        aria-describedby="semana-hint">
      <div class="semana-skill">
        <label class="semana-name" for="semana-check-${skill.id}">${name}</label>
        <p class="semana-meta">${meta}</p>
      </div>
      <p class="semana-hours"><span aria-hidden="true">${t("semana.hours", { n: hours })}</span><span class="sr-only">${tn("semana.hoursLabel", hours)}</span></p>
      <div class="semana-status">${renderStatusPicker(skill, semana.busy === skill.id)}</div>
      ${semana.errorId === skill.id ? `<p class="semana-error" role="alert">${escapeHtml(t("state.error",
        { error: friendlyError(semana.error) }))}</p>` : ""}
    </li>`;
}

function semanaCount() {
  return t("semana.count", { n: semana.plan.done.length, total: semana.plan.ids.length });
}

function renderSemanaBody() {
  const rows = semana.plan.ids.map(id => semana.skills.get(id));
  if (!rows.length) {
    return `<div class="route-state">${routeDraw()}<p class="text-sm text-muted">${t("semana.empty", { goal: semana.goal })}</p></div>`;
  }
  const total = rows.reduce((sum, s) => sum + planHours(s), 0);
  const complete = rows.every(s => s.status === "MASTERED");
  return `
    <p class="semana-intro">${t(complete ? "semana.complete" : "semana.intro")}</p>
    <ul class="semana-list">${rows.map(renderSemanaRow).join("")}</ul>
    <footer class="semana-foot">
      <p class="semana-total"><span id="semana-count">${semanaCount()}</span> · ${t("semana.total", { n: total })}</p>
      <p id="semana-hint" class="semana-hint">${t("semana.hint")} ${t("semana.hoursRule")}</p>
    </footer>`;
}

// Tarjeta completa (loadDashboard). gaps: brechas del objetivo; catalog: /api/skills (trae también las del plan que ya
// quedaron dominadas); goalTitle: título del objetivo sin traducir
function renderSemanaCard(gaps, catalog, goalId, goalTitle) {
  prepareSemana(gaps, catalog, goalId, goalTitle);
  return `
    <article id="semana-card" class="ruta-card ruta-semana" aria-labelledby="semana-title">
      ${renderSemanaInner()}
    </article>`;
}

function renderSemanaInner() {
  return `
    <header class="ruta-card-header">
      <h2 id="semana-title" class="ruta-card-title">${t("semana.title")}</h2>
      <span class="ruta-card-hint">${semanaRange()}</span>
    </header>
    ${renderSemanaBody()}`;
}

// Repinta el contenido de la tarjeta (no la tarjeta: así no se repite su entrada) y devuelve el foco
function refreshSemana(focus = semanaFocus()) {
  const card = document.getElementById("semana-card");
  if (!card || !semana.plan) return;
  card.innerHTML = renderSemanaInner();
  focus?.();
}

// ---------- Foco ----------

// Dónde está el foco dentro de la tarjeta, como una función que lo devuelve tras repintar; null si no está en ella
function semanaFocus() {
  const active = document.activeElement;
  const row = active?.closest?.("#semana-card [data-plan-row]");
  if (!row) return null;
  const id = row.dataset.planRow;
  const inPicker = Boolean(active.closest(".status-picker"));
  return () => {
    const target = document.querySelector(`#semana-card [data-plan-row="${id}"]`);
    if (!target) { document.getElementById("semana-title")?.focus(); return; }
    if (inPicker) focusStatusPicker(target);
    else target.querySelector("[data-plan-check]")?.focus({ preventScroll: true });
  };
}

// ---------- Acciones ----------

function toggleSemanaDone(id, done) {
  const { plan } = semana;
  if (!plan?.ids.includes(id)) return;
  plan.done = done ? [...new Set([...plan.done, id])] : plan.done.filter(x => x !== id);
  savePlan(semana.key, plan);
  document.querySelector(`#semana-card [data-plan-row="${id}"]`)?.classList.toggle("is-done", done);
  const count = document.getElementById("semana-count");
  if (count) count.textContent = semanaCount();
}

// El estado cambia al instante; si el backend falla vuelve al anterior con el error en la fila. Al guardar, Mi Ruta se
// recarga sin skeleton (skillmap:progress con source "semana", dashboard.js) y el foco vuelve al selector.
async function setSemanaStatus(id, status) {
  const skill = semana.skills.get(id);
  if (!skill || !semana.plan?.ids.includes(id) || semana.busy !== null || skill.status === status) return;
  semana.skills.set(id, { ...skill, status });
  Object.assign(semana, { busy: id, errorId: null });
  refreshSemana();
  try {
    const saved = await saveSkillStatus(id, status);
    if (semana.busy !== id) return; // cambió el usuario o se recargó la vista mientras se guardaba
    semana.skills.set(id, { ...skill, ...saved });
    semana.busy = null;
    document.getElementById("ruta-live").textContent = t("state.saved", { name: tSkill(saved.name), status: statusLabel(saved.status) });
    document.dispatchEvent(new CustomEvent("skillmap:progress", { detail: { skill: saved, source: "semana" } }));
  } catch (err) {
    if (semana.busy !== id) return;
    semana.skills.set(id, skill);
    Object.assign(semana, { busy: null, error: err, errorId: id });
    refreshSemana();
  }
}

function initSemana() {
  const container = document.getElementById("app-content");
  container.addEventListener("change", e => {
    const check = e.target.closest("[data-plan-check]");
    if (check) toggleSemanaDone(Number(check.dataset.planCheck), check.checked);
  });
  // Los únicos selectores de estado de Mi Ruta son los de esta tarjeta
  bindStatusPicker(container, (id, status) => {
    if (SKILL_STATES.includes(status)) setSemanaStatus(id, status);
  });
}

document.addEventListener("skillmap:user", () => {
  Object.assign(semana, { key: null, plan: null, skills: new Map(), busy: null, error: null, errorId: null });
  planMemory.clear();
});

document.addEventListener("DOMContentLoaded", initSemana);
