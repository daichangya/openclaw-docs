---
read_when:
    - Implementación del modo Talk en macOS/iOS/Android
    - Cambio del comportamiento de voz/TTS/interrupción
summary: 'Modo Talk: conversaciones continuas por voz con proveedores de TTS configurados'
title: Modo Talk
x-i18n:
    generated_at: "2026-04-25T13:49:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 84c99149c43bfe9fa4866b20271089d88d7e3d2f5abe6d16477a26915dad7829
    source_path: nodes/talk.md
    workflow: 15
---

El modo Talk es un bucle continuo de conversación por voz:

1. Escuchar la voz
2. Enviar la transcripción al modelo (sesión principal, `chat.send`)
3. Esperar la respuesta
4. Reproducirla mediante el proveedor Talk configurado (`talk.speak`)

## Comportamiento (macOS)

- **Superposición siempre activa** mientras el modo Talk está habilitado.
- Transiciones de fase **Escuchando → Pensando → Hablando**.
- Con una **pausa corta** (ventana de silencio), se envía la transcripción actual.
- Las respuestas se **escriben en WebChat** (igual que al escribir).
- **Interrumpir al hablar** (activado de forma predeterminada): si el usuario empieza a hablar mientras el asistente está hablando, detenemos la reproducción y registramos la marca de tiempo de la interrupción para el siguiente prompt.

## Directivas de voz en las respuestas

El asistente puede anteponer a su respuesta una **única línea JSON** para controlar la voz:

```json
{ "voice": "<voice-id>", "once": true }
```

Reglas:

- Solo la primera línea no vacía.
- Las claves desconocidas se ignoran.
- `once: true` se aplica solo a la respuesta actual.
- Sin `once`, la voz se convierte en la nueva predeterminada para el modo Talk.
- La línea JSON se elimina antes de la reproducción TTS.

Claves compatibles:

- `voice` / `voice_id` / `voiceId`
- `model` / `model_id` / `modelId`
- `speed`, `rate` (PPM), `stability`, `similarity`, `style`, `speakerBoost`
- `seed`, `normalize`, `lang`, `output_format`, `latency_tier`
- `once`

## Configuración (`~/.openclaw/openclaw.json`)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

Valores predeterminados:

- `interruptOnSpeech`: true
- `silenceTimeoutMs`: cuando no está definido, Talk mantiene la ventana de pausa predeterminada de la plataforma antes de enviar la transcripción (`700 ms en macOS y Android, 900 ms en iOS`)
- `provider`: selecciona el proveedor Talk activo. Usa `elevenlabs`, `mlx` o `system` para las rutas de reproducción locales de macOS.
- `providers.<provider>.voiceId`: usa como respaldo `ELEVENLABS_VOICE_ID` / `SAG_VOICE_ID` para ElevenLabs (o la primera voz de ElevenLabs cuando la clave API está disponible).
- `providers.elevenlabs.modelId`: usa `eleven_v3` de forma predeterminada cuando no está definido.
- `providers.mlx.modelId`: usa `mlx-community/Soprano-80M-bf16` de forma predeterminada cuando no está definido.
- `providers.elevenlabs.apiKey`: usa como respaldo `ELEVENLABS_API_KEY` (o el perfil de shell del gateway si está disponible).
- `outputFormat`: usa `pcm_44100` de forma predeterminada en macOS/iOS y `pcm_24000` en Android (establece `mp3_*` para forzar streaming MP3)

## Interfaz de usuario de macOS

- Alternar desde la barra de menús: **Talk**
- Pestaña de configuración: grupo **Talk Mode** (id de voz + alternancia de interrupción)
- Superposición:
  - **Escuchando**: la nube pulsa con el nivel del micrófono
  - **Pensando**: animación de hundimiento
  - **Hablando**: anillos radiantes
  - Clic en la nube: detener la voz
  - Clic en X: salir del modo Talk

## Notas

- Requiere permisos de Voz + Micrófono.
- Usa `chat.send` contra la clave de sesión `main`.
- El gateway resuelve la reproducción de Talk mediante `talk.speak` usando el proveedor Talk activo. Android usa como respaldo TTS local del sistema solo cuando ese RPC no está disponible.
- La reproducción local MLX en macOS usa el helper incluido `openclaw-mlx-tts` cuando está presente, o un ejecutable en `PATH`. Establece `OPENCLAW_MLX_TTS_BIN` para apuntar a un binario helper personalizado durante el desarrollo.
- `stability` para `eleven_v3` se valida como `0.0`, `0.5` o `1.0`; otros modelos aceptan `0..1`.
- `latency_tier` se valida como `0..4` cuando está definido.
- Android admite formatos de salida `pcm_16000`, `pcm_22050`, `pcm_24000` y `pcm_44100` para streaming de baja latencia con AudioTrack.

## Relacionado

- [Activación por voz](/es/nodes/voicewake)
- [Audio y notas de voz](/es/nodes/audio)
- [Comprensión de contenido multimedia](/es/nodes/media-understanding)
