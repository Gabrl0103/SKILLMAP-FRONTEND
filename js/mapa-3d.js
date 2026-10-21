// Vista 3D del Mapa Visual, alternativa a la 2D (que sigue siendo la de siempre y la vista por defecto). Las mismas
// habilidades sobre un piso con la posición del layout 2D (layoutGraph) y la demanda como altura: más demanda, más
// cerca del cenit. Cada nodo baja al piso con un tallo punteado, como un pin. Usa three.js (vendor/three), que se
// importa la primera vez que se elige 3D. Nombres, categorías y los anillos de selección y de foco son HTML sobre el
// canvas, para que se lean con la fuente de la app. La escena se libera entera al volver a 2D, al salir de la vista o
// al redibujar el mapa (closeMapa3d), y solo se redibuja cuando algo cambió o hay una animación en curso.
// Usa layoutGraph, mapaSkills, mapaSelectedId, mapaRoute, mapaNodeLabel, selectMapaSkill, syncMapaPressed,
// applyMapaTransform, escapeHtml, clamp y CLICK_SLOP (mapa.js), routeDraw (route-motif.js), SKILL_STATE_CLASS
// (skill-status.js), prefersReducedMotion (theme.js) y t, statusLabel, tSkill y tCategory (i18n.js).

const MAPA_VIEW_KEY = "skillmap.mapa.view"; // "2d" o "3d", solo durante la sesión del navegador (sessionStorage)
const THREE_URL = new URL("vendor/three/three.module.min.js", document.baseURI).href;

const MAPA3D_SPHERE = 34;          // radio de las esferas (unidades = px del layout 2D)
const MAPA3D_FOV = 40;             // campo de visión vertical (grados)
const MAPA3D_YAW = 0;              // vista inicial: el norte del mapa 2D queda al fondo
const MAPA3D_PITCH = 0.85;         // ángulo desde la vertical (0 = desde arriba)
const MAPA3D_PITCH_MIN = 0.15, MAPA3D_PITCH_MAX = 1.45;
const MAPA3D_ZOOM_MIN = 0.45, MAPA3D_ZOOM_MAX = 2.2; // distancia de la cámara respecto a la que encuadra todo
const MAPA3D_ZOOM_STEP = 1.2;
const MAPA3D_ROTATE = 0.006;       // radianes por px arrastrado
const MAPA3D_WHEEL = 0.0015;
const MAPA3D_SPIN = 0.06;          // giro automático (rad/s) hasta la primera interacción
const MAPA3D_ENTRY_MS = 700;
const MAPA3D_DASH = 6;             // largo de trazo y hueco de las líneas punteadas
const MAPA3D_DOT_STEP = 14;        // separación de los puntos de la ruta sugerida
const MAPA3D_GRID = 32;            // separación de la rejilla de puntos del piso
const MAPA3D_FIT = 0.88;           // el encuadre inicial puede recortar un poco las esquinas vacías del mapa
const MAPA3D_LABEL_GAP = 4;
const MAPA3D_LEGEND_SHIFT = 32;    // px que sube el centro de la escena para no quedar bajo la leyenda        // separación mínima entre etiquetas: las que se pisan se ocultan

let mapaViewMode = readMapaViewMode();
let threeRequest = null;  // import() de three.js, compartido entre aperturas
let mapa3d = null;        // escena activa (null en 2D o con la vista cerrada)
let mapa3dOpenToken = 0;  // descarta una apertura que terminó después de volver a 2D

function readMapaViewMode() {
  try { return sessionStorage.getItem(MAPA_VIEW_KEY) === "3d" ? "3d" : "2d"; } catch { return "2d"; }
}

function saveMapaViewMode(mode) {
  try { sessionStorage.setItem(MAPA_VIEW_KEY, mode); } catch { /* sin storage: se recuerda hasta recargar */ }
}

