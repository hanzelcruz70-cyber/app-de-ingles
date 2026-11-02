# Voces de ElevenLabs para Pandi English

La app lee primero los audios de `audio/` (hechos con ElevenLabs). Si un texto no tiene audio, por ejemplo una lección que escribió el profe, usa la voz del teléfono como antes.

Hoy se generan dos cosas:

- **Cuentos y cantos:** cada personaje con su voz (Matt, Bella, AL, Rose, Charlie…).
- **Palabras sueltas:** con una voz alegre y clara (Emily).

Las frases de los ejercicios todavía usan la voz del teléfono.

## Archivos

| Archivo | Para qué |
| --- | --- |
| `voces.json` | Qué voz de ElevenLabs tiene cada personaje, el modelo (`eleven_flash_v2_5`, medio crédito por carácter) y los ajustes. |
| `textos.json` | Lista de textos que hay que grabar (quién lo dice y qué dice). Se arma desde la app (ver abajo). |
| `generar.mjs` | Pide los audios a ElevenLabs, los guarda en `audio/` y arma `audio/indice.js`. |
| `.llave` | Tu llave de API de ElevenLabs. **No se sube a GitHub** (está en `.gitignore`). |

## Paso a paso

1. **Agrega las voces a tu cuenta.** En elevenlabs.io → *Voice Library*, busca cada voz de `voces.json` que dice «(biblioteca)» y toca **Add to My Voices**. Son 9: Emily, Lulu Lollipop, Gigi, Jasmine, Teddy Twinkle, VALF, Jayjay, Retro Robot y Moxy Mouse. Las que dicen «(de la cuenta)» ya vienen con tu cuenta.
2. **Crea tu llave.** En elevenlabs.io → tu perfil → *API Keys* → *Create*. Pega la llave en un archivo nuevo `tools/voces/.llave` (solo la llave, nada más).
3. **Mira cuánto cuesta**, sin gastar nada:
   ```
   node tools/voces/generar.mjs --estimar
   ```
4. **Haz una prueba chica** y escúchala en la app:
   ```
   node tools/voces/generar.mjs --solo=cuentos --limite=1500
   ```
5. **Genera todo:**
   ```
   node tools/voces/generar.mjs
   ```
   Lo que ya existe no se vuelve a pedir, así que si se corta (por ejemplo, porque se acabaron los créditos del mes) se puede correr otra vez y sigue donde quedó.
6. **Publica:** sube a `main` la carpeta `audio/` con `indice.js`.

## Si cambias el contenido

Cuando se agreguen cuentos, cantos o palabras, vuelve a armar `textos.json` desde la app en modo demo y corre `generar.mjs`: solo pide lo nuevo. Si cambias la voz de un personaje en `voces.json`, sus audios nuevos se generan con otro nombre de archivo; los viejos se pueden borrar.

Para armar `textos.json`: en la app (modo demo), la lista se saca de los cuentos (`storyBeats`, con quién habla), los cantos (quién canta cada línea) y las palabras del banco que salen en las lecciones. El script de esta sesión está descrito en `docs/BITACORA.md` (2 de noviembre de 2026).
