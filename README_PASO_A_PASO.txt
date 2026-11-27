SPRITE LAB 0.2 — GUÍA PASO A PASO

PARTE A — SUBIR LA NUEVA VERSIÓN A GITHUB SIN BORRAR LA 0.1.0
1. Descarga el archivo ZIP y descomprímelo en tu ordenador.
2. Entra en tu repositorio de GitHub: STUDIO-PROONE-SPRITE-LAB.
3. En el selector de ramas, donde aparece "main", escribe: version-0.2
4. GitHub te ofrecerá crear una rama nueva. Pulsa "Create branch: version-0.2 from main".
5. Ya dentro de version-0.2, pulsa "Add file" y después "Upload files".
6. Abre la carpeta descomprimida SPRITE_LAB_0_2_REBUILD y arrastra TODO su contenido (index.html, backend, render.yaml, los README y .gitignore) al área de carga.
7. Espera a que termine la carga. En el cuadro de mensaje escribe: "SPRITE LAB 0.2 rebuild with private Magic Hour backend".
8. Pulsa "Commit changes".

No subas el ZIP comprimido: primero hay que descomprimirlo. No borres la rama main ni la etiqueta v0.1.0.

PARTE B — PUBLICAR LA WEB
1. En GitHub, dentro de la rama version-0.2, entra en Settings > Pages.
2. En "Build and deployment", elige "Deploy from a branch".
3. En Branch selecciona "version-0.2" y carpeta "/ (root)". Guarda.
4. La dirección será parecida a https://edrian48228-crack.github.io/STUDIO-PROONE-SPRITE-LAB/ . Espera a que GitHub Pages indique que está publicada.

PARTE C — PUBLICAR EL BACKEND PRIVADO
1. Entra en https://render.com/ y crea una cuenta o inicia sesión.
2. Pulsa "New" y elige "Blueprint".
3. Conecta Render a tu GitHub (esto es dentro de Render, no dentro de ChatGPT).
4. Elige el repositorio STUDIO-PROONE-SPRITE-LAB y la rama version-0.2.
5. Render leerá el archivo render.yaml. Confirma la creación del servicio gratuito sprite-lab-api.
6. Render te pedirá dos valores secretos:
   - MAGIC_HOUR_API_KEY: déjalo vacío por ahora si todavía no has creado una clave nueva.
   - SPRITE_LAB_ACCESS_PASSWORD: crea una contraseña privada larga y guárdala en tu gestor de contraseñas. No la envíes por ChatGPT.
7. Cuando el servicio se cree, copia su dirección HTTPS, parecida a https://sprite-lab-api.onrender.com.
8. En Render > Environment puedes añadir MAGIC_HOUR_API_KEY más adelante, cuando confirmemos que tu API tiene acceso y saldo.

PARTE D — USAR LA APP
1. Abre la dirección de GitHub Pages.
2. Carga la imagen de Tuki.
3. Revisa el prompt y selecciona LTX 2.5 o WAN 2.2.
4. Cuando el backend esté listo, pega la dirección HTTPS de Render.
5. Escribe el usuario "spritelab" y la contraseña que tú configuraste en Render.
6. Solo cuando la API Key de Magic Hour esté validada y el saldo API sea suficiente, pulsa "Generar vídeo".
7. Importa el vídeo o usa el generado, extrae fotogramas y crea la spritesheet PNG y manifest JSON.

NOTAS IMPORTANTES
- Render gratuito duerme el servicio tras 15 minutos sin actividad; al volver a usarlo puede tardar alrededor de un minuto en despertar.
- El disco del servicio gratuito es temporal. Descarga tus vídeos cuando terminen; no los uses como almacenamiento permanente.
- Los trabajos se guardan en memoria y pueden perderse si el servicio se reinicia. Esta versión es para pruebas, no producción.
- Magic Hour cobra créditos API al encolar una generación; revisa el coste y saldo API antes de probar. El coste de la web no garantiza el mismo saldo en API.
- No pegues la API Key en index.html, GitHub, esta conversación ni en el campo de contraseña del servidor. La API Key va únicamente en el secreto MAGIC_HOUR_API_KEY de Render.
