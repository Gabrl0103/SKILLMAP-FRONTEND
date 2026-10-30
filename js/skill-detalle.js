// Vista "Detalle de habilidad": contexto, cómo aprenderla y preguntas frecuentes de una habilidad, con su estado y su
// demanda reales. Se abre desde el panel del Mapa Visual y desde las brechas de Mi Ruta (openSkillDetail) y el botón
// "Volver" regresa a la vista de origen.
// Usa SKILL_FAQ (skill-faq-data.js), showView y escapeHtml (mapa.js), fetchSkills, fetchGoals, renderApiError,
// demandIsSample, sampleTag, keepGapFocus y applyGapFocus (dashboard.js), currentActiveGoalId (objetivo.js), renderStatusPicker, bindStatusPicker,
// focusStatusPicker, saveSkillStatus y SKILL_STATE_CLASS (skill-status.js), routeDraw (route-motif.js), friendlyError (session.js) y t, statusLabel,
// tSkill, tCategory, tGoalTitle y getLanguage (i18n.js).

// Habilidad abierta, vista de origen, botón que la abrió (recibe el foco al volver), preguntas abiertas y cambio de
// estado (ocupado y último error)
const skillDetail = { id: null, from: "dashboard", opener: null, skill: null, goal: null, catalog: [],
  open: new Set(), busy: false, error: null };
let skillDetailRequest = 0; // descarta respuestas de una habilidad abierta antes

// Contenido estático en el idioma vigente; null si la habilidad no tiene entrada (p. ej. una nueva)
function skillFaqContent(skill) {
  const entry = SKILL_FAQ[skill.name];
  return entry ? { ...entry[getLanguage()], resources: entry.resources } : null;
}

// ---------- Bloques ----------

function renderSkillBack() {
  return `
    <button type="button" class="btn-pill btn-pill--outline skill-back" data-skill-back>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>
      ${t("skill.backTo", { view: t(`nav.${skillDetail.from}`) })}
    </button>`;
}

// Estado (menta = dominada, rosa = aprendiendo, punteado = pendiente) y demanda real del backend
function renderSkillMeta(skill) {
  const status = SKILL_STATE_CLASS[skill.status] || "pending";
  return `
    <span class="mapa-chip mapa-chip--${status}">${statusLabel(skill.status)}</span>
    <p class="skill-demand"><strong>${skill.demandPercentage}%</strong> ${t("skill.ofJobs")}</p>
    ${demandIsSample([skill]) ? sampleTag() : ""}`;
}

// Lugar de la habilidad en el objetivo activo, solo con datos de la API: demanda y puesto por demanda entre las
// habilidades del objetivo
function skillGoalText(skill) {
  const { goal, catalog } = skillDetail;
  const demand = t("skill.why.demand", { pct: skill.demandPercentage });
  if (!goal) return `${demand} ${t("skill.why.noGoal")}`;
  const name = escapeHtml(tGoalTitle(goal.title));
  const ids = new Set((goal.skills || []).map(s => s.skillId));
  if (!ids.has(skill.id)) return `${demand} ${t("skill.why.notInGoal", { goal: name })}`;
  const goalSkills = catalog.filter(s => ids.has(s.id));
  const rank = goalSkills.filter(s => s.demandPercentage > skill.demandPercentage).length + 1;
  return `${demand} ${t("skill.why.inGoal", { goal: name, rank, total: goalSkills.length })}`;
}

function renderSkillWhy(skill, content) {
  const note = demandIsSample([skill]) ? `<p class="skill-note">${sampleTag()} ${t("demand.sample")}</p>` : "";
  return `
    <section class="ruta-card skill-card" aria-labelledby="skill-why-title">
      <h2 id="skill-why-title" class="skill-card-title">${t("skill.why")}</h2>
      ${content ? `<p class="skill-text">${escapeHtml(content.market)}</p>` : ""}
      <p class="skill-text">${skillGoalText(skill)}</p>
      ${note}
    </section>`;
}

function renderSkillHow(content) {
  const steps = content.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("");
  return `
    <section class="ruta-card skill-card" aria-labelledby="skill-how-title">
      <header class="skill-card-header">
        <h2 id="skill-how-title" class="skill-card-title">${t("skill.how")}</h2>
        <span class="skill-time">${t("skill.time", { time: escapeHtml(content.time) })}</span>
      </header>
      <ol class="skill-steps">${steps}</ol>
    </section>`;
}

// Acordeón: cada pregunta es un botón con aria-expanded que muestra u oculta su respuesta (Enter / Espacio)
function renderSkillFaq(content) {
  const items = content.faq.map(([question, answer], i) => {
    const open = skillDetail.open.has(i);
    return `
      <div class="skill-faq-item">
        <h3>
          <button type="button" id="skill-faq-q${i}" class="skill-faq-question" aria-expanded="${open}" aria-controls="skill-faq-a${i}" data-faq="${i}">
            <span>${escapeHtml(question)}</span>
            <svg class="skill-faq-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
          </button>
        </h3>
        <div id="skill-faq-a${i}" class="skill-faq-answer" role="region" aria-labelledby="skill-faq-q${i}"${open ? "" : " hidden"}>
          <p>${escapeHtml(answer)}</p>
        </div>
      </div>`;
  }).join("");
  return `
    <section class="ruta-card skill-card" aria-labelledby="skill-faq-title">
      <h2 id="skill-faq-title" class="skill-card-title">${t("skill.faq")}</h2>
      <div class="skill-faq">${items}</div>
    </section>`;
}