// three.js r170 necesita WebGL 2. Se prueba con un contexto aparte que se suelta en seguida, antes de crear el
// renderer: así la falta de WebGL no deja errores en la consola.
function mapa3dSupported() {
  try {
    if (typeof WebGL2RenderingContext === "undefined") return false;
    const gl = document.createElement("canvas").getContext("webgl2");
    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function loadThree() {
  threeRequest ??= import(THREE_URL).catch(err => { threeRequest = null; throw err; });
  return threeRequest;
}

// ---------- Marcado (lo inserta renderMapa) ----------

function renderMapaViewToggle() {
  const option = mode => `<button type="button" data-map-view="${mode}" aria-pressed="${mapaViewMode === mode}"
    aria-label="${t(`mapa.view.${mode}Label`)}">${t(`mapa.view.${mode}`)}</button>`;
  return `
    <div class="mapa-view-toggle" role="group" aria-label="${t("mapa.view.group")}">${option("2d")}${option("3d")}</div>
    <p class="mapa-view-notice" id="mapa-view-notice" role="status"></p>`;
}

function renderMapa3dShell() {
  const button = (action, label, path) => `<button type="button" data-zoom3d="${action}" aria-label="${label}">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg></button>`;
  return `
    <div class="mapa-3d" id="mapa-3d" hidden>
      <div class="mapa-3d-scene" id="mapa-3d-scene"></div>
      <div class="mapa-3d-overlay" id="mapa-3d-overlay" aria-hidden="true"></div>
      <div class="mapa-controls" role="group" aria-label="${t("mapa3d.controls")}">
        ${button("in", t("mapa.zoomIn"), `<path d="M12 5v14M5 12h14"/>`)}
        ${button("out", t("mapa.zoomOut"), `<path d="M5 12h14"/>`)}
        ${button("reset", t("mapa3d.reset"), `<path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/>`)}
      </div>
      <div class="mapa-legend">
        <span><i class="mapa-dot mapa-dot--mastered"></i>${statusLabel("MASTERED")}</span>
        <span><i class="mapa-dot mapa-dot--progress"></i>${statusLabel("IN_PROGRESS")}</span>
        <span><i class="mapa-dot mapa-dot--pending"></i>${statusLabel("PENDING")}</span>
        <span id="mapa-3d-legend-route" hidden><i class="mapa-key-route"></i>${t("mapa.route")}</span>
        <span><i class="mapa-key-height"></i>${t("mapa3d.height")}</span>
      </div>
    </div>
    <details class="mapa-3d-list" id="mapa-3d-list" hidden>
      <summary>${t("mapa3d.list")}</summary>
      <table>
        <caption class="sr-only">${t("mapa3d.list.caption")}</caption>
        <thead><tr><th scope="col">${t("mapa3d.col.skill")}</th><th scope="col">${t("mapa3d.col.category")}</th>
          <th scope="col">${t("mapa3d.col.status")}</th><th scope="col">${t("mapa3d.col.demand")}</th><th scope="col">${t("mapa3d.col.route")}</th></tr></thead>
        <tbody id="mapa-3d-list-body"></tbody>
      </table>
    </details>`;
}

// Lista accesible con lo mismo que muestra el canvas; el nombre es un botón que selecciona la habilidad
function renderMapa3dList() {
  const body = document.getElementById("mapa-3d-list-body");
  if (!body) return;
  const { gapIds } = mapaRoute;
  body.innerHTML = layoutGraph(mapaSkills).nodes.map(({ skill, category }) => {
    const gap = gapIds.indexOf(skill.id);
    const route = gap >= 0 ? t("mapa3d.route.stop", { n: gap + 1, total: gapIds.length }) : t("mapa3d.route.none");
    return `<tr>
      <th scope="row"><button type="button" data-select-skill="${skill.id}" aria-pressed="${skill.id === mapaSelectedId}">${escapeHtml(tSkill(skill.name))}</button></th>
      <td>${escapeHtml(tCategory(category))}</td>
      <td><span class="mapa-chip mapa-chip--${SKILL_STATE_CLASS[skill.status] || "pending"}">${statusLabel(skill.status)}</span></td>
      <td>${skill.demandPercentage}%</td>
      <td>${route}</td>
    </tr>`;
  }).join("");
}

// ---------- Cambio 2D / 3D ----------

function setMapaViewUi(mode) {
  document.getElementById("mapa-viewport").hidden = mode === "3d";
  document.getElementById("mapa-3d").hidden = mode !== "3d";
  document.getElementById("mapa-3d-list").hidden = mode !== "3d";
  document.querySelectorAll("[data-map-view]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mapView === mode)));
}

function setMapaViewNotice(key) {
  const notice = document.getElementById("mapa-view-notice");
  if (notice) notice.textContent = key ? t(key) : "";
}

// quiet: al abrir la vista o redibujar el mapa no se anuncia el cambio
async function setMapaView(mode, { quiet = false } = {}) {
  if (!document.getElementById("mapa-3d")) return;
  setMapaViewNotice(null);
  if (mode === "3d" && !mapa3dSupported()) {
    setMapaViewNotice("mapa3d.fallback");
    mode = "2d";
  }
  mapaViewMode = mode;
  saveMapaViewMode(mode);
  setMapaViewUi(mode);
  if (mode === "2d") {
    closeMapa3d();
    syncMapaPressed(mapaSelectedId);
    applyMapaTransform();
  } else {
    renderMapa3dList();
    await openMapa3d();
  }
  if (!quiet && mapaViewMode === mode) document.getElementById("mapa-live").textContent = t(`mapa.view.on${mode}`);
}

// Al abrir la vista Mapa o después de redibujarlo: vuelve a la vista que se eligió en esta sesión
function applyMapaViewMode() {
  if (mapaViewMode !== "3d" || mapa3d || !document.getElementById("mapa-3d")) return;
  if (document.getElementById("view-mapa").classList.contains("hidden")) return;
  setMapaView("3d", { quiet: true });
}

async function openMapa3d() {
  const token = ++mapa3dOpenToken;
  const scene = document.getElementById("mapa-3d-scene");
  scene.innerHTML = `<p class="route-state mapa-3d-loading">${routeDraw({ loop: true })}${t("mapa3d.loading")}</p>`;
  try {
    const THREE = await loadThree();
    if (token !== mapa3dOpenToken || !scene.isConnected) return; // se volvió a 2D o se redibujó mientras cargaba
    scene.innerHTML = "";
    mapa3d = createMapa3d(THREE, scene);
  } catch {
    if (token !== mapa3dOpenToken) return;
    closeMapa3d();
    scene.innerHTML = "";
    mapaViewMode = "2d";
    saveMapaViewMode("2d");
    setMapaViewUi("2d");
    setMapaViewNotice("mapa3d.error");
    syncMapaPressed(mapaSelectedId);
    applyMapaTransform();
  }
}

// Libera todo lo de la GPU (geometrías, materiales, texturas y el contexto WebGL) y quita los listeners
function closeMapa3d() {
  mapa3dOpenToken++;
  const m = mapa3d;
  mapa3d = null;
  if (!m) return;
  cancelAnimationFrame(m.raf);
  m.controller.abort();
  m.observer.disconnect();
  // Materiales aparte del recorrido: alguno puede no estar en la escena (sin ruta, ninguna habilidad en ese estado)
  const materials = new Set(Object.values(m.mats));
  m.scene.traverse(object => {
    object.geometry?.dispose();
    [].concat(object.material || []).forEach(material => materials.add(material));
  });
  materials.forEach(material => { material.map?.dispose(); material.dispose(); });
  m.renderer.dispose();
  m.renderer.forceContextLoss();
  m.canvas.remove();
  m.overlay.textContent = "";
}

// ---------- Colores del tema ----------

// Colores de los tokens (styles.css) del tema vigente. Los rellenos de estado son degradados: se toman sus dos colores.
function readMapa3dTheme(host) {
  const css = getComputedStyle(document.documentElement);
  const probe = document.createElement("span");
  host.append(probe);
  const color = token => {
    probe.style.color = `var(${token})`;
    const [r = 0, g = 0, b = 0, a = 1] = (getComputedStyle(probe).color.match(/[\d.]+/g) || []).map(Number);
    return { r: r / 255, g: g / 255, b: b / 255, a };
  };
  const stops = (token, fallback) => css.getPropertyValue(token).match(/#[0-9a-f]{3,8}\b|rgba?\([^)]*\)/gi) || fallback;
  const theme = {
    bg: color("--surface-solid"),
    link: color("--map-link"),
    route: color("--map-route"),
    pending: color("--line-dashed"),
    dot: color("--map-dot"),
    mastered: stops("--mastered-bg", ["#7EE8C4", "#3FBF93"]),
    progress: stops("--progress-bg", ["#BE3A72", "#6D28D9"]),
  };
  probe.remove();
  return theme;
}

// Degradado vertical para las esferas (de arriba hacia abajo, como el 135deg de los nodos 2D)
function mapa3dGradient(THREE, [from, to = from]) {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, from);
  gradient.addColorStop(1, to);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 4, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Punto redondo para los Points (ruta sugerida y rejilla del piso)
function mapa3dDotTexture(THREE) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fill();
  return new THREE.CanvasTexture(canvas);
}

function setMapa3dColor(THREE, target, { r, g, b }) {
  target.setRGB(r, g, b, THREE.SRGBColorSpace);
}

function applyMapa3dTheme(m) {
  const { THREE, mats } = m;
  const theme = readMapa3dTheme(m.host);
  setMapa3dColor(THREE, m.bg, theme.bg);
  m.renderer.setClearColor(m.bg, 1);
  m.scene.fog.color.copy(m.bg);
  for (const [key, stops] of [["mastered", theme.mastered], ["progress", theme.progress]]) {
    mats[key].map?.dispose();
    mats[key].map = mapa3dGradient(THREE, stops);
    mats[key].needsUpdate = true;
  }
  setMapa3dColor(THREE, mats.pending.color, theme.pending);
  setMapa3dColor(THREE, mats.ring.color, theme.pending);
  setMapa3dColor(THREE, mats.link.color, theme.link);
  // En oscuro --map-link es blanco translúcido: el alfa del token pasa a la opacidad (reforzada, como en 2D se ve sobre el fondo)
  mats.link.opacity = Math.min(1, theme.link.a * 2);
  setMapa3dColor(THREE, mats.stem.color, theme.pending);
  setMapa3dColor(THREE, mats.route.color, theme.route);
  setMapa3dColor(THREE, mats.ground.color, theme.dot);
  // --map-dot es casi transparente: se refuerza un poco porque en perspectiva los puntos se ven más chicos
  mats.ground.opacity = Math.min(1, theme.dot.a * 2.5);
  invalidateMapa3d(m);
}

// ---------- Escena ----------

// Si algo falla a mitad de armar la escena, se suelta el contexto WebGL antes de avisar (openMapa3d vuelve a 2D)
function createMapa3d(THREE, host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
  try {
    return buildMapa3d(THREE, host, renderer);
  } catch (err) {
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
    document.getElementById("mapa-3d-overlay").textContent = "";
    throw err;
  }
}

function buildMapa3d(THREE, host, renderer) {
  const { nodes: layout, links, labels, width, height } = layoutGraph(mapaSkills);
  const demands = layout.map(n => n.skill.demandPercentage);
  const minDemand = Math.min(...demands), maxDemand = Math.max(...demands);
  const lift = clamp(Math.max(width, height) * 0.3, 160, 400);
  const base = MAPA3D_SPHERE + 16;
  const heightOf = pct => base + (maxDemand > minDemand ? (pct - minDemand) / (maxDemand - minDemand) : 0.5) * lift;
  const toWorld = (x, y, h = 0) => new THREE.Vector3(x - width / 2, h, y - height / 2);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.className = "mapa-3d-canvas";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", t("mapa3d.canvas", { n: layout.length }));
  host.append(canvas);

  const scene = new THREE.Scene();
  const bg = new THREE.Color();
  scene.fog = new THREE.Fog(bg, 1, 2);
  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0x8A8596, 2.4));
  const sun = new THREE.DirectionalLight(0xFFFFFF, 1.2);
  sun.position.set(300, 800, 500);
  scene.add(sun);

  const dotTexture = mapa3dDotTexture(THREE);
  const dashed = () => new THREE.LineDashedMaterial({ dashSize: MAPA3D_DASH, gapSize: MAPA3D_DASH, transparent: true });
  const mats = {
    mastered: new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0 }),
    progress: new THREE.MeshStandardMaterial({ roughness: 0.55, metalness: 0 }),
    pending: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.14, depthWrite: false }),
    ring: dashed(),
    link: dashed(),
    stem: dashed(),
    route: new THREE.PointsMaterial({ size: 12, map: dotTexture, alphaTest: 0.5 }),
    ground: new THREE.PointsMaterial({ size: 4, map: dotTexture.clone(), transparent: true, depthWrite: false }),
  };
  mats.stem.opacity = 0.6;

  const sphereGeometry = new THREE.SphereGeometry(MAPA3D_SPHERE, 32, 16);
  const ringGeometry = new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 64 }, (_, i) => {
      const a = (i / 64) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(a) * (MAPA3D_SPHERE + 2), Math.sin(a) * (MAPA3D_SPHERE + 2), 0);
    }));

  const overlay = document.getElementById("mapa-3d-overlay");
  overlay.textContent = "";
  const spheres = [];
  const rings = [];
  const nodes = layout.map(({ skill, category, x, y }, index) => {
    const pos = toWorld(x, y, heightOf(skill.demandPercentage));
    const group = new THREE.Group();
    group.position.copy(pos);
    const mesh = new THREE.Mesh(sphereGeometry, mats.pending);
    mesh.userData.index = index;
    const ring = new THREE.LineLoop(ringGeometry, mats.ring);
    ring.computeLineDistances();
    group.add(mesh, ring);
    scene.add(group);
    spheres.push(mesh);
    rings.push(ring);
    const label = document.createElement("span");
    label.className = "mapa-3d-label";
    label.textContent = tSkill(skill.name);
    overlay.append(label);
    return { id: skill.id, category, pos, mesh, ring, label, screen: null };
  });
  const byId = new Map(nodes.map(n => [n.id, n]));
  // Tamaño de cada etiqueta, medido una vez (el texto no cambia; al cambiar de idioma se rearma la escena)
  nodes.forEach(n => { n.w = n.label.offsetWidth; n.h = n.label.offsetHeight; });

  // Tallos punteados de cada esfera hasta el piso y aristas entre vecinos de la misma categoría
  const segments = (pairs, material) => {
    const geometry = new THREE.BufferGeometry().setFromPoints(pairs.flat());
    const lines = new THREE.LineSegments(geometry, material);
    lines.computeLineDistances();
    scene.add(lines);
  };
  segments(nodes.map(n => [new THREE.Vector3(n.pos.x, 0, n.pos.z), new THREE.Vector3(n.pos.x, n.pos.y - MAPA3D_SPHERE, n.pos.z)]), mats.stem);
  const index = new Map(layout.map((n, i) => [n, i]));
  if (links.length) segments(links.map(([a, b]) => [nodes[index.get(a)].pos, nodes[index.get(b)].pos]), mats.link);

  // Piso: la rejilla de puntos de la tarjeta 2D, en perspectiva
  const grid = [];
  for (let x = -width / 2 - 64; x <= width / 2 + 64; x += MAPA3D_GRID) {
    for (let z = -height / 2 - 64; z <= height / 2 + 64; z += MAPA3D_GRID) grid.push(new THREE.Vector3(x, 0, z));
  }
  scene.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(grid), mats.ground));

  // Etiquetas de categoría en el piso, en el mismo lugar que en 2D
  const clusters = labels.map(label => {
    const el = document.createElement("span");
    el.className = "mapa-3d-cluster";
    el.textContent = label.category;
    overlay.append(el);
    return { pos: toWorld(label.x, label.y), el, w: el.offsetWidth, h: el.offsetHeight };
  });

  const selectRing = document.createElement("span");
  selectRing.className = "mapa-3d-ring";
  const focusRing = document.createElement("span");
  focusRing.className = "mapa-3d-focus";
  overlay.append(selectRing, focusRing);

  const target = new THREE.Vector3(0, base + lift * 0.35, 0);
  const reach = Math.max(...nodes.map(n => n.pos.distanceTo(target))) + MAPA3D_SPHERE + 24;
  const camera = new THREE.PerspectiveCamera(MAPA3D_FOV, 1, 1, 10000);

  const m = {
    THREE, host, canvas, renderer, scene, camera, bg, mats, nodes, byId, spheres, rings, clusters, selectRing, focusRing,
    overlay, reach, size: { w: 1, h: 1 }, fit: 1,
    view: { yaw: MAPA3D_YAW, pitch: MAPA3D_PITCH, dist: 1, target },
    route: null, tween: null, vel: null, drag: null, interacted: false, focusIndex: -1,
    raf: 0, last: 0, frames: 0, tmp: new THREE.Vector3(), raycaster: new THREE.Raycaster(),
    controller: new AbortController(), observer: null,
  };

  nodes.forEach((n, i) => setMapa3dNodeStatus(m, n, mapaSkills.find(s => s.id === layout[i].skill.id)));
  applyMapa3dTheme(m);
  resizeMapa3d(m);
  m.view.dist = m.fit;
  if (!prefersReducedMotion()) {
    m.tween = { from: { dist: m.fit * 1.35 }, to: { dist: m.fit }, start: performance.now(), ms: MAPA3D_ENTRY_MS };
    m.view.dist = m.fit * 1.35;
  }
  setMapa3dRoute(m, mapaRoute.gapIds);
  bindMapa3dEvents(m);
  m.observer = new ResizeObserver(() => resizeMapa3d(m));
  m.observer.observe(host);
  invalidateMapa3d(m);
  return m;
}

