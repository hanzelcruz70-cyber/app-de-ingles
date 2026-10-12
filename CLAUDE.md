# CLAUDE.md · Pandi English

Guía para cualquier modelo o persona que trabaje en este repositorio. Léela completa antes de tocar código. La historia de decisiones y lo pendiente está en [`docs/BITACORA.md`](docs/BITACORA.md). **Actualiza la bitácora al terminar cada sesión de trabajo.**

## Qué es

**Pandi English** es una app (PWA) para que niños de hasta 14 años practiquen inglés entre clases, al estilo Duolingo. La mascota es **Pandi**, un oso panda.

- **Cliente inicial:** un profesor de una academia de inglés que da clases con la serie *Poptropica English* (Pearson). Sus alumnos practican en la app los temas vistos en clase.
- **Producto:** el dueño (Hanzel) lo quiere **vender a varias escuelas**. Por eso es multi-escuela y **no lleva el nombre ni la marca de la academia del cliente** (no usar "Smart Kids").
- **Dos roles:** *estudiante* (mapa de lecciones, tareas, ranking, perfil) y *admin/profe* (resumen, estudiantes y grupos, editor de contenido, tareas y calificación).

## Reglas que no se rompen

1. **Supabase: usar solo el proyecto dedicado a Pandi English.** El dueño tiene otras bases de datos en Supabase y **no se tocan**. Los scripts SQL solo crean (`create ... if not exists`), nunca borran datos.
2. **Nunca** poner la llave `service_role` en el código del cliente ni en el repositorio. En `config.js` va solo la llave `anon` (es pública; la seguridad está en RLS).
3. **No copiar contenido de Pearson** (imágenes, audios, historias, textos del libro). La app usa la misma estructura y vocabulario por tema, con ejercicios, emojis y textos propios.
4. **Idioma:** la interfaz está en español (Nicaragua); el contenido de las lecciones, en inglés. Los textos de la UI son cortos y para niños.
5. `index.html` **se genera**. Edita `src/app.html` y corre `python3 build.py`.

## Estructura

```
src/app.html            Código fuente de toda la app (HTML + CSS + JS, sin frameworks)
src/panda_uris.js       Imágenes de la mascota en base64 (PANDA_FULL, PANDA_HEAD)
build.py                Genera index.html (versión publicable). Con un argumento genera también la versión demo para la vista previa
index.html              App lista para publicar (generada)
config.js               URL y llave anon de Supabase. Vacío = modo demo
setup.html              Página para crear una escuela + su admin (usa PANDI_SETUP_TOKEN)
privacidad.html, terminos.html   Aviso de privacidad y términos (Nicaragua, Ley 787). Nombre y contacto salen de config.js (legalName, contactEmail, contactPhone)
owner.html              Panel del dueño: ver escuelas, crear escuelas, cambiar clave de un profe (usa PANDI_SETUP_TOKEN)
manifest.webmanifest, sw.js, icons/   PWA instalable y con caché sin conexión
supabase/schema.sql     Tablas, funciones y reglas RLS (idempotente)
supabase/functions/admin-users/index.ts   Edge Function: crear escuela, crear/borrar estudiantes, cambiar contraseñas
.github/workflows/      pages.yml (publica en GitHub Pages) y supabase-function.yml (publica la Edge Function)
tests/                  Pruebas: e2e (Playwright), rls (Postgres), edge (función simulada)
docs/BITACORA.md        Historia, decisiones y pendientes
docs/GUIA_DE_USUARIO.md Guía para estudiante, profe y dueño (también la usa el beta tester)
docs/LISTA_DE_PRUEBAS.md  Lista de pruebas manuales con el servidor real
README.md               Guía paso a paso para el dueño (en español, no técnica)
```

## Cómo funciona la app (`src/app.html`)

Un solo archivo con una sección `<style>` (tokens de color en `:root` con modo oscuro) y un `<script>` dividido en bloques con comentarios `/* ---------- nombre ---------- */`, en este orden:

1. **helpers:** `h(tag, attrs, ...hijos)` crea elementos. También `$`, `$$`, `shuffle`, `sample`, `norm`, fechas (`dayKey`, `fridayKey`, `fmtDay`) e iconos SVG (`ICON`).
2. **vocabulary:** `V_SEED` es el banco de palabras inicial (`palabra: {img, es}`). `img` puede ser un emoji, `sw:#color`, `n:3` (número), `data:` (foto subida), `panda` o `w:palabra` (usa la imagen de otra palabra). `V` apunta a `DB.course.vocab`.
3. **course:** `courseSeed()` y `extraUnits()` contienen el Nivel 1 (5 unidades: Hello!, Animals, My Family, My School, Food). Cada lección es `{id, title, kind, shuffle?, items:[...]}`. Los ejercicios se guardan como datos, no como código.
4. **Tipos de ejercicio (`items`):** `flash`, `pickword`, `listen`, `match`, `write`, `speak`, `order`, `fill`, `memory`, `tip`, `read`. `toStep()` convierte cada item en un paso jugable y `buildSteps()` arma la lección (las opciones incorrectas salen de palabras de la misma lección o unidad).
5. **data:** objeto global `DB` = `{users, progress, groups, assignments, friends, course, courseVer, session, seq}`.
   - `progress[userId]` = `{xp, xpDays:{fecha:xp}, done:{lessonId:estrellas}, days:[fechas], medals, spoken, miss:{palabra:errores}, avatar:{a:emoji, c:índice de color, x:accesorio}, hw:{assignmentId:{text, sentAt, note, grade, reviewed, reviewedAt, history:[{at, from, to, reason}]}}}`.
   - `friends[]` = `{from, to, status:'pending'|'accepted'}`. En modo servidor se leen de `friendships` y se cambian al momento con `friendOp` (no pasan por `doSync`).
   - `groups[]` = `{id, name, open:{unitId:bool}}`. Cada grupo abre sus propias unidades.
   - `assignments[]` = `{id, title, due, lessons:[ids], writing:{title,prompt}|null, groups:[ids]}`.
   - `save()` guarda: en modo demo en `localStorage` (clave `pandi-english-v2`); en modo servidor programa `scheduleSync()`.
   - `migrate()` actualiza datos viejos de `localStorage`. Si cambias el contenido semilla, sube `courseVer` y agrega la migración.
6. **recordatorios:** `remindCard` y `remCheck`: notificación local diaria, con la hora guardada en `localStorage`.
7. **audio:** `say(texto, lento)` usa la mejor voz en inglés (`voiceScore`); `sfx(ok)` hace sonidos con WebAudio; `unlockAudio` desbloquea en el primer toque; `speechScore` compara la voz del niño con tolerancia; `audioTestSheet` sirve para probar sonido y micrófono.
8. **login & routing:** `route()` decide entre login, `#home` (estudiante) o `#admin`. `U` es el usuario actual y `S` su progreso.
9. **student app:** `renderMap`, `renderWork` (tareas), `renderRank` (ranking por grupo; semana o total), `renderMe` (perfil, medallas, `avatarSheet`, `friendsCard`/`addFriendSheet`, racha de amigos `pairStreak`). `avatar(u)` dibuja el avatar elegido o la inicial.
10. **admin panel:** `renderSum` (+ `missedCard`: palabras más falladas), `renderStudents` (+ `groupSheet`, `addStudentSheet`, `studentSheet`), `renderHW` (+ `renderAssignment`, `assignmentSheet`). Reportes por WhatsApp: `shareSheet`, `reportSheet`, `remindSheet`. Calificación: `gradeForm`, `gradeView`, `editGradeSheet` (editar exige motivo y guarda historial). `groupBar()` es el selector de grupo y `curGroup()` el grupo activo.
11. **content editor:** `renderContent` → `renderUnitEd` → `renderLessonEd` → `exerciseSheet`; banco de palabras con `renderWordsEd` y `wordSheet`. Se reordena con flechas (`move`). `lessonSheet` puede generar ejercicios automáticos (`autoItems`). Con "Probar lección" se juega en modo vista previa, sin guardar.
12. **real backend:** solo actúa si `window.PANDI_CONFIG` tiene `supabaseUrl` y `supabaseAnonKey` (`REMOTE = true`).
    - `remoteBoot` → `remoteLogin` → `remoteLoad` traen todo a `DB`.
    - `doSync` compara `DB` con la última copia (`SNAP`) y sube solo lo que cambió (curso, grupos, tareas, perfiles, progreso propio, entregas).
    - `adminCall` llama a la Edge Function.
    - `maybeRefresh` recarga los datos al cambiar de pestaña (cada 20 s como máximo).
13. **lesson engine:** `startLesson(unit, lesson, preview)`, `renderStep`, `grade` (lo que se responde mal se repite al final), `finishLesson` (XP, estrellas, medallas, racha). Los dibujantes de cada tipo de ejercicio están en el objeto `R`.

### Modo demo vs. modo servidor

- **Demo** (`config.js` vacío, y siempre en la vista previa de claude.ai): los datos viven en `localStorage`. Trae cuentas de ejemplo (`estudiante`/`1234`, `admin`/`admin123`, y compañeros marcados `example:true`) y "Reiniciar demo".
- **Servidor:** Supabase Auth con usuario y contraseña. Internamente cada usuario usa el correo `usuario@alumnos.pandienglish.app` (sin envío de correos) y la contraseña debe tener al menos 6 caracteres. Las cuentas las crea el admin con la Edge Function; no hay registro público.

## Supabase

- **Tablas:** `friendships` (amistades entre compañeros del mismo grupo; `from_id` envía, `to_id` acepta), `schools`, `profiles` (id = auth.users.id; role admin|student; username único global; group_id), `groups`, `courses` (jsonb con vocab + units por escuela), `assignments`, `progress` (jsonb por estudiante, sin `hw`), `submissions` (una fila por tarea y estudiante, con `note`, `grade` 0-100 e `history`).
- **Funciones:** `my_school()`, `is_admin()`, `my_group()`, `is_classmate(id)` y `class_ranking()` (ranking del grupo con avatar, sin exponer datos privados). El trigger `guard_submission` impide que un estudiante se ponga nota, calificación o historial, o se marque revisado. **Ojo:** el admin solo puede hacer `update` en `submissions` (un `upsert` cuenta como insert y RLS lo rechaza).
- **RLS:** el estudiante ve solo lo suyo y el ranking de su grupo. El admin ve y edita solo su escuela, y no puede cambiar roles ni el progreso de los niños. Hay 40 casos probados en `tests/rls`. Cuando cambies `schema.sql`, el dueño debe volver a correrlo en el SQL Editor de Supabase.
- **Edge Function `admin-users`:** acciones `create_school`, `list_schools` y `owner_reset_admin_password` (requieren `PANDI_SETUP_TOKEN`), `create_student`, `reset_password` y `delete_student` (estas tres requieren sesión de admin).

## Comandos

```bash
python3 build.py                              # regenera index.html
python3 build.py /ruta/demo.html              # además genera la versión demo (vista previa de claude.ai)
tests/e2e/run.sh                              # Playwright: editor, 2 dispositivos con Supabase simulado, build publicado
tests/edge/run.sh                             # Edge Function con cliente simulado (Node)
PGURL=postgresql://postgres@127.0.0.1:5432/postgres tests/rls/run.sh   # RLS en Postgres local (solo debe salir PASS)
```

Antes de dar por terminado un cambio: corre `python3 build.py` y luego las pruebas que apliquen. Si cambias algo visible, actualiza `docs/GUIA_DE_USUARIO.md`. Revisa en una pantalla de 390 px de ancho que nada se corte ni se desborde.

## Publicación

- **GitHub Pages:** `.github/workflows/pages.yml` publica en cada push a `main`. Hay que elegir **Settings → Pages → Source: GitHub Actions** una sola vez.
- **Edge Function:** `.github/workflows/supabase-function.yml`, con los secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF` y `PANDI_SETUP_TOKEN`.
- **Vista previa privada en claude.ai** (modo demo): https://claude.ai/artifact/9KouyS6pSxcvxTcphehakq. Se actualiza publicando la salida de `python3 build.py <archivo>`.
- **Documento de plan y alcance** (Claude Docs): https://claude.ai/code/artifact/3bd85d60-d11d-4034-aaaf-761d268f598f

## Convenciones de código

- JavaScript sin frameworks. Usa `h()` para crear elementos; no armes HTML con cadenas que incluyan datos del usuario.
- Fechas: usa siempre `dayKey()`/`ymd()` (fecha local). Nunca `toISOString().slice(0, 10)`, que da la fecha UTC y en Nicaragua cambia de día a las 6 pm.
- No hay `box-sizing` global: si un bloque tiene `width:100%` y relleno, ponle `box-sizing:border-box`.
- Colores solo desde tokens CSS (`var(--...)`) y siempre probados en modo claro y oscuro. Botones grandes y texto mínimo de 15 px.
- Cada cambio de datos termina en `save()`. Los ids nuevos se crean con `newId(prefijo)`.
- **La app no habla sola:** `say()` solo se llama desde botones que toca el usuario (bocina, Probar sonido). Nada de saludos ni frases automáticas.
- `append()` está parcheado para ignorar `null`/`false`, así un `cond ? h(...) : null` nunca pinta "null".
- Las hojas emergentes usan `sheet(...)`, las confirmaciones `confirmSheet(...)` y los avisos `toast(...)`. Nunca `alert`, `confirm` ni `prompt`.
- Los textos visibles van en español claro. Los errores dicen qué pasó y cómo arreglarlo.
- Los commits terminan con las líneas de atribución que indique la sesión.
