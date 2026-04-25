---
read_when:
    - Añadir o modificar comandos `openclaw infer`
    - Diseñar automatización estable de capacidades sin interfaz
summary: CLI con inferencia primero para flujos de trabajo de modelos, imágenes, audio, TTS, video, web y embeddings respaldados por proveedores
title: CLI de inferencia
x-i18n:
    generated_at: "2026-04-25T13:43:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: 249c1074b48882a3beacb08839c8ac992050133fa80e731133620c17dfbbdfe0
    source_path: cli/infer.md
    workflow: 15
---

`openclaw infer` es la interfaz canónica sin interfaz para flujos de inferencia respaldados por proveedores.

Expone intencionadamente familias de capacidades, no nombres RPC sin procesar del Gateway ni IDs sin procesar de herramientas del agente.

## Convertir infer en una Skill

Copia y pega esto en un agente:

```text
Read https://docs.openclaw.ai/cli/infer, then create a skill that routes my common workflows to `openclaw infer`.
Focus on model runs, image generation, video generation, audio transcription, TTS, web search, and embeddings.
```

Una buena Skill basada en infer debería:

- asignar intenciones comunes del usuario al subcomando correcto de infer
- incluir algunos ejemplos canónicos de infer para los flujos de trabajo que cubre
- preferir `openclaw infer ...` en ejemplos y sugerencias
- evitar volver a documentar toda la superficie de infer dentro del cuerpo de la Skill

Cobertura típica de una Skill centrada en infer:

- `openclaw infer model run`
- `openclaw infer image generate`
- `openclaw infer audio transcribe`
- `openclaw infer tts convert`
- `openclaw infer web search`
- `openclaw infer embedding create`

## Por qué usar infer

`openclaw infer` proporciona una CLI coherente para tareas de inferencia respaldadas por proveedores dentro de OpenClaw.

Ventajas:

- Usa los proveedores y modelos ya configurados en OpenClaw en lugar de crear wrappers puntuales para cada backend.
- Mantén los flujos de trabajo de modelo, imagen, transcripción de audio, TTS, video, web y embeddings bajo un solo árbol de comandos.
- Usa una forma de salida `--json` estable para scripts, automatización y flujos de trabajo controlados por agentes.
- Prefiere una superficie propia de OpenClaw cuando la tarea es fundamentalmente “ejecutar inferencia”.
- Usa la ruta local normal sin requerir el Gateway para la mayoría de los comandos de infer.

Para comprobaciones integrales de proveedores, prefiere `openclaw infer ...` una vez que las pruebas de proveedor de nivel inferior estén en verde. Ejercita la CLI publicada, la carga de configuración, la resolución del agente predeterminado, la activación de Plugins incluidos, la reparación de dependencias en tiempo de ejecución y el runtime compartido de capacidades antes de que se realice la solicitud al proveedor.

## Árbol de comandos

```text
 openclaw infer
  list
  inspect

  model
    run
    list
    inspect
    providers
    auth login
    auth logout
    auth status

  image
    generate
    edit
    describe
    describe-many
    providers

  audio
    transcribe
    providers

  tts
    convert
    voices
    providers
    status
    enable
    disable
    set-provider

  video
    generate
    describe
    providers

  web
    search
    fetch
    providers

  embedding
    create
    providers
```

## Tareas comunes

Esta tabla asigna tareas comunes de inferencia al comando infer correspondiente.

