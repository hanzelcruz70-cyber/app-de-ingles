# Bitácora · Pandi English

Historia del proyecto, decisiones y pendientes. Escribe arriba lo más nuevo. Cada entrada dice qué se hizo, por qué y qué quedó pendiente.

---

## Estado actual (resumen rápido)

- **App:** completa en modo demo y con backend Supabase listo. Tiene Nivel 1 con 5 unidades y 28 lecciones, 11 tipos de ejercicio, grupos, tareas semanales con calificación, ranking por grupo, medallas, editor de contenido y banco de palabras.
- **Backend:** el esquema y las reglas RLS están probados en Postgres 16 (26/26 casos). La Edge Function se probó con Supabase simulado. **Todavía no se ha probado contra el Supabase real del dueño.**
- **Repositorio:** `hanzelcruz70-cyber/app-de-ingles` (todavía vacío en GitHub; falta el primer push). Copia local del dueño: `C:\Users\Hanzel\Documents\Pandi Ingles`.
- **Fecha clave:** el dueño presenta el producto al cliente el fin de semana del 17 y 18 de octubre de 2026. El plazo del MVP es de 2 meses desde el 10 de octubre de 2026.

### Pendiente inmediato (lo hace el dueño)
1. [ ] Correr `supabase/schema.sql` en el proyecto **nuevo** de Supabase, si no está hecho. El dueño dijo el 11 de octubre que "ya hizo la base de datos"; falta confirmar que corrió el script.
2. [ ] En Authentication → Email, apagar "Confirm email". Opcional: apagar el registro público.
3. [ ] En GitHub (Settings → Secrets and variables → Actions), crear `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` y `PANDI_SETUP_TOKEN`, y correr el workflow "Publicar función de cuentas".
4. [ ] En GitHub, Settings → Pages → Source, elegir **GitHub Actions**.
5. [x] Project URL y llave anon puestas en `config.js` (proyecto `itaxhosmkmlnoqdpljzh`). La app publicada ya arranca en modo servidor.
6. [ ] Crear la escuela en `setup.html`, entrar como admin, crear un grupo y estudiantes, y probar en el celular ("Agregar a pantalla principal").

### Siguientes ideas (no comprometidas)
- Mover las fotos del banco de palabras a Supabase Storage. Hoy van en base64 dentro de `courses.data`.
- Usar el micrófono de verdad en la app instalada. En la vista previa de claude.ai no hay micrófono y existe el botón "Ya lo dije".
- Niveles 2 a 6, y que cada grupo tenga su nivel.
- Notificaciones de recordatorio, reporte para padres y empaquetar para Google Play (TWA o Capacitor).

---

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
