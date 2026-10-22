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
6. **Copia del dueño en su computadora:** `C:\Users\Hanzel\Documents\Pandi Ingles`. Después de cada cambio subido a GitHub, actualiza también esa carpeta (con el puente a su computadora). Su computadora **no llega a GitHub** (proxy 403), así que se hace con un paquete: `git bundle create /mnt/user-data/outputs/pandi-update.bundle main` → `device_commit_files` a la carpeta → en `device_bash`: `git fetch pandi-update.bundle main:refs/remotes/origin/main && git merge --ff-only origin/main` y borrar el bundle (hace falta permiso de borrado en la carpeta). El dueño corre `supabase/schema.sql` desde ahí, así que una copia vieja rompe cosas: el 12 de octubre corrió un schema viejo y los estudiantes no podían entrar.

## Estructura

```
src/app.html            Código fuente de toda la app (HTML + CSS + JS, sin frameworks)
src/panda_uris.js       Imágenes de la mascota en base64 (PANDA_FULL, PANDA_HEAD)
icons/pandi/            Capas del Pandi animado del camino (PNG); se regeneran con tools/pandi/capas.cjs (ver su LEEME.md)
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
3. **course:** `courseSeed()` arma el curso con `level1Units()`/`V1_SEED` (**Nivel 1** del libro: Alfabeto 2, Bienvenida 4, 8 unidades de 10, 4 repasos de 2, Despedida 4, Festivales 4, Wider World 4; ids `n1…`; personajes Harry, Beth, Cody y la tía Fifi en `FRIENDS` y Waldo con `dragonSVG`; `PRE1` agrega escenas extra). `level2Units()` y `V2_SEED` contienen el **Nivel 2**, que sigue el libro de Nivel 2 página por página: Bienvenida (6 lecciones), 8 unidades de 10 lecciones (una por página) y 4 repasos de 2. Cada lección es `{id, title, kind, shuffle?, items:[...]}`. Los ejercicios se guardan como datos, no como código.
   - Una unidad puede tener `level` (sin él es Nivel 1) y `tag` (`Bienvenida` o `Repaso`: no lleva número). `unitNo` cuenta dentro del nivel, `unitLabel`/`unitFull` arman el nombre visible y `moveUnit` ordena dentro del nivel.
   - **Contenido del libro:** mismo vocabulario, frases y tipo de práctica que el libro. Cantos, canciones y cuentos son textos propios con las mismas palabras (no se copia la letra ni el diálogo de Pearson). Los nombres de los personajes (Charlie, Rose, Ola, Uncle Dan) se usan por decisión del dueño; los dibujos no.
   - **Escenas (`t:'scene'`):** cada lección del Nivel 2 empieza con la actividad de su página del libro, dibujada e interactiva (bloque `escenas del libro` de `src/app.html`). Modos en `SCENE_MODES`: `drop` (poner palabras en el dibujo), `find`/`number` (escuchar y tocar; con número), `chant` (canto línea por línea), `story` (cuento en viñetas), `pick` (marcar los correctos) y `sort` (dos canastas). Una escena usa un dibujo fijo de `ART` (`friends`, `parrot`, `greet`, `splats`, `face`) o se arma con datos: fondo de `BG` + palabras del banco (`gridArt`, `picSVG`). En `level2Units`, `PRE` agrega las escenas de cada lección y los tips «Canto:»/«Canción:» se vuelven escena con el fondo y los personajes de la unidad (`SET`). Los personajes salen de `avatarSVG` (`FRIENDS`) y Ola de `monkeySVG`. Las escenas no se editan desde el editor (solo mover o quitar). Las escenas `find`/`number` armadas con palabras se juegan con `playField` en uno de tres estilos animados (`parade`, `rain`, `moles`) cuando el paso trae `game`; si no, como el dibujo del libro.
   - **Nivel 3:** `level3Units()` y `V3_SEED` siguen el libro de Nivel 3 (Bienvenida 6, 8 unidades de 10, 4 *Wider World* de 2, 4 repasos de 2, Despedida 4, Festivales 3). Ids `n3…`; la lección puede traer `n` para fijar su número (la Unidad 8 salta la 7 y la 8, que faltan en el PDF). `PRE3` agrega escenas a lecciones cuya actividad es buscar, comparar o clasificar. Personajes propios: Kim, Katy y el capitán Conrad en `FRIENDS` (avatar), PROD 1 y PROD 2 con `robotSVG`, la presidenta Pop con `alienSVG`; `isFriend()` decide si una palabra se dibuja como personaje. Fondos nuevos `space` y `gym`.
   - **Nivel 4:** `level4Units()` y `V4_SEED` siguen el libro de Nivel 4 (*Discovery Studios*: Bienvenida 5, 8 unidades de 10, 3 *Wider World* de 1, 4 repasos de 2, Despedida 3, Festivales 2). Ids `n4…`; `PRE4` (al final de la función) pone escena a las lecciones de leer y jugar. Personajes: Oliver, Sophie, el tío James y Finley Keen en `FRIENDS`; Coco con `monkeySVG` en otros colores. En `V4_SEED` las palabras que ya existían en otro nivel no se pisan (`V4_SEED` va primero en `courseSeed`).
   - **Retos de Pandi (bloque `retos extra de Pandi`):** `buildSteps` agrega al final de cada lección (de cualquier nivel) los pasos de `lessonExtras(lesson, unit)`, armados en vivo (no se guardan en el curso; `lesson.noExtra` los apaga). Tipos: `fix` (error de gramática con `FIX_RULES`/`SWAP` y regla en español), `chat` (pregunta y respuesta; los distractores salen de preguntas con otro auxiliar), `tf` (verdadero: frase del cuento de la unidad; falso: frase de otro cuento del mismo nivel), `seq` (ordenar viñetas), `spell` y `pop`. La rotación depende de la posición de la lección (`pos`), así no se repite la misma combinación seguida. Fuentes: `lessonSentences`, `unitStory(unit, lesson)` (solo cuentos de lecciones hasta la actual; antes del cuento no hay `tf` ni `seq`), `lessonWords` (incluye las palabras de los dibujos fijos de `ART`).
   - **Niveles por grupo:** el nivel del grupo se guarda en `group.open._level` (sin cambiar la base de datos; si falta, sale del nivel más alto con unidades abiertas). `unitOpenFor(g, u, p)`: en el nivel del grupo manda el interruptor; los niveles hasta `accessLevel` (el del grupo o el más alto donde el niño ya completó algo) quedan abiertos para repasar; los demás no se ven. El mapa muestra un nivel (`MAPLV`) con un encabezado fijo al estilo Duolingo (`.lv-head`; `mapHeadSync` lo cambia a la unidad que se ve al hacer scroll; ojo, la clase `.nav` ya existe para la barra de abajo). Si hay más de un nivel visible, tocarlo pone `MAPVIEW = 'levels'` y `renderLevels` muestra las tarjetas de nivel (CONTINUAR/REPASAR, progreso con `levelStats`). En el camino, `pathBuddy` pone a Pandi junto a la 3.ª y la 7.ª lección de cada unidad. Es el Pandi de la imagen original separado en capas sin costuras (`icons/pandi/`: `base`, `arm`, `strap`, `head`, `mouth`; se generan con `tools/pandi/capas.cjs` desde `tools/pandi/pandi-original.png`, ver su LEEME). `pandiRig(b)` las apila en un dibujo de 266×343 achicado con `transform:scale`: `.pr-arm` (brazo levantado y lo que sostiene, `.pr-hold`) gira en el hombro, `.pr-head` en el cuello, `.pr-mc` es la boca cerrada (hablar, masticar, cantar, dormir) y `.pr-lid` los párpados en CSS. El brazo del bambú y las piernas no se mueven por separado (destaparían demasiado). Animaciones en `BUDDY`: spin, bounce, read, munch, wave, float, juggle, sing, sleep. Ya no hay saludo arriba del mapa ni tarjeta de unidad: la primera unidad va en el encabezado y las demás llevan `.unit-div`. `openCount` no cuenta `_level`.
   - **Voz:** `voiceScore` prefiere voces naturales o de niño (Ana) y castiga las de hombre; `say(texto, lento, alTerminar)` habla más agudo (1.35). El niño puede escoger la voz en *Probar audio* (`localStorage` `pandi-voice`).
   - `COURSE_VER` (hoy 7; la 7 cambia seis instrucciones de escena que daban la respuesta en español) va dentro del curso (`course.ver`). `upgradeCourse()` agrega a cursos viejos las palabras y unidades que falten (las de Nivel 1 antes del Nivel 2), cerradas, sin tocar lo editado. Al pasar a la versión 5 quita el Nivel 1 provisional (`u1`…`u5` sin `level`), abre en su lugar la Bienvenida y el Alfabeto en los grupos que lo tenían y saca de las tareas sus lecciones; corre en `migrate()` (demo) y en `remoteLoad()` (el admin lo sube al servidor).
4. **Tipos de ejercicio (`items`):** `flash`, `pickword`, `listen`, `match`, `write`, `speak`, `order`, `fill`, `memory`, `tip`, `read`. `toStep()` convierte cada item en un paso jugable y `buildSteps()` arma la lección (las opciones incorrectas salen de palabras de la misma lección o unidad).
   - **Juegos por lección:** `buildSteps` pasa los pasos por `toDecks` (3 o más `flash` seguidos → un paso `deck` de cartas para voltear, hasta 8) y `assignGames`, que pone `game` según `GAMES` (`listen`: basket/cups; `pickword`: goal/chests; `order`: train; escenas find/number: parade/rain/moles) sin repetir ningún juego en la lección, y cambia una segunda `memory`/`match` por el otro tipo. Los juegos de listen/pickword están en `GAME_R`; el paso fallado se repite al final con `game:null`. Ojo: en `order`, `extra` son palabras de relleno; la etiqueta de reto usa `s.extra === true`.
   - **Regla del dueño: ninguna pantalla se pasa sin demostrar lo aprendido.** Nada llama `ctx.cont()` sin que el niño haya respondido algo; los pasos de solo mirar o escuchar terminan con una pregunta. Si agregas un tipo de paso, pruébalo tocando solo «Siguiente», las bocinas y las cartas: el botón no debe quedar en «Continuar».
   - **Cuentos y cantos animados:** `SCENE_MODES.story`/`chant` (en el `Object.assign` posterior; el `chant` del primer objeto ya no se usa) se juegan en `stage(bg)`: actores que entran y hablan, globo que se escribe solo (`show(..., shown)` puede mostrar la frase con `___`; `reveal` pone la completa), dibujos de `vocabIn(texto)`. `storyBeats` reparte el cuento en globos y elige quién habla. `withQuiz` (dentro de `buildSteps`) pone en el paso `blanks` (`inlineBlanks`: hasta 3 frases para completar dentro, o un «¿qué dijo?») y `qAt` (¿Quién dijo esto? a la mitad); sin responder no se avanza, y al final la escena llama `end()` (como las demás escenas). Tras el cuento agrega un paso `who` y un `fill` con `from:'cuento'` de una frase que no se completó adentro. A cada `tip` le pone `quiz` (`fill` con `from:'mini'`, `pickline` u `order`); si se falla, `grade` repite solo `s.quiz`.
   - **Mini clase (`R.tip`):** esconde el botón hasta que se toca la bocina de cada frase; luego muestra «Ahora tú» con `R[s.quiz.t]`.
   - **Palabra nueva (`R.flash`):** tras escuchar, la tarjeta se esconde y hay que tocar su dibujo (`s.options`, de `toStep`). **Cartas (`R.deck`):** voltear todas y luego encontrar la carta de cada palabra (hasta 6); con 2 fallos o más el paso se repite.
   - **Voces de personajes:** `say(texto, lento, alTerminar, personaje)` y `audioBtn(texto, lento, grande, personaje)`. `CAST_KIND` da el tipo (boy, girl, man, woman, robot, monkey, dragon) y `castVoice` busca una voz femenina o masculina (`FEM_RE`/`MALE_RE`) con su tono; si no hay, usa otra voz con otro tono (`alt`). Un personaje nuevo va en `CAST_KIND`. En «¿Quién lo dijo?» la frase se oye con la voz normal (si no, la voz daría la respuesta).
   - **Sin traducciones para el niño:** el profe no quiere el significado en español. Nada que vea el estudiante muestra `V[w].es`, las traducciones de cantos, cuentos o lecturas. En la mini clase solo sale (con 💡) la línea que `tipHint` reconoce como pista de pronunciación o gramática. Las instrucciones (`s.es` de las escenas, `PROMPTS`) sí van en español, pero no deben decir la respuesta. El panel del profe sí muestra `es`.
5. **data:** objeto global `DB` = `{users, progress, groups, assignments, friends, course, courseVer, session, seq}`.
   - `progress[userId]` = `{xp, xpDays:{fecha:xp}, done:{lessonId:estrellas}, days:[fechas], medals, spoken, miss:{palabra:errores}, gems, owned:[ids de la tienda], freezes, frozen:[fechas salvadas], claimed:{premios cobrados}, avatar:{v:2, skin, hair, hc, eyes, mouth, top, tc, head, face, bg}, avatarAsked, hw:{assignmentId:{text, sentAt, note, grade, reviewed, reviewedAt, history:[{at, from, to, reason}]}}}`.
   - `friends[]` = `{from, to, status:'pending'|'accepted'}`. En modo servidor se leen de `friendships` y se cambian al momento con `friendOp` (no pasan por `doSync`).
   - `groups[]` = `{id, name, open:{unitId:bool}}`. Cada grupo abre sus propias unidades.
   - `assignments[]` = `{id, title, due, lessons:[ids], writing:{title,prompt}|null, groups:[ids]}`.
   - `P(extra)` arma el progreso y usa cada campo conocido solo si tiene el tipo esperado (ignora `__proto__`): el progreso de otros estudiantes llega del servidor tal como ellos lo escribieron.
   - `save()` guarda: en modo demo en `localStorage` (clave `pandi-english-v2`); en modo servidor programa `scheduleSync()`.
   - `migrate()` actualiza datos viejos de `localStorage`. Si cambias el contenido semilla, sube `courseVer` y agrega la migración.
6. **ligas, gemas, tienda, desafíos, repaso y celebraciones:** semanas de lunes a domingo (`mondayOf`, `xpInWeek`). `leagueOf(p)` calcula la liga a partir de `xpDays` (sube con 150 XP y baja con menos de 30). `claimWeekly` cobra una sola vez los premios de la semana pasada (liga y desafíos con amigos). `applyFreezes` usa los protectores de racha. `startReview` (repaso con `S.miss`; los aciertos lo bajan), `celebrate`/`fanfare` (confeti y sonido, sin voz) y `downloadGrades` (xlsx real hecho a mano: `zipStore`, `buildXlsx`; nombre de archivo sin tildes).
7. **recordatorios:** `remindCard` y `remCheck`: notificación local diaria, con la hora guardada en `localStorage`.
8. **audio:** `say(texto, lento)` usa la mejor voz en inglés (`voiceScore`); `sfx(ok)` hace sonidos con WebAudio; `unlockAudio` desbloquea en el primer toque; `speechScore` compara la voz del niño con tolerancia; `audioTestSheet` sirve para probar sonido y micrófono.
9. **login & routing:** `route()` decide entre login, `#home` (estudiante) o `#admin`. `U` es el usuario actual y `S` su progreso.
    - **Avatar (personaje SVG por capas):** `AV` tiene las listas de piel, pelo, colores, ojos, boca, ropa (`top`), cabeza (`head`: gorros y capuchas) y lentes (`face`). `avatarSVG(a)` dibuja en orden: fondo → capucha atrás → pelo de atrás → cuello y ropa → orejas y cabeza → cara → pelo de adelante (metido bajo gorra, gorro, pañoleta o birrete) → borde de la capucha → gorro → lentes. Así las prendas quedan puestas. `avNorm` valida todo contra las listas (el SVG nunca lleva texto del usuario). Prendas con `cost` se compran sueltas (`owned` `cat:id`); los trajes (`set`: panda, oso, conejo) dan capucha y sudadera (`set:panda`). `AV_PRESETS` son los 8 personajes listos de `avatarWelcome` (primera vez). Editor: `avatarEditor`; tienda: `shopSheet`; compra: `buySheet`/`buyAvItem`. Los avatares viejos (`{a,c,x}`) se ignoran y se vuelve a ofrecer la bienvenida.