function setMapa3dNodeStatus(m, node, skill) {
  const status = SKILL_STATE_CLASS[skill?.status] || "pending";
  node.mesh.material = status === "mastered" ? m.mats.mastered : status === "progress" ? m.mats.progress : m.mats.pending;
  node.ring.visible = status === "pending";
}

// Ruta sugerida: puntos del Motivo de Ruta entre los centros de las brechas, en orden de demanda
function setMapa3dRoute(m, gapIds) {
  const { THREE } = m;
  if (m.route) {
    m.scene.remove(m.route);
    m.route.geometry.dispose();
    m.route = null;
  }
  const stops = gapIds.map(id => m.byId.get(id)).filter(Boolean).map(n => n.pos);
  document.getElementById("mapa-3d-legend-route").hidden = stops.length < 2;
  if (stops.length < 2) return invalidateMapa3d(m);
  const dots = [];
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1], b = stops[i];
    const length = a.distanceTo(b);
    for (let d = MAPA3D_SPHERE + 6; d <= length - MAPA3D_SPHERE - 6; d += MAPA3D_DOT_STEP) {
      dots.push(new THREE.Vector3().lerpVectors(a, b, d / length));
    }
  }
  m.route = new THREE.Points(new THREE.BufferGeometry().setFromPoints(dots), m.mats.route);
  m.scene.add(m.route);
  invalidateMapa3d(m);
}

// Encuadre: distancia a la que todo el mapa cabe en el canvas con el campo de visión más estrecho
function resizeMapa3d(m) {
  const w = m.host.clientWidth, h = m.host.clientHeight;
  if (!w || !h) return;
  m.size = { w, h };
  m.renderer.setSize(w, h);
  m.camera.aspect = w / h;
  // El centro de la escena sube un poco: abajo está la leyenda
  m.camera.setViewOffset(w, h, 0, MAPA3D_LEGEND_SHIFT, w, h);
  m.camera.updateProjectionMatrix();
  const vFov = (MAPA3D_FOV * Math.PI) / 180;
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * m.camera.aspect);
  const fit = (m.reach / Math.sin(Math.min(vFov, hFov) / 2)) * MAPA3D_FIT;
  m.view.dist *= fit / m.fit;
  m.fit = fit;
  invalidateMapa3d(m);
}

// ---------- Bucle ----------

// Solo se pide un cuadro cuando algo cambió; con animación (entrada, inercia, giro automático) se encadenan. Con la
// pestaña oculta no se pide ninguno y al volver se retoma (visibilitychange).
function invalidateMapa3d(m) {
  if (!m.raf && !document.hidden && m.canvas.isConnected) m.raf = requestAnimationFrame(now => frameMapa3d(m, now));
}

function frameMapa3d(m, now) {
  m.raf = 0;
  if (mapa3d !== m || document.hidden) { m.last = 0; return; }
  const dt = m.last ? Math.min(0.05, (now - m.last) / 1000) : 0;
  m.last = now;
  const animating = stepMapa3d(m, dt, now);
  renderMapa3d(m);
  m.frames++;
  if (animating) invalidateMapa3d(m);
  else m.last = 0;
}

function stopMapa3dMotion(m) {
  m.interacted = true;
  m.vel = null;
  m.tween = null;
}

function stepMapa3d(m, dt, now) {
  const reduced = prefersReducedMotion();
  const { view } = m;
  let animating = false;
  if (m.tween) {
    const k = reduced ? 1 : Math.min(1, (now - m.tween.start) / m.tween.ms);
    const eased = 1 - Math.pow(1 - k, 3);
    for (const key in m.tween.to) view[key] = m.tween.from[key] + (m.tween.to[key] - m.tween.from[key]) * eased;
    if (k >= 1) m.tween = null;
    else animating = true;
  }
  if (m.vel && !reduced && !m.drag) {
    view.yaw += m.vel.yaw * dt * 60;
    view.pitch += m.vel.pitch * dt * 60;
    const decay = Math.exp(-dt * 5);
    m.vel = { yaw: m.vel.yaw * decay, pitch: m.vel.pitch * decay };
    if (Math.abs(m.vel.yaw) + Math.abs(m.vel.pitch) < 1e-4) m.vel = null;
    else animating = true;
  } else if (reduced) {
    m.vel = null;
  }
  if (!reduced && !m.interacted && document.activeElement !== m.canvas) {
    view.yaw += MAPA3D_SPIN * dt;
    animating = true;
  }
  view.pitch = clamp(view.pitch, MAPA3D_PITCH_MIN, MAPA3D_PITCH_MAX);
  view.dist = clamp(view.dist, m.fit * MAPA3D_ZOOM_MIN, m.fit * MAPA3D_ZOOM_MAX);
  return animating;
}

function renderMapa3d(m) {
  const { camera, view } = m;
  const s = Math.sin(view.pitch);
  camera.position.set(view.target.x + view.dist * s * Math.sin(view.yaw), view.target.y + view.dist * Math.cos(view.pitch),
    view.target.z + view.dist * s * Math.cos(view.yaw));
  camera.lookAt(view.target);
  camera.updateMatrixWorld();
  m.scene.fog.near = view.dist * 0.9;
  m.scene.fog.far = view.dist + m.reach * 2.4;
  m.rings.forEach(ring => ring.quaternion.copy(camera.quaternion));
  m.renderer.render(m.scene, camera);
  renderMapa3dOverlay(m);
  syncMapa3dZoomButtons(m);
}

// Proyecta cada nodo a px del canvas: centro, radio en pantalla y si queda delante de la cámara
function projectMapa3d(m, pos) {
  const { camera, tmp, size } = m;
  tmp.copy(pos).applyMatrix4(camera.matrixWorldInverse);
  const depth = -tmp.z;
  tmp.copy(pos).project(camera);
  const focal = size.h / (2 * Math.tan((MAPA3D_FOV * Math.PI) / 360));
  return { x: ((tmp.x + 1) / 2) * size.w, y: ((1 - tmp.y) / 2) * size.h, r: (MAPA3D_SPHERE * focal) / depth, depth,
    visible: depth > 0 && tmp.z < 1 };
}

function placeMapa3dRing(ring, screen, pad) {
  ring.hidden = !screen?.visible;
  if (ring.hidden) return;
  const d = 2 * (screen.r + pad);
  ring.style.transform = `translate(${screen.x - d / 2}px, ${screen.y - d / 2}px)`;
  ring.style.width = ring.style.height = `${d}px`;
}

// Etiquetas sin encimarse: primero la seleccionada y la enfocada, después de la más cercana a la más lejana y al final
// las categorías; la que choca con una ya puesta se oculta (la lista accesible tiene todos los nombres).
function renderMapa3dOverlay(m) {
  const focused = document.activeElement === m.canvas && m.canvas.matches(":focus-visible") ? m.nodes[m.focusIndex] : null;
  const selected = m.byId.get(mapaSelectedId);
  const placed = [];
  const place = (el, box) => {
    const free = !placed.some(b => box.left < b.right && box.right > b.left && box.top < b.bottom && box.bottom > b.top);
    el.hidden = !free;
    if (free) placed.push({ left: box.left - MAPA3D_LABEL_GAP, right: box.right + MAPA3D_LABEL_GAP, top: box.top - MAPA3D_LABEL_GAP, bottom: box.bottom + MAPA3D_LABEL_GAP });
    return free;
  };
  m.nodes.forEach(n => { n.screen = projectMapa3d(m, n.pos); });
  const rank = n => (n === selected ? -2 : n === focused ? -1 : n.screen.depth);
  const order = m.nodes.filter(n => n.screen.visible).sort((a, b) => rank(a) - rank(b));
  m.nodes.forEach(n => { if (!n.screen.visible) n.label.hidden = true; });
  for (const n of order) {
    const x = n.screen.x, y = n.screen.y + n.screen.r + 6;
    if (!place(n.label, { left: x - n.w / 2, right: x + n.w / 2, top: y, bottom: y + n.h })) continue;
    n.label.style.transform = `translate(${x}px, ${y}px) translate(-50%, 0)`;
    n.label.style.zIndex = String(Math.max(1, Math.round(100000 - n.screen.depth)));
  }
  for (const c of m.clusters) {
    const screen = projectMapa3d(m, c.pos);
    if (!screen.visible) { c.el.hidden = true; continue; }
    if (place(c.el, { left: screen.x - c.w / 2, right: screen.x + c.w / 2, top: screen.y - c.h / 2, bottom: screen.y + c.h / 2 })) {
      c.el.style.transform = `translate(${screen.x}px, ${screen.y}px) translate(-50%, -50%)`;
    }
  }
  placeMapa3dRing(m.selectRing, selected?.screen, 6);
  placeMapa3dRing(m.focusRing, focused?.screen, 12);
}