| Task                    | Command                                                                | Notes                                                 |
| ----------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| Ejecutar un prompt de texto/modelo | `openclaw infer model run --prompt "..." --json`                       | Usa la ruta local normal de forma predeterminada      |
| Generar una imagen      | `openclaw infer image generate --prompt "..." --json`                  | Usa `image edit` cuando partas de un archivo existente |
| Describir un archivo de imagen | `openclaw infer image describe --file ./image.png --json`              | `--model` debe ser un `<provider/model>` compatible con imágenes |
| Transcribir audio       | `openclaw infer audio transcribe --file ./memo.m4a --json`             | `--model` debe ser `<provider/model>`                 |
| Sintetizar voz          | `openclaw infer tts convert --text "..." --output ./speech.mp3 --json` | `tts status` está orientado al Gateway                |
| Generar un video        | `openclaw infer video generate --prompt "..." --json`                  | Admite sugerencias del proveedor como `--resolution`  |
| Describir un archivo de video | `openclaw infer video describe --file ./clip.mp4 --json`               | `--model` debe ser `<provider/model>`                 |
| Buscar en la web        | `openclaw infer web search --query "..." --json`                       |                                                       |
| Obtener una página web  | `openclaw infer web fetch --url https://example.com --json`            |                                                       |
| Crear embeddings        | `openclaw infer embedding create --text "..." --json`                  |                                                       |

## Comportamiento

- `openclaw infer ...` es la superficie principal de CLI para estos flujos de trabajo.
- Usa `--json` cuando la salida vaya a ser consumida por otro comando o script.
- Usa `--provider` o `--model provider/model` cuando se requiera un backend específico.
- Para `image describe`, `audio transcribe` y `video describe`, `--model` debe usar la forma `<provider/model>`.
- Para `image describe`, un `--model` explícito ejecuta directamente ese proveedor/modelo. El modelo debe ser compatible con imágenes en el catálogo de modelos o en la configuración del proveedor. `codex/<model>` ejecuta un turno limitado de comprensión de imágenes del servidor de aplicaciones Codex; `openai-codex/<model>` usa la ruta del proveedor OAuth de OpenAI Codex.
- Los comandos de ejecución sin estado usan la ruta local de forma predeterminada.
- Los comandos de estado administrado por Gateway usan el Gateway de forma predeterminada.
- La ruta local normal no requiere que el Gateway esté en ejecución.
- `model run` es de una sola ejecución. Los servidores MCP abiertos a través del runtime del agente para ese comando se retiran después de la respuesta tanto en ejecución local como con `--gateway`, por lo que invocaciones repetidas en scripts no mantienen vivos procesos hijo MCP por stdio.

## Model

Usa `model` para inferencia de texto respaldada por proveedores e inspección de modelos/proveedores.

```bash
openclaw infer model run --prompt "Reply with exactly: smoke-ok" --json
openclaw infer model run --prompt "Summarize this changelog entry" --provider openai --json
openclaw infer model providers --json
openclaw infer model inspect --name gpt-5.5 --json
```

Notas:

- `model run` reutiliza el runtime del agente, por lo que las anulaciones de proveedor/modelo se comportan como una ejecución normal del agente.
- Como `model run` está pensado para automatización sin interfaz, no conserva runtimes MCP incluidos por sesión después de que termine el comando.
- `model auth login`, `model auth logout` y `model auth status` administran el estado guardado de autenticación del proveedor.

## Image

Usa `image` para generación, edición y descripción.

```bash
openclaw infer image generate --prompt "friendly lobster illustration" --json
openclaw infer image generate --prompt "cinematic product photo of headphones" --json
openclaw infer image describe --file ./photo.jpg --json
openclaw infer image describe --file ./ui-screenshot.png --model openai/gpt-4.1-mini --json
openclaw infer image describe --file ./photo.jpg --model ollama/qwen2.5vl:7b --json
```

Notas:

- Usa `image edit` cuando partas de archivos de entrada existentes.
- Usa `image providers --json` para verificar qué proveedores de imagen incluidos son detectables, están configurados, seleccionados y qué capacidades de generación/edición expone cada proveedor.
- Usa `image generate --model <provider/model> --json` como la prueba en vivo de CLI más acotada para cambios de generación de imágenes. Ejemplo:

  ```bash
  openclaw infer image providers --json
  openclaw infer image generate \
    --model google/gemini-3.1-flash-image-preview \
    --prompt "Minimal flat test image: one blue square on a white background, no text." \
    --output ./openclaw-infer-image-smoke.png \
    --json
  ```

  La respuesta JSON informa `ok`, `provider`, `model`, `attempts` y las rutas de salida escritas. Cuando se configura `--output`, la extensión final puede seguir el tipo MIME devuelto por el proveedor.

