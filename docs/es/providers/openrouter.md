---
read_when:
    - Quieres una sola clave API para muchos LLMs
    - Quieres ejecutar modelos a través de OpenRouter en OpenClaw
    - Quieres usar OpenRouter para la generación de imágenes
summary: Usa la API unificada de OpenRouter para acceder a muchos modelos en OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-25T13:56:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: f0dfbe92fbe229b3d0c22fa7997adc1906609bc3ee63c780b1f66f545d327f49
    source_path: providers/openrouter.md
    workflow: 15
---

OpenRouter proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
endpoint y una sola clave API. Es compatible con OpenAI, así que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

## Primeros pasos

<Steps>
  <Step title="Obtén tu clave API">
    Crea una clave API en [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Ejecuta la incorporación">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcional) Cambia a un modelo específico">
    La incorporación usa `openrouter/auto` de forma predeterminada. Elige más adelante un modelo concreto:

    ```bash
    openclaw models set openrouter/<provider>/<model>
    ```

  </Step>
</Steps>

## Ejemplo de configuración

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      model: { primary: "openrouter/auto" },
    },
  },
}
```

## Referencias de modelos

<Note>
Las referencias de modelos siguen el patrón `openrouter/<provider>/<model>`. Para ver la lista completa de
proveedores y modelos disponibles, consulta [/concepts/model-providers](/es/concepts/model-providers).
</Note>

Ejemplos integrados de respaldo:

| Referencia de modelo                | Notas                              |
| ----------------------------------- | ---------------------------------- |
| `openrouter/auto`                   | Enrutamiento automático de OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`   | Kimi K2.6 a través de MoonshotAI   |
| `openrouter/openrouter/healer-alpha` | Ruta OpenRouter Healer Alpha      |
| `openrouter/openrouter/hunter-alpha` | Ruta OpenRouter Hunter Alpha      |

## Generación de imágenes

OpenRouter también puede respaldar la herramienta `image_generate`. Usa un modelo de imágenes de OpenRouter en `agents.defaults.imageGenerationModel`:

```json5
{
  env: { OPENROUTER_API_KEY: "sk-or-..." },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "openrouter/google/gemini-3.1-flash-image-preview",
      },
    },
  },
}
```

OpenClaw envía las solicitudes de imágenes a la API de imágenes de chat completions de OpenRouter con `modalities: ["image", "text"]`. Los modelos de imágenes Gemini reciben las sugerencias compatibles de `aspectRatio` y `resolution` mediante `image_config` de OpenRouter.

## Texto a voz

OpenRouter también puede usarse como proveedor de TTS a través de su endpoint
`/audio/speech` compatible con OpenAI.

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "openrouter",
      providers: {
        openrouter: {
          model: "hexgrad/kokoro-82m",
          voice: "af_alloy",
          responseFormat: "mp3",
        },
      },
    },
  },
}
```

Si se omite `messages.tts.providers.openrouter.apiKey`, TTS reutiliza
`models.providers.openrouter.apiKey` y luego `OPENROUTER_API_KEY`.

## Autenticación y encabezados

OpenRouter usa internamente un token Bearer con tu clave API.

En solicitudes reales de OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw también agrega
los encabezados de atribución de aplicación documentados por OpenRouter:

| Encabezado               | Valor                 |
| ------------------------ | --------------------- |
| `HTTP-Referer`           | `https://openclaw.ai` |
| `X-OpenRouter-Title`     | `OpenClaw`            |
| `X-OpenRouter-Categories` | `cli-agent`          |

<Warning>
Si rediriges el proveedor OpenRouter a otro proxy o URL base, OpenClaw
**no** inyecta esos encabezados específicos de OpenRouter ni los marcadores de caché de Anthropic.
</Warning>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Marcadores de caché de Anthropic">
    En rutas OpenRouter verificadas, las referencias de modelos de Anthropic conservan los
    marcadores `cache_control` específicos de Anthropic para OpenRouter que OpenClaw usa para
    mejorar la reutilización de la caché de prompts en bloques de prompts de sistema/desarrollador.
  </Accordion>

  <Accordion title="Inyección de thinking / reasoning">
    En rutas compatibles que no son `auto`, OpenClaw asigna el nivel de thinking seleccionado a
    las cargas útiles de reasoning del proxy de OpenRouter. Las sugerencias de modelos no compatibles y
    `openrouter/auto` omiten esa inyección de reasoning.
  </Accordion>

  <Accordion title="Modelado de solicitudes solo de OpenAI">
    OpenRouter sigue ejecutándose a través de la ruta compatible con OpenAI de estilo proxy, por lo que
    el modelado nativo de solicitudes exclusivo de OpenAI, como `serviceTier`, `store` de Responses,
    las cargas útiles de compatibilidad de reasoning de OpenAI y las sugerencias de caché de prompts, no se reenvía.
  </Accordion>

  <Accordion title="Rutas respaldadas por Gemini">
    Las referencias de OpenRouter respaldadas por Gemini permanecen en la ruta Gemini con proxy: OpenClaw mantiene
    allí la limpieza de firmas de pensamiento de Gemini, pero no habilita la validación nativa de reproducción de Gemini
    ni las reescrituras de arranque.
  </Accordion>

  <Accordion title="Metadatos de enrutamiento del proveedor">
    Si pasas el enrutamiento de proveedor de OpenRouter en los parámetros del modelo, OpenClaw lo reenvía
    como metadatos de enrutamiento de OpenRouter antes de que se ejecuten los envoltorios de flujo compartidos.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de failover.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
