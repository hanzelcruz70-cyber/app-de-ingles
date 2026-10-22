# Bitácora · Pandi English

Historia del proyecto, decisiones y pendientes. Escribe arriba lo más nuevo. Cada entrada dice qué se hizo, por qué y qué quedó pendiente.

---

## Estado actual (resumen rápido)

- **App:** completa en modo demo y con backend Supabase listo. Tiene los **niveles 1, 2, 3 y 4 según los libros** (408 lecciones con escenas y Retos de Pandi), 11 tipos de ejercicio, grupos, tareas semanales con calificación, ranking por grupo, medallas, editor de contenido y banco de palabras.
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

## 2026-10-22 (3) · Las 3 pistas que dependían de Supabase, cerradas
- **Lo que el dueño vio en Supabase:** «Max rows» = 1000; «Secure email change» activado; límite de inicio de sesión 30 cada 5 min por IP; Email provider activado (lo necesita el login); sin SMTP propio; no hay dominio para Pandi ni se piensa usar. El dueño ya corrió el `schema.sql` de la entrada (2).
- **Entregas basura (aplicaba por el límite de 1000):** un estudiante solo puede entregar tareas que existen en su escuela (`submissions_own_insert` revisa `assignments`), así que no puede crear miles de entregas inventadas. Además el panel del profe trae perfiles, progresos y entregas de a 1000 (`allRows`) y ya no se corta. Pruebas: RLS 7d; con un Supabase falso, 2500 entregas llegan completas en 3 partes.
- **Cambio de correo:** con «Confirm email» apagado, «Secure email change» probablemente no frena el cambio. Ahora el trigger `pandi_block_email_change` en `auth.users` no deja cambiar el correo de ninguna cuenta con perfil de Pandi (la app nunca cambia correos). Si Supabase no deja crearlo, el `schema.sql` sigue igual y muestra el aviso «Pandi: Supabase no dejó crear el bloqueo…». Pruebas RLS E1 y E2.
- **Contraseñas de mínimo 8 caracteres** (antes 6) en la función (`MIN_PW`), en el panel del profe, en `setup.html` y `owner.html`; la guía y el README dicen 8. Las contraseñas viejas siguen funcionando. El límite de 30 intentos es por IP, no por cuenta, por eso se subió el mínimo.
- **Correo `@alumnos.pandienglish.app`:** hoy no es un riesgo, porque el SMTP de Supabase solo manda correos a los miembros del equipo. **Regla: nunca activar un SMTP propio** mientras las cuentas usen ese dominio.
- **Pruebas en el entorno aislado:** RLS **51/51 PASS**, `schema.sql` se puede correr dos veces seguidas, la función responde bien con 8 caracteres.
- **Para que funcione en la app real:**
  1. Correr de nuevo `supabase/schema.sql` en el SQL Editor y fijarse en el aviso «Pandi: bloqueo de cambio de correo activo».
  2. En Authentication → Policies, poner el mínimo de contraseña en 8.
  3. Publicar: unir `nivel-2` a `main`. Eso publica la app y también la función, porque cambió `supabase/functions/**`.

