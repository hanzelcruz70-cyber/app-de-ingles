// Quita los brazos del torso, reduce las piezas al 40 % y las guarda en icons/pandi/ del proyecto.
const fs = require('fs'), path = require('path'), {readPNG, writePNG} = require('./png.cjs');
const SRC = path.join(__dirname, 'piezas'), DST = path.join(__dirname, '..', '..', 'icons', 'pandi'), SC = 0.4;
fs.mkdirSync(DST, {recursive:true});
const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++){ const [xi, yi] = P[i], [xj, yj] = P[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
// brazos del torso (coordenadas del torso de 477x298): se borran con un borde suave de 3 px
const ARM_L = [[0, 40], [72, 34], [100, 80], [92, 140], [88, 200], [70, 260], [0, 260]];
const ARM_R = ARM_L.map(([x, y]) => [477 - x, y]);
function eraseArms(im){
  for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++){
    if (inPoly(x, y, ARM_L) || inPoly(x, y, ARM_R)) im.data[(y * im.w + x) * 4 + 3] = 0;
  }
}
function resize(im, s){
  const W = Math.max(1, Math.round(im.w * s)), H = Math.max(1, Math.round(im.h * s)), out = Buffer.alloc(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
    const x0 = x / s, x1 = (x + 1) / s, y0 = y / s, y1 = (y + 1) / s; let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let yy = Math.floor(y0); yy < Math.min(im.h, Math.ceil(y1)); yy++) for (let xx = Math.floor(x0); xx < Math.min(im.w, Math.ceil(x1)); xx++){
      const o = (yy * im.w + xx) * 4, al = im.data[o + 3]; r += im.data[o] * al; g += im.data[o + 1] * al; b += im.data[o + 2] * al; a += al; n++;
    }
    const o = (y * W + x) * 4; out[o + 3] = Math.round(a / n);
    if (a > 0){ out[o] = Math.round(r / a); out[o + 1] = Math.round(g / a); out[o + 2] = Math.round(b / a); }
  }
  return {w:W, h:H, data:out};
}
const meta = JSON.parse(fs.readFileSync(path.join(SRC, 'meta.json'))), sizes = {};
for (const name of Object.keys(meta)){
  const im = readPNG(path.join(SRC, name + '.png'));
  if (name === 'torso') eraseArms(im);
  const r = resize(im, SC); writePNG(path.join(DST, name + '.png'), r);
  sizes[name] = {w:r.w, h:r.h, bytes:fs.statSync(path.join(DST, name + '.png')).size};
}
console.log(JSON.stringify(sizes)); console.log('total KB', Math.round(Object.values(sizes).reduce((a, s) => a + s.bytes, 0) / 1024));
