// Tarjeta "Tu ritmo" de Mi Ruta: meta semanal editable, racha (semanas seguidas cumpliéndola) y lo dominado este mes.
// - Avance: una habilidad que pasó a Aprendiendo o Dominada. Su semana es la de statusUpdatedAt (/api/skills: cuándo
//   pasó al estado actual; repetir el estado no la mueve). Solo cuentan las habilidades del objetivo (tu ruta), como en
//   "Este mes"; las semanas cerradas que se guardaron antes conservan lo que contaron.
// - El backend solo guarda la fecha del último cambio de cada habilidad, así que un avance posterior "mueve" el
//   anterior a la semana nueva. Para que eso no rompa rachas ya ganadas, cada semana cerrada se queda con lo máximo que
//   se vio de ella y con la meta que tenía (registro en localStorage por usuario: "skillmap.ritmo.{userId}" =
//   { goal, weeks: { "2026-11-02": { count, goal } }, best }). La semana en curso siempre es lo de ahora.
// - Racha actual: semanas seguidas con la meta cumplida que terminan en esta (si ya se cumplió) o en la anterior (la de
//   ahora todavía puede cumplirse). Mejor racha: la más larga del registro.
// - Este mes: habilidades del objetivo que pasaron a Dominada desde el día 1 (hora local), con una barra del objetivo
//   entero: dominadas antes, dominadas este mes y lo que falta.
// La pinta loadDashboard (dashboard.js). Usa weekKey, weekKeyOf y previousWeekKey (plan-semanal.js), escapeHtml (mapa.js),
// sessionUser (session.js), routeDivider (route-motif.js) y t, tn, tSkill y tGoalTitle (i18n.js).

const RITMO_KEY = "skillmap.ritmo";
const RITMO_GOAL = { default: 2, min: 1, max: 10 };
const RITMO_WEEKS_KEPT = 156; // unos 3 años de semanas en el registro
const ADVANCE_STATES = ["IN_PROGRESS", "MASTERED"];

// Lo que pinta la tarjeta: datos guardados, habilidades que cuentan (las del objetivo; null si /api/skills falló), las
// del objetivo para "Este mes" y su brecha principal (siguiente giro)
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
// Orden de la tarjeta (rediseño visual): esta semana (número grande y tramos), meta semanal con − / +, rachas y este mes,
// separados por divisores finos

function renderRitmoGoal(goal) {
  const at = (limit, side) => (goal === limit ? ` aria-disabled="true"` : "") + ` data-goal-step="${side}"`;
  return `
    <div class="ritmo-section ritmo-goal">
      <div class="ritmo-goal-copy">
        <p id="ritmo-goal-label" class="ritmo-label">${t("ritmo.goal.label")}</p>
        <p class="ritmo-goal-unit">${tn("ritmo.goal.unit", goal)}</p>
      </div>
      <div class="ritmo-stepper" role="group" aria-labelledby="ritmo-goal-label">
        <button type="button" class="ritmo-step"${at(RITMO_GOAL.min, -1)} aria-label="${t("ritmo.goal.less")}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"/></svg>
        </button>
        <span class="ritmo-goal-value"><strong data-motion="count:ritmo-goal">${goal}</strong><span class="sr-only"> ${tn("ritmo.goal.unit", goal)}</span></span>
        <button type="button" class="ritmo-step"${at(RITMO_GOAL.max, 1)} aria-label="${t("ritmo.goal.more")}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
        </button>
      </div>
    </div>`;
}

// Esta semana: "1 de 2" en grande, una barra con un tramo por avance de la meta (menta = dominada, rosa→violeta =
// aprendiendo, punteado = todavía no) y cuánto falta. Pasada la meta, el número se queda en la meta ("2 de 2", nunca
// "5 de 2") y la nota dice cuántas van de más. Si la meta se cumplió solo empezando habilidades (ninguna dominada esta
// semana), la nota lo dice así: la preparación sube al dominar, no al empezar, y un 0 % no contradice la meta cumplida.
function ritmoWeekNote(goal, count, advances) {
  if (count < goal) return tn("ritmo.week.left", goal - count);
  if (!advances.mastered) return tn("ritmo.week.metLearning", count);
  return count > goal ? tn("ritmo.week.over", count - goal) : t("ritmo.week.met");
}

function renderRitmoWeek(goal, count, advances) {
  const shown = Math.min(count, goal);
  const kinds = [...Array(advances.mastered).fill("mastered"), ...Array(advances.learning).fill("progress")];
  const segments = Array.from({ length: goal }, (_, i) => {
    const kind = kinds[i] || "pending";
    return `<span class="ritmo-seg ritmo-seg--${kind}" data-motion="fill:ritmo-seg-${i}" data-value="${kind}"></span>`;
  }).join("");
  const left = goal - count;
  const note = ritmoWeekNote(goal, count, advances);
  return `
    <div class="ritmo-week">
      <p class="ritmo-week-head">
        <span class="ritmo-label">${t("ritmo.week.label")}</span>
        <span class="ritmo-big"><strong data-motion="count:ritmo-week">${shown}</strong> ${t("ritmo.week.of", { goal })}</span>
        <span class="sr-only">${t("ritmo.week", { n: shown, goal })}</span>
      </p>
      <div class="ritmo-segments" aria-hidden="true">${segments}</div>
      <p class="ritmo-week-note${left > 0 ? "" : " is-met"}">${note}</p>
      <p class="ritmo-hint">${t("ritmo.goal.hint", { goal: ritmo.goal })}</p>
    </div>`;
}

