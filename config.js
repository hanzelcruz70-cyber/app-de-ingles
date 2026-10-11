// Pandi English · configuración del servidor.
// 1. En Supabase abre tu proyecto NUEVO → Project Settings → API.
// 2. Copia "Project URL" y la llave "anon public" aquí abajo.
// La llave "anon" es pública y segura de poner aquí: las reglas de la base de datos protegen los datos.
// NUNCA pongas aquí la llave "service_role".
// Si dejas estos campos vacíos, la app funciona en modo demo (datos solo en ese teléfono).
window.PANDI_CONFIG = {
  supabaseUrl: '',        // ej. 'https://abcdefghijkl.supabase.co'
  supabaseAnonKey: '',    // ej. 'eyJhbGciOiJIUzI1NiIs...'
  emailDomain: 'alumnos.pandienglish.app'  // debe coincidir con PANDI_EMAIL_DOMAIN de la función (si la cambias)
};
