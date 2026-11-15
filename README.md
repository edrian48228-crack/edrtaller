# Taller — PWA de reparaciones (v5)

Aplicación web instalable (PWA) para gestionar reparaciones electrónicas.
Solo HTML, CSS, JavaScript y JSON. Sin backend ni dependencias: GitHub
es tu servidor de datos.

## Novedades v5 — Reinicio total + conexión automática del móvil
- **Botón "Reiniciar todo el sistema"** en Administración (zona peligrosa):
  doble confirmación (la segunda exige escribir la palabra REINICIAR) y
  casilla opcional para borrar **también la copia de la nube**. Restaura
  reparaciones, ajustes, contraseña, catálogos, borradores y cachés de
  sincronización a su estado de fábrica.
- **Los datos de sincronización viajan solos al móvil**: en Administración →
  "Datos hacia otros dispositivos" activas compartir la configuración
  (usuario, repositorio, rama, carpeta — el **token nunca** viaja). La
  primera vez que alguien abra la app desde otro móvil, se le preguntará
  "¿Conectar con la nube del taller?" una única vez y descargará todo
  automáticamente **sin teclear nada** (modo lectura hasta que añada su
  propio token).
- **Varios usuarios (multi-dispositivo)**: varias personas pueden entrar y
  editar; cada una usa su propio token. Los cambios de todos se actualizan
  automáticamente (polling cada 60 s + al enfocar la app), con resolución
  "la versión más nueva gana" y reintentos ante conflictos.

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
- **Sincronización determinista**: un push sin cambios no hace ninguna
  petición PUT (antes se re-subía todo por marcas de tiempo viajando
  en el payload).
- **Respeto del límite de la API de GitHub** (5000 req/h): polling cada
  60 s con pausa automática ante 403/429.
- **El sync remoto no borra lo que estás escribiendo** ni avisa de
  almacenamiento lleno en silencio (banner visible).

## Novedades v3 — Motor anti-pérdida de datos
- **Prioridad push > pull** al reconectar: lo capturado offline jamás es
  pisado por el índice remoto viejo.
- **Archivos grandes soportados** (>1 MB por media type `raw`).
- **Huérfanos adoptados**: archivos `repairs/Rxxxx.json` sin listar en el
  índice se adoptan y el índice se repara al subir.
- **Subidas tolerantes a conflictos** (409/422 → refrescar SHA y reintentar)
  y ajustes locales nunca degradados al bajar datos.

---

# 📱 CÓMO USARLA EN GITHUB — PASO A PASO

## Paso 1 — Crear la cuenta y el repositorio

1. Entra en **https://github.com** y crea tu cuenta si no la tienes.
2. Pulsa el botón verde **New repository** (arriba a la derecha).
3. Nombre: por ejemplo `taller-app`. Visibilidad **Public**
   (necesario para Pages gratuito y para el modo lectura del móvil).
4. No marques nada más → **Create repository**.

> Tu app quedará en `https://TU-USUARIO.github.io/taller-app/` y tus
> datos vivirán en la carpeta `taller-data/` de ese mismo repo.

## Paso 2 — Subir los archivos de la app

1. En el repositorio vacío, pulsa **uploading an existing file**.
2. Arrastra **todo el contenido** de la carpeta descomprimida del ZIP
   (index.html, manifest.json, sw.js, css/, js/, icons/, screenshots/,
   README.md) — el contenido, no la carpeta que lo envuelve.
3. Mensaje ("primera versión") → **Commit changes**.

## Paso 3 — Activar GitHub Pages (que la app sea una web)

