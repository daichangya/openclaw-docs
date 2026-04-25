---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducir cambios incompatibles en la configuración
summary: 'Comando doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Doctor
x-i18n:
    generated_at: "2026-04-25T13:46:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 05063983a5ffd9dc117a8135f76519941c28d30778d6ecbaa3f276a5fd4fce46
    source_path: gateway/doctor.md
    workflow: 15
---

`openclaw doctor` es la herramienta de reparación + migración para OpenClaw. Corrige configuración/estado obsoletos, comprueba el estado y proporciona pasos de reparación accionables.

## Inicio rápido

```bash
openclaw doctor
```

### Sin interfaz / automatización

```bash
openclaw doctor --yes
```

Acepta los valores predeterminados sin preguntar (incluidos los pasos de reparación de reinicio/servicio/sandbox cuando corresponda).

```bash
openclaw doctor --repair
```

Aplica las reparaciones recomendadas sin preguntar (reparaciones + reinicios cuando sea seguro).

```bash
openclaw doctor --repair --force
```

Aplica también reparaciones agresivas (sobrescribe configuraciones personalizadas del supervisor).

```bash
openclaw doctor --non-interactive
```

Se ejecuta sin preguntas y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana.
Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

```bash
openclaw doctor --deep
```

Escanea servicios del sistema para detectar instalaciones adicionales del Gateway (launchd/systemd/schtasks).

Si quieres revisar los cambios antes de escribir, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

