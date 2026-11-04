# PROMPT REDISEÑO — Cenit (frontend)

Repo: frontend (vanilla HTML/CSS/JS + Tailwind local). Rama: `feat/rediseno-visual` (desde `main` actualizado). **No hagas commits.** Al terminar escribe `C:\Temp\resumen.md`.

## Contexto
Rediseñé las pantallas en Claude Design para que se vean ordenadas y jerárquicas para público general. Los archivos de referencia están en `C:\Temp\diseno\` (`*.dc.html`: Main=Mi Ruta, Objetivo, Habilidades, Perfil, Mapa, Analizador, Ajustes). Son prototipos con datos de ejemplo: **tómalos como referencia visual y de estructura, no copies el código** (usan un formato propio `<x-dc>`). Lee también `GUIA-UX-CENIT.md` (10 heurísticas de Nielsen).

## Reglas
1. **Impeccable es obligatorio**: usa `/critique` al inicio de cada pantalla, `/distill` y `/clarify` mientras la reconstruyes, `/normalize` para unificar tokens y `/polish` + `/audit` al final.
2. Mantén paleta, tokens y "Dos voces" (rosa/violeta = aprendiendo, menta = dominada, punteado = pendiente), voz de GPS, i18n es/en, modo claro/oscuro y reduced-motion. La guía UX manda en organización, jerarquía, espaciado y textos; no cambies la paleta.
3. **Cero cambios de funcionalidad ni de backend.** Conserva IDs, endpoints, llamadas y claves i18n existentes; si una pantalla del diseño tiene algo que la app no hace, no lo inventes: déjalo fuera y anótalo en el resumen. Si una función real no aparece en el diseño, consérvala y ubícala con criterio.
4. Hit targets ≥ 44px, foco visible, contraste AA, un solo botón primario por vista, estados vacío/carga/error, acciones reversibles con "Deshacer" donde el diseño lo muestre.
5. Sin responsive (escritorio, ancho de diseño 1440, contenido máx. 1200px).

## Orden de trabajo (verifica en el navegador tras cada paso)
1. **Base compartida**: unifica tokens (colores, tipografía Plus Jakarta Sans, radios, espaciado, sombras) en un solo CSS y crea el **header común**: logo estrella + "Cenit", nav de 6 ítems (Objetivo, Mi Ruta, Mapa, Habilidades, Analizador, Perfil), icono de Ajustes aparte (fuera del nav), avatar con menú desplegable (nombre, correo, Ver mi perfil, Cerrar sesión; `aria-haspopup="menu"`, cierra con Esc y devuelve foco). Sin "Cuenta" en Perfil.
2. **Mi Ruta**: título + objetivo + motivo, hero de preparación con ruta y "Siguiente giro", brechas prioritarias, "Tu ritmo", tendencia, mercado laboral, ofertas para ti. Respeta lo ya hecho en AB/AC si está en la rama base.
3. **Objetivo** (hero del objetivo actual, otras rutas, elegir/comparar), **Habilidades**, **Perfil**.
4. **Mapa**, **Analizador**, **Ajustes**.
5. Pasada final: `/audit`, recorrer todo en claro/oscuro y ES/EN, `mvnw test` en backend sin tocarlo (solo confirmar que sigue verde) y tests del frontend si existen.

## Entregable
`C:\Temp\resumen.md` con: pantallas terminadas, qué del diseño NO se implementó y por qué, hallazgos de `/audit`, archivos tocados, y comandos de commit sugeridos (uno por paso, desde la raíz del repo).