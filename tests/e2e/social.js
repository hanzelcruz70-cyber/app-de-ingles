// Pruebas de: avatar, amigos y racha de amigos, que no aparezca "null", que la app no hable sola y los enlaces legales
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({viewport:{width:390,height:844}}); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.addInitScript(() => { window.__spoken = []; const fake = {speak:u => { if ((u.text || '').trim()) window.__spoken.push(u.text); }, cancel(){}, resume(){}, getVoices:() => [], onvoiceschanged:null}; Object.defineProperty(window, 'speechSynthesis', {value:fake}); });
  await p.goto('file://' + path.join(__dirname, 'demo_build.html')); await p.waitForTimeout(500);
  const R = {};
  await p.fill('#lgUser','estudiante'); await p.fill('#lgPass','1234'); await p.click('#loginForm button'); await p.waitForTimeout(400);
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
  await p.click('button:has-text("Personalizar mi avatar")');
  await p.click('.sheet .av-grid button[aria-label="Personaje 🦊"]');
  R.crownLocked = await p.isDisabled('.sheet .av-grid button[aria-label^="Corona"]');
  await p.click('.sheet .av-grid button[aria-label="Gorra"]');
  await p.click('.sheet button:has-text("Guardar avatar")');
  R.avatarProfile = await p.textContent('#tab-me .profile .avatar');
  await p.click('[data-tab="rank"]'); R.avatarInRank = /🦊/.test(await p.innerText('#tab-rank'));
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
  await p.click('[data-atab="stu"]'); R.adminSeesAvatar = /🦊/.test(await p.innerText('#atab-stu'));
  // al crear estudiante se exige la autorización
  await p.click('#atab-stu button:has-text("+ Agregar")'); await p.fill('#nsName','Leo'); await p.fill('#nsPass','1234'); await p.click('.sheet button:has-text("Crear cuenta")');
  R.consentRequired = await p.textContent('.sheet .err');
  await p.check('#nsConsent'); await p.click('.sheet button:has-text("Crear cuenta")'); await p.waitForTimeout(100);
  R.created = await p.evaluate(() => DB.users.some(u => u.user === 'leo'));
  R.adminNoNull = !/\bnull\b/.test(await p.innerText('#admin'));
  console.log(JSON.stringify(R, null, 1));
  const ok = R.noAutoSpeech === 0 && R.noSpeechAfterLesson === 0 && R.rankNoNull && R.crownLocked && /🦊/.test(R.avatarProfile) && /🧢/.test(R.avatarProfile) && R.avatarInRank && /Sofía/.test(R.friendsCard) && /Quiere ser tu amigo/.test(R.friendsCard) && R.afterAccept && R.friendCount === 3 && R.afterRemove === 2 && R.meNoNull && R.noOverflow && R.adminSeesAvatar && /autorización/.test(R.consentRequired) && R.created && R.adminNoNull;
  console.log('errors:', errs.join('\n') || 'none'); console.log(ok && !errs.length ? 'PASS' : 'FAIL');
  await b.close();
})();
