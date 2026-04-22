---
read_when:
    - Quieres una sola API key para muchos LLMs
    - Quieres ejecutar modelos mediante OpenRouter en OpenClaw
summary: Usa la API unificada de OpenRouter para acceder a muchos modelos en OpenClaw
title: OpenRouter
x-i18n:
    generated_at: "2026-04-22T04:27:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3a8d1e6191d98e3f5284ebc77e0b8b855a04f3fbed09786d6125b622333ac807
    source_path: providers/openrouter.md
    workflow: 15
---

# OpenRouter

OpenRouter proporciona una **API unificada** que enruta solicitudes a muchos modelos detrás de un único
endpoint y una única API key. Es compatible con OpenAI, así que la mayoría de los SDK de OpenAI funcionan cambiando la URL base.

## Primeros pasos

<Steps>
  <Step title="Obtén tu API key">
    Crea una API key en [openrouter.ai/keys](https://openrouter.ai/keys).
  </Step>
  <Step title="Ejecuta el onboarding">
    ```bash
    openclaw onboard --auth-choice openrouter-api-key
    ```
  </Step>
  <Step title="(Opcional) Cambia a un modelo específico">
    El onboarding usa por defecto `openrouter/auto`. Elige más tarde un modelo concreto:

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

## Referencias de modelo

<Note>
Las referencias de modelo siguen el patrón `openrouter/<provider>/<model>`. Para ver la lista completa de
proveedores y modelos disponibles, consulta [/concepts/model-providers](/es/concepts/model-providers).
</Note>

Ejemplos de reservas incluidas:

| Referencia de modelo                 | Notas                         |
| ------------------------------------ | ----------------------------- |
| `openrouter/auto`                    | Enrutamiento automático de OpenRouter |
| `openrouter/moonshotai/kimi-k2.6`    | Kimi K2.6 vía MoonshotAI      |
| `openrouter/openrouter/healer-alpha` | Ruta Healer Alpha de OpenRouter |
| `openrouter/openrouter/hunter-alpha` | Ruta Hunter Alpha de OpenRouter |

## Autenticación y encabezados

OpenRouter usa internamente un token Bearer con tu API key.

En solicitudes reales a OpenRouter (`https://openrouter.ai/api/v1`), OpenClaw también añade
los encabezados documentados de atribución de aplicación de OpenRouter:

| Encabezado               | Valor                 |
| ------------------------ | --------------------- |
| `HTTP-Referer`           | `https://openclaw.ai` |
| `X-OpenRouter-Title`     | `OpenClaw`            |
| `X-OpenRouter-Categories`| `cli-agent`           |

<Warning>
Si vuelves a apuntar el proveedor OpenRouter a otro proxy o URL base, OpenClaw
**no** inyecta esos encabezados específicos de OpenRouter ni marcadores de caché de Anthropic.
</Warning>

## Notas avanzadas

<AccordionGroup>
  <Accordion title="Marcadores de caché de Anthropic">
    En rutas verificadas de OpenRouter, las referencias de modelo Anthropic conservan los
    marcadores `cache_control` específicos de Anthropic para OpenRouter que OpenClaw usa para
    una mejor reutilización de la caché de prompts en bloques de prompt del sistema/desarrollador.
  </Accordion>

  <Accordion title="Inyección de thinking / reasoning">
    En rutas compatibles que no sean `auto`, OpenClaw asigna el nivel de thinking seleccionado a
    cargas útiles de reasoning del proxy de OpenRouter. Las pistas de modelos no compatibles y
    `openrouter/auto` omiten esa inyección de reasoning.
  </Accordion>

  <Accordion title="Moldeado de solicitudes solo de OpenAI">
    OpenRouter sigue pasando por la ruta compatible con OpenAI de estilo proxy, por lo que
    el moldeado nativo de solicitudes solo de OpenAI como `serviceTier`, Responses `store`,
    cargas útiles de compatibilidad de reasoning de OpenAI y pistas de caché de prompts no se reenvía.
  </Accordion>

  <Accordion title="Rutas respaldadas por Gemini">
    Las referencias OpenRouter respaldadas por Gemini permanecen en la ruta proxy-Gemini: OpenClaw mantiene
    ahí el saneamiento de firmas de pensamiento de Gemini, pero no habilita validación nativa de replay de Gemini
    ni reescrituras de bootstrap.
  </Accordion>

  <Accordion title="Metadatos de enrutamiento del proveedor">
    Si pasas enrutamiento de proveedor de OpenRouter bajo parámetros del modelo, OpenClaw lo reenvía
    como metadatos de enrutamiento de OpenRouter antes de que se ejecuten los envoltorios de flujo compartidos.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelo y comportamiento de reserva.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración para agentes, modelos y proveedores.
  </Card>
</CardGroup>
