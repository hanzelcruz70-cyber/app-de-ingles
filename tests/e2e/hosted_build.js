const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:390,height:820}}); const p = await ctx.newPage();
  const errs=[]; p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>{ if(m.type()==='error' && !/fonts|ERR_/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8765/'); await p.waitForTimeout(1500);
  const R = {};
  R.demoVisible = await p.isVisible('.demo');
  R.manifest = await p.evaluate(async () => { const r = await fetch('manifest.webmanifest'); const j = await r.json(); return j.name + ' / ' + j.icons.length + ' icons'; });
  R.sw = await p.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration(); return !!reg; });
  await p.click('[data-fill="estudiante|1234"]'); await p.click('#loginForm button'); await p.waitForTimeout(400);
  R.studentIn = await p.isVisible('#home');
  await p.goto('http://localhost:8765/setup.html'); await p.fill('#school','X'); await p.fill('#name','Y'); await p.fill('#user','profe'); await p.fill('#pass','123456'); await p.fill('#token','t'); await p.click('#go'); await p.waitForTimeout(300);
  R.setupMsg = await p.textContent('#out');
  console.log(JSON.stringify(R, null, 1), '\nerrors:', errs.join('\n') || 'none');
  await b.close();
})();
