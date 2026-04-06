---
read_when:
    - Necesitas el comportamiento detallado de `openclaw onboard`
    - Estás depurando resultados de incorporación o integrando clientes de incorporación
sidebarTitle: CLI reference
summary: Referencia completa del flujo de configuración por CLI, configuración de autenticación/modelo, salidas e internos
title: Referencia de configuración por CLI
x-i18n:
    generated_at: "2026-04-06T03:12:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: 92f379b34a2b48c68335dae4f759117c770f018ec51b275f4f40421c6b3abb23
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

# Referencia de configuración por CLI

Esta página es la referencia completa de `openclaw onboard`.
Para la guía breve, consulta [Onboarding (CLI)](/es/start/wizard).

## Qué hace el asistente

El modo local (predeterminado) te guía a través de:

- Configuración de modelo y autenticación (OAuth de suscripción a OpenAI Code, Claude CLI o clave API de Anthropic, además de opciones de MiniMax, GLM, Ollama, Moonshot, StepFun y AI Gateway)
- Ubicación del workspace y archivos de bootstrap
- Configuración del gateway (puerto, bind, autenticación, tailscale)
- Canales y proveedores (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles y otros plugins de canal integrados)
- Instalación del daemon (LaunchAgent, unidad de usuario systemd o Scheduled Task nativa de Windows con respaldo en la carpeta Startup)
- Comprobación de estado
- Configuración de Skills

El modo remoto configura esta máquina para conectarse a un gateway en otro lugar.
No instala ni modifica nada en el host remoto.

## Detalles del flujo local

