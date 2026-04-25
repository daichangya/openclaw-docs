---
read_when:
    - Quieres modelos Xiaomi MiMo en OpenClaw
    - Necesitas configurar `XIAOMI_API_KEY`
summary: Usa modelos Xiaomi MiMo con OpenClaw
title: Xiaomi MiMo
x-i18n:
    generated_at: "2026-04-25T13:56:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7781973c3a1d14101cdb0a8d1affe3fd076a968552ed2a8630a91a8947daeb3a
    source_path: providers/xiaomi.md
    workflow: 15
---

Xiaomi MiMo es la plataforma de API para los modelos **MiMo**. OpenClaw usa el endpoint compatible con OpenAI de Xiaomi
con autenticación por clave de API.

| Property | Value                           |
| -------- | ------------------------------- |
| Provider | `xiaomi`                        |
| Auth     | `XIAOMI_API_KEY`                |
| API      | Compatible con OpenAI           |
| Base URL | `https://api.xiaomimimo.com/v1` |

## Primeros pasos

<Steps>
  <Step title="Obtén una clave de API">
    Crea una clave de API en la [consola de Xiaomi MiMo](https://platform.xiaomimimo.com/#/console/api-keys).
  </Step>
  <Step title="Ejecuta la incorporación">
    ```bash
    openclaw onboard --auth-choice xiaomi-api-key
    ```

    O pasa la clave directamente:

    ```bash
    openclaw onboard --auth-choice xiaomi-api-key --xiaomi-api-key "$XIAOMI_API_KEY"
    ```

  </Step>
  <Step title="Verifica que el modelo esté disponible">
    ```bash
    openclaw models list --provider xiaomi
    ```
  </Step>
</Steps>

## Catálogo integrado

| Model ref              | Input       | Context   | Max output | Reasoning | Notes         |
| ---------------------- | ----------- | --------- | ---------- | --------- | ------------- |
| `xiaomi/mimo-v2-flash` | text        | 262,144   | 8,192      | No        | Modelo predeterminado |
| `xiaomi/mimo-v2-pro`   | text        | 1,048,576 | 32,000     | Sí        | Contexto amplio |
| `xiaomi/mimo-v2-omni`  | text, image | 262,144   | 32,000     | Sí        | Multimodal    |

<Tip>
La referencia de modelo predeterminada es `xiaomi/mimo-v2-flash`. El proveedor se inyecta automáticamente cuando `XIAOMI_API_KEY` está configurada o existe un perfil de autenticación.
</Tip>

## Conversión de texto a voz

El Plugin `xiaomi` incluido también registra Xiaomi MiMo como proveedor de voz para
`messages.tts`. Llama al contrato TTS de chat completions de Xiaomi con el texto como
mensaje `assistant` y una guía de estilo opcional como mensaje `user`.

| Property | Value                                    |
| -------- | ---------------------------------------- |
| TTS id   | `xiaomi` (alias `mimo`)                  |
| Auth     | `XIAOMI_API_KEY`                         |
| API      | `POST /v1/chat/completions` con `audio` |
| Default  | `mimo-v2.5-tts`, voz `mimo_default`    |
| Output   | MP3 de forma predeterminada; WAV cuando se configura |

```json5
{
  messages: {
    tts: {
      auto: "always",
      provider: "xiaomi",
      providers: {
        xiaomi: {
          apiKey: "xiaomi_api_key",
          model: "mimo-v2.5-tts",
          voice: "mimo_default",
          format: "mp3",
          style: "Bright, natural, conversational tone.",
        },
      },
    },
  },
}
```

Las voces integradas compatibles incluyen `mimo_default`, `default_zh`, `default_en`,
`Mia`, `Chloe`, `Milo` y `Dean`. `mimo-v2-tts` es compatible con cuentas TTS
MiMo antiguas; la configuración predeterminada usa el modelo TTS actual MiMo-V2.5. Para destinos de notas de voz
como Feishu y Telegram, OpenClaw transcodifica la salida de Xiaomi a Opus de 48 kHz
con `ffmpeg` antes de la entrega.

## Ejemplo de configuración

```json5
{
  env: { XIAOMI_API_KEY: "your-key" },
  agents: { defaults: { model: { primary: "xiaomi/mimo-v2-flash" } } },
  models: {
    mode: "merge",
    providers: {
      xiaomi: {
        baseUrl: "https://api.xiaomimimo.com/v1",
        api: "openai-completions",
        apiKey: "XIAOMI_API_KEY",
        models: [
          {
            id: "mimo-v2-flash",
            name: "Xiaomi MiMo V2 Flash",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 8192,
          },
          {
            id: "mimo-v2-pro",
            name: "Xiaomi MiMo V2 Pro",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 1048576,
            maxTokens: 32000,
          },
          {
            id: "mimo-v2-omni",
            name: "Xiaomi MiMo V2 Omni",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Comportamiento de inyección automática">
    El proveedor `xiaomi` se inyecta automáticamente cuando `XIAOMI_API_KEY` está configurada en tu entorno o existe un perfil de autenticación. No necesitas configurar manualmente el proveedor a menos que quieras sobrescribir los metadatos del modelo o la URL base.
  </Accordion>

  <Accordion title="Detalles del modelo">
    - **mimo-v2-flash** — ligero y rápido, ideal para tareas de texto de propósito general. No admite reasoning.
    - **mimo-v2-pro** — admite reasoning con una ventana de contexto de 1M tokens para cargas de trabajo con documentos largos.
    - **mimo-v2-omni** — modelo multimodal con reasoning habilitado que acepta entradas de texto e imagen.

    <Note>
    Todos los modelos usan el prefijo `xiaomi/` (por ejemplo `xiaomi/mimo-v2-pro`).
    </Note>

  </Accordion>

  <Accordion title="Solución de problemas">
    - Si los modelos no aparecen, confirma que `XIAOMI_API_KEY` esté configurada y sea válida.
    - Cuando Gateway se ejecuta como daemon, asegúrate de que la clave esté disponible para ese proceso (por ejemplo en `~/.openclaw/.env` o mediante la configuración `env.shellEnv`).

    <Warning>
    Las claves configuradas solo en tu shell interactivo no son visibles para los procesos de Gateway administrados como daemon. Usa `~/.openclaw/.env` o la configuración `env.shellEnv` para una disponibilidad persistente.
    </Warning>

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Referencia de configuración" href="/es/gateway/configuration-reference" icon="gear">
    Referencia completa de configuración de OpenClaw.
  </Card>
  <Card title="Consola de Xiaomi MiMo" href="https://platform.xiaomimimo.com" icon="arrow-up-right-from-square">
    Panel de Xiaomi MiMo y gestión de claves de API.
  </Card>
</CardGroup>
