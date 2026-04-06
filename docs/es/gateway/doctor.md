---
read_when:
    - Añadir o modificar migraciones de doctor
    - Introducir cambios incompatibles en la configuración
summary: 'Comando Doctor: comprobaciones de estado, migraciones de configuración y pasos de reparación'
title: Doctor
x-i18n:
    generated_at: "2026-04-06T03:08:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6c0a15c522994552a1eef39206bed71fc5bf45746776372f24f31c101bfbd411
    source_path: gateway/doctor.md
    workflow: 15
---

# Doctor

`openclaw doctor` es la herramienta de reparación + migración de OpenClaw. Corrige
configuraciones/estados obsoletos, comprueba el estado y proporciona pasos de reparación accionables.

## Inicio rápido

```bash
openclaw doctor
```

### Sin interfaz / automatización

```bash
openclaw doctor --yes
```

Acepta los valores predeterminados sin pedir confirmación (incluidos los pasos de reparación de reinicio/servicio/sandbox cuando corresponda).

```bash
openclaw doctor --repair
```

Aplica las reparaciones recomendadas sin pedir confirmación (reparaciones + reinicios cuando es seguro).

```bash
openclaw doctor --repair --force
```

Aplica también reparaciones agresivas (sobrescribe configuraciones personalizadas del supervisor).

```bash
openclaw doctor --non-interactive
```

Se ejecuta sin solicitudes y solo aplica migraciones seguras (normalización de configuración + movimientos de estado en disco). Omite acciones de reinicio/servicio/sandbox que requieren confirmación humana.
Las migraciones de estado heredado se ejecutan automáticamente cuando se detectan.

```bash
openclaw doctor --deep
```

Escanea servicios del sistema en busca de instalaciones adicionales del gateway (launchd/systemd/schtasks).

Si quieres revisar los cambios antes de escribir, abre primero el archivo de configuración:

```bash
cat ~/.openclaw/openclaw.json
```

## Qué hace (resumen)

- Actualización previa opcional para instalaciones desde git (solo interactiva).
- Comprobación de vigencia del protocolo de la UI (reconstruye la Control UI cuando el esquema del protocolo es más reciente).
- Comprobación de estado + solicitud de reinicio.
- Resumen del estado de Skills (elegibles/faltantes/bloqueadas) y estado de plugins.
- Normalización de configuración para valores heredados.
- Migración de configuración de Talk desde campos planos heredados `talk.*` hacia `talk.provider` + `talk.providers.<provider>`.
- Comprobaciones de migración del navegador para configuraciones heredadas de la extensión de Chrome y preparación de Chrome MCP.
- Advertencias de sobrescritura del proveedor OpenCode (`models.providers.opencode` / `models.providers.opencode-go`).
- Comprobación de requisitos previos de TLS de OAuth para perfiles de OAuth de OpenAI Codex.
- Migración de estado heredado en disco (sesiones/directorio del agente/autenticación de WhatsApp).
- Migración de claves heredadas del contrato del manifiesto de plugins (`speechProviders`, `realtimeTranscriptionProviders`, `realtimeVoiceProviders`, `mediaUnderstandingProviders`, `imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`, `webSearchProviders` → `contracts`).
- Migración del almacén cron heredado (`jobId`, `schedule.cron`, campos de entrega/payload de nivel superior, `provider` de payload, trabajos simples de fallback de webhook con `notify: true`).
- Inspección de archivos de bloqueo de sesión y limpieza de bloqueos obsoletos.
- Comprobaciones de integridad y permisos del estado (sesiones, transcripciones, directorio de estado).
- Comprobaciones de permisos del archivo de configuración (chmod 600) cuando se ejecuta localmente.
- Estado de autenticación de modelos: comprueba el vencimiento de OAuth, puede actualizar tokens próximos a vencer e informa estados de cooldown/deshabilitación de perfiles de autenticación.
- Detección de directorios de workspace extra (`~/openclaw`).
- Reparación de imagen de sandbox cuando el sandbox está habilitado.
- Migración de servicios heredados y detección de gateways extra.
- Migración de estado heredado del canal Matrix (en modo `--fix` / `--repair`).
- Comprobaciones del runtime del gateway (servicio instalado pero no en ejecución; etiqueta de launchd en caché).
- Advertencias de estado de canales (sondeadas desde el gateway en ejecución).
- Auditoría de configuración del supervisor (launchd/systemd/schtasks) con reparación opcional.
- Comprobaciones de mejores prácticas del runtime del gateway (Node vs Bun, rutas de gestores de versiones).
- Diagnósticos de colisión de puertos del gateway (predeterminado `18789`).
- Advertencias de seguridad para políticas de DM abiertas.
- Comprobaciones de autenticación del gateway para modo de token local (ofrece generar token cuando no existe ninguna fuente de token; no sobrescribe configuraciones SecretRef de token).
- Comprobación de linger de systemd en Linux.
- Comprobación del tamaño de archivos bootstrap del workspace (advertencias por truncamiento/cercanía al límite para archivos de contexto).
- Comprobación del estado de autocompletado de shell e instalación/actualización automática.
- Comprobación de preparación del proveedor de embeddings de memory search (modelo local, clave de API remota o binario QMD).
- Comprobaciones de instalación desde código fuente (desajuste de workspace de pnpm, activos de UI faltantes, binario tsx faltante).
- Escribe la configuración actualizada + metadatos del asistente.

