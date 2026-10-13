const { chromium } = require('playwright'); const fs = require('fs');
const html = fs.readFileSync(require('path').join(__dirname,'demo_build.html'),'utf8');
const mock = fs.readFileSync(require('path').join(__dirname,'mock_client.js'),'utf8');
// ---- fake server state ----
const PK = {schools:['id'], profiles:['id'], groups:['school_id','id'], courses:['school_id'], assignments:['school_id','id'], progress:['user_id'], submissions:['assignment_id','user_id'], friendships:['from_id','to_id']};
const T = {schools:[{id:'S'}], profiles:[{id:'A', school_id:'S', role:'admin', username:'profe', name:'Profe Luis', group_id:null}], groups:[], courses:[], assignments:[], progress:[], submissions:[], friendships:[]};
const AUTH = {'profe@alumnos.pandienglish.app':{id:'A', pw:'clave123'}};
let nid = 0; const log = [];
function handle(m){
  if (m.kind === 'login'){ const a = AUTH[m.email]; return a && a.pw === m.password ? {id:a.id} : {error:{message:'Invalid login credentials'}}; }
  if (m.kind === 'rpc'){ const me = T.profiles.find(p => p.id === m.uid); return {data: T.profiles.filter(p => p.role === 'student' && p.school_id === me.school_id && p.group_id === me.group_id).map(p => { const pr = T.progress.find(x => x.user_id === p.id) || {data:{}}; return {user_id:p.id, name:p.name, xp:pr.data.xp || 0, xp_days:pr.data.xpDays || {}, days:pr.data.days || [], avatar:pr.data.avatar || null}; }), error:null}; }
  if (m.kind === 'fn'){
    const b = m.body; const me = T.profiles.find(p => p.id === m.uid);
    if (!me || me.role !== 'admin') return {status:403, body:{error:'Solo el profe'}};
    if (b.action === 'create_student'){
      if (T.profiles.some(p => p.username === b.username)) return {status:409, body:{error:'Ese usuario ya existe. Prueba con otro.'}};
      const id = 'st' + (++nid); AUTH[b.username + '@alumnos.pandienglish.app'] = {id, pw:b.password};
      T.profiles.push({id, school_id:me.school_id, role:'student', username:b.username, name:b.name, group_id:b.group_id}); T.progress.push({user_id:id, school_id:me.school_id, data:{}});
      return {status:200, body:{id, username:b.username}};
    }
    return {status:400, body:{error:'?'}};
  }
  if (!T[m.table]) return {data:null, error:{message:`relation "public.${m.table}" does not exist`}}; // como Supabase si falta la tabla
  const rows = T[m.table]; const match = r => m.filters.every(([c, v]) => r[c] === v);
  log.push(m.op + ' ' + m.table);
  if (m.op === 'select'){ const out = rows.filter(match); if (m.single) return out.length ? {data:out[0], error:null} : {data:null, error:{message:'no rows'}}; if (m.maybe) return {data:out[0] || null, error:null}; return {data:out, error:null}; }
  if (m.op === 'insert'){ (Array.isArray(m.payload) ? m.payload : [m.payload]).forEach(r => rows.push({...r})); return {data:null, error:null}; }
  // Igual que RLS real: un upsert cuenta como INSERT y el admin no puede insertar entregas a nombre del niño
  if (m.op === 'upsert' && m.table === 'submissions'){ const me = T.profiles.find(p => p.id === m.uid); if (me && me.role === 'admin') return {data:null, error:{message:'new row violates row-level security policy for table "submissions"'}}; }
  if (m.op === 'upsert'){ const r = m.payload; const k = PK[m.table]; const i = rows.findIndex(x => k.every(c => x[c] === r[c])); if (i >= 0) rows[i] = {...rows[i], ...r}; else rows.push({...r}); return {data:null, error:null}; }
  if (m.op === 'update'){ rows.filter(match).forEach(r => Object.assign(r, m.payload)); return {data:null, error:null}; }
  if (m.op === 'delete'){ T[m.table] = rows.filter(r => !match(r)); return {data:null, error:null}; }
}
async function device(b){
  const ctx = await b.newContext({viewport:{width:390, height:820}}); const p = await ctx.newPage();
  p.errs = []; p.on('pageerror', e => p.errs.push(e.message));
  await p.exposeFunction('mockCall', s => JSON.stringify(handle(JSON.parse(s))));
  await p.addInitScript(mock);
  await p.route('**/*', r => r.request().url().startsWith('http://x/') ? r.fulfill({body:'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>', contentType:'text/html'}) : r.abort());
  await p.goto('http://x/'); await p.waitForTimeout(400); return p;
}
const wait = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await chromium.launch(); const R = {};
  const A = await device(b);
  R.demoHidden = await A.isHidden('.demo');
  await A.fill('#lgUser','profe'); await A.fill('#lgPass','mal'); await A.click('#loginForm button'); await wait(300);
  R.wrongPw = await A.textContent('#lgErr');
  await A.fill('#lgPass','clave123'); await A.click('#loginForm button'); await wait(500);
  R.adminIn = await A.isVisible('#admin'); R.seeded = {course:T.courses.length, groups:T.groups.length};
  // create student
  await A.click('[data-atab="stu"]'); await A.click('text=+ Agregar'); await A.fill('#nsName','Ana López'); await A.fill('#nsUser','ana'); await A.fill('#nsPass','123'); await A.check('#nsConsent').catch(()=>{}); await A.click('.sheet button:has-text("Crear cuenta")'); await wait(150);
  R.shortPw = await A.textContent('.sheet .err');
  await A.fill('#nsPass','ana123'); await A.check('#nsConsent').catch(()=>{}); await A.click('.sheet button:has-text("Crear cuenta")'); await wait(400);
  R.studentCreated = T.profiles.some(p => p.username === 'ana');
  await A.click('text=+ Agregar'); await A.fill('#nsName','Ana 2'); await A.fill('#nsUser','ana'); await A.fill('#nsPass','ana123'); await A.check('#nsConsent').catch(()=>{}); await A.click('.sheet button:has-text("Crear cuenta")'); await wait(300);
  R.dupError = await A.textContent('.sheet .err'); await A.click('.sheet button:has-text("Cancelar")');
  // open unit 2 and create assignment
  await A.click('[data-atab="content"]'); await A.click('.row:has-text("Animals") .switch'); await wait(100);
  await A.click('[data-atab="hw"]'); await A.click('text=+ Nueva tarea'); await A.fill('.sheet input >> nth=0','Semana 1'); await A.check('#al-u1l1'); await A.fill('.sheet input[placeholder="Ej. Mi familia"]','Mi animal'); await A.fill('.sheet textarea','Escribe sobre tu animal favorito.');
  await A.click('.sheet button:has-text("Asignar tarea")'); await wait(1200);
  R.server1 = {groupsOpenU2: T.groups[0] && T.groups[0].open.u2, assignments:T.assignments.length};
  // student device
  const B = await device(b);
  const savedFr = T.friendships; delete T.friendships; // schema.sql viejo, sin la tabla de amigos
  await B.fill('#lgUser','ana'); await B.fill('#lgPass','ana123'); await B.click('#loginForm button'); await wait(500);
  R.studentIn = await B.isVisible('#home'); R.loginWithoutFriendsTable = R.studentIn; T.friendships = savedFr;
  R.openUnits = await B.$$eval('.unit-banner', els => els.filter(e => !e.classList.contains('locked')).length);
  await B.evaluate(() => { S.xp += 60; S.done.u1l1 = 3; S.xpDays[new Date().toISOString().slice(0,10)] = 60; save(); });
  await B.click('[data-tab="work"]'); await wait(200);
  R.taskSeen = await B.isVisible('text=Semana 1');
  await B.fill('#tab-work textarea','My favorite animal is a dog. It is brown.'); await B.click('text=Enviar a mi profe'); await wait(1200);
  R.server2 = {xp:(T.progress.find(x => x.user_id === 'st1') || {data:{}}).data.xp, sub:T.submissions.length, subSent:!!(T.submissions[0] || {}).sent_at};
  // admin sees and reviews
  await A.evaluate(() => { lastLoad = 0; }); await A.click('[data-atab="sum"]'); await wait(800);
  R.adminSeesXP = await A.isVisible('text=60 XP');
  await A.click('[data-atab="hw"]'); await wait(300); await A.click('#atab-hw .card:has-text("Semana 1")'); await wait(200);
  await A.fill('#atab-hw input[type=number]','100'); await A.fill('#atab-hw textarea','¡Muy bien, Ana!'); await A.click('text=Calificar y enviar'); await wait(1200);
  R.server3 = {reviewed:T.submissions[0].reviewed, note:T.submissions[0].note, grade:T.submissions[0].grade};
  R.syncErrorShown = await A.isVisible('text=No se pudo guardar en el servidor');
  // editar la nota pide motivo y guarda historial
  await A.click('#atab-hw button:has-text("Editar nota")'); await A.fill('.sheet input[type=number]','90'); await A.click('.sheet button:has-text("Guardar cambio")'); await wait(100);
  R.reasonRequired = await A.textContent('.sheet .err');
  await A.fill('#egWhy','Faltó la mayúscula al inicio.'); await A.click('.sheet button:has-text("Guardar cambio")'); await wait(1200);
  R.server4 = {grade:T.submissions[0].grade, history:(T.submissions[0].history || []).length};
  // student sees note after refresh
  await B.evaluate(() => { lastLoad = 0; }); await B.click('[data-tab="learn"]'); await B.click('[data-tab="work"]'); await wait(800); await B.click('[data-tab="learn"]'); await B.click('[data-tab="work"]'); await wait(300);
  R.noteSeen = await B.isVisible('text=¡Muy bien, Ana!'); R.gradeSeen = await B.isVisible('#tab-work .grade-badge:has-text("90/100")'); R.historySeen = await B.isVisible('text=Faltó la mayúscula');
  // reload keeps session
  await B.reload(); await wait(700); R.sessionKept = await B.isVisible('#home');
  console.log(JSON.stringify(R, null, 1)); console.log('errors:', [...A.errs, ...B.errs].join('\n') || 'none');
  await b.close();
})();
