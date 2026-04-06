---
read_when:
    - Buscar un paso u opción específica del onboarding
    - Automatizar el onboarding con el modo no interactivo
    - Depurar el comportamiento del onboarding
sidebarTitle: Onboarding Reference
summary: 'Referencia completa del onboarding de CLI: cada paso, opción y campo de configuración'
title: Referencia de onboarding
x-i18n:
    generated_at: "2026-04-06T03:11:53Z"
    model: gpt-5.4
    provider: openai
    source_hash: e02a4da4a39ba335199095723f5d3b423671eb12efc2d9e4f9e48c1e8ee18419
    source_path: reference/wizard.md
    workflow: 15
---

# Referencia de onboarding

Esta es la referencia completa de `openclaw onboard`.
Para una descripción general de alto nivel, consulta [Onboarding (CLI)](/es/start/wizard).

## Detalles del flujo (modo local)

<Steps>
  <Step title="Detección de configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, elige **Keep / Modify / Reset**.
    - Volver a ejecutar el onboarding **no** borra nada a menos que elijas explícitamente **Reset**
      (o pases `--reset`).
    - `--reset` en la CLI usa por defecto `config+creds+sessions`; usa `--reset-scope full`
      para eliminar también el espacio de trabajo.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y te pide
      que ejecutes `openclaw doctor` antes de continuar.
    - El restablecimiento usa `trash` (nunca `rm`) y ofrece alcances:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el espacio de trabajo)
  </Step>
  <Step title="Modelo/Auth">
    - **Clave API de Anthropic**: usa `ANTHROPIC_API_KEY` si está presente o solicita una clave, luego la guarda para uso del daemon.
    - **Clave API de Anthropic**: opción preferida del asistente de Anthropic en onboarding/configure.
    - **Token de configuración de Anthropic (heredado/manual)**: vuelve a estar disponible en onboarding/configure, pero Anthropic indicó a los usuarios de OpenClaw que la ruta de inicio de sesión de Claude de OpenClaw cuenta como uso de arnés de terceros y requiere **Extra Usage** en la cuenta de Claude.
    - **Suscripción OpenAI Code (Codex) (Codex CLI)**: si existe `~/.codex/auth.json`, el onboarding puede reutilizarlo. Las credenciales reutilizadas de Codex CLI siguen siendo administradas por Codex CLI; cuando caducan, OpenClaw vuelve a leer primero esa fuente y, cuando el proveedor puede renovarlas, escribe la credencial renovada de vuelta en el almacenamiento de Codex en lugar de asumir su propiedad.
    - **Suscripción OpenAI Code (Codex) (OAuth)**: flujo en navegador; pega `code#state`.
      - Establece `agents.defaults.model` en `openai-codex/gpt-5.4` cuando el modelo no está configurado o es `openai/*`.
    - **Clave API de OpenAI**: usa `OPENAI_API_KEY` si está presente o solicita una clave, luego la almacena en perfiles de autenticación.
      - Establece `agents.defaults.model` en `openai/gpt-5.4` cuando el modelo no está configurado, es `openai/*` o `openai-codex/*`.
    - **Clave API de xAI (Grok)**: solicita `XAI_API_KEY` y configura xAI como proveedor de modelos.
    - **OpenCode**: solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`, consíguela en https://opencode.ai/auth) y te permite elegir el catálogo Zen o Go.
    - **Ollama**: solicita la URL base de Ollama, ofrece el modo **Cloud + Local** o **Local**, detecta los modelos disponibles y descarga automáticamente el modelo local seleccionado cuando es necesario.
    - Más detalles: [Ollama](/es/providers/ollama)
    - **Clave API**: almacena la clave por ti.
    - **Vercel AI Gateway (proxy multimodelo)**: solicita `AI_GATEWAY_API_KEY`.
    - Más detalles: [Vercel AI Gateway](/es/providers/vercel-ai-gateway)
    - **Cloudflare AI Gateway**: solicita el ID de cuenta, el ID de gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    - Más detalles: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway)
    - **MiniMax**: la configuración se escribe automáticamente; el valor alojado predeterminado es `MiniMax-M2.7`.
      La configuración con clave API usa `minimax/...`, y la configuración OAuth usa
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
    - **Omitir**: aún no se configura ninguna autenticación.
    - Elige un modelo predeterminado entre las opciones detectadas (o introduce manualmente provider/model). Para obtener la mejor calidad y un menor riesgo de inyección de prompts, elige el modelo más sólido y de última generación disponible en tu conjunto de proveedores.
    - El onboarding ejecuta una comprobación del modelo y avisa si el modelo configurado es desconocido o le falta autenticación.
    - El modo de almacenamiento de claves API usa por defecto valores de perfil de autenticación en texto plano. Usa `--secret-input-mode ref` para almacenar en su lugar referencias respaldadas por variables de entorno (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`).
    - Los perfiles de autenticación viven en `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` (claves API + OAuth). `~/.openclaw/credentials/oauth.json` es heredado y solo para importación.
    - Más detalles: [/concepts/oauth](/es/concepts/oauth)
    <Note>
    Consejo para entornos sin interfaz o servidores: completa OAuth en una máquina con navegador, luego copia
    el `auth-profiles.json` de ese agente (por ejemplo
    `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta correspondiente
    `$OPENCLAW_STATE_DIR/...`) al host del gateway. `credentials/oauth.json`
    es solo una fuente heredada de importación.
    </Note>
  </Step>
  <Step title="Espacio de trabajo">
    - Predeterminado: `~/.openclaw/workspace` (configurable).
    - Inicializa los archivos del espacio de trabajo necesarios para el ritual de arranque del agente.
    - Diseño completo del espacio de trabajo + guía de copias de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)
  </Step>
  <Step title="Gateway">
    - Puerto, bind, modo de autenticación, exposición en tailscale.
    - Recomendación de autenticación: mantén **Token** incluso para loopback para que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/almacenar token en texto plano** (predeterminado)
      - **Usar SecretRef** (opcional)
      - El inicio rápido reutiliza los SecretRef existentes de `gateway.auth.token` en proveedores `env`, `file` y `exec` para el sondeo de onboarding y el arranque del panel.
      - Si ese SecretRef está configurado pero no se puede resolver, el onboarding falla temprano con un mensaje claro de corrección en lugar de degradar silenciosamente la autenticación del runtime.
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto plano o SecretRef.
    - Ruta de SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de onboarding.
      - No puede combinarse con `--gateway-token`.
    - Desactiva la autenticación solo si confías plenamente en todos los procesos locales.
    - Los bind que no son loopback siguen requiriendo autenticación.
  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión por QR opcional.
    - [Telegram](/es/channels/telegram): token de bot.
    - [Discord](/es/channels/discord): token de bot.
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia del webhook.
    - [Mattermost](/es/channels/mattermost) (plugin): token de bot + URL base.
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta.
    - [BlueBubbles](/es/channels/bluebubbles): **recomendado para iMessage**; URL del servidor + contraseña + webhook.
    - [iMessage](/es/channels/imessage): ruta heredada de CLI `imsg` + acceso a BD.
    - Seguridad de DM: el valor predeterminado es vinculación. El primer DM envía un código; apruébalo mediante `openclaw pairing approve <channel> <code>` o usa listas de permitidos.
  </Step>
  <Step title="Búsqueda web">
    - Elige un proveedor compatible como Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG o Tavily (u omítelo).
    - Los proveedores respaldados por API pueden usar variables de entorno o configuración existente para una configuración rápida; los proveedores sin clave usan sus requisitos previos específicos.
    - Omite con `--skip-search`.
    - Configura más tarde: `openclaw configure --section web`.
  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para entornos sin interfaz, usa un LaunchDaemon personalizado (no incluido).
    - Linux (y Windows mediante WSL2): unidad systemd de usuario
      - El onboarding intenta habilitar lingering mediante `loginctl enable-linger <user>` para que el Gateway siga activo después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - **Selección de runtime:** Node (recomendado; obligatorio para WhatsApp/Telegram). Bun **no se recomienda**.
    - Si la autenticación por token requiere un token y `gateway.auth.token` está administrado por SecretRef, la instalación del daemon lo valida pero no persiste los valores de token resueltos en texto plano dentro de los metadatos del entorno del servicio supervisor.
    - Si la autenticación por token requiere un token y el SecretRef de token configurado no se puede resolver, se bloquea la instalación del daemon con orientación práctica.
    - Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no lo está, se bloquea la instalación del daemon hasta que el modo se establezca explícitamente.
  </Step>
  <Step title="Comprobación de estado">
    - Inicia el Gateway (si es necesario) y ejecuta `openclaw health`.
    - Consejo: `openclaw status --deep` añade el sondeo en vivo de estado del gateway a la salida de estado, incluidos sondeos de canales cuando están disponibles (requiere un gateway accesible).
  </Step>
  <Step title="Skills (recomendado)">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Te permite elegir un gestor de Node: **npm / pnpm** (bun no se recomienda).
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).
  </Step>
  <Step title="Finalizar">
    - Resumen + pasos siguientes, incluidas apps de iOS/Android/macOS para funciones adicionales.
  </Step>
</Steps>

<Note>
Si no se detecta ninguna GUI, el onboarding imprime instrucciones de reenvío de puertos SSH para la UI de control en lugar de abrir un navegador.
Si faltan los recursos de la UI de control, el onboarding intenta compilarlos; el fallback es `pnpm ui:build` (instala automáticamente las dependencias de la UI).
</Note>

## Modo no interactivo

Usa `--non-interactive` para automatizar o crear scripts de onboarding:

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

Añade `--json` para obtener un resumen legible por máquina.

SecretRef del token del gateway en modo no interactivo:

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

Los ejemplos de comandos específicos de proveedor están en [Automatización de CLI](/es/start/wizard-cli-automation#provider-specific-examples).
Usa esta página de referencia para la semántica de opciones y el orden de los pasos.

### Añadir agente (modo no interactivo)

```bash
openclaw agents add work \
  --workspace ~/.openclaw/workspace-work \
  --model openai/gpt-5.4 \
  --bind whatsapp:biz \
  --non-interactive \
  --json
```

## RPC del asistente de gateway

El Gateway expone el flujo de onboarding mediante RPC (`wizard.start`, `wizard.next`, `wizard.cancel`, `wizard.status`).
Los clientes (app de macOS, UI de control) pueden renderizar pasos sin volver a implementar la lógica de onboarding.

## Configuración de Signal (signal-cli)

El onboarding puede instalar `signal-cli` desde los lanzamientos de GitHub:

- Descarga el recurso de lanzamiento adecuado.
- Lo almacena en `~/.openclaw/tools/signal-cli/<version>/`.
- Escribe `channels.signal.cliPath` en tu configuración.

Notas:

- Las compilaciones JVM requieren **Java 21**.
- Se usan compilaciones nativas cuando están disponibles.
- Windows usa WSL2; la instalación de signal-cli sigue el flujo de Linux dentro de WSL.

## Lo que escribe el asistente

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si se eligió Minimax)
- `tools.profile` (el onboarding local usa por defecto `"coding"` cuando no está establecido; los valores explícitos existentes se conservan)
- `gateway.*` (modo, bind, auth, tailscale)
- `session.dmScope` (detalles del comportamiento: [Referencia de configuración de CLI](/es/start/wizard-cli-reference#outputs-and-internals))
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Slack/Discord/Matrix/Microsoft Teams) cuando optas por ellas durante los prompts (los nombres se resuelven a IDs cuando es posible).
- `skills.install.nodeManager`
  - `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual todavía puede usar `yarn` estableciendo `skills.install.nodeManager` directamente.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp van en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

Algunos canales se entregan como plugins. Cuando eliges uno durante la configuración, el onboarding
te pedirá instalarlo (npm o una ruta local) antes de poder configurarlo.

## Documentación relacionada

- Resumen del onboarding: [Onboarding (CLI)](/es/start/wizard)
- Onboarding de la app de macOS: [Onboarding](/es/start/onboarding)
- Referencia de configuración: [Configuración del gateway](/es/gateway/configuration)
- Proveedores: [WhatsApp](/es/channels/whatsapp), [Telegram](/es/channels/telegram), [Discord](/es/channels/discord), [Google Chat](/es/channels/googlechat), [Signal](/es/channels/signal), [BlueBubbles](/es/channels/bluebubbles) (iMessage), [iMessage](/es/channels/imessage) (heredado)
- Skills: [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config)
