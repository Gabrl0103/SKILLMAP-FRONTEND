// Tarjeta "Tu ritmo" de Mi Ruta: meta semanal editable, racha (semanas seguidas cumpliéndola) y lo dominado este mes.
// - Avance: una habilidad que pasó a Aprendiendo o Dominada. Su semana es la de statusUpdatedAt (/api/skills: cuándo
//   pasó al estado actual; repetir el estado no la mueve). Cualquier habilidad cuenta, sea o no del objetivo.
// - El backend solo guarda la fecha del último cambio de cada habilidad, así que un avance posterior "mueve" el
//   anterior a la semana nueva. Para que eso no rompa rachas ya ganadas, cada semana cerrada se queda con lo máximo que
//   se vio de ella y con la meta que tenía (registro en localStorage por usuario: "skillmap.ritmo.{userId}" =
//   { goal, weeks: { "2026-11-02": { count, goal } }, best }). La semana en curso siempre es lo de ahora.
// - Racha actual: semanas seguidas con la meta cumplida que terminan en esta (si ya se cumplió) o en la anterior (la de
//   ahora todavía puede cumplirse). Mejor racha: la más larga del registro.
// - Este mes: habilidades del objetivo que pasaron a Dominada desde el día 1 (hora local), con una barra del objetivo
//   entero: dominadas antes, dominadas este mes y lo que falta.
// La pinta loadDashboard (dashboard.js). Usa weekKey, weekKeyOf y previousWeekKey (plan-semanal.js), escapeHtml (mapa.js),
// sessionUser (session.js) y t, tn, tSkill y tGoalTitle (i18n.js). "Este mes" es una tarjeta aparte (renderRitmoMonthCard).

const RITMO_KEY = "skillmap.ritmo";
const RITMO_GOAL = { default: 2, min: 1, max: 10 };
const RITMO_WEEKS_KEPT = 156; // unos 3 años de semanas en el registro
const ADVANCE_STATES = ["IN_PROGRESS", "MASTERED"];

// Lo que pinta la tarjeta: datos guardados, habilidades (null si /api/skills falló), las del objetivo y su brecha
// principal (siguiente giro)
const ritmo = { data: null, skills: null, goalSkills: [], goal: "", topGap: null };
const ritmoMemory = new Map(); // respaldo sin localStorage

const ritmoStorageKey = () => `${RITMO_KEY}.${sessionUser?.id ?? "anon"}`;
const clampGoal = n => Math.max(RITMO_GOAL.min, Math.min(RITMO_GOAL.max, Math.round(Number(n)) || RITMO_GOAL.default));

function readRitmo() {
  const key = ritmoStorageKey();
  try {
    const data = JSON.parse(localStorage.getItem(key));
    if (data && typeof data === "object") {
      const weeks = {};
      for (const [k, w] of Object.entries(data.weeks || {})) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(k) && Number.isFinite(w?.count)) weeks[k] = { count: w.count, goal: clampGoal(w.goal) };
      }
      return { goal: clampGoal(data.goal), weeks, best: Number.isFinite(data.best) ? data.best : 0 };
    }
  } catch { /* sin storage o dato roto: se empieza de cero */ }
  return ritmoMemory.get(key) ?? { goal: RITMO_GOAL.default, weeks: {}, best: 0 };
}

function saveRitmo(data) {
  const key = ritmoStorageKey();
  const keep = Object.keys(data.weeks).sort().slice(-RITMO_WEEKS_KEPT);
  data.weeks = Object.fromEntries(keep.map(k => [k, data.weeks[k]]));
  ritmoMemory.set(key, data);
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* sin storage: dura hasta recargar */ }
}

// ---------- Cálculo ----------

function advancesByWeek(skills) {
  const counts = new Map();
  for (const s of skills) {
    const week = ADVANCE_STATES.includes(s.status) ? weekKeyOf(s.statusUpdatedAt) : null;
    if (week) counts.set(week, (counts.get(week) || 0) + 1);
  }
  return counts;
}

// Une lo que dicen las fechas con el registro: las semanas cerradas, con el máximo visto y su meta de entonces; la
// actual, con lo de ahora y la meta de ahora
function updateRitmoWeeks(data, skills, current = weekKey()) {
  const counts = advancesByWeek(skills);
  for (const [week, count] of counts) {
    if (week >= current) continue;
    const before = data.weeks[week];
    data.weeks[week] = { count: Math.max(before?.count ?? 0, count), goal: before?.goal ?? data.goal };
  }
  data.weeks[current] = { count: counts.get(current) ?? 0, goal: data.goal };
}

const weekMet = w => Boolean(w) && w.count >= w.goal;

