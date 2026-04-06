---
read_when:
    - Quieres generación multimedia con Vydra en OpenClaw
    - Necesitas orientación para configurar la clave API de Vydra
summary: Usa imagen, video y voz de Vydra en OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-06T03:11:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0fe999e8a5414b8a31a6d7d127bc6bcfc3b4492b8f438ab17dfa9680c5b079b7
    source_path: providers/vydra.md
    workflow: 15
---

# Vydra

El plugin empaquetado de Vydra añade:

- generación de imágenes mediante `vydra/grok-imagine`
- generación de video mediante `vydra/veo3` y `vydra/kling`
- síntesis de voz mediante la ruta TTS de Vydra respaldada por ElevenLabs

OpenClaw usa la misma `VYDRA_API_KEY` para las tres capacidades.

## URL base importante

Usa `https://www.vydra.ai/api/v1`.

El host raíz de Vydra (`https://vydra.ai/api/v1`) actualmente redirige a `www`. Algunos clientes HTTP eliminan `Authorization` en esa redirección entre hosts, lo que convierte una clave API válida en un fallo de autenticación engañoso. El plugin empaquetado usa directamente la URL base `www` para evitarlo.

## Configuración

Onboarding interactivo:

```bash
openclaw onboard --auth-choice vydra-api-key
```

O establece la variable de entorno directamente:

```bash
export VYDRA_API_KEY="vydra_live_..."
```

## Generación de imágenes

Modelo de imagen predeterminado:

- `vydra/grok-imagine`

Configúralo como proveedor de imágenes predeterminado:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "vydra/grok-imagine",
      },
    },
  },
}
```

La compatibilidad empaquetada actual es solo de texto a imagen. Las rutas de edición alojadas de Vydra esperan URL de imagen remotas, y OpenClaw aún no añade un puente de carga específico de Vydra en el plugin empaquetado.

Consulta [Generación de imágenes](/es/tools/image-generation) para ver el comportamiento compartido de la herramienta.

## Generación de video

Modelos de video registrados:

- `vydra/veo3` para texto a video
- `vydra/kling` para imagen a video

Configura Vydra como proveedor de video predeterminado:

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "vydra/veo3",
      },
    },
  },
}
```

Notas:

- `vydra/veo3` se incluye solo como texto a video.
- `vydra/kling` actualmente requiere una referencia de URL de imagen remota. Las cargas de archivos locales se rechazan por adelantado.
- El plugin empaquetado se mantiene conservador y no reenvía parámetros de estilo no documentados como relación de aspecto, resolución, marca de agua o audio generado.

Consulta [Generación de video](/tools/video-generation) para ver el comportamiento compartido de la herramienta.

## Síntesis de voz

Configura Vydra como proveedor de voz:

```json5
{
  messages: {
    tts: {
      provider: "vydra",
      providers: {
        vydra: {
          apiKey: "${VYDRA_API_KEY}",
          voiceId: "21m00Tcm4TlvDq8ikWAM",
        },
      },
    },
  },
}
```

Valores predeterminados:

- modelo: `elevenlabs/tts`
- ID de voz: `21m00Tcm4TlvDq8ikWAM`

El plugin empaquetado actualmente expone una voz predeterminada conocida y fiable y devuelve archivos de audio MP3.

## Relacionado

- [Directorio de proveedores](/es/providers/index)
- [Generación de imágenes](/es/tools/image-generation)
- [Generación de video](/tools/video-generation)
