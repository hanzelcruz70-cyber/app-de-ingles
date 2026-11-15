// Pandi English · recordatorio diario por notificación push (funciona aunque la app esté cerrada).
// La llama una automatización de GitHub cada 15 minutos (.github/workflows/recordatorios.yml) con el código PANDI_SETUP_TOKEN.
// Para cada teléfono suscrito (tabla push_subs): si en su hora local ya pasó la hora elegida, hoy no se le mandó aviso
// y el estudiante todavía no practicó hoy (progress.data.days), se le manda el aviso con VAPID (web-push).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SETUP_TOKEN = Deno.env.get('PANDI_SETUP_TOKEN') ?? '';
const VAPID_PUBLIC = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const CONTACT = Deno.env.get('VAPID_CONTACT') ?? 'mailto:redinformaticatotal@gmail.com';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
const pad = (n: number) => String(n).padStart(2, '0');
// fecha y hora locales de un teléfono a partir de su desfase (minutos, como getTimezoneOffset: Nicaragua = 360)
function localNow(tzOffset: number) {
  const d = new Date(Date.now() - tzOffset * 60000);
  return { date: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`, time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`, yesterday: (() => { const y = new Date(d.getTime() - 86400000); return `${y.getUTCFullYear()}-${pad(y.getUTCMonth() + 1)}-${pad(y.getUTCDate())}`; })() };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Solo POST' }, 405);
  const token = req.headers.get('x-remind-token') ?? '';
  if (!SETUP_TOKEN || token !== SETUP_TOKEN) return json({ error: 'Código incorrecto' }, 403);
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return json({ error: 'Faltan las llaves VAPID (secrets VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY)' }, 500);
  webpush.setVapidDetails(CONTACT, VAPID_PUBLIC, VAPID_PRIVATE);
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const { data: subs, error } = await admin.from('push_subs').select('*');
  if (error) return json({ error: error.message }, 500);
  const due = (subs ?? []).filter((s) => { const n = localNow(s.tz_offset ?? 360); return n.time >= (s.remind_at ?? '17:00') && s.last_sent !== n.date; });
  if (!due.length) return json({ ok: true, sent: 0, checked: (subs ?? []).length });

  const ids = [...new Set(due.map((s) => s.user_id))];
  const { data: progs } = await admin.from('progress').select('user_id, data').in('user_id', ids);
  const days = new Map((progs ?? []).map((p) => [p.user_id, new Set(Array.isArray(p.data?.days) ? p.data.days : [])]));

  let sent = 0, removed = 0, skipped = 0;
  for (const s of due) {
    const n = localNow(s.tz_offset ?? 360), d = days.get(s.user_id) ?? new Set();
    if (d.has(n.date)) { skipped++; continue; } // hoy sí practicó
    const streak = d.has(n.yesterday);
    const payload = JSON.stringify({
      title: '¡Pandi te espera! 🐼',
      body: streak ? 'Tu racha está en peligro. ¡Practica un ratito!' : 'Hoy todavía no has practicado. ¡Con una lección basta!',
      url: './'
    });
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 6 * 3600 });
      await admin.from('push_subs').update({ last_sent: n.date }).eq('endpoint', s.endpoint);
      sent++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { await admin.from('push_subs').delete().eq('endpoint', s.endpoint); removed++; } // el teléfono se desuscribió
      else console.error('push:', code, (e as Error).message);
    }
  }
  return json({ ok: true, sent, skipped, removed, checked: (subs ?? []).length });
});
