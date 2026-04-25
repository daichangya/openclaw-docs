---
read_when:
    - Quieres usar modelos de Anthropic en OpenClaw
summary: Usa Anthropic Claude mediante claves de API o Claude CLI en OpenClaw
title: Anthropic
x-i18n:
    generated_at: "2026-04-25T13:54:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: daba524d9917321d2aec55222d0df7b850ddf7f5c1c13123b62807eebd1a7a1b
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic desarrolla la familia de modelos **Claude**. OpenClaw admite dos rutas de autenticación:

- **Clave de API** — acceso directo a la API de Anthropic con facturación basada en uso (modelos `anthropic/*`)
- **Claude CLI** — reutiliza un inicio de sesión existente de Claude CLI en el mismo host

<Warning>
El personal de Anthropic nos dijo que el uso de Claude CLI al estilo de OpenClaw vuelve a estar permitido, por lo que
OpenClaw considera que la reutilización de Claude CLI y el uso de `claude -p` están autorizados a menos que
Anthropic publique una nueva política.

Para hosts de Gateway de larga duración, las claves de API de Anthropic siguen siendo la ruta de producción más clara y
predecible.

Documentación pública actual de Anthropic:

- [Referencia de Claude Code CLI](https://code.claude.com/docs/en/cli-reference)
- [Descripción general del SDK de agentes de Claude](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Uso de Claude Code con tu plan Pro o Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Uso de Claude Code con tu plan Team o Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Primeros pasos

<Tabs>
  <Tab title="Clave de API">
    **Ideal para:** acceso estándar a la API y facturación basada en uso.

    <Steps>
      <Step title="Obtén tu clave de API">
        Crea una clave de API en la [Consola de Anthropic](https://console.anthropic.com/).
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        O pasa la clave directamente:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Ejemplo de configuración

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "sk-ant-..." },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-6" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **Ideal para:** reutilizar un inicio de sesión existente de Claude CLI sin una clave de API independiente.

    <Steps>
      <Step title="Asegúrate de que Claude CLI esté instalado y con sesión iniciada">
        Verifícalo con:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Ejecuta la incorporación">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw detecta y reutiliza las credenciales existentes de Claude CLI.
      </Step>
      <Step title="Verifica que el modelo esté disponible">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Los detalles de configuración y tiempo de ejecución del backend de Claude CLI están en [Backends de CLI](/es/gateway/cli-backends).
    </Note>

    <Tip>
    Si quieres la ruta de facturación más clara, usa una clave de API de Anthropic en su lugar. OpenClaw también admite opciones de estilo suscripción de [OpenAI Codex](/es/providers/openai), [Qwen Cloud](/es/providers/qwen), [MiniMax](/es/providers/minimax) y [Z.AI / GLM](/es/providers/glm).
    </Tip>

  </Tab>
</Tabs>

## Valores predeterminados de thinking (Claude 4.6)

Los modelos Claude 4.6 usan `adaptive` thinking de forma predeterminada en OpenClaw cuando no se establece un nivel explícito de thinking.

Sobrescríbelo por mensaje con `/think:<level>` o en los parámetros del modelo:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { thinking: "adaptive" },
        },
      },
    },
  },
}
```

<Note>
Documentación relacionada de Anthropic:
- [Thinking adaptativo](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Thinking extendido](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
</Note>

## Almacenamiento en caché de prompts

OpenClaw admite la función de almacenamiento en caché de prompts de Anthropic para autenticación con clave de API.

| Valor               | Duración de caché | Descripción                              |
| ------------------- | ----------------- | ---------------------------------------- |
| `"short"` (default) | 5 minutos         | Se aplica automáticamente para autenticación con clave de API |
| `"long"`            | 1 hora            | Caché extendida                          |
| `"none"`            | Sin caché         | Desactiva el almacenamiento en caché de prompts |

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": {
          params: { cacheRetention: "long" },
        },
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="Sobrescrituras de caché por agente">
    Usa los parámetros a nivel de modelo como base y luego sobrescribe agentes específicos mediante `agents.list[].params`:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-6" },
          models: {
            "anthropic/claude-opus-4-6": {
              params: { cacheRetention: "long" },
            },
          },
        },
        list: [
          { id: "research", default: true },
          { id: "alerts", params: { cacheRetention: "none" } },
        ],
      },
    }
    ```

    Orden de combinación de configuración:

    1. `agents.defaults.models["provider/model"].params`
    2. `agents.list[].params` (coincide por `id`, sobrescribe por clave)

    Esto permite que un agente mantenga una caché de larga duración mientras que otro agente en el mismo modelo desactiva el almacenamiento en caché para tráfico irregular o de bajo nivel de reutilización.

  </Accordion>

  <Accordion title="Notas sobre Bedrock Claude">
    - Los modelos Anthropic Claude en Bedrock (`amazon-bedrock/*anthropic.claude*`) aceptan el paso directo de `cacheRetention` cuando está configurado.
    - Los modelos de Bedrock que no son de Anthropic se fuerzan a `cacheRetention: "none"` en tiempo de ejecución.
    - Los valores predeterminados inteligentes para claves de API también inicializan `cacheRetention: "short"` para referencias de Claude en Bedrock cuando no se establece un valor explícito.
  </Accordion>