<Steps>
  <Step title="Detección de configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, elige entre Conservar, Modificar o Restablecer.
    - Volver a ejecutar el asistente no borra nada salvo que elijas explícitamente Restablecer (o pases `--reset`).
    - `--reset` en la CLI usa por defecto `config+creds+sessions`; usa `--reset-scope full` para eliminar también el workspace.
    - Si la configuración es inválida o contiene claves heredadas, el asistente se detiene y te pide que ejecutes `openclaw doctor` antes de continuar.
    - El restablecimiento usa `trash` y ofrece alcances:
      - Solo configuración
      - Configuración + credenciales + sesiones
      - Restablecimiento completo (también elimina el workspace)
  </Step>
  <Step title="Modelo y autenticación">
    - La matriz completa de opciones está en [Opciones de autenticación y modelo](#opciones-de-autenticacion-y-modelo).
  </Step>
  <Step title="Workspace">
    - Predeterminado `~/.openclaw/workspace` (configurable).
    - Inicializa los archivos del workspace necesarios para el ritual de bootstrap de la primera ejecución.
    - Diseño del workspace: [Workspace del agente](/es/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Solicita puerto, bind, modo de autenticación y exposición por tailscale.
    - Recomendado: mantener habilitada la autenticación por token incluso para loopback para que los clientes WS locales deban autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/almacenar token en texto plano** (predeterminado)
      - **Usar SecretRef** (opcional)
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto plano o SecretRef.
    - Ruta SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de incorporación.
      - No puede combinarse con `--gateway-token`.
    - Deshabilita la autenticación solo si confías por completo en todos los procesos locales.
    - Los binds que no son loopback siguen requiriendo autenticación.
  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión opcional con QR
    - [Telegram](/es/channels/telegram): token de bot
    - [Discord](/es/channels/discord): token de bot
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia del webhook
    - [Mattermost](/es/channels/mattermost): token de bot + URL base
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta
    - [BlueBubbles](/es/channels/bluebubbles): recomendado para iMessage; URL del servidor + contraseña + webhook
    - [iMessage](/es/channels/imessage): ruta heredada de CLI `imsg` + acceso a BD
    - Seguridad de mensajes directos: el valor predeterminado es emparejamiento. El primer mensaje directo envía un código; apruébalo con
      `openclaw pairing approve <channel> <code>` o usa listas permitidas.
  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para modo headless, usa un LaunchDaemon personalizado (no incluido).
    - Linux y Windows mediante WSL2: unidad de usuario systemd
      - El asistente intenta `loginctl enable-linger <user>` para que el gateway siga activo después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero Scheduled Task
      - Si se deniega la creación de la tarea, OpenClaw recurre a un elemento de inicio de sesión por usuario en la carpeta Startup e inicia el gateway inmediatamente.
      - Scheduled Tasks siguen siendo preferibles porque proporcionan mejor estado del supervisor.
    - Selección de tiempo de ejecución: Node (recomendado; obligatorio para WhatsApp y Telegram). Bun no es recomendable.
  </Step>
  <Step title="Comprobación de estado">
    - Inicia el gateway (si es necesario) y ejecuta `openclaw health`.
    - `openclaw status --deep` añade el sondeo de estado del gateway en vivo a la salida de estado, incluidos sondeos de canales cuando se admiten.
  </Step>
  <Step title="Skills">
    - Lee las Skills disponibles y comprueba los requisitos.
    - Te permite elegir el administrador de Node: npm, pnpm o bun.
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).
  </Step>
  <Step title="Finalizar">
    - Resumen y próximos pasos, incluidas opciones para las apps de iOS, Android y macOS.
  </Step>
</Steps>

<Note>
Si no se detecta ninguna GUI, el asistente muestra instrucciones de reenvío de puertos SSH para la Control UI en lugar de abrir un navegador.
Si faltan los recursos de la Control UI, el asistente intenta compilarlos; el respaldo es `pnpm ui:build` (instala automáticamente las dependencias de la UI).
</Note>

## Detalles del modo remoto

El modo remoto configura esta máquina para conectarse a un gateway en otro lugar.

<Info>
El modo remoto no instala ni modifica nada en el host remoto.
</Info>

Qué configuras:

- URL del gateway remoto (`ws://...`)
- Token si el gateway remoto requiere autenticación (recomendado)

<Note>
- Si el gateway es solo loopback, usa túneles SSH o una tailnet.
- Sugerencias de descubrimiento:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opciones de autenticación y modelo

<AccordionGroup>
  <Accordion title="Clave API de Anthropic">
    Usa `ANTHROPIC_API_KEY` si está presente o solicita una clave, y luego la guarda para uso del daemon.
  </Accordion>
  <Accordion title="Suscripción a OpenAI Code (reutilización de Codex CLI)">
    Si existe `~/.codex/auth.json`, el asistente puede reutilizarlo.
    Las credenciales reutilizadas de Codex CLI siguen siendo administradas por Codex CLI; cuando caducan, OpenClaw
    vuelve a leer primero esa fuente y, cuando el proveedor puede actualizarlas, escribe
    la credencial actualizada de vuelta en el almacenamiento de Codex en lugar de asumir la propiedad
    por sí mismo.
  </Accordion>
  <Accordion title="Suscripción a OpenAI Code (OAuth)">
    Flujo en navegador; pega `code#state`.

    Establece `agents.defaults.model` en `openai-codex/gpt-5.4` cuando el modelo no está establecido o es `openai/*`.

  </Accordion>
  <Accordion title="Clave API de OpenAI">
    Usa `OPENAI_API_KEY` si está presente o solicita una clave, y luego almacena la credencial en los perfiles de autenticación.

    Establece `agents.defaults.model` en `openai/gpt-5.4` cuando el modelo no está establecido, es `openai/*` o `openai-codex/*`.

  </Accordion>
  <Accordion title="Clave API de xAI (Grok)">
    Solicita `XAI_API_KEY` y configura xAI como proveedor de modelos.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) y te permite elegir el catálogo Zen o Go.
    URL de configuración: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="Clave API (genérica)">
    Almacena la clave por ti.
  </Accordion>
  <Accordion title="Vercel AI Gateway">
    Solicita `AI_GATEWAY_API_KEY`.
    Más detalles: [Vercel AI Gateway](/es/providers/vercel-ai-gateway).
  </Accordion>
  <Accordion title="Cloudflare AI Gateway">
    Solicita ID de cuenta, ID de gateway y `CLOUDFLARE_AI_GATEWAY_API_KEY`.
    Más detalles: [Cloudflare AI Gateway](/es/providers/cloudflare-ai-gateway).
  </Accordion>
  <Accordion title="MiniMax">
    La configuración se escribe automáticamente. El valor alojado predeterminado es `MiniMax-M2.7`; la configuración con clave API usa
    `minimax/...`, y la configuración con OAuth usa `minimax-portal/...`.
    Más detalles: [MiniMax](/es/providers/minimax).
  </Accordion>
  <Accordion title="StepFun">
    La configuración se escribe automáticamente para StepFun estándar o Step Plan en endpoints de China o globales.
    Actualmente Standard incluye `step-3.5-flash`, y Step Plan también incluye `step-3.5-flash-2603`.
    Más detalles: [StepFun](/es/providers/stepfun).
  </Accordion>
  <Accordion title="Synthetic (compatible con Anthropic)">
    Solicita `SYNTHETIC_API_KEY`.
    Más detalles: [Synthetic](/es/providers/synthetic).
  </Accordion>
  <Accordion title="Ollama (Cloud y modelos abiertos locales)">
    Solicita la URL base (predeterminada `http://127.0.0.1:11434`), luego ofrece modo Cloud + Local o Local.
    Detecta los modelos disponibles y sugiere valores predeterminados.
    Más detalles: [Ollama](/es/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot y Kimi Coding">
    Las configuraciones de Moonshot (Kimi K2) y Kimi Coding se escriben automáticamente.
    Más detalles: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot).
  </Accordion>
  <Accordion title="Proveedor personalizado">
    Funciona con endpoints compatibles con OpenAI y compatibles con Anthropic.

    La incorporación interactiva admite las mismas opciones de almacenamiento de claves API que otros flujos de claves API de proveedores:
    - **Pegar clave API ahora** (texto plano)
    - **Usar referencia de secreto** (referencia de entorno o referencia de proveedor configurado, con validación previa)

    Flags no interactivos:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; usa como respaldo `CUSTOM_API_KEY`)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; predeterminado `openai`)

  </Accordion>
  <Accordion title="Omitir">
    Deja la autenticación sin configurar.
  </Accordion>
