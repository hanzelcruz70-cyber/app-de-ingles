// Sirve Pandi English en modo demo (config.js vacío)
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), port = +process.env.PORT || +process.argv[2] || 4320;
const types = {'.mp4':'video/mp4', '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.png':'image/png', '.json':'application/json', '.webmanifest':'application/manifest+json', '.mp3':'audio/mpeg'};
http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/config.js') { res.writeHead(200, {'content-type':'text/javascript'}); return res.end('window.PANDI_CONFIG = {};'); }
  if (url === '/sw.js') { res.writeHead(404); return res.end(); }
  const file = path.join(root, url === '/' ? 'index.html' : url);
  if (!file.startsWith(path.normalize(root))) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, data) => { if (err) { res.writeHead(404); return res.end(); } res.writeHead(200, {'content-type':types[path.extname(file)] || 'application/octet-stream', 'cache-control':'no-store'}); res.end(data); });
}).listen(port, () => console.log('ok ' + port));
