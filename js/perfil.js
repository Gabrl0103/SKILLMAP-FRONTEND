// Vista "Perfil". Usa fetchSkills, fetchGoals, fetchReadiness, getActiveGoalId, readSavedGoalId, renderApiError y
// sampleDemandNote (dashboard.js), ICONS, pickIcon y escapeHtml (mapa.js), sessionUser, apiJson, apiFetch, apiError,
// friendlyError, renderUserMenu y endSession (session.js), routeDivider y routeDraw (route-motif.js) y t, tSkill, tGoalTitle y getLanguage (i18n.js).
// Todo es real: nombre, titular y correo (sesión), habilidades dominadas y en desarrollo (/api/skills), objetivo activo
// con su preparación (/api/goals/{id}/readiness) y enlaces y proyectos (/api/profile/links y /api/profile/projects).
// Los logros se calculan aquí con esos datos, sin guardar nada. Exportar CV abre una vista imprimible (window.print).
// El texto que escribe el usuario (nombre, titular, enlaces, proyectos) se inserta siempre con textContent, value o
// setAttribute, nunca como HTML. Se editan nombre y titular (PATCH /api/auth/me) y, en Seguridad, la contraseña
// (PUT /api/auth/me/password) y la cuenta (DELETE /api/auth/me). Las contraseñas solo viven en sus campos hasta
// enviar: se limpian al enviar, salga bien o mal, y nunca se guardan ni se registran.

// ---------- Íconos propios de la vista (viewBox 24x24, trazo con currentColor) ----------

const PERFIL_ICONS = {
  link: `<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,
  mail: `<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/>`,
  award: `<circle cx="12" cy="9" r="5.5"/><path d="m8.5 13.3-1.5 7.2 5-2.7 5 2.7-1.5-7.2"/>`,
  flag: `<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>`,
  user: `<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/>`,
  code: `<path d="m8 7-5 5 5 5M16 7l5 5-5 5"/>`,
  pencil: `<path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>`,
  trash: `<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>`,
};

function perfilIcon(name, size = 14) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
    stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PERFIL_ICONS[name]}</svg>`;
}

// ---------- Construcción segura ----------