## 2026-10-22 (2) · Revisión de seguridad completa y sus 3 arreglos
- **Revisión completa** (perfil `standard` de la skill de Cloudflare, 30 agentes, con pruebas reales en el entorno aislado). Informe en `C:\Users\Hanzel\security-audit-skill\pandi-ingles\run-2\REPORT.md`. Resultado: 3 problemas confirmados, 3 pistas que dependen de la configuración de Supabase o del dominio, 1 descartada (registro público, ya apagado). Los 3 arreglos de la revisión rápida se confirmaron.
- **Ranking congelado (media):** un estudiante podía guardar en su progreso una fecha rara (`xpDays` con `-271800-01-01`) y el Ranking de sus compañeros y la exportación del profe se trababan ~40 s. Ahora `P()` deja en `xpDays` solo fechas `AAAA-MM-DD` con un número, `leagueOf` cuenta solo las semanas de los últimos 2 años (`LEAGUE_WEEKS = 104`) y `class_ranking()` solo devuelve fechas válidas de los últimos 730 días. Probado: la fecha rara tarda 1 ms; en la demo, el Ranking con esa fecha y 2000 fechas viejas abrió en 0,2 s.
- **Amistades falsificadas (baja):** al aceptar se podía cambiar quién envió la solicitud o la escuela. Ahora solo se puede cambiar `status` (`grant update (status)`), la solicitud tiene que estar pendiente y quedarse en la misma escuela. Pruebas RLS F8b y F8c.
- **Entrega pasada a otra escuela (baja):** el profe podía cambiar el dueño de una entrega por un niño de otra escuela. Ahora una llave (`submissions_user_school_fk`) obliga a que el estudiante sea de la escuela de la entrega, y `guard_submission` no deja cambiar de quién es, de qué tarea ni de qué escuela. Pruebas RLS G4 y G5.
- **Pruebas:** RLS **48/48 PASS**, `schema.sql` se puede correr dos veces seguidas sobre una base con datos, la función `admin-users` responde igual que antes.
- **Para que funcione en la app real:** correr de nuevo `supabase/schema.sql` en el SQL Editor y publicar (unir `nivel-2` a `main`). La función no cambió.
- **Pendiente del dueño (solo mirar en Supabase):** SMTP y magic link/recuperación (Authentication → Emails y Sign In / Providers → Email), «Secure email change», «Max rows» (Project Settings → Data API) y el límite de intentos de inicio de sesión (Authentication → Rate Limits).

## 2026-10-22 · El Pandi real se mueve, entorno aislado y publicación
- **Publicado:** la rama `nivel-2` se unió a `main` y está en GitHub Pages (niveles 1 a 4, juegos, mapa nuevo, arreglos). La función `admin-users` (cierre de sesiones al cambiar contraseña) está publicada en Supabase y el dueño corrió el `schema.sql` nuevo. El push se hizo con la cuenta `hanzelcruz70-cyber` de `gh` (la credencial de git de esta PC es otra cuenta sin permiso).
- **Supabase:** el dueño apagó el registro público («Allow new users to sign up») y el envío de correos está apagado. Las cuentas se siguen creando igual: escuelas en `setup.html` y estudiantes desde el panel del profe (la función usa la llave de servicio). El dominio `pandienglish.app` no es del dueño: sin correos no hay riesgo hoy; a futuro conviene un dominio que no reciba correo.
- **Entorno aislado para pruebas** (pedido para la revisión completa): en Ubuntu (WSL) de esta PC, `C:\Users\Hanzel\security-audit-skill\sandbox\sandbox.sh`: sin red, entorno vacío, proyecto y sistema en solo lectura, solo escribe en su carpeta, usuario sin privilegios, memoria 2 GiB (cgroup), 200 procesos, límites de archivo y tiempo; `check-sandbox.sh` verifica cada control. `promote.py` copia evidencia como pide la skill. Node 18 y Postgres 16 instalados en Ubuntu. **Por primera vez corrieron las pruebas RLS: 43/43 PASS** (incluidas 4c, 4d y 4e) y las de la función.
- **El Pandi real se mueve:** el dueño mandó la hoja con las partes del personaje (`tools/pandi/pandi-partes.png`). Se recortaron 20 piezas sin fondo y sin halo (`tools/pandi/cut.cjs`), se quitaron los brazos del torso y se redujeron al 40 % (`export.cjs`, 151 KB en `icons/pandi/`). `pandiRig` arma a Pandi y cada parte se anima: parpadea, mueve la cabeza, abre la boca, mueve los brazos y las piernas; sostiene el mundo, la pelota, el libro o el globo en la mano levantada; se lleva el bambú a la boca; duerme con los ojos cerrados. Reemplaza al Pandi dibujado en SVG.
- **Pruebas:** los 9 Pandis se mueven y cargan todas las piezas; en los 4 niveles a 390 y 320 px no tapan lecciones ni se salen.
- **Cambio, mismo día:** el dueño vio que el Pandi por piezas parecía rompecabezas (las piezas de la hoja tienen otra luz y otros bordes). Se rehízo con la **imagen original** (`tools/pandi/pandi-original.png`): `tools/pandi/capas.cjs` saca 5 capas (base, brazo levantado, tirante, cabeza y boca cerrada), rellena lo escondido con pelo de la misma imagen (cuello bajo la barbilla, hombro) y reparte las capas al tamaño final para que ninguna unión deje ver el fondo. Se compararon poses ampliadas al 300 % contra el original hasta que no quedaron líneas ni pedazos sueltos. Párpados en CSS del mismo negro de las manchas. Se mueve un poco menos (el brazo del bambú y las piernas quedan fijos) pero no se ven costuras. 179 KB.

## 2026-10-21 (7) · Arreglos de la revisión de seguridad
- Se corrigieron en el código 3 de los 5 puntos por validar (los otros 2 dependen de la configuración de Supabase y del dominio).
- **Ranking:** `class_ranking()` revisa cada campo del progreso antes de usarlo; un `xp` que no es número entero (o es enorme) cuenta como 0 en vez de romper el ranking de todo el grupo. Si el ranking falla igual, el estudiante puede entrar (solo no ve a sus compañeros). Pruebas RLS nuevas 4c y 4d.
- **Datos de progreso raros:** `P()` usa cada campo conocido solo si tiene el tipo esperado e ignora `__proto__`, así un `days` como texto no rompe las pantallas de compañeros ni del profe (era la unidad pendiente de la revisión).
- **Cerrar sesión sin internet:** si el servidor no responde, se borra igual la sesión guardada en el dispositivo (`signOut({scope:'local'})` y la llave `sb-…-auth-token`). Probado con un Supabase falso que falla.
- **Cambiar contraseña:** `owner_reset_admin_password` y `reset_password` cierran después todas las sesiones de esa cuenta con la función nueva `revoke_user_sessions` (solo la llave de servicio puede usarla; prueba RLS 4e). Un token que ya estaba emitido sigue valiendo hasta que vence (1 hora por defecto en Supabase). Pruebas de la función: todas pasan.
- **Para que funcione en la app real:** correr de nuevo `supabase/schema.sql` en el SQL Editor y publicar la función (push a `main` con cambios en `supabase/functions/**`). Las pruebas RLS no se pudieron correr aquí (no hay Postgres).
- **Sin commit todavía.**

## 2026-10-21 (6) · Pandi se mueve de verdad
- El dueño mandó un video de Duolingo: el personaje gira una pelota en el dedo, mueve los brazos, la cara y el cuerpo. Pandi (una imagen fija) solo flotaba con cosas moviéndose al lado.
- **Pandi por partes (`pandiSVG`):** ahora se dibuja en código con cabeza, ojos que parpadean, boca, brazos, piernas y bufanda, y cada parte se anima: gira el mundo en un dedo, rebota una pelota, lee y pasa la página, come bambú y mastica, saluda, flota con un globo pataleando, hace malabares, canta y duerme. Al tocarlo salta con los brazos arriba.
- **Se quitó** el saludo de Pandi arriba del mapa y la tarjeta grande de cada unidad (repetía lo de la franja). Las unidades siguientes se separan con una línea con su nombre y avance.
- **Pruebas:** los 9 Pandis se mueven (brazos, cabeza o cuerpo cambian con el tiempo); en los 4 niveles a 390 y 320 px no tapan lecciones ni se salen.
- **Sin commit todavía.**