function syncMapa3dZoomButtons(m) {
  const controls = document.querySelector("#mapa-3d .mapa-controls");
  if (!controls) return;
  controls.querySelector('[data-zoom3d="in"]').disabled = m.view.dist <= m.fit * MAPA3D_ZOOM_MIN + 1e-6;
  controls.querySelector('[data-zoom3d="out"]').disabled = m.view.dist >= m.fit * MAPA3D_ZOOM_MAX - 1e-6;
}

// ---------- Interacción ----------

function zoomMapa3d(m, factor) {
  m.view.dist = clamp(m.view.dist * factor, m.fit * MAPA3D_ZOOM_MIN, m.fit * MAPA3D_ZOOM_MAX);
  invalidateMapa3d(m);
}

function resetMapa3dView(m) {
  stopMapa3dMotion(m);
  const to = { yaw: MAPA3D_YAW, pitch: MAPA3D_PITCH, dist: m.fit };
  // El giro vuelve por el camino más corto
  const yaw = ((m.view.yaw - MAPA3D_YAW + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI + MAPA3D_YAW;
  if (prefersReducedMotion()) Object.assign(m.view, to);
  else m.tween = { from: { yaw, pitch: m.view.pitch, dist: m.view.dist }, to, start: performance.now(), ms: MAPA3D_ENTRY_MS };
  invalidateMapa3d(m);
}

function pickMapa3d(m, clientX, clientY) {
  const rect = m.canvas.getBoundingClientRect();
  const ndc = new m.THREE.Vector2(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
  m.raycaster.setFromCamera(ndc, m.camera);
  const hit = m.raycaster.intersectObjects(m.spheres, false)[0];
  return hit ? m.nodes[hit.object.userData.index] : null;
}

// Foco con teclado en un nodo: se anuncia y, si quedó fuera del canvas por el zoom, vuelve el encuadre completo
function focusMapa3dNode(m, index) {
  m.focusIndex = (index + m.nodes.length) % m.nodes.length;
  const node = m.nodes[m.focusIndex];
  const skill = mapaSkills.find(s => s.id === node.id);
  if (skill) document.getElementById("mapa-live").textContent = mapaNodeLabel(skill, node.category);
  const { x, y, visible } = node.screen || {};
  if (!visible || x < 0 || y < 0 || x > m.size.w || y > m.size.h) m.view.dist = m.fit;
  invalidateMapa3d(m);
}

function bindMapa3dEvents(m) {
  const { canvas } = m;
  const signal = m.controller.signal;
  const pointers = new Map();

  canvas.addEventListener("pointerdown", e => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* puntero que ya no está activo: se sigue sin captura */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) m.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: false };
    else if (m.drag) m.drag.moved = true; // segundo dedo: pellizco, no clic
    stopMapa3dMotion(m);
  }, { signal });

  canvas.addEventListener("pointermove", e => {
    const point = pointers.get(e.pointerId);
    if (!point) {
      if (e.pointerType === "mouse") canvas.style.cursor = pickMapa3d(m, e.clientX, e.clientY) ? "pointer" : "";
      return;
    }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const before = Math.hypot(a.x - b.x, a.y - b.y);
      Object.assign(point, { x: e.clientX, y: e.clientY });
      const after = Math.hypot(a.x - b.x, a.y - b.y);
      if (before > 0 && after > 0) zoomMapa3d(m, before / after);
      return;
    }
    const dx = e.clientX - point.x, dy = e.clientY - point.y;
    Object.assign(point, { x: e.clientX, y: e.clientY });
    if (!m.drag || e.pointerId !== m.drag.id) return;
    if (!m.drag.moved && Math.hypot(e.clientX - m.drag.x, e.clientY - m.drag.y) < CLICK_SLOP) return;
    m.drag.moved = true;
    canvas.classList.add("is-dragging");
    m.view.yaw -= dx * MAPA3D_ROTATE;
    m.view.pitch = clamp(m.view.pitch - dy * MAPA3D_ROTATE, MAPA3D_PITCH_MIN, MAPA3D_PITCH_MAX);
    m.vel = { yaw: -dx * MAPA3D_ROTATE, pitch: -dy * MAPA3D_ROTATE };
    invalidateMapa3d(m);
  }, { signal });

  const endPointer = e => {
    if (!pointers.delete(e.pointerId)) return;
    if (!m.drag || e.pointerId !== m.drag.id) return;
    const { moved } = m.drag;
    m.drag = null;
    canvas.classList.remove("is-dragging");
    if (e.type === "pointerup" && !moved) {
      m.vel = null;
      const node = pickMapa3d(m, e.clientX, e.clientY);
      if (node) {
        m.focusIndex = m.nodes.indexOf(node);
        selectMapaSkill(node.id);
      }
    }
    invalidateMapa3d(m); // inercia (si no hay animaciones reducidas)
  };
  canvas.addEventListener("pointerup", endPointer, { signal });
  canvas.addEventListener("pointercancel", endPointer, { signal });
  canvas.addEventListener("lostpointercapture", endPointer, { signal });

  canvas.addEventListener("wheel", e => {
    e.preventDefault();
    stopMapa3dMotion(m);
    const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomMapa3d(m, Math.exp(delta * MAPA3D_WHEEL));
  }, { passive: false, signal });

  // Flechas, Inicio y Fin recorren los nodos; Tab también, hasta el último (después sale del canvas, no lo atrapa).
  // Enter o Espacio seleccionan y Esc quita la selección.
  canvas.addEventListener("keydown", e => {
    const i = m.focusIndex;
    const last = m.nodes.length - 1;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (m.nodes[i]) selectMapaSkill(m.nodes[i].id);
      return;
    }
    if (e.key === "Escape") {
      if (mapaSelectedId === null) return;
      e.preventDefault();
      selectMapaSkill(null);
      return;
    }
    if (e.key === "Tab") {
      if (e.shiftKey ? i <= 0 : i >= last) return;
      e.preventDefault();
      focusMapa3dNode(m, i + (e.shiftKey ? -1 : 1));
      return;
    }
    const next = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: last }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    stopMapa3dMotion(m);
    focusMapa3dNode(m, next);
  }, { signal });

  // Al entrar con Tab empieza por la habilidad seleccionada (o la primera); con Mayús+Tab, por la última
  canvas.addEventListener("focus", e => {
    stopMapa3dMotion(m);
    const selected = m.nodes.findIndex(n => n.id === mapaSelectedId);
    const fromAfter = e.relatedTarget && (canvas.compareDocumentPosition(e.relatedTarget) & Node.DOCUMENT_POSITION_FOLLOWING);
    if (canvas.matches(":focus-visible")) focusMapa3dNode(m, selected >= 0 ? selected : fromAfter ? m.nodes.length - 1 : 0);
  }, { signal });
  canvas.addEventListener("blur", () => invalidateMapa3d(m), { signal });

  document.addEventListener("visibilitychange", () => invalidateMapa3d(m), { signal });
  // Tema o "Reducir animaciones" cambiaron (theme.js)
  document.addEventListener("skillmap:settings", () => applyMapa3dTheme(m), { signal });
}

