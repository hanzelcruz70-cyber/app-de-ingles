# Bitácora · Pandi English

Historia del proyecto, decisiones y pendientes. Escribe arriba lo más nuevo. Cada entrada dice qué se hizo, por qué y qué quedó pendiente.

---

## Estado actual (resumen rápido)

- **App:** completa en modo demo y con backend Supabase listo. Tiene Nivel 1 con 5 unidades y 28 lecciones (provisional) y **Nivel 2 según el libro** (13 unidades, 94 lecciones), 11 tipos de ejercicio, grupos, tareas semanales con calificación, ranking por grupo, medallas, editor de contenido y banco de palabras.
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
- Ideas propuestas el 12 oct: tienda de accesorios con gemas, ligas semanales, desafío entre amigos, repaso inteligente de palabras falladas, modo clase en vivo (quiz en tiempo real), certificados por unidad, panel para padres con su propio acceso, exportar notas a Excel, vista de un solo estudiante para el profe, sonidos/animaciones de celebración, modo sin conexión completo.
- Mover las fotos del banco de palabras a Supabase Storage. Hoy van en base64 dentro de `courses.data`.
- Usar el micrófono de verdad en la app instalada. En la vista previa de claude.ai no hay micrófono y existe el botón "Ya lo dije".
- Niveles 2 a 6, y que cada grupo tenga su nivel.
- Recordatorios con Web Push desde el servidor (hoy son locales). Empaquetar para Google Play (TWA o Capacitor).

---

## 2026-10-20 (noche, 2) · Retos de Pandi al final de cada lección
- El dueño pidió que las lecciones no sean repetitivas, que se basen en el cuento y tengan algo extra para aprender gramática y divertirse, sin perder la parte del libro.
- **Reto de Pandi:** después de la parte del libro, cada lección de los niveles 2 y 3 suma hasta 3 retos: encuentra el error (gramática, con la regla en español), responde a tu amigo (pregunta y respuesta), verdadero o falso del cuento, ordena el cuento, arma la palabra y atrapa la burbuja. Se arman solos con el contenido de cada lección, así que también funcionan en los niveles nuevos.
- **Pruebas:** 593 retos en 201 lecciones; cada tipo sale entre 87 y 117 veces y casi nunca se repite la combinación seguida. 7 lecciones tienen 1 o 2 retos (hora, rutina y despedida: sin cuento ni palabras sueltas). En el navegador se dibujaron los 2296 pasos sin errores, se resolvió cada tipo de reto y nada se desborda a 375 px.

## 2026-10-20 (noche) · Nivel 3 completo y control de niveles
- **Niveles por grupo:** el profe escoge el nivel de cada grupo en Contenido. Los niveles anteriores quedan abiertos para repasar, los siguientes no se ven y lo que el niño ya avanzó no se le cierra. El mapa tiene pestañas de nivel.
- **Nivel 3** (libro *Space Island*, PDF de 116 páginas): Bienvenida (6), 8 unidades de 10 lecciones, 4 *Wider World*, 4 repasos, Despedida (4) y Festivales (3): 107 lecciones. **Al PDF le faltan las páginas 102 y 103** (Unidad 8, lecciones 7 y 8: texto sobre máquinas que vuelan, proyecto y fonética); no se inventaron. Cuando el dueño las mande, se agregan como `n3u8l7` y `n3u8l8`.
- Cuentos, cantos, canciones y lecturas son textos propios con las mismas palabras y la misma historia (Kim y Katy buscan la planta tifftiff para curar la *tickilitis*). Personajes dibujados en código: Kim, Katy, el capitán Conrad, dos robots y la presidenta Pop. 506 palabras en total.
- Todas las lecciones de los niveles 2 y 3 (201) empiezan con una escena del libro; en el navegador se dibujaron los 1703 pasos sin errores. `COURSE_VER = 4`: las escuelas existentes reciben el Nivel 3 cerrado.
- **Bug corregido:** en los cuentos en viñetas el botón «Continuar» quedaba escondido y el niño no podía pasar de la lección (lo encontró el dueño en la Bienvenida del Nivel 3; también pasaba en el Nivel 2). Ahora el cuento, igual que el canto, muestra «Continuar»; se revisaron los 57 cuentos y cantos.
- El servidor de prueba se configura en `.claude/launch.json` (`pandi-demo`, puerto 4320, script en la carpeta temporal de la sesión).

