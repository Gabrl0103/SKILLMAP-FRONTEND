// Tarjeta "Tu semana" de Mi Ruta: plan de estudio de 3 habilidades para la semana (lunes a domingo, en la hora local
// del equipo). Sale de las brechas del objetivo: primero las que ya están en Aprendiendo y, dentro, por demanda del
// mercado. Cada una lleva horas sugeridas (planHours) y el selector Pendiente / Aprendiendo / Dominada (skill-status.js),
// que guarda con PUT /api/skills/{id}/status. El avance sale solo del estado: no hay otra casilla que marcar. La lista se
// muestra en el mismo orden que las paradas de la ruta (routeSkills en dashboard.js): una habilidad que pasa a Dominada
// conserva su lugar, en menta con su marca (es el avance de la semana), y la siguiente brecha entra al plan en el lugar
// que le toca en la ruta, así siempre quedan PLAN_SIZE por hacer mientras haya brechas.
// El backend no guarda planes: el plan vive en localStorage por usuario y objetivo ("skillmap.plan.{userId}.{goalId}":
// { week, ids }) y se rehace el primer día que se abre Mi Ruta en una semana nueva. Sin storage, dura hasta recargar
// (planMemory). Las semanas (weekStart, weekKey) también las usa rachas.js.
// La pinta renderBrechas (dashboard.js), dentro de "Tu semana · brechas prioritarias". Usa urgencyBadge (dashboard.js),
// escapeHtml (mapa.js), sessionUser y friendlyError (session.js), renderStatusPicker, bindStatusPicker,
// focusStatusPicker, saveSkillStatus, SKILL_STATES y SKILL_STATE_CLASS (skill-status.js), routeDraw (route-motif.js) y t,
// tn, statusLabel, tSkill, tCategory, tGoalTitle y getLanguage (i18n.js).

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

// Las brechas en el orden en que entran al plan: primero las que ya estás aprendiendo; dentro, por demanda (sort es
// estable: con la misma demanda queda el orden de la API)
function planOrder(gaps) {
  const learningFirst = s => (s.status === "IN_PROGRESS" ? 0 : 1);
  return [...gaps].sort((a, b) => learningFirst(a) - learningFirst(b) || b.demandPercentage - a.demandPercentage);
}

// Completa el plan hasta PLAN_SIZE habilidades por hacer (no dominadas) con las brechas que aún no están en él. Las
// dominadas se quedan: son el avance de la semana.
function fillPlan(ids, gaps, skills) {
  const next = [...ids];
  const pending = () => next.filter(id => skills.get(id)?.status !== "MASTERED").length;
  for (const gap of planOrder(gaps)) {
    if (pending() >= PLAN_SIZE) break;
    if (!next.includes(gap.id)) next.push(gap.id);
  }
  return next;
}

const planMemory = new Map(); // respaldo sin localStorage

function readPlan(key) {
  try {
    const plan = JSON.parse(localStorage.getItem(key));
    if (!plan || typeof plan.week !== "string" || !Array.isArray(plan.ids)) return planMemory.get(key) ?? null;
    return { week: plan.week, ids: plan.ids.filter(Number.isInteger) }; // planes viejos traían "done": ya no se usa
  } catch { return planMemory.get(key) ?? null; }
}

function savePlan(key, plan) {
  planMemory.set(key, plan);
  try { localStorage.setItem(key, JSON.stringify(plan)); } catch { /* sin storage: el plan dura hasta recargar */ }
}

// key: storage del plan; plan: { week, ids }; skills: habilidades del plan por id (con el estado al día); goal:
// título del objetivo ya traducido; busy: id que se está guardando; error/errorId: último error y su habilidad
const semana = { key: null, plan: null, skills: new Map(), goal: "", demands: [], route: new Map(), busy: null, error: null,
  errorId: null };

