// Pruebas de: palabras falladas, reporte para padres, recordar por WhatsApp, recordatorio diario, prueba de audio y owner.html
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:390,height:820}}); const p = await ctx.newPage();
  // Chromium sin pantalla siempre responde 'denied'; se simula la API para probar la lógica de la app
  await p.addInitScript(() => { window.__notes = []; function N(t, o){ window.__notes.push(t); } N.permission = 'default'; N.requestPermission = async () => { N.permission = 'granted'; return 'granted'; }; window.Notification = N; });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/ERR_|Failed to load/.test(m.text())) errs.push(m.text()); });
  const html = fs.readFileSync(path.join(__dirname, 'demo_build.html'), 'utf8');
  await p.route('**/*', r => r.request().url().startsWith('http://localhost:7/') ? r.fulfill({body:'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>' + html + '</body></html>', contentType:'text/html'}) : r.abort());
  await p.goto('http://localhost:7/'); await p.waitForTimeout(400);
  const R = {};
  // login: prueba de audio
  await p.click('#lgAudio'); R.audioSheetLogin = await p.isVisible('.sheet h2:has-text("Probar audio")'); await p.click('.sheet button:has-text("Cerrar")');
  // estudiante juega, falla una respuesta
  await p.click('[data-fill="estudiante|1234"]'); await p.click('#loginForm button'); await p.waitForTimeout(700); if (await p.isVisible('.sheet button:has-text("Ahora no")')) await p.click('.sheet button:has-text("Ahora no")');
  R.nudgeBanner = /Hoy todavía no has practicado|racha/.test(await p.textContent('#tab-learn'));
  await p.click('.node.current', {force:true}); await p.waitForTimeout(300);
  await p.evaluate(() => grade(false, 'x')); await p.waitForTimeout(100);
  R.missRecorded = await p.evaluate(() => Object.keys(S.miss).length);
  await p.click('#lclose'); await p.click('.sheet button:has-text("Salir")');
  // recordatorio diario
  await p.click('[data-tab="me"]'); await p.waitForTimeout(100);
  R.audioInMe = await p.isVisible('#tab-me button:has-text("Probar audio y micrófono")');
  await p.click('#tab-me button:has-text("Activar recordatorio")'); await p.waitForTimeout(300);
  R.remindOn = await p.evaluate(() => remGet().on);
  await p.click('#tab-me button:has-text("Apagar recordatorio")'); R.remindOff = await p.evaluate(() => !remGet().on); R.testNotice = await p.evaluate(() => window.__notes.length);
  await p.click('text=Cerrar sesión'); await p.click('.sheet button:has-text("Cerrar sesión")');
  // admin
  await p.click('[data-fill="admin|admin123"]'); await p.click('#loginForm button'); await p.waitForTimeout(300);
  await p.evaluate(() => { const u = DB.users.find(x => x.role === 'student' && !x.example); const pr = prog(u.id); pr.miss = {cat:5, dog:2}; save(); });
  await p.click('[data-atab="sum"]'); await p.waitForTimeout(200);
  R.missCard = await p.textContent('#atab-sum');
  R.missCardHasWords = /Palabras que más se fallan/.test(R.missCard) && /cat/.test(R.missCard);
  R.remindBtns = await p.locator('#atab-sum button:has-text("Recordar")').count();
  if (R.remindBtns){ await p.click('#atab-sum button:has-text("Recordar") >> nth=0'); R.remindText = await p.inputValue('.sheet textarea'); await p.click('.sheet button:has-text("Cerrar")'); }
  // reporte para padres
  await p.click('[data-atab="stu"]'); await p.waitForTimeout(150);
  await p.click('#atab-stu .stu >> nth=0'); await p.click('.sheet button:has-text("Reporte para padres")');
  R.report = await p.inputValue('.sheet textarea');
  R.reportOk = /Reporte semanal/.test(R.report) && /Puntos esta semana/.test(R.report);
  await p.fill('#shPhone', '8888 7777');
  await ctx.route('https://wa.me/**', r => { R.waUrl = r.request().url(); r.fulfill({body:'ok', contentType:'text/html'}); });
  await p.click('.sheet button:has-text("Enviar por WhatsApp")'); await p.waitForTimeout(500);
  R.phoneSaved = await p.evaluate(() => Object.values(JSON.parse(localStorage.getItem('pandi-phones') || '{}'))[0]);
  // la pagina de 390px no se desborda
  R.noOverflow = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
  // owner.html con servidor simulado
  const o = await ctx.newPage();
  const oerrs = []; o.on('pageerror', e => oerrs.push(e.message));
  const owner = fs.readFileSync(path.join(__dirname, '..', '..', 'owner.html'), 'utf8').replace('<script src="config.js"></script>', '<script>window.PANDI_CONFIG={supabaseUrl:"https://fake.supabase.co",supabaseAnonKey:"anon"}</script>');
  await o.route('**/*', async r => {
    const u = r.request().url();
    if (u === 'http://o/') return r.fulfill({body:owner, contentType:'text/html'});
    if (u.includes('/functions/v1/admin-users')){
      const body = JSON.parse(r.request().postData());
      if (body.setup_token !== 'bueno') return r.fulfill({status:403, contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body:JSON.stringify({error:'Código de configuración incorrecto'})});
      if (body.action === 'list_schools') return r.fulfill({contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body:JSON.stringify({schools:[{id:'1', name:'Academia <b>X</b>', students:7, admins:[{username:'profe', name:'Luis'}], last_activity:'2026-10-10T12:00:00Z'}]})});
      return r.fulfill({contentType:'application/json', headers:{'access-control-allow-origin':'*'}, body:JSON.stringify({ok:true, school_id:'2'})});
    }
    return r.abort();
  });
  await o.goto('http://o/'); await o.fill('#token', 'malo'); await o.click('#enter'); await o.waitForTimeout(300);
  R.ownerBadToken = await o.textContent('#out');
  await o.fill('#token', 'bueno'); await o.click('#enter'); await o.waitForTimeout(300);
  R.ownerList = await o.textContent('#list');
  R.ownerNoHtmlInjection = /<b>X<\/b>/.test(R.ownerList);
  await o.fill('#school', 'Nueva'); await o.fill('#name', 'Ana'); await o.fill('#user', 'profe.ana'); await o.fill('#pass', 'abcdef'); await o.click('#create'); await o.waitForTimeout(300);
  R.ownerCreate = await o.textContent('#out');
  console.log(JSON.stringify(R, null, 1), '\nerrors:', errs.concat(oerrs).join('\n') || 'none');
  const bad = [R.audioSheetLogin, R.nudgeBanner, R.missRecorded >= 1, R.audioInMe, R.remindOn, R.remindOff, R.testNotice >= 1, R.missCardHasWords, R.remindBtns >= 1, /Hola/.test(R.remindText || ''), R.reportOk, /wa\.me\/50588887777/.test(R.waUrl || ''), R.phoneSaved, R.noOverflow, /incorrecto/.test(R.ownerBadToken), /7/.test(R.ownerList), R.ownerNoHtmlInjection, /Listo/.test(R.ownerCreate)].some(x => !x);
  console.log(bad || errs.length ? 'FAIL' : 'PASS');
  await b.close(); process.exit(bad || errs.length ? 1 : 0);
})();
