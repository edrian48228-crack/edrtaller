# Taller — PWA de reparaciones (v6.2.6)

Aplicación web instalable (PWA) para gestionar reparaciones electrónicas.
Solo HTML, CSS, JavaScript y JSON. Sin backend ni dependencias: GitHub
es tu servidor de datos.

## v6.2.6 — Inicio: saludo y contador de reparaciones

- Corregido el saludo del Inicio: ahora dice «Bienvenido al …» (antes
  «Bienvenido a Taller», gramaticalmente incorrecto).
- Añadido debajo del saludo el contador «Cantidad de Reparaciones», que
  muestra el total registrado y se actualiza solo en cada recarga de la
  vista (no hay que reentrar ni refrescar a mano).

## v6.2.5 — Seis correcciones críticas

- **Firma del cliente (entrega)**: la sección de firma ahora aparece ABAJO,
  en el detalle, ANTES de cambiar el estado. Al marcar Completada se abre
  la captura de la foto; al guardarla, el sistema NOTIFICA y pide
  confirmación para el paso Completada → Entregada (con arranque de
  garantía). Antes entregaba en silencio al guardar la foto. Editar una
  reparación YA entregada (con firma) ya no la degrada a Completada.
- **Resumen**: la cifra grande ahora se titula «ganancia total acumulada
  (ya cobrada)» y, si hay reparaciones no entregadas, se muestra aparte la
  línea «por cobrar» — antes las cifras se mezclaban y resultaban
  confusas. La ganancia sigue siendo (ventas + servicios entregados) −
  costos; lo pendiente no se suma hasta entregar.
- **Cargar desde el archivo (Admin)**: el botón salía deshabilitado con
  «sin configurar» aunque hubiera ubicación elegida — el handle del
  archivo carga asíncrono desde IndexedDB y la pantalla se pintaba antes.
  Ahora se habilita solo al cargarlo, y si el archivo se movió o borró,
  el aviso dice cómo recuperarlo (re-elegir la ubicación).
- **GitHub**: los campos usuario/repositorio/rama/token se muestran
  siempre al abrir Administración; «Probar conexión» dice QUÉ falta
  («Falta el usuario…», «Falta el token…»), explica el 401 (token
  caducado) y el 404 (repo inexistente) con la solución, y comprueba la
  RAMA configurada además de la default.
- **Total histórico tapado**: el acordeón de estadísticas cortaba su
  contenido a la mitad en móviles (tope de altura 2000px). Eliminado el
  corte: el contenido se ve completo siempre.
- **Salir del sistema**: tras confirmar, la sesión se cierra DE VERDAD:
  se cierra la pestaña cuando el navegador lo permite y, si no, aparece
  una pantalla final «Sesión cerrada» con reingreso manual — antes volvía
  al login de la misma página y con la contraseña desactivada reentraba
  solo, sin sensación de salida. Los datos nunca se tocan.
- Verificado con 69 pruebas de regresión + recorrido completo de vistas:
  ninguna actualización borra datos (reparaciones, movimientos, fotos,
  audios y ajustes intactos tras el flujo completo).

## v6.2.4 — Copia de seguridad en la ubicación que elijas

- **«Elegir ubicación y exportar todo…»**: nuevo botón principal en
  *Administración → Copia local (manual)*. Antes de exportar muestra un
  resumen con lo que contendrá la copia (reparaciones, compras/ventas,
  fotos, audios, ajustes y contraseña, y el peso en KB), abre el selector
  de guardar del sistema y escribe el archivo
  `taller-backup-FECHA.json` en la carpeta que TÚ decidas — memoria,
  unidad USB, carpeta de la nube, escritorio… — con el nombre editable.
  Al terminar confirma con el nombre del archivo guardado.
- **Copia COMPLETA**: el JSON lleva todo el sistema en un único archivo:
  reparaciones con fotos de dispositivo/cliente, firmas y audios de
  aceptación embebidos, movimientos de compra/venta, catálogos, ajustes y
  la contraseña. Se comprobó restaurándolo en un sistema vacío: todo
  vuelve tal cual (reparaciones, fotos, audios, movimientos y ajustes).
- **En móvil**: los navegadores de teléfono no permiten elegir carpeta;
  el botón avisa de ello y deja la copia en Descargas/Archivos con el
  consejo de moverla a donde quieras (memoria, nube, PC).
- El «Exportar JSON» clásico sigue disponible para la descarga rápida.

## v6.2.3 — Fechas corregidas (zonas horarias)

- **Bug serio corregido**: al registrar una reparación, compra o venta con
  fecha de HOY, la app podía mostrarla como de AYER o de OTRO MES. Causa:
  dos conversiones a UTC mezcladas con fechas locales. El campo de fecha
  se rellenaba con `toISOString()` (UTC): en América (UTC-4/-6) por la
  tarde-noche «hoy» se volvía MAÑANA y a fin de mes saltaba al mes
  siguiente; en Europa de madrugada (00:00-02:00) se volvía AYER. Además,
  compras/ventas guardaban la fecha elegida como medianoche UTC y la
  lista la mostraba en hora local: en todo el hemisferio oeste aparecía
  UN DÍA MENOS.
- **Convención única**: todas las fechas ahora se rellenan, guardan y
  muestran en la zona horaria local del técnico. Verificado a 9 horas
  distintas del día (00:00-23:00) en zonas críticas (UTC-6, UTC+1,
  UTC+13), incluido el límite de fin de mes, en reparaciones, compras y
  ventas, y con edición de la fecha de registros ya existentes para
  corregir los viejos si hiciera falta. El nombre del archivo de respaldo
  también usa la fecha local.
- Los registros anteriores no se tocan automáticamente (no se arriesgan
  datos): si alguna fecha vieja se ve mal, ábrela y ajusta la fecha a mano.

## v6.2.2 — «Quitar de esta reparación», alcance claro

- **Precisión**: al eliminar una pieza desde una reparación (la que
  acabas de añadir o cualquiera de esa reparación) la pieza sale ÚNICAMENTE
  de esa reparación. La compra registrada en Compra/Venta y el inventario
  del sistema no se tocan, y las unidades vuelven a estar disponibles de
  inmediato para otra reparación. Se comprobó de punta a punta:
  comprar → usar en reparación → quitar → compra intacta, inventario
  devuelto.
- **Sin ambigüedad**: el botón antes decía «Eliminar pieza» junto al
  selector de todas tus piezas compradas, lo que podía leerse como borrar
  la pieza del inventario. Ahora dice «Quitar de esta reparación», el
  icono lateral aclara su alcance al mantenerlo pulsado, y la sección
  explica en una línea: *Quitar una pieza aquí solo la saca de esta
  reparación; la compra y el inventario de Compra/Venta no se tocan*.

## v6.2.1 — Sección «Añadir pieza» a pantalla completa

- **Corregido el desborde**: en pantallas de móvil estrechas, los cuadros
  de texto de la sección *Añadir pieza* del formulario de reparación se
  salían por la derecha (la fila necesitaba 404px en una pantalla de
  375px). Los controles ahora se ciñen al ancho disponible: el selector
  de pieza, la cantidad y el costo unitario llenan su celda en lugar de
  conservar su ancho intrínseco, y el bloque completo queda dentro de la
  pantalla también en móviles de 320px.
- **Botón «Eliminar pieza»**: cada pieza añadida muestra ahora un botón
  con etiqueta *Eliminar pieza* (papelera) al pie de su fila, además del
  icono lateral que ya existía. Eliminar quita la pieza del formulario y
  del registro; al quitar la última, la sección vuelve a mostrar
  «Reparación sin cambio de pieza».

## v6.2 — Multi-foto del cliente e importación segura

- **Varias fotos del cliente**: ya no hay una sola foto — ahora puedes
  añadir varias (la foto del cliente y el carné de identidad por delante
  y por detrás, hasta 8), desde la cámara o de la galería en lote.
  Miniaturas con borrado individual, contador en vivo y visor ampliado
  al tocarlas, en el formulario y en el detalle. Los datos antiguos con
  una sola foto se migran automáticamente; la primera foto se mantiene
  como portada en las tarjetas y el ticket, y todo viaja en la
  sincronización como siempre.
- **Importar JSON con protección total**: al abrir o cargar un archivo
  (botón Importar o "Cargar desde el archivo" de la ubicación local) la
  app muestra primero un resumen del archivo frente a tus datos
  actuales. "Añadir al existente" fusiona sin duplicar (y avisa de lo
  que ya existía); "Reemplazar TODO" exige dos confirmaciones
  consecutivas mostrando exactamente cuántas reparaciones y movimientos
  con sus fotos, audios y firmas se van a perder. Los datos ya guardados
  nunca se pierden en silencio — pensado para actualizaciones del
  sistema sin miedo a perder lo almacenado.

## v6.1.1 — Estabilidad de sincronización (correcciones de la batería de pruebas offline/online)

Dos correcciones encontradas en las pruebas E2E completas de sincronización:

