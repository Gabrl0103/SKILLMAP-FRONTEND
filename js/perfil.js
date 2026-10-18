// Vista "Perfil". Usa fetchSkills, fetchGoals, fetchReadiness, getActiveGoalId, readSavedGoalId, renderApiError,
// sampleTag y sampleDemandNote (dashboard.js), ICONS, pickIcon y escapeHtml (mapa.js), sessionUser, apiJson, apiFetch,
// apiError, friendlyError, renderUserMenu y endSession (session.js) y t, tSkill y tGoalTitle (i18n.js).
// Datos reales: nombre, titular y correo (sesión), habilidades dominadas y en desarrollo (/api/skills) y objetivo
// activo con su preparación (/api/goals/{id}/readiness). Se editan nombre y titular (PATCH /api/auth/me) y, en
// Seguridad, la contraseña (PUT /api/auth/me/password) y la cuenta (DELETE /api/auth/me). Las contraseñas solo viven
// en sus campos hasta enviar: se limpian al enviar, salga bien o mal, y nunca se guardan ni se registran.

// ---------- Datos de ejemplo (la API todavía no los provee) ----------

// DATOS DE EJEMPLO: la API no guarda enlaces, proyectos, cursos, logros ni preferencias. Reemplazar cuando existan.
// Los textos son claves de i18n.js (se traducen al pintar); enlaces y nombres de proyecto no se traducen.
function sampleProfileData() {
  return {
    links: [
      { icon: "pin", key: "perfil.sample.location" },
      { icon: "link", label: "portfolio.alex.dev" },
      { icon: "repo", label: "alexrivera-dev" },
    ],
    projects: [
      { title: "E-commerce Flow UI Kit", thumb: "shop", tags: ["React", "UI/UX"], description: "perfil.sample.project1" },
      { title: "SaaS Analytics Dashboard", thumb: "chart", tags: ["Next.js", "Plotly"], description: "perfil.sample.project2" },
    ],
    courses: { completed: 8, total: 11 },
    achievements: [
      { label: "perfil.sample.achievement1", icon: "award", tone: "mint" },
      { label: "perfil.sample.achievement2", icon: "bolt", tone: "pink" },
      { label: "perfil.sample.achievement3", icon: "code", tone: "blue" },
    ],
    preferences: [
      { label: "perfil.sample.pref1", on: true },
      { label: "perfil.sample.pref2", on: true },
    ],
  };
}

// ---------- Íconos propios de la vista (viewBox 24x24, trazo con currentColor) ----------

const PERFIL_ICONS = {
  pin: `<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>`,
  link: `<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,
  repo: `<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 3.5v17M11.5 8h5M11.5 12h5"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>`,
  award: `<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.3-1.5 7.2 5-2.7 5 2.7-1.5-7.2"/>`,
  bolt: `<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" fill="currentColor" stroke="none"/>`,
  code: `<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>`,
};

