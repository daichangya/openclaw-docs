---
read_when:
    - Quieres la conversión de voz a texto de Deepgram para archivos de audio adjuntos
    - Quieres la transcripción en tiempo real de Deepgram para Voice Call
    - Necesitas un ejemplo rápido de configuración de Deepgram
summary: Transcripción de Deepgram para notas de voz entrantes
title: Deepgram
x-i18n:
    generated_at: "2026-04-25T13:54:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d591aa24a5477fd9fe69b7a0dc44b204d28ea0c2f89e6dfef66f9ceb76da34d
    source_path: providers/deepgram.md
    workflow: 15
---

Deepgram es una API de conversión de voz a texto. En OpenClaw se usa para la
transcripción de audio/notas de voz entrantes mediante `tools.media.audio` y para la
STT en tiempo real de Voice Call mediante `plugins.entries.voice-call.config.streaming`.

Para la transcripción por lotes, OpenClaw sube el archivo de audio completo a Deepgram
e inyecta la transcripción en el flujo de respuesta (`{{Transcript}}` +
bloque `[Audio]`). Para la STT en tiempo real de Voice Call, OpenClaw reenvía
tramas G.711 u-law en vivo a través del endpoint WebSocket `listen` de Deepgram y emite
transcripciones parciales o finales a medida que Deepgram las devuelve.

| Detalle        | Valor                                                      |
| ------------- | ---------------------------------------------------------- |
| Sitio web     | [deepgram.com](https://deepgram.com)                       |
| Documentación | [developers.deepgram.com](https://developers.deepgram.com) |
| Autenticación | `DEEPGRAM_API_KEY`                                         |
| Modelo predeterminado | `nova-3`                                           |

## Primeros pasos

<Steps>
  <Step title="Configura tu clave de API">
    Añade tu clave de API de Deepgram al entorno:

    ```
    DEEPGRAM_API_KEY=dg_...
    ```

  </Step>
  <Step title="Habilita el proveedor de audio">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Envía una nota de voz">
    Envía un mensaje de audio a través de cualquier canal conectado. OpenClaw lo transcribe
    mediante Deepgram e inyecta la transcripción en el flujo de respuesta.
  </Step>
</Steps>

## Opciones de configuración

| Opción            | Ruta                                                         | Descripción                              |
| ----------------- | ------------------------------------------------------------ | ---------------------------------------- |
| `model`           | `tools.media.audio.models[].model`                           | ID del modelo de Deepgram (predeterminado: `nova-3`) |
| `language`        | `tools.media.audio.models[].language`                        | Indicación de idioma (opcional)          |
| `detect_language` | `tools.media.audio.providerOptions.deepgram.detect_language` | Habilita la detección de idioma (opcional) |
| `punctuate`       | `tools.media.audio.providerOptions.deepgram.punctuate`       | Habilita la puntuación (opcional)        |
| `smart_format`    | `tools.media.audio.providerOptions.deepgram.smart_format`    | Habilita el formateo inteligente (opcional) |

<Tabs>
  <Tab title="Con indicación de idioma">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            models: [{ provider: "deepgram", model: "nova-3", language: "en" }],
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="Con opciones de Deepgram">
    ```json5
    {
      tools: {
        media: {
          audio: {
            enabled: true,
            providerOptions: {
              deepgram: {
                detect_language: true,
                punctuate: true,
                smart_format: true,
              },
            },
            models: [{ provider: "deepgram", model: "nova-3" }],
          },
        },
      },
    }
    ```
  </Tab>
</Tabs>

## STT en tiempo real de Voice Call

El Plugin `deepgram` incluido también registra un proveedor de transcripción en tiempo real
para el Plugin Voice Call.

| Configuración   | Ruta de configuración                                                   | Predeterminado                    |
| --------------- | ----------------------------------------------------------------------- | --------------------------------- |
| Clave de API    | `plugins.entries.voice-call.config.streaming.providers.deepgram.apiKey` | Usa `DEEPGRAM_API_KEY` como respaldo |
| Modelo          | `...deepgram.model`                                                     | `nova-3`                          |
| Idioma          | `...deepgram.language`                                                  | (sin configurar)                  |
| Codificación    | `...deepgram.encoding`                                                  | `mulaw`                           |
| Frecuencia de muestreo | `...deepgram.sampleRate`                                        | `8000`                            |
| Detección de fin de enunciado | `...deepgram.endpointingMs`                              | `800`                             |
| Resultados provisionales | `...deepgram.interimResults`                                  | `true`                            |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "deepgram",
            providers: {
              deepgram: {
                apiKey: "${DEEPGRAM_API_KEY}",
                model: "nova-3",
                endpointingMs: 800,
                language: "en-US",
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
Voice Call recibe audio de telefonía como G.711 u-law a 8 kHz. El proveedor de Deepgram
para tiempo real usa por defecto `encoding: "mulaw"` y `sampleRate: 8000`, por lo que
las tramas multimedia de Twilio pueden reenviarse directamente.
</Note>

## Notas

<AccordionGroup>
  <Accordion title="Autenticación">
    La autenticación sigue el orden estándar de autenticación de proveedores. `DEEPGRAM_API_KEY` es
    la ruta más sencilla.
  </Accordion>
  <Accordion title="Proxy y endpoints personalizados">
    Sustituye los endpoints o encabezados con `tools.media.audio.baseUrl` y
    `tools.media.audio.headers` cuando uses un proxy.
  </Accordion>
  <Accordion title="Comportamiento de la salida">
    La salida sigue las mismas reglas de audio que otros proveedores (límites de tamaño, tiempos de espera,
    inyección de transcripción).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Herramientas multimedia" href="/es/tools/media-overview" icon="photo-film">
    Descripción general del flujo de procesamiento de audio, imágenes y video.
  </Card>
  <Card title="Configuración" href="/es/gateway/configuration" icon="gear">
    Referencia completa de configuración, incluida la de las herramientas multimedia.
  </Card>
  <Card title="Resolución de problemas" href="/es/help/troubleshooting" icon="wrench">
    Problemas comunes y pasos de depuración.
  </Card>
  <Card title="Preguntas frecuentes" href="/es/help/faq" icon="circle-question">
    Preguntas frecuentes sobre la configuración de OpenClaw.
  </Card>
</CardGroup>
