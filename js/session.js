// Sesión del usuario y única puerta a la API (apiFetch). Se carga al final: arranca la app cuando los demás scripts
// ya registraron sus vistas.
// - El token vive en localStorage ("skillmap.session") y viaja como "Authorization: Bearer" en todas las llamadas.
// - Un 401 con la app abierta borra la sesión y lleva a Acceso con el aviso "Tu sesión terminó".
// - Al arrancar: con token se valida con GET /api/auth/me; si vale, se abre Mi Ruta. Sin sesión válida se muestra la
//   Introducción (intro.js) y de ahí se pasa a Acceso (acceso.js). ?intro=1 abre la intro igual.
// Evento "skillmap:user": entra o sale un usuario. Cada vista vacía sus datos en memoria para no mostrar los de otro.
// Usa API_BASE_URL y loadRuta (dashboard.js), loadSettings (theme.js), openIntro e INTRO_FORCED (intro.js),
// openAcceso (acceso.js), showView (mapa.js) y t, i18nError y errorText (i18n.js).

const SESSION_KEY = "skillmap.session";  // misma clave que el script del <head>
const SESSION_CHECK_TIMEOUT = 2500;      // sin respuesta de /api/auth/me en este tiempo, se sigue como sin sesión

let sessionUser = null; // { id, name, email, headline } mientras hay una sesión válida y la app está abierta (perfil.js lo actualiza al editar)

function readSessionToken() {
  try { return localStorage.getItem(SESSION_KEY); } catch { return null; }
}

function storeSessionToken(token) {
  try { localStorage.setItem(SESSION_KEY, token); } catch { /* sin storage: la sesión dura hasta recargar */ }
}

function clearSessionToken() {
  try { localStorage.removeItem(SESSION_KEY); } catch { /* sin storage: no había nada guardado */ }
}

// ---------- API ----------

// Todas las llamadas a la API pasan por aquí. auth: false para registro y login, que no llevan token y cuyo 401
// significa "credenciales incorrectas", no fin de sesión.
async function apiFetch(path, { auth = true, headers = {}, ...options } = {}) {
  const token = auth ? readSessionToken() : null;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
  });
  if (res.status === 401 && auth && sessionUser) endSession();
  return res;
}

// El "message" del backend tal cual llega (en español; errorText lo traduce al mostrarlo) o un error propio con el código
async function apiError(res) {
  const body = await res.json().catch(() => null);
  return body?.message ? new Error(body.message) : i18nError("error.server", { status: res.status });
}

// JSON de una llamada que debe salir bien; si no, Error con el mensaje del backend
async function apiJson(path, options) {
  const res = await apiFetch(path, options);
  if (!res.ok) throw await apiError(res);
  return res.status === 204 ? null : res.json();
}

// fetch falla con TypeError cuando no hay conexión con el backend: se muestra un mensaje en lugar del técnico.
// Los demás, en el idioma actual (errorText).
function friendlyError(err) {
  return err instanceof TypeError ? t("error.offline") : errorText(err);
}

// ---------- Pantallas ----------

// Mientras la intro o Acceso cubren la pantalla, la barra superior y las vistas no reciben foco ni clics
function setAppInert(inert) {
  document.querySelectorAll(".topbar, .app-main").forEach(el => { el.inert = inert; });
}

function notifyUserChange() {
  document.dispatchEvent(new CustomEvent("skillmap:user"));
}

// Entra un usuario (login, registro o sesión guardada válida): ajustes del backend y Mi Ruta con sus datos.
function startSession(user) {
  sessionUser = user;
  notifyUserChange();
  renderUserMenu();
  loadSettings({ fresh: true }).catch(() => { /* sin backend: queda la copia local */ });
  showView("dashboard");
  loadRuta();
  setAppInert(false);
}

// La sesión ya no vale en el backend: 401 con la app abierta (aviso "Tu sesión terminó" y el correo escrito) o cuenta
// eliminada (perfil.js, con su propio aviso y sin correo)
function endSession({ notice = t("session.ended"), keepEmail = true } = {}) {
  const email = keepEmail ? sessionUser?.email || "" : "";
  sessionUser = null;
  clearSessionToken();
  closeUserMenu();
  notifyUserChange();
  openAcceso({ notice, email });
}

// Cerrar sesión: avisa al backend y, responda o no, borra el token y vuelve a la intro
async function logout() {
  if (!sessionUser) return;
  const button = document.getElementById("user-logout");
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.textContent = t("user.loggingOut");
  sessionUser = null; // desde aquí un 401 (p. ej. la sesión ya había caducado) no lleva a Acceso
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch { /* sin backend: la sesión se borra igual en este equipo */ }
  clearSessionToken();
  closeUserMenu({ focusButton: false });
  button.disabled = false;
  button.removeAttribute("aria-busy");
  button.textContent = t("user.logout");
  notifyUserChange();
  openIntro();
}

// ---------- Menú de usuario (barra superior) ----------

const userMenu = {
  button: () => document.getElementById("user-button"),
  popover: () => document.getElementById("user-popover"),
};

function renderUserMenu() {
  if (!sessionUser) return;
  const name = sessionUser.name || sessionUser.email;
  document.querySelector(".user-avatar").textContent = Array.from(name.trim())[0]?.toUpperCase() || "";
  document.querySelector(".user-button [data-user-name]").textContent = name;
  userMenu.button().title = name;
  document.querySelector(".user-popover-name").textContent = name;
  document.querySelector(".user-popover-email").textContent = sessionUser.email;
}

function openUserMenu() {
  userMenu.popover().hidden = false;
  userMenu.button().setAttribute("aria-expanded", "true");
  document.getElementById("user-logout").focus();
}

function closeUserMenu({ focusButton = false } = {}) {
  if (userMenu.popover().hidden) return;
  userMenu.popover().hidden = true;
  userMenu.button().setAttribute("aria-expanded", "false");
  if (focusButton) userMenu.button().focus();
}

function bindUserMenu() {
  userMenu.button().addEventListener("click", () => (userMenu.popover().hidden ? openUserMenu() : closeUserMenu()));
  document.getElementById("user-logout").addEventListener("click", logout);
  userMenu.popover().addEventListener("keydown", e => {
    if (e.key === "Escape") { e.preventDefault(); closeUserMenu({ focusButton: true }); }
  });
  // Clic o foco fuera: se cierra sin robar el foco
  document.addEventListener("pointerdown", e => {
    if (!e.target.closest(".user-menu")) closeUserMenu();
  });
  document.querySelector(".user-menu").addEventListener("focusout", e => {
    if (!e.relatedTarget || !e.relatedTarget.closest(".user-menu")) closeUserMenu();
  });
}

// ---------- Arranque ----------

// Con token guardado se pregunta al backend si sigue valiendo. Un 401 lo borra; sin respuesta se conserva (puede
// valer cuando el backend vuelva) pero se sigue como sin sesión.
async function checkSavedSession() {
  if (!readSessionToken()) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SESSION_CHECK_TIMEOUT);
  try {
    const res = await apiFetch("/api/auth/me", { signal: controller.signal });
    if (res.status === 401) clearSessionToken();
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function bootSession() {
  bindUserMenu();
  const user = await checkSavedSession();
  if (user) startSession(user);
  if (!user || INTRO_FORCED) openIntro();
  else setIntroState(null); // quita el "checking" del <head>: la app ya se puede ver
}

document.addEventListener("DOMContentLoaded", bootSession);