- Para `image describe`, `--model` debe ser un `<provider/model>` compatible con imágenes.
- Para modelos locales de visión de Ollama, descarga primero el modelo y configura `OLLAMA_API_KEY` con cualquier valor de marcador de posición, por ejemplo `ollama-local`. Consulta [Ollama](/es/providers/ollama#vision-and-image-description).

## Audio

Usa `audio` para transcripción de archivos.

```bash
openclaw infer audio transcribe --file ./memo.m4a --json
openclaw infer audio transcribe --file ./team-sync.m4a --language en --prompt "Focus on names and action items" --json
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

Notas:

- `audio transcribe` es para transcripción de archivos, no para administración de sesiones en tiempo real.
- `--model` debe ser `<provider/model>`.

## TTS

Usa `tts` para síntesis de voz y estado del proveedor TTS.

```bash
openclaw infer tts convert --text "hello from openclaw" --output ./hello.mp3 --json
openclaw infer tts convert --text "Your build is complete" --output ./build-complete.mp3 --json
openclaw infer tts providers --json
openclaw infer tts status --json
```

Notas:

- `tts status` usa el Gateway de forma predeterminada porque refleja el estado de TTS administrado por el Gateway.
- Usa `tts providers`, `tts voices` y `tts set-provider` para inspeccionar y configurar el comportamiento de TTS.

## Video

Usa `video` para generación y descripción.

```bash
openclaw infer video generate --prompt "cinematic sunset over the ocean" --json
openclaw infer video generate --prompt "slow drone shot over a forest lake" --resolution 768P --duration 6 --json
openclaw infer video describe --file ./clip.mp4 --json
openclaw infer video describe --file ./clip.mp4 --model openai/gpt-4.1-mini --json
```

Notas:

- `video generate` acepta `--size`, `--aspect-ratio`, `--resolution`, `--duration`, `--audio`, `--watermark` y `--timeout-ms`, y los reenvía al runtime de generación de video.
- `--model` debe ser `<provider/model>` para `video describe`.

## Web

Usa `web` para flujos de búsqueda y obtención web.

```bash
openclaw infer web search --query "OpenClaw docs" --json
openclaw infer web search --query "OpenClaw infer web providers" --json
openclaw infer web fetch --url https://docs.openclaw.ai/cli/infer --json
openclaw infer web providers --json
```

Notas:

- Usa `web providers` para inspeccionar los proveedores disponibles, configurados y seleccionados.

## Embedding

Usa `embedding` para creación de vectores e inspección de proveedores de embeddings.

```bash
openclaw infer embedding create --text "friendly lobster" --json
openclaw infer embedding create --text "customer support ticket: delayed shipment" --model openai/text-embedding-3-large --json
openclaw infer embedding providers --json
```

## Salida JSON

Los comandos infer normalizan la salida JSON bajo un contenedor compartido:

```json
{
  "ok": true,
  "capability": "image.generate",
  "transport": "local",
  "provider": "openai",
  "model": "gpt-image-2",
  "attempts": [],
  "outputs": []
}
```

Los campos de nivel superior son estables:

- `ok`
- `capability`
- `transport`
- `provider`
- `model`
- `attempts`
- `outputs`
- `error`

Para comandos de generación de archivos multimedia, `outputs` contiene archivos escritos por OpenClaw. Usa `path`, `mimeType`, `size` y cualquier dimensión específica de multimedia de ese arreglo para automatización en lugar de analizar stdout legible por humanos.

## Errores comunes

```bash
# Mal
openclaw infer media image generate --prompt "friendly lobster"

# Bien
openclaw infer image generate --prompt "friendly lobster"
```

```bash
# Mal
openclaw infer audio transcribe --file ./memo.m4a --model whisper-1 --json

# Bien
openclaw infer audio transcribe --file ./memo.m4a --model openai/whisper-1 --json
```

## Notas

- `openclaw capability ...` es un alias de `openclaw infer ...`.

## Relacionado

- [Referencia de CLI](/es/cli)
- [Models](/es/concepts/models)