## Comportamiento detallado y justificación

### 0) Actualización opcional (instalaciones desde git)

Si se trata de un checkout de git y doctor se ejecuta de forma interactiva, ofrece
actualizar (fetch/rebase/build) antes de ejecutar doctor.

### 1) Normalización de configuración

Si la configuración contiene formas heredadas de valores (por ejemplo `messages.ackReaction`
sin una sobrescritura específica del canal), doctor las normaliza al esquema
actual.

Eso incluye campos planos heredados de Talk. La configuración pública actual de Talk es
`talk.provider` + `talk.providers.<provider>`. Doctor reescribe las antiguas formas
`talk.voiceId` / `talk.voiceAliases` / `talk.modelId` / `talk.outputFormat` /
`talk.apiKey` en el mapa de proveedores.

### 2) Migraciones de claves de configuración heredadas

Cuando la configuración contiene claves obsoletas, otros comandos se niegan a ejecutarse y te piden
que ejecutes `openclaw doctor`.

Doctor hará lo siguiente:

- Explicar qué claves heredadas se encontraron.
- Mostrar la migración que aplicó.
- Reescribir `~/.openclaw/openclaw.json` con el esquema actualizado.

El Gateway también ejecuta automáticamente migraciones de doctor al iniciarse cuando detecta un
formato de configuración heredado, para que las configuraciones obsoletas se reparen sin intervención manual.
Las migraciones del almacén de trabajos cron son gestionadas por `openclaw doctor --fix`.

Migraciones actuales:

- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → `bindings` de nivel superior
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `talk.voiceId`/`talk.voiceAliases`/`talk.modelId`/`talk.outputFormat`/`talk.apiKey` heredados → `talk.provider` + `talk.providers.<provider>`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `messages.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `messages.tts.providers.<provider>`
- `channels.discord.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.voice.tts.providers.<provider>`
- `channels.discord.accounts.<id>.voice.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `channels.discord.accounts.<id>.voice.tts.providers.<provider>`
- `plugins.entries.voice-call.config.tts.<provider>` (`openai`/`elevenlabs`/`microsoft`/`edge`) → `plugins.entries.voice-call.config.tts.providers.<provider>`
- `plugins.entries.voice-call.config.provider: "log"` → `"mock"`
- `plugins.entries.voice-call.config.twilio.from` → `plugins.entries.voice-call.config.fromNumber`
- `plugins.entries.voice-call.config.streaming.sttProvider` → `plugins.entries.voice-call.config.streaming.provider`
- `plugins.entries.voice-call.config.streaming.openaiApiKey|sttModel|silenceDurationMs|vadThreshold`
  → `plugins.entries.voice-call.config.streaming.providers.openai.*`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- Para canales con `accounts` con nombre pero con valores persistentes de canal de cuenta única en el nivel superior, mover esos valores con ámbito de cuenta a la cuenta promovida elegida para ese canal (`accounts.default` para la mayoría de los canales; Matrix puede conservar un destino existente coincidente/predeterminado con nombre)
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*` (tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`
- `browser.ssrfPolicy.allowPrivateNetwork` → `browser.ssrfPolicy.dangerouslyAllowPrivateNetwork`
- `browser.profiles.*.driver: "extension"` → `"existing-session"`
- eliminar `browser.relayBindHost` (configuración heredada del relay de extensión)

