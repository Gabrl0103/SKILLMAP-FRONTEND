PROMPT AJUSTES R2 — Cenit (frontend)

Rama: feat/rediseno-ajustes (desde main con el rediseño ya mergeado). No hagas commits. Al terminar escribe C:\Temp\resumen.md (qué hiciste, qué dudas tuviste, commits sugeridos: uno por punto).

Reglas: no cambies la jerarquía ni la tipografía del rediseño (Plus Jakarta Sans, escala de tokens en css/styles.css). Usa Impeccable (/critique al inicio, /polish y /audit al final). Sin cambios de backend. Conserva i18n es/en, claro/oscuro, reduced-motion, hit targets ≥44px, contraste AA.

Cambios
Objetivo: elegir tocando la tarjeta.
Toda la tarjeta de "Otras rutas" es el botón (un solo <button> o rol equivalente, con foco visible y Enter/Espacio).
Quita los botones Elegir y Comparar y toda la función de comparar (panel, estados, claves i18n, CSS y JS que queden sin uso).
Conserva la confirmación en línea y el "Deshacer" al elegir, para que un toque accidental sea reversible. Reutiliza PUT /api/auth/me/goal.
Que todas las tarjetas tengan la misma tipografía y diseño, incluida la de "Otro objetivo / Próximamente" (hoy se ve distinta) y el buscador. Revisa que la cuadrícula no deje huecos raros.
Mi Ruta: tarjeta "Siguiente giro" al final. Sácala del lado del hero de Nivel de preparación y pásala como última tarjeta de la página, a todo el ancho o al ancho que mejor encaje. El hero de preparación queda sin ese cuadro a la derecha y ocupa todo el ancho.
Mi Ruta: nodos de Nivel de preparación como antes. Restaura el comportamiento anterior de los nodos de la ruta (paradas). Averigua cuál era mirando el historial: git log -p -- js/dashboard.js y compara con el commit de main previo al rediseño (5925c69). Restaura ese comportamiento (interacción, orden, estados, animación) manteniendo el nuevo aspecto y la jerarquía actual. Si algo es ambiguo, no adivines: lista las opciones en el resumen.
Ajustes: quita el recuadro "Inteligencia artificial" (la tarjeta completa, incluida la key opcional de Gemini). Elimina el HTML, JS, i18n y CSS que queden sin uso en la UI. No toques el backend ni los endpoints; solo deja de mostrarlo.
Barra superior: botón de tema claro/oscuro. Devuélvelo junto a la barra (al lado del icono de Ajustes y antes del avatar). Debe alternar el tema al instante, tener aria-label y aria-pressed/estado, 44px, y recordar la elección como antes. Mantén en Ajustes la sección Apariencia si ya existe, sin duplicar lógica.

Verificación

Recorre todas las pantallas en claro/oscuro y es/en, consola sin errores, un solo botón primario por vista, y /audit sin problemas graves. Anota en el resumen cualquier cosa que decidas distinto a lo pedido y por qué.

