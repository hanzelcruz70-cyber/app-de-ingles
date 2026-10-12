// Pandi English · configuración del servidor.
// 1. En Supabase abre tu proyecto NUEVO → Project Settings → API.
// 2. Copia "Project URL" y la llave "anon public" aquí abajo.
// La llave "anon" es pública y segura de poner aquí: las reglas de la base de datos protegen los datos.
// NUNCA pongas aquí la llave "service_role".
// Si dejas estos campos vacíos, la app funciona en modo demo (datos solo en ese teléfono).
window.PANDI_CONFIG = {
  supabaseUrl: 'https://itaxhosmkmlnoqdpljzh.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml0YXhob3Nta21sbm9xZHBsanpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE3MTg4OTMsImV4cCI6MjEwNzI5NDg5M30.aFtCt68q7AUp_QRLUjNCEvUiCYmwOBOpwj-4jFN46II',
  emailDomain: 'alumnos.pandienglish.app',  // debe coincidir con PANDI_EMAIL_DOMAIN de la función (si la cambias)
  // Datos que salen en el Aviso de privacidad y en los Términos (privacidad.html, terminos.html)
  legalName: '',      // nombre de la persona o empresa que ofrece Pandi English, ej. 'Hanzel Cruz'
  contactEmail: '',   // correo para dudas y solicitudes de privacidad
  contactPhone: ''    // opcional, ej. '+505 8888 8888'
};
