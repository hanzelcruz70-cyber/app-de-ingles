#!/usr/bin/env python3
"""Arma la app: index.html (para publicar en internet) a partir de src/app.html."""
import pathlib, sys
root = pathlib.Path(__file__).parent
app = (root / 'src' / 'app.html').read_text(encoding='utf-8')
uris = (root / 'src' / 'panda_uris.js').read_text(encoding='utf-8')
body = app.replace('/*PANDA_URIS*/', uris)
head = '''<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#2FA84F">
<meta name="description" content="Pandi English: practica inglés con lecciones, juegos y tareas de tu profe.">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Pandi English">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>
<script src="config.js"></script>
</head>
<body>
'''
tail = '''
<script>
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
</script>
</body>
</html>
'''
(root / 'index.html').write_text(head + body + tail, encoding='utf-8')
if len(sys.argv) > 1:  # versión de demostración (sin servidor) para la vista previa
    pathlib.Path(sys.argv[1]).write_text(body, encoding='utf-8')
print('index.html listo')