// El plan guardado de esta semana o uno nuevo, completado con brechas nuevas si alguna quedó dominada. Las
// habilidades que ya no existen salen del plan.
function prepareSemana(gaps, catalog, goalId, goalTitle) {
  const key = `${PLAN_KEY}.${sessionUser?.id ?? "anon"}.${goalId}`;
  const skills = new Map([...gaps, ...catalog].map(s => [s.id, s]));
  const week = weekKey();
  let plan = readPlan(key);
  if (!plan || plan.week !== week) plan = { week, ids: [] };
  plan.ids = fillPlan(plan.ids.filter(id => skills.has(id)), gaps, skills);
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

// Marca del estado al inicio de la fila, con las Dos voces: punteado = pendiente, rosa→violeta = aprendiendo, menta con
// marca = dominada. Decorativa: el selector de la fila ya dice el estado.
function semanaMark(status) {
  const kind = SKILL_STATE_CLASS[status] || "pending";
  const check = kind === "mastered"
    ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>`
    : "";
  return `<span class="semana-mark semana-mark--${kind}" aria-hidden="true">${check}</span>`;
}

// Fila del plan: marca del estado, nombre (abre el detalle de la habilidad) con su nivel de demanda, barra con el % real
// de ofertas, horas sugeridas (o "Esta semana" si ya quedó dominada) y el selector de estado
function renderSemanaRow(skill) {
  const done = skill.status === "MASTERED";
  const hours = planHours(skill);
  const name = escapeHtml(tSkill(skill.name));
  const pct = Math.max(0, Math.min(100, Number(skill.demandPercentage) || 0));
  const badge = !done && semana.demands.length ? urgencyBadge(skill.demandPercentage, semana.demands) : null;
  const meta = [t("semana.demand", { pct: skill.demandPercentage }), skill.category ? escapeHtml(tCategory(skill.category)) : ""]
    .filter(Boolean).join(" · ");
  const hoursCell = done
    ? `<p class="semana-hours semana-hours--done">${t("semana.doneThisWeek")}</p>`
    : `<p class="semana-hours"><span aria-hidden="true">${t("semana.hours", { n: hours })}</span><span class="sr-only">${tn("semana.hoursLabel", hours)}</span></p>`;
  return `
    <li class="semana-row${done ? " is-done" : ""}" data-plan-row="${skill.id}">
      ${semanaMark(skill.status)}
      <div class="semana-skill">
        <div class="semana-name-line">
          <button type="button" class="gap-name gap-context semana-name" data-context="${skill.id}" aria-label="${escapeHtml(t("skill.contextFor", { name: tSkill(skill.name) }))}">${name}</button>
          ${badge ? `<span class="gap-badge gap-badge--${badge.tone}">${badge.label}</span>` : ""}
        </div>
        <div class="semana-demand">
          <span class="gap-bar" aria-hidden="true"><span style="width:${pct}%"></span></span>
          <span class="semana-meta">${meta}</span>
        </div>
      </div>
      ${hoursCell}
      <div class="semana-status">${renderStatusPicker(skill, semana.busy === skill.id)}</div>
      ${semana.errorId === skill.id ? `<p class="semana-error" role="alert">${escapeHtml(t("state.error",
        { error: friendlyError(semana.error) }))}</p>` : ""}
    </li>`;
}

function renderSemanaBody() {
  const rows = semana.plan.ids.map(id => semana.skills.get(id)).filter(Boolean);
  if (!rows.length) {
    return `<div class="route-state">${routeDraw()}<p class="text-sm text-muted">${t("semana.empty", { goal: semana.goal })}</p></div>`;
  }
  // Mismo orden que las paradas de la ruta (las dominadas conservan su lugar); lo que no está en la ruta, al final
  const at = s => semana.route.get(s.id) ?? Infinity;
  const ordered = [...rows].sort((a, b) => at(a) - at(b));
  const left = rows.filter(s => s.status !== "MASTERED");
  const mastered = rows.length - left.length;
  const hours = left.reduce((sum, s) => sum + planHours(s), 0);
  const total = [mastered ? tn("semana.mastered", mastered) : "", left.length ? t("semana.total", { n: hours }) : ""]
    .filter(Boolean).join(" · ");
  return `
    <p class="semana-intro">${left.length ? t("semana.intro") : t("semana.complete", { goal: semana.goal })}</p>
    <ul class="semana-list">${ordered.map(renderSemanaRow).join("")}</ul>
    <footer class="semana-foot">
      <p class="semana-total">${total}</p>
      <p class="semana-hint">${t("semana.hint")}</p>
    </footer>`;
}

// Parte "Tu semana" de la tarjeta de brechas (renderBrechas en dashboard.js). gaps: brechas del objetivo; catalog:
// /api/skills (trae también las del plan que ya quedaron dominadas); goalTitle: título del objetivo sin traducir;
// demands: demandas de las habilidades del objetivo, para el nivel de cada fila (urgencyBadge); routeIds: ids de las
// paradas de la ruta en orden (la lista sigue ese orden)
function renderSemanaCard(gaps, catalog, goalId, goalTitle, demands = [], routeIds = gaps.map(s => s.id)) {
  prepareSemana(gaps, catalog, goalId, goalTitle);
  semana.demands = demands;
  semana.route = new Map(routeIds.map((id, i) => [id, i]));
  return `<div id="semana-card" class="ruta-semana">${renderSemanaInner()}</div>`;
}

// Ids del plan vigente (las demás brechas van plegadas debajo)
function semanaPlanIds() {
  return semana.plan ? [...semana.plan.ids] : [];
}

function renderSemanaInner() {
  return renderSemanaBody();
}

// Repinta el contenido del plan (no la tarjeta: así no se repite su entrada) y devuelve el foco
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
  const onName = active.matches("[data-context]");
  return () => {
    const target = document.querySelector(`#semana-card [data-plan-row="${id}"]`);
    if (!target) { document.getElementById("brechas-title")?.focus(); return; }
    if (inPicker) focusStatusPicker(target);
    else if (onName) target.querySelector("[data-context]")?.focus({ preventScroll: true });
    else document.getElementById("brechas-title")?.focus();
  };
}

// ---------- Acciones ----------

// El estado cambia al instante; si el backend falla vuelve al anterior con el error en la fila. Al guardar, Mi Ruta se
// recarga sin skeleton (skillmap:progress con source "semana", dashboard.js), el foco vuelve al selector y sale el aviso
// breve con "Deshacer" (toast.js; undo: el cambio viene de ahí y no se ofrece deshacerlo otra vez).
async function setSemanaStatus(id, status, { undo = false } = {}) {
  const skill = semana.skills.get(id);
  if (!skill || !semana.plan?.ids.includes(id) || semana.busy !== null || skill.status === status) return;
  const previous = skill.status;
  semana.skills.set(id, { ...skill, status });
  Object.assign(semana, { busy: id, errorId: null });
  refreshSemana();
  try {
    const saved = await saveSkillStatus(id, status);
    if (semana.busy !== id) return; // cambió el usuario o se recargó la vista mientras se guardaba
    semana.skills.set(id, { ...skill, ...saved });
    semana.busy = null;
    if (undo) {
      hideToast("semana");
      document.getElementById("ruta-live").textContent = t("habilidades.undone", { name: tSkill(saved.name), status: statusLabel(saved.status) });
    } else {
      showToast({
        owner: "semana",
        text: t("toast.status", { name: tSkill(saved.name), status: statusLabel(saved.status) }),
        onUndo: () => setSemanaStatus(id, previous, { undo: true }),
        fallbackFocus: () => document.querySelector(`#semana-card [data-plan-row="${id}"] .status-picker [aria-checked='true']`)
          || document.getElementById("brechas-title"),
      });
    }
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
  // Los únicos selectores de estado de Mi Ruta son los de esta tarjeta
  bindStatusPicker(container, (id, status) => {
    if (SKILL_STATES.includes(status)) setSemanaStatus(id, status);
  });
}

document.addEventListener("skillmap:user", () => {
  Object.assign(semana, { key: null, plan: null, skills: new Map(), route: new Map(), busy: null, error: null, errorId: null });
  planMemory.clear();
});

document.addEventListener("DOMContentLoaded", initSemana);