function renderRitmoStreaks(data, metNow) {
  const current = currentStreak(data);
  const best = Math.max(data.best, bestStreak(data), current);
  data.best = best;
  const stat = (label, n, key) => `
    <div class="ritmo-streak">
      <dt class="ritmo-label">${label}</dt>
      <dd class="ritmo-big"><strong data-motion="count:${key}">${n}</strong> ${tn("ritmo.weeksUnit", n)}</dd>
    </div>`;
  let note = "";
  if (!best) note = t("ritmo.streak.none");
  else if (!metNow) note = t("ritmo.streak.keep", { weeks: tn("ritmo.weeks", current + 1) });
  return `
    <div class="ritmo-section">
      <dl class="ritmo-streaks">${stat(t("ritmo.streak"), current, "ritmo-streak")}${stat(t("ritmo.best"), best, "ritmo-best")}</dl>
      ${note ? `<p class="ritmo-streak-note">${note}</p>` : ""}
    </div>`;
}

function renderRitmoMonth() {
  const { goalSkills, goal, topGap } = ritmo;
  if (!goalSkills.length) return "";
  const { thisMonth, before, total } = monthStats(goalSkills);
  const pct = n => (n / total) * 100;
  // Sin dominadas este mes, la frase dice cuál es el siguiente giro; con alguna, el número grande ya lo dice
  const text = thisMonth ? "" : topGap ? t("ritmo.month.none", { skill: escapeHtml(tSkill(topGap.name)) }) : t("ritmo.month.noneArrived");
  const segment = (kind, n) => (n ? `<span class="ritmo-month-seg ritmo-month-seg--${kind}" style="flex-basis:${pct(n)}%"${kind === "left" ? "" : ` data-motion="bar:ritmo-month-${kind}" data-value="${pct(n)}"`}></span>` : "");
  return `
    <section class="ritmo-section ritmo-month" aria-labelledby="ritmo-month-title">
      <h3 id="ritmo-month-title" class="ritmo-label">${t("ritmo.month.title")}</h3>
      <p class="ritmo-big"><strong data-motion="count:ritmo-month">${thisMonth}</strong> ${tn("ritmo.month.unit", thisMonth)}</p>
      ${text ? `<p class="ritmo-month-text">${text}</p>` : ""}
      <div class="ritmo-month-bar" aria-hidden="true">
        ${segment("before", before)}${segment("month", thisMonth)}${segment("left", total - before - thisMonth)}
      </div>
      ${before || thisMonth ? `<ul class="ritmo-legend" aria-hidden="true">
        ${before ? `<li class="ritmo-legend-before">${t("ritmo.month.before")}</li>` : ""}${thisMonth ? `<li class="ritmo-legend-month">${t("ritmo.month.title")}</li>` : ""}
      </ul>` : ""}
      <p class="ritmo-hint">${t("ritmo.month.route", { n: before + thisMonth, total, goal })}</p>
    </section>`;
}

function renderRitmoInner() {
  const { data, skills } = ritmo;
  const title = `<h2 id="ritmo-title" class="ruta-card-title">${t("ritmo.title")}</h2>`;
  if (!skills) return `${title}<p class="ritmo-error text-sm text-muted">${t("ritmo.error")}</p>`;
  const count = data.weeks[weekKey()].count;
  const body = `
    ${title}
    ${renderRitmoWeek(data.goal, count, weekAdvances(skills))}
    ${renderRitmoGoal(data.goal)}
    ${renderRitmoStreaks(data, count >= data.goal)}
    ${renderRitmoMonth()}`;
  saveRitmo(data); // con la mejor racha al día
  return body;
}

// Tarjeta completa (loadDashboard). catalog: /api/skills con fechas ([] si falló); goalSkills: las del objetivo;
// readiness: /api/goals/{id}/readiness (título y primera brecha)
function renderRitmoCard(catalog, goalSkills, readiness) {
  const data = readRitmo();
  if (catalog.length) updateRitmoWeeks(data, goalSkills); // solo cuenta tu ruta
  Object.assign(ritmo, {
    data, skills: catalog.length ? goalSkills : null, goalSkills,
    goal: escapeHtml(tGoalTitle(readiness.goalTitle)), topGap: readiness.gaps[0] || null,
  });
  return `<article id="ritmo-card" class="ruta-card ruta-ritmo is-flat" aria-labelledby="ritmo-title">${renderRitmoInner()}</article>`;
}

function refreshRitmo(focus = ritmoFocus()) {
  const card = document.getElementById("ritmo-card");
  if (!card || !ritmo.data) return;
  morphInto(card, renderRitmoInner()); // motion.js: en su lugar, sin repintar la tarjeta
  settleMotion(card); // motion.js: números y barras desde el valor anterior
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
