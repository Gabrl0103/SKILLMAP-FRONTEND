// Vista "Perfil". Usa fetchSkills, renderApiError, sampleTag y sampleDemandNote (dashboard.js) e ICONS, pickIcon y escapeHtml (mapa.js).

// ---------- Datos de ejemplo (la API todavía no los provee) ----------

// DATOS DE EJEMPLO: la API no tiene usuarios, proyectos, cursos, logros ni preferencias.
// Reemplazar por el endpoint de perfil cuando exista. La foto usa iniciales: no hay imagen del usuario.
function sampleProfileData() {
  return {
    name: "Alex Rivera",
    initials: "AR",
    bio: "Desarrollador Frontend con pasión por UX/UI y rendimiento web.",
    links: [
      { icon: "pin", label: "Madrid, España" },
      { icon: "link", label: "portfolio.alex.dev" },
      { icon: "repo", label: "alexrivera-dev" },
    ],
    projects: [
      { title: "E-commerce Flow UI Kit", thumb: "shop", tags: ["React", "UI/UX"],
        description: "Diseño y desarrollo de un sistema de componentes para tiendas online con React y Tailwind." },
      { title: "SaaS Analytics Dashboard", thumb: "chart", tags: ["Next.js", "Plotly"],
        description: "Dashboard interactivo con visualización de datos en tiempo real usando Plotly y Next.js." },
    ],
    courses: { completed: 8, total: 11 },
    achievements: [
      { label: "Primer objetivo alcanzado", icon: "award", tone: "mint" },
      { label: "Racha de 7 días de estudio", icon: "bolt", tone: "pink" },
      { label: "10 proyectos de código", icon: "code", tone: "blue" },
    ],
    preferences: [
      { label: "Búsqueda Activa", on: true },
      { label: "Perfil Público", on: true },
    ],
  };
}

// ---------- Íconos propios de la vista (viewBox 24x24, trazo con currentColor) ----------

const PERFIL_ICONS = {
  pin: `<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>`,
  link: `<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>`,
  repo: `<rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M8 3.5v17M11.5 8h5M11.5 12h5"/>`,
  camera: `<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="13" r="3.2"/>`,
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

function renderPerfilHeader(p) {
  const links = p.links.map(l => `<li class="perfil-link">${perfilIcon(l.icon, 13)}${escapeHtml(l.label)}</li>`).join("");
  return `
    <article class="perfil-card perfil-header">
      <div class="perfil-photo">
        <span class="perfil-photo-initials" role="img" aria-label="Foto de perfil de ${escapeHtml(p.name)}">${escapeHtml(p.initials)}</span>
        <button type="button" class="perfil-photo-edit" aria-disabled="true" title="Próximamente" aria-label="Cambiar foto (próximamente)">${perfilIcon("camera", 14)}</button>
      </div>
      <div class="perfil-identity">
        <div class="perfil-name-row">
          <h1 class="perfil-name">${escapeHtml(p.name)}</h1>
          ${sampleTag}
        </div>
        <p class="perfil-bio">${escapeHtml(p.bio)}</p>
        <ul class="perfil-links">${links}</ul>
      </div>
      <div class="perfil-header-actions">
        <button type="button" class="btn-pill" aria-disabled="true" title="Próximamente">Editar Perfil</button>
        <button type="button" class="btn-pill perfil-btn-outline" aria-disabled="true" title="Próximamente">Exportar CV</button>
      </div>
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
      <span>${escapeHtml(s.name)}</span>
    </li>`).join("");
  // La API no mide el nivel de dominio: a la derecha va la demanda media real del grupo.
  const metric = skills.length
    ? `<span class="perfil-group-metric perfil-group-metric--${tone}" title="Demanda promedio en vacantes de estas habilidades">Demanda media ${averageDemand(skills)}%</span>`
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
  if (skillsState.error) body = renderApiError(skillsState.error);
  else if (!skillsState.skills) body = `<p class="text-sm text-gray-400">Cargando tus habilidades…</p>`;
  else {
    const mastered = skillsState.skills.filter(s => s.status === "MASTERED");
    const learning = skillsState.skills.filter(s => s.status === "IN_PROGRESS");
    body = renderSkillGroup("Dominadas", mastered, "mastered", "Aún no tienes habilidades dominadas.")
      + renderSkillGroup("En aprendizaje", learning, "learning", "No estás aprendiendo ninguna habilidad ahora mismo.")
      // "Demanda media" usa la demanda sembrada del backend (ver DEMAND_IS_SAMPLE en dashboard.js).
      + (mastered.length || learning.length ? sampleDemandNote("perfil-sample-note") : "");
  }
  return `
    <article class="perfil-card">
      <h2 class="perfil-card-title">Mis Habilidades</h2>
      ${body}
    </article>`;
}

function renderProjectsCard(p) {
  const rows = p.projects.map(pr => `
    <li class="perfil-project">
      <svg class="perfil-project-thumb" viewBox="0 0 64 64" aria-hidden="true">${PROJECT_THUMBS[pr.thumb]}</svg>
      <div class="min-w-0">
        <h3 class="perfil-project-title">${escapeHtml(pr.title)}</h3>
        <p class="perfil-project-desc">${escapeHtml(pr.description)}</p>
        <ul class="perfil-project-tags">${pr.tags.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
      </div>
    </li>`).join("");
  return `
    <article class="perfil-card">
      <header class="perfil-card-header">
        <h2 class="perfil-card-title">Proyectos Destacados</h2>
        ${sampleTag}
        <button type="button" class="perfil-add" aria-disabled="true" title="Próximamente">+ Añadir Proyecto</button>
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

function renderStatsCard(p, skillsState) {
  // Real: habilidades dominadas sobre el total de /api/skills.
  let mastered = `<div class="perfil-stat"><div class="perfil-stat-head"><span>Habilidades Dominadas</span><strong>…</strong></div></div>`;
  if (skillsState.skills) {
    const total = skillsState.skills.length;
    const done = skillsState.skills.filter(s => s.status === "MASTERED").length;
    mastered = renderStatBar("Habilidades Dominadas", `${done} / ${total}`, total ? (done / total) * 100 : 0, "mint");
  } else if (skillsState.error) {
    mastered = `<div class="perfil-stat"><div class="perfil-stat-head"><span>Habilidades Dominadas</span><strong>—</strong></div></div>`;
  }
  const courses = renderStatBar("Cursos Completados", p.courses.completed, (p.courses.completed / p.courses.total) * 100, "pink");
  const achievements = p.achievements.map(a => `
    <li class="perfil-achievement perfil-achievement--${a.tone}" title="${escapeHtml(a.label)}">
      ${perfilIcon(a.icon, 15)}<span class="sr-only">${escapeHtml(a.label)}</span>
    </li>`).join("");
  return `
    <article class="perfil-stats">
      <h2 class="perfil-stats-title">Estadísticas de Carrera</h2>
      ${mastered}
      ${courses}
      <hr class="perfil-stats-divider">
      <h3 class="perfil-stats-eyebrow">Logros recientes</h3>
      <ul class="perfil-achievements">${achievements}</ul>
      <p class="perfil-stats-note">${sampleTag} Cursos y logros</p>
    </article>`;
}

function renderPreferencesCard(p) {
  const rows = p.preferences.map((pref, i) => `
    <li class="perfil-pref">
      <span id="perfil-pref-${i}">${escapeHtml(pref.label)}</span>
      <button type="button" class="perfil-switch" role="switch" aria-checked="${pref.on}" aria-labelledby="perfil-pref-${i}" data-pref="${i}"></button>
    </li>`).join("");
  return `
    <article class="perfil-card">
      <header class="perfil-card-header">
        <h2 class="perfil-card-title">Preferencias</h2>
        ${sampleTag}
      </header>
      <ul class="perfil-prefs">${rows}</ul>
    </article>`;
}

// ---------- Carga y eventos ----------

const perfilState = { profile: sampleProfileData(), skills: { skills: null, error: null }, loading: false };

// Animaciones de entrada de la vista (keyframes compartidos card-in y bar-fill en styles.css).
const PERFIL_ENTRANCE = ["card-in", "bar-fill"];
const perfilEntrance = container => container.getAnimations({ subtree: true })
  .filter(a => a instanceof CSSAnimation && PERFIL_ENTRANCE.includes(a.animationName));

function renderPerfil() {
  const p = perfilState.profile;
  const container = document.getElementById("perfil-content");
  // Al repintar con las habilidades, la entrada no se reinicia: las tarjetas nuevas siguen desde donde iba
  // y, si ya había terminado, aparecen quietas. Con la vista oculta no hay nada que continuar.
  const wasShown = container.childElementCount > 0 && container.offsetParent !== null;
  const elapsed = perfilEntrance(container).find(a => a.playState === "running")?.currentTime;
  container.innerHTML = `
    ${renderPerfilHeader(p)}
    <div class="perfil-grid">
      <div class="perfil-col">${renderSkillsCard(perfilState.skills)}${renderProjectsCard(p)}</div>
      <div class="perfil-col">${renderStatsCard(p, perfilState.skills)}${renderPreferencesCard(p)}</div>
    </div>`;
  if (!wasShown) return;
  perfilEntrance(container).forEach(a => { if (elapsed != null) a.currentTime = elapsed; else a.finish(); });
}

async function openPerfil() {
  if (perfilState.skills.skills || perfilState.loading) return;
  perfilState.loading = true;
  perfilState.skills = { skills: null, error: null };
  renderPerfil(); // los datos de ejemplo se ven de inmediato; las habilidades llegan después
  try {
    perfilState.skills = { skills: await fetchSkills(), error: null };
  } catch (err) {
    perfilState.skills = { skills: null, error: err }; // se reintenta la próxima vez que se abra la vista
  }
  perfilState.loading = false;
  renderPerfil();
}

function initPerfil() {
  document.getElementById("perfil-content").addEventListener("click", e => {
    // Toggles de preferencias: solo visuales (no hay dónde guardarlos todavía).
    const toggle = e.target.closest(".perfil-switch");
    if (!toggle) return;
    const pref = perfilState.profile.preferences[Number(toggle.dataset.pref)];
    pref.on = !pref.on;
    toggle.setAttribute("aria-checked", String(pref.on));
  });
}

document.addEventListener("DOMContentLoaded", initPerfil);