</AccordionGroup>

Comportamiento del modelo:

- Elige el modelo predeterminado de entre las opciones detectadas, o introduce el proveedor y el modelo manualmente.
- Cuando la incorporación comienza desde una opción de autenticación de proveedor, el selector de modelos prioriza
  automáticamente ese proveedor. En Volcengine y BytePlus, la misma preferencia
  también coincide con sus variantes de plan de coding (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ese filtro de proveedor preferido quedara vacío, el selector vuelve al catálogo completo en lugar de mostrar que no hay modelos.
- El asistente ejecuta una comprobación del modelo y avisa si el modelo configurado es desconocido o falta autenticación.

Rutas de credenciales y perfiles:

- Perfiles de autenticación (claves API + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importación heredada de OAuth: `~/.openclaw/credentials/oauth.json`

Modo de almacenamiento de credenciales:

- El comportamiento predeterminado de incorporación persiste las claves API como valores en texto plano en los perfiles de autenticación.
- `--secret-input-mode ref` habilita el modo de referencia en lugar del almacenamiento de claves en texto plano.
  En la configuración interactiva, puedes elegir:
  - referencia de variable de entorno (por ejemplo, `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referencia de proveedor configurado (`file` o `exec`) con alias de proveedor + id
- El modo interactivo de referencia ejecuta una validación previa rápida antes de guardar.
  - Referencias de entorno: valida el nombre de la variable y que el valor no esté vacío en el entorno actual de incorporación.
  - Referencias de proveedor: valida la configuración del proveedor y resuelve el id solicitado.
  - Si la validación previa falla, la incorporación muestra el error y te permite volver a intentarlo.
- En modo no interactivo, `--secret-input-mode ref` solo está respaldado por entorno.
  - Establece la variable de entorno del proveedor en el entorno del proceso de incorporación.
  - Las flags de clave inline (por ejemplo, `--openai-api-key`) requieren que esa variable de entorno esté establecida; de lo contrario, la incorporación falla inmediatamente.
  - Para proveedores personalizados, el modo `ref` no interactivo almacena `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - En ese caso de proveedor personalizado, `--custom-api-key` requiere que `CUSTOM_API_KEY` esté establecida; de lo contrario, la incorporación falla inmediatamente.
- Las credenciales de autenticación del gateway admiten opciones de texto plano y SecretRef en la configuración interactiva:
  - Modo token: **Generar/almacenar token en texto plano** (predeterminado) o **Usar SecretRef**.
  - Modo contraseña: texto plano o SecretRef.
- Ruta SecretRef de token no interactiva: `--gateway-token-ref-env <ENV_VAR>`.
- Las configuraciones existentes en texto plano siguen funcionando sin cambios.

<Note>
Consejo para modo headless y servidores: completa OAuth en una máquina con navegador y luego copia
el `auth-profiles.json` de ese agente (por ejemplo
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta correspondiente
`$OPENCLAW_STATE_DIR/...`) al host del gateway. `credentials/oauth.json`
es solo una fuente de importación heredada.
</Note>

## Salidas e internos

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.model` / `models.providers` (si se eligió Minimax)
- `tools.profile` (la incorporación local establece por defecto `"coding"` cuando no está definido; los valores explícitos existentes se conservan)
- `gateway.*` (mode, bind, auth, tailscale)
- `session.dmScope` (la incorporación local lo establece por defecto en `per-channel-peer` cuando no está definido; los valores explícitos existentes se conservan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas permitidas de canales (Slack, Discord, Matrix, Microsoft Teams) cuando eliges esa opción durante los prompts (los nombres se resuelven a IDs cuando es posible)
- `skills.install.nodeManager`
  - La flag `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual aún puede establecer más adelante `skills.install.nodeManager: "yarn"`.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp van en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Algunos canales se distribuyen como plugins. Cuando se seleccionan durante la configuración, el asistente
solicita instalar el plugin (npm o ruta local) antes de configurar el canal.
</Note>

RPC del asistente del gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Los clientes (la app de macOS y la Control UI) pueden renderizar pasos sin volver a implementar la lógica de incorporación.

Comportamiento de la configuración de Signal:

- Descarga el asset de versión correspondiente
- Lo almacena en `~/.openclaw/tools/signal-cli/<version>/`
- Escribe `channels.signal.cliPath` en la configuración
- Las compilaciones de JVM requieren Java 21
- Las compilaciones nativas se usan cuando están disponibles
- Windows usa WSL2 y sigue el flujo de Linux para signal-cli dentro de WSL

## Documentación relacionada

- Centro de incorporación: [Onboarding (CLI)](/es/start/wizard)
- Automatización y scripts: [Automatización de CLI](/es/start/wizard-cli-automation)
- Referencia de comandos: [`openclaw onboard`](/cli/onboard)