## 2026-10-20 (tarde) · Lecciones como escenas del libro y voz más alegre
- El dueño comparó la app con la página 6 del libro (el loro de *Look and match*) y mandó un video de la plataforma digital del profe: quiere que cada lección **se parezca a su página**, como escena dibujada e interactiva, con dibujos propios (sin copiar los de Pearson). Se hizo primero una muestra (Bienvenida 1 y 2: amigos en la playa, loro, canto, manchas de colores); al dueño le gustó y pidió el resto con el mismo formato.
- **Motor de escenas** (`t:'scene'`): modos drop, find, number, chant, story (viñetas), pick y sort. Fondos propios por unidad (juguetería, calle, parque, cuarto, granja, noche, cocina, teatro, montaña, playa, aula, papel). Dibujos fijos: los cuatro amigos, el loro, la cara grande (Unidad 4), las manchas de pintura y el saludo.
- **Las 94 lecciones del Nivel 2** empiezan con la actividad de su página: 127 escenas (28 find, 34 number, 22 drop, 18 cantos/canciones, 8 cuentos en viñetas, 7 pick, 10 sort). Los ejercicios que ya tenían (hablar, ordenar, completar, lectura) siguen después.
- **Voz:** al dueño no le gustó. Ahora se prefieren voces naturales o de niña (Ana en Edge), se evitan las de hombre, el tono es más agudo y alegre, y en *Probar audio* cada niño escoge la voz de su teléfono. En la PC del dueño solo hay voces de Windows sin conexión (Zira, David, Mark), que siguen sonando robóticas; quedó Zira.
- **Pruebas:** revisión de datos (palabras e imágenes existen, sin dibujos repetidos en una escena) y en el navegador a 390 px se dibujaron los 936 pasos sin errores; se jugó la lección 1 completa.
- **Pendiente:** si se quiere una voz igual de amigable en todos los teléfonos, hay que grabar o generar los audios (mp3) con una voz de niño y guardarlos con la app; eso necesita decidir el servicio y su costo. Lo demás pendiente sigue igual (pruebas e2e con Python/Playwright y prueba en Supabase real).

## 2026-10-20 · Nivel 2 completo según el libro
- El dueño mandó el libro del **Nivel 2** (PDF escaneado de 100 páginas, llega hasta la página 99: sin Goodbye, Festivals ni diccionario). Pidió que las lecciones sean **las mismas del libro**, sin inventar contenido, pero con diseño propio (sin personajes ni dibujos del libro). Los grupos empiezan en el Nivel 2; el **Nivel 1 actual se queda** hasta que llegue su libro.
- **Decisiones del dueño:** se usan los nombres de los personajes (Charlie, Rose, Ola, Uncle Dan). Cantos, canciones y cuentos son **versiones propias** con las mismas palabras y frases (no se copia la letra ni el diálogo, por derechos de autor, ya que la app se vende).
- **Contenido:** Bienvenida (6 lecciones), 8 unidades de 10 lecciones y un repaso de 2 lecciones cada dos unidades, en el orden del libro. Cada lección sigue su página: vocabulario, canto + *Look!*, vocabulario + canción, gramática, cuento propio, valores, matemática/ciencias/salud, fonética, *I can do it!* y *Have fun!*. 94 lecciones, 847 ejercicios y 218 palabras nuevas (271 en total). Imágenes con emoji; falda, pantalón, rectángulo y pasas son dibujos SVG propios.
- **Código:** unidades con `level` y `tag`; mapa y editor agrupados por nivel; grupo nuevo con **Nivel del grupo**; `upgradeCourse` para escuelas existentes (`COURSE_VER = 3`).
- **Pruebas en esta sesión** (PC del dueño, sin Python ni Playwright): `index.html` se generó con un script de Node equivalente a `build.py` (se verificó que da el mismo archivo byte por byte). Un script revisó que todas las palabras e imágenes existan, que no haya ids repetidos ni dibujos iguales en *Escucha*. En el navegador (modo demo, 390 px) se dibujaron los 847 ejercicios sin errores, se probó la actualización de un curso viejo, el editor por niveles y un grupo de Nivel 2 que solo ve su nivel.
- **Pendiente:** correr `tests/e2e/run.sh` en una máquina con Python y Playwright. La actualización en modo servidor (`remoteLoad`) no se probó contra Supabase real: el admin debe entrar una vez para que el Nivel 2 se guarde en el servidor. Revisar en un celular Android viejo que se vean los emojis nuevos (🪿 no se usó; 🛝, 🫘 y 🐦‍⬛ son de 2021-2022). Libro del Nivel 1 cuando el dueño lo tenga.