</AccordionGroup>

## Configuración avanzada

<AccordionGroup>
  <Accordion title="Modo rápido">
    El cambio compartido `/fast` de OpenClaw admite tráfico directo a Anthropic (clave de API y OAuth a `api.anthropic.com`).

    | Command | Maps to |
    |---------|---------|
    | `/fast on` | `service_tier: "auto"` |
    | `/fast off` | `service_tier: "standard_only"` |

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-sonnet-4-6": {
              params: { fastMode: true },
            },
          },
        },
      },
    }
    ```

    <Note>
    - Solo se inyecta para solicitudes directas a `api.anthropic.com`. Las rutas con proxy dejan `service_tier` sin cambios.
    - Los parámetros explícitos `serviceTier` o `service_tier` sobrescriben `/fast` cuando ambos están establecidos.
    - En cuentas sin capacidad de Priority Tier, `service_tier: "auto"` puede resolverse como `standard`.
    </Note>

  </Accordion>

  <Accordion title="Comprensión de medios (imagen y PDF)">
    El Plugin Anthropic incluido registra la comprensión de imágenes y PDF. OpenClaw
    resuelve automáticamente las capacidades de medios a partir de la autenticación de Anthropic configurada; no
    se necesita configuración adicional.

    | Property       | Value                |
    | -------------- | -------------------- |
    | Default model  | `claude-opus-4-6`    |
    | Supported input | Images, PDF documents |

    Cuando se adjunta una imagen o un PDF a una conversación, OpenClaw automáticamente
    lo enruta a través del proveedor de comprensión de medios de Anthropic.

  </Accordion>

  <Accordion title="Ventana de contexto de 1M (beta)">
    La ventana de contexto de 1M de Anthropic está restringida por beta. Actívala por modelo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {
              params: { context1m: true },
            },
          },
        },
      },
    }
    ```

    OpenClaw lo asigna a `anthropic-beta: context-1m-2025-08-07` en las solicitudes.

    <Warning>
    Requiere acceso a contexto largo en tu credencial de Anthropic. La autenticación heredada por token (`sk-ant-oat-*`) se rechaza para solicitudes de contexto de 1M; OpenClaw registra una advertencia y vuelve a la ventana de contexto estándar.
    </Warning>

  </Accordion>

  <Accordion title="Contexto de 1M en Claude Opus 4.7">
    `anthropic/claude-opus-4.7` y su variante `claude-cli` tienen una ventana de contexto
    de 1M de forma predeterminada; no se necesita `params.context1m: true`.
  </Accordion>
</AccordionGroup>

## Solución de problemas

<AccordionGroup>
  <Accordion title="Errores 401 / token invalidado de repente">
    La autenticación por token de Anthropic caduca y puede revocarse. Para configuraciones nuevas, usa una clave de API de Anthropic en su lugar.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    La autenticación de Anthropic es **por agente**: los agentes nuevos no heredan las claves del agente principal. Vuelve a ejecutar la incorporación para ese agente (o configura una clave de API en el host de Gateway) y luego verifica con `openclaw models status`.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Ejecuta `openclaw models status` para ver qué perfil de autenticación está activo. Vuelve a ejecutar la incorporación o configura una clave de API para la ruta de ese perfil.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    Revisa `openclaw models status --json` para `auth.unusableProfiles`. Los tiempos de espera por límite de velocidad de Anthropic pueden estar limitados al modelo, por lo que otro modelo Anthropic relacionado puede seguir siendo utilizable. Agrega otro perfil de Anthropic o espera a que termine el tiempo de espera.
  </Accordion>
</AccordionGroup>

<Note>
Más ayuda: [Solución de problemas](/es/help/troubleshooting) y [Preguntas frecuentes](/es/help/faq).
</Note>

## Relacionado

<CardGroup cols={2}>
  <Card title="Selección de modelos" href="/es/concepts/model-providers" icon="layers">
    Elegir proveedores, referencias de modelos y comportamiento de conmutación por error.
  </Card>
  <Card title="Backends de CLI" href="/es/gateway/cli-backends" icon="terminal">
    Configuración y detalles de tiempo de ejecución del backend de Claude CLI.
  </Card>
  <Card title="Almacenamiento en caché de prompts" href="/es/reference/prompt-caching" icon="database">
    Cómo funciona el almacenamiento en caché de prompts entre proveedores.
  </Card>
  <Card title="OAuth y autenticación" href="/es/gateway/authentication" icon="key">
    Detalles de autenticación y reglas de reutilización de credenciales.
  </Card>
</CardGroup>
