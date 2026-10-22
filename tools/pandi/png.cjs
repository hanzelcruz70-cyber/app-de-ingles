// PNG mínimo en Node (sin dependencias): leer RGB/RGBA de 8 bits y escribir RGBA.
const fs = require('fs'), zlib = require('zlib');
function readPNG(file){
  const b = fs.readFileSync(file); let p = 8, w, h, ct, idat = [];
  while (p < b.length){
    const len = b.readUInt32BE(p), type = b.toString('ascii', p + 4, p + 8), d = b.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR'){ w = d.readUInt32BE(0); h = d.readUInt32BE(4); if (d[8] !== 8) throw new Error('solo 8 bits'); ct = d[9]; if (d[12]) throw new Error('entrelazado no soportado'); }
    if (type === 'IDAT') idat.push(d);
    p += 12 + len;
  }
  const ch = ct === 6 ? 4 : ct === 2 ? 3 : (() => { throw new Error('tipo de color ' + ct); })();
  const raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * ch, out = Buffer.alloc(w * h * 4), prev = Buffer.alloc(stride), cur = Buffer.alloc(stride);
  for (let y = 0; y < h; y++){
    const f = raw[y * (stride + 1)]; raw.copy(cur, 0, y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++){
      const a = x >= ch ? cur[x - ch] : 0, up = prev[x], c = x >= ch ? prev[x - ch] : 0;
      let v = cur[x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4){ const pp = a + up - c, pa = Math.abs(pp - a), pb = Math.abs(pp - up), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      cur[x] = v & 255;
    }
    for (let x = 0; x < w; x++){ const o = (y * w + x) * 4; out[o] = cur[x * ch]; out[o + 1] = cur[x * ch + 1]; out[o + 2] = cur[x * ch + 2]; out[o + 3] = ch === 4 ? cur[x * ch + 3] : 255; }
    cur.copy(prev);
  }
  return {w, h, data:out};
}
const CRC = (() => { const t = new Int32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c; } return t; })();
const crc = buf => { let c = -1; for (const x of buf) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function chunk(type, data){ const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'ascii'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); }
function writePNG(file, {w, h, data}){
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++){ raw[y * (w * 4 + 1)] = 0; data.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4); }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw, {level:9})), chunk('IEND', Buffer.alloc(0))]));
}
module.exports = {readPNG, writePNG};