## 2026-10-12 (noche, 2) · Personaje dibujado, bienvenida, trajes y quién falla cada palabra
- Al dueño no le gustaron los avatares de emoji. Mandó de referencia ilustraciones planas de niños (pelo, ropa, lentes, audífonos, capucha de panda). Pidió que las prendas queden **puestas de verdad**, no encima.
- **Nuevo avatar SVG por capas** (`avatarSVG`), dibujado a mano en código, sin imágenes externas. Con gorra, gorro, pañoleta o birrete, el pelo queda metido; las capuchas de animal envuelven la cabeza y tapan el pelo. Tiene 6 tonos de piel, 8 peinados, 8 colores de pelo, 4 ojos, 4 bocas, 8 prendas de ropa, 12 de cabeza y 5 lentes.
- **Bienvenida:** la primera vez que entra un estudiante (o si tenía el avatar viejo de emoji), sale "¡Crea tu personaje!" con 8 personajes listos, más "Personalizarlo" y "Ahora no" (`avatarAsked`).
- **Tienda nueva:** trajes de panda, oso y conejo (60 💎, dan capucha y sudadera), gorros, lentes y ropa, cada uno con vista previa en el propio personaje y botón "Ponérmelo". También se compra desde el editor tocando algo con 🔒. Se quitaron los accesorios de emoji anteriores.
- En la demo, los compañeros de ejemplo tienen personaje, para que el ranking se vea completo.
- **Palabras más falladas:** al tocarlas, `whoMissedSheet` lista qué estudiantes las fallan y cuántas veces, con acceso a su ficha.
- **Bug encontrado al probar:** `migrate()` usaba `prog()` antes de que existiera (pantalla en blanco en un navegador nuevo). Ahora usa `DB.progress`.
- Pruebas actualizadas: `social.js` (bienvenida, compra de gorra en el editor, personaje en el ranking y en el panel del profe), `extras.js` (trajes en la tienda y compra con confirmación) y la prueba de dos dispositivos (el personaje se guarda en el servidor). Las demás pruebas cierran la bienvenida con "Ahora no". Todo PASS.

## 2026-10-12 (noche) · Error al entrar, repaso, ligas, gemas, tienda, desafíos, Excel y celebraciones
- **Bug:** "Entraste, pero no se pudo cargar tu cuenta" al entrar como estudiante. El dueño corrió el `schema.sql` de su carpeta de Documentos, que era una copia vieja (commit 755e60c) sin la tabla `friendships`, y `remoteLoad` fallaba al leerla. Arreglos: la carga de amigos es tolerante (si falta la tabla, sigue sin amigos), se actualizó la carpeta de Documentos y se agregó la **regla 6 en CLAUDE.md: mantener esa carpeta al día con cada cambio**. El servidor simulado ahora da error si falta una tabla, y la prueba verifica que el estudiante igual entre.
- **Legal:** `config.js` ya tiene `legalName: 'Hanzel Gabriel Cruz Escorcia'` y `contactEmail: 'redinformaticatotal@gmail.com'` (datos que dio el dueño).
- **Repaso inteligente:** lección generada con las 5 palabras más falladas (unir, elegir, escribir y escuchar). Cada acierto baja `S.miss[palabra]`. No marca nada en `done`.
- **Ligas semanales:** Bronce, Plata, Oro, Zafiro y Diamante. Se calculan en el cliente a partir de `xpDays` (semanas de lunes a domingo): se sube con ≥150 XP y se baja con <30. Así funciona para compañeros sin cambios en el servidor, porque `class_ranking` ya trae `xp_days`. Subir da 20 💎, una sola vez (`claimed`).
- **Gemas y tienda:** 5 por lección (+3 con 3 estrellas), 10 por tarea, 20 por subir de liga y 10 por desafío ganado. Tienda con 8 accesorios y el protector de racha (40, máximo 2). `applyFreezes` rellena los días faltantes con `frozen` y `streakOf` los cuenta.
- **Desafío entre amigos:** XP de la semana tú contra tu amigo; el lunes, quien ganó la semana anterior recibe 10 💎 (`claimWeekly`).
- **Exportar a Excel:** `.xlsx` real sin librerías (ZIP sin compresión + SpreadsheetML), con las hojas Resumen y Tareas, validado con openpyxl. El nombre del archivo va sin tildes porque Chrome ignora el nombre de descarga si trae acentos.
- **Celebraciones:** confeti y fanfarria (WebAudio, sin voz) al terminar una lección, con medallas, racha, liga y compras. Respeta "reducir movimiento".
- Encabezado del estudiante con 💎; se ajustó para que quepa en 390 px.
- **Pruebas:** nueva `tests/e2e/extras.js`; RLS 40/40; e2e completo PASS.
- **El dueño debe correr el `schema.sql` NUEVO** (el de GitHub o el de su carpeta ya actualizada) para que funcionen los amigos, la nota 0-100 y el avatar en el ranking.