## 2026-10-21 (5) · Mapa al estilo Duolingo y Pandi animado en el camino
- Pedido del dueño, con capturas de Duolingo: arriba del camino que diga el nivel y la lección, que se pueda volver a los niveles anteriores tocándolo, y un personaje animado en el camino para que no se vea vacío.
- **Encabezado fijo:** franja del color de la unidad, pegada debajo de la barra de arriba: «‹ NIVEL 2, UNIDAD 1 · My toys» y «📚 Niveles». Cambia sola al bajar a otra unidad. Reemplaza las pestañas de nivel.
- **Pantalla de niveles:** «← Regresar» y una tarjeta por nivel que el niño puede ver (su nivel con CONTINUAR, los anteriores con REPASAR), con barra de progreso o ¡COMPLETADO!. Los niveles que no le tocan siguen sin aparecer.
- **Pandi animado:** junto a la 3.ª y la 7.ª lección de cada unidad, en el hueco del zigzag, Pandi gira un globo terráqueo, rebota una pelota, lee, come bambú, flota con un globo, hace malabares, canta o duerme (cambia por unidad). Al tocarlo salta y dice una frase de ánimo. Con «reducir movimiento» del teléfono se queda quieto.
- **Bug encontrado al probar:** el encabezado usaba la clase `nav`, que ya existía para la barra de abajo, y salía corrido a la izquierda. Se cambió a `navable`.
- **Pruebas:** en el navegador, los 4 niveles a 390 y 320 px: Pandi nunca tapa una lección ni se sale de la pantalla y nada se desborda; el encabezado cambia de unidad al bajar; CONTINUAR y REPASAR abren el nivel correcto.
- **Sin commit todavía.**
- **Skill de seguridad instalada** (pedido del dueño): `security-audit` de Cloudflare (https://github.com/cloudflare/security-audit-skill, commit `c1c8a8c`) en `.claude/skills/security-audit/` (origen en `ORIGEN.txt`). Sus validadores solo leen archivos. En Windows sus comandos `validate-*.cjs` no corren (piden una protección de archivos que Windows no tiene); se pueden usar llamando a `validateDocument` desde un script. Se corrió el 21 de octubre (perfil rápido, solo lectura de código, 15 agentes): 0 hallazgos confirmados y 5 por validar (sesiones que no se cierran al cambiar contraseña, registro público de Supabase, dominio de correo interno, cierre de sesión sin internet y `xp` no numérico que rompe `class_ranking`). Reporte en `C:UsersHanzelsecurity-audit-skillpandi-inglesun-1REPORT.md`.

## 2026-10-21 (4) · Ninguna pantalla se pasa sin demostrar lo aprendido
- El dueño: «no quiero ninguna lección que simplemente se pueda pasar sin demostrar que aprendieron». Una prueba automática encontró 4 pantallas que se pasaban sin responder nada: palabra nueva, mesa de cartas, canto y cuento (el cuento terminaba solo tocando «Siguiente» seguido).
- **Palabra nueva:** se escucha y luego la tarjeta se esconde: *«Ahora tú: toca el dibujo de…»* con 3 dibujos.
- **Mesa de cartas:** después de voltearlas se tapan las palabras, se revuelven y hay que encontrar la carta de cada palabra (hasta 6, y al menos 4 rondas; todas las cartas siguen en juego). Con 2 fallos o más (por ejemplo tocando todas) se repite al final.
- **Cuento:** hasta 3 globos salen con una palabra en blanco (*Completa lo que dice…*) y el «¿Quién dijo esto?» de la mitad. Sin responder, «Siguiente» no avanza. **Canto:** hasta 3 líneas para completar; la lista de abajo solo muestra lo ya cantado (antes daba la respuesta). Si un cuento o canto no tiene palabras para completar, se pregunta qué frase dijeron.
- **Bug:** en cuentos con 5 personajes, «¿Quién dijo esto?» mostraba solo 4 y a veces dejaba fuera al correcto (n1u8l5, n3wl2): el niño se quedaba trabado. Ahora la respuesta siempre está.
- **Quién habla:** en un globo con dos personajes, el que es nombrado en la frase no es el que habla («What is it, Aunt Fifi?» lo dice Beth).
- **Voces por personaje** (el dueño: el niño y la niña tenían la misma voz): niñas con voz femenina aguda, niños con voz masculina aguda (o, si el equipo solo tiene una voz, con otro tono), adultos normal, robots grave, monos muy aguda y el dragón grave. `CAST_KIND`/`castVoice`. Depende de las voces del equipo: esta PC tiene David, Mark y Zira.
- **Mini clase repetida:** si se fallaba la pregunta, al final volvía toda la mini clase (el dueño la vio dos veces). Ahora se repite solo la pregunta.
- **Pruebas:** en el navegador las 3514 pantallas de los 4 niveles: ninguna se pasa sin responder (ni tocando «Siguiente» o la bocina muchas veces), sin errores ni desbordes a 390 px; y jugando bien se terminan todas las palabras nuevas, cartas, mini clases, cantos y cuentos.
- Queda una excepción a propósito: en *Escucha y repite*, si el micrófono no funciona aparece «Ya lo dije en voz alta».
- **Sin commit todavía.**

## 2026-10-21 (3) · Cuentos animados, mini clase con práctica y sin traducciones
- La sesión anterior se cortó a medias (error de acceso de Claude Code). Se retomó y se terminó lo que faltaba.
- **Tren:** la locomotora ahora va adelante y los vagones detrás (antes los vagones iban delante).
- **Desfile, lluvia y topos:** no salen dos dibujos iguales al mismo tiempo ni uno encima de otro.
- **Cuentos animados** (pedido del dueño: el cuento era una imagen quieta). Inspirados en los cuentos de Duolingo: escenario con fondo, los personajes entran y salen caminando, el que habla se mueve, saltan con «!», se inclinan con «?», la pantalla tiembla con «Oh no!», el globo se escribe solo y flotan los dibujos de lo que se dice. A la mitad, «¿Quién dijo esto?». Los **cantos** usan el mismo escenario.
- **Preguntas después del cuento y del canto:** ¿Quién lo dijo? (solo frases que el personaje dice de sí mismo) y completar una frase. Las opciones empiezan todas igual (mayúscula o minúscula), para que la letra no delate la respuesta.
- **Mini clase con práctica** (el dueño: «solo escuchar es inútil, se podía pasar sin hacer nada»). Hay que escuchar cada frase y luego responder: completar una frase (104 mini clases), tocar la frase que se escucha (24, las de fonética y reglas) u ordenar la frase (3, las de una sola frase). Si falla, se repite al final como cualquier ejercicio.
- **Sin traducciones** (pedido del profe: pistas sí, significado no). Se quitó el español de tarjetas, mesa de cartas, ¿cómo se dice? (y penal/cofres), escribe la palabra, arma la palabra, respuestas correctas, cantos, globos de los cuentos, lecturas («Ver en español») y mini clases. En la mini clase quedan con 💡 solo las 55 líneas que explican pronunciación o gramática (`tipHint`). Seis instrucciones de escena que daban la respuesta en español ahora dan la pista en inglés («Lee y toca: …»); las escuelas existentes las reciben con `COURSE_VER = 7`. El profe sigue viendo la traducción en el banco de palabras.
- **Pruebas:** en el navegador las 3677 pantallas de los 4 niveles sin errores, sin desbordes a 390 px, sin juegos repetidos y sin ningún significado en español; se jugaron los tres tipos de mini clase (mal y bien) y se probó la actualización de un curso de versión 6.
- **Sin commit todavía.**

## 2026-10-21 (2) · Nivel 4 según el libro
- El dueño mandó el libro del **Nivel 4** (*Discovery Studios*). Quedó: Bienvenida (5), 8 unidades de 10 lecciones (Free time, Wild animals, The seasons, My week, Jobs, In the rain forest, Feelings, By the sea), 3 *Wider World*, 4 repasos de 2, Despedida (3) y Festivales (Halloween y Día de la Madre): 101 lecciones. Cuentos, cantos y canciones con texto propio (la historia del guion que se roba Coco).
- Personajes dibujados en código: Oliver, Sophie, el tío James, Finley Keen y Coco (mono, con otros colores que Ola). Los Retos de Pandi usan a Oliver, Sophie, Coco y el tío James.
- **Escuelas existentes** (`COURSE_VER = 6`): reciben el Nivel 4 completo y cerrado, sin tocar lo editado.
- No se pudo leer una página (Unidad 8, lección 3: fond of, crazy about…); se armó con el vocabulario y la gramática del índice del libro.
- **Pruebas:** revisión de datos sin problemas (784 palabras, las 408 lecciones de los 4 niveles con escena); en el navegador se dibujaron los 840 pasos del Nivel 4 (314 retos) sin errores, nada se desborda a 390 px y se probó la actualización de un curso de versión 5.
- **Atrapa la burbuja rehecho** (lo pidió el dueño: las burbujas solo se mecían en su lugar). Ahora suben desde abajo, van de lado a lado, rebotan en las orillas y entre ellas, se renuevan al salir por arriba, cada ronda es más rápida, revientan con ✨ y arriba se ven las 3 rondas. La palabra buscada siempre está presente y no se repiten dibujos. Probado en el navegador: 3 rondas completas, sin repetidos, modo claro y oscuro.
- **Cuento antes de tiempo (lo encontró el dueño en Toys, Nivel 2):** «Verdadero o falso» y «Ordena el cuento» usaban el cuento de la unidad aunque el niño no hubiera llegado a esa lección. Ahora solo usan cuentos de lecciones hasta la actual (revisadas las 408 lecciones: ninguna antes de tiempo).
- **Escucha y toca menos repetitivo:** el dueño dijo que se repetía demasiado. Ahora esas escenas se turnan entre el dibujo del libro (56) y tres juegos animados: Desfile (45), Lluvia de dibujos en paracaídas (62) y Topos (47). Hasta 5 rondas que van más rápido, bandeja con lo atrapado (con número si es de numerar). Probados los tres jugando completo; en el navegador las 4048 pantallas de los 4 niveles sin errores ni desbordes a 390 px.
- **Mapa:** las pestañas de nivel muestran solo los niveles que el niño puede ver (su nivel y los anteriores, o donde ya completó algo); ya no salen los cerrados con candado. Si son más de 4, la fila se desliza de lado.
- **Lecciones menos repetitivas** (pedido del dueño: en Toys el topo salía dos veces): en una lección ningún juego se repite. Juegos nuevos: Canasta y Vasos mágicos (escucha y elige), Penal con Pandi de portero y Cofres del tesoro (¿cómo se dice?), Tren (ordena la oración) y mesa de cartas para voltear (3 o más palabras nuevas seguidas; Toys tenía 7 tarjetas seguidas). Una segunda memoria/unir en la misma lección cambia al otro juego. Lo fallado se repite al final en forma normal.
- **Bug:** todos los «ordena la oración» mostraban la etiqueta «Reto de Pandi» (el campo `extra` del ejercicio se confundía con la marca de reto). Corregido.
- **Pruebas:** en el navegador las 3450 pantallas de los 4 niveles sin errores ni desbordes a 390 px, ningún juego repetido por lección, cada juego nuevo jugado completo (bien y mal).
- **Sin commit todavía:** los niveles 1 y 4 están en la carpeta, sin guardar en git.

## 2026-10-21 · Nivel 1 según el libro
- Se guardó lo anterior en el commit `2b7ab9c` (rama `nivel-2`, sin subir a GitHub).
- El dueño mandó el libro del **Nivel 1** (PDF de 124 páginas). Reemplaza al Nivel 1 provisional. Quedó: Alfabeto (2), Bienvenida (4), 8 unidades de 10 lecciones (My birthday, At school, My family, My body, Pets, My house, Food, I'm happy!), 4 repasos de 2, Despedida (4), Festivales (4: Halloween, Navidad, Día de la Madre y del Padre) y Wider World (4). 108 lecciones; cantos, canciones y cuentos con texto propio.
- Personajes dibujados en código: Harry, Beth, Cody, la tía Fifi y Waldo, el dragón (`dragonSVG`). Los Retos de Pandi ahora salen también en el Nivel 1.
- **Escuelas existentes** (`COURSE_VER = 5`): se quita el Nivel 1 provisional (`u1`…`u5`), los grupos que lo tenían abierto pasan a la Bienvenida y el Alfabeto, y las tareas pierden esas lecciones; las unidades creadas por el profe se conservan. Medallas «Unidad 1» y «Unidad 2» apuntan al Nivel 1 nuevo; «Lector» se gana con cualquier cuento.
- No se leyeron 3 páginas (I can do it de la Unidad 7, segunda página de los repasos 3-4 y 5-6); esas lecciones se armaron con el vocabulario de la unidad.
- **Pruebas:** revisión de datos sin problemas (635 palabras, 385 escenas, las 307 lecciones con escena); en el navegador se dibujaron los 3212 pasos y 902 retos sin errores, se probó la actualización de un curso viejo y nada se desborda a 390 px.

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