- Actualización previa opcional para instalaciones git (solo interactivo).
- Comprobación de vigencia del protocolo de UI (reconstruye Control UI cuando el esquema del protocolo es más reciente).
- Comprobación de estado + solicitud de reinicio.
- Resumen del estado de Skills (elegibles/faltantes/bloqueadas) y estado de Plugins.
- Normalización de configuración para valores heredados.
- Migración de configuración de Talk desde campos planos heredados `talk.*` a `talk.provider` + `talk.providers.<provider>`.
- Comprobaciones de migración del navegador para configuraciones heredadas de extensión de Chrome y preparación de Chrome MCP.
- Advertencias de anulación del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Advertencias de sombreado de OAuth de Codex (`models.providers.openai-codex`).
- Comprobación de requisitos previos de TLS OAuth para perfiles OAuth de OpenAI Codex.
- Migración de estado heredado en disco (sessions/directorio del agente/autenticación de WhatsApp).
- Migración heredada de claves de contrato de manifiesto de Plugin (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migración heredada del almacén de Cron (`jobId`, `schedule.cron`, campos de entrega/carga de nivel superior, `provider` en la carga, trabajos simples de respaldo de Webhook con `notify: true`).
- Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
- Comprobaciones de integridad y permisos del estado (sessions, transcripciones, directorio de estado).
- Comprobaciones de permisos del archivo de configuración (`chmod 600`) cuando se ejecuta localmente.
- Estado de autenticación de modelos: comprueba la caducidad de OAuth, puede renovar tokens próximos a caducar e informa de estados de enfriamiento/desactivación del perfil de autenticación.
- Detección de directorio extra del espacio de trabajo (`~/openclaw`).
- Reparación de imagen de sandbox cuando el sandboxing está habilitado.
- Migración de servicios heredados y detección de Gateways adicionales.
- Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
- Comprobaciones de runtime del Gateway (servicio instalado pero no en ejecución; etiqueta launchd en caché).
- Advertencias de estado de canales (sondeadas desde el Gateway en ejecución).
- Auditoría de configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
- Comprobaciones de buenas prácticas del runtime del Gateway (Node frente a Bun, rutas de administradores de versiones).
- Diagnóstico de colisión de puertos del Gateway (predeterminado `18789`).
- Advertencias de seguridad para políticas de mensajes directos abiertas.
- Comprobaciones de autenticación del Gateway para modo de token local (ofrece generar token cuando no existe ninguna fuente de token; no sobrescribe configuraciones SecretRef de token).
- Detección de problemas de emparejamiento de dispositivos (solicitudes pendientes de primer emparejamiento, ampliaciones pendientes de rol/ámbitos, deriva de caché local obsoleta del token de dispositivo y deriva de autenticación del registro emparejado).
- Comprobación de linger de systemd en Linux.
- Comprobación del tamaño de archivos de arranque del espacio de trabajo (advertencias de truncado/casi límite para archivos de contexto).
- Comprobación del estado de completado del shell y auto-instalación/actualización.
- Comprobación de preparación del proveedor de embeddings para búsqueda en memoria (modelo local, clave API remota o binario QMD).
- Comprobaciones de instalación desde el código fuente (desajuste de workspace pnpm, recursos de UI faltantes, binario tsx faltante).
- Escribe configuración actualizada + metadatos del asistente.

## Relleno y restablecimiento de Dreams UI

La escena Dreams de Control UI incluye acciones **Backfill**, **Reset** y **Clear Grounded**
para el flujo de Dreaming con base contextual. Estas acciones usan métodos RPC
de estilo doctor del Gateway, pero **no** forman parte de la reparación/migración
de la CLI `openclaw doctor`.

Qué hacen:

- **Backfill** escanea archivos históricos `memory/YYYY-MM-DD.md` en el
  espacio de trabajo activo, ejecuta el paso de diario REM con base contextual y escribe entradas
  reversibles de relleno en `DREAMS.md`.
- **Reset** elimina solo esas entradas de diario de relleno marcadas de `DREAMS.md`.
- **Clear Grounded** elimina solo las entradas de corto plazo preparadas de tipo grounded-only que
  provienen de reproducción histórica y que aún no han acumulado recuerdo activo ni soporte
  diario.

Qué **no** hacen por sí solas:

- no editan `MEMORY.md`
- no ejecutan migraciones completas de doctor
- no preparan automáticamente candidatos grounded en el almacén activo de promoción
  de corto plazo a menos que ejecutes explícitamente primero la ruta CLI preparada

Si quieres que la reproducción histórica con base contextual influya en la ruta normal
de promoción profunda, usa en su lugar el flujo CLI:

```bash
openclaw memory rem-backfill --path ./memory --stage-short-term
```

Eso prepara candidatos duraderos con base contextual en el almacén de Dreaming a corto plazo mientras
mantiene `DREAMS.md` como superficie de revisión.

## Comportamiento detallado y justificación

### 0) Actualización opcional (instalaciones git)

Si esto es un checkout git y doctor se ejecuta de forma interactiva, ofrece
actualizar (fetch/rebase/build) antes de ejecutar doctor.

### 1) Normalización de configuración

Si la configuración contiene formas heredadas de valores (por ejemplo `messages.ackReaction`
sin una anulación específica del canal), doctor las normaliza al esquema actual.

Eso incluye campos planos heredados de Talk. La configuración pública actual de Talk es
`talk.provider` + `talk.providers.<provider>`. Doctor reescribe las formas antiguas
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` al mapa del proveedor.

### 2) Migraciones de claves heredadas de configuración

Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y piden
que ejecutes `openclaw doctor`.

Doctor hará lo siguiente:

- Explicar qué claves heredadas se encontraron.
- Mostrar la migración que aplicó.
- Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

El Gateway también ejecuta automáticamente las migraciones de doctor al iniciarse cuando detecta
un formato heredado de configuración, por lo que las configuraciones obsoletas se reparan sin intervención manual.
Las migraciones del almacén de trabajos Cron se gestionan con `openclaw doctor --fix`.

Migraciones actuales:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` de nivel superior
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- heredado `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `messages.tts.provider: "edge"` y `messages.tts.providers.edge` → `messages.tts.provider: "microsoft"` y `messages.tts.providers.microsoft`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.provider: "edge"` y `plugins.entries.voice-call.config.tts.providers.edge` → `provider: "microsoft"` y `providers.microsoft`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Para canales con `accounts` con nombre pero con valores persistentes de canal de cuenta única en el nivel superior, mueve esos valores de alcance de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino nombrado/predeterminado coincidente existente)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- elimina `browser.relayBindHost` (configuración heredada del relay de extensión)