- **Borrado remoto adoptado**: si otro dispositivo borraba una reparación y
  subía su índice sin ella, este dispositivo conservaba la reparación y la
  VOLVÍA A SUBIR en el siguiente push (el borrado "resucitaba" en la nube).
  Ahora el pull detecta que la reparación ya fue subida antes y ya no existe
  en el repositorio ni en el índice, y adopta el borrado limpiamente.
- **Ajustes a salvo con índice corrupto**: si el index.json remoto llegaba
  corrupto o vacío, el pull restauraba los ajustes de FÁBRICA (garantía,
  nombre del taller, logo, WhatsApp, catálogos) y el push siguiente subía
  esos valores por defecto a la nube. Ahora los ajustes locales se conservan
  íntegros y el push repara el índice con los valores correctos.

Batería de pruebas: 94 verificaciones E2E en navegador (registro, edición,
estados y firma, borrado de reparaciones, ventas, compras, ajustes de
administración; offline, online, transiciones en ambos sentidos, conflictos
de SHA, índice corrupto, rate-limit y doble sincronización simultánea),
69 pruebas de regresión Node y persistencia tras recarga — todo en verde.

## Novedades v6.1 — Grabador automático, entrega blindada y fix del audio

- **Grabación automática**: al abrir el registro de una reparación nueva la
  grabación del audio de aceptación **arranca sola** (sin pulsar nada); si el
  micrófono no está disponible, el botón manual sigue ahí. Al **registrar** la
  reparación, la grabación en curso se **detiene y se guarda sola** con la
  reparación; si sales del formulario sin guardar, el grabador se cancela y
  libera el micrófono.
- **Fix "el audio se reproducía desde la mitad"** (causa raíz): los webm de
  MediaRecorder llegan **sin duración** en la cabecera ( Chromium reporta
  `Infinity`), y el motor posiciona la reproducción donde quiere. Ahora, al
  detener la grabación se **parchea la cabecera EBML con la duración real**
  (verificado: 5200 ms escritos con exactitud) y el reproductor, además,
  calcula la duración decodificando y **siempre arranca en 0**.
- **Entrega blindada (regla inviolable)**: una reparación llega a
  *Entregada* **solo** pasando por *Completada* y tomando la **foto de la
  firma del cliente**; con la foto guardada pasa **automáticamente a
  Entregada** (sellando el inicio de la garantía). Cualquier otra vía está
  bloqueada en 4 capas: el selector del detalle la rechaza con mensaje claro,
  el formulario de edición no puede poner Entregada, el alta no ofrece la
  opción y la capa de datos (`DB`) rechaza el cambio sin firma. Las
  reparaciones **ya entregadas** del historial se conservan intactas.

## Novedades v6 — Configuración cifrada, firma de entrega y garantía de 7 días

- **La configuración viaja CIFRADA del servidor al cliente** (AES-GCM-256 +
  PBKDF2-SHA256, 210.000 iteraciones): al activar "Datos hacia otros
  dispositivos" defines una **frase secreta del taller**; desde entonces
  `config.json` se publica encriptado (nada legible en el repo ni en Pages —
  ni usuario, ni repositorio, ni carpeta, ni token). Cualquier móvil del
  taller escribe la frase UNA vez y la app **descifra y autorrellena los
  cuadros** de Administración (usuario/repo/rama/carpeta e incluso el token
  si decides incluirlo). Botón **"🔐 Traer configuración del taller"** en
  Administración → Sincronización GitHub para traerla y rellenar en cualquier
  momento. Una frase incorrecta se rechaza limpiamente (GCM autenticado).
- **Garantía por defecto de 7 días** para todas las reparaciones nuevas (las
  ya registradas conservan su garantía original; configurable en Admin).
- **Firma del cliente al entregar**: cuando pasas una reparación a
  *Completada* se activa la captura de la **foto de la firma**; al tomarla,
  la reparación pasa **automáticamente a Entregada** (sellando la fecha de
  inicio de la garantía). Puedes entregar sin firma o dejarla en Completada
  para capturarla luego; la firma queda guardada en la reparación y se
  muestra (ampliable) en su detalle.
- **Reproductor de audio nuevo**: la barra de progreso empieza en 0 y se
  puede arrastrar para adelantar/retroceder con precisión (el control nativo
  dibujaba la barra corrida en móviles). Play/pausa, tiempo y diseño propio.
- **Navegación rápida arriba**: botón flotante "ir al final" que se
  transforma en "volver arriba" al llegar abajo — sin cambiar el alto del
  sistema —, con desplazamiento suave y respeto de `prefers-reduced-motion`.