function perfilIcon(name, size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PERFIL_ICONS[name]}</svg>`;
}

// Miniaturas de proyecto dibujadas en SVG (no hay capturas reales de los proyectos).
const PROJECT_THUMBS = {
  shop: `<rect width="64" height="64" fill="#2B2932"/>
    <rect x="9" y="12" width="22" height="40" rx="4" fill="#3C3945"/><rect x="12" y="16" width="16" height="9" rx="2" fill="#5B8DEF"/>
    <rect x="12" y="28" width="16" height="3" rx="1.5" fill="#8C8898"/><rect x="12" y="34" width="11" height="3" rx="1.5" fill="#8C8898"/>
    <rect x="35" y="8" width="21" height="44" rx="4" fill="#EDEBF1"/><rect x="38" y="13" width="15" height="14" rx="2" fill="#D95F8E"/>
    <rect x="38" y="31" width="15" height="3" rx="1.5" fill="#B7B3BF"/><rect x="38" y="37" width="10" height="3" rx="1.5" fill="#B7B3BF"/>`,
  chart: `<rect width="64" height="64" fill="#9C9ED6"/>
    <rect x="7" y="16" width="50" height="32" rx="3" fill="#1D2140"/>
    <path d="M11 40l8-6 7 3 8-9 7 4 10-9" fill="none" stroke="#5FD9E8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M11 44h42" stroke="#39406B" stroke-width="1.5"/>`,
};

// ---------- Bloques de la vista ----------

const PERFIL_MAX_NAME = 60;      // mismos límites que el backend (UserFactory)
const PERFIL_MAX_HEADLINE = 80;
const PERFIL_MIN_PASSWORD = 8;

// Iniciales del nombre: primera letra de la primera y de la última palabra (una sola si el nombre es de una palabra)
function initialsOf(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = word => Array.from(word)[0] || "";
  return (first(words[0] || "") + (words.length > 1 ? first(words[words.length - 1]) : "")).toUpperCase();
}

// Nombre y titular editables (con perfilState.editing reemplaza al titular, el correo y los botones)
function renderProfileForm(user) {
  return `
    <form class="perfil-form" data-form="profile" aria-label="${t("perfil.form.title")}" novalidate>
      <div>
        <label for="perfil-name" class="perfil-label">${t("perfil.form.name")}</label>
        <input id="perfil-name" type="text" class="perfil-input" autocomplete="name" maxlength="${PERFIL_MAX_NAME}" required
          aria-describedby="perfil-profile-error" value="${escapeHtml(user.name || "")}">
      </div>
      <div>
        <label for="perfil-headline" class="perfil-label">${t("perfil.form.headline")} <span class="perfil-optional">${t("perfil.form.optional")}</span></label>
        <input id="perfil-headline" type="text" class="perfil-input" maxlength="${PERFIL_MAX_HEADLINE}"
          placeholder="${t("perfil.form.headlinePlaceholder")}" aria-describedby="perfil-headline-hint perfil-profile-error"
          value="${escapeHtml(user.headline || "")}">
        <p id="perfil-headline-hint" class="perfil-hint">${t("perfil.form.headlineHint", { max: PERFIL_MAX_HEADLINE })}</p>
      </div>
      <p id="perfil-profile-error" class="perfil-error" aria-live="assertive" aria-atomic="true"></p>
      <div class="perfil-form-actions">
        <button type="submit" class="btn-pill" data-idle="perfil.form.save" data-busy="perfil.form.saving"><span data-label>${t("perfil.form.save")}</span></button>
        <button type="button" class="btn-pill perfil-btn-outline" data-action="cancel-edit">${t("perfil.form.cancel")}</button>
      </div>
    </form>`;
}

// Iniciales, nombre, titular y correo reales (sesión); los enlaces siguen siendo de ejemplo y llevan la etiqueta
function renderPerfilHeader(p) {
  const user = sessionUser || {};
  const name = user.name || user.email || "";
  const headline = user.headline
    ? `<p class="perfil-headline">${escapeHtml(user.headline)}</p>`
    : `<p class="perfil-headline perfil-headline--empty">${t("perfil.noHeadline")}</p>`;
  const links = p.links.map(l => `<li class="perfil-link">${perfilIcon(l.icon, 13)}${escapeHtml(l.key ? t(l.key) : l.label)}</li>`).join("");
  const details = perfilState.editing ? renderProfileForm(user) : `
        ${headline}
        <ul class="perfil-links">
          <li class="perfil-link">${perfilIcon("mail", 13)}<span class="sr-only">${t("perfil.emailLabel")}</span>${escapeHtml(user.email || "")}</li>
        </ul>
        <div class="perfil-sample">${sampleTag()}<ul class="perfil-links">${links}</ul></div>`;
  const actions = perfilState.editing ? "" : `
      <div class="perfil-header-actions">
        <button type="button" class="btn-pill" data-action="edit-profile">${t("perfil.edit")}</button>
        <button type="button" class="btn-pill perfil-btn-outline" aria-disabled="true" title="${t("common.soon")}">${t("perfil.exportCv")}</button>
      </div>`;
  return `
    <article id="perfil-header" class="perfil-card perfil-header">
      <div class="perfil-photo">
        <span class="perfil-photo-initials" role="img" aria-label="${t("perfil.photo", { name: escapeHtml(name) })}">${escapeHtml(initialsOf(name))}</span>
      </div>
      <div class="perfil-identity">
        <h1 class="perfil-name">${escapeHtml(name)}</h1>
        ${details}
      </div>
      ${actions}
    </article>`;
}

function averageDemand(skills) {
  return Math.round(skills.reduce((sum, s) => sum + s.demandPercentage, 0) / skills.length);
}

function renderSkillGroup(title, skills, tone, emptyText) {
  const chips = skills.map(s => `
    <li class="perfil-skill perfil-skill--${tone}">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        aria-hidden="true">${ICONS[pickIcon(s.name, s.category)]}</svg>
      <span>${escapeHtml(tSkill(s.name))}</span>
    </li>`).join("");
  // La API no mide el nivel de dominio: a la derecha va la demanda media real del grupo.
  const metric = skills.length
    ? `<span class="perfil-group-metric perfil-group-metric--${tone}" title="${t("perfil.groupMetricTitle")}">${t("perfil.groupMetric", { n: averageDemand(skills) })}</span>`
    : "";
  return `
    <section class="perfil-group">
      <header class="perfil-group-head">
        <h3 class="perfil-group-title">${title} (${skills.length})</h3>
        ${metric}
      </header>
      ${skills.length ? `<ul class="perfil-skills">${chips}</ul>` : `<p class="perfil-group-empty">${emptyText}</p>`}
    </section>`;
}

function renderSkillsCard(skillsState) {
  let body;
  if (skillsState?.error) body = renderApiError(skillsState.error);
  else if (!skillsState) body = `<p class="text-sm text-muted">${t("perfil.loadingSkills")}</p>`;
  else {
    const mastered = skillsState.skills.filter(s => s.status === "MASTERED");
    const learning = skillsState.skills.filter(s => s.status === "IN_PROGRESS");
    body = renderSkillGroup(t("perfil.mastered"), mastered, "mastered", t("perfil.masteredEmpty"))
      + renderSkillGroup(t("perfil.learning"), learning, "learning", t("perfil.learningEmpty"))
      // "Demanda media" se marca como ejemplo mientras alguna habilidad tenga demanda sembrada (demandIsSample).
      + (mastered.length || learning.length ? sampleDemandNote("perfil-sample-note", [...mastered, ...learning]) : "");
  }
  return `
    <article id="perfil-skills" class="perfil-card">
      <h2 class="perfil-card-title">${t("perfil.skills")}</h2>
      ${body}
    </article>`;
}

function renderProjectsCard(p) {
  const rows = p.projects.map(pr => `
    <li class="perfil-project">
      <svg class="perfil-project-thumb" viewBox="0 0 64 64" aria-hidden="true">${PROJECT_THUMBS[pr.thumb]}</svg>
      <div class="min-w-0">
        <h3 class="perfil-project-title">${escapeHtml(pr.title)}</h3>
        <p class="perfil-project-desc">${escapeHtml(t(pr.description))}</p>
        <ul class="perfil-project-tags">${pr.tags.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
      </div>
    </li>`).join("");
  return `
    <article class="perfil-card">
      <header class="perfil-card-header">
        <h2 class="perfil-card-title">${t("perfil.projects")}</h2>
        ${sampleTag()}
        <button type="button" class="perfil-add" aria-disabled="true" title="${t("common.soon")}">${t("perfil.addProject")}</button>
      </header>
      <ul class="perfil-projects">${rows}</ul>
    </article>`;
}

function renderStatBar(label, value, pct, tone) {
  return `
    <div class="perfil-stat">
      <div class="perfil-stat-head"><span>${label}</span><strong>${value}</strong></div>
      <div class="perfil-stat-bar perfil-stat-bar--${tone}" role="img" aria-label="${label}: ${value}"><span style="width:${pct}%"></span></div>
    </div>`;
}

// Fila sin barra: cargando (…), sin dato (—) o sin objetivo
function renderStatPending(label, value) {
  return `<div class="perfil-stat"><div class="perfil-stat-head"><span>${label}</span><strong>${value}</strong></div></div>`;
}

// Real: dominadas y en desarrollo sobre el total de /api/skills, y preparación del objetivo activo
function renderStatsCard(p, skillsState, goalState) {
  const counts = [["MASTERED", "perfil.masteredStat", "mint"], ["IN_PROGRESS", "perfil.learningStat", "pink"]].map(([status, key, tone]) => {
    if (!skillsState) return renderStatPending(t(key), "…");
    if (skillsState.error) return renderStatPending(t(key), "—");
    const total = skillsState.skills.length;
    const n = skillsState.skills.filter(s => s.status === status).length;
    return renderStatBar(t(key), `${n} / ${total}`, total ? (n / total) * 100 : 0, tone);
  }).join("");
  let goal;
  if (!goalState) goal = renderStatPending(t("perfil.goalStatEmpty"), "…");
  else if (goalState.error) goal = renderStatPending(t("perfil.goalStatEmpty"), "—");
  else if (!goalState.readiness) goal = renderStatPending(t("perfil.goalStatEmpty"), t("perfil.noGoal"));
  else {
    const r = goalState.readiness;
    goal = renderStatBar(t("perfil.goalStat", { goal: escapeHtml(tGoalTitle(r.goalTitle)) }), `${r.readinessPercentage}%`,
      r.readinessPercentage, "pink");
  }
  const courses = renderStatBar(t("perfil.courses"), p.courses.completed, (p.courses.completed / p.courses.total) * 100, "pink");
  const achievements = p.achievements.map(a => `
    <li class="perfil-achievement perfil-achievement--${a.tone}" title="${escapeHtml(t(a.label))}">
      ${perfilIcon(a.icon, 15)}<span class="sr-only">${escapeHtml(t(a.label))}</span>
    </li>`).join("");
  return `
    <article id="perfil-stats" class="perfil-stats">
      <h2 class="perfil-stats-title">${t("perfil.stats")}</h2>
      ${counts}
      ${goal}
      <hr class="perfil-stats-divider">
      ${courses}
      <h3 class="perfil-stats-eyebrow">${t("perfil.achievements")}</h3>
      <ul class="perfil-achievements">${achievements}</ul>
      <p class="perfil-stats-note">${sampleTag()} ${t("perfil.coursesNote")}</p>
    </article>`;
}

function renderPreferencesCard(p) {
  const rows = p.preferences.map((pref, i) => `
    <li class="perfil-pref">
      <span id="perfil-pref-${i}">${escapeHtml(t(pref.label))}</span>
      <button type="button" class="perfil-switch" role="switch" aria-checked="${pref.on}" aria-labelledby="perfil-pref-${i}" data-pref="${i}"></button>
    </li>`).join("");
  return `
    <article class="perfil-card">
      <header class="perfil-card-header">
        <h2 class="perfil-card-title">${t("perfil.preferences")}</h2>
        ${sampleTag()}
      </header>
      <ul class="perfil-prefs">${rows}</ul>
    </article>`;
}

// Campo de contraseña con su etiqueta. describedBy: ids del aviso y del error de su formulario; hintKey opcional.
function renderPasswordField(id, labelKey, autocomplete, describedBy, hintKey = "") {
  const hint = hintKey ? `<p id="${id}-hint" class="perfil-hint">${t(hintKey, { min: PERFIL_MIN_PASSWORD })}</p>` : "";
  return `
    <div>
      <label for="${id}" class="perfil-label">${t(labelKey)}</label>
      <input id="${id}" type="password" class="perfil-input" autocomplete="${autocomplete}" maxlength="72" required
        autocapitalize="off" spellcheck="false" aria-describedby="${hintKey ? `${id}-hint ` : ""}${describedBy}">
      ${hint}
    </div>`;
}

// Seguridad: cambiar contraseña y eliminar cuenta (con aviso y confirmación escribiendo la contraseña)
function renderSecurityCard() {
  return `
    <article id="perfil-security" class="perfil-card perfil-security">
      <h2 class="perfil-card-title">${t("perfil.security")}</h2>
      <div class="perfil-security-grid">
        <form class="perfil-form" data-form="password" aria-labelledby="perfil-password-title" novalidate>
          <h3 id="perfil-password-title" class="perfil-security-title">${t("perfil.password.title")}</h3>
          <p class="perfil-security-text">${t("perfil.password.text")}</p>
          ${renderPasswordField("perfil-password-current", "perfil.password.current", "current-password", "perfil-password-error")}
          ${renderPasswordField("perfil-password-new", "perfil.password.new", "new-password", "perfil-password-error", "perfil.password.hint")}
          ${renderPasswordField("perfil-password-confirm", "perfil.password.confirm", "new-password", "perfil-password-error")}
          <p id="perfil-password-error" class="perfil-error" aria-live="assertive" aria-atomic="true"></p>
          <p class="perfil-success" role="status"></p>
          <div class="perfil-form-actions">
            <button type="submit" class="btn-pill perfil-btn-outline" data-idle="perfil.password.submit" data-busy="perfil.password.busy"><span data-label>${t("perfil.password.submit")}</span></button>
          </div>
        </form>
        <section class="perfil-danger" aria-labelledby="perfil-delete-title">
          <h3 id="perfil-delete-title" class="perfil-security-title">${t("perfil.delete.title")}</h3>
          <p class="perfil-security-text">${t("perfil.delete.text")}</p>
          <button type="button" class="btn-pill perfil-btn-danger" data-action="open-delete" aria-expanded="false" aria-controls="perfil-delete-form">${t("perfil.delete.open")}</button>
          <form id="perfil-delete-form" class="perfil-form" data-form="delete" aria-labelledby="perfil-delete-title" novalidate hidden>
            <p id="perfil-delete-warning" class="perfil-danger-warning">${t("perfil.delete.warning")}</p>
            ${renderPasswordField("perfil-delete-password", "perfil.delete.password", "current-password", "perfil-delete-warning perfil-delete-error")}
            <p id="perfil-delete-error" class="perfil-error" aria-live="assertive" aria-atomic="true"></p>
            <div class="perfil-form-actions">
              <button type="submit" class="btn-pill perfil-btn-danger" data-idle="perfil.delete.submit" data-busy="perfil.delete.busy"><span data-label>${t("perfil.delete.submit")}</span></button>
              <button type="button" class="btn-pill perfil-btn-outline" data-action="cancel-delete">${t("perfil.delete.cancel")}</button>
            </div>
          </form>
        </section>
      </div>
    </article>`;
}

// ---------- Carga ----------

// skills: { skills } o { error }; goal: { readiness } (null sin objetivos) o { error }. null = todavía sin datos.
const perfilState = { profile: sampleProfileData(), skills: null, goal: null, editing: false, request: 0 };

// Animaciones de entrada de la vista (keyframes compartidos card-in y bar-fill en styles.css).
const PERFIL_ENTRANCE = ["card-in", "bar-fill"];
const perfilEntrance = el => el.getAnimations({ subtree: true })
  .filter(a => a instanceof CSSAnimation && PERFIL_ENTRANCE.includes(a.animationName));

function renderPerfil() {
  const p = perfilState.profile;
  document.getElementById("perfil-content").innerHTML = `
    ${renderPerfilHeader(p)}
    <div class="perfil-grid">
      <div class="perfil-col">${renderSkillsCard(perfilState.skills)}${renderProjectsCard(p)}</div>
      <div class="perfil-col">${renderStatsCard(p, perfilState.skills, perfilState.goal)}${renderPreferencesCard(p)}</div>
    </div>
    ${renderSecurityCard()}`;
}

// Reemplaza un bloque ya pintado sin reiniciar la entrada: sigue desde donde iba o, si ya había terminado, aparece
// quieto. Con la vista oculta no hay animaciones que continuar.
function swapPerfilBlock(id, html) {
  const old = document.getElementById(id);
  if (!old) return;
  const elapsed = perfilEntrance(old).find(a => a.playState === "running")?.currentTime;
  old.outerHTML = html;
  perfilEntrance(document.getElementById(id)).forEach(a => { if (elapsed != null) a.currentTime = elapsed; else a.finish(); });
}

// Objetivo activo: el de Mi Ruta; si aún no cargó, el guardado o el primero
async function fetchActiveReadiness() {
  const goals = await fetchGoals();
  const id = getActiveGoalId() || readSavedGoalId();
  const goal = goals.find(g => String(g.id) === String(id)) || goals[0];
  return goal ? fetchReadiness(goal.id) : null;
}

// Habilidades y objetivo, cada vez que se abre la vista (las peticiones están en caché en dashboard.js)
async function loadPerfilData() {
  const request = ++perfilState.request;
  const [skills, goal] = await Promise.all([
    fetchSkills().then(list => ({ skills: list }), error => ({ error })),
    fetchActiveReadiness().then(readiness => ({ readiness }), error => ({ error })),
  ]);
  if (request !== perfilState.request) return; // cambió el usuario o su progreso mientras cargaba
  perfilState.skills = skills;
  perfilState.goal = goal;
  swapPerfilBlock("perfil-skills", renderSkillsCard(skills));
  swapPerfilBlock("perfil-stats", renderStatsCard(perfilState.profile, skills, goal));
}

// Al abrir la vista (showView en mapa.js): se pinta una vez y los datos se refrescan siempre (objetivo nuevo, progreso)
function openPerfil() {
  if (!document.getElementById("perfil-content").childElementCount) renderPerfil();
  loadPerfilData();
}

// Habilidades viejas (habilidad marcada o demanda recalculada): se vuelven a pedir al abrir Perfil. Una carga en
// vuelo se descarta.
function resetPerfilSkills() {
  perfilState.request++;
  perfilState.skills = null;
  perfilState.goal = null;
}

// ---------- Formularios ----------

const PERFIL_JSON = { "Content-Type": "application/json" };
const codePoints = text => Array.from(text).length;

// Aviso para lectores de pantalla (#perfil-status queda fuera de lo que se repinta)
function announcePerfil(text) {
  const status = document.getElementById("perfil-status");
  status.textContent = "";
  setTimeout(() => { status.textContent = text; }, 50);
}

// Error en la región aria-live del formulario; el campo afectado queda marcado con aria-invalid y con el foco
function setPerfilFormError(form, text, field = null) {
  form.querySelector(".perfil-error").textContent = text;
  form.querySelectorAll("input").forEach(input => input.removeAttribute("aria-invalid"));
  if (field) {
    field.setAttribute("aria-invalid", "true");
    field.focus();
  }
}

// Durante el envío los campos quedan de solo lectura (conservan el foco) y el botón avisa de la espera
function setPerfilFormBusy(form, busy) {
  form.dataset.busy = busy ? "true" : "";
  const submit = form.querySelector("[type='submit']");
  submit.setAttribute("aria-busy", String(busy));
  submit.setAttribute("aria-disabled", String(busy));
  submit.querySelector("[data-label]").textContent = t(busy ? submit.dataset.busy : submit.dataset.idle);
  form.querySelectorAll("input").forEach(input => { input.readOnly = busy; });
  form.querySelectorAll("button[type='button']").forEach(button => { button.disabled = busy; });
}

function setProfileEditing(editing) {
  perfilState.editing = editing;
  swapPerfilBlock("perfil-header", renderPerfilHeader(perfilState.profile));
  document.querySelector(editing ? "#perfil-name" : "#perfil-header [data-action='edit-profile']")?.focus();
}

async function submitProfile(form) {
  const name = form.querySelector("#perfil-name"), headline = form.querySelector("#perfil-headline");
  if (!name.value.trim()) return setPerfilFormError(form, t("perfil.form.missingName"), name);
  if (codePoints(name.value.trim()) > PERFIL_MAX_NAME) {
    return setPerfilFormError(form, t("perfil.form.longName", { max: PERFIL_MAX_NAME }), name);
  }
  if (codePoints(headline.value.trim()) > PERFIL_MAX_HEADLINE) {
    return setPerfilFormError(form, t("perfil.form.longHeadline", { max: PERFIL_MAX_HEADLINE }), headline);
  }
  setPerfilFormError(form, "");
  setPerfilFormBusy(form, true);
  try {
    const user = await apiJson("/api/auth/me", {
      method: "PATCH",
      headers: PERFIL_JSON,
      body: JSON.stringify({ name: name.value.trim(), headline: headline.value.trim() }),
    });
    sessionUser = { ...sessionUser, ...user };
    renderUserMenu(); // nombre e inicial del menú de usuario, sin recargar
    setProfileEditing(false);
    announcePerfil(t("perfil.form.saved"));
  } catch (err) {
    setPerfilFormBusy(form, false);
    // El mensaje original del backend (en español) dice qué campo falló
    setPerfilFormError(form, friendlyError(err), /titular/i.test(err.message) ? headline : name);
  }
}

async function submitPassword(form) {
  const current = form.querySelector("#perfil-password-current");
  const next = form.querySelector("#perfil-password-new");
  const confirm = form.querySelector("#perfil-password-confirm");
  const success = form.querySelector(".perfil-success");
  success.textContent = "";
  if (!current.value) return setPerfilFormError(form, t("perfil.password.missingCurrent"), current);
  if (codePoints(next.value) < PERFIL_MIN_PASSWORD) {
    return setPerfilFormError(form, t("perfil.password.short", { min: PERFIL_MIN_PASSWORD }), next);
  }
  if (next.value !== confirm.value) return setPerfilFormError(form, t("perfil.password.mismatch"), confirm);
  const body = JSON.stringify({ currentPassword: current.value, newPassword: next.value });
  [current, next, confirm].forEach(input => { input.value = ""; }); // tras enviar no quedan en los campos
  setPerfilFormError(form, "");
  setPerfilFormBusy(form, true);
  try {
    await apiJson("/api/auth/me/password", { method: "PUT", headers: PERFIL_JSON, body });
    setPerfilFormBusy(form, false);
    success.textContent = t("perfil.password.done");
  } catch (err) {
    setPerfilFormBusy(form, false);
    // Actual incorrecta, demasiados intentos o sin conexión: el foco va a la actual; si no (longitud), a la nueva
    const onCurrent = err instanceof TypeError || /actual|intentos/i.test(err.message);
    setPerfilFormError(form, friendlyError(err), onCurrent ? current : next);
  }
}

function setDeleteOpen(open) {
  const toggle = document.querySelector("#perfil-security [data-action='open-delete']");
  const form = document.getElementById("perfil-delete-form");
  toggle.setAttribute("aria-expanded", String(open));
  toggle.hidden = open;
  form.hidden = !open;
  form.querySelector("input").value = "";
  setPerfilFormError(form, "");
  (open ? form.querySelector("input") : toggle).focus();
}

async function submitDelete(form) {
  const password = form.querySelector("#perfil-delete-password");
  if (!password.value) return setPerfilFormError(form, t("perfil.delete.missing"), password);
  const body = JSON.stringify({ password: password.value });
  password.value = "";
  setPerfilFormError(form, "");
  setPerfilFormBusy(form, true);
  try {
    const res = await apiFetch("/api/auth/me", { method: "DELETE", headers: PERFIL_JSON, body });
    if (!res.ok) throw await apiError(res);
    endSession({ notice: t("perfil.delete.done"), keepEmail: false }); // el token ya no existe: de vuelta a Acceso
  } catch (err) {
    setPerfilFormBusy(form, false);
    setPerfilFormError(form, friendlyError(err), password);
  }
}

// ---------- Eventos ----------

document.addEventListener("skillmap:user", () => {
  resetPerfilSkills();
  perfilState.editing = false;
  document.getElementById("perfil-content").innerHTML = "";
});
document.addEventListener("skillmap:progress", () => {
  resetPerfilSkills();
  if (!document.getElementById("view-perfil").classList.contains("hidden")) loadPerfilData(); // abierto mientras se guardaba
});

function initPerfil() {
  const content = document.getElementById("perfil-content");
  content.addEventListener("click", e => {
    // Toggles de preferencias: solo visuales (no hay dónde guardarlos todavía).
    const toggle = e.target.closest(".perfil-switch");
    if (toggle) {
      const pref = perfilState.profile.preferences[Number(toggle.dataset.pref)];
      pref.on = !pref.on;
      toggle.setAttribute("aria-checked", String(pref.on));
      return;
    }
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "edit-profile") setProfileEditing(true);
    if (action === "cancel-edit") setProfileEditing(false);
    if (action === "open-delete") setDeleteOpen(true);
    if (action === "cancel-delete") setDeleteOpen(false);
  });
  content.addEventListener("submit", e => {
    e.preventDefault();
    const form = e.target;
    if (form.dataset.busy) return;
    ({ profile: submitProfile, password: submitPassword, delete: submitDelete })[form.dataset.form]?.(form);
  });
  // Esc dentro de la edición o de la confirmación de borrado: se cancela
  content.addEventListener("keydown", e => {
    const form = e.key === "Escape" && e.target.closest("[data-form='profile'], [data-form='delete']");
    if (!form || form.dataset.busy) return;
    e.preventDefault();
    if (form.dataset.form === "profile") setProfileEditing(false);
    else setDeleteOpen(false);
  });
}

// Cambio de idioma: si la vista ya se pintó, se vuelve a pintar (las preferencias conservan su estado; lo escrito en
// los formularios se pierde)
document.addEventListener("skillmap:language", () => {
  if (document.getElementById("perfil-content").childElementCount) renderPerfil();
});

document.addEventListener("DOMContentLoaded", initPerfil);