Las advertencias de doctor también incluyen orientación de cuenta predeterminada para canales con varias cuentas:

- Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` o `accounts.default`, doctor advierte que el enrutamiento de respaldo puede elegir una cuenta inesperada.
- Si `channels.<channel>.defaultAccount` está configurado con un ID de cuenta desconocido, doctor advierte y enumera los ID de cuenta configurados.

### 2b) Anulaciones del proveedor OpenCode

Si añadiste manualmente `models.providers.opencode`, `opencode-zen` u `opencode-go`,
esto sobrescribe el catálogo integrado de OpenCode de `@mariozechner/pi-ai`.
Eso puede forzar modelos a la API incorrecta o poner los costes a cero. Doctor avisa para que
puedas eliminar la anulación y restaurar el enrutamiento por modelo API + costes.

### 2c) Migración del navegador y preparación de Chrome MCP

Si la configuración de tu navegador aún apunta a la ruta eliminada de la extensión de Chrome, doctor
la normaliza al modelo actual de conexión host-local de Chrome MCP:

- `browser.profiles.*.driver: "extension"` pasa a ser `"existing-session"`
- se elimina `browser.relayBindHost`

Doctor también audita la ruta host-local de Chrome MCP cuando usas `defaultProfile:
"user"` o un perfil configurado `existing-session`:

- comprueba si Google Chrome está instalado en el mismo host para perfiles predeterminados
  de conexión automática
- comprueba la versión detectada de Chrome y advierte cuando es inferior a Chrome 144
- recuerda habilitar la depuración remota en la página de inspección del navegador (por
  ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`
  o `edge://inspect/#remote-debugging`)

Doctor no puede habilitar por ti la configuración del lado de Chrome. Chrome MCP host-local
sigue requiriendo:

- un navegador basado en Chromium 144+ en el host del gateway/node
- el navegador ejecutándose localmente
- la depuración remota habilitada en ese navegador
- aprobar en el navegador la primera solicitud de consentimiento de conexión

La preparación aquí solo se refiere a los requisitos previos de conexión local. Existing-session conserva
los límites actuales de la ruta Chrome MCP; rutas avanzadas como `responsebody`, exportación PDF,
intercepción de descargas y acciones por lotes siguen requiriendo un navegador gestionado o un perfil CDP sin procesar.

Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni a otros
flujos sin interfaz. Estos siguen usando CDP sin procesar.

### 2d) Requisitos previos de TLS OAuth

Cuando se configura un perfil OAuth de OpenAI Codex, doctor sondea el endpoint
de autorización de OpenAI para verificar que la pila TLS local de Node/OpenSSL pueda
validar la cadena de certificados. Si el sondeo falla con un error de certificado (por
ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado caducado o certificado autofirmado),
doctor muestra instrucciones de corrección específicas por plataforma. En macOS con un Node de Homebrew, la
corrección suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta
incluso si el gateway está en buen estado.

### 2c) Anulaciones del proveedor Codex OAuth

Si anteriormente añadiste configuraciones heredadas de transporte de OpenAI en
`models.providers.openai-codex`, pueden ocultar la ruta integrada del proveedor
Codex OAuth que las versiones más nuevas usan automáticamente. Doctor advierte cuando detecta
esas configuraciones antiguas de transporte junto con Codex OAuth para que puedas eliminar o reescribir
la anulación obsoleta y recuperar el comportamiento integrado de enrutamiento/respaldo.
Los proxies personalizados y las anulaciones solo de encabezados siguen siendo compatibles y no
activan esta advertencia.

### 3) Migraciones de estado heredado (diseño en disco)

Doctor puede migrar diseños antiguos en disco a la estructura actual:

- Almacén de sessions + transcripciones:
  - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
- Directorio del agente:
  - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticación de WhatsApp (Baileys):
  - de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
  - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminado: `default`)

