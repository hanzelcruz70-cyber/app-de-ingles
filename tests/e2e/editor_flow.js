const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport:{width:390,height:820}});
  const errs=[]; p.on('pageerror', e=>errs.push(e.message)); p.on('console', m=>{ if(m.type()==='error' && !/ERR_|Failed to load/.test(m.text())) errs.push(m.text()); });
  const html = require('fs').readFileSync(require('path').join(__dirname,'demo_build.html'),'utf8');
  await p.route('**/*', r => r.request().url().startsWith('http://x/') ? r.fulfill({body:'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+html+'</body></html>', contentType:'text/html'}) : r.abort());
  await p.goto('http://x/'); await p.waitForTimeout(400);
  // student first: old lessons still play
  await p.click('[data-fill="estudiante|1234"]'); await p.click('#loginForm button'); await p.waitForTimeout(700); if (await p.isVisible('.sheet button:has-text("Ahora no")')) await p.click('.sheet button:has-text("Ahora no")');
  await p.click('.node.current',{force:true}); await p.waitForTimeout(200);
  const ok1 = await p.isVisible('#lesson');
  await p.click('#lclose'); await p.click('.sheet button:has-text("Salir")');
  await p.click('[data-tab="me"]'); await p.click('text=Cerrar sesión'); await p.click('.sheet button:has-text("Cerrar sesión")');
  // admin
  await p.click('[data-fill="admin|admin123"]'); await p.click('#loginForm button'); await p.waitForTimeout(300);
  await p.click('[data-atab="content"]'); await p.waitForTimeout(200);
    // words
  await p.click('#atab-content button:has-text("Abrir")');
  for (const [en,es,em] of [['uncle','tío','🧔'],['aunt','tía','👩‍🦰'],['cousin','primo','🧒'],['friend','amigo','🧑‍🤝‍🧑']]) {
    await p.click('#atab-content button:has-text("+ Nueva")'); await p.fill('.sheet input >> nth=0', en); await p.fill('.sheet input >> nth=1', es); await p.fill('#wEmoji', em); await p.click('.sheet button:has-text("Agregar palabra")'); await p.waitForTimeout(100);
  }
  await p.fill('#wsearch','ma'); await p.waitForTimeout(100);
    await p.click('.ed-back');
  // unit 3
  await p.click('.row:has-text("My Family")'); await p.waitForTimeout(200);
  await p.click('text=+ Nueva lección'); await p.fill('.sheet input >> nth=0','La familia');
  for (const w of ['uncle','aunt','cousin','friend']) await p.click(`.sheet .wtag:has-text("${w}")`);
    await p.click('.sheet button:has-text("Crear lección")'); await p.waitForTimeout(300);
  // add fill exercise
  await p.click('text=+ Agregar ejercicio'); await p.click('.type-card:has-text("Completar")');
  await p.fill('.sheet input >> nth=0', 'This is my'); await p.fill('.sheet input >> nth=1', 'mom'); await p.fill('.sheet input >> nth=2', '.'); await p.fill('.sheet input >> nth=3', 'dad, baby');
  await p.selectOption('.sheet select', 'w:mom');
    await p.click('.sheet button:has-text("Agregar a la lección")'); await p.waitForTimeout(200);
  // move last up
  const ups = await p.$$('.row .mini[aria-label="Subir"]'); await ups[ups.length-1].click(); await p.waitForTimeout(100);
    // preview
  await p.click('text=Probar lección'); await p.waitForTimeout(300);
    await p.click('#lclose'); await p.waitForTimeout(200);
  // open unit
  await p.click('.ed-back'); await p.click('.ed-back'); await p.waitForTimeout(100);
  await p.click('.row:has-text("My Family") .switch'); await p.waitForTimeout(100);
  await p.click('#admLogout'); await p.click('.sheet button:has-text("Cerrar sesión")');
  await p.click('[data-fill="estudiante|1234"]'); await p.click('#loginForm button'); await p.waitForTimeout(700); if (await p.isVisible('.sheet button:has-text("Ahora no")')) await p.click('.sheet button:has-text("Ahora no")');
  await p.evaluate(()=>{ const b=[...document.querySelectorAll('.unit-banner')].find(x=>x.textContent.includes('My Family')); b.scrollIntoView(); });
  await p.waitForTimeout(200);
    console.log('studentLessonOk',ok1, errs.join('\n')||'no errors');
  await b.close();
})();