Las advertencias de doctor también incluyen orientación sobre la cuenta predeterminada para canales con múltiples cuentas:

- Si se configuran dos o más entradas `channels.<channel>.accounts` sin `channels.<channel>.defaultAccount` o `accounts.default`, doctor advierte que el enrutamiento de fallback puede elegir una cuenta inesperada.
- Si `channels.<channel>.defaultAccount` está establecido en un ID de cuenta desconocido, doctor advierte y enumera los ID de cuenta configurados.

### 2b) Sobrescrituras del proveedor OpenCode

Si has añadido manualmente `models.providers.opencode`, `opencode-zen` o `opencode-go`,
eso sobrescribe el catálogo integrado de OpenCode de `@mariozechner/pi-ai`.
Eso puede forzar modelos a la API equivocada o poner los costos en cero. Doctor advierte para que
puedas eliminar la sobrescritura y restaurar el enrutamiento de API + costos por modelo.

### 2c) Migración del navegador y preparación de Chrome MCP

Si tu configuración del navegador todavía apunta a la ruta eliminada de la extensión de Chrome, doctor
la normaliza al modelo actual de conexión host-local de Chrome MCP:

- `browser.profiles.*.driver: "extension"` pasa a ser `"existing-session"`
- se elimina `browser.relayBindHost`

Doctor también audita la ruta host-local de Chrome MCP cuando usas `defaultProfile:
"user"` o un perfil `existing-session` configurado:

- comprueba si Google Chrome está instalado en el mismo host para perfiles de conexión automática
  predeterminados
- comprueba la versión detectada de Chrome y advierte cuando es inferior a Chrome 144
- te recuerda habilitar la depuración remota en la página de inspección del navegador (por
  ejemplo `chrome://inspect/#remote-debugging`, `brave://inspect/#remote-debugging`,
  o `edge://inspect/#remote-debugging`)

Doctor no puede habilitar la configuración del lado de Chrome por ti. Chrome MCP host-local
sigue requiriendo:

- un navegador basado en Chromium 144+ en el host del gateway/nodo
- el navegador ejecutándose localmente
- depuración remota habilitada en ese navegador
- aprobar el primer aviso de consentimiento de conexión en el navegador

La preparación aquí solo se refiere a los requisitos previos de conexión local. Existing-session mantiene
los límites actuales de rutas de Chrome MCP; rutas avanzadas como `responsebody`, exportación a PDF,
interceptación de descargas y acciones por lotes siguen requiriendo un navegador gestionado
o un perfil CDP sin procesar.

Esta comprobación **no** se aplica a Docker, sandbox, remote-browser ni otros
flujos headless. Esos siguen usando CDP sin procesar.

### 2d) Requisitos previos de TLS de OAuth

Cuando se configura un perfil de OAuth de OpenAI Codex, doctor sondea el endpoint de autorización de OpenAI
para verificar que la pila TLS local de Node/OpenSSL pueda validar la cadena de certificados. Si el sondeo falla con un error de certificado (por
ejemplo `UNABLE_TO_GET_ISSUER_CERT_LOCALLY`, certificado vencido o certificado autofirmado),
doctor imprime orientación de corrección específica por plataforma. En macOS con Node de Homebrew, la
solución suele ser `brew postinstall ca-certificates`. Con `--deep`, el sondeo se ejecuta
aunque el gateway esté en buen estado.

### 3) Migraciones de estado heredado (distribución en disco)

Doctor puede migrar estructuras antiguas en disco a la estructura actual:

- Almacén de sesiones + transcripciones:
  - de `~/.openclaw/sessions/` a `~/.openclaw/agents/<agentId>/sessions/`
- Directorio del agente:
  - de `~/.openclaw/agent/` a `~/.openclaw/agents/<agentId>/agent/`
- Estado de autenticación de WhatsApp (Baileys):
  - de `~/.openclaw/credentials/*.json` heredado (excepto `oauth.json`)
  - a `~/.openclaw/credentials/whatsapp/<accountId>/...` (ID de cuenta predeterminado: `default`)