Estas migraciones son de mejor esfuerzo e idempotentes; doctor emitirá advertencias cuando
deje carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente
las sessions heredadas + el directorio del agente al iniciarse para que historial/autenticación/modelos queden en la
ruta por agente sin ejecutar doctor manualmente. La autenticación de WhatsApp se migra intencionadamente
solo mediante `openclaw doctor`. La normalización de proveedor/mapa de proveedores de Talk ahora
compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan
cambios repetidos y vacíos en `doctor --fix`.

### 3a) Migraciones heredadas del manifiesto de Plugin

Doctor escanea todos los manifiestos de Plugins instalados en busca de claves obsoletas
de capacidad de nivel superior (`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts`
y reescribir el archivo del manifiesto en el lugar. Esta migración es idempotente;
si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina
sin duplicar los datos.

### 3b) Migraciones heredadas del almacén de Cron

Doctor también comprueba el almacén de trabajos de Cron (`~/.openclaw/cron/jobs.json` de forma predeterminada,
o `cron.store` si se sobrescribe) en busca de formas antiguas de trabajos que el programador aún
acepta por compatibilidad.

Las limpiezas actuales de Cron incluyen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de carga de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de entrega `provider` en la carga → `delivery.channel` explícito
- trabajos heredados simples de respaldo de Webhook con `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

Doctor solo migra automáticamente trabajos `notify: true` cuando puede hacerlo sin
cambiar el comportamiento. Si un trabajo combina el respaldo heredado de notify con un modo de
entrega no Webhook ya existente, doctor advierte y deja ese trabajo para revisión manual.

### 3c) Limpieza de bloqueos de sesión

Doctor escanea cada directorio de sesiones del agente en busca de archivos obsoletos de bloqueo de escritura:
archivos que quedan cuando una sesión finaliza de forma anómala. Para cada archivo de bloqueo encontrado informa:
la ruta, el PID, si el PID sigue activo, la antigüedad del bloqueo y si se
considera obsoleto (PID muerto o más de 30 minutos). En modo `--fix` / `--repair`
elimina automáticamente los archivos de bloqueo obsoletos; en caso contrario solo muestra una nota e
indica que vuelvas a ejecutar con `--fix`.

### 4) Comprobaciones de integridad del estado (persistencia de sesión, enrutamiento y seguridad)

El directorio de estado es el tronco operativo del sistema. Si desaparece, pierdes
sessions, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

Doctor comprueba:

- **Falta el directorio de estado**: advierte sobre pérdida catastrófica de estado, solicita recrear
  el directorio y recuerda que no puede recuperar datos faltantes.
- **Permisos del directorio de estado**: verifica que se pueda escribir; ofrece reparar permisos
  (y emite una sugerencia `chown` cuando detecta desajuste de propietario/grupo).
- **Directorio de estado en macOS sincronizado con la nube**: advierte cuando el estado se resuelve bajo iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o
  `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta
  y condiciones de carrera de bloqueo/sincronización.
- **Directorio de estado en Linux sobre SD o eMMC**: advierte cuando el estado se resuelve a una fuente de
  montaje `mmcblk*`, porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse
  más rápido con escrituras de sesión y credenciales.
- **Faltan directorios de sesiones**: `sessions/` y el directorio del almacén de sesiones son
  necesarios para conservar el historial y evitar fallos `ENOENT`.
- **Desajuste de transcripciones**: advierte cuando entradas recientes de sesión tienen archivos
  de transcripción faltantes.
- **Sesión principal “JSONL de 1 línea”**: marca cuando la transcripción principal tiene solo una
  línea (el historial no se está acumulando).
- **Varios directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos
  directorios personales o cuando `OPENCLAW_STATE_DIR` apunta a otro sitio (el historial puede
  dividirse entre instalaciones).
- **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor recuerda que debes ejecutarlo
  en el host remoto (el estado vive allí).
- **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es
  legible por grupo/mundo y ofrece restringirlo a `600`.

### 5) Estado de autenticación de modelos (caducidad de OAuth)

Doctor inspecciona perfiles OAuth en el almacén de autenticación, advierte cuando los tokens están
a punto de caducar o ya caducaron, y puede renovarlos cuando es seguro. Si el perfil
OAuth/token de Anthropic está obsoleto, sugiere una clave API de Anthropic o la
ruta de token de configuración de Anthropic.
Las solicitudes de renovación solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive`
omite los intentos de renovación.

Cuando una renovación OAuth falla de forma permanente (por ejemplo `refresh_token_reused`,
`invalid_grant` o un proveedor te indica que debes volver a iniciar sesión), doctor informa
que se requiere nueva autenticación y muestra el comando exacto `openclaw models auth login --provider ...`
que debes ejecutar.

Doctor también informa de perfiles de autenticación temporalmente inutilizables debido a:

- enfriamientos cortos (límites de tasa/tiempos de espera/fallos de autenticación)
- desactivaciones más largas (fallos de facturación/crédito)

### 6) Validación del modelo de Hooks

Si `hooks.gmail.model` está configurado, doctor valida la referencia del modelo contra el
catálogo y la lista de permitidos y advierte cuando no se resolverá o no está permitido.

### 7) Reparación de imagen de sandbox

Cuando el sandboxing está habilitado, doctor comprueba las imágenes de Docker y ofrece construirlas o
cambiar a nombres heredados si falta la imagen actual.

### 7b) Dependencias de runtime de Plugins incluidos

Doctor verifica dependencias de runtime solo para Plugins incluidos que estén activos en la
configuración actual o habilitados por el valor predeterminado de su manifiesto incluido, por ejemplo
`plugins.entries.discord.enabled: true`, el heredado
`channels.discord.enabled: true` o un proveedor incluido habilitado por defecto. Si falta alguna,
doctor informa de los paquetes y los instala en modo
`openclaw doctor --fix` / `openclaw doctor --repair`. Los Plugins externos siguen
usando `openclaw plugins install` / `openclaw plugins update`; doctor no
instala dependencias para rutas arbitrarias de Plugins.

El Gateway y la CLI local también pueden reparar dependencias de runtime de Plugins incluidos activos
bajo demanda antes de importar un Plugin incluido. Estas instalaciones están
limitadas a la raíz de instalación del runtime del Plugin, se ejecutan con scripts deshabilitados, no
escriben un lock de paquete y están protegidas por un bloqueo de raíz de instalación para que inicios simultáneos
de CLI o Gateway no modifiquen el mismo árbol `node_modules` al mismo tiempo.

### 8) Migraciones del servicio Gateway y sugerencias de limpieza

Doctor detecta servicios heredados del gateway (launchd/systemd/schtasks) y
ofrece eliminarlos e instalar el servicio OpenClaw usando el puerto actual del gateway.
También puede escanear servicios adicionales tipo gateway y mostrar sugerencias de limpieza.
Los servicios OpenClaw gateway con nombre de perfil se consideran de primera clase y no
se marcan como "extra".

### 8b) Migración Matrix al inicio

Cuando una cuenta del canal Matrix tiene una migración heredada de estado pendiente o accionable,
doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego
ejecuta los pasos de migración de mejor esfuerzo: migración heredada del estado Matrix y preparación heredada
del estado cifrado. Ambos pasos no son fatales; los errores se registran y el inicio continúa. En modo
solo lectura (`openclaw doctor` sin `--fix`) esta comprobación se omite por completo.

### 8c) Emparejamiento de dispositivos y deriva de autenticación

Doctor ahora inspecciona el estado de emparejamiento de dispositivos como parte del paso normal de estado.

Qué informa:

- solicitudes pendientes de primer emparejamiento
- ampliaciones pendientes de rol para dispositivos ya emparejados
- ampliaciones pendientes de ámbitos para dispositivos ya emparejados
- reparaciones de desajuste de clave pública cuando el ID del dispositivo sigue coincidiendo pero la
  identidad del dispositivo ya no coincide con el registro aprobado
- registros emparejados que carecen de un token activo para un rol aprobado
- tokens emparejados cuyos ámbitos se desvían fuera de la línea base aprobada de emparejamiento
- entradas de caché local del token de dispositivo para la máquina actual que son anteriores a una
  rotación de token del lado del gateway o que tienen metadatos de ámbito obsoletos

Doctor no aprueba automáticamente solicitudes de emparejamiento ni rota automáticamente tokens de dispositivo. En
su lugar, muestra los pasos exactos siguientes:

- inspeccionar solicitudes pendientes con `openclaw devices list`
- aprobar la solicitud exacta con `openclaw devices approve <requestId>`
- rotar un token nuevo con `openclaw devices rotate --device <deviceId> --role <role>`
- eliminar y volver a aprobar un registro obsoleto con `openclaw devices remove <deviceId>`

Esto cierra el hueco habitual de “ya está emparejado pero sigue apareciendo que se requiere emparejamiento”:
doctor ahora distingue entre primer emparejamiento, ampliaciones pendientes de rol/ámbito
y deriva obsoleta de token/identidad de dispositivo.

### 9) Advertencias de seguridad

Doctor emite advertencias cuando un proveedor está abierto a mensajes directos sin lista de permitidos o
cuando una política está configurada de forma peligrosa.

### 10) systemd linger (Linux)

Si se ejecuta como servicio de usuario systemd, doctor se asegura de que lingering esté habilitado para que el
gateway siga activo después de cerrar sesión.

### 11) Estado del espacio de trabajo (Skills, Plugins y directorios heredados)

Doctor muestra un resumen del estado del espacio de trabajo para el agente predeterminado:

- **Estado de Skills**: cuenta Skills elegibles, con requisitos faltantes y bloqueadas por lista de permitidos.
- **Directorios heredados del espacio de trabajo**: advierte cuando `~/openclaw` u otros directorios heredados del espacio de trabajo
  existen junto al espacio de trabajo actual.
- **Estado de Plugins**: cuenta Plugins cargados/deshabilitados/con error; enumera los ID de Plugins con
  errores; informa de las capacidades de Plugins incluidos.
- **Advertencias de compatibilidad de Plugins**: marca Plugins que tienen problemas de compatibilidad con
  el runtime actual.
- **Diagnóstico de Plugins**: muestra advertencias o errores en tiempo de carga emitidos por el
  registro de Plugins.

### 11b) Tamaño de archivos de arranque

Doctor comprueba si los archivos de arranque del espacio de trabajo (por ejemplo `AGENTS.md`,
`CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del presupuesto
de caracteres configurado. Informa por archivo del recuento de caracteres bruto frente al inyectado, porcentaje
de truncado, causa del truncado (`max/file` o `max/total`) y total de caracteres
inyectados como fracción del presupuesto total. Cuando los archivos están truncados o cerca
del límite, doctor muestra consejos para ajustar `agents.defaults.bootstrapMaxChars`
y `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Completado del shell

Doctor comprueba si el completado con tabulador está instalado para el shell actual
(zsh, bash, fish o PowerShell):

- Si el perfil del shell usa un patrón lento de completado dinámico
  (`source <(openclaw completion ...)`), doctor lo actualiza a la variante
  más rápida basada en archivo en caché.
- Si el completado está configurado en el perfil pero falta el archivo de caché,
  doctor regenera la caché automáticamente.
- Si no hay ningún completado configurado, doctor solicita instalarlo
  (solo en modo interactivo; se omite con `--non-interactive`).

Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

### 12) Comprobaciones de autenticación del Gateway (token local)

Doctor comprueba la preparación de la autenticación con token del gateway local.

- Si el modo de token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
- Si `gateway.auth.token` está gestionado por SecretRef pero no está disponible, doctor advierte y no lo sobrescribe con texto sin formato.
- `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay ningún token SecretRef configurado.

### 12b) Reparaciones en modo de solo lectura compatibles con SecretRef

Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento fail-fast del runtime.

- `openclaw doctor --fix` ahora usa el mismo modelo resumido de SecretRef en solo lectura que los comandos de la familia status para reparaciones de configuración específicas.
- Ejemplo: la reparación de `@username` en `allowFrom` / `groupAllowFrom` de Telegram intenta usar credenciales configuradas del bot cuando están disponibles.
- Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta actual del comando, doctor informa que la credencial está configurada-pero-no-disponible y omite la autorresolución en lugar de fallar o informar incorrectamente que falta el token.

### 13) Comprobación de estado del Gateway + reinicio

Doctor ejecuta una comprobación de estado y ofrece reiniciar el gateway cuando parece
estar en mal estado.

### 13b) Preparación para búsqueda en memoria

Doctor comprueba si el proveedor configurado de embeddings para búsqueda en memoria está listo
para el agente predeterminado. El comportamiento depende del backend y proveedor configurados:

- **Backend QMD**: comprueba si el binario `qmd` está disponible y puede iniciarse.
  Si no, muestra instrucciones de corrección, incluido el paquete npm y una opción manual de ruta al binario.
- **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remota/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
- **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave API presente en el entorno o en el almacén de autenticación. Muestra sugerencias accionables de corrección si falta.
- **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto en el orden de selección automática.

Cuando hay disponible un resultado del sondeo del gateway (el gateway estaba en buen estado en el momento de la comprobación), doctor lo contrasta con la configuración visible desde la CLI y señala cualquier discrepancia.

Usa `openclaw memory status --deep` para verificar la preparación de embeddings en tiempo de ejecución.

### 14) Advertencias de estado de canales

Si el gateway está en buen estado, doctor ejecuta un sondeo de estado de canales e informa
advertencias con correcciones sugeridas.

### 15) Auditoría + reparación de configuración del supervisor

Doctor comprueba la configuración instalada del supervisor (launchd/systemd/schtasks) en busca de
valores predeterminados faltantes u obsoletos (por ejemplo, dependencias de systemd `network-online` y
retraso de reinicio). Cuando encuentra un desajuste, recomienda una actualización y puede
reescribir el archivo de servicio/tarea a los valores predeterminados actuales.

Notas:

- `openclaw doctor` pide confirmación antes de reescribir la configuración del supervisor.
- `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
- `openclaw doctor --repair` aplica las correcciones recomendadas sin preguntas.
- `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
- Si la autenticación con token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio por doctor valida el SecretRef pero no conserva valores de token en texto sin formato resueltos en los metadatos de entorno del servicio del supervisor.
- Si la autenticación con token requiere un token y el token SecretRef configurado no está resuelto, doctor bloquea la ruta de instalación/reparación con instrucciones accionables.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está configurado, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
- Para unidades user-systemd de Linux, las comprobaciones de deriva de token de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
- Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

### 16) Diagnóstico de runtime + puerto del Gateway

Doctor inspecciona el runtime del servicio (PID, último estado de salida) y advierte cuando el
servicio está instalado pero no se está ejecutando realmente. También comprueba colisiones de puertos
en el puerto del gateway (predeterminado `18789`) e informa de causas probables (gateway ya
en ejecución, túnel SSH).

### 17) Buenas prácticas del runtime del Gateway

Doctor advierte cuando el servicio gateway se ejecuta sobre Bun o sobre una ruta de Node gestionada por un administrador de versiones
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales WhatsApp + Telegram requieren Node,
y las rutas de administradores de versiones pueden romperse después de las actualizaciones porque el servicio no
carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando
está disponible (Homebrew/apt/choco).

### 18) Escritura de configuración + metadatos del asistente

Doctor conserva cualquier cambio de configuración y registra metadatos del asistente para dejar constancia de la
ejecución de doctor.

### 19) Consejos del espacio de trabajo (copia de seguridad + sistema de memoria)

Doctor sugiere un sistema de memoria del espacio de trabajo cuando falta y muestra un consejo de copia de seguridad
si el espacio de trabajo aún no está bajo git.

Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para ver una guía completa de la
estructura del espacio de trabajo y copia de seguridad con git (se recomienda GitHub o GitLab privados).

## Relacionado

- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
- [Runbook del Gateway](/es/gateway)
