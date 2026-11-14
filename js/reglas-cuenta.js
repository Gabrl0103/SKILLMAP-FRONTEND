// Reglas de cuenta que comparten Acceso (registro) y Ajustes (cambiar contraseña y nombre). Son las mismas del backend
// (PasswordPolicy y UserFactory): aquí solo sirven para avisar antes de enviar; el backend vuelve a validarlo todo.
// Usa t (i18n.js).

const PASSWORD_MIN = 8;
const PASSWORD_MAX = 64;     // caracteres
const PASSWORD_MAX_BYTES = 72; // BCrypt ignora lo que pasa de 72 bytes (UTF-8)
const NAME_MIN = 2;
const NAME_MAX = 60;

// Las que primero prueba cualquier ataque (misma lista corta que el backend; se comparan en minúsculas)
const COMMON_PASSWORDS = new Set([
  "12345678", "123456789", "1234567890", "password", "password1", "password123", "passw0rd", "qwerty123", "qwertyuiop",
  "qwerty12", "1q2w3e4r", "1qaz2wsx", "abc12345", "abcd1234", "iloveyou1", "admin123", "welcome1", "letmein1", "11111111",
  "00000000", "87654321", "contraseña", "contraseña1", "contrasena1", "contraseña123", "clave123", "12341234", "asdf1234",
  "zaq12wsx", "superman1", "skillmap1", "cenit123", "teamo123",
]);

const codePointCount = text => Array.from(text || "").length;
const utf8Bytes = text => new TextEncoder().encode(text || "").length;
// Control (Cc), formato invisible (Cf) y separadores de línea/párrafo: no se ven y sirven para disfrazar texto
const CONTROL_CHARS = /[\p{Cc}\p{Cf}\p{Zl}\p{Zp}]/u;
const hasControlChars = text => CONTROL_CHARS.test(text || "");
const compactText = text => (text || "").toLowerCase().replace(/\s+/g, "");

// Requisitos a la vista mientras se escribe: largo (8 a 64 caracteres y que quepa en 72 bytes) y letra + número
function passwordChecks(value) {
  const length = codePointCount(value);
  return {
    length: length >= PASSWORD_MIN && length <= PASSWORD_MAX && utf8Bytes(value) <= PASSWORD_MAX_BYTES,
    mix: /\p{L}/u.test(value || "") && /\p{Nd}/u.test(value || ""),
  };
}

// Primer problema de una contraseña nueva, como clave de i18n con sus parámetros ([clave, params]); null si está bien.
// email y name: los de la cuenta (la contraseña no puede ser igual a ellos).
function passwordProblem(value, { email = "", name = "" } = {}) {
  const length = codePointCount(value);
  if (length < PASSWORD_MIN) return ["password.short", { min: PASSWORD_MIN }];
  if (length > PASSWORD_MAX) return ["password.long", { max: PASSWORD_MAX }];
  if (utf8Bytes(value) > PASSWORD_MAX_BYTES) return ["password.bytes", { max: PASSWORD_MAX }];
  if (/^[\s ]|[\s ]$/u.test(value)) return ["password.spaces", {}];
  if (hasControlChars(value)) return ["password.control", {}];
  if (!passwordChecks(value).mix) return ["password.mix", {}];
  const candidate = compactText(value);
  const mail = (email || "").trim().toLowerCase();
  const local = mail.includes("@") ? mail.slice(0, mail.indexOf("@")) : "";
  if ((mail && candidate === compactText(mail)) || (local && candidate === compactText(local))
    || (name.trim() && candidate === compactText(name))) return ["password.personal", {}];
  if (COMMON_PASSWORDS.has(value.toLowerCase())) return ["password.common", {}];
  return null;
}

// Nombre como lo guarda el backend: sin espacios de sobra
const normalizeName = value => (value || "").trim().replace(/\s{2,}/g, " ");

// Primer problema de un nombre ([clave, params]); null si está bien. Letras (con tildes y ñ), espacios, guion y apóstrofo.
function nameProblem(value) {
  const name = normalizeName(value);
  const length = codePointCount(name);
  if (length < NAME_MIN || length > NAME_MAX) return ["name.length", { min: NAME_MIN, max: NAME_MAX }];
  if (!/^[\p{L}\p{M} '’-]+$/u.test(name) || !/\p{L}/u.test(name)) return ["name.chars", {}];
  return null;
}

// Texto de un problema ([clave, params]) en el idioma actual
const accountRuleText = problem => (problem ? t(problem[0], problem[1]) : "");
