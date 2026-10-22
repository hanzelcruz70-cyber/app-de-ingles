# Pandi animado del camino

`pandi-original.png` es la imagen original del personaje (1024×1024, fondo celeste). De ahí salen las capas de `icons/pandi/`:

```
node tools/pandi/capas.cjs
cp tools/pandi/capas/{base,arm,strap,head,mouth}.png icons/pandi/
```

Sin dependencias (solo Node). Qué hace `capas.cjs`:
- Quita el cielo y la sombra azul de los pies, y limpia el borde para que no quede halo celeste.
- Separa el brazo levantado (`ARM`), el tirante de la mochila (va delante del brazo, por color) y la cabeza (`HEAD`, cortada por el borde de la pañoleta).
- Rellena lo que queda escondido: el cuello bajo la barbilla con pelo negro de la misma imagen, y guarda el hombro en la base.
- Crea la boca cerrada (`mouth.png`) con pelo de la mejilla y una sonrisa dibujada.
- Reparte las capas al tamaño final (40 %) para que ninguna unión deje ver el fondo, y brazo y cabeza cubren 1 píxel extra.

El armado y las animaciones están en `pandiRig` y en el CSS `.pr-*` de `src/app.html` (el brazo gira en el hombro, la cabeza en el cuello; los párpados son CSS).

`pandi-partes.png` es una hoja con partes sueltas del personaje (otra luz y otros bordes). No se usa: al juntarlas se notaban las costuras. Sirve como referencia si algún día se arma el personaje en Rive.
