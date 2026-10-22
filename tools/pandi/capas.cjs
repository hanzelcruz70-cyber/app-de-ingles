// Capas del Pandi a partir de la imagen ORIGINAL completa (fondo celeste): base, cabeza, brazo levantado,
// tirante (va delante del brazo) y boca cerrada. Lo escondido se rellena con pelo copiado de la misma imagen.
const fs = require('fs'), path = require('path'), {readPNG, writePNG} = require('./png.cjs');
const SRC = process.argv[2] || path.join(__dirname, 'pandi-original.png'); // imagen original del personaje (fondo celeste)
// luego se copian base, arm, strap, head y mouth a icons/pandi/
const OUT = process.argv[3] || path.join(__dirname, 'capas'); fs.mkdirSync(OUT, {recursive:true});
const im = readPNG(SRC), {w, h} = im, d = im.data;
const C = i => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };

// 1) fondo: cielo conectado al borde; abajo (y > 870) también la sombra azul de los pies
const sky = i => { const [r, g, b] = C(i); return r >= 78 && r <= 175 && g >= 180 && b >= 212; };
const shadow = i => { const y = (i / w) | 0, [r, g, b] = C(i); return y > 868 && b > r + 40 && b >= g; };
const bg = new Uint8Array(w * h), st = [];
for (let x = 0; x < w; x++) st.push(x, (h - 1) * w + x); for (let y = 0; y < h; y++) st.push(y * w, y * w + w - 1);
while (st.length){ const i = st.pop(); if (bg[i] || !(sky(i) || shadow(i))) continue; bg[i] = 1; const x = i % w, y = (i / w) | 0;
  if (x > 0) st.push(i - 1); if (x < w - 1) st.push(i + 1); if (y > 0) st.push(i - w); if (y < h - 1) st.push(i + w); }

// 2) alfa en el borde: cada píxel de la franja es mezcla del pelo cercano (fg) y del cielo cercano (bg)
const dist = new Uint8Array(w * h).fill(9), bgc = new Int32Array(w * h).fill(-1), q = [];
for (let i = 0; i < w * h; i++) if (bg[i]) { dist[i] = 0; bgc[i] = i; q.push(i); }
for (let k = 0; k < q.length; k++){ const i = q[k], x = i % w, y = (i / w) | 0; if (dist[i] >= 4) continue;
  for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) if (j >= 0 && dist[j] > dist[i] + 1){ dist[j] = dist[i] + 1; bgc[j] = bgc[i]; q.push(j); } }
const A = new Uint8Array(w * h), rgb = Buffer.from(d);
for (let i = 0; i < w * h; i++){
  if (bg[i]) continue;
  if (dist[i] > 3) { A[i] = 255; continue; }
  const x = i % w, y = (i / w) | 0, B = C(bgc[i]);
  let best = null, bd = 1e9; // pelo: el píxel interior más cercano
  for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++){ const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const j = yy * w + xx; if (dist[j] > 3 && dx * dx + dy * dy < bd){ bd = dx * dx + dy * dy; best = C(j); } }
  if (!best){ A[i] = 255; continue; }
  const c = C(i), fb = best.map((v, k) => v - B[k]), cb = c.map((v, k) => v - B[k]), den = fb.reduce((s, v) => s + v * v, 0);
  const al = den < 400 ? 1 : Math.max(0, Math.min(1, cb.reduce((s, v, k) => s + v * fb[k], 0) / den));
  A[i] = Math.round(al * 255);
  if (al > 0.03) for (let k = 0; k < 3; k++) rgb[i * 4 + k] = Math.max(0, Math.min(255, Math.round((c[k] - (1 - al) * B[k]) / al)));
}

