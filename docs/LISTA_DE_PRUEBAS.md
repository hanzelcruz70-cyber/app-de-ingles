# Lista de pruebas · Pandi English

Para revisar la app publicada (con el servidor real) antes de enseñarla o después de cada cambio grande. Usa **dos dispositivos**: uno como profe y otro como estudiante, por ejemplo la computadora y el celular. Marca cada punto cuando funcione. Si algo falla, anota qué hiciste, qué esperabas y qué pasó, y toma captura.

**Antes de empezar**
- [ ] En Supabase → SQL Editor, corriste la versión más nueva de `supabase/schema.sql` (sale *Success*).
- [ ] En GitHub → Actions, los dos procesos ("Publicar en GitHub Pages" y "Publicar función de cuentas") salieron en verde.
- [ ] Abres la app en incógnito o recargas con Ctrl+Shift+R, para no ver una versión vieja.

## 1. Entrar
- [ ] Usuario o contraseña incorrectos → sale el mensaje rojo y no entra.
- [ ] El profe entra con su usuario.
- [ ] Debajo del botón se ven los enlaces a **Términos** y **Aviso de privacidad**, y abren su página.
- [ ] Al entrar, la app **no habla** (no hay voz de bienvenida).

## 2. Profe: grupos y estudiantes
- [ ] Crear un grupo nuevo.
- [ ] Agregar un estudiante **sin** marcar la autorización → pide marcarla.
- [ ] Agregar un estudiante con contraseña de menos de 6 caracteres → avisa.
- [ ] Agregar un estudiante bien → muestra usuario y contraseña. Anótalos.
- [ ] Agregar un estudiante con un usuario repetido → "Ese usuario ya existe".
- [ ] Abrir la ficha del estudiante, cambiarlo de grupo y volverlo a su grupo.
- [ ] Cambiar la contraseña del estudiante desde su ficha.

## 3. Profe: contenido
- [ ] Abrir una unidad para el grupo (interruptor) y cerrarla.
- [ ] Crear una lección con ejercicios automáticos.
- [ ] Editar una lección ya creada (lápiz): título, tipo, moverla a otra unidad.
- [ ] Agregar, editar, duplicar, mover y borrar un ejercicio.
- [ ] **Probar lección** → se juega y al final dice que el XP no se guarda.
- [ ] Banco de palabras: crear una palabra con emoji y otra con foto.

## 4. Profe: tareas
- [ ] Crear una tarea con lecciones y escritura para el grupo.
- [ ] Si eliges una lección de una unidad cerrada → avisa "También se abrió…".

## 5. Estudiante (en el otro dispositivo)
- [ ] Entra con el usuario que creaste.
- [ ] El mapa muestra solo las unidades abiertas de su grupo.
- [ ] Jugar una lección completa. Fallar a propósito una respuesta → se repite al final.
- [ ] Ningún ejercicio habla solo; la voz suena **solo** al tocar el botón de bocina.
- [ ] Ejercicio de hablar: con micrófono funciona; si no responde, en unos 10 segundos aparece "Ya lo dije en voz alta".
- [ ] Al terminar: estrellas, XP y racha. La pantalla no se corta.
- [ ] Salir de una lección a la mitad → pide confirmar y no guarda.
- [ ] **Tareas**: ve la tarea, juega sus lecciones y envía la escritura.
- [ ] **Ranking**: aparece él y sus compañeros de grupo. No sale la palabra "null".
- [ ] La primera vez que entra, sale **¡Crea tu personaje!** → elegir uno y **Usar este personaje**.
- [ ] Perfil → **🎨 Mi avatar** → cambiar pelo, ropa y colores. Ponerle una gorra: se ve **puesta** sobre la cabeza, no encima. Lo que tiene 🔒 pide comprarlo.
- [ ] El avatar nuevo se ve en el perfil y en el ranking.
- [ ] Recordatorio: activarlo (pide permiso), cambiar la hora y apagarlo.
- [ ] Cerrar sesión y volver a entrar → el progreso sigue ahí.

