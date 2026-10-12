# Bitácora · Pandi English

Historia del proyecto, decisiones y pendientes. Escribe arriba lo más nuevo. Cada entrada dice qué se hizo, por qué y qué quedó pendiente.

---

## Estado actual (resumen rápido)

- **App:** completa en modo demo y con backend Supabase listo. Tiene Nivel 1 con 5 unidades y 28 lecciones, 11 tipos de ejercicio, grupos, tareas semanales con calificación, ranking por grupo, medallas, editor de contenido y banco de palabras.
- **Backend:** funcionando con el Supabase real del dueño (proyecto `itaxhosmkmlnoqdpljzh`). El 11 de octubre se creó la primera escuela desde `setup.html` (admin `pruebaapp`). RLS probado en Postgres 16 (26/26).
- **Funciones nuevas (11 oct):** estadísticas del profe (palabras más falladas, quién no practicó), reporte para padres y aviso por WhatsApp, recordatorio diario, prueba de audio y micrófono, y panel del dueño (`owner.html`).
- **Repositorio:** `hanzelcruz70-cyber/app-de-ingles` (publicado en GitHub Pages: https://hanzelcruz70-cyber.github.io/app-de-ingles/). Copia local del dueño: `C:\Users\Hanzel\Documents\Pandi Ingles`.
- **Fecha clave:** el dueño presenta el producto al cliente el fin de semana del 17 y 18 de octubre de 2026. El plazo del MVP es de 2 meses desde el 10 de octubre de 2026.

### Pendiente inmediato (lo hace el dueño)
1. [x] Correr `supabase/schema.sql` en el proyecto **nuevo** de Supabase, si no está hecho. El dueño dijo el 11 de octubre que "ya hizo la base de datos"; falta confirmar que corrió el script.
2. [x] En Authentication → Email, apagar "Confirm email". Opcional: apagar el registro público.
3. [x] En GitHub (Settings → Secrets and variables → Actions), crear `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` y `PANDI_SETUP_TOKEN`, y correr el workflow "Publicar función de cuentas".
4. [x] En GitHub, Settings → Pages → Source, elegir **GitHub Actions**.
5. [x] Project URL y llave anon puestas en `config.js` (proyecto `itaxhosmkmlnoqdpljzh`). La app publicada ya arranca en modo servidor.
6. [x] Crear la escuela en `setup.html` (hecho). [ ] Entrar como admin, crear un grupo y estudiantes, y probar en el celular ("Agregar a pantalla principal").

### Siguientes ideas (no comprometidas)
- Mover las fotos del banco de palabras a Supabase Storage. Hoy van en base64 dentro de `courses.data`.
- Usar el micrófono de verdad en la app instalada. En la vista previa de claude.ai no hay micrófono y existe el botón "Ya lo dije".
- Niveles 2 a 6, y que cada grupo tenga su nivel.
- Recordatorios con Web Push desde el servidor (hoy son locales). Empaquetar para Google Play (TWA o Capacitor).

---

## 2026-10-11 · Guía de usuario y primera prueba beta (subagente)
- Se escribió `docs/GUIA_DE_USUARIO.md` (estudiante, profe y dueño). Es la referencia para probar la app sin leer código.
- **Prueba beta:** un subagente sin acceso al código usó solo la guía y la app en modo demo (Playwright, 390 px, claro y oscuro, cuentas `estudiante`/`admin`). No se pudo probar contra el Supabase real porque la red de la nube bloquea `supabase.co` y no tenemos la clave de `pruebaapp`. Para repetir la prueba: servir `index.html` con un `config.js` vacío (`window.PANDI_CONFIG = {};`). No sirve la versión de vista previa sola, porque no declara utf-8 y el navegador lee mal los acentos.
- **Corregido a partir del reporte:**
  - **Fechas en hora local.** `dayKey`, `fridayKey` y la racha usaban UTC; después de las 6 pm en Nicaragua las tareas "vencían" un día antes y la racha se rompía. Ahora usan `ymd()`, la fecha local.
  - **Micrófono que no respondía.** El ejercicio Hablar y la prueba de micrófono se trababan en "Te escucho…". Ahora hay un vigilante de 11 s que muestra "Ya lo dije en voz alta" y se ignora el error `aborted`.
  - **Pantalla "¡Lección completada!" desbordada a 390 px.** No hay `box-sizing` global; `#result .lwrap` sumaba el relleno al 100 %.
  - **Texto "null"** en el Resumen.
  - **Tareas con lecciones de unidades cerradas:** ahora la unidad se abre sola para los grupos de la tarea y se avisa.
  - **Detalles de presentación:** contraste del botón deshabilitado, selector de grupo ("Nombre (N)"), plurales, texto del ranking demo, aviso al revisar sin nota, "What is it?" en lugar de "What is it." (`endMark`), avisos arriba para que no tapen botones, burbuja "¡Empieza aquí!", reporte para padres (🧒, lecciones de unidades abiertas, tareas de la semana) y que tocar la pestaña activa vuelva a la lista.
  - **Aviso "No se oyó la voz":** solo sale si el niño tocó algo en los últimos 4 s.
- La guía se ajustó a los nombres reales de botones e instrucciones. El subagente verificó las correcciones: 16/16, sin regresiones.
- **Pendiente (sugerencias del beta):**
  - "Mis tareas" muestra también tareas de semanas siguientes.
  - La medalla "Voz de oro" se gana con el botón de respaldo.
  - Al crear una palabra desde un ejercicio, no queda seleccionada.

## 2026-10-11 · Estadísticas, reportes, recordatorios, audio y panel del dueño
- **Palabras falladas:** `grade()` llama a `noteMiss(step)`, que suma en `progress.miss[palabra]` (máximo 40 palabras por niño; no cuenta en vista previa). Viaja con el progreso al servidor, sin cambios en el esquema. El resumen del admin muestra "Palabras que más se fallan" (`missedCard`/`topMissed`) y la ficha del estudiante muestra "Le cuesta".
- **Quién no practicó:** "Necesitan un empujón" ahora tiene un botón **Recordar** que arma un mensaje por WhatsApp (`remindSheet`).
- **Reporte para padres:** en la ficha del estudiante (`reportSheet`/`reportText`). Incluye XP de la semana, días que practicó, racha, lecciones, tareas y palabras para repasar. Se manda por `wa.me` (si el número tiene 8 dígitos se le agrega 505), por "Compartir…" o se copia. **Decisión:** el teléfono del papá se guarda solo en el dispositivo del profe (`localStorage` `pandi-phones`), para no guardar datos de contacto en el servidor.
- **Recordatorio diario:** en el perfil del estudiante (`remindCard`). Pide permiso de notificaciones y guarda la hora en `localStorage` (`pandi-remind-<id>`). Revisa cada 30 s y al volver a la app, y avisa si ese día no practicó. En el mapa aparece un aviso "tu racha está en peligro". **Limitación:** es local: si el teléfono cierra la app, el aviso sale al volver a abrirla. Para avisos con la app cerrada hace falta Web Push (claves VAPID, tabla de suscripciones y una función programada); quedó como siguiente paso.
- **Audio:** elige la mejor voz en inglés (`voiceScore`), desbloquea el audio en el primer toque (iPhone), reanuda la voz trabada de Chrome y avisa si no suena. El reconocimiento de voz es más tolerante (`speechScore`: plurales, una letra distinta, homófonos como four/for), usa 5 alternativas, se corta a los 9 s y da mensajes claros por tipo de error. Hay una hoja "Probar audio y micrófono" en el login y en el perfil (`audioTestSheet`).
- **Panel del dueño:** `owner.html` (enlazado desde `setup.html`). Con `PANDI_SETUP_TOKEN` lista las escuelas (estudiantes, profes, última actividad), crea escuelas y cambia la clave de un profe. La Edge Function tiene las acciones nuevas `list_schools` y `owner_reset_admin_password`. El token no se guarda en el navegador.
- **Pruebas:** `tests/e2e/new_features.js` (nuevo) y casos nuevos en `tests/edge`. Todo PASS.

## 2026-10-11 · Error en setup.html ("No se pudo conectar con Supabase")
- El dueño completó los pasos 1 a 3 y al crear la escuela salió ese mensaje. Significa que el `fetch` a `/functions/v1/admin-users` falló antes de recibir respuesta (función no publicada, URL mal o red). No es un error de código o contraseña.
- `setup.html` ahora muestra la URL usada, las causas probables y el detalle técnico del error.
- Pendiente: confirmar que el workflow "Publicar función de cuentas" salió en verde y que `admin-users` aparece en Supabase → Edge Functions.

## 2026-10-11 · Conexión con el proyecto de Supabase
- Se llenó `config.js` con el proyecto `itaxhosmkmlnoqdpljzh` (solo la URL y la llave anon, que son públicas).
- No se pudo verificar el proyecto desde aquí: la red del espacio de trabajo en la nube y la de la máquina virtual del dueño bloquean `*.supabase.co`. La verificación se hará desde el teléfono, con la app publicada y `setup.html`.
- La vista previa de claude.ai sigue en modo demo: se genera sin `config.js`.

## 2026-10-11 · Repositorio, CLAUDE.md y documentación
- El dueño conectó GitHub. Claude puede leer el repositorio, pero **todavía no puede subir cambios**: falta instalar la app de Claude con permiso de escritura (https://github.com/apps/claude/installations/select_target). El commit inicial está listo en la copia local del dueño; se sube con `git push -u origin main` desde esa carpeta.
- Se creó `CLAUDE.md` (guía para modelos) y esta bitácora. Se agregaron las pruebas en `tests/` con rutas relativas para poder volver a correrlas.
- Se copió el proyecto a `C:\Users\Hanzel\Documents\Pandi Ingles`.
- Limpieza: se borró una función vacía (`_unused`) que había quedado en `src/app.html`.

## 2026-10-11 · Fase 2: backend real (Supabase) + app instalable
- **Decisión:** multi-escuela desde el inicio, porque el dueño quiere vender la app. Cada escuela queda aislada por `school_id` y RLS.
- **Decisión:** las cuentas de los niños usan usuario y contraseña, sin correo. Se mapean a `usuario@alumnos.pandienglish.app` con "Confirm email" apagado. Las crea el admin mediante la Edge Function, porque crear usuarios de Auth requiere la llave de servicio.
- **Decisión:** la app sigue siendo un solo archivo y tiene una capa de sincronización (`doSync`) que compara `DB` con `SNAP`. Así toda la lógica del modo demo se reutiliza sin reescribir pantallas.
- **Decisión:** las entregas de tarea van en su propia tabla (`submissions`) para que la nota del profe y el texto del niño no se pisen. El trigger `guard_submission` impide que el niño se califique.
- **Decisión:** el ranking del estudiante viene de la función `class_ranking()`, que solo devuelve el nombre y los puntos de sus compañeros de grupo.
- Se agregaron la PWA (manifest, service worker, íconos del panda), `setup.html` para crear escuelas y workflows de GitHub para Pages y para la Edge Function.
- En modo servidor, la contraseña tiene un mínimo de 6 caracteres (requisito de Supabase). La contraseña solo se muestra al crearla y el admin puede cambiarla después.
- **Pruebas:** RLS con 26 casos en Postgres 16 local, todos PASS. La Edge Function, con 11 casos y Supabase simulado. E2E con dos dispositivos (admin y estudiante) y Supabase simulado: login, alta de estudiante, usuario repetido, abrir unidad, tarea, progreso, entrega, calificación, nota visible y sesión que se mantiene al recargar.
- El dueño pidió explícitamente **no tocar sus otras bases de datos de Supabase**: todo va en un proyecto nuevo.

## 2026-10-11 · Fase 1 de la demo: contenido + grupos + tareas
- Unidades 3 (My Family, 6 lecciones), 4 (My School, 6) y 5 (Food, 5), con vocabulario nuevo en el banco.
- **Grupos:** cada uno con sus unidades abiertas, su ranking y sus tareas. El admin cambia de grupo con el selector de arriba.
- **Editor de tareas:** título, fecha, lecciones, escritura opcional y grupos. Por tarea se ve el avance de cada estudiante y se califican las escrituras.
- Hay una migración de `localStorage`: la tarea vieja fija pasa a `assignments` y `hw`, y se agrega el contenido nuevo sin borrar lo que el usuario había creado (`courseVer` 2).

## 2026-10-11 · Editor de contenido
- **Decisión:** el curso pasó de estar en código a ser datos (`DB.course`), para que el profe cree y edite sin programar.
- El admin puede crear, editar, reordenar y borrar unidades, lecciones y ejercicios (11 tipos), y manejar un banco de palabras con emoji o foto. También puede generar ejercicios automáticos a partir de palabras y probar una lección en vista previa.

## 2026-10-10 · Login, perfiles y mascota
- Se agregaron inicio de sesión, el perfil de admin separado del estudiante y el ranking en lugar del panel del profe en la app del niño.
- **Mascota:** el panda que mandó el dueño (imagen propia, recortada sin fondo). Se usa en grande en el login y en el resultado, y la cabeza en el encabezado.
- **Nombre:** Pandi English (provisional, vendible). No se usa "Smart Kids", que es el nombre de la academia del cliente.

## 2026-10-10 · Inicio
- El cliente es un profe de inglés de niños (hasta unos 14 años). Su material está en el Pearson English Portal (Poptropica English): niveles → unidades → lecciones de Vocab, Grammar, Song, Story, Talk, CLIL y Quiz.
- El cliente quiere que sus alumnos practiquen durante la semana lo visto en clase: escribir, hablar, leer, juegos y workbook, con una app atractiva como Duolingo.
- **Decisión:** se copia la estructura del curso y no el material de Pearson, por derechos de autor.
- Se hizo un documento de descripción y plan de 8 semanas (Claude Docs) y un primer prototipo jugable.