10. **student app:** `renderMap`, `renderWork` (tareas), `renderRank` (ranking por grupo; semana o total), `renderMe` (perfil, medallas, `avatarSheet`, `friendsCard`/`addFriendSheet`, racha de amigos `pairStreak`). `avatar(u)` dibuja el avatar elegido o la inicial.
11. **admin panel:** `renderSum` (+ `missedCard`: palabras más falladas; tocar una abre `whoMissedSheet` con quién la falla), `renderStudents` (+ `groupSheet`, `addStudentSheet`, `studentSheet`), `renderHW` (+ `renderAssignment`, `assignmentSheet`). Reportes por WhatsApp: `shareSheet`, `reportSheet`, `remindSheet`. Calificación: `gradeForm`, `gradeView`, `editGradeSheet` (editar exige motivo y guarda historial). `groupBar()` es el selector de grupo y `curGroup()` el grupo activo.
12. **content editor:** `renderContent` → `renderUnitEd` → `renderLessonEd` → `exerciseSheet`; banco de palabras con `renderWordsEd` y `wordSheet`. Se reordena con flechas (`move`). `lessonSheet` puede generar ejercicios automáticos (`autoItems`). Con "Probar lección" se juega en modo vista previa, sin guardar.
13. **real backend:** solo actúa si `window.PANDI_CONFIG` tiene `supabaseUrl` y `supabaseAnonKey` (`REMOTE = true`).
    - `remoteBoot` → `remoteLogin` → `remoteLoad` traen todo a `DB`.
    - `doSync` compara `DB` con la última copia (`SNAP`) y sube solo lo que cambió (curso, grupos, tareas, perfiles, progreso propio, entregas).
    - `adminCall` llama a la Edge Function.
    - `maybeRefresh` recarga los datos al cambiar de pestaña (cada 20 s como máximo).