function currentStreak(data, current = weekKey()) {
  let week = weekMet(data.weeks[current]) ? current : previousWeekKey(current);
  let n = 0;
  while (weekMet(data.weeks[week])) { n++; week = previousWeekKey(week); }
  return n;
}

function bestStreak(data) {
  let best = 0, run = 0, previous = null;
  for (const week of Object.keys(data.weeks).sort()) {
    const met = weekMet(data.weeks[week]);
    run = met ? (previous && previousWeekKey(week) === previous ? run + 1 : 1) : 0;
    previous = met ? week : null;
    best = Math.max(best, run);
  }
  return best;
}

// Habilidades del objetivo dominadas este mes y antes
function monthStats(goalSkills, now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const mastered = goalSkills.filter(s => s.status === "MASTERED");
  const thisMonth = mastered.filter(s => s.statusUpdatedAt && new Date(s.statusUpdatedAt) >= start).length;
  return { thisMonth, before: mastered.length - thisMonth, total: goalSkills.length };
}

// Habilidades que avanzaron esta semana, por estado (las de la barra de la semana)
function weekAdvances(skills, current = weekKey()) {
  const thisWeek = skills.filter(s => ADVANCE_STATES.includes(s.status) && weekKeyOf(s.statusUpdatedAt) === current);
  return { mastered: thisWeek.filter(s => s.status === "MASTERED").length, learning: thisWeek.filter(s => s.status === "IN_PROGRESS").length };
}

// ---------- Marcado ----------

function renderRitmoGoal(goal) {
  const at = (limit, side) => (goal === limit ? ` aria-disabled="true"` : "") + ` data-goal-step="${side}"`;
  return `
    <div class="ritmo-goal">
      <p id="ritmo-goal-label" class="ritmo-label">${t("ritmo.goal.label")}</p>
      <div class="ritmo-stepper" role="group" aria-labelledby="ritmo-goal-label">
        <button type="button" class="ritmo-step"${at(RITMO_GOAL.min, -1)} aria-label="${t("ritmo.goal.less")}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>
        </button>
        <span class="ritmo-goal-value"><strong>${goal}</strong> ${tn("ritmo.goal.unit", goal)}</span>
        <button type="button" class="ritmo-step"${at(RITMO_GOAL.max, 1)} aria-label="${t("ritmo.goal.more")}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>`;
}

// Esta semana: "1 de 2", una barra con un tramo por avance de la meta (menta = dominada, rosa→violeta = aprendiendo,
// punteado = todavía no) y cuánto falta
function renderRitmoWeek(goal, count, advances) {
  const slots = Math.min(12, Math.max(goal, count));
  const kinds = [...Array(advances.mastered).fill("mastered"), ...Array(advances.learning).fill("progress")];
  const segments = Array.from({ length: slots }, (_, i) => `<span class="ritmo-seg ritmo-seg--${kinds[i] || "pending"}"></span>`).join("");
  const left = goal - count;
  const note = left > 0 ? tn("ritmo.week.left", left) : t("ritmo.week.met");
  return `
    <div class="ritmo-week">
      <p class="ritmo-week-text">${tn("ritmo.week", count)}</p>
      <div class="ritmo-segments" aria-hidden="true">${segments}</div>
      <p class="ritmo-week-note${left > 0 ? "" : " is-met"}">${note}</p>
      <p class="ritmo-hint">${t("ritmo.goal.hint")}</p>
    </div>`;
}

function renderRitmoStreaks(data, metNow) {
  const current = currentStreak(data);
  const best = Math.max(data.best, bestStreak(data), current);
  data.best = best;
  const stat = (label, n) => `
    <div class="ritmo-streak">
      <dt>${label}</dt>
      <dd><strong>${n}</strong> ${tn("ritmo.weeksUnit", n)}</dd>
    </div>`;
  let note = "";
  if (!best) note = t("ritmo.streak.none");
  else if (!metNow) note = t("ritmo.streak.keep", { weeks: tn("ritmo.weeks", current + 1) });
  return `
    <dl class="ritmo-streaks">${stat(t("ritmo.streak"), current)}${stat(t("ritmo.best"), best)}</dl>
    ${note ? `<p class="ritmo-streak-note">${note}</p>` : ""}`;
}

