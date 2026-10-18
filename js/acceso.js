// Pantalla de Acceso: iniciar sesión o crear cuenta (#acceso, a pantalla completa y sin barra superior).
// Usa apiFetch, apiError, friendlyError, storeSessionToken, startSession y setAppInert (session.js) y hideIntro
// (intro.js) y t (i18n.js). La contraseña solo vive en su campo hasta enviar: se limpia al enviar, salga bien o mal, y
// nunca se guarda ni se registra.

const ACCESO_MIN_PASSWORD = 8; // mismo mínimo que el backend (UserFactory)
// Textos en i18n.js: acceso.<modo>.title, .subtitle, .submit y .busy
const ACCESO_MODES = {
  login: { path: "/api/auth/login", emailAutocomplete: "username", passwordAutocomplete: "current-password" },
  register: { path: "/api/auth/register", emailAutocomplete: "email", passwordAutocomplete: "new-password" },
};

const acceso = {
  mode: "login",
  busy: false,
  field: name => document.getElementById(`acceso-${name}`), // name, email, password
};

function setAccesoState(open) {
  if (open) document.documentElement.setAttribute("data-acceso", "open");
  else document.documentElement.removeAttribute("data-acceso");
}

// Error en la región aria-live; el campo afectado queda marcado con aria-invalid
function setAccesoError(text, field = null) {
  document.getElementById("acceso-error").textContent = text;
  ["name", "email", "password"].forEach(name => acceso.field(name).removeAttribute("aria-invalid"));
  if (field) field.setAttribute("aria-invalid", "true");
}

// Ojo de la contraseña: botón de alternancia con nombre fijo (aria-pressed dice si se ve)
function setPasswordVisible(visible) {
  acceso.field("password").type = visible ? "text" : "password";
  document.getElementById("acceso-reveal").setAttribute("aria-pressed", String(visible));
}

function firstAccesoField() {
  return acceso.field(acceso.mode === "register" ? "name" : "email");
}

// Título, subtítulo y botón del modo actual en el idioma actual
function renderAccesoTexts() {
  document.getElementById("acceso-title").textContent = t(`acceso.${acceso.mode}.title`);
  document.getElementById("acceso-subtitle").textContent = t(`acceso.${acceso.mode}.subtitle`);
  document.querySelector("#acceso-submit [data-label]").textContent = t(`acceso.${acceso.mode}.${acceso.busy ? "busy" : "submit"}`);
}

function setAccesoMode(mode) {
  acceso.mode = mode;
  const m = ACCESO_MODES[mode];
  const register = mode === "register";
  document.querySelectorAll("[data-acceso-mode]").forEach(button => {
    button.setAttribute("aria-pressed", String(button.dataset.accesoMode === mode));
  });
  renderAccesoTexts();
  document.getElementById("acceso-name-field").hidden = !register;
  document.getElementById("acceso-password-hint").hidden = !register;
  acceso.field("email").autocomplete = m.emailAutocomplete;
  acceso.field("password").autocomplete = m.passwordAutocomplete;
  acceso.field("password").value = "";
  setPasswordVisible(false);
  setAccesoError("");
}

// Durante el envío los campos quedan de solo lectura (conservan el foco) y el botón avisa de la espera
function setAccesoBusy(busy) {
  acceso.busy = busy;
  const submit = document.getElementById("acceso-submit");
  submit.setAttribute("aria-busy", String(busy));
  submit.setAttribute("aria-disabled", String(busy));
  renderAccesoTexts();
  ["name", "email", "password"].forEach(name => { acceso.field(name).readOnly = busy; });
  document.querySelectorAll("[data-acceso-mode]").forEach(button => { button.disabled = busy; });
}

// Validación mínima antes de enviar (el backend vuelve a validar todo). Devuelve [campo, mensaje] o null.
function accesoInvalid(register) {
  const name = acceso.field("name"), email = acceso.field("email"), password = acceso.field("password");
  if (register && !name.value.trim()) return [name, t("acceso.missingName")];
  if (!email.value.trim()) return [email, t("acceso.missingEmail")];
  if (!password.value) return [password, t("acceso.missingPassword")];
  if (register && Array.from(password.value).length < ACCESO_MIN_PASSWORD) {
    return [password, t("acceso.shortPassword", { min: ACCESO_MIN_PASSWORD })];
  }
  return null;
}

// Campo al que apunta un error del backend (su mensaje original, en español): correo repetido o inválido, nombre
// inválido; si no, la contraseña
function accesoErrorField(status, message) {
  if (status === 409 || (status === 400 && /correo/i.test(message))) return acceso.field("email");
  if (status === 400 && /nombre/i.test(message)) return acceso.field("name");
  return acceso.field("password");
}

async function submitAcceso(e) {
  e.preventDefault();
  if (acceso.busy) return;
  const register = acceso.mode === "register";
  const invalid = accesoInvalid(register);
  if (invalid) {
    setAccesoError(invalid[1], invalid[0]);
    invalid[0].focus();
    return;
  }
  const password = acceso.field("password");
  const body = JSON.stringify({
    ...(register ? { name: acceso.field("name").value.trim() } : {}),
    email: acceso.field("email").value.trim(),
    password: password.value,
  });
  password.value = ""; // tras enviar no queda en el campo, salga bien o mal
  setPasswordVisible(false);
  setAccesoError("");
  setAccesoBusy(true);
  let status = 0;
  try {
    const res = await apiFetch(ACCESO_MODES[acceso.mode].path, {
      auth: false,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    status = res.status;
    if (!res.ok) throw await apiError(res);
    const { token, user } = await res.json();
    storeSessionToken(token);
    setAccesoBusy(false);
    closeAcceso();
    startSession(user);
    document.querySelector(".nav-item[data-view='dashboard']")?.focus();
  } catch (err) {
    setAccesoBusy(false);
    const field = status ? accesoErrorField(status, err.message) : password;
    setAccesoError(friendlyError(err), field);
    field.focus();
  }
}

// notice: aviso arriba del formulario ("Tu sesión terminó"). email: se deja escrito para volver a entrar.
function openAcceso({ notice = "", email = "" } = {}) {
  hideIntro();
  setAppInert(true);
  setAccesoState(true);
  setAccesoMode(notice ? "login" : acceso.mode);
  if (email) acceso.field("email").value = email;
  const noticeEl = document.getElementById("acceso-notice");
  noticeEl.textContent = "";
  // La región role="status" ya está visible cuando llega el texto: así los lectores de pantalla lo anuncian
  if (notice) setTimeout(() => { noticeEl.textContent = notice; }, 100);
  firstAccesoField().focus();
}

function closeAcceso() {
  setAccesoState(false);
  document.getElementById("acceso-form").reset();
  document.getElementById("acceso-notice").textContent = "";
  setPasswordVisible(false);
  setAccesoError("");
}

function initAcceso() {
  document.getElementById("acceso-form").addEventListener("submit", submitAcceso);
  document.querySelectorAll("[data-acceso-mode]").forEach(button => {
    button.addEventListener("click", () => { if (button.dataset.accesoMode !== acceso.mode) setAccesoMode(button.dataset.accesoMode); });
  });
  document.getElementById("acceso-reveal").addEventListener("click", () => {
    setPasswordVisible(acceso.field("password").type === "password");
    acceso.field("password").focus();
  });
  setAccesoMode("login");
}

document.addEventListener("DOMContentLoaded", initAcceso);
document.addEventListener("skillmap:language", renderAccesoTexts);
