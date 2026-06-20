# 🌌 Bóveda — Cómo crear tu APK desde el teléfono

Esta guía te lleva paso a paso, **todo desde el navegador del teléfono**, sin computadora y sin instalar programas. Al final tendrás un archivo `.apk` que podrás instalar en tu Android.

La idea: subes estos archivos a GitHub, y los servidores de GitHub **compilan la app por ti en la nube**. Tú solo subes y descargas.

Calcula unos **20–30 minutos** la primera vez. La mayoría es esperar.

---

## Lo que vas a subir

Dentro de la carpeta del proyecto van estos archivos y carpetas (ya están todos preparados para ti):

```
.github/workflows/build.yml   ← la "receta" que compila la APK
www/                          ← la app en sí (HTML, JS)
package.json
capacitor.config.json
icon.png                      ← el icono de la app
.gitignore
LÉEME.md                      ← esta guía
```

No necesitas entender qué hace cada uno. Solo súbelos tal cual.

---

## PASO 1 — Crear una cuenta en GitHub (si no tienes)

1. Abre el navegador del teléfono y entra a **https://github.com/signup**
2. Escribe tu correo, una contraseña y un nombre de usuario.
3. Confirma tu correo (te llegará un código).

Es gratis. Si ya tienes cuenta, inicia sesión y salta al Paso 2.

---

## PASO 2 — Crear un repositorio nuevo

1. Entra a **https://github.com/new**
2. En **"Repository name"** escribe: `boveda`
3. Déjalo en **Public** (público). *No marques* "Add a README".
4. Toca el botón verde **"Create repository"**.

Ahora verás una página con instrucciones. Ignóralas, vamos a subir los archivos por la web.

---

## PASO 3 — Subir los archivos

> ⚠️ Importante: GitHub por web sube archivos sueltos y carpetas, pero la carpeta oculta `.github` a veces es difícil de subir desde el móvil. Por eso abajo te doy un truco para esa carpeta.

### 3.A — Subir la mayoría de archivos

1. En tu repositorio nuevo, toca **"uploading an existing file"** (o el botón **"Add file" → "Upload files"**).
2. Toca **"choose your files"** y selecciona del ZIP descomprimido:
   - La carpeta `www` completa (o todos sus archivos)
   - `package.json`
   - `capacitor.config.json`
   - `icon.png`
   - `.gitignore`
   - `LÉEME.md`
3. Espera a que aparezcan en la lista.
4. Abajo, en **"Commit changes"**, toca el botón verde **"Commit changes"**.

### 3.B — Crear el archivo de compilación (el más importante)

La carpeta `.github/workflows/build.yml` es la que ordena compilar. La crearemos a mano para evitar problemas:

1. En tu repositorio, toca **"Add file" → "Create new file"**.
2. En el campo del nombre, escribe **exactamente** esto (con las barras `/`):
   ```
   .github/workflows/build.yml
   ```
   Al escribir las barras, GitHub creará las carpetas solo.
3. En el área grande de texto, **pega todo el contenido** del archivo `build.yml` (lo tienes en el ZIP, ábrelo con un editor de texto o el visor de archivos y copia todo).
4. Abajo toca **"Commit changes"** → **"Commit changes"**.

---

## PASO 4 — La compilación arranca sola

En cuanto subes el `build.yml`, GitHub empieza a compilar automáticamente.

1. Toca la pestaña **"Actions"** (arriba del repositorio).
2. Verás una tarea llamada **"Compilar APK de Bóveda"** con un círculo amarillo girando 🟡 (está trabajando).
3. Espera. Tarda entre **5 y 12 minutos**. Puedes salir y volver.
4. Cuando termine bien, el círculo se pone **verde** ✅.

> Si se pone **rojo** ❌, no pasa nada. Ve al final de esta guía, sección "Si algo falla".

---

## PASO 5 — Descargar tu APK

1. En la pestaña **Actions**, toca la tarea que terminó en verde ✅.
2. Baja hasta la sección **"Artifacts"** (al final).
3. Verás **"Boveda-APK"**. Tócalo para descargarlo.
4. Se descarga un archivo `.zip`. Ábrelo con el gestor de archivos del teléfono y **extrae** el `app-debug.apk` que viene dentro.

---

## PASO 6 — Instalar la APK

1. Abre el archivo `app-debug.apk` desde tu gestor de archivos / descargas.
2. Android te dirá que no se permiten apps de orígenes desconocidos. Toca **"Configuración"** y activa **"Permitir de esta fuente"**.
3. Vuelve y toca **"Instalar"**.
4. ¡Listo! Busca **Bóveda** en tu cajón de apps.

La primera vez que la abras te pedirá permiso de **ubicación** y **sensores de movimiento**. Acepta ambos para que funcione.

---

## Cómo usar la app

- Toca **"Abrir el cielo"** y acepta los permisos.
- **Calibra la brújula**: mueve el teléfono dibujando un **8** en el aire un par de veces. Esto es clave para que apunte bien.
- Levanta el teléfono hacia el cielo, como si tomaras una foto del astro.
- Cuando apuntes a una de las 15 constelaciones famosas, se dibujará sola con su figura dorada y verás su mito.
- **Toca la pantalla** para congelar lo que ves y leer con calma. Toca otra vez para reanudar.

---

## Si quieres cambiar algo después

Cada vez que edites un archivo en GitHub y hagas "Commit changes", la APK se **vuelve a compilar sola**. Solo espera el círculo verde y descarga la nueva versión desde Actions.

---

## Si algo falla ❌

Toca la tarea roja en **Actions** y mira en qué paso se detuvo (tendrá una ⊗ roja). Las causas más comunes:

- **"astronomy-engine" no se descargó**: revisa que tu internet funcionaba; vuelve a lanzar la tarea con el botón **"Re-run jobs"**.
- **Falta un archivo**: asegúrate de haber subido `package.json`, `capacitor.config.json` y la carpeta `www` completa.
- **El `build.yml` quedó mal pegado**: borra ese archivo y vuelve a crearlo copiando el contenido completo, sin recortar.

Para volver a intentar sin cambiar nada: en **Actions**, abre la tarea fallida y toca **"Re-run all jobs"**.

---

## Nota sobre precisión

Esta APK usa la tabla oficial de límites de constelaciones **IAU** (vía astronomy-engine), que se descarga durante la compilación. Eso da identificación **precisa de las 88 constelaciones**. La precisión de *apuntado* depende de la brújula de tu teléfono: por eso conviene calibrar con el movimiento en 8.

¡Disfruta el cielo! 🌟
