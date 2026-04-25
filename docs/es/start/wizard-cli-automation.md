---
read_when:
    - Estás automatizando el onboarding en scripts o CI
    - Necesitas ejemplos no interactivos para proveedores específicos
sidebarTitle: CLI automation
summary: Onboarding con scripts y configuración del agente para la CLI de OpenClaw
title: Automatización de CLI
x-i18n:
    generated_at: "2026-04-25T13:57:10Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4d36801439b9243ea5cc0ab93757dde23d1ecd86c8f5b991541ee14f41bf05ac
    source_path: start/wizard-cli-automation.md
    workflow: 15
---

Usa `--non-interactive` para automatizar `openclaw onboard`.

<Note>
`--json` no implica modo no interactivo. Usa `--non-interactive` (y `--workspace`) para scripts.
</Note>

## Ejemplo base no interactivo

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --secret-input-mode plaintext \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-bootstrap \
  --skip-skills
```

Añade `--json` para obtener un resumen legible por máquina.

Usa `--skip-bootstrap` cuando tu automatización precargue archivos del workspace y no quiera que el onboarding cree los archivos bootstrap predeterminados.

Usa `--secret-input-mode ref` para almacenar referencias respaldadas por variables de entorno en los perfiles de autenticación en lugar de valores en texto plano.
La selección interactiva entre referencias de entorno y referencias de proveedor configuradas (`file` o `exec`) está disponible en el flujo de onboarding.

En modo `ref` no interactivo, las variables de entorno del proveedor deben estar configuradas en el entorno del proceso.
Pasar indicadores de clave en línea sin la variable de entorno correspondiente ahora falla rápidamente.

Ejemplo:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice openai-api-key \
  --secret-input-mode ref \
  --accept-risk
```

## Ejemplos específicos por proveedor

<AccordionGroup>
  <Accordion title="Ejemplo de clave de API de Anthropic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice apiKey \
      --anthropic-api-key "$ANTHROPIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Gemini">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice gemini-api-key \
      --gemini-api-key "$GEMINI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Z.AI">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice zai-api-key \
      --zai-api-key "$ZAI_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Vercel AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ai-gateway-api-key \
      --ai-gateway-api-key "$AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Cloudflare AI Gateway">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice cloudflare-ai-gateway-api-key \
      --cloudflare-ai-gateway-account-id "your-account-id" \
      --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
      --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Moonshot">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice moonshot-api-key \
      --moonshot-api-key "$MOONSHOT_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Mistral">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice mistral-api-key \
      --mistral-api-key "$MISTRAL_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de Synthetic">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice synthetic-api-key \
      --synthetic-api-key "$SYNTHETIC_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de OpenCode">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice opencode-zen \
      --opencode-zen-api-key "$OPENCODE_API_KEY" \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
    Cambia a `--auth-choice opencode-go --opencode-go-api-key "$OPENCODE_API_KEY"` para el catálogo Go.
  </Accordion>
  <Accordion title="Ejemplo de Ollama">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice ollama \
      --custom-model-id "qwen3.5:27b" \
      --accept-risk \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```
  </Accordion>
  <Accordion title="Ejemplo de proveedor personalizado">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --custom-api-key "$CUSTOM_API_KEY" \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    `--custom-api-key` es opcional. Si se omite, el onboarding comprueba `CUSTOM_API_KEY`.

    Variante en modo ref:

    ```bash
    export CUSTOM_API_KEY="your-key"
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice custom-api-key \
      --custom-base-url "https://llm.example.com/v1" \
      --custom-model-id "foo-large" \
      --secret-input-mode ref \
      --custom-provider-id "my-custom" \
      --custom-compatibility anthropic \
      --gateway-port 18789 \
      --gateway-bind loopback
    ```

    En este modo, el onboarding almacena `apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.

  </Accordion>
</AccordionGroup>

El token de configuración de Anthropic sigue disponible como ruta de token de onboarding admitida, pero OpenClaw ahora prefiere reutilizar Claude CLI cuando está disponible.
Para producción, prefiere una clave de API de Anthropic.

## Añadir otro agente

Usa `openclaw agents add <name>` para crear un agente independiente con su propio workspace,
sesiones y perfiles de autenticación. Ejecutarlo sin `--workspace` inicia el asistente.

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

Qué configura:

- `agents.list[].name`
- `agents.list[].workspace`
- `agents.list[].agentDir`

Notas:

- Los workspaces predeterminados siguen el patrón `~/.openclaw/workspace-<agentId>`.
- Añade `bindings` para enrutar mensajes entrantes (el asistente puede hacerlo).
- Indicadores no interactivos: `--model`, `--agent-dir`, `--bind`, `--non-interactive`.

## Documentos relacionados

- Centro de onboarding: [Onboarding (CLI)](/es/start/wizard)
- Referencia completa: [Referencia de configuración de CLI](/es/start/wizard-cli-reference)
- Referencia de comandos: [`openclaw onboard`](/es/cli/onboard)