Estas migraciones se hacen con el mejor esfuerzo y son idempotentes; doctor emitirá advertencias cuando
deje carpetas heredadas como copias de seguridad. El Gateway/CLI también migra automáticamente
las sesiones heredadas + el directorio del agente al inicio para que historial/autenticación/modelos terminen en la
ruta por agente sin necesidad de ejecutar doctor manualmente. La autenticación de WhatsApp está diseñada para
migrarse solo mediante `openclaw doctor`. La normalización de proveedor/mapa de proveedores de Talk ahora
compara por igualdad estructural, por lo que las diferencias solo de orden de claves ya no activan
cambios repetidos sin efecto con `doctor --fix`.

### 3a) Migraciones heredadas del manifiesto de plugins

Doctor escanea todos los manifiestos de plugins instalados en busca de claves obsoletas de capacidad de nivel superior
(`speechProviders`, `realtimeTranscriptionProviders`,
`realtimeVoiceProviders`, `mediaUnderstandingProviders`,
`imageGenerationProviders`, `videoGenerationProviders`, `webFetchProviders`,
`webSearchProviders`). Cuando las encuentra, ofrece moverlas al objeto `contracts`
y reescribir el archivo del manifiesto in situ. Esta migración es idempotente;
si la clave `contracts` ya tiene los mismos valores, la clave heredada se elimina
sin duplicar los datos.

### 3b) Migraciones heredadas del almacén cron

Doctor también comprueba el almacén de trabajos cron (`~/.openclaw/cron/jobs.json` por defecto,
o `cron.store` cuando se sobrescribe) en busca de formas antiguas de trabajos que el planificador
sigue aceptando por compatibilidad.

Las limpiezas cron actuales incluyen:

- `jobId` → `id`
- `schedule.cron` → `schedule.expr`
- campos de payload de nivel superior (`message`, `model`, `thinking`, ...) → `payload`
- campos de entrega de nivel superior (`deliver`, `channel`, `to`, `provider`, ...) → `delivery`
- alias de entrega `provider` en payload → `delivery.channel` explícito
- trabajos heredados simples de fallback de webhook con `notify: true` → `delivery.mode="webhook"` explícito con `delivery.to=cron.webhook`

Doctor solo migra automáticamente trabajos `notify: true` cuando puede hacerlo sin
cambiar el comportamiento. Si un trabajo combina fallback heredado de notify con un modo de
entrega no webhook existente, doctor advierte y deja ese trabajo para revisión manual.

### 3c) Limpieza de bloqueos de sesión

Doctor escanea cada directorio de sesiones del agente en busca de archivos de bloqueo de escritura obsoletos: archivos
dejados atrás cuando una sesión terminó de forma anormal. Para cada archivo de bloqueo encontrado informa:
la ruta, el PID, si el PID sigue vivo, la antigüedad del bloqueo y si se
considera obsoleto (PID muerto o más de 30 minutos). En modo `--fix` / `--repair`
elimina automáticamente los archivos de bloqueo obsoletos; en caso contrario imprime una nota e
indica que vuelvas a ejecutar con `--fix`.

### 4) Comprobaciones de integridad del estado (persistencia de sesión, enrutamiento y seguridad)

El directorio de estado es el tronco encefálico operativo. Si desaparece, pierdes
sesiones, credenciales, registros y configuración (a menos que tengas copias de seguridad en otro lugar).

Doctor comprueba:

- **Falta el directorio de estado**: advierte sobre pérdida catastrófica del estado, solicita recrear
  el directorio y recuerda que no puede recuperar datos faltantes.
- **Permisos del directorio de estado**: verifica la posibilidad de escritura; ofrece reparar permisos
  (y emite una sugerencia de `chown` cuando detecta un desajuste de propietario/grupo).
- **Directorio de estado de macOS sincronizado en la nube**: advierte cuando el estado se resuelve bajo iCloud Drive
  (`~/Library/Mobile Documents/com~apple~CloudDocs/...`) o
  `~/Library/CloudStorage/...` porque las rutas respaldadas por sincronización pueden causar E/S más lenta
  y condiciones de carrera de bloqueo/sincronización.
- **Directorio de estado en SD o eMMC en Linux**: advierte cuando el estado se resuelve a una fuente de montaje `mmcblk*`,
  porque la E/S aleatoria respaldada por SD o eMMC puede ser más lenta y desgastarse
  más rápido con escrituras de sesión y credenciales.
