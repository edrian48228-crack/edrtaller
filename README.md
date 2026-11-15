# Taller — PWA de reparaciones (v4)

Aplicación web instalable (PWA) para gestionar reparaciones electrónicas.
Solo HTML, CSS, JavaScript y JSON. Sin backend ni dependencias: GitHub
es tu servidor de datos.

## Novedades v4 — Instalable como app + sincronización optimizada
- **Instalable en el móvil como aplicación** (APK real en Android vía
  Chrome): icono en pantalla de inicio, pantalla completa, funciona
  offline. En iPhone se instala desde Safari ("Añadir a pantalla de
  inicio"). La app muestra una tarjeta **"📲 Instalar la app"** con
  guía paso a paso según tu dispositivo.
- **Iconos corregidos**: el icono de 512px era un JPEG con extensión
  .png — Chrome lo rechazaba al generar el WebAPK. Ahora son PNG
  reales, con versión **maskable** separada (fondo completo) según los
  criterios actuales de Chrome.
- **Manifiesto completo**: `id`, `display_override`, `launch_handler`,
  atajos de app (Nueva reparación / Nueva venta / Buscar desde el
  icono), y capturas de pantalla para la ficha de instalación.
- **Sincronización determinista**: los payloads ya no incluyen
  marcas de tiempo de generación ni estado operativo (`lastSyncAt`),
  por lo que un push sin cambios **no hace ninguna petición PUT** —
  antes se re-subía todo en cada guardado.
- **Respeto del límite de la API de GitHub** (5000 req/h): polling cada
  60 s en lugar de 12 s, con **pausa automática y reintento** si se
  alcanza el rate-limit (403/429).
- **El sync remoto ya no borra lo que estás escribiendo**: si estás
  llenando el formulario de una reparación, los cambios que llegan de
  la nube se bajan sin refrescar la vista.
- **Aviso visible si el almacenamiento del navegador se llena** (antes
  fallaba en silencio y los datos no se guardaban).
- Metas iOS (`apple-mobile-web-app-*`) para instalación correcta en
  iPhone/iPad.

## Novedades v3 — Motor anti-pérdida de datos
- **Corregido el bug crítico**: al guardar datos offline y restablecer la
  conexión, el índice remoto antiguo borraba los registros nuevos. Ahora
  **primero se suben los cambios locales pendientes y después se baja lo
  remoto** (prioridad push > pull).
- **Archivos grandes soportados**: las reparaciones con fotos/audio que
  superan 1 MB se descargan correctamente (media type `raw` de la API de
  GitHub). Antes el contenido llegaba vacío y la reparación "desaparecía".
- **Huérfanos adoptados**: si un archivo `repairs/Rxxxx.json` existe en el
  repo pero el `index.json` no lo lista, la reparación se **adopta** y el
  índice se repara en la siguiente subida.
- **Subidas tolerantes a conflictos**: ante un 409/422 se refresca el
  SHA y se reintenta; un fallo puntual no aborta el resto.
- **Ajustes protegidos**: token, sincronización automática, contraseña y
  catálogos locales nunca se degradan al bajar datos.
- IDs de transacciones únicos (sin colisiones entre dispositivos).

---

# 📱 CÓMO USARLA EN GITHUB — PASO A PASO

## Paso 1 — Crear la cuenta y el repositorio

1. Entra en **https://github.com** y crea una cuenta (o usa la tuya).
2. Pulsa el botón verde **New repository** (arriba a la derecha).
3. Nombre del repositorio: por ejemplo `taller-app`.
4. Márcalo **Public** (necesario para que GitHub Pages sea gratuito).
5. **NO** marques "Add a README" ni nada más. Pulsa **Create repository**.

> Con el repo en `https://github.com/TU-USUARIO/taller-app`, tu app
> quedará en `https://TU-USUARIO.github.io/taller-app/`.

## Paso 2 — Subir los archivos de la app

1. En la página del repositorio recién creado, pulsa **uploading an existing file**.
2. Abre la carpeta donde descomprimiste `edrtaller-main-v4.zip`.
3. Arrastra **todo el contenido de la carpeta** (index.html, manifest.json,
   sw.js, css/, js/, icons/, screenshots/, README.md) — el contenido,
   no la carpeta que lo envuelve.
4. Escribe un mensaje ("primera versión") y pulsa **Commit changes**.

## Paso 3 — Activar GitHub Pages (que la app sea una web)

1. En el repositorio: pestaña **Settings** → lateral **Pages**.
2. En "Build and deployment":
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / carpeta `/ (root)` → pulsa **Save**.
3. Espera 1–3 minutos. Arriba aparecerá:
   **"Your site is live at https://TU-USUARIO.github.io/taller-app/"**
4. Abre esa URL: ya tienes la app funcionando con HTTPS (requisito
   imprescindible para instalarla y para el service worker).

## Paso 4 — Crear el token de sincronización (copia de seguridad)

1. En GitHub, pulsa tu foto de perfil (arriba a la derecha) →
   **Settings** → baja hasta **Developer settings** (lateral izquierdo)
   → **Personal access tokens** → **Fine-grained tokens** →
   **Generate new token**.
2. Nombre: `taller-sync`. Expiración: la que prefieras (90 días o más;
   cuando expire, genera otro y actualízalo en la app).
3. **Repository access**: "Only select repositories" → selecciona
   `taller-app`.
4. **Permissions** → despliega **Repository permissions** →
   **Contents** → marca **Read and write**.
   (Nada más: no le des más permisos de los necesarios.)
5. Pulsa **Generate token** y **copia el token** (`github_pat_...`):
   solo se muestra una vez.

## Paso 5 — Configurar la sincronización DENTRO de la app

1. Abre la app en `https://TU-USUARIO.github.io/taller-app/`.
2. Entra con tu contraseña (la primera vez la defines tú).
3. Ve a **Admin** (icono de engranaje) → tarjeta **Sincronización GitHub**.
4. Rellena:
   - **Usuario / org**: `TU-USUARIO`
   - **Repositorio**: `taller-app`
   - **Rama**: `main`
   - **Carpeta base**: `taller-data`
   - **Token**: pega el `github_pat_...`
   - Activa **Sincronización automática al guardar**.
5. Pulsa **Probar conexión** — debe decir "Autenticado como TU-USUARIO".
6. Pulsa **Subir / sincronizar todo**. A partir de aquí, cada reparación
   con sus fotos y su audio vive en su propio archivo dentro de la
   carpeta `taller-data/repairs/` del repositorio: puedes verlos,
   versionarlos y recuperarlos desde GitHub.

> Así, aunque pierdas o cambies el móvil, al entrar desde otro
> dispositivo con la misma configuración se descarga TODO automáticamente.

## Paso 6 — Instalarla en el móvil como aplicación

### Android (Chrome / Samsung Internet / Edge)
1. Abre `https://TU-USUARIO.github.io/taller-app/` en el navegador.
2. Verás la tarjeta **"📲 Instalar la app"** en la pantalla de inicio
   de la app → pulsa **Instalar** (o menú ⋮ → "Instalar aplicación").
3. Acepta el diálogo. Android genera e instala un **APK real**
   (WebAPK): icono propio en el escritorio, arranque a pantalla
   completa y funcionamiento **sin conexión**.

### iPhone / iPad (Safari)
1. Abre la URL en **Safari** (en Chrome de iOS no se puede).
2. Botón **Compartir** (cuadrado con flecha hacia arriba) →
   baja → **"Añadir a pantalla de inicio"** → **Añadir**.
3. La tarjeta de instalación de la app incluye esta misma guía.

### PC (Chrome / Edge)
Menú ⋮ → "Instalar Taller..." → se abre como ventana propia.

## ¿Cómo funciona el modo offline? (resumen)

- **Guardar sin conexión**: todo se guarda primero en el dispositivo
  (localStorage). La app avisa "guardado en el dispositivo, se subirá al
  reconectar".
- **Al reconectar** (o al abrir la app con conexión): el motor sube
  primero tus cambios pendientes y solo después descarga los remotos.
  Un cambio offline **nunca es pisado** por datos viejos del servidor.
- **Varios dispositivos**: cada reparación es un archivo independiente
  en el repo; los conflictos se resuelven por "la versión más nueva
  gana" y las subidas reintentan automáticamente ante 409/422.
- **Límite de la API de GitHub**: 5000 peticiones/hora con token; la
  app hace polling cada 60 s y se pausa sola si GitHub la limita.

## Copia de seguridad extra (recomendado)

**Admin → Copia local → Exportar JSON**: descarga un archivo con TODO
(fotos y audios incluidos). Guárdalo en tu correo o memoria externa de
vez en cuando. **Importar JSON** permite restaurarlo, y **Añadir al
existente** fusiona sin duplicar.