function renderSkillResources(content) {
  if (!content.resources.length) return "";
  const lang = getLanguage();
  const links = content.resources.map(r => `
    <li>
      <a class="skill-resource" href="${escapeHtml(r.url)}" target="_blank" rel="noopener noreferrer">
        <span>${escapeHtml(r[lang])}<span class="sr-only">${t("common.newTab")}</span></span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>
      </a>
    </li>`).join("");
  return `
    <section class="ruta-card skill-card" aria-labelledby="skill-resources-title">
      <h2 id="skill-resources-title" class="skill-card-title">${t("skill.resources")}</h2>
      <p class="skill-hint">${t("skill.resourcesHint")}</p>
      <ul class="skill-resources">${links}</ul>
    </section>`;
}

// Tu progreso: texto según el estado y el selector Pendiente / Aprendiendo / Dominada (el mismo del Mapa)
function renderSkillProgress(skill) {
  const status = ["MASTERED", "IN_PROGRESS"].includes(skill.status) ? skill.status : "PENDING";
  const error = skillDetail.error
    ? `<p class="mapa-panel-error" role="alert">${escapeHtml(t("state.error", { error: friendlyError(skillDetail.error) }))}</p>` : "";
  return `
    <h2 class="skill-card-title">${t("skill.progress")}</h2>
    <p class="skill-text">${t(`mapa.text.${status}`)}</p>
    <div class="skill-status">${renderStatusPicker(skill, skillDetail.busy)}</div>
    ${error}`;
}

// Sin contenido estático: estado vacío amable; demanda, objetivo y progreso se muestran igual
function renderSkillEmpty(skill) {
  return `
    <section class="ruta-card skill-card skill-empty">
      <span class="mapa-panel-empty-icon" aria-hidden="true">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5v-13zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13z"/></svg>
      </span>
      <h2 class="skill-card-title">${t("skill.empty.title", { name: escapeHtml(tSkill(skill.name)) })}</h2>
      <p class="skill-text">${t("skill.empty.text")}</p>
    </section>`;
}

function renderSkillDetail(skill) {
  const content = skillFaqContent(skill);
  const main = content
    ? `<section class="ruta-card skill-card" aria-labelledby="skill-what-title">
        <h2 id="skill-what-title" class="skill-card-title">${t("skill.what")}</h2>
        <p class="skill-text">${escapeHtml(content.what)}</p>
      </section>
      ${renderSkillWhy(skill, content)}${renderSkillHow(content)}${renderSkillFaq(content)}`
    : `${renderSkillWhy(skill, null)}${renderSkillEmpty(skill)}`;
  return `
    ${renderSkillBack()}
    <header class="skill-header">
      ${skill.category ? `<span class="ruta-eyebrow">${escapeHtml(tCategory(skill.category))}</span>` : ""}
      <h1 id="skill-title" class="objetivo-title skill-title" tabindex="-1">${escapeHtml(tSkill(skill.name))}</h1>
      <div id="skill-meta" class="skill-meta">${renderSkillMeta(skill)}</div>
    </header>
    <div class="skill-grid">
      <div class="skill-col">${main}</div>
      <div class="skill-col">
        <section id="skill-progress" class="ruta-card skill-card">${renderSkillProgress(skill)}</section>
        ${content ? renderSkillResources(content) : ""}
      </div>
    </div>`;
}

// Estado y progreso se repintan sin tocar el resto (no se repite la entrada de las tarjetas ni se cierran preguntas)
function refreshSkillStatus() {
  const meta = document.getElementById("skill-meta");
  const progress = document.getElementById("skill-progress");
  if (!meta || !progress || !skillDetail.skill) return;
  const hadFocus = progress.contains(document.activeElement);
  meta.innerHTML = renderSkillMeta(skillDetail.skill);
  progress.innerHTML = renderSkillProgress(skillDetail.skill);
  if (hadFocus) focusStatusPicker(progress);
}

function paintSkillDetail({ focus = false } = {}) {
  const container = document.getElementById("skill-content");
  const skill = skillDetail.skill;
  container.innerHTML = skill
    ? renderSkillDetail(skill)
    : `${renderSkillBack()}<p class="skill-text">${t("skill.notFound")}</p>`;
  if (focus) (container.querySelector("#skill-title") || container.querySelector("[data-skill-back]")).focus();
}

// ---------- Datos ----------