## 2026-10-12 · Calificación editable, avatar, amigos, avisos legales y app sin voz automática
- **Bug real (servidor):** al revisar una tarea salía "No se pudo guardar en el servidor". El admin hacía `upsert` en `submissions`; RLS lo trata como INSERT y el admin no tiene permiso de insertar a nombre del niño. Ahora el admin usa `update`. El servidor simulado de las pruebas e2e también rechaza ese upsert, para que no vuelva a pasar desapercibido.
- **Bug:** salía "null" en el ranking del estudiante (otro `append(..., null)`). Se parcheó `append()` para ignorar `null`/`false` en toda la app.
- **Calificación:** nota 0-100 (opcional) + comentario. Ya revisada, se ve la calificación con su historial. **Editar nota** exige un motivo (mínimo 5 letras) y guarda `history` [{at, from, to, reason}]. El estudiante ve nota, comentario y cambios. Columnas nuevas: `submissions.grade` y `submissions.history`; el trigger impide que el niño las toque.
- **Avatar:** 16 animales (emoji), 7 colores y 8 accesorios; algunos se desbloquean con XP. Se guarda en `progress.avatar`. `class_ranking()` ahora devuelve `avatar` (se hizo `drop function` + `create`, porque cambió lo que devuelve; no toca datos).
- **Amigos y racha de amigos:** tabla `friendships` con RLS. Solo compañeros del mismo grupo (`is_classmate`, security definer, porque el niño no puede leer perfiles ajenos). Solo quien recibe la solicitud la acepta, y cualquiera de los dos puede borrarla. No hay chat. La racha se calcula en el cliente con los días de práctica que ya trae `class_ranking()`. En la demo, las cuentas de ejemplo aceptan solas.
- **Legal:** `privacidad.html` y `terminos.html`, basados en la Ley 787 (Protección de Datos Personales) y su Reglamento (Decreto 36-2012), y en el Código de la Niñez y la Adolescencia (Ley 287). La escuela es la responsable y el proveedor es el encargado. Datos de contacto desde `config.js`. Enlaces en el login y el perfil. Se agregó la casilla obligatoria de autorización del tutor al crear un estudiante, y la aceptación de los términos en `setup.html`. **Recomendado:** que un abogado nicaragüense revise los textos antes de vender.
- **Sin voz automática:** a pedido del dueño se quitó el saludo de voz al entrar, el "Great job!" al terminar y la lectura automática de palabras y opciones. Solo suena al tocar un botón de bocina.
- **Pruebas:** RLS 40/40 (nuevos: G1-G3 calificación, F1-F11 amigos); `tests/e2e/social.js` (avatar, amigos, sin voz, sin "null", autorización); la prueba de dos dispositivos ahora califica, edita con motivo y verifica que el niño vea nota e historial.
- Nueva `docs/LISTA_DE_PRUEBAS.md` con pruebas manuales para el dueño.
- **El dueño debe volver a correr `supabase/schema.sql` en el SQL Editor.** Sin eso, la calificación y los amigos fallan en el servidor.

## 2026-10-11 · Editar lección más visible y mensaje del reporte legible
- El dueño no encontraba cómo editar una lección ya creada (ya se podía tocando la fila). Se agregó un lápiz en cada lección, una nota en la unidad y el título "Editar lección". También se puede mover la lección a otra unidad (selector **Unidad**) y añadirle **+ Ejercicios automáticos** (`autoSheet`).
- En el reporte por WhatsApp el cuadro del mensaje se veía de 2 líneas: `.sheet>div` es una columna flexible con scroll y encogía sus hijos. Ahora tiene `.sheet>div>*{flex-shrink:0}` y el cuadro mide al menos 260 px. El arreglo vale para todas las hojas.

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
