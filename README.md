# Taller - Sistema de Reparaciones (PWA)

Aplicación web progresiva (PWA) para gestionar las reparaciones electrónicas de tu taller. Funciona sin conexión, se instala en Android como una app nativa, y sincroniza vía GitHub mediante exportar/importar JSON.

## Características

- 100% HTML + CSS + JavaScript (sin frameworks ni backend)
- Instalable en Android (PWA)
- Funciona offline (Service Worker con caché)
- Contraseña de acceso (activable/desactivable desde Admin)
- Registro de reparaciones con foto del equipo y del cliente
- Estados: Pendiente, En proceso, Esperando recogida, Completada, Entregada
- Notificación en dashboard de reparaciones para hoy
- Búsqueda por cliente, equipo, teléfono o ID
- Nombre del sistema personalizable desde Admin
- Exportar/Importar datos JSON para sincronización vía GitHub

## Desplegar en GitHub Pages

1. Crea un repositorio en GitHub (ej: `taller-reparaciones`).
2. Sube todos los archivos de este ZIP al repositorio.
3. En el repo: **Settings → Pages → Source: Deploy from branch → main / root**.
4. Espera 1-2 minutos. Tu PWA estará en `https://TU_USUARIO.github.io/taller-reparaciones/`.
5. Abre la URL en Chrome de Android → menú → **Añadir a pantalla de inicio**.

## Sincronizar entre dispositivos

1. En el dispositivo principal: Admin → **Exportar JSON**.
2. Sube el archivo `taller-backup-YYYY-MM-DD.json` a tu repo de GitHub.
3. En el otro dispositivo: descarga el JSON e importa desde Admin → **Importar JSON**.

## Primer acceso

La primera vez que abras la app, la contraseña que escribas se guardará como contraseña maestra. Puedes cambiarla o desactivarla desde **Administración**.

---

Creado por **Edrian Cruz Down** 👑