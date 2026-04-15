---
read_when:
    - Necesitas el comportamiento detallado de `openclaw onboard`.
    - Estás depurando resultados de incorporación o integrando clientes de incorporación.
sidebarTitle: CLI reference
summary: Referencia completa del flujo de configuración de la CLI, la configuración de autenticación/modelos, las salidas y los aspectos internos.
title: Referencia de configuración de la CLI
x-i18n:
    generated_at: "2026-04-15T14:40:47Z"
    model: gpt-5.4
    provider: openai
    source_hash: 61ca679caca3b43fa02388294007f89db22d343e49e10b61d8d118cd8fbb7369
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Referencia de configuración de la CLI

Esta página es la referencia completa de `openclaw onboard`.
Para la guía breve, consulta [Onboarding (CLI)](/es/start/wizard).

## Qué hace el asistente

El modo local (predeterminado) te guía por:

- Configuración del modelo y la autenticación (OAuth de suscripción de OpenAI Code, Anthropic Claude CLI o clave de API, además de opciones para MiniMax, GLM, Ollama, Moonshot, StepFun y AI Gateway)
- Ubicación del workspace y archivos de arranque
- Configuración de Gateway (puerto, bind, autenticación, Tailscale)
- Canales y proveedores (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles y otros plugins de canal incluidos)
- Instalación como daemon (LaunchAgent, unidad de usuario de systemd o Scheduled Task nativa de Windows con alternativa en la carpeta de Inicio)
- Comprobación de estado
- Configuración de Skills

El modo remoto configura esta máquina para conectarse a un Gateway en otro lugar.
No instala ni modifica nada en el host remoto.

## Detalles del flujo local

<Steps>
  <Step title="Detección de configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, elige Mantener, Modificar o Restablecer.
    - Volver a ejecutar el asistente no borra nada a menos que elijas explícitamente Restablecer (o pases `--reset`).
    - La CLI `--reset` usa por defecto `config+creds+sessions`; usa `--reset-scope full` para eliminar también el workspace.
    - Si la configuración no es válida o contiene claves heredadas, el asistente se detiene y te pide que ejecutes `openclaw doctor` antes de continuar.
    - El restablecimiento usa `trash` y ofrece estos alcances:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el workspace)
  </Step>
  <Step title="Modelo y autenticación">
    - La matriz completa de opciones está en [Opciones de autenticación y modelo](#auth-and-model-options).
  </Step>
  <Step title="Workspace">
    - Valor predeterminado `~/.openclaw/workspace` (configurable).
    - Inicializa los archivos del workspace necesarios para el ritual de arranque de la primera ejecución.
    - Estructura del workspace: [Agent workspace](/es/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Solicita puerto, bind, modo de autenticación y exposición por Tailscale.
    - Recomendado: mantener habilitada la autenticación por token incluso para loopback, para que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/almacenar token en texto plano** (predeterminado)
      - **Usar SecretRef** (opcional)
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto plano o con SecretRef.
    - Ruta no interactiva de SecretRef para token: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No puede combinarse con `--gateway-token`.
    - Desactiva la autenticación solo si confías plenamente en todos los procesos locales.
    - Los binds que no son loopback siguen requiriendo autenticación.
  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión con QR opcional
    - [Telegram](/es/channels/telegram): token del bot
    - [Discord](/es/channels/discord): token del bot
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia de Webhook
    - [Mattermost](/es/channels/mattermost): token del bot + URL base
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de la cuenta
    - [BlueBubbles](/es/channels/bluebubbles): recomendado para iMessage; URL del servidor + contraseña + Webhook
    - [iMessage](/es/channels/imessage): ruta heredada de la CLI `imsg` + acceso a la base de datos
    - Seguridad en mensajes directos: el valor predeterminado es el emparejamiento. El primer mensaje directo envía un código; apruébalo con
      `openclaw pairing approve <channel> <code>` o usa listas permitidas.
  </Step>
  <Step title="Instalación como daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para entornos sin interfaz, usa un LaunchDaemon personalizado (no incluido).
    - Linux y Windows mediante WSL2: unidad de usuario de systemd
      - El asistente intenta ejecutar `loginctl enable-linger <user>` para que Gateway siga activo después del cierre de sesión.
      - Puede pedir sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero Scheduled Task
      - Si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta de Inicio e inicia Gateway de inmediato.
      - Se siguen prefiriendo las Scheduled Tasks porque ofrecen mejor estado del supervisor.
    - Selección del runtime: Node (recomendado; obligatorio para WhatsApp y Telegram). Bun no se recomienda.
  </Step>
  <Step title="Comprobación de estado">
    - Inicia Gateway (si hace falta) y ejecuta `openclaw health`.
    - `openclaw status --deep` añade la sonda de estado activa de Gateway a la salida de estado, incluidas las sondas de canal cuando son compatibles.
  </Step>
  <Step title="Skills">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Te permite elegir el gestor de Node: npm, pnpm o bun.
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).
  </Step>
  <Step title="Finalizar">
    - Resumen y pasos siguientes, incluidas las opciones de app para iOS, Android y macOS.
  </Step>
</Steps>

<Note>
Si no se detecta ninguna GUI, el asistente imprime instrucciones de reenvío de puertos por SSH para la Control UI en lugar de abrir un navegador.
Si faltan los recursos de la Control UI, el asistente intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la UI).
</Note>

## Detalles del modo remoto

El modo remoto configura esta máquina para conectarse a un Gateway en otro lugar.

<Info>
El modo remoto no instala ni modifica nada en el host remoto.
</Info>

Lo que configuras:

- URL del Gateway remoto (`ws://...`)
- Token si la autenticación del Gateway remoto es obligatoria (recomendado)

<Note>
- Si Gateway solo escucha en loopback, usa túneles SSH o una tailnet.
- Sugerencias de descubrimiento:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opciones de autenticación y modelo

<AccordionGroup>
  <Accordion title="Clave de API de Anthropic">
    Usa `ANTHROPIC_API_KEY` si está presente o solicita una clave, y luego la guarda para usarla con el daemon.
  </Accordion>
  <Accordion title="Suscripción de OpenAI Code (reutilización de Codex CLI)">
    Si existe `~/.codex/auth.json`, el asistente puede reutilizarlo.
    Las credenciales reutilizadas de Codex CLI siguen administradas por Codex CLI; cuando caducan, OpenClaw
    vuelve a leer primero esa fuente y, cuando el proveedor puede renovarlas, escribe
    la credencial renovada de vuelta en el almacenamiento de Codex en lugar de asumir él mismo
    su control.
  </Accordion>
  <Accordion title="Suscripción de OpenAI Code (OAuth)">
    Flujo en navegador; pega `code#state`.

    Establece `agents.defaults.model` en `openai-codex/gpt-5.4` cuando el modelo no está configurado o es `openai/*`.

  </Accordion>
  <Accordion title="Clave de API de OpenAI">
    Usa `OPENAI_API_KEY` si está presente o solicita una clave, y luego almacena la credencial en perfiles de autenticación.

    Establece `agents.defaults.model` en `openai/gpt-5.4` cuando el modelo no está configurado, es `openai/*` o `openai-codex/*`.

  </Accordion>
  <Accordion title="Clave de API de xAI (Grok)">
    Solicita `XAI_API_KEY` y configura xAI como proveedor de modelos.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) y te permite elegir el catálogo Zen o Go.
    URL de configuración: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Clave de API (genérica)">
    Guarda la clave por ti.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Solicita `AI_GATEWAY_API_KEY`.
    Más detalles: [Vercel AI Gateway](/es/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita el ID de cuenta, el ID de Gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Más detalles: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuración se escribe automáticamente. El valor alojado predeterminado es `MiniMax-M2.7`; la configuración con clave de API usa
    `minimax/...`, y la configuración con OAuth usa `minimax-portal/...`.
    Más detalles: [MiniMax](/es/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    Actualmente, Standard incluye `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    Más detalles: [StepFun](/es/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible con Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Más detalles: [Synthetic](/es/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud y modelos abiertos locales)">
    Primero solicita `Cloud + Local`, `Solo Cloud` o `Solo local`.
    `Solo Cloud` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Los modos respaldados por host solicitan la URL base (predeterminada `http://127.0.0.1:11434`), detectan los modelos disponibles y sugieren valores predeterminados.
    `Cloud + Local` también comprueba si ese host de Ollama ha iniciado sesión para acceso en la nube.
    Más detalles: [Ollama](/es/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot y Kimi Coding">
    Las configuraciones de Moonshot (Kimi K2) y Kimi Coding se escriben automáticamente.
    Más detalles: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot).
  </Accordion>
  <Accordion title="Proveedor personalizado">
    Funciona con endpoints compatibles con OpenAI y compatibles con Anthropic.

    La incorporación interactiva admite las mismas opciones de almacenamiento de claves de API que otros flujos de claves de API de proveedores:
    - **Pegar la clave de API ahora** (texto plano)
    - **Usar referencia secreta** (referencia de entorno o referencia de proveedor configurado, con validación previa)

    Indicadores no interactivos:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; recurre a `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; el valor predeterminado es `openai`)

  </Accordion>
  <Accordion title="Omitir">
    Deja la autenticación sin configurar.
  </Accordion>
</AccordionGroup>

Comportamiento del modelo:

- Elige el modelo predeterminado entre las opciones detectadas, o introduce manualmente el proveedor y el modelo.
- Cuando la incorporación comienza desde una opción de autenticación de proveedor, el selector de modelos prioriza
  automáticamente ese proveedor. Para Volcengine y BytePlus, esa misma preferencia
  también coincide con sus variantes de plan de codificación (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ese filtro de proveedor preferido quedara vacío, el selector vuelve
  al catálogo completo en lugar de no mostrar modelos.
- El asistente ejecuta una comprobación del modelo y advierte si el modelo configurado es desconocido o le falta autenticación.

Rutas de credenciales y perfiles:

- Perfiles de autenticación (claves de API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importación heredada de OAuth: `~/.openclaw/credentials/oauth.json`

Modo de almacenamiento de credenciales:

- El comportamiento predeterminado de incorporación guarda las claves de API como valores en texto plano en los perfiles de autenticación.
- `--secret-input-mode ref` habilita el modo de referencia en lugar del almacenamiento de claves en texto plano.
  En la configuración interactiva, puedes elegir cualquiera de estos:
  - referencia a variable de entorno (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referencia a proveedor configurado (`file` o `exec`) con alias e id del proveedor
- El modo de referencia interactivo ejecuta una validación previa rápida antes de guardar.
  - Referencias de entorno: valida el nombre de la variable y que tenga un valor no vacío en el entorno actual de incorporación.
  - Referencias de proveedor: valida la configuración del proveedor y resuelve el id solicitado.
  - Si la validación previa falla, la incorporación muestra el error y te permite reintentar.
- En modo no interactivo, `--secret-input-mode ref` solo se respalda con entorno.
  - Establece la variable de entorno del proveedor en el entorno del proceso de incorporación.
  - Los indicadores de clave en línea (por ejemplo `--openai-api-key`) requieren que esa variable de entorno esté configurada; de lo contrario, la incorporación falla de inmediato.
  - Para proveedores personalizados, el modo no interactivo `ref` almacena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - En ese caso de proveedor personalizado, `--custom-api-key` requiere que `CUSTOM_API_KEY` esté configurada; de lo contrario, la incorporación falla de inmediato.
- Las credenciales de autenticación de Gateway admiten opciones de texto plano y SecretRef en la configuración interactiva:
  - Modo token: **Generar/almacenar token en texto plano** (predeterminado) o **Usar SecretRef**.
  - Modo contraseña: texto plano o SecretRef.
- Ruta no interactiva de SecretRef para token: `--gateway-token-ref-env <ENV_VAR>`.
- Las configuraciones existentes en texto plano siguen funcionando sin cambios.

<Note>
Consejo para entornos sin interfaz y servidores: completa OAuth en una máquina con navegador y luego copia
el `auth-profiles.json` de ese agente (por ejemplo
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta
correspondiente `$OPENCLAW_STATE_DIR/...`) al host del Gateway. `credentials/oauth.json`
es solo una fuente de importación heredada.
</Note>

## Salidas y aspectos internos

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si se eligió Minimax)
- `tools.profile` (la incorporación local usa por defecto `"coding"` cuando no está configurado; los valores explícitos existentes se conservan)
- `gateway.*` (modo, bind, autenticación, Tailscale)
- `session.dmScope` (la incorporación local establece por defecto este valor en `per-channel-peer` cuando no está configurado; los valores explícitos existentes se conservan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas permitidas de canales (Slack, Discord, Matrix, Microsoft Teams) cuando optas por ellas durante los prompts (los nombres se resuelven a IDs cuando es posible)
- `skills.install.nodeManager`
  - El indicador `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual aún puede establecer después `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` escribe en `agents.list[]` y en `bindings` opcionales.

Las credenciales de WhatsApp se guardan en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Algunos canales se entregan como plugins. Cuando se seleccionan durante la configuración, el asistente
solicita instalar el Plugin (npm o ruta local) antes de la configuración del canal.
</Note>

RPC del asistente de Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Los clientes (la app de macOS y la Control UI) pueden renderizar los pasos sin volver a implementar la lógica de incorporación.

Comportamiento de la configuración de Signal:

- Descarga el recurso de la versión correspondiente
- Lo almacena en `~/.openclaw/tools/signal-cli/<version>/`
- Escribe `channels.signal.cliPath` en la configuración
- Las compilaciones JVM requieren Java 21
- Las compilaciones nativas se usan cuando están disponibles
- Windows usa WSL2 y sigue el flujo de `signal-cli` de Linux dentro de WSL

## Documentación relacionada

- Centro de incorporación: [Onboarding (CLI)](/es/start/wizard)
- Automatización y scripts: [CLI Automation](/es/start/wizard-cli-automation)
- Referencia de comandos: [`openclaw onboard`](/cli/onboard)
