// Pandi English · función del servidor para manejar cuentas.
// Se ejecuta en Supabase (Edge Functions). Usa la llave de servicio, que nunca llega al teléfono.
//
// Acciones (POST JSON):
//   create_school   {setup_token, school_name, name, username, password}   → crea una escuela y su admin
//   list_schools    {setup_token}                                          → lista de escuelas con sus conteos (panel del dueño)
//   owner_reset_admin_password {setup_token, username, password}           → el dueño cambia la clave de un profe (admin)
//   create_student  {name, username, password, group_id}                   → solo admin
//   reset_password  {user_id, password}                                    → solo admin
//   delete_student  {user_id}                                              → solo admin
import { createClient } from 'jsr:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SETUP_TOKEN = Deno.env.get('PANDI_SETUP_TOKEN') ?? '';
const EMAIL_DOMAIN = Deno.env.get('PANDI_EMAIL_DOMAIN') ?? 'alumnos.pandienglish.app';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });
const USER_RE = /^[a-z0-9._-]{3,24}$/;
const clean = (v) => String(v ?? '').trim();

async function createAuthUser(admin, username, password, name) {
  const { data, error } = await admin.auth.admin.createUser({
    email: `${username}@${EMAIL_DOMAIN}`,
    password,
    email_confirm: true,
    user_metadata: { username, name }
  });
  if (error) {
    const taken = /already|registered|exists/i.test(error.message);
    return { error: taken ? 'Ese usuario ya existe. Prueba con otro.' : error.message };
  }
  return { id: data.user.id };
}

function checkCredentials(username, password, name) {
  if (!name) return 'Escribe el nombre.';
  if (!USER_RE.test(username)) return 'El usuario debe tener de 3 a 24 letras o números, sin espacios.';
  if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
  return null;
}