## 5b. Gemas, ligas y repaso
- [ ] Al terminar una lección sale confeti, suena una fanfarria (sin voz) y dice cuántas gemas ganaste.
- [ ] Las gemas 💎 se ven arriba y suben.
- [ ] Perfil → **💎 Tienda** → comprar el **Traje de panda** → **Ponérmelo** → el personaje lleva la capucha y la sudadera de panda.
- [ ] Comprar un **Protector de racha** (máximo 2).
- [ ] Fallar varias palabras en lecciones → en Aprender aparece **🧠 Repaso inteligente** → al acertarlas en el repaso, la lista baja.
- [ ] Ranking → tarjeta **Tu liga** con la barra de XP de la semana.
- [ ] (Lunes) Si la semana pasada hiciste 150 XP o más, subes de liga y recibes 20 💎.

## 6. Amigos (necesitas dos estudiantes del mismo grupo)
- [ ] Estudiante A → Perfil → **+ Agregar** → solo aparecen compañeros de su grupo → **Invitar** a B.
- [ ] Estudiante B → Perfil → ve "Quiere ser tu amigo" → **Aceptar**.
- [ ] Los dos se ven en "Mis amigos". Si los dos practican el mismo día, la racha 🔥 sube.
- [ ] Quitar a un amigo → desaparece para los dos (después de recargar).
- [ ] Cada amigo muestra **⚔️ Desafío de la semana** con los XP de los dos.
- [ ] Un estudiante de **otro** grupo no aparece para invitar.

## 7. Profe: revisar y calificar
- [ ] En el Resumen se ve el avance del estudiante (puede tardar hasta 20 segundos o al cambiar de pestaña).
- [ ] Tareas → abrir la tarea → ver la escritura → poner **nota (0 a 100)** y comentario → **Calificar y enviar**.
- [ ] **No** sale "No se pudo guardar en el servidor".
- [ ] Recargar la página → la calificación sigue ahí.
- [ ] **Editar nota** sin escribir el motivo → lo pide. Con motivo → guarda y aparece en el historial.
- [ ] En el dispositivo del estudiante → Tareas → ve la nota, el comentario y el motivo del cambio.
- [ ] Ficha del estudiante → **Reporte para padres** → el mensaje se lee completo → **Enviar por WhatsApp** abre WhatsApp con el texto.
- [ ] Resumen → **Palabras que más se fallan** muestra las palabras que falló el estudiante. Al tocar una palabra sale quién la falló.
- [ ] Tareas → **⬇️ Descargar notas del grupo (Excel)** → el archivo abre en Excel o Google Sheets con las hojas Resumen y Tareas.
- [ ] Resumen → **Recordar** (en "Necesitan un empujón") arma el mensaje.

## 8. Dueño
- [ ] `owner.html` con el código de configuración → lista la escuela con sus estudiantes.
- [ ] Código incorrecto → "Código de configuración incorrecto".
- [ ] Cambiar la clave de un profe → el profe entra con la nueva.

## 9. Celular e instalación
- [ ] Instalar la app (Android: menú ⋮ → Instalar app; iPhone: Compartir → Agregar a inicio).
- [ ] Abre desde el ícono, sin barra del navegador.
- [ ] En modo oscuro del teléfono todo se lee bien.
- [ ] Nada se sale de la pantalla ni hay que deslizar de lado.
- [ ] Con internet lento o sin internet un momento: la app avisa y, al volver la señal, guarda lo pendiente.

## 10. Seguridad (rápido)
- [ ] Un estudiante no ve el panel del profe aunque escriba `#admin` en la dirección.
- [ ] Un estudiante no ve el progreso ni las notas de otros (solo nombre, avatar y puntos en el ranking).
- [ ] Un profe de otra escuela (si creaste una de prueba) no ve tus estudiantes.