- **Faltan directorios de sesión**: `sessions/` y el directorio del almacén de sesiones son
  necesarios para persistir el historial y evitar fallos `ENOENT`.
- **Desajuste de transcripciones**: advierte cuando entradas recientes de sesión tienen archivos
  de transcripción faltantes.
- **Sesión principal “JSONL de 1 línea”**: marca cuando la transcripción principal tiene solo una
  línea (el historial no se está acumulando).
- **Múltiples directorios de estado**: advierte cuando existen varias carpetas `~/.openclaw` en distintos
  directorios home o cuando `OPENCLAW_STATE_DIR` apunta a otro lugar (el historial puede
  dividirse entre instalaciones).
- **Recordatorio de modo remoto**: si `gateway.mode=remote`, doctor recuerda que debes ejecutarlo
  en el host remoto (el estado vive allí).
- **Permisos del archivo de configuración**: advierte si `~/.openclaw/openclaw.json` es
  legible por grupo/mundo y ofrece restringirlo a `600`.

### 5) Estado de autenticación de modelos (vencimiento de OAuth)

Doctor inspecciona perfiles de OAuth en el almacén de autenticación, advierte cuando los tokens están
próximos a vencer/vencidos y puede actualizarlos cuando es seguro. Si el perfil de
OAuth/token de Anthropic está obsoleto, sugiere una clave de API de Anthropic o la ruta heredada
de setup-token de Anthropic.
Las solicitudes de actualización solo aparecen cuando se ejecuta de forma interactiva (TTY); `--non-interactive`
omite los intentos de actualización.

Doctor también detecta estado obsoleto eliminado de Claude CLI de Anthropic. Si aún existen bytes de credenciales
antiguos `anthropic:claude-cli` en `auth-profiles.json`,
doctor los convierte de nuevo en perfiles de token/OAuth de Anthropic y reescribe las referencias
obsoletas a modelos `claude-cli/...`.
Si los bytes ya no existen, doctor elimina la configuración obsoleta e imprime
comandos de recuperación.

Doctor también informa perfiles de autenticación que están temporalmente inutilizables debido a:

- cooldowns cortos (límites de tasa/timeouts/fallos de autenticación)
- deshabilitaciones más largas (fallos de facturación/crédito)

### 6) Validación de modelo de Hooks

Si `hooks.gmail.model` está establecido, doctor valida la referencia del modelo frente al
catálogo y la lista permitida y advierte cuando no se resolverá o no está permitido.

### 7) Reparación de imagen de sandbox

Cuando el sandbox está habilitado, doctor comprueba las imágenes de Docker y ofrece compilar o
cambiar a nombres heredados si falta la imagen actual.

### 7b) Dependencias de runtime de plugins empaquetados

Doctor verifica que las dependencias de runtime de plugins empaquetados (por ejemplo, los
paquetes de runtime del plugin de Discord) estén presentes en la raíz de instalación de OpenClaw.
Si falta alguna, doctor informa los paquetes y los instala en
modo `openclaw doctor --fix` / `openclaw doctor --repair`.

### 8) Migraciones de servicios del gateway y sugerencias de limpieza

Doctor detecta servicios heredados del gateway (launchd/systemd/schtasks) y
ofrece eliminarlos e instalar el servicio de OpenClaw usando el puerto actual del gateway.
También puede escanear servicios adicionales similares a gateway e imprimir sugerencias de limpieza.
Los servicios de gateway de OpenClaw con nombre de perfil se consideran de primera clase y no se
marcan como "extra".

### 8b) Migración de Matrix al inicio

Cuando una cuenta del canal Matrix tiene una migración de estado heredado pendiente o accionable,
doctor (en modo `--fix` / `--repair`) crea una instantánea previa a la migración y luego
ejecuta los pasos de migración con el mejor esfuerzo: migración de estado heredado de Matrix y preparación
de estado cifrado heredado. Ambos pasos no son fatales; los errores se registran y
el inicio continúa. En modo de solo lectura (`openclaw doctor` sin `--fix`) esta comprobación
se omite por completo.

### 9) Advertencias de seguridad