export async function handle(req, admin) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);
  let body;
  try { body = await req.json(); } catch { return json({ error: 'Solicitud inválida' }, 400); }
  const action = body.action;

  try {
    if (action === 'create_school') {
      if (!SETUP_TOKEN || body.setup_token !== SETUP_TOKEN) return json({ error: 'Código de configuración incorrecto' }, 403);
      const schoolName = clean(body.school_name), name = clean(body.name), username = clean(body.username).toLowerCase(), password = String(body.password ?? '');
      if (!schoolName) return json({ error: 'Escribe el nombre de la escuela.' }, 400);
      const bad = checkCredentials(username, password, name);
      if (bad) return json({ error: bad }, 400);
      const { data: taken } = await admin.from('profiles').select('id').eq('username', username).maybeSingle();
      if (taken) return json({ error: 'Ese usuario ya existe. Prueba con otro.' }, 409);
      const { data: school, error: se } = await admin.from('schools').insert({ name: schoolName }).select().single();
      if (se) throw se;
      const created = await createAuthUser(admin, username, password, name);
      if (created.error) { await admin.from('schools').delete().eq('id', school.id); return json({ error: created.error }, 400); }
      const { error: pe } = await admin.from('profiles').insert({ id: created.id, school_id: school.id, role: 'admin', username, name });
      if (pe) { await admin.auth.admin.deleteUser(created.id); await admin.from('schools').delete().eq('id', school.id); throw pe; }
      return json({ school_id: school.id, user_id: created.id });
    }

    // Acciones del dueño (requieren el código de configuración)
    if (action === 'list_schools' || action === 'owner_reset_admin_password') {
      if (!SETUP_TOKEN || body.setup_token !== SETUP_TOKEN) return json({ error: 'Código de configuración incorrecto' }, 403);
      if (action === 'list_schools') {
        const { data: schools, error: e1 } = await admin.from('schools').select('*');
        if (e1) throw e1;
        const { data: profs, error: e2 } = await admin.from('profiles').select('id,school_id,role,username,name');
        if (e2) throw e2;
        const { data: progs } = await admin.from('progress').select('school_id,updated_at');
        const list = (schools ?? []).map((sc) => {
          const mine = (profs ?? []).filter((p) => p.school_id === sc.id);
          const last = (progs ?? []).filter((p) => p.school_id === sc.id).map((p) => p.updated_at).sort().pop() ?? null;
          return {
            id: sc.id, name: sc.name, created_at: sc.created_at ?? null,
            students: mine.filter((p) => p.role === 'student').length,
            admins: mine.filter((p) => p.role === 'admin').map((p) => ({ username: p.username, name: p.name })),
            last_activity: last
          };
        });
        return json({ schools: list });
      }
      const username = clean(body.username).toLowerCase(), password = String(body.password ?? '');
      if (password.length < 6) return json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
      const { data: adm } = await admin.from('profiles').select('*').eq('username', username).maybeSingle();
      if (!adm || adm.role !== 'admin') return json({ error: 'No encontré un profe (admin) con ese usuario.' }, 404);
      const { error } = await admin.auth.admin.updateUserById(adm.id, { password });
      if (error) throw error;
      return json({ ok: true });
    }

    // Todo lo demás lo puede hacer solo el admin de la escuela
    const jwt = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    if (!jwt) return json({ error: 'Inicia sesión primero' }, 401);
    const { data: who, error: we } = await admin.auth.getUser(jwt);
    if (we || !who?.user) return json({ error: 'Tu sesión venció. Vuelve a iniciar sesión.' }, 401);
    const { data: me } = await admin.from('profiles').select('*').eq('id', who.user.id).maybeSingle();
    if (!me || me.role !== 'admin') return json({ error: 'Solo el profe (admin) puede hacer esto' }, 403);

    if (action === 'create_student') {
      const name = clean(body.name), username = clean(body.username).toLowerCase(), password = String(body.password ?? ''), groupId = clean(body.group_id) || null;
      const bad = checkCredentials(username, password, name);
      if (bad) return json({ error: bad }, 400);
      if (groupId) {
        const { data: g } = await admin.from('groups').select('id').eq('school_id', me.school_id).eq('id', groupId).maybeSingle();
        if (!g) return json({ error: 'Ese grupo no existe' }, 400);
      }
      const { data: taken } = await admin.from('profiles').select('id').eq('username', username).maybeSingle();
      if (taken) return json({ error: 'Ese usuario ya existe. Prueba con otro.' }, 409);
      const created = await createAuthUser(admin, username, password, name);
      if (created.error) return json({ error: created.error }, 400);
      const { error: pe } = await admin.from('profiles').insert({ id: created.id, school_id: me.school_id, role: 'student', username, name, group_id: groupId });
      if (pe) { await admin.auth.admin.deleteUser(created.id); throw pe; }
      await admin.from('progress').insert({ user_id: created.id, school_id: me.school_id, data: {} });
      return json({ id: created.id, username });
    }

    if (action === 'reset_password' || action === 'delete_student') {
      const { data: st } = await admin.from('profiles').select('*').eq('id', clean(body.user_id)).maybeSingle();
      if (!st || st.school_id !== me.school_id || st.role !== 'student') return json({ error: 'Estudiante no encontrado' }, 404);
      if (action === 'reset_password') {
        const password = String(body.password ?? '');
        if (password.length < 6) return json({ error: 'La contraseña debe tener al menos 6 caracteres.' }, 400);
        const { error } = await admin.auth.admin.updateUserById(st.id, { password });
        if (error) throw error;
        return json({ ok: true });
      }
      const { error } = await admin.auth.admin.deleteUser(st.id); // borra también su perfil, progreso y entregas
      if (error) throw error;
      return json({ ok: true });
    }

    return json({ error: 'Acción desconocida' }, 400);
  } catch (e) {
    return json({ error: e?.message ?? String(e) }, 500);
  }
}

if (typeof Deno !== 'undefined' && Deno.serve) {
  Deno.serve((req) => handle(req, createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })));
}