- **Salir con confirmación**: el botón superior de salida pregunta antes de
  cerrar la sesión (evita salidas accidentales).
- **Resumen/Contabilidad**: el bloque "Contabilidad e ingresos" ahora llega
  **abierto** con el **Total histórico** y sus movimientos visibles de
  entrada (antes estaba plegado y parecía que faltaba).
- **Splash de carga aún más vistoso**: anillo de progreso circular con
  porcentaje, logo con brillo y halo pulsante, texto con degradado —
  manteniendo el arranque rápido (pinta antes de descargar JS).
- **Compatibilidad total con tus datos existentes**: todas las
  incorporaciones son aditivas (firma, configuración cifrada, garantía);
  ninguna migración pisa o borra reparaciones, compras, ventas, fotos,
  audios ni ajustes ya guardados. El `passwordHash` y las preguntas siguen
  SIN viajar al repositorio (y ahora tampoco la frase secreta viaja en el
  índice: solo dentro del config cifrado).

## Novedades v5.7 — Arranque rápido + presentación profesional de carga

- **Carga más rápida**: la app arranca apenas termina de parsear (sin
  esperar `DOMContentLoaded`), el módulo PWA (`install.js`) se carga como
  `defer` sin bloquear el primer render, y **todos los assets de
  producción van minificados** (`db.js` 40→18 KB, `sync.js` 68→30 KB:
  ~60 KB menos de parseo en cada apertura). Medido: `DOMContentLoaded`
  130 ms → 109 ms en escritorio; en móvil el ahorro de parseo es mayor.
- **Splash de carga profesional**: pantalla de arranque con logo animado
  (pulsado suave), nombre de marca, **barra de progreso con hitos reales**
  (almacenamiento → datos → interfaz) y etiqueta de versión. Se pinta
  inline en `<head>` — aparece **antes de descargar un solo byte de JS** —
  y se retira con fundido de 0,45 s cuando la primera vista ya está en
  pantalla. Respeta `prefers-reduced-motion`.
- **Contraseña de entrada por defecto: `taller48228`** — viene
  preconfigurada (hash SHA-256) en instalaciones nuevas y en las
  instalaciones anteriores al actualizar. Mientras no la cambies, la
  pantalla de entrada muestra la pista discreta *"Contraseña de fábrica:
  taller48228 · cámbiala en Admin"*; en cuanto la cambias desde
  Administración → Cambiar contraseña, la pista desaparece.
- **"No pedir contraseña" funciona de verdad**: con el interruptor de
  Administración desactivado (`Pedir contraseña al entrar`), la app entra
  **directo** al abrir o recargar, sin mostrar la pantalla de login —
  incluido el caso en que el ajuste solo exista en IndexedDB (se corrige
  la pantalla en cuanto termina la lectura del disco), y el botón
  *Salir* recarga directo a la app. El hash de contraseña **nunca viaja
  al repositorio** (es un ajuste del dispositivo).
- **Build reproducible**: `scripts/build_v53.sh` regenera los `.min`
  desde las fuentes legibles (`js/*.js`, `css/styles.css`); el paquete
  lleva ambas: producción minificada (`index.html` + `.min`) y fuentes
  completas (`index.src.html` + `.js`) para futuras ediciones.

## Novedades v5.6 — Persistencia a prueba de reinicio (correcciones críticas)

- **Bug crítico corregido**: en el arranque normal, `save()` no llegaba a
  activarse nunca (la carga inicial saltaba el `loaded=true`): la app
  "parecía" guardar pero al cerrar y abrir reaparecían todas las
  reparaciones borradas/editadas. Ahora todo cambio se persiste en
  memoria → `localStorage` (síncrono) → IndexedDB (debounce 300 ms) →
  servidor (auto-push con reintentos 2,5 s→40 s).
- **Reset total real y atómico** (clear+put en la misma transacción
  IndexedDB + semilla síncrona) y **arranque sin resurrección**: la
  fuente más nueva gana; la vieja ya no se fusiona por unión (lo que
  revivía borrados).
- **Cola offline con reintentos persistentes**: si la subida falla (sin
  red), se reintenta con backoff hasta lograrlo; al reconectar (`online`)
  se dispara inmediatamente. Tras un reset, el arranque no re-descarga
  la nube que acabas de descartar (salvo que marque borrar la nube).

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
4. Abre esa URL e inicia sesión con la **contraseña de fábrica
   `taller48228`** (cámbiala luego en Administración → Cambiar
   contraseña; la pantalla de entrada te recuerda la clave de fábrica
   mientras no la cambies).

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