// Bloque a partir de HTML fijo (textos de t(), íconos y números). El texto del usuario nunca pasa por aquí: se agrega
// después con textContent, value o setAttribute.
function perfilBlock(html) {
  const template = document.createElement("template");
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

// Elemento con texto del usuario (textContent: nunca se interpreta como HTML)
function perfilEl(tag, className, text = "") {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

// Enlace externo: solo http(s) (el backend ya lo exige), en otra pestaña y sin acceso a esta ventana
function perfilExternalLink(url, className, text) {
  if (!/^https?:\/\//i.test(url)) return perfilEl("span", className, text);
  const a = perfilEl("a", className, text);
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.append(perfilEl("span", "sr-only", t("common.newTab")));
  return a;
}

// ---------- Límites (los mismos que el backend: UserFactory y ProfileItemFactory) ----------

const PERFIL_MAX_NAME = 60;
const PERFIL_MAX_HEADLINE = 80;
const PERFIL_MIN_PASSWORD = 8;
const PERFIL_LIMITS = { label: 40, name: 60, description: 240, tags: 5, tag: 30, url: 2048 };

// Enlaces y proyectos comparten tarjeta, formulario y confirmación de borrado; cambia lo que dice esta tabla
const PERFIL_ITEMS = {
  link: { state: "links", path: "/api/profile/links", max: 8, card: "perfil-links-card", keys: "perfil.links" },
  project: { state: "projects", path: "/api/profile/projects", max: 10, card: "perfil-projects-card", keys: "perfil.projects" },
};

// ---------- Cabecera ----------

// Iniciales del nombre: primera letra de la primera y de la última palabra (una sola si el nombre es de una palabra)
function initialsOf(name) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = word => Array.from(word)[0] || "";
  return (first(words[0] || "") + (words.length > 1 ? first(words[words.length - 1]) : "")).toUpperCase();
}

// Nombre y titular editables (con perfilState.editing reemplaza al titular, el correo y los botones)
function renderProfileForm() {
  return `
    <form class="perfil-form" data-form="profile" aria-label="${t("perfil.form.title")}" novalidate>
      <div>
        <label for="perfil-name" class="perfil-label">${t("perfil.form.name")}</label>
        <input id="perfil-name" type="text" class="perfil-input" autocomplete="name" maxlength="${PERFIL_MAX_NAME}" required
          aria-describedby="perfil-profile-error">
      </div>
      <div>
        <label for="perfil-headline" class="perfil-label">${t("perfil.form.headline")} <span class="perfil-optional">${t("perfil.form.optional")}</span></label>
        <input id="perfil-headline" type="text" class="perfil-input" maxlength="${PERFIL_MAX_HEADLINE}"
          placeholder="${t("perfil.form.headlinePlaceholder")}" aria-describedby="perfil-headline-hint perfil-profile-error">
        <p id="perfil-headline-hint" class="perfil-hint">${t("perfil.form.headlineHint", { max: PERFIL_MAX_HEADLINE })}</p>
      </div>
      <p id="perfil-profile-error" class="perfil-error" aria-live="assertive" aria-atomic="true"></p>
      <div class="perfil-form-actions">
        <button type="submit" class="btn-pill" data-idle="perfil.form.save" data-busy="perfil.form.saving"><span data-label>${t("perfil.form.save")}</span></button>
        <button type="button" class="btn-pill perfil-btn-outline" data-action="cancel-edit">${t("perfil.form.cancel")}</button>
      </div>
    </form>`;
}

// Iniciales, nombre, titular, correo y enlaces reales
function renderPerfilHeader() {
  const user = sessionUser || {};
  const name = user.name || user.email || "";
  const editing = perfilState.editing;
  const header = perfilBlock(`
    <article id="perfil-header" class="perfil-card perfil-header">
      <div class="perfil-photo"><span class="perfil-photo-initials" role="img"></span></div>
      <div class="perfil-identity">
        <h1 class="perfil-name"></h1>
        ${editing ? renderProfileForm() : `
          <p class="perfil-headline"></p>
          <ul class="perfil-links">
            <li class="perfil-link">${perfilIcon("mail", 13)}<span class="sr-only">${t("perfil.emailLabel")}</span><span data-slot="email"></span></li>
          </ul>`}
      </div>
      ${editing ? "" : `
        <div class="perfil-header-actions">
          <button type="button" class="btn-pill" data-action="edit-profile">${t("perfil.edit")}</button>
          <button type="button" class="btn-pill perfil-btn-outline" data-action="open-cv">${t("perfil.exportCv")}</button>
        </div>`}
    </article>`);
  const initials = header.querySelector(".perfil-photo-initials");
  initials.textContent = initialsOf(name);
  initials.setAttribute("aria-label", t("perfil.photo", { name }));
  header.querySelector(".perfil-name").textContent = name;
  if (editing) {
    header.querySelector("#perfil-name").value = user.name || "";
    header.querySelector("#perfil-headline").value = user.headline || "";
    return header;
  }
  const headline = header.querySelector(".perfil-headline");
  headline.textContent = user.headline || t("perfil.noHeadline");
  headline.classList.toggle("perfil-headline--empty", !user.headline);
  header.querySelector("[data-slot='email']").textContent = user.email || "";
  for (const link of perfilState.links?.items || []) {
    const li = document.createElement("li");
    const a = perfilExternalLink(link.url, "perfil-link perfil-link--web", link.label);
    a.insertAdjacentHTML("afterbegin", perfilIcon("link", 13));
    li.append(a);
    header.querySelector(".perfil-links").append(li);
  }
  return header;
}

// ---------- Mis Habilidades ----------

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

const skillsWithStatus = (skillsState, status) => skillsState?.skills?.filter(s => s.status === status) || [];

function renderSkillsCard(skillsState) {
  let body;
  if (skillsState?.error) body = renderApiError(skillsState.error);
  else if (!skillsState) body = `<p class="route-state text-sm text-muted">${routeDraw({ loop: true })}${t("perfil.loadingSkills")}</p>`;
  else {
    const mastered = skillsWithStatus(skillsState, "MASTERED");
    const learning = skillsWithStatus(skillsState, "IN_PROGRESS");
    const note = mastered.length || learning.length ? sampleDemandNote("perfil-sample-note", [...mastered, ...learning]) : "";
    body = renderSkillGroup(t("perfil.mastered"), mastered, "mastered", t("perfil.masteredEmpty"))
      + renderSkillGroup(t("perfil.learning"), learning, "learning", t("perfil.learningEmpty"))
      // "Demanda media" se marca como ejemplo mientras alguna habilidad tenga demanda sembrada (demandIsSample), tras un
      // divisor del Motivo de Ruta.
      + (note ? routeDivider() + note : "");
  }
  return `
    <article id="perfil-skills" class="perfil-card">
      <h2 class="perfil-card-title">${t("perfil.skills")}</h2>
      ${body}
    </article>`;
}

// ---------- Estadísticas y logros ----------

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

// Logros calculados con los datos ya cargados (nada se guarda). Sin datos todavía, cuentan como pendientes.
function perfilAchievements() {
  const mastered = skillsWithStatus(perfilState.skills, "MASTERED").length;
  const readiness = perfilState.goal?.readiness?.readinessPercentage ?? 0;
  const links = perfilState.links?.items?.length ?? 0;
  const projects = perfilState.projects?.items?.length ?? 0;
  return [
    { id: "mastered1", icon: "award", done: mastered >= 1 },
    { id: "mastered5", icon: "award", done: mastered >= 5 },
    { id: "mastered10", icon: "award", done: mastered >= 10 },
    { id: "goal50", icon: "flag", done: readiness >= 50 },
    { id: "goal75", icon: "flag", done: readiness >= 75 },
    { id: "goal100", icon: "flag", done: readiness >= 100 },
    { id: "profile", icon: "user", done: Boolean(sessionUser?.headline) && links >= 1 },
    { id: "project", icon: "code", done: projects >= 1 },
  ];
}

// Real: dominadas y en desarrollo sobre el total de /api/skills, preparación del objetivo activo y logros
function renderStatsCard(skillsState, goalState) {
  const counts = [["MASTERED", "perfil.masteredStat", "mint"], ["IN_PROGRESS", "perfil.learningStat", "pink"]].map(([status, key, tone]) => {
    if (!skillsState) return renderStatPending(t(key), "…");
    if (skillsState.error) return renderStatPending(t(key), "—");
    const total = skillsState.skills.length;
    const n = skillsWithStatus(skillsState, status).length;
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
  const achievements = perfilAchievements();
  const done = achievements.filter(a => a.done).length;
  return `
    <article id="perfil-stats" class="perfil-stats">
      <h2 class="perfil-stats-title">${t("perfil.stats")}</h2>
      ${counts}
      ${goal}
      ${routeDivider()}
      ${renderStatBar(t("perfil.achievementsStat"), `${done} / ${achievements.length}`, (done / achievements.length) * 100, "mint")}
    </article>`;
}

// Desbloqueado en menta; pendiente con borde punteado ("todavía no"). Cada uno dice cómo conseguirlo.
function renderAchievementsCard() {
  const achievements = perfilAchievements();
  const done = achievements.filter(a => a.done).length;
  const tiles = achievements.map(a => `
    <li class="perfil-achievement perfil-achievement--${a.done ? "done" : "locked"}">
      <span class="perfil-achievement-icon">${perfilIcon(a.icon, 18)}</span>
      <div class="min-w-0">
        <h3 class="perfil-achievement-title">${t(`perfil.achievement.${a.id}`)}</h3>
        <p class="perfil-achievement-how">${t(`perfil.achievement.${a.id}.how`)}</p>
        <p class="perfil-achievement-state">${t(a.done ? "perfil.achievements.done" : "perfil.achievements.locked")}</p>
      </div>
    </li>`).join("");
  return `
    <article id="perfil-achievements" class="perfil-card">
      <header class="perfil-card-header">
        <h2 class="perfil-card-title">${t("perfil.achievements")}</h2>
        <span class="perfil-count">${t("perfil.achievements.count", { n: done, total: achievements.length })}</span>
      </header>
      <ul class="perfil-achievements">${tiles}</ul>
    </article>`;
}

// ---------- Enlaces y proyectos ----------

// Etiquetas escritas separadas por comas: sin vacías ni repetidas, en el orden escrito
const parseTags = text => [...new Set(text.split(",").map(tag => tag.trim()).filter(Boolean))];

function renderItemField(id, labelKey, { type = "text", max, hintKey = "", hintParams = {}, optional = false, multiline = false, attrs = "" }) {
  const describedBy = `${hintKey ? `${id}-hint ` : ""}perfil-item-error`;
  const control = multiline
    ? `<textarea id="${id}" class="perfil-input perfil-textarea" rows="3" maxlength="${max}" aria-describedby="${describedBy}"></textarea>`
    : `<input id="${id}" type="${type}" class="perfil-input" maxlength="${max}" ${optional ? "" : "required"} ${attrs}
        aria-describedby="${describedBy}">`;
  return `
    <div>
      <label for="${id}" class="perfil-label">${t(labelKey)}${optional ? ` <span class="perfil-optional">${t("perfil.form.optional")}</span>` : ""}</label>
      ${control}
      ${hintKey ? `<p id="${id}-hint" class="perfil-hint">${t(hintKey, hintParams)}</p>` : ""}
    </div>`;
}

// Formulario de alta o edición (item null = nuevo). Los valores se cargan con .value.
function renderItemForm(kind, item) {
  const { keys } = PERFIL_ITEMS[kind];
  const url = { type: "url", max: PERFIL_LIMITS.url, hintKey: "perfil.item.urlHint",
    attrs: `inputmode="url" autocomplete="url" spellcheck="false" autocapitalize="off" placeholder="https://"` };
  const fields = kind === "link"
    ? renderItemField("perfil-item-label", "perfil.links.label", { max: PERFIL_LIMITS.label, hintKey: "perfil.item.maxHint",
        hintParams: { max: PERFIL_LIMITS.label }, attrs: `placeholder="${t("perfil.links.labelPlaceholder")}"` })
      + renderItemField("perfil-item-url", "perfil.links.url", url)
    : renderItemField("perfil-item-name", "perfil.projects.name", { max: PERFIL_LIMITS.name, hintKey: "perfil.item.maxHint",
        hintParams: { max: PERFIL_LIMITS.name } })
      + renderItemField("perfil-item-description", "perfil.projects.description", { max: PERFIL_LIMITS.description,
        hintKey: "perfil.item.maxHint", hintParams: { max: PERFIL_LIMITS.description }, optional: true, multiline: true })
      + renderItemField("perfil-item-url", "perfil.projects.url", { ...url, optional: true })
      + renderItemField("perfil-item-tags", "perfil.projects.tags", { max: 200, hintKey: "perfil.projects.tagsHint",
        hintParams: { max: PERFIL_LIMITS.tags, len: PERFIL_LIMITS.tag }, optional: true,
        attrs: `placeholder="${t("perfil.projects.tagsPlaceholder")}"` });
  const li = perfilBlock(`
    <li class="perfil-item perfil-item--form">
      <form class="perfil-form perfil-item-form" data-form="${kind}" aria-label="${t(`${keys}.${item ? "formEdit" : "formAdd"}`)}" novalidate>
        ${fields}
        <p id="perfil-item-error" class="perfil-error" aria-live="assertive" aria-atomic="true"></p>
        <div class="perfil-form-actions">
          <button type="submit" class="btn-pill" data-idle="perfil.item.save" data-busy="perfil.item.saving"><span data-label>${t("perfil.item.save")}</span></button>
          <button type="button" class="btn-pill perfil-btn-outline" data-action="cancel-item">${t("perfil.form.cancel")}</button>
        </div>
      </form>
    </li>`);
  if (item) {
    const set = (id, value) => { li.querySelector(`#${id}`).value = value || ""; };
    if (kind === "link") {
      set("perfil-item-label", item.label);
      set("perfil-item-url", item.url);
    } else {
      set("perfil-item-name", item.name);
      set("perfil-item-description", item.description);
      set("perfil-item-url", item.url);
      set("perfil-item-tags", item.tags.join(", "));
    }
  }
  return li;
}

const itemTitle = (kind, item) => (kind === "link" ? item.label : item.name);

// Confirmación de borrado en el lugar del elemento
function renderItemConfirm(kind, item) {
  const li = perfilBlock(`
    <li class="perfil-item perfil-item--confirm">
      <form class="perfil-confirm" data-form="delete-item" data-kind="${kind}" data-id="${Number(item.id)}"
        aria-labelledby="perfil-confirm-text" novalidate>
        <p id="perfil-confirm-text" class="perfil-confirm-text"></p>
        <p class="perfil-error" aria-live="assertive" aria-atomic="true"></p>
        <div class="perfil-form-actions">
          <button type="submit" class="btn-pill perfil-btn-danger" data-idle="perfil.item.confirmDelete" data-busy="perfil.item.deleting"><span data-label>${t("perfil.item.confirmDelete")}</span></button>
          <button type="button" class="btn-pill perfil-btn-outline" data-action="cancel-item">${t("perfil.form.cancel")}</button>
        </div>
      </form>
    </li>`);
  li.querySelector(".perfil-confirm-text").textContent = t(`${PERFIL_ITEMS[kind].keys}.confirm`, { name: itemTitle(kind, item) });
  return li;
}

// Enlace o proyecto en la lista, con Editar y Borrar (su nombre accesible incluye el del elemento)
function renderItem(kind, item) {
  const li = perfilBlock(`
    <li class="perfil-item">
      <span class="perfil-item-icon">${perfilIcon(kind === "link" ? "link" : "code", 18)}</span>
      <div class="perfil-item-body"></div>
      <div class="perfil-item-actions">
        <button type="button" class="perfil-icon-btn" data-action="edit-item" data-kind="${kind}" data-id="${Number(item.id)}">${perfilIcon("pencil", 17)}</button>
        <button type="button" class="perfil-icon-btn" data-action="delete-item" data-kind="${kind}" data-id="${Number(item.id)}">${perfilIcon("trash", 17)}</button>
      </div>
    </li>`);
  const title = itemTitle(kind, item);
  li.querySelectorAll(".perfil-icon-btn").forEach(button => {
    const label = t(button.dataset.action === "edit-item" ? "perfil.item.edit" : "perfil.item.delete", { name: title });
    button.setAttribute("aria-label", label);
    button.title = label;
  });
  const body = li.querySelector(".perfil-item-body");
  const heading = perfilEl("h3", "perfil-item-title");
  heading.append(item.url ? perfilExternalLink(item.url, "perfil-item-link", title) : title);
  body.append(heading);
  if (kind === "link") body.append(perfilEl("p", "perfil-item-meta", item.url));
  else {
    if (item.description) body.append(perfilEl("p", "perfil-item-desc", item.description));
    if (item.tags.length) {
      const tags = perfilEl("ul", "perfil-project-tags");
      item.tags.forEach(tag => tags.append(perfilEl("li", "", tag)));
      body.append(tags);
    }
  }
  return li;
}

// Tarjeta de enlaces o de proyectos: lista, alta (hasta el máximo), edición y borrado con confirmación
function renderItemsCard(kind) {
  const { state, max, card, keys } = PERFIL_ITEMS[kind];
  const data = perfilState[state];
  const items = data?.items || [];
  const edit = perfilState.edit?.kind === kind ? perfilState.edit.id : null;
  const confirm = perfilState.confirm?.kind === kind ? perfilState.confirm.id : null;
  const canAdd = data?.items && edit === null && items.length < max;
  let status = "";
  if (data?.error) status = renderApiError(data.error);
  else if (!data) status = `<p class="route-state perfil-empty">${routeDraw({ loop: true })}${t("common.loading")}</p>`;
  else if (!items.length && edit !== "new") status = `<p class="route-state perfil-empty">${routeDraw()}${t(`${keys}.empty`)}</p>`;
  else if (items.length >= max) status = `<p class="perfil-hint">${t(`${keys}.max`, { max })}</p>`;
  const article = perfilBlock(`
    <article id="${card}" class="perfil-card" aria-labelledby="${card}-title">
      <header class="perfil-card-header">
        <h2 id="${card}-title" class="perfil-card-title" tabindex="-1">${t(keys)}</h2>
        ${data?.items ? `<span class="perfil-count">${t("perfil.item.count", { n: items.length, max })}</span>` : ""}
        ${canAdd ? `<button type="button" class="perfil-add" data-action="add-item" data-kind="${kind}">${t(`${keys}.add`)}</button>` : ""}
      </header>
      <ul class="perfil-items route-sep"></ul>
      ${status}
    </article>`);
  const list = article.querySelector(".perfil-items");
  for (const item of items) {
    if (edit === item.id) list.append(renderItemForm(kind, item));
    else if (confirm === item.id) list.append(renderItemConfirm(kind, item));
    else list.append(renderItem(kind, item));
  }
  if (edit === "new") list.append(renderItemForm(kind, null));
  if (!list.childElementCount) list.remove();
  return article;
}

// ---------- CV imprimible ----------

// Sección del CV; content: nodo, texto (cargando o error) o null (sin datos: la sección no aparece)
function cvSection(titleKey, content) {
  if (!content) return null;
  const section = perfilEl("section", "perfil-cv-section");
  section.append(perfilEl("h2", "perfil-cv-title", t(titleKey)));
  section.append(typeof content === "string" ? perfilEl("p", "perfil-cv-muted", content) : content);
  return section;
}

// Estado de una carga para el CV: "cargando", "no se pudo" o null si ya hay datos
function cvPending(state) {
  if (!state) return t("perfil.cv.loading");
  return state.error ? t("perfil.cv.loadError") : null;
}

function cvSkills(status) {
  const pending = cvPending(perfilState.skills);
  if (pending) return pending;
  const skills = skillsWithStatus(perfilState.skills, status);
  if (!skills.length) return null;
  const list = perfilEl("ul", "perfil-cv-tags");
  skills.forEach(s => list.append(perfilEl("li", "", tSkill(s.name))));
  return list;
}

function cvGoal() {
  const pending = cvPending(perfilState.goal);
  if (pending || !perfilState.goal.readiness) return pending;
  const r = perfilState.goal.readiness;
  const p = perfilEl("p", "perfil-cv-goal", tGoalTitle(r.goalTitle));
  p.append(perfilEl("span", "perfil-cv-muted", ` · ${t("perfil.cv.readiness", { n: r.readinessPercentage })}`));
  return p;
}

function cvProjects() {
  const pending = cvPending(perfilState.projects);
  if (pending || !perfilState.projects.items.length) return pending;
  const list = perfilEl("ul", "perfil-cv-projects");
  for (const project of perfilState.projects.items) {
    const li = perfilEl("li", "perfil-cv-project");
    li.append(perfilEl("h3", "perfil-cv-project-name", project.name));
    if (project.url) li.append(perfilExternalLink(project.url, "perfil-cv-url", project.url));
    if (project.description) li.append(perfilEl("p", "", project.description));
    if (project.tags.length) li.append(perfilEl("p", "perfil-cv-muted", project.tags.join(" · ")));
    list.append(li);
  }
  return list;
}

function cvLinks() {
  const pending = cvPending(perfilState.links);
  if (pending || !perfilState.links.items.length) return pending;
  const list = perfilEl("ul", "perfil-cv-links");
  for (const link of perfilState.links.items) {
    const li = perfilEl("li", "", `${link.label}: `);
    li.append(perfilExternalLink(link.url, "perfil-cv-url", link.url));
    list.append(li);
  }
  return list;
}

// Vista imprimible en el idioma activo: nombre, titular, correo, objetivo, habilidades, proyectos y enlaces
function renderCv() {
  const user = sessionUser || {};
  const wrap = perfilBlock(`
    <div id="perfil-cv" class="perfil-cv-wrap">
      <div class="perfil-cv-toolbar">
        <button type="button" class="btn-pill perfil-btn-outline" data-action="close-cv">${t("perfil.cv.back")}</button>
        <button type="button" class="btn-pill" data-action="print-cv">${t("perfil.cv.print")}</button>
        <p class="perfil-hint">${t("perfil.cv.hint")}</p>
      </div>
      <article class="perfil-cv" lang="${getLanguage()}" aria-labelledby="perfil-cv-name">
        <header class="perfil-cv-header">
          <h1 id="perfil-cv-name" class="perfil-cv-name" tabindex="-1"></h1>
        </header>
        <footer class="perfil-cv-footer"></footer>
      </article>
    </div>`);
  const header = wrap.querySelector(".perfil-cv-header");
  header.querySelector("h1").textContent = user.name || user.email || "";
  if (user.headline) header.append(perfilEl("p", "perfil-cv-headline", user.headline));
  header.append(perfilEl("p", "perfil-cv-contact", user.email || ""));
  const sections = [
    cvSection("perfil.cv.goal", cvGoal()),
    cvSection("perfil.cv.mastered", cvSkills("MASTERED")),
    cvSection("perfil.cv.learning", cvSkills("IN_PROGRESS")),
    cvSection("perfil.cv.projects", cvProjects()),
    cvSection("perfil.cv.links", cvLinks()),
  ].filter(Boolean);
  const footer = wrap.querySelector(".perfil-cv-footer");
  footer.before(...sections);
  const date = new Date().toLocaleDateString(getLanguage() === "en" ? "en-US" : "es-ES", { dateStyle: "long" });
  footer.textContent = t("perfil.cv.footer", { date });
  return wrap;
}

// El CV reemplaza al perfil en la vista; <html data-cv> activa las reglas de impresión (styles.css)
function setCvOpen(open) {
  perfilState.cv = open;
  document.documentElement.toggleAttribute("data-cv", open);
  document.getElementById("perfil-content").hidden = open;
  const closed = perfilEl("div", "");
  closed.id = "perfil-cv";
  closed.hidden = true;
  document.getElementById("perfil-cv").replaceWith(open ? renderCv() : closed);
  window.scrollTo(0, 0);
  document.querySelector(open ? "#perfil-cv-name" : "#perfil-header [data-action='open-cv']")?.focus();
}

// Con datos nuevos (o cambio de idioma) el CV abierto se vuelve a armar; el foco vuelve al botón en el que estaba
function refreshCv() {
  if (!perfilState.cv) return;
  const focused = document.activeElement?.closest("#perfil-cv")?.dataset.action;
  document.getElementById("perfil-cv").replaceWith(renderCv());
  if (focused) document.querySelector(`#perfil-cv [data-action='${focused}']`)?.focus();
}

// El nombre del archivo PDF sale del título de la página
function printCv() {
  const title = document.title;
  document.title = t("perfil.cv.fileName", { name: sessionUser?.name || "" });
  window.print();
  document.title = title;
}

// ---------- Seguridad ----------

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

// skills: { skills } o { error }; goal: { readiness } (null sin objetivos) o { error }; links y projects: { items } o
// { error }. null = todavía sin datos. edit: { kind, id | "new" } y confirm: { kind, id }: uno abierto a la vez.
const perfilState = { skills: null, goal: null, links: null, projects: null, editing: false, edit: null, confirm: null,
  cv: false, request: 0, itemsRequest: 0 };

// Animaciones de entrada de la vista (keyframes compartidos card-in y bar-fill en styles.css).
const PERFIL_ENTRANCE = ["card-in", "bar-fill"];
const perfilEntrance = el => el.getAnimations({ subtree: true })
  .filter(a => a instanceof CSSAnimation && PERFIL_ENTRANCE.includes(a.animationName));

function renderPerfil() {
  const grid = perfilBlock(`
    <div class="perfil-grid">
      <div class="perfil-col">${renderSkillsCard(perfilState.skills)}</div>
      <div class="perfil-col">${renderStatsCard(perfilState.skills, perfilState.goal)}</div>
    </div>`);
  const [main, side] = grid.children;
  main.append(renderItemsCard("project"), perfilBlock(renderAchievementsCard()));
  side.append(renderItemsCard("link"));
  document.getElementById("perfil-content").replaceChildren(renderPerfilHeader(), grid, perfilBlock(renderSecurityCard()));
}

// Reemplaza un bloque ya pintado sin reiniciar la entrada: sigue desde donde iba o, si ya había terminado, aparece
// quieto. Con la vista oculta no hay animaciones que continuar. block: HTML fijo o un elemento ya armado.
function swapPerfilBlock(id, block) {
  const old = document.getElementById(id);
  if (!old) return;
  const elapsed = perfilEntrance(old).find(a => a.playState === "running")?.currentTime;
  const node = typeof block === "string" ? perfilBlock(block) : block;
  old.replaceWith(node);
  perfilEntrance(node).forEach(a => { if (elapsed != null) a.currentTime = elapsed; else a.finish(); });
}

// Estadísticas, logros y CV: dependen de todo lo demás
function refreshPerfilProgress() {
  swapPerfilBlock("perfil-stats", renderStatsCard(perfilState.skills, perfilState.goal));
  swapPerfilBlock("perfil-achievements", renderAchievementsCard());
  refreshCv();
}

// Enlaces y proyectos cambiaron: sus tarjetas, los enlaces de la cabecera (salvo durante la edición) y el progreso
function refreshPerfilItems() {
  swapPerfilBlock("perfil-links-card", renderItemsCard("link"));
  swapPerfilBlock("perfil-projects-card", renderItemsCard("project"));
  if (!perfilState.editing) swapPerfilBlock("perfil-header", renderPerfilHeader());
  refreshPerfilProgress();
}

// Objetivo activo: el de Mi Ruta; si aún no cargó, el guardado o el primero
async function fetchActiveReadiness() {
  const goals = await fetchGoals();
  const id = getActiveGoalId() || readSavedGoalId();
  const goal = goals.find(g => String(g.id) === String(id)) || goals[0];
  return goal ? fetchReadiness(goal.id) : null;
}

// Enlaces y proyectos: una vez por usuario (solo cambian desde esta vista) o de nuevo tras un error
async function loadPerfilItems() {
  if (perfilState.links?.items && perfilState.projects?.items) return;
  const request = ++perfilState.itemsRequest;
  const [links, projects] = await Promise.all(Object.values(PERFIL_ITEMS).map(({ path }) =>
    apiJson(path).then(items => ({ items }), error => ({ error }))));
  if (request !== perfilState.itemsRequest) return; // cambió el usuario mientras cargaba
  Object.assign(perfilState, { links, projects });
  refreshPerfilItems();
}

// Habilidades y objetivo, cada vez que se abre la vista (las peticiones están en caché en dashboard.js)
async function loadPerfilData() {
  loadPerfilItems();
  const request = ++perfilState.request;
  const [skills, goal] = await Promise.all([
    fetchSkills().then(list => ({ skills: list }), error => ({ error })),
    fetchActiveReadiness().then(readiness => ({ readiness }), error => ({ error })),
  ]);
  if (request !== perfilState.request) return; // cambió el usuario o su progreso mientras cargaba
  perfilState.skills = skills;
  perfilState.goal = goal;
  swapPerfilBlock("perfil-skills", renderSkillsCard(skills));
  refreshPerfilProgress();
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
  form.querySelectorAll("input, textarea").forEach(input => input.removeAttribute("aria-invalid"));
  if (field) {
    if (field.matches("input, textarea")) field.setAttribute("aria-invalid", "true");
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
  form.querySelectorAll("input, textarea").forEach(input => { input.readOnly = busy; });
  form.querySelectorAll("button[type='button']").forEach(button => { button.disabled = busy; });
}

function setProfileEditing(editing) {
  perfilState.editing = editing;
  swapPerfilBlock("perfil-header", renderPerfilHeader());
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
    refreshPerfilProgress(); // el titular cuenta para el logro "Perfil completo"
    announcePerfil(t("perfil.form.saved"));
  } catch (err) {
    setPerfilFormBusy(form, false);
    // El mensaje original del backend (en español) dice qué campo falló
    setPerfilFormError(form, friendlyError(err), /titular/i.test(err.message) ? headline : name);
  }
}

// Abre el alta (id "new"), la edición o la confirmación de borrado de un enlace o proyecto; sin nada, cierra lo
// abierto. focus: selector de lo que recibe el foco después de pintar.
function setItemMode({ edit = null, confirm = null }, focus = "") {
  perfilState.edit = edit;
  perfilState.confirm = confirm;
  swapPerfilBlock("perfil-links-card", renderItemsCard("link"));
  swapPerfilBlock("perfil-projects-card", renderItemsCard("project"));
  if (focus) document.querySelector(focus)?.focus();
}

// Tras cerrar un formulario el foco vuelve a lo que lo abrió (Editar o Borrar del elemento, o Agregar); si ya no está
// (se borró o se llegó al máximo), al título de la tarjeta
function focusItemOrigin(kind, id, action) {
  const { card } = PERFIL_ITEMS[kind];
  const origin = id === "new"
    ? `#${card} [data-action='add-item']`
    : `#${card} [data-action='${action}'][data-id='${Number(id)}']`;
  (document.querySelector(origin) || document.getElementById(`${card}-title`)).focus();
}

// Cancelar (o Esc) en un formulario de enlace o proyecto, o en su confirmación de borrado
function cancelItemMode() {
  const { kind, id } = perfilState.edit || perfilState.confirm || {};
  if (!kind) return;
  const action = perfilState.edit ? "edit-item" : "delete-item";
  setItemMode({});
  focusItemOrigin(kind, id, action);
}

// Validación en el navegador con los mismos límites que el backend; devuelve el cuerpo o null si marcó un error
function readItemForm(kind, form) {
  const field = id => form.querySelector(`#${id}`);
  const fail = (key, input, params = {}) => { setPerfilFormError(form, t(key, params), input); return null; };
  const url = field("perfil-item-url");
  const urlValue = url.value.trim();
  const urlOk = !urlValue || /^https?:\/\/[^\s/?#]+/i.test(urlValue);
  if (kind === "link") {
    const label = field("perfil-item-label");
    if (!label.value.trim()) return fail("perfil.links.missingLabel", label);
    if (codePoints(label.value.trim()) > PERFIL_LIMITS.label) return fail("perfil.item.long", label, { max: PERFIL_LIMITS.label });
    if (!urlValue) return fail("perfil.links.missingUrl", url);
    if (!urlOk) return fail("perfil.item.badUrl", url);
    return { label: label.value.trim(), url: urlValue };
  }
  const name = field("perfil-item-name"), description = field("perfil-item-description"), tags = field("perfil-item-tags");
  const tagList = parseTags(tags.value);
  if (!name.value.trim()) return fail("perfil.projects.missingName", name);
  if (codePoints(name.value.trim()) > PERFIL_LIMITS.name) return fail("perfil.item.long", name, { max: PERFIL_LIMITS.name });
  if (codePoints(description.value.trim()) > PERFIL_LIMITS.description) {
    return fail("perfil.item.long", description, { max: PERFIL_LIMITS.description });
  }
  if (!urlOk) return fail("perfil.item.badUrl", url);
  if (tagList.length > PERFIL_LIMITS.tags) return fail("perfil.projects.tooManyTags", tags, { max: PERFIL_LIMITS.tags });
  if (tagList.some(tag => codePoints(tag) > PERFIL_LIMITS.tag)) return fail("perfil.projects.longTag", tags, { max: PERFIL_LIMITS.tag });
  return { name: name.value.trim(), description: description.value.trim(), url: urlValue, tags: tagList };
}

// Campo al que apunta un error del backend (su mensaje original, en español); si ninguno, el primero
function itemErrorField(form, message) {
  const rules = [[/URL/, "perfil-item-url"], [/etiqueta del enlace/i, "perfil-item-label"], [/etiqueta/i, "perfil-item-tags"],
    [/descripción/i, "perfil-item-description"], [/nombre/i, "perfil-item-name"]];
  const id = rules.find(([re, fieldId]) => re.test(message) && form.querySelector(`#${fieldId}`))?.[1];
  return form.querySelector(id ? `#${id}` : "input");
}

async function submitItem(form) {
  const kind = form.dataset.form;
  const { state, path, keys } = PERFIL_ITEMS[kind];
  const body = readItemForm(kind, form);
  if (!body) return;
  const id = perfilState.edit.id;
  setPerfilFormError(form, "");
  setPerfilFormBusy(form, true);
  try {
    const saved = await apiJson(id === "new" ? path : `${path}/${Number(id)}`, {
      method: id === "new" ? "POST" : "PUT", headers: PERFIL_JSON, body: JSON.stringify(body),
    });
    const items = perfilState[state].items;
    perfilState[state] = { items: id === "new" ? [...items, saved] : items.map(item => (item.id === saved.id ? saved : item)) };
    perfilState.edit = null;
    refreshPerfilItems();
    focusItemOrigin(kind, id === "new" ? "new" : saved.id, "edit-item");
    announcePerfil(t(`${keys}.saved`));
  } catch (err) {
    setPerfilFormBusy(form, false);
    setPerfilFormError(form, friendlyError(err), itemErrorField(form, err.message || ""));
  }
}

async function submitDeleteItem(form) {
  const kind = form.dataset.kind, id = Number(form.dataset.id);
  const { state, path, keys } = PERFIL_ITEMS[kind];
  setPerfilFormError(form, "");
  setPerfilFormBusy(form, true);
  try {
    const res = await apiFetch(`${path}/${id}`, { method: "DELETE" });
    // 404: ya no existía (borrado en otra pestaña); se quita igual de la lista
    if (!res.ok && res.status !== 404) throw await apiError(res);
    perfilState[state] = { items: perfilState[state].items.filter(item => item.id !== id) };
    perfilState.confirm = null;
    refreshPerfilItems();
    focusItemOrigin(kind, "new");
    announcePerfil(t(`${keys}.deleted`));
  } catch (err) {
    setPerfilFormBusy(form, false);
    setPerfilFormError(form, friendlyError(err), form.querySelector("[type='submit']"));
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
  perfilState.itemsRequest++;
  Object.assign(perfilState, { links: null, projects: null, editing: false, edit: null, confirm: null });
  if (perfilState.cv) setCvOpen(false);
  document.getElementById("perfil-content").replaceChildren();
});
document.addEventListener("skillmap:progress", () => {
  resetPerfilSkills();
  if (!document.getElementById("view-perfil").classList.contains("hidden")) loadPerfilData(); // abierto mientras se guardaba
});

// Al pasar a otra vista el CV se cierra: sus reglas de impresión (html[data-cv]) no deben afectar a las demás
document.addEventListener("click", e => {
  const view = e.target.closest("[data-view]")?.dataset.view;
  if (view && view !== "perfil" && perfilState.cv) setCvOpen(false);
});

function handlePerfilClick(e) {
  const button = e.target.closest("[data-action]");
  if (!button || button.disabled) return;
  const kind = button.dataset.kind, id = Number(button.dataset.id);
  const card = kind && `#${PERFIL_ITEMS[kind].card}`;
  const actions = {
    "edit-profile": () => setProfileEditing(true),
    "cancel-edit": () => setProfileEditing(false),
    "open-delete": () => setDeleteOpen(true),
    "cancel-delete": () => setDeleteOpen(false),
    "open-cv": () => setCvOpen(true),
    "close-cv": () => setCvOpen(false),
    "print-cv": printCv,
    "add-item": () => setItemMode({ edit: { kind, id: "new" } }, `${card} form input`),
    "edit-item": () => setItemMode({ edit: { kind, id } }, `${card} form input`),
    "delete-item": () => setItemMode({ confirm: { kind, id } }, `${card} .perfil-confirm [type='submit']`),
    "cancel-item": cancelItemMode,
  };
  actions[button.dataset.action]?.();
}

function initPerfil() {
  const view = document.getElementById("view-perfil");
  view.addEventListener("click", handlePerfilClick);
  view.addEventListener("submit", e => {
    e.preventDefault();
    const form = e.target;
    if (form.dataset.busy) return;
    ({ profile: submitProfile, password: submitPassword, delete: submitDelete, link: submitItem, project: submitItem,
      "delete-item": submitDeleteItem })[form.dataset.form]?.(form);
  });
  // Esc cancela la edición, la confirmación de borrado o el formulario abierto; fuera de ellos, cierra el CV
  view.addEventListener("keydown", e => {
    if (e.key !== "Escape") return;
    const form = e.target.closest("form");
    if (form?.dataset.busy) return;
    const cancel = { profile: () => setProfileEditing(false), delete: () => setDeleteOpen(false), link: cancelItemMode,
      project: cancelItemMode, "delete-item": cancelItemMode }[form?.dataset.form];
    if (cancel) cancel();
    else if (perfilState.cv) setCvOpen(false);
    else return;
    e.preventDefault();
  });
}

// Cambio de idioma: si la vista ya se pintó, se vuelve a pintar (lo escrito en los formularios se pierde) y el CV
// abierto pasa al idioma nuevo
document.addEventListener("skillmap:language", () => {
  if (document.getElementById("perfil-content").childElementCount) renderPerfil();
  refreshCv();
});

document.addEventListener("DOMContentLoaded", initPerfil);