1. Pestaña **Settings** → lateral **Pages**.
2. *Build and deployment*:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` / `/ (root)` → **Save**.
3. Espera 1–3 minutos: "Your site is live at
   **https://TU-USUARIO.github.io/taller-app/**".
4. Abre esa URL y entra (defines tu contraseña la primera vez).

## Paso 4 — Obtener el token de GitHub (PASO A PASO)

El token es la "llave" que autoriza a la app a escribir tus datos en el
repo. **Uno por persona/dispositivo; nunca lo compartas ni lo subas al
chat** — quien lo tenga puede modificar el repositorio.

1. Entra en **github.com** con tu cuenta (PC recomendado).
2. Pulsa tu **foto de perfil** (arriba derecha) → **Settings**.
3. En el lateral izquierdo, baja hasta el final → **Developer settings**.
4. **Personal access tokens** → **Fine-grained tokens** → botón
   **Generate new token**.
5. Configura así:
   - **Token name**: `taller-sync` (o el nombre de la persona que lo usa).
   - **Expiration**: 90 días (o más; al caducar, genera otro y pégalo en la
     app — el resto sigue funcionando igual).
   - **Resource owner**: tu usuario.
   - **Repository access**: `Only select repositories** → selecciona
     `taller-app`.
   - **Permissions** → **Repository permissions** → busca **Contents** →
     selecciona **Read and write**. (Nada más: no le des permisos
     adicionales.)
6. Baja al final → **Generate token**.
7. **Copia ahora** el código `github_pat_...`: GitHub solo lo muestra una
   vez (si lo pierdes, revoca y genera otro).

> ¿Dónde se pega? En la app: **Admin → Sincronización GitHub → campo
> Token**. Se guarda solo en el almacenamiento de ese dispositivo y nunca
> se sube al repositorio ni viaja por la nube.

## Paso 5 — Configurar la sincronización en la PC

1. En la app (PC): **Admin → Sincronización GitHub**.
2. Activa el interruptor y rellena:
   - **Usuario / org**: `TU-USUARIO`
   - **Repositorio**: `taller-app`
   - **Rama**: `main`
   - **Carpeta base**: `taller-data`
   - **Token**: tu `github_pat_...`
   - ✅ Sincronización automática al guardar
3. **Probar conexión** → "Autenticado como TU-USUARIO".
4. **Subir / sincronizar todo** → verás la carpeta `taller-data/` aparecer
   en el repo (index.json + repairs/Rxxxx.json + config.json).

## Paso 6 — Que los datos viajen al móvil sin configurar nada

En el PC, dentro de **Admin → "📱 Datos hacia otros dispositivos (móvil)"**:

1. Marca **"Compartir configuración con otros dispositivos"** (opcional:
   WhatsApp de contacto para mostrarlo en la tarjeta).
2. Pulsa **Guardar preferencia** → al sincronizar, se publica
   `taller-data/config.json` (usuario/repo/rama/carpeta — **sin token**).

Luego, en **cualquier otro dispositivo** (móvil o PC):

1. Abre la misma URL de GitHub Pages e inicia sesión con la contraseña.
2. A los pocos segundos la app preguntará una única vez:
   **"☁️ Conectar con la nube del taller"** → **Sí, sincronizar ahora**.
3. Ese dispositivo descarga TODO (reparaciones, fotos, audios,
   movimientos) automáticamente y se mantiene actualizado, **sin
   teclear nada**.

> Sin token, ese dispositivo funciona en **modo lectura** (ve todo, no
> puede subir cambios). Cuando esa persona deba editar, genera **su
> propio token** (Paso 4) y lo pega en su Admin → Sincronización GitHub.
> A partir de ahí ya sube también.

## Paso 7 — Sincronizar desde el móvil (con edición)

1. Instala la app en el móvil (Paso 8) y conéctala como en el Paso 6.
2. Cuando quieras editar desde el móvil: crea **tu propio token**
   (Paso 4 — se hace desde el navegador del móvil igual que en PC:
   github.com → Settings → Developer settings → Fine-grained tokens).
3. Pégalo en **Admin → Sincronización GitHub → Token** → listo.
4. Todo lo que hagas offline en el móvil se sube automáticamente al
   recuperar la conexión; lo que otros editen te baja solo (60 s o al
   abrir la app).

## ¿Varias personas pueden acceder y editar? (multi-usuario)

Sí — así está diseñado:

