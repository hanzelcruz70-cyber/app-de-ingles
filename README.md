# Pandi English · guía para ponerla en línea

Con esta guía conectas la app a un servidor real. Así las cuentas, el progreso y las tareas funcionan entre todos los teléfonos, y la app se puede instalar como una app normal.

Si no conectas el servidor, la app funciona igual en **modo demo**: los datos se guardan solo en el teléfono donde se abre. Así funciona la vista previa.

> **Importante:** usa un proyecto **nuevo** de Supabase, solo para Pandi English. No uses ninguno de tus proyectos existentes. El script de la base de datos solo crea cosas (nunca borra), pero igual va en su propio proyecto para que nada se mezcle.

---

## Qué hay en esta carpeta

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | La app completa (estudiante + admin). |
| `config.js` | Aquí pegas la dirección y la llave pública de tu proyecto. |
| `setup.html` | Página para crear la primera escuela y su admin. |
| `manifest.webmanifest`, `sw.js`, `icons/` | Hacen que la app se pueda instalar en el celular y abra sin señal. |
| `supabase/schema.sql` | Crea las tablas y las reglas de seguridad. |
| `supabase/functions/admin-users/index.ts` | Función del servidor que crea cuentas de estudiantes y cambia contraseñas. |
| `src/` y `build.py` | Código fuente. Si cambias `src/app.html`, corre `python3 build.py` para regenerar `index.html`. |

---

## Paso 1 · Crear el proyecto nuevo en Supabase

1. Entra a [supabase.com](https://supabase.com) → **New project**.
2. Nombre: `pandi-english`. Región: la más cercana (por ejemplo *East US*).
3. Guarda la contraseña de la base de datos en un lugar seguro.

## Paso 2 · Crear la base de datos

1. En el proyecto nuevo: **SQL Editor → New query**.
2. Copia todo el contenido de `supabase/schema.sql`, pégalo y presiona **Run**.
3. Debe decir *Success*. Puedes correrlo otra vez sin problema: no borra nada.

## Paso 3 · Ajustar el inicio de sesión

En **Authentication → Sign In / Providers → Email**:

- Desactiva **Confirm email**. Los niños no usan correo; el sistema les crea uno interno.
- En **Authentication → Settings**, desactiva **Allow new users to sign up**. Así solo el profe puede crear cuentas.

## Paso 4 · Publicar la función de cuentas

**Opción A, desde GitHub (sin instalar nada).** El repositorio trae la automatización `.github/workflows/supabase-function.yml`. En GitHub ve a **Settings → Secrets and variables → Actions** y crea estos tres secrets:

- `SUPABASE_ACCESS_TOKEN`: en supabase.com, tu perfil → **Access Tokens → Generate new token**.
- `SUPABASE_PROJECT_REF`: el código de la URL de tu proyecto (`supabase.com/dashboard/project/ESTE-CODIGO`).
- `PANDI_SETUP_TOKEN`: un código largo que inventes tú.

Luego ve a **Actions → Publicar función de cuentas (Supabase) → Run workflow**. Cuando salga en verde, la función ya está publicada.

**Opción B, desde tu computadora.** Necesitas la [Supabase CLI](https://supabase.com/docs/guides/cli). En la carpeta de este proyecto:

```bash
supabase login
supabase link --project-ref TU_PROJECT_REF        # está en la URL del proyecto
supabase secrets set PANDI_SETUP_TOKEN=inventa-un-codigo-largo-y-secreto
supabase functions deploy admin-users
```

`PANDI_SETUP_TOKEN` es un código que solo tú conoces. Sirve para crear escuelas nuevas desde `setup.html`; guárdalo.

## Paso 5 · Conectar la app

1. En Supabase: **Project Settings → API**.
2. Abre `config.js` y pega:
   - **Project URL** en `supabaseUrl`
   - la llave **anon public** en `supabaseAnonKey`
3. **Nunca** pongas la llave `service_role` en la app.

## Paso 6 · Publicar en internet

**Con GitHub Pages (ya configurado).** En GitHub ve a **Settings → Pages → Build and deployment → Source** y elige **GitHub Actions**. Cada vez que se suba un cambio a `main`, la app se publica sola en `https://TU-USUARIO.github.io/NOMBRE-DEL-REPO/`. El avance se ve en la pestaña **Actions**.

Otras opciones:

- **Netlify Drop:** entra a [app.netlify.com/drop](https://app.netlify.com/drop) y arrastra esta carpeta completa. Te da un enlace `https://…netlify.app`.
- También funcionan Vercel, Cloudflare Pages o GitHub Pages.

## Paso 7 · Crear la primera escuela

1. Abre `https://TU-ENLACE/setup.html`.
2. Llena el nombre de la escuela, el nombre y usuario del profe, una contraseña y el código del paso 4.
3. Entra a la app con ese usuario. La primera vez se carga solo el curso del Nivel 1 y un grupo inicial.

Para vender la app a otra escuela, repite este paso con otros datos. Cada escuela solo ve sus propios estudiantes, grupos, tareas y contenido.

## Paso 8 · Instalar en los teléfonos

- **Android (Chrome):** abre el enlace → menú ⋮ → **Agregar a la pantalla principal** (o **Instalar app**).
- **iPhone (Safari):** abre el enlace → botón Compartir → **Agregar a inicio**.

---

## Cómo se usa ya conectada

- **Profe (admin):** crea los grupos, crea las cuentas de los estudiantes (usuario + contraseña de al menos 6 caracteres), abre unidades, crea lecciones y tareas, y califica escrituras. La contraseña se muestra solo al crearla; si un niño la olvida, el profe le pone una nueva desde su ficha.
- **Estudiante:** entra con su usuario y contraseña desde cualquier teléfono. Su progreso, racha y tareas se guardan en el servidor.
- Los cambios se guardan solos en menos de un segundo. El panel del profe se actualiza al cambiar de pestaña.

## Datos técnicos (para ti)

- **Usuarios:** los nombres de usuario son únicos en todo el sistema. Internamente cada uno usa el correo `usuario@alumnos.pandienglish.app`; no se envían correos. Si cambias el dominio, cámbialo en `config.js` y en el secreto `PANDI_EMAIL_DOMAIN` de la función.
- **Seguridad:** las reglas (RLS) están en `schema.sql` y las probé con dos escuelas en Postgres 16. Un estudiante solo ve su perfil, su progreso y el ranking de su grupo, y no puede calificarse. El admin solo ve y edita su propia escuela, y no puede cambiar roles ni el progreso de los niños. Una escuela no ve a otra.
- **Imágenes:** las fotos que el profe sube al banco de palabras se guardan dentro del curso, en la base de datos. Funciona bien con emojis y pocas fotos pequeñas. Si van a subir muchas fotos, conviene moverlas a Supabase Storage en una siguiente versión.
- **Costo:** el plan gratis de Supabase alcanza para empezar (hasta 50 000 usuarios activos al mes y 500 MB de base de datos). Revisa los límites actuales en su página de precios.
