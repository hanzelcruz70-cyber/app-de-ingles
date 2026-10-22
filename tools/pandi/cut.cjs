// Recorta las piezas del Pandi de la hoja (fondo blanco) y las guarda como PNG con transparencia.
const fs = require('fs'), path = require('path');
const {readPNG, writePNG} = require('./png.cjs');
const SHEET = path.join(__dirname, 'pandi-partes.png'); // hoja de partes del personaje (fondo blanco)
// piezas a tamaño completo (no se publican)
const OUT = path.join(__dirname, 'piezas'); fs.mkdirSync(OUT, {recursive:true});
const im = readPNG(SHEET), {w, h} = im, d = im.data;
const L = i => 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
const S = i => Math.max(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]) - Math.min(d[i * 4], d[i * 4 + 1], d[i * 4 + 2]);
const isBgish = i => L(i) >= 244 && S(i) <= 12;

// 1) fondo = blanco conectado con el borde de la hoja
const bg = new Uint8Array(w * h);
function flood(seeds, test, mark){
  const st = [...seeds];
  while (st.length){ const i = st.pop(); if (mark[i] || !test(i)) continue; mark[i] = 1; const x = i % w, y = (i / w) | 0;
    if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w); }
}
const border = []; for (let x = 0; x < w; x++){ border.push(x, (h - 1) * w + x); } for (let y = 0; y < h; y++){ border.push(y * w, y * w + w - 1); }
flood(border, isBgish, bg);
// 2) huecos de los ojos en la cabeza (blanco encerrado): también transparentes
flood([175 * w + 128, 175 * w + 240], i => L(i) >= 236, bg);
// hueco del cuello de la pañoleta
flood([450 * w + 632, 462 * w + 632], i => L(i) >= 236, bg);

// 3) alfa con borde suave y sin halo blanco: en la franja de 3 px junto al fondo, cada píxel se toma como
// mezcla del pelo (el tono más oscuro cercano) con el blanco del fondo, y se quita la parte blanca
const dist = new Uint8Array(w * h).fill(9), q = [];
for (let i = 0; i < w * h; i++) if (bg[i]) { dist[i] = 0; q.push(i); }
for (let qi = 0; qi < q.length; qi++){ const i = q[qi], x = i % w, y = (i / w) | 0; if (dist[i] >= 3) continue;
  for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && dist[j] > dist[i] + 1){ dist[j] = dist[i] + 1; q.push(j); } }
const a = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++){
  if (bg[i]) { a[i] = 0; continue; }
  if (dist[i] > 3) { a[i] = 255; continue; }
  const x = i % w, y = (i / w) | 0; let fg = 255;
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++){ const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (!bg[j] && dist[j] > dist[i]) fg = Math.min(fg, L(j)); }
  const l = L(i);
  const al = fg >= 250 ? 1 : Math.max(0, Math.min(1, (255 - l) / (255 - fg)));
  a[i] = Math.round(al * 255);
  if (al > 0.02) for (let c = 0; c < 3; c++) d[i * 4 + c] = Math.max(0, Math.min(255, Math.round((d[i * 4 + c] - 255 * (1 - al)) / al)));
}

// 4) piezas: rectángulo en la hoja; se quedan solo los componentes grandes (sin los letreros)
const PIECES = {
  head:[30, 40, 340, 326], eyeL:[398, 62, 492, 148], eyeR:[528, 62, 622, 148], arcBlink:[532, 205, 622, 255],
  arcL:[398, 318, 488, 364], arcR:[532, 318, 622, 364], mouthLaugh:[798, 78, 922, 142], mouthHappy:[792, 178, 928, 254], mouthO:[828, 292, 898, 354],
  torso:[22, 388, 508, 692], scarf:[528, 402, 738, 608], backpack:[782, 398, 992, 618], armL:[38, 738, 278, 958], armR:[288, 748, 505, 978],
  handR:[414, 752, 508, 856], bamboo:[556, 736, 624, 952], footL:[692, 678, 808, 792], footR:[836, 678, 952, 792], legL:[662, 798, 802, 978], legR:[846, 798, 982, 978],
};
const meta = {};
for (const [name, [x0, y0, x1, y1]] of Object.entries(PIECES)){
  const pw = x1 - x0, ph = y1 - y0, lab = new Int32Array(pw * ph).fill(-1), sizes = [];
  for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++){
    const k = yy * pw + xx; if (lab[k] >= 0 || a[(y0 + yy) * w + x0 + xx] < 40) continue;
    const id = sizes.length; let n = 0; const st = [k];
    while (st.length){ const q = st.pop(); if (lab[q] >= 0) continue; const qx = q % pw, qy = (q / pw) | 0; if (a[(y0 + qy) * w + x0 + qx] < 40) continue; lab[q] = id; n++;
      if (qx > 0) st.push(q - 1); if (qx < pw - 1) st.push(q + 1); if (qy > 0) st.push(q - pw); if (qy < ph - 1) st.push(q + pw); }
    sizes.push(n);
  }
  const big = Math.max(...sizes), keep = new Set(sizes.map((n, i) => (name === 'armR' ? n === big : n >= big * 0.25) ? i : -1).filter(i => i >= 0));
  // recorte ajustado
  let bx0 = pw, by0 = ph, bx1 = 0, by1 = 0;
  for (let k = 0; k < pw * ph; k++){ const near = lab[k] >= 0 ? keep.has(lab[k]) : false; if (!near) continue; const xx = k % pw, yy = (k / pw) | 0; bx0 = Math.min(bx0, xx); by0 = Math.min(by0, yy); bx1 = Math.max(bx1, xx); by1 = Math.max(by1, yy); }
  bx0 = Math.max(0, bx0 - 2); by0 = Math.max(0, by0 - 2); bx1 = Math.min(pw - 1, bx1 + 2); by1 = Math.min(ph - 1, by1 + 2);
  const ow = bx1 - bx0 + 1, oh = by1 - by0 + 1, out = Buffer.alloc(ow * oh * 4);
  for (let yy = 0; yy < oh; yy++) for (let xx = 0; xx < ow; xx++){
    const sx = x0 + bx0 + xx, sy = y0 + by0 + yy, si = sy * w + sx, k = (by0 + yy) * pw + bx0 + xx, o = (yy * ow + xx) * 4;
    // los píxeles de borde suave que no tienen etiqueta se conservan si tocan un componente que se queda
    let ok = lab[k] >= 0 ? keep.has(lab[k]) : a[si] > 0;
    out[o] = d[si * 4]; out[o + 1] = d[si * 4 + 1]; out[o + 2] = d[si * 4 + 2]; out[o + 3] = ok ? a[si] : 0;
  }
  writePNG(path.join(OUT, name + '.png'), {w:ow, h:oh, data:out});
  meta[name] = {x:x0 + bx0, y:y0 + by0, w:ow, h:oh, parts:keep.size, dropped:sizes.length - keep.size};
}
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
console.log(Object.entries(meta).map(([k, m]) => `${k}: ${m.w}x${m.h} en (${m.x},${m.y}) piezas=${m.parts} quitados=${m.dropped}`).join('\n'));