// 3) zonas (coordenadas de la imagen de 1024)
const ARM = [[698, 472], [712, 440], [722, 392], [732, 330], [780, 280], [860, 285], [905, 345], [902, 415], [870, 455], [840, 490], [808, 530], [776, 566], [750, 590], [716, 582], [692, 522]];
const STRAP = [[640, 470], [664, 452], [692, 478], [708, 538], [728, 588], [720, 608], [700, 602], [684, 560], [664, 522], [644, 496]];
const HEAD = [[195, 85], [745, 85], [740, 250], [728, 330], [716, 400], [700, 446], [660, 472], [602, 498], [540, 522], [472, 527], [400, 517], [322, 501], [252, 489], [195, 472]];
const ARM_PIVOT = [705, 522], NECK_KEEP = 34; // franja bajo la barbilla que se rellena con pelo negro
const crop = {x:220, y:96, w:664, h:858}, SC = 0.4;

const layer = () => Buffer.alloc(w * h * 4);
// distancia de un punto al borde de un polígono (para que las capas se encimen unos píxeles y no se vea el fondo en la unión)
const edgeDist = (x, y, P) => { let m = 1e9; for (let k = 0, j = P.length - 1; k < P.length; j = k++){ const [ax, ay] = P[j], [bx, by] = P[k], vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy))); m = Math.min(m, Math.hypot(ax + t * vx - x, ay + t * vy - y)); } return m; };
const near = (x, y, P, r) => inPoly(x, y, P) || edgeDist(x, y, P) < r;
// tirante: solo los píxeles azules o amarillos (y su borde oscuro inmediato)
const strapColor = i => { const [r, g, b] = C(i); return (b > r + 35 && b > 90) || (r > 170 && g > 120 && b < 140); };
// contorno del cuerpo bajo el brazo: a la derecha de esta línea solo hay brazo y cielo
const bodySide = (x, y) => x < 700 + (y - 470) * 0.32;
// unión del brazo con el cuerpo (hombro): solo ahí la base guarda una franja para que no se vea la costura
const JOINT = [[700, 470], [692, 522], [716, 580]];
const lineDist = (x, y, P) => { let m = 1e9; for (let k = 0; k < P.length - 1; k++){ const [ax, ay] = P[k], [bx, by] = P[k + 1], vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy))); m = Math.min(m, Math.hypot(ax + t * vx - x, ay + t * vy - y)); } return m; };
const put = (L, i, src = rgb, a = A[i]) => { L[i * 4] = src[i * 4]; L[i * 4 + 1] = src[i * 4 + 1]; L[i * 4 + 2] = src[i * 4 + 2]; L[i * 4 + 3] = a; };
const base = layer(), head = layer(), arm = layer(), strap = layer();
// distancia de cada punto al borde inferior de la cabeza (para la franja del cuello)
const headCut = HEAD.slice(5); // de (745,400) a (195,472) por la barbilla
const distToCut = (x, y) => { let m = 1e9; for (let k = 0; k < headCut.length - 1; k++){ const [ax, ay] = headCut[k], [bx, by] = headCut[k + 1], vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy))), px = ax + t * vx - x, py = ay + t * vy - y; m = Math.min(m, Math.hypot(px, py)); } return m; };
// parche de pelo negro para el cuello (de debajo de la pañoleta, a la derecha del nudo)
const FUR = {x:578, y:536, w:36, h:22};
for (let y = 0; y < h; y++) for (let x = 0; x < w; x++){
  const i = y * w + x; if (!A[i]) continue;
  const inStrapZone = near(x, y, STRAP, 2);
  let isStrap = false;
  if (inStrapZone){ isStrap = strapColor(i); if (!isStrap) for (let dy = -2; dy <= 2 && !isStrap; dy++) for (let dx = -2; dx <= 2 && !isStrap; dx++){ const j = (y + dy) * w + x + dx; if (j >= 0 && j < w * h && strapColor(j) && inPoly(x + dx, y + dy, STRAP)) isStrap = true; } }
  if (isStrap) put(strap, i);
  const inArm = inPoly(x, y, ARM), nearArm = near(x, y, ARM, 3), inHead = inPoly(x, y, HEAD), nearHead = near(x, y, HEAD, 3);
  // capas que se mueven: se extienden 3 px fuera de su zona para cubrir la unión
  if (inArm) put(arm, i);
  if (inHead && !inArm) put(head, i);
  // base: todo lo que no es brazo ni cabeza, más una franja de 5 px por dentro de esas zonas (sin costura en reposo)
  if (inArm){ const keep = bodySide(x, y) && (lineDist(x, y, JOINT) < 6 || Math.hypot(x - ARM_PIVOT[0], y - ARM_PIVOT[1]) < 30); if (keep) put(base, i); continue; }
  if (inHead){
    if (distToCut(x, y) < 5) put(base, i);
    else if (distToCut(x, y) < NECK_KEEP && y > 430){ const sx = FUR.x + (x % FUR.w), sy = FUR.y + (y % FUR.h), si = sy * w + sx; base[i * 4] = rgb[si * 4]; base[i * 4 + 1] = rgb[si * 4 + 1]; base[i * 4 + 2] = rgb[si * 4 + 2]; base[i * 4 + 3] = 255; }
    continue;
  }
  put(base, i);
}
out('_neck', (() => { const L = layer(); for (let i = 0; i < w * h; i++) if (base[i * 4 + 3] && inPoly(i % w, (i / w) | 0, HEAD)) { L[i * 4] = base[i * 4]; L[i * 4 + 1] = base[i * 4 + 1]; L[i * 4 + 2] = base[i * 4 + 2]; L[i * 4 + 3] = base[i * 4 + 3]; } return L; })());
// 4) boca cerrada: elipse rellena con pelo de la mejilla izquierda (misma luz), bordes suaves y sonrisa dibujada
const M = {cx:513, cy:414, rx:64, ry:34}, OFF = [-128, 26];
const mouth = layer();
for (let y = M.cy - M.ry - 3; y <= M.cy + M.ry + 3; y++) for (let x = M.cx - M.rx - 3; x <= M.cx + M.rx + 3; x++){
  const e = ((x - M.cx) / M.rx) ** 2 + ((y - M.cy) / M.ry) ** 2; if (e > 1) continue;
  if (y < 384) continue; // no tapar la nariz
  const i = y * w + x, si = (y + OFF[1]) * w + (x + OFF[0]), al = Math.min(1, (1 - e) / 0.35);
  mouth[i * 4] = rgb[si * 4]; mouth[i * 4 + 1] = rgb[si * 4 + 1]; mouth[i * 4 + 2] = rgb[si * 4 + 2]; mouth[i * 4 + 3] = Math.round(255 * al);
}
// sonrisa: curva suave bajo la nariz
const dot = (x, y, r, col) => { for (let yy = Math.floor(y - r - 1); yy <= y + r + 1; yy++) for (let xx = Math.floor(x - r - 1); xx <= x + r + 1; xx++){ const dd = Math.hypot(xx - x, yy - y), a = Math.max(0, Math.min(1, r + 0.5 - dd)); if (a <= 0) continue; const i = yy * w + xx; for (let k = 0; k < 3; k++) mouth[i * 4 + k] = Math.round(mouth[i * 4 + k] * (1 - a) + col[k] * a); mouth[i * 4 + 3] = Math.max(mouth[i * 4 + 3], Math.round(255 * a)); } };
const bez = (p0, p1, p2, r, col) => { for (let t = 0; t <= 1; t += 0.004){ const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0], y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]; dot(x, y, r, col); } };
const LIP = [70, 38, 40];
bez([508, 386], [507, 395], [506, 401], 2.2, LIP);          // línea de la nariz a la boca
bez([466, 398], [486, 418], [506, 401], 2.6, LIP);          // mitad izquierda de la sonrisa
bez([506, 401], [528, 418], [552, 395], 2.6, LIP);          // mitad derecha

