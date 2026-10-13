#!/usr/bin/env bash
# Pruebas de punta a punta en un Chromium de tamaño celular (Playwright).
# Requiere: node y el paquete playwright (npm i -D playwright && npx playwright install chromium).
set -e
cd "$(dirname "$0")"
python3 ../../build.py "$PWD/demo_build.html" >/dev/null
echo "== Editor de contenido (admin crea lección, la prueba y el estudiante la ve)"; node editor_flow.js
echo "== Funciones nuevas (palabras falladas, reporte, recordatorios, audio, panel del dueño)"; node new_features.js
echo "== Avatar, amigos, voz y autorización"; node social.js
echo "== Repaso, ligas, gemas, tienda, desafíos, confeti y Excel"; node extras.js
echo "== Servidor real simulado (2 dispositivos: admin y estudiante)"; node remote_two_devices.js
echo "== Versión publicada (manifest, service worker, setup.html)"
(cd ../.. && python3 -m http.server 8765 >/dev/null 2>&1 & echo $! > /tmp/pandi_http.pid); sleep 1
node hosted_build.js || true
kill "$(cat /tmp/pandi_http.pid)" 2>/dev/null || true