14. **lesson engine:** `startLesson(unit, lesson, preview)`, `renderStep`, `grade` (lo que se responde mal se repite al final), `finishLesson` (XP, estrellas, medallas, racha). Los dibujantes de cada tipo de ejercicio están en el objeto `R`.

### Modo demo vs. modo servidor

- **Demo** (`config.js` vacío, y siempre en la vista previa de claude.ai): los datos viven en `localStorage`. Trae cuentas de ejemplo (`estudiante`/`1234`, `admin`/`admin123`, y compañeros marcados `example:true`) y "Reiniciar demo".
- **Servidor:** Supabase Auth con usuario y contraseña. Internamente cada usuario usa el correo `usuario@alumnos.pandienglish.app` (sin envío de correos) y la contraseña debe tener al menos 6 caracteres. Las cuentas las crea el admin con la Edge Function; no hay registro público.

## Supabase

- **Tablas:** `friendships` (amistades entre compañeros del mismo grupo; `from_id` envía, `to_id` acepta), `schools`, `profiles` (id = auth.users.id; role admin|student; username único global; group_id), `groups`, `courses` (jsonb con vocab + units por escuela), `assignments`, `progress` (jsonb por estudiante, sin `hw`), `submissions` (una fila por tarea y estudiante, con `note`, `grade` 0-100 e `history`).
- **Funciones:** `my_school()`, `is_admin()`, `my_group()`, `is_classmate(id)`, `class_ranking()` (ranking del grupo con avatar, sin exponer datos privados; revisa el tipo de cada campo del progreso, porque lo escribe el estudiante) y `revoke_user_sessions(uid)` (borra `auth.sessions` de una cuenta; solo `service_role`, la usa la función al cambiar contraseñas). El trigger `guard_submission` impide que un estudiante se ponga nota, calificación o historial, o se marque revisado. **Ojo:** el admin solo puede hacer `update` en `submissions` (un `upsert` cuenta como insert y RLS lo rechaza).
- **RLS:** el estudiante ve solo lo suyo y el ranking de su grupo. El admin ve y edita solo su escuela, y no puede cambiar roles ni el progreso de los niños. Al aceptar una amistad solo cambia `status` (permiso por columna) y nadie puede cambiar de quién es una entrega (`guard_submission` + llave `submissions_user_school_fk`). `class_ranking` solo pasa fechas válidas y recientes de `xpDays`, y `leagueOf` mira como mucho 104 semanas. Un estudiante solo puede entregar tareas que existen en su escuela, el panel del profe trae las filas de a 1000 (`allRows`, porque Supabase corta en «Max rows» = 1000) y el trigger `pandi_block_email_change` no deja cambiar el correo de una cuenta con perfil. Las contraseñas tienen mínimo 8 caracteres (`MIN_PW` en la función). Hay 51 casos probados en `tests/rls`. Cuando cambies `schema.sql`, el dueño debe volver a correrlo en el SQL Editor de Supabase.
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
- Los datos nuevos del progreso (gemas, liga, etc.) viven en `progress.data` (jsonb), así que no requieren cambiar el esquema. Si la app depende de una tabla nueva, cárgala de forma tolerante (si falta, sigue funcionando).
- **La app no habla sola:** `say()` solo se llama desde botones que toca el usuario (bocina, Probar sonido). Nada de saludos ni frases automáticas.
- `append()` está parcheado para ignorar `null`/`false`, así un `cond ? h(...) : null` nunca pinta "null".
- Las hojas emergentes usan `sheet(...)`, las confirmaciones `confirmSheet(...)` y los avisos `toast(...)`. Nunca `alert`, `confirm` ni `prompt`.
- Los textos visibles van en español claro. Los errores dicen qué pasó y cómo arreglarlo.
- Los commits terminan con las líneas de atribución que indique la sesión.