// ---------- Avisos desde mapa.js ----------

function updateMapa3dSkill(skill) {
  if (mapa3d) {
    const node = mapa3d.byId.get(skill.id);
    if (node) setMapa3dNodeStatus(mapa3d, node, skill);
    invalidateMapa3d(mapa3d);
  }
  renderMapa3dList();
}

function updateMapa3dRoute() {
  if (mapa3d) setMapa3dRoute(mapa3d, mapaRoute.gapIds);
  renderMapa3dList();
}

function syncMapa3dSelection() {
  if (mapa3d) invalidateMapa3d(mapa3d);
  document.querySelectorAll("#mapa-3d-list [data-select-skill]").forEach(b =>
    b.setAttribute("aria-pressed", String(Number(b.dataset.selectSkill) === mapaSelectedId)));
}

// Interruptor 2D / 3D, controles de la vista 3D y botones de la lista: un listener en el contenedor (se redibuja)
document.getElementById("mapa-content").addEventListener("click", e => {
  const view = e.target.closest("[data-map-view]");
  if (view) {
    if (view.dataset.mapView !== mapaViewMode) setMapaView(view.dataset.mapView);
    return;
  }
  const zoom = e.target.closest("[data-zoom3d]");
  if (zoom && mapa3d) {
    stopMapa3dMotion(mapa3d);
    if (zoom.dataset.zoom3d === "reset") resetMapa3dView(mapa3d);
    else zoomMapa3d(mapa3d, zoom.dataset.zoom3d === "in" ? 1 / MAPA3D_ZOOM_STEP : MAPA3D_ZOOM_STEP);
    return;
  }
  const select = e.target.closest("[data-select-skill]");
  if (select) selectMapaSkill(Number(select.dataset.selectSkill));
});