- **Cada persona** abre `https://TU-USUARIO.github.io/taller-app/` en su
  propio dispositivo, se conecta con la nube (Paso 6) y añade **su
  propio token** si va a editar.
- **Contraseña de acceso**: es local por dispositivo. La defines la
  primera vez en cada uno; para que todos entren con la misma, usa la
  misma contraseña y las mismas preguntas de seguridad en cada
  dispositivo (no viajan por la nube por seguridad).
- **Ediciones simultáneas**: cada reparación es un archivo independiente;
  los conflictos se resuelven por "la versión más nueva gana"
  (updatedAt + deviceId) y las subidas reintentan solas ante 409/422.
- **Vigila la cuota**: GitHub permite 5000 peticiones/hora por token;
  la app gasta ~120/h en polling. Con 3–5 dispositivos simultáneos hay
  margen de sobra. Si se alcanzara, la app se pausa sola y reintenta.

## Paso 8 — Instalarla en el móvil como aplicación

### Android (Chrome / Samsung Internet / Edge)
1. Abre `https://TU-USUARIO.github.io/taller-app/`.
2. Tarjeta **"📲 Instalar la app"** en el inicio → **Instalar**
   (o menú ⋮ → "Instalar aplicación").
3. Acepta: Android genera e instala un **APK real (WebAPK)** — icono
   propio, pantalla completa y uso offline.

### iPhone / iPad (Safari)
1. Abre la URL en **Safari**.
2. Botón **Compartir** → baja → **"Añadir a pantalla de inicio"** →
   **Añadir**. (La app incluye esta misma guía en su tarjeta.)

### PC (Chrome / Edge)
Menú ⋮ → "Instalar Taller..." → ventana propia.

## Reiniciar todo el sistema (reset)

En **Admin → "⚠️ Zona peligrosa"**:

1. Marca (o no) **"Borrar TAMBIÉN la copia de la nube (GitHub)"**:
   con la casilla, la carpeta `taller-data/` del repo queda vacía
   (index.json, config.json y todos los repairs); sin ella, la nube
   se conserva intacta y podrías volver a bajarla.
2. **Reiniciar todo el sistema** → 1ª confirmación (resumen de lo que
   se pierde) → 2ª confirmación: escribe **REINICIAR**.
3. El dispositivo (y la nube si lo pediste) queda como recién instalado:
   contraseña, catálogos, ajustes y datos a su estado inicial.

> Consejo: si vas a reiniciar TODO (incluida la nube) pero quieres
> conservar un respaldo, exporta antes el JSON desde
> **Admin → Copia local → Exportar JSON**.

## ¿Cómo funciona el modo offline? (resumen)

- **Guardar sin conexión**: todo se guarda primero en el dispositivo.
  Al reconectar, el motor sube primero tus cambios pendientes y solo
  después descarga los remotos — un cambio offline nunca es pisado.
- **Varios dispositivos**: cada reparación es un archivo independiente;
  la versión más nueva gana; reintentos automáticos ante conflictos.
- **Límite de la API de GitHub**: 5000 req/h con token; polling de 60 s
  y pausa automática si GitHub limita (403/429).

## Copia de seguridad extra (recomendado)

**Admin → Copia local → Exportar JSON**: TODO (fotos y audios incluidos)
en un archivo. **Importar JSON** restaura; **Añadir al existente** fusiona
sin duplicar.

## Preguntas rápidas

- **¿Necesito internet para trabajar?** No: la app funciona 100 % offline;
  sincroniza cuando haya conexión.
- **¿El token caduca?** Sí, a los días que elegiste (90 por defecto).
  Genera otro y pégalo; nada más cambia.
- **¿Puedo usar repo privado?** El modo lectura del móvil lo necesita
  público (GitHub Pages solo es gratuito en públicos); con repo privado,
  cada dispositivo necesita token desde el principio.
- **¿Dónde están mis fotos?** Embebidas en cada `repairs/Rxxxx.json`
  del repo, junto al audio de aceptación.