Doctor emite advertencias cuando un proveedor está abierto a DM sin una lista permitida, o
cuando una política está configurada de forma peligrosa.

### 10) Linger de systemd (Linux)

Si se ejecuta como servicio de usuario de systemd, doctor se asegura de que lingering esté habilitado para que el
gateway siga activo después de cerrar sesión.

### 11) Estado del workspace (Skills, plugins y directorios heredados)

Doctor imprime un resumen del estado del workspace para el agente predeterminado:

- **Estado de Skills**: cuenta Skills elegibles, con requisitos faltantes y bloqueadas por lista permitida.
- **Directorios heredados del workspace**: advierte cuando `~/openclaw` u otros directorios heredados del workspace
  existen junto al workspace actual.
- **Estado de plugins**: cuenta plugins cargados/deshabilitados/con error; enumera los ID de plugins con
  errores; informa las capacidades de plugins empaquetados.
- **Advertencias de compatibilidad de plugins**: marca plugins que tienen problemas de compatibilidad con
  el runtime actual.
- **Diagnósticos de plugins**: muestra cualquier advertencia o error de carga emitido por el
  registro de plugins.

### 11b) Tamaño del archivo bootstrap

Doctor comprueba si los archivos bootstrap del workspace (por ejemplo `AGENTS.md`,
`CLAUDE.md` u otros archivos de contexto inyectados) están cerca o por encima del
presupuesto de caracteres configurado. Informa por archivo los conteos de caracteres sin procesar vs. inyectados, el
porcentaje de truncamiento, la causa del truncamiento (`max/file` o `max/total`) y el total de
caracteres inyectados como fracción del presupuesto total. Cuando los archivos se truncan o están cerca
del límite, doctor imprime consejos para ajustar `agents.defaults.bootstrapMaxChars`
y `agents.defaults.bootstrapTotalMaxChars`.

### 11c) Autocompletado de shell

Doctor comprueba si el autocompletado por tabulador está instalado para el shell actual
(zsh, bash, fish o PowerShell):

- Si el perfil del shell usa un patrón lento de autocompletado dinámico
  (`source <(openclaw completion ...)`), doctor lo actualiza a la variante más rápida
  con archivo en caché.
- Si el autocompletado está configurado en el perfil pero falta el archivo de caché,
  doctor regenera la caché automáticamente.
- Si no hay autocompletado configurado en absoluto, doctor solicita instalarlo
  (solo en modo interactivo; se omite con `--non-interactive`).

Ejecuta `openclaw completion --write-state` para regenerar la caché manualmente.

### 12) Comprobaciones de autenticación del gateway (token local)

Doctor comprueba la preparación de la autenticación por token del gateway local.

- Si el modo token necesita un token y no existe ninguna fuente de token, doctor ofrece generar uno.
- Si `gateway.auth.token` está gestionado por SecretRef pero no disponible, doctor advierte y no lo sobrescribe con texto sin formato.
- `openclaw doctor --generate-gateway-token` fuerza la generación solo cuando no hay configurado ningún token SecretRef.

### 12b) Reparaciones de solo lectura compatibles con SecretRef

Algunos flujos de reparación necesitan inspeccionar credenciales configuradas sin debilitar el comportamiento fail-fast del runtime.

- `openclaw doctor --fix` ahora usa el mismo modelo de resumen de SecretRef de solo lectura que los comandos de la familia status para reparaciones de configuración específicas.
- Ejemplo: la reparación de `allowFrom` / `groupAllowFrom` de Telegram con `@username` intenta usar credenciales del bot configuradas cuando están disponibles.
- Si el token del bot de Telegram está configurado mediante SecretRef pero no está disponible en la ruta actual del comando, doctor informa que la credencial está configurada pero no disponible y omite la resolución automática en lugar de fallar o informar incorrectamente que falta el token.

### 13) Comprobación de estado del gateway + reinicio

Doctor ejecuta una comprobación de estado y ofrece reiniciar el gateway cuando parece
no saludable.

### 13b) Preparación de memory search

Doctor comprueba si el proveedor de embeddings configurado de memory search está listo
para el agente predeterminado. El comportamiento depende del backend y proveedor configurados:

- **Backend QMD**: sondea si el binario `qmd` está disponible y puede iniciarse.
  Si no, imprime orientación de corrección, incluido el paquete npm y una opción de ruta binaria manual.