// 5) recortar al marco del personaje, reducir y guardar
function out(name, L, box = crop){
  const W = Math.round(box.w * SC), H = Math.round(box.h * SC), o = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = Math.floor(box.y + y / SC); yy < Math.min(h, Math.ceil(box.y + (y + 1) / SC)); yy++) for (let xx = Math.floor(box.x + x / SC); xx < Math.min(w, Math.ceil(box.x + (x + 1) / SC)); xx++){ const k = (yy * w + xx) * 4, al = L[k + 3]; r += L[k] * al; g += L[k + 1] * al; b += L[k + 2] * al; a += al; n++; }
    const k = (y * W + x) * 4; o[k + 3] = Math.round(a / n); if (a){ o[k] = Math.round(r / a); o[k + 1] = Math.round(g / a); o[k + 2] = Math.round(b / a); }
  }
  writePNG(path.join(OUT, name + '.png'), {w:W, h:H, data:o});
  return {w:W, h:H, bytes:fs.statSync(path.join(OUT, name + '.png')).size};
}
// Las capas se reparten al tamaño final: cada píxel reducido es de UNA sola capa y lleva el color completo del original
// (así ninguna unión deja pasar el fondo). La base guarda además, bajo la cabeza y el hombro, lo necesario para cuando se mueven.
const resFull = out('full', (() => { const L = layer(); for (let i = 0; i < w * h; i++) if (A[i]) put(L, i); return L; })());
const F = readPNG(path.join(OUT, 'full.png')), NB = readPNG(path.join(OUT, '_neck.png', )).data;
const OW = F.w, OH = F.h, Lb = Buffer.alloc(OW * OH * 4), Lh = Buffer.alloc(OW * OH * 4), La = Buffer.alloc(OW * OH * 4), Ls = Buffer.alloc(OW * OH * 4);
const cp = (dst, k, srcBuf = F.data) => { dst[k] = srcBuf[k]; dst[k + 1] = srcBuf[k + 1]; dst[k + 2] = srcBuf[k + 2]; dst[k + 3] = srcBuf[k + 3]; };
for (let y = 0; y < OH; y++) for (let x = 0; x < OW; x++){
  const k = (y * OW + x) * 4; if (!F.data[k + 3]) continue;
  const sx = crop.x + (x + 0.5) / SC, sy = crop.y + (y + 0.5) / SC, si = Math.floor(sy) * w + Math.floor(sx);
  const isStrap = strap[si * 4 + 3] > 0;
  if (isStrap){ cp(Ls, k); cp(Lb, k); continue; }
  if (inPoly(sx, sy, ARM)){ cp(La, k); if (bodySide(sx, sy) && (lineDist(sx, sy, JOINT) < 8 || Math.hypot(sx - ARM_PIVOT[0], sy - ARM_PIVOT[1]) < 30)) cp(Lb, k); continue; }
  if (inPoly(sx, sy, HEAD)){ cp(Lh, k); if (distToCut(sx, sy) < 7) cp(Lb, k); else if (NB[k + 3]) cp(Lb, k, NB); continue; }
  cp(Lb, k);
}
// brazo y cabeza cubren 1 píxel más en su borde: al reducir, el navegador mezcla vecinos y sin esto se vería una línea
const grow = L => { const add = []; for (let y = 1; y < OH - 1; y++) for (let x = 1; x < OW - 1; x++){ const k = (y * OW + x) * 4; if (L[k + 3] || !F.data[k + 3]) continue;
  if (L[k + 7] || L[k - 1] || L[k + OW * 4 + 3] || L[k - OW * 4 + 3]) add.push(k); } for (const k of add) cp(L, k); };
grow(La); grow(Lh);
const save = (n, L) => { writePNG(path.join(OUT, n + '.png'), {w:OW, h:OH, data:L}); return {w:OW, h:OH, bytes:fs.statSync(path.join(OUT, n + '.png')).size}; };
const res = {base:save('base', Lb), head:save('head', Lh), arm:save('arm', La), strap:save('strap', Ls), mouth:out('mouth', mouth), full:resFull};
fs.unlinkSync(path.join(OUT, '_neck.png'));
const P = ([x, y]) => [+((x - crop.x) * SC).toFixed(1), +((y - crop.y) * SC).toFixed(1)];
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify({size:[res.base.w, res.base.h], armPivot:P(ARM_PIVOT), neck:P([480, 520]), eyeL:[...P([407, 340]), 42 * SC, 40 * SC], eyeR:[...P([580, 300]), 40 * SC, 36 * SC], paw:P([805, 355]), files:res}, null, 1));
console.log(JSON.stringify(res));
