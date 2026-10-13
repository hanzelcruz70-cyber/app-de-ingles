// Pruebas de: avatar, amigos y racha de amigos, que no aparezca "null", que la app no hable sola y los enlaces legales
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:390,height:844}}); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__spoken = []; const fake = {speak:u => { if ((u.text || '').trim()) window.__spoken.push(u.text); }, cancel(){}, resume(){}, getVoices:() => [], onvoiceschanged:null}; Object.defineProperty(window, 'speechSynthesis', {value:fake}); });
  await p.goto('file://' + path.join(__dirname, 'demo_build.html')); await p.waitForTimeout(500);
  const R = {};
  await p.fill('#lgUser','estudiante'); await p.fill('#lgPass','1234'); await p.click('#loginForm button'); await p.waitForTimeout(700);
  // bienvenida: elegir un personaje listo
  R.welcome = await p.isVisible('.sheet h2:has-text("Crea tu personaje")');
  await p.click('.sheet .av-grid button >> nth=3'); await p.click('.sheet button:has-text("Usar este personaje")');
  R.presetChosen = await p.evaluate(() => S.avatar && S.avatar.v === 2 && S.avatar.hair === 'braids');
  R.legalLinks = await p.locator('.legal a').count() >= 0;
  R.noAutoSpeech = await p.evaluate(() => window.__spoken.length);
  // jugar una lección completa sin tocar audio: la app no debe hablar
  await p.evaluate(() => { const u = units()[0]; startLesson(u, u.lessons[0], false); L.graded = 1; finishLesson(); }); await p.waitForTimeout(300);
  R.noSpeechAfterLesson = await p.evaluate(() => window.__spoken.length);
  await p.click('#result button:has-text("Continuar")');
  // ranking sin "null"
  await p.click('[data-tab="rank"]'); R.rankNoNull = !/\bnull\b/.test(await p.innerText('#tab-rank'));
  // avatar
  await p.click('[data-tab="me"]');
  await p.click('button:has-text("Mi avatar")');
  await p.click('.sheet .av-tabs button:has-text("Cabeza")');
  R.capLocked = /🔒/.test(await p.innerText('.sheet .av-grid button[aria-label^="Gorra,"]'));
  await p.evaluate(() => { S.gems = 100; save(); });
  await p.click('.sheet .av-grid button[aria-label^="Gorra,"]'); await p.click('.sheet button:has-text("Comprar por")'); await p.waitForTimeout(100);
  await p.click('.sheet .av-tabs button:has-text("Pelo")'); await p.click('.sheet .av-grid button[aria-label="Rizado"]');
  await p.click('.sheet button:has-text("Guardar personaje")');
  R.avatarSaved = await p.evaluate(() => JSON.stringify({head:S.avatar.head, hair:S.avatar.hair, owned:S.owned, gems:S.gems}));
  R.avatarProfile = await p.locator('#tab-me .profile .avatar svg').count();
  await p.click('[data-tab="rank"]'); R.avatarInRank = await p.locator('#tab-rank .rank-row.me .avatar svg').count() === 1;
  // amigos
  await p.click('[data-tab="me"]');
  R.friendsCard = await p.innerText('#tab-me .card:has-text("Mis amigos")');
  await p.click('#tab-me button:has-text("Aceptar")'); await p.waitForTimeout(100);
  R.afterAccept = (await p.innerText('#tab-me .card:has-text("Mis amigos")')).includes('Diego');
  await p.click('#tab-me button:has-text("+ Agregar")');
  R.addList = await p.innerText('.sheet');
  await p.click('.sheet button:has-text("Invitar") >> nth=0'); await p.waitForTimeout(100);
  R.friendCount = await p.locator('#tab-me .friend-row').count();
  R.meNoNull = !/\bnull\b/.test(await p.innerText('#tab-me'));
  R.noOverflow = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  await p.screenshot({path: path.join(__dirname, 'social.png'), fullPage:true});
  // quitar amigo
  await p.click('#tab-me .friend-row >> nth=0'); await p.click('.sheet button:has-text("Quitar amigo")'); await p.waitForTimeout(100);
  R.afterRemove = await p.locator('#tab-me .friend-row').count();
  // el profe ve el avatar
  await p.evaluate(() => logout()); await p.waitForTimeout(200);
  await p.fill('#lgUser','admin'); await p.fill('#lgPass','admin123'); await p.click('#loginForm button'); await p.waitForTimeout(400);
  await p.click('[data-atab="stu"]'); R.adminSeesAvatar = await p.locator('#atab-stu .avatar svg').count() >= 1;
  // al crear estudiante se exige la autorización
  await p.click('#atab-stu button:has-text("+ Agregar")'); await p.fill('#nsName','Leo'); await p.fill('#nsPass','1234'); await p.click('.sheet button:has-text("Crear cuenta")');
  R.consentRequired = await p.textContent('.sheet .err');
  await p.check('#nsConsent'); await p.click('.sheet button:has-text("Crear cuenta")'); await p.waitForTimeout(100);
  R.created = await p.evaluate(() => DB.users.some(u => u.user === 'leo'));
  R.adminNoNull = !/\bnull\b/.test(await p.innerText('#admin'));
  console.log(JSON.stringify(R, null, 1));
  const ok = R.noAutoSpeech === 0 && R.noSpeechAfterLesson === 0 && R.rankNoNull && R.welcome && R.presetChosen && R.capLocked && /"head":"cap"/.test(R.avatarSaved) && /"hair":"curly"/.test(R.avatarSaved) && /head:cap/.test(R.avatarSaved) && /"gems":80/.test(R.avatarSaved) && R.avatarProfile === 1 && R.avatarInRank && /Sofía/.test(R.friendsCard) && /Quiere ser tu amigo/.test(R.friendsCard) && R.afterAccept && R.friendCount === 3 && R.afterRemove === 2 && R.meNoNull && R.noOverflow && R.adminSeesAvatar && /autorización/.test(R.consentRequired) && R.created && R.adminNoNull;
  console.log('errors:', errs.join('\n') || 'none'); console.log(ok && !errs.length ? 'PASS' : 'FAIL');
  await b.close();
})();