function renderRitmoMonth() {
  const { goalSkills, goal, topGap } = ritmo;
  if (!goalSkills.length) return "";
  const { thisMonth, before, total } = monthStats(goalSkills);
  const pct = n => (n / total) * 100;
  const text = thisMonth
    ? tn("ritmo.month.done", thisMonth)
    : topGap ? t("ritmo.month.none", { skill: escapeHtml(tSkill(topGap.name)) }) : t("ritmo.month.noneArrived");
  const segment = (kind, n) => (n ? `<span class="ritmo-month-seg ritmo-month-seg--${kind}" style="flex-basis:${pct(n)}%"></span>` : "");
  return `
    <article id="ritmo-month-card" class="ruta-card ritmo-month" aria-labelledby="ritmo-month-title">
      <h2 id="ritmo-month-title" class="ruta-card-title">${t("ritmo.month.title")}</h2>
      <p class="ritmo-month-text">${text}</p>
      <div class="ritmo-month-bar" aria-hidden="true">
        ${segment("before", before)}${segment("month", thisMonth)}${segment("left", total - before - thisMonth)}
      </div>
      ${before || thisMonth ? `<ul class="ritmo-legend" aria-hidden="true">
        ${before ? `<li class="ritmo-legend-before">${t("ritmo.month.before")}</li>` : ""}${thisMonth ? `<li class="ritmo-legend-month">${t("ritmo.month.title")}</li>` : ""}
      </ul>` : ""}
      <p class="ritmo-hint">${t("ritmo.month.route", { n: before + thisMonth, total, goal })}</p>
    </article>`;
}

// "Este mes" va en su propia tarjeta, junto a la Tendencia (los dos miran el avance en el tiempo); se pinta después de
// renderRitmoCard, que deja listos los datos. Vacía si el objetivo no tiene habilidades o /api/skills falló.
function renderRitmoMonthCard() {
  return ritmo.skills ? renderRitmoMonth() : "";
}

function renderRitmoInner() {
  const { data, skills } = ritmo;
  const title = `<h2 id="ritmo-title" class="ruta-card-title">${t("ritmo.title")}</h2>`;
  if (!skills) return `${title}<p class="ritmo-error text-sm text-muted">${t("ritmo.error")}</p>`;
  const count = data.weeks[weekKey()].count;
  const body = `
    ${title}
    ${renderRitmoGoal(data.goal)}
    ${renderRitmoWeek(data.goal, count, weekAdvances(skills))}
    ${renderRitmoStreaks(data, count >= data.goal)}`;
  saveRitmo(data); // con la mejor racha al día
  return body;
}

// Tarjeta completa (loadDashboard). catalog: /api/skills con fechas ([] si falló); goalSkills: las del objetivo;
// readiness: /api/goals/{id}/readiness (título y primera brecha)
function renderRitmoCard(catalog, goalSkills, readiness) {
  const data = readRitmo();
  if (catalog.length) updateRitmoWeeks(data, catalog);
  Object.assign(ritmo, {
    data, skills: catalog.length ? catalog : null, goalSkills,
    goal: escapeHtml(tGoalTitle(readiness.goalTitle)), topGap: readiness.gaps[0] || null,
  });
  return `<article id="ritmo-card" class="ruta-card ruta-ritmo" aria-labelledby="ritmo-title">${renderRitmoInner()}</article>`;
}

function refreshRitmo(focus = ritmoFocus()) {
  const card = document.getElementById("ritmo-card");
  if (!card || !ritmo.data) return;
  card.innerHTML = renderRitmoInner();
  focus?.();
}

// Dónde está el foco dentro de la tarjeta (un botón de la meta), como una función que lo devuelve tras repintar
function ritmoFocus() {
  const step = document.activeElement?.closest?.("#ritmo-card [data-goal-step]");
  if (!step) return null;
  const side = step.dataset.goalStep;
  return () => document.querySelector(`#ritmo-card [data-goal-step="${side}"]`)?.focus({ preventScroll: true });
}

// La meta de la semana en curso cambia con ella; las semanas cerradas conservan la suya
function setRitmoGoal(goal) {
  const { data } = ritmo;
  if (!data || !ritmo.skills) return;
  const next = clampGoal(goal);
  if (next === data.goal) return;
  data.goal = next;
  updateRitmoWeeks(data, ritmo.skills);
  refreshRitmo();
  document.getElementById("ruta-live").textContent = tn("ritmo.goal.changed", next);
}

function initRitmo() {
  document.getElementById("app-content").addEventListener("click", e => {
    const step = e.target.closest("#ritmo-card [data-goal-step]");
    if (!step || step.getAttribute("aria-disabled") === "true") return;
    setRitmoGoal(ritmo.data.goal + Number(step.dataset.goalStep));
  });
}

document.addEventListener("skillmap:user", () => {
  Object.assign(ritmo, { data: null, skills: null, goalSkills: [], goal: "", topGap: null });
  ritmoMemory.clear();
});

document.addEventListener("DOMContentLoaded", initRitmo);
