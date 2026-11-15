// Recorta el fondo celeste liso de una imagen de Pandi generada con IA y la deja en PNG transparente.
// Uso: node tools/pandi/recortar.cjs entrada.png salida.png [anchoFinal]
// Fondo: todo lo que se conecta con el borde y tiene un color parecido al de las esquinas. El borde del pelo
// se mezcla con alfa (mismo método que capas.cjs) para que no quede halo celeste.
const fs = require('fs'), path = require('path'), {readPNG, writePNG} = require('./png.cjs');
const [SRC, OUT, WIDTH] = process.argv.slice(2);
if (!SRC || !OUT){ console.error('Uso: node tools/pandi/recortar.cjs entrada.png salida.png [anchoFinal]'); process.exit(1); }
const im = readPNG(SRC), {w, h} = im, d = im.data;
const C = i => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
// color del fondo: promedio de las cuatro esquinas
const corners = [0, w - 1, (h - 1) * w, (h - 1) * w + w - 1].map(C);
const BG = [0, 1, 2].map(k => Math.round(corners.reduce((s, c) => s + c[k], 0) / 4));
const TOL = +(process.env.TOL || 46);
// también la sombra azul bajo los pies (más oscura que el cielo), solo en la parte baja de la imagen
const isBg = i => { const c = C(i), y = (i / w) | 0; return (Math.abs(c[0] - BG[0]) < TOL && Math.abs(c[1] - BG[1]) < TOL && Math.abs(c[2] - BG[2]) < TOL) || (y > h * 0.8 && c[2] > c[0] + 40 && c[2] >= c[1] && c[0] < 150); };
// 1) fondo conectado al borde
const bg = new Uint8Array(w * h), st = [];
for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x); for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
while (st.length){ const i = st.pop(); if (bg[i] || !isBg(i)) continue; bg[i] = 1; const x = i % w, y = (i / w) | 0;
  if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w); }
// 2) alfa en la franja del borde
const dist = new Uint8Array(w * h).fill(9), bgc = new Int32Array(w * h).fill(-1), q = [];
for (let i = 0; i < w * h; i++) if (bg[i]) { dist[i] = 0; bgc[i] = i; q.push(i); }
for (let k = 0; k < q.length; k++){ const i = q[k], x = i % w, y = (i / w) | 0; if (dist[i] >= 4) continue;
  for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && dist[j] > dist[i] + 1){ dist[j] = dist[i] + 1; bgc[j] = bgc[i]; q.push(j); } }
const out = Buffer.alloc(w * h * 4);
let minX = w, minY = h, maxX = 0, maxY = 0;
for (let i = 0; i < w * h; i++){
  if (bg[i]) continue;
  const x = i % w, y = (i / w) | 0, c = C(i);
  let a = 255, col = c;
  if (dist[i] <= 3){
    const B = C(bgc[i]); let best = null, bd = 1e9;
    for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++){ const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (dist[j] > 3){ const dd = dx * dx + dy * dy; if (dd < bd){ bd = dd; best = C(j); } } }
    if (best){
      const fb = best.map((v, k) => v - B[k]), cb = c.map((v, k) => v - B[k]), den = fb.reduce((s, v) => s + v * v, 0);
      const al = den < 400 ? 1 : Math.max(0, Math.min(1, cb.reduce((s, v, k) => s + v * fb[k], 0) / den));
      a = Math.round(al * 255);
      if (al > 0.03) col = c.map((v, k) => Math.max(0, Math.min(255, Math.round((v - (1 - al) * B[k]) / al))));
    }
  }
  if (a > 8){ minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y); }
  out[i * 4] = col[0]; out[i * 4 + 1] = col[1]; out[i * 4 + 2] = col[2]; out[i * 4 + 3] = a;
}
// 3) recorte al personaje (con 6 px de aire) y escala al ancho pedido
const pad = 6, cx = Math.max(0, minX - pad), cy = Math.max(0, minY - pad), cw = Math.min(w, maxX + pad) - cx, ch = Math.min(h, maxY + pad) - cy;
const tw = WIDTH ? +WIDTH : cw, sc = tw / cw, th = Math.round(ch * sc);
const res = Buffer.alloc(tw * th * 4);
for (let y = 0; y < th; y++) for (let x = 0; x < tw; x++){
  // promedio de la caja de origen (reduce sin dientes)
  const x0 = cx + Math.floor(x / sc), x1 = Math.max(x0 + 1, cx + Math.floor((x + 1) / sc)), y0 = cy + Math.floor(y / sc), y1 = Math.max(y0 + 1, cy + Math.floor((y + 1) / sc));
  let r = 0, g = 0, b = 0, a = 0, n = 0;
  for (let yy = y0; yy < y1 && yy < h; yy++) for (let xx = x0; xx < x1 && xx < w; xx++){ const j = (yy * w + xx) * 4, al = out[j + 3]; r += out[j] * al; g += out[j + 1] * al; b += out[j + 2] * al; a += al; n++; }
  const o = (y * tw + x) * 4;
  if (a > 0){ res[o] = Math.round(r / a); res[o + 1] = Math.round(g / a); res[o + 2] = Math.round(b / a); res[o + 3] = Math.round(a / n); }
}
fs.mkdirSync(path.dirname(OUT), {recursive:true});
writePNG(OUT, {w:tw, h:th, data:res});
console.log(`${path.basename(OUT)}: ${tw}×${th} (fondo ${BG.join(',')}, recorte ${cw}×${ch})`);