// Habilidad (estado y demanda), objetivo activo y catálogo: todo de peticiones que ya existen y están en caché
async function loadSkillDetail({ focus = false } = {}) {
  const container = document.getElementById("skill-content");
  const requestId = ++skillDetailRequest;
  container.innerHTML = `${renderSkillBack()}<p class="route-state skill-text" role="status">${routeDraw({ loop: true })}${t("skill.loading")}</p>`;
  try {
    // Sin objetivos la pantalla se muestra igual, sin la parte del objetivo
    const [skills, goals] = await Promise.all([fetchSkills(), fetchGoals().catch(() => [])]);
    if (requestId !== skillDetailRequest) return;
    const goalId = goals.length ? currentActiveGoalId(goals) : null;
    skillDetail.skill = skills.find(s => s.id === skillDetail.id) || null;
    skillDetail.goal = goals.find(g => String(g.id) === goalId) || null;
    skillDetail.catalog = skills;
    paintSkillDetail({ focus });
  } catch (err) {
    if (requestId !== skillDetailRequest) return;
    container.innerHTML = `${renderSkillBack()}${renderApiError(err)}`;
    if (focus) container.querySelector("[data-skill-back]").focus();
  }
}

// Abre el detalle de una habilidad. opener: el botón que lo abrió, para devolverle el foco al volver.
function openSkillDetail(skillId, opener) {
  const current = document.querySelector("main > section[id^='view-']:not(.hidden)")?.id.slice("view-".length);
  if (current && current !== "skill") skillDetail.from = current;
  skillDetail.opener = opener || null;
  if (skillDetail.id !== skillId) {
    Object.assign(skillDetail, { id: skillId, skill: null, open: new Set(), busy: false, error: null });
  }
  showView("skill");
  window.scrollTo(0, 0);
  loadSkillDetail({ focus: true });
}

// "Volver": a la vista de origen y, si sigue ahí, al botón que abrió el detalle. Mi Ruta puede recargarse al abrirse: el
// foco se anota antes de que se borren las brechas y lo aplica dashboard.js al terminar. Perfil lo conserva al repintar.
function closeSkillDetail() {
  const { from, opener, id } = skillDetail;
  if (from === "dashboard") keepGapFocus(id);
  showView(from);
  if (from === "dashboard") { applyGapFocus(); return; }
  const target = opener?.isConnected ? opener : document.querySelector(`#view-${from} [data-context="${id}"]`);
  target?.focus();
}

// El estado cambia al instante; si el backend falla, vuelve al anterior y se muestra el error
async function setSkillDetailStatus(id, status) {
  const previous = skillDetail.skill;
  if (!previous || previous.id !== id || skillDetail.busy || previous.status === status) return;
  Object.assign(skillDetail, { skill: { ...previous, status }, busy: true, error: null });
  refreshSkillStatus();
  try {
    const updated = await saveSkillStatus(id, status);
    if (skillDetail.id !== id) return; // otra habilidad u otro usuario mientras se guardaba
    skillDetail.skill = { ...skillDetail.skill, ...updated };
    document.getElementById("skill-live").textContent = t("state.saved",
      { name: tSkill(updated.name), status: statusLabel(updated.status) });
    // Mi Ruta, Perfil y Analizador descartan sus datos viejos; el Mapa actualiza el nodo de esta habilidad
    document.dispatchEvent(new CustomEvent("skillmap:progress", { detail: { skill: skillDetail.skill } }));
  } catch (err) {
    if (skillDetail.id !== id) return;
    Object.assign(skillDetail, { skill: previous, error: err });
  }
  skillDetail.busy = false;
  refreshSkillStatus();
}

// ---------- Eventos ----------

document.getElementById("skill-content").addEventListener("click", e => {
  if (e.target.closest("[data-skill-back]")) { closeSkillDetail(); return; }
  const question = e.target.closest("[data-faq]");
  if (!question) return;
  const i = Number(question.dataset.faq);
  const open = question.getAttribute("aria-expanded") !== "true";
  question.setAttribute("aria-expanded", String(open));
  document.getElementById(question.getAttribute("aria-controls")).hidden = !open;
  if (open) skillDetail.open.add(i); else skillDetail.open.delete(i);
});
bindStatusPicker(document.getElementById("skill-content"), setSkillDetailStatus);

// Cambio de idioma: textos y contenido se vuelven a pintar con los datos ya cargados (el foco vuelve al título)
document.addEventListener("skillmap:language", () => {
  if (!skillDetail.skill) return;
  const visible = !document.getElementById("view-skill").classList.contains("hidden");
  paintSkillDetail({ focus: visible && document.getElementById("skill-content").contains(document.activeElement) });
});

// Cambio de usuario: fuera la habilidad abierta y lo pintado
document.addEventListener("skillmap:user", () => {
  skillDetailRequest++;
  Object.assign(skillDetail, { id: null, from: "dashboard", opener: null, skill: null, goal: null, catalog: [],
    open: new Set(), busy: false, error: null });
  document.getElementById("skill-content").innerHTML = "";
});
