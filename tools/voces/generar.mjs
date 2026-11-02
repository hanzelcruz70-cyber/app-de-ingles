// Pandi English · genera con ElevenLabs los audios de tools/voces/textos.json y arma audio/indice.js
// Uso (en la carpeta del proyecto):
//   node tools/voces/generar.mjs --estimar            cuenta caracteres y créditos, no gasta nada
//   node tools/voces/generar.mjs --solo=cuentos       solo cuentos y cantos (una voz por personaje)
//   node tools/voces/generar.mjs --solo=palabras      solo las palabras sueltas
//   node tools/voces/generar.mjs --limite=20000       para cuando lleve 20 000 caracteres
//   node tools/voces/generar.mjs --indice             solo vuelve a armar audio/indice.js
// La llave de API va en la variable ELEVENLABS_API_KEY o en tools/voces/.llave (ese archivo no se sube a GitHub).
// Lo que ya existe no se vuelve a pedir (no se paga dos veces); --rehacer lo pide de nuevo.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = path.join(ROOT, 'audio');
const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/voces/voces.json'), 'utf8'));
const textos = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/voces/textos.json'), 'utf8'));
const arg = k => { const a = process.argv.find(x => x === '--' + k || x.startsWith('--' + k + '=')); return a ? (a.split('=')[1] ?? true) : null; };
const solo = arg('solo'), limite = +arg('limite') || Infinity, rehacer = !!arg('rehacer');
const PRECIO = /flash|turbo/.test(cfg.modelo) ? 0.5 : 1; // créditos por carácter

const vozDe = who => cfg.voces[(who && cfg.personajes[who]) || 'narrador'];
const archivo = t => crypto.createHash('sha1').update(`${vozDe(t.who).id}|${cfg.modelo}|${t.text}`).digest('hex').slice(0, 16) + '.mp3';
const elegidos = textos.filter(t => !solo || (solo === 'cuentos' ? t.who : !t.who));

function indice(){
  const map = {};
  for (const t of textos){ const f = archivo(t); if (fs.existsSync(path.join(DIR, f))) map[(t.who || '') + '|' + t.text] = f; }
  fs.mkdirSync(DIR, {recursive:true});
  fs.writeFileSync(path.join(DIR, 'indice.js'), '// Generado por tools/voces/generar.mjs: texto → audio de ElevenLabs\nwindow.PANDI_AUDIO = ' + JSON.stringify(map) + ';\n');
  return Object.keys(map).length;
}

const faltan = elegidos.filter(t => rehacer || !fs.existsSync(path.join(DIR, archivo(t))));
const chars = faltan.reduce((a, t) => a + t.text.length, 0);
console.log(`Textos: ${elegidos.length} · faltan ${faltan.length} · ${chars} caracteres · unos ${Math.ceil(chars * PRECIO)} créditos (${cfg.modelo})`);
if (arg('estimar')) process.exit(0);
if (arg('indice')){ console.log('Índice: ' + indice() + ' audios'); process.exit(0); }

let KEY = process.env.ELEVENLABS_API_KEY;
const llave = path.join(ROOT, 'tools/voces/.llave');
if (!KEY && fs.existsSync(llave)) KEY = fs.readFileSync(llave, 'utf8').trim();
if (!KEY){ console.error('Falta la llave de ElevenLabs: ponla en ELEVENLABS_API_KEY o en tools/voces/.llave'); process.exit(1); }

fs.mkdirSync(DIR, {recursive:true});
let gastado = 0, hechos = 0, parar = false;
const sinVoz = new Set();
async function uno(t){
  const v = vozDe(t.who);
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${v.id}?output_format=${cfg.formato}`, {
    method:'POST', headers:{'xi-api-key':KEY, 'content-type':'application/json', accept:'audio/mpeg'},
    body:JSON.stringify({text:t.text, model_id:cfg.modelo, voice_settings:cfg.ajustes})
  });
  if (!res.ok){
    const msg = await res.text();
    if (res.status === 401 || /quota|credits|limit/i.test(msg)){ parar = true; console.error(`\nElevenLabs dijo que no (${res.status}): ${msg.slice(0, 300)}`); return; }
    if (res.status === 404 || /voice_not_found|voice not found/i.test(msg)){ sinVoz.add(v.nombre + ' · ' + v.id); return; }
    if (res.status === 429){ await new Promise(r => setTimeout(r, 4000)); return uno(t); }
    console.error(`\nNo se pudo "${t.text.slice(0, 40)}" (${res.status}): ${msg.slice(0, 200)}`); return;
  }
  fs.writeFileSync(path.join(DIR, archivo(t)), Buffer.from(await res.arrayBuffer()));
  gastado += t.text.length; hechos++;
  if (hechos % 25 === 0) process.stdout.write(`\r${hechos}/${faltan.length} audios · ${gastado} caracteres`);
}
const cola = faltan.slice();
await Promise.all([0, 1].map(async () => {
  while (cola.length && !parar){
    const t = cola.shift();
    if (gastado + t.text.length > limite){ parar = true; break; }
    await uno(t);
  }
}));
console.log(`\nListo: ${hechos} audios nuevos, ${gastado} caracteres (unos ${Math.ceil(gastado * PRECIO)} créditos).`);
if (sinVoz.size) console.log('Estas voces no están en tu cuenta. Agrégalas en ElevenLabs → Voice Library → Add to My Voices y vuelve a correr:\n  ' + [...sinVoz].join('\n  '));
console.log('Índice: ' + indice() + ' audios en audio/indice.js');
