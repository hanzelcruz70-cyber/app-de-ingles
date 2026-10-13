// Pruebas de: repaso inteligente, ligas, protector de racha, tienda de gemas, desafío entre amigos, confeti y Excel
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:390,height:844}, acceptDownloads:true}); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('file://' + path.join(__dirname, 'demo_build.html')); await p.waitForTimeout(400);
  const R = {};
  await p.fill('#lgUser','estudiante'); await p.fill('#lgPass','1234'); await p.click('#loginForm button'); await p.waitForTimeout(300);
  R.gemChip = await p.isVisible('#gemN');
  // Repaso inteligente
  await p.evaluate(() => { S.miss = {cat:3, dog:2, bird:1}; save(); setTab('learn'); });
  R.reviewCard = await p.isVisible('text=Repaso inteligente');
  const g0 = await p.evaluate(() => S.gems || 0);
  await p.click('button:has-text("Repasar ahora")'); await p.waitForTimeout(200);
  R.reviewSteps = await p.evaluate(() => L.queue.length + 1);
  await p.evaluate(() => { while (L.queue.length){ grade(true); L.done++; L.cur = L.queue.shift(); } grade(true); finishLesson(); });
  await p.waitForTimeout(200);
  R.confetti = await p.locator('.confetti i').count();
  R.missAfter = await p.evaluate(() => JSON.stringify(S.miss));
  R.reviewNotDone = await p.evaluate(() => !S.done.review);
  R.gemsAfterLesson = await p.evaluate(() => S.gems) - g0;
  R.resultText = await p.innerText('#rbody');
  await p.click('#result button:has-text("Continuar")');
  // Liga y desafío: la semana pasada Ana hizo 160 XP y Sofía 20
  const lm = await p.evaluate(() => lastMonday());
  await p.evaluate(lm => { S.xpDays = {[lm]: 160}; S.claimed = {}; prog('s2').xpDays = {[lm]: 20}; S.gems = 0; save(); setTab('learn'); }, lm);
  R.gemsFromWeek = await p.evaluate(() => S.gems); // 20 liga + 10 desafío
  await p.evaluate(() => setTab('learn')); R.noDoubleClaim = await p.evaluate(() => S.gems);
  await p.click('[data-tab="rank"]'); R.rankLeague = await p.innerText('#tab-rank');
  // Protector de racha: practicó anteayer, no ayer, tiene 1 protector
  await p.evaluate(() => { S.days = [dayKey(2)]; S.frozen = []; S.freezes = 1; save(); setTab('learn'); });
  R.freeze = await p.evaluate(() => ({frozen:S.frozen, freezes:S.freezes, streak:streak()}));
  // Tienda
  await p.evaluate(() => { S.gems = 200; S.owned = []; save(); setTab('me'); });
  await p.click('#tab-me button:has-text("Tienda")');
  await p.click('.sheet .shop-item:has-text("Birrete") button'); await p.waitForTimeout(100);
  R.bought = await p.evaluate(() => ({owned:S.owned, gems:S.gems}));
  await p.click('.sheet .shop-item:has-text("Protector") button'); await p.click('.sheet .shop-item:has-text("Protector") button');
  R.freezeMax = await p.textContent('.sheet .shop-item:has-text("Protector") button');
  R.shopNoOverflow = await p.evaluate(() => document.querySelector('.sheet > div').scrollWidth <= document.querySelector('.sheet > div').clientWidth + 1);
  await p.click('.sheet button:has-text("Cerrar")');
  await p.click('#tab-me button:has-text("Mi avatar")');
  R.birreteInAvatar = await p.isVisible('.sheet .av-grid button[aria-label="Birrete"]');
  await p.click('.sheet button:has-text("Cancelar")');
  R.duelLine = await p.innerText('#tab-me .card:has-text("Mis amigos")');
  R.headerNoOverflow = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  await p.waitForTimeout(3300); await p.screenshot({path: path.join(__dirname, 'extras_me.png')});
  // Excel del profe
  await p.evaluate(() => logout()); await p.waitForTimeout(200);
  await p.fill('#lgUser','admin'); await p.fill('#lgPass','admin123'); await p.click('#loginForm button'); await p.waitForTimeout(300);
  await p.click('[data-atab="hw"]');
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('button:has-text("Descargar notas del grupo")')]);
  const file = path.join(__dirname, 'notas_test.xlsx'); await dl.saveAs(file);
  R.xlsxName = dl.suggestedFilename();
  R.xlsx = execFileSync('python3', ['-c', `import openpyxl,sys\nwb=openpyxl.load_workbook(sys.argv[1])\nfor ws in wb:\n  print(ws.title, ws.max_row, ws.max_column, [c.value for c in ws[1]][:4], [c.value for c in ws[2]][:5])`, file]).toString();
  fs.unlinkSync(file);
  console.log(JSON.stringify(R, null, 1));
  const ok = R.gemChip && R.reviewCard && R.reviewSteps >= 7 && R.confetti > 0 && R.missAfter === '{}' && R.reviewNotDone && R.gemsAfterLesson >= 5 && /gemas/.test(R.resultText)
    && R.gemsFromWeek === 30 && R.noDoubleClaim === 30 && /Liga Plata/.test(R.rankLeague) && R.freeze.freezes === 0 && R.freeze.frozen.length === 1 && R.freeze.streak === 2
    && R.bought.owned.includes('birrete') && R.bought.gems === 170 && /Ya tienes 2/.test(R.freezeMax) && R.shopNoOverflow && R.birreteInAvatar && /Desafío de la semana/.test(R.duelLine) && R.headerNoOverflow
    && /Resumen \d+ 10/.test(R.xlsx) && /Tareas \d+ 9/.test(R.xlsx);
  console.log('errors:', errs.join('\n') || 'none'); console.log(ok && !errs.length ? 'PASS' : 'FAIL');
  await b.close();
})();