- **Proveedor local explícito**: comprueba si existe un archivo de modelo local o una URL de modelo remoto/descargable reconocida. Si falta, sugiere cambiar a un proveedor remoto.
- **Proveedor remoto explícito** (`openai`, `voyage`, etc.): verifica que haya una clave de API
  presente en el entorno o en el almacén de autenticación. Imprime sugerencias de corrección accionables si falta.
- **Proveedor automático**: comprueba primero la disponibilidad del modelo local y luego prueba cada proveedor remoto
  en orden de selección automática.

Cuando hay disponible un resultado de sondeo del gateway (el gateway estaba en buen estado en el momento de la
comprobación), doctor cruza ese resultado con la configuración visible desde la CLI y señala
cualquier discrepancia.

Usa `openclaw memory status --deep` para verificar la preparación de embeddings en runtime.

### 14) Advertencias de estado de canales

Si el gateway está en buen estado, doctor ejecuta un sondeo de estado de canales e informa
advertencias con correcciones sugeridas.

### 15) Auditoría + reparación de configuración del supervisor

Doctor comprueba que la configuración instalada del supervisor (launchd/systemd/schtasks) no tenga
valores predeterminados faltantes u obsoletos (por ejemplo, dependencias `network-online` de systemd y
retraso de reinicio). Cuando encuentra una discrepancia, recomienda una actualización y puede
reescribir el archivo de servicio/tarea con los valores predeterminados actuales.

Notas:

- `openclaw doctor` solicita confirmación antes de reescribir la configuración del supervisor.
- `openclaw doctor --yes` acepta las solicitudes de reparación predeterminadas.
- `openclaw doctor --repair` aplica las correcciones recomendadas sin solicitudes.
- `openclaw doctor --repair --force` sobrescribe configuraciones personalizadas del supervisor.
- Si la autenticación por token requiere un token y `gateway.auth.token` está gestionado por SecretRef, la instalación/reparación del servicio de doctor valida el SecretRef pero no persiste valores de token resueltos en texto sin formato en los metadatos del entorno del servicio del supervisor.
- Si la autenticación por token requiere un token y el token SecretRef configurado no está resuelto, doctor bloquea la ruta de instalación/reparación con orientación accionable.
- Si tanto `gateway.auth.token` como `gateway.auth.password` están configurados y `gateway.auth.mode` no está establecido, doctor bloquea la instalación/reparación hasta que el modo se establezca explícitamente.
- Para unidades user-systemd de Linux, las comprobaciones de deriva de token de doctor ahora incluyen tanto fuentes `Environment=` como `EnvironmentFile=` al comparar metadatos de autenticación del servicio.
- Siempre puedes forzar una reescritura completa mediante `openclaw gateway install --force`.

### 16) Diagnósticos de runtime + puerto del gateway

Doctor inspecciona el runtime del servicio (PID, último estado de salida) y advierte cuando el
servicio está instalado pero no realmente en ejecución. También comprueba colisiones de puerto
en el puerto del gateway (predeterminado `18789`) e informa las causas probables (gateway ya
en ejecución, túnel SSH).

### 17) Mejores prácticas del runtime del gateway

Doctor advierte cuando el servicio del gateway se ejecuta con Bun o con una ruta de Node gestionada por versión
(`nvm`, `fnm`, `volta`, `asdf`, etc.). Los canales de WhatsApp + Telegram requieren Node,
y las rutas de gestores de versiones pueden romperse tras actualizaciones porque el servicio no
carga la inicialización de tu shell. Doctor ofrece migrar a una instalación de Node del sistema cuando
esté disponible (Homebrew/apt/choco).

### 18) Escritura de configuración + metadatos del asistente

Doctor persiste cualquier cambio de configuración y marca metadatos del asistente para registrar la
ejecución de doctor.

### 19) Consejos del workspace (copia de seguridad + sistema de memoria)

Doctor sugiere un sistema de memoria del workspace cuando falta e imprime un consejo de copia de seguridad
si el workspace no está ya bajo git.

Consulta [/concepts/agent-workspace](/es/concepts/agent-workspace) para ver una guía completa sobre la
estructura del workspace y la copia de seguridad con git (se recomienda GitHub o GitLab privados).
