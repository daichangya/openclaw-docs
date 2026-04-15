---
read_when:
    - Buscando un paso o indicador específico de la incorporación
    - Automatización de la incorporación con el modo no interactivo
    - Depuración del comportamiento de la incorporación
sidebarTitle: Onboarding Reference
summary: 'Referencia completa para la incorporación en la CLI: cada paso, indicador y campo de configuración'
title: Referencia de incorporación
x-i18n:
    generated_at: "2026-04-15T14:40:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1db3ff789422617634e6624f9d12c18b6a6c573721226b9c0fa6f6b7956ef33d
    source_path: reference/wizard.md
    workflow: 15
---

# Referencia de incorporación

Esta es la referencia completa de `openclaw onboard`.
Para una visión general de alto nivel, consulta [Incorporación (CLI)](/es/start/wizard).

## Detalles del flujo (modo local)

<Steps>
  <Step title="Detección de configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, elige **Conservar / Modificar / Restablecer**.
    - Volver a ejecutar la incorporación **no** borra nada a menos que elijas explícitamente **Restablecer**
      (o pases `--reset`).
    - El valor predeterminado de CLI `--reset` es `config+creds+sessions`; usa `--reset-scope full`
      para eliminar también el espacio de trabajo.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y te pide
      que ejecutes `openclaw doctor` antes de continuar.
    - El restablecimiento usa `trash` (nunca `rm`) y ofrece estos alcances:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el espacio de trabajo)
  </Step>
  <Step title="Modelo/Autenticación">
    - **Clave de API de Anthropic**: usa `ANTHROPIC_API_KEY` si está presente o solicita una clave, luego la guarda para uso del daemon.
    - **Clave de API de Anthropic**: opción preferida de asistente Anthropic en incorporación/configuración.
    - **Token de configuración de Anthropic**: sigue disponible en incorporación/configuración, aunque OpenClaw ahora prefiere reutilizar Claude CLI cuando está disponible.
    - **Suscripción a OpenAI Code (Codex) (Codex CLI)**: si existe `~/.codex/auth.json`, la incorporación puede reutilizarla. Las credenciales reutilizadas de Codex CLI siguen gestionadas por Codex CLI; al expirar, OpenClaw vuelve a leer primero esa fuente y, cuando el proveedor puede actualizarlas, escribe la credencial actualizada de vuelta en el almacenamiento de Codex en lugar de asumir su control.
    - **Suscripción a OpenAI Code (Codex) (OAuth)**: flujo en el navegador; pega el `code#state`.
      - Establece `agents.defaults.model` en `openai-codex/gpt-5.4` cuando el modelo no está configurado o es `openai/*`.
    - **Clave de API de OpenAI**: usa `OPENAI_API_KEY` si está presente o solicita una clave, luego la almacena en perfiles de autenticación.
      - Establece `agents.defaults.model` en `openai/gpt-5.4` cuando el modelo no está configurado, es `openai/*` o `openai-codex/*`.
    - **Clave de API de xAI (Grok)**: solicita `XAI_API_KEY` y configura xAI como proveedor de modelos.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, consíguela en https://opencode.ai/auth) y te permite elegir el catálogo Zen o Go.
    - **Ollama**: primero ofrece **Cloud + Local**, **Solo Cloud** o **Solo Local**. `Solo Cloud` solicita `OLLAMA_API_KEY` y usa `https://ollama.com`; los modos respaldados por host solicitan la URL base de Ollama, detectan los modelos disponibles y descargan automáticamente el modelo local seleccionado cuando es necesario; `Cloud + Local` también comprueba si ese host de Ollama ha iniciado sesión para acceso cloud.
    - Más detalles: [Ollama](/es/providers/ollama)
    - **Clave de API**: almacena la clave por ti.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Más detalles: [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita Account ID, Gateway ID y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Más detalles: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configuración se escribe automáticamente; el valor hospedado predeterminado es `MiniMax-M2.7`.
      La configuración con clave de API usa `minimax/...`, y la configuración con OAuth usa
      `minimax-portal/...`.
    - Más detalles: [MiniMax](/es/providers/minimax)
    - **StepFun**: la configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    - Actualmente, Standard incluye `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    - Más detalles: [StepFun](/es/providers/stepfun)
    - **Synthetic (compatible con Anthropic)**: solicita `SYNTHETIC_API_KEY`.
    - Más detalles: [Synthetic](/es/providers/synthetic)
    - **Moonshot (Kimi K2)**: la configuración se escribe automáticamente.
    - **Kimi Coding**: la configuración se escribe automáticamente.
    - Más detalles: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot)
    - **Omitir**: todavía no se configura autenticación.
    - Elige un modelo predeterminado entre las opciones detectadas (o introduce manualmente provider/model). Para obtener la mejor calidad y reducir el riesgo de inyección de prompts, elige el modelo más potente y de última generación disponible en tu pila de proveedores.
    - La incorporación ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o si falta autenticación.
    - El modo de almacenamiento de claves de API usa por defecto valores de perfil de autenticación en texto sin formato. Usa `--secret-input-mode ref` para almacenar en su lugar referencias respaldadas por variables de entorno (por ejemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Los perfiles de autenticación viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (claves de API + OAuth). `~/.openclaw/credentials/oauth.json` es heredado y solo se usa para importación.
    - Más detalles: [/concepts/oauth](/es/concepts/oauth)
    <Note>
    Consejo para entornos sin interfaz/servidor: completa OAuth en una máquina con navegador y luego copia
    el `auth-profiles.json` de ese agente (por ejemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta equivalente
    `$OPENCLAW_STATE_DIR/...`) al host del Gateway. `credentials/oauth.json`
    es solo una fuente heredada de importación.
    </Note>
  </Step>
  <Step title="Espacio de trabajo">
    - Valor predeterminado `~/.openclaw/workspace` (configurable).
    - Inicializa los archivos del espacio de trabajo necesarios para el ritual de arranque del agente.
    - Diseño completo del espacio de trabajo + guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Puerto, bind, modo de autenticación, exposición por Tailscale.
    - Recomendación de autenticación: mantén **Token** incluso para loopback para que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/almacenar token en texto sin formato** (predeterminado)
      - **Usar SecretRef** (optativo)
      - Quickstart reutiliza los SecretRef existentes de `gateway.auth.token` en proveedores `env`, `file` y `exec` para la sonda de incorporación y el arranque del panel.
      - Si ese SecretRef está configurado pero no puede resolverse, la incorporación falla de forma temprana con un mensaje claro de corrección en lugar de degradar silenciosamente la autenticación en tiempo de ejecución.
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto sin formato o con SecretRef.
    - Ruta no interactiva de SecretRef para token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No puede combinarse con `--gateway-token`.
    - Desactiva la autenticación solo si confías plenamente en todos los procesos locales.
    - Los binds no loopback siguen requiriendo autenticación.
  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión opcional mediante QR.
    - [Telegram](/es/channels/telegram): token de bot.
    - [Discord](/es/channels/discord): token de bot.
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia del Webhook.
    - [Mattermost](/es/channels/mattermost) (Plugin): token de bot + URL base.
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta.
    - [BlueBubbles](/es/channels/bluebubbles): **recomendado para iMessage**; URL del servidor + contraseña + Webhook.
    - [iMessage](/es/channels/imessage): ruta heredada de CLI `imsg` + acceso a la base de datos.
    - Seguridad de DM: el valor predeterminado es el emparejamiento. El primer DM envía un código; apruébalo con `openclaw pairing approve <channel> <code>` o usa listas de permitidos.
  </Step>
  <Step title="Búsqueda web">
    - Elige un proveedor compatible como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (u omítelo).
    - Los proveedores con API pueden usar variables de entorno o configuración existente para una configuración rápida; los proveedores sin clave usan sus requisitos específicos del proveedor.
    - Omite con `--skip-search`.
    - Configura después: `openclaw configure --section web`.
  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para entornos sin interfaz, usa un LaunchDaemon personalizado (no incluido).
    - Linux (y Windows mediante WSL2): unidad de usuario systemd
      - La incorporación intenta habilitar lingering mediante `loginctl enable-linger <user>` para que el Gateway siga activo después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - **Selección de runtime:** Node (recomendado; obligatorio para WhatsApp/Telegram). Bun **no está recomendado**.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación del daemon lo valida pero no persiste valores resueltos de token en texto sin formato en los metadatos del entorno del servicio supervisor.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no está resuelto, se bloquea la instalación del daemon con instrucciones prácticas.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no lo está, la instalación del daemon se bloquea hasta que el modo se configure explícitamente.
  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - Consejo: `openclaw status --deep` añade la sonda de estado del Gateway en vivo a la salida de estado, incluidas las sondas de canales cuando están disponibles (requiere un Gateway accesible).
  </Step>
  <Step title="Skills (recomendado)">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Te permite elegir un gestor de Node: **npm / pnpm** (bun no recomendado).
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).
  </Step>
  <Step title="Finalizar">
    - Resumen + pasos siguientes, incluidas apps de iOS/Android/macOS para funciones adicionales.
  </Step>
</Steps>

<Note>
Si no se detecta ninguna GUI, la incorporación imprime instrucciones de reenvío de puertos SSH para la Control UI en lugar de abrir un navegador.
Si faltan los recursos de la Control UI, la incorporación intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la UI).
</Note>

## Modo no interactivo

Usa `--non-interactive` para automatizar o crear scripts de incorporación:

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice apiKey \
  --anthropic-api-key "$ANTHROPIC_API_KEY" \
  --gateway-port 18789 \
  --gateway-bind loopback \
  --install-daemon \
  --daemon-runtime node \
  --skip-skills
```

Añade `--json` para obtener un resumen legible por máquinas.

SecretRef de token del Gateway en modo no interactivo:

```bash
export OPENCLAW_GATEWAY_TOKEN="your-token"
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice skip \
  --gateway-auth token \
  --gateway-token-ref-env OPENCLAW_GATEWAY_TOKEN
```

`--gateway-token` y `--gateway-token-ref-env` son mutuamente excluyentes.

<Note>
`--json` **no** implica modo no interactivo. Usa `--non-interactive` (y `--workspace`) para scripts.
</Note>

Los ejemplos de comandos específicos por proveedor están en [Automatización de la CLI](/es/start/wizard-cli-automation#provider-specific-examples).
Usa esta página de referencia para la semántica de los indicadores y el orden de los pasos.

### Agregar agente (modo no interactivo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC del asistente de Gateway

El Gateway expone el flujo de incorporación por RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Los clientes (app de macOS, Control UI) pueden representar los pasos sin volver a implementar la lógica de incorporación.

## Configuración de Signal (`signal-cli`)

La incorporación puede instalar `signal-cli` desde versiones de GitHub:

- Descarga el recurso de la versión adecuado.
- Lo almacena en `~/.openclaw/tools/signal-cli/<version>/`.
- Escribe `channels.signal.cliPath` en tu configuración.

Notas:

- Las compilaciones JVM requieren **Java 21**.
- Las compilaciones nativas se usan cuando están disponibles.
- Windows usa WSL2; la instalación de signal-cli sigue el flujo de Linux dentro de WSL.

## Lo que escribe el asistente

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si se elige MiniMax)
- `tools.profile` (la incorporación local usa por defecto `"coding"` cuando no está configurado; los valores explícitos existentes se conservan)
- `gateway.*` (modo, bind, autenticación, tailscale)
- `session.dmScope` (detalles del comportamiento: [Referencia de configuración de la CLI](/es/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Slack/Discord/Matrix/Microsoft Teams) cuando optas por ellas durante los prompts (los nombres se resuelven a ID cuando es posible).
- `skills.install.nodeManager`
  - `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual todavía puede usar `yarn` estableciendo `skills.install.nodeManager` directamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp se guardan en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

Algunos canales se entregan como plugins. Cuando eliges uno durante la configuración, la incorporación
te pedirá instalarlo (npm o una ruta local) antes de poder configurarlo.

## Documentación relacionada

- Resumen de incorporación: [Incorporación (CLI)](/es/start/wizard)
- Incorporación en la app de macOS: [Incorporación](/es/start/onboarding)
- Referencia de configuración: [Configuración del Gateway](/es/gateway/configuration)
- Proveedores: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [BlueBubbles](/es/channels/bluebubbles) (iMessage), [iMessage](/es/channels/imessage) (heredado)
- Skills: [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)
