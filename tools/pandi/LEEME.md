# Piezas del Pandi animado

`pandi-partes.png` es la hoja con las partes del personaje (fondo blanco). Para regenerar `icons/pandi/*.png`:

```
node tools/pandi/cut.cjs      # recorta cada pieza con transparencia en tools/pandi/piezas/
node tools/pandi/export.cjs   # quita los brazos del torso, reduce al 40 % y guarda en icons/pandi/
```

Sin dependencias (solo Node). Las coordenadas de cada pieza están en `PIECES` (cut.cjs) y el corte de los brazos del torso en `ARM_L` (export.cjs). El armado y las animaciones están en `pandiRig` y en el CSS `.pr-*` de `src/app.html`.
