---
read_when:
    - Necesitas el comportamiento detallado de `openclaw onboard`
    - Estás depurando resultados de onboarding o integrando clientes de onboarding
sidebarTitle: CLI reference
summary: Referencia completa del flujo de configuración de la CLI, configuración de autenticación/modelo, salidas e internos
title: Referencia de configuración de la CLI
x-i18n:
    generated_at: "2026-04-25T13:57:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 951b8f0b0b6b70faaa6faafad998e74183f79aa8c4c50f622b24df786f1feea7
    source_path: start/wizard-cli-reference.md
    workflow: 15
---

Esta página es la referencia completa de `openclaw onboard`.
Para la guía breve, consulta [Onboarding (CLI)](/es/start/wizard).

## Qué hace el asistente

El modo local (predeterminado) te guía por:

- Configuración de modelo y autenticación (OAuth de suscripción OpenAI Code, Anthropic Claude CLI o API key, además de opciones para MiniMax, GLM, Ollama, Moonshot, StepFun y AI Gateway)
- Ubicación del workspace y archivos de arranque
- Ajustes del Gateway (puerto, bind, autenticación, Tailscale)
- Canales y proveedores (Telegram, WhatsApp, Discord, Google Chat, Mattermost, Signal, BlueBubbles y otros plugins de canal incluidos)
- Instalación del daemon (LaunchAgent, unidad de usuario de systemd o tarea programada nativa de Windows con alternativa de carpeta Startup)
- Verificación de estado
- Configuración de Skills

El modo remoto configura esta máquina para conectarse a un gateway en otro lugar.
No instala ni modifica nada en el host remoto.

## Detalles del flujo local

<Steps>
  <Step title="Detección de configuración existente">
    - Si existe `~/.openclaw/openclaw.json`, elige entre Conservar, Modificar o Restablecer.
    - Volver a ejecutar el asistente no borra nada a menos que elijas explícitamente Restablecer (o pases `--reset`).
    - `--reset` en la CLI usa por defecto `config+creds+sessions`; usa `--reset-scope full` para eliminar también el workspace.
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
    - Predeterminado `~/.openclaw/workspace` (configurable).
    - Inicializa los archivos del workspace necesarios para el ritual de arranque de la primera ejecución.
    - Estructura del workspace: [Workspace del agente](/es/concepts/agent-workspace).
  </Step>
  <Step title="Gateway">
    - Solicita puerto, bind, modo de autenticación y exposición mediante Tailscale.
    - Recomendación: mantén habilitada la autenticación por token incluso para loopback, para que los clientes WS locales tengan que autenticarse.
    - En modo token, la configuración interactiva ofrece:
      - **Generar/almacenar token en texto plano** (predeterminado)
      - **Usar SecretRef** (opcional)
    - En modo contraseña, la configuración interactiva también admite almacenamiento en texto plano o SecretRef.
    - Ruta no interactiva para token SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
      - Requiere una variable de entorno no vacía en el entorno del proceso de onboarding.
      - No puede combinarse con `--gateway-token`.
    - Desactiva la autenticación solo si confías plenamente en todos los procesos locales.
    - Los binds que no sean loopback siguen requiriendo autenticación.
  </Step>
  <Step title="Canales">
    - [WhatsApp](/es/channels/whatsapp): inicio de sesión opcional con QR
    - [Telegram](/es/channels/telegram): token del bot
    - [Discord](/es/channels/discord): token del bot
    - [Google Chat](/es/channels/googlechat): JSON de cuenta de servicio + audiencia de Webhook
    - [Mattermost](/es/channels/mattermost): token del bot + URL base
    - [Signal](/es/channels/signal): instalación opcional de `signal-cli` + configuración de cuenta
    - [BlueBubbles](/es/channels/bluebubbles): recomendado para iMessage; URL del servidor + contraseña + Webhook
    - [iMessage](/es/channels/imessage): ruta heredada de CLI `imsg` + acceso a BD
    - Seguridad de mensajes directos: el valor predeterminado es el emparejamiento. El primer mensaje directo envía un código; apruébalo con
      `openclaw pairing approve <channel> <code>` o usa listas de permitidos.
  </Step>
  <Step title="Instalación del daemon">
    - macOS: LaunchAgent
      - Requiere una sesión de usuario iniciada; para uso sin interfaz, usa un LaunchDaemon personalizado (no incluido).
    - Linux y Windows mediante WSL2: unidad de usuario de systemd
      - El asistente intenta ejecutar `loginctl enable-linger <user>` para que el gateway siga activo después de cerrar sesión.
      - Puede solicitar sudo (escribe en `/var/lib/systemd/linger`); primero lo intenta sin sudo.
    - Windows nativo: primero Tarea programada
      - Si se deniega la creación de la tarea, OpenClaw usa como alternativa un elemento de inicio de sesión por usuario en la carpeta Startup e inicia el gateway de inmediato.
      - Las Tareas programadas siguen siendo preferibles porque proporcionan mejor estado del supervisor.
    - Selección de runtime: Node (recomendado; obligatorio para WhatsApp y Telegram). Bun no se recomienda.
  </Step>
  <Step title="Verificación de estado">
    - Inicia el gateway (si es necesario) y ejecuta `openclaw health`.
    - `openclaw status --deep` añade la sonda de estado del gateway en vivo a la salida de estado, incluidas las sondas de canal cuando se admiten.
  </Step>
  <Step title="Skills">
    - Lee las Skills disponibles y verifica los requisitos.
    - Te permite elegir el gestor de Node: npm, pnpm o bun.
    - Instala dependencias opcionales (algunas usan Homebrew en macOS).
  </Step>
  <Step title="Finalizar">
    - Resumen y pasos siguientes, incluidas las opciones de apps para iOS, Android y macOS.
  </Step>
</Steps>

<Note>
Si no se detecta ninguna GUI, el asistente imprime instrucciones de reenvío de puertos SSH para la UI de Control en lugar de abrir un navegador.
Si faltan los recursos de la UI de Control, el asistente intenta compilarlos; la alternativa es `pnpm ui:build` (instala automáticamente las dependencias de la UI).
</Note>

## Detalles del modo remoto

El modo remoto configura esta máquina para conectarse a un gateway en otro lugar.

<Info>
El modo remoto no instala ni modifica nada en el host remoto.
</Info>

Lo que configuras:

- URL del gateway remoto (`ws://...`)
- Token si el gateway remoto requiere autenticación (recomendado)

<Note>
- Si el gateway solo está disponible en loopback, usa tunelización SSH o una tailnet.
- Sugerencias de detección:
  - macOS: Bonjour (`dns-sd`)
  - Linux: Avahi (`avahi-browse`)
</Note>

## Opciones de autenticación y modelo

<AccordionGroup>
  <Accordion title="API key de Anthropic">
    Usa `ANTHROPIC_API_KEY` si está presente o solicita una clave, y luego la guarda para que la use el daemon.
  </Accordion>
  <Accordion title="Suscripción OpenAI Code (OAuth)">
    Flujo con navegador; pega `code#state`.

    Establece `agents.defaults.model` en `openai-codex/gpt-5.5` cuando el modelo no está definido o ya pertenece a la familia OpenAI.

  </Accordion>
  <Accordion title="Suscripción OpenAI Code (emparejamiento de dispositivo)">
    Flujo de emparejamiento en navegador con un código de dispositivo de corta duración.

    Establece `agents.defaults.model` en `openai-codex/gpt-5.5` cuando el modelo no está definido o ya pertenece a la familia OpenAI.

  </Accordion>
  <Accordion title="API key de OpenAI">
    Usa `OPENAI_API_KEY` si está presente o solicita una clave, y luego guarda la credencial en perfiles de autenticación.

    Establece `agents.defaults.model` en `openai/gpt-5.4` cuando el modelo no está definido, es `openai/*` o `openai-codex/*`.

  </Accordion>
  <Accordion title="API key de xAI (Grok)">
    Solicita `XAI_API_KEY` y configura xAI como proveedor de modelos.
  </Accordion>
  <Accordion title="OpenCode">
    Solicita `OPENCODE_API_KEY` (o `OPENCODE_ZEN_API_KEY`) y te permite elegir el catálogo Zen o Go.
    URL de configuración: [opencode.ai/auth](https://opencode.ai/auth).
  </Accordion>
  <Accordion title="API key (genérica)">
    Guarda la clave por ti.
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
    La configuración se escribe automáticamente. El valor alojado predeterminado es `MiniMax-M2.7`; la configuración con API key usa
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
    Primero solicita `Cloud + Local`, `Solo Cloud` o `Solo Local`.
    `Solo Cloud` usa `OLLAMA_API_KEY` con `https://ollama.com`.
    Los modos respaldados por host solicitan la URL base (predeterminada `http://127.0.0.1:11434`), detectan los modelos disponibles y sugieren valores predeterminados.
    `Cloud + Local` también verifica si ese host de Ollama inició sesión para acceso cloud.
    Más detalles: [Ollama](/es/providers/ollama).
  </Accordion>
  <Accordion title="Moonshot y Kimi Coding">
    Las configuraciones de Moonshot (Kimi K2) y Kimi Coding se escriben automáticamente.
    Más detalles: [Moonshot AI (Kimi + Kimi Coding)](/es/providers/moonshot).
  </Accordion>
  <Accordion title="Proveedor personalizado">
    Funciona con endpoints compatibles con OpenAI y compatibles con Anthropic.

    El onboarding interactivo admite las mismas opciones de almacenamiento de API key que otros flujos de API key de proveedores:
    - **Pegar API key ahora** (texto plano)
    - **Usar referencia de secreto** (referencia de entorno o referencia de proveedor configurado, con validación previa)

    Indicadores no interactivos:
    - `--auth-choice custom-api-key`
    - `--custom-base-url`
    - `--custom-model-id`
    - `--custom-api-key` (opcional; usa `CUSTOM_API_KEY` como alternativa)
    - `--custom-provider-id` (opcional)
    - `--custom-compatibility <openai|anthropic>` (opcional; el valor predeterminado es `openai`)

  </Accordion>
  <Accordion title="Omitir">
    Deja la autenticación sin configurar.
  </Accordion>
</AccordionGroup>

Comportamiento del modelo:

- Elige el modelo predeterminado a partir de las opciones detectadas, o introduce manualmente el proveedor y el modelo.
- Cuando el onboarding comienza a partir de una opción de autenticación de proveedor, el selector de modelos prioriza automáticamente
  ese proveedor. Para Volcengine y BytePlus, la misma preferencia
  también coincide con sus variantes de plan de coding (`volcengine-plan/*`,
  `byteplus-plan/*`).
- Si ese filtro de proveedor preferido quedara vacío, el selector vuelve al catálogo completo en lugar de mostrar que no hay modelos.
- El asistente ejecuta una comprobación de modelo y avisa si el modelo configurado es desconocido o si falta autenticación.

Rutas de credenciales y perfiles:

- Perfiles de autenticación (API keys + OAuth): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Importación heredada de OAuth: `~/.openclaw/credentials/oauth.json`

Modo de almacenamiento de credenciales:

- El comportamiento predeterminado del onboarding guarda las API keys como valores en texto plano en los perfiles de autenticación.
- `--secret-input-mode ref` habilita el modo de referencia en lugar del almacenamiento de claves en texto plano.
  En la configuración interactiva, puedes elegir entre:
  - referencia de variable de entorno (por ejemplo `keyRef: { source: "env", provider: "default", id: "OPENAI_API_KEY" }`)
  - referencia de proveedor configurado (`file` o `exec`) con alias de proveedor + id
- El modo de referencia interactivo ejecuta una validación previa rápida antes de guardar.
  - Referencias de entorno: valida el nombre de la variable y que tenga un valor no vacío en el entorno actual del onboarding.
  - Referencias de proveedor: valida la configuración del proveedor y resuelve el id solicitado.
  - Si la validación previa falla, el onboarding muestra el error y te permite reintentar.
- En modo no interactivo, `--secret-input-mode ref` solo funciona con entorno.
  - Establece la variable de entorno del proveedor en el entorno del proceso de onboarding.
  - Los indicadores de clave en línea (por ejemplo `--openai-api-key`) requieren que esa variable de entorno esté definida; de lo contrario, el onboarding falla de inmediato.
  - Para proveedores personalizados, el modo no interactivo `ref` guarda `models.providers.<id>.apiKey` como `{ source: "env", provider: "default", id: "CUSTOM_API_KEY" }`.
  - En ese caso de proveedor personalizado, `--custom-api-key` requiere que `CUSTOM_API_KEY` esté definida; de lo contrario, el onboarding falla de inmediato.
- Las credenciales de autenticación del Gateway admiten opciones de texto plano y SecretRef en la configuración interactiva:
  - Modo token: **Generar/almacenar token en texto plano** (predeterminado) o **Usar SecretRef**.
  - Modo contraseña: texto plano o SecretRef.
- Ruta no interactiva para token SecretRef: `--gateway-token-ref-env <ENV_VAR>`.
- Las configuraciones existentes en texto plano siguen funcionando sin cambios.

<Note>
Consejo para entornos sin interfaz y servidores: completa OAuth en una máquina con navegador y luego copia
el `auth-profiles.json` de ese agente (por ejemplo
`~/.openclaw/agents/<agentId>/agent/auth-profiles.json`, o la ruta correspondiente
`$OPENCLAW_STATE_DIR/...`) al host del gateway. `credentials/oauth.json`
solo es una fuente heredada de importación.
</Note>

## Salidas e internos

Campos típicos en `~/.openclaw/openclaw.json`:

- `agents.defaults.workspace`
- `agents.defaults.skipBootstrap` cuando se pasa `--skip-bootstrap`
- `agents.defaults.model` / `models.providers` (si se elige MiniMax)
- `tools.profile` (el onboarding local usa `"coding"` por defecto cuando no está definido; los valores explícitos existentes se conservan)
- `gateway.*` (modo, bind, autenticación, Tailscale)
- `session.dmScope` (el onboarding local usa `per-channel-peer` por defecto cuando no está definido; los valores explícitos existentes se conservan)
- `channels.telegram.botToken`, `channels.discord.token`, `channels.matrix.*`, `channels.signal.*`, `channels.imessage.*`
- Listas de permitidos de canales (Slack, Discord, Matrix, Microsoft Teams) cuando optas por ellas durante los prompts (los nombres se resuelven a ID cuando es posible)
- `skills.install.nodeManager`
  - El indicador `setup --node-manager` acepta `npm`, `pnpm` o `bun`.
  - La configuración manual aún puede establecer `skills.install.nodeManager: "yarn"` más adelante.
- `wizard.lastRunAt`
- `wizard.lastRunVersion`
- `wizard.lastRunCommit`
- `wizard.lastRunCommand`
- `wizard.lastRunMode`

`openclaw agents add` escribe `agents.list[]` y `bindings` opcionales.

Las credenciales de WhatsApp se guardan en `~/.openclaw/credentials/whatsapp/<accountId>/`.
Las sesiones se almacenan en `~/.openclaw/agents/<agentId>/sessions/`.

<Note>
Algunos canales se distribuyen como plugins. Cuando se seleccionan durante la configuración, el asistente solicita instalar el plugin (npm o ruta local) antes de configurar el canal.
</Note>

RPC del asistente de Gateway:

- `wizard.start`
- `wizard.next`
- `wizard.cancel`
- `wizard.status`

Los clientes (la app de macOS y la UI de Control) pueden renderizar los pasos sin volver a implementar la lógica de onboarding.

Comportamiento de la configuración de Signal:

- Descarga el recurso de versión adecuado
- Lo almacena en `~/.openclaw/tools/signal-cli/<version>/`
- Escribe `channels.signal.cliPath` en la configuración
- Las compilaciones JVM requieren Java 21
- Se usan compilaciones nativas cuando están disponibles
- Windows usa WSL2 y sigue el flujo de `signal-cli` de Linux dentro de WSL

## Documentos relacionados

- Centro de onboarding: [Onboarding (CLI)](/es/start/wizard)
- Automatización y scripts: [Automatización de la CLI](/es/start/wizard-cli-automation)
- Referencia de comandos: [`openclaw onboard`](/es/cli/onboard)
