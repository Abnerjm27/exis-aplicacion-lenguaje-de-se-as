# Videos Anime IA — Proyecto EXIS

Esta carpeta (`app/videos/anime/`) es el directorio de destino para los videos animados del personaje Anime IA generados mediante Gemini Web (`gemini.google.com`), Kling AI, Runway Gen-3 o Pika.

## Nomenclatura Requerida

Para cada una de las 11 señas, deposita aquí los archivos generados con los siguientes nombres:

### Palabras:
- `HOLA_body.mp4` / `HOLA_hand.mp4`
- `YO_body.mp4` / `YO_hand.mp4`
- `BUENOS_body.mp4` / `BUENOS_hand.mp4`
- `DIAS_body.mp4` / `DIAS_hand.mp4`
- `NOCHES_body.mp4` / `NOCHES_hand.mp4`
- `NOMBRE_body.mp4` / `NOMBRE_hand.mp4`

### Letras:
- `A_body.mp4` / `A_hand.mp4`
- `B_body.mp4` / `B_hand.mp4`
- `C_body.mp4` / `C_hand.mp4`
- `L_body.mp4` / `L_hand.mp4`
- `V_body.mp4` / `V_hand.mp4`

*(Opcional: Si se añaden gemelos `.webp`, el reproductor los usará automáticamente como fallback).*

## Integración con la Aplicación Web

El reproductor interactivo `app/js/video-player.js` detecta automáticamente la presencia de estos archivos:
- Cuando el usuario presiona el botón **"Anime IA"**, si el video `<SIGN>_<VIEW>.mp4` existe en esta carpeta, se reproduce en bucle continuo de inmediato.
- Si aún no se ha generado el video para esa seña en particular, el reproductor muestra un elegante aviso flotante *"Anime IA en Preparación"* y reproduce fluidamente la versión de Persona Real LSC como fallback.

Para obtener los prompts listos para copiar y las fotos clave de referencia, consulta:
`referencias_para_gemini/PROMPTS_GEMINI.md`
