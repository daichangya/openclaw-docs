---
read_when:
    - El centro de solución de problemas te dirigió aquí para un diagnóstico más profundo
    - Necesitas secciones estables del runbook basadas en síntomas con comandos exactos
summary: Runbook detallado de solución de problemas para gateway, canales, automatización, Nodes y browser
title: Solución de problemas
x-i18n:
    generated_at: "2026-04-25T13:48:18Z"
    model: gpt-5.4
    provider: openai
    source_hash: c2270f05cf34592269894278e1eb75b8d47c02a4ff1c74bf62afb3d8f4fc4640
    source_path: gateway/troubleshooting.md
    workflow: 15
---

# Solución de problemas del Gateway

Esta página es el runbook detallado.
Empieza en [/help/troubleshooting](/es/help/troubleshooting) si primero quieres el flujo de triaje rápido.

## Escalera de comandos

Ejecuta estos primero, en este orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Señales esperadas de buen estado:

- `openclaw gateway status` muestra `Runtime: running`, `Connectivity probe: ok` y una línea `Capability: ...`.
- `openclaw doctor` no informa problemas bloqueantes de configuración/servicio.
- `openclaw channels status --probe` muestra estado de transporte en vivo por cuenta y,
  cuando es compatible, resultados de sonda/auditoría como `works` o `audit ok`.

## Anthropic 429: uso adicional requerido para contexto largo

Usa esto cuando los logs/errores incluyan:
`HTTP 429: rate_limit_error: Extra usage is required for long context requests`.

```bash
openclaw logs --follow
openclaw models status
openclaw config get agents.defaults.models
```

Busca:

- El modelo Anthropic Opus/Sonnet seleccionado tiene `params.context1m: true`.
- La credencial actual de Anthropic no es apta para uso de contexto largo.
- Las solicitudes fallan solo en sesiones largas/ejecuciones de modelo que necesitan la ruta beta de 1M.

Opciones para corregir:

1. Desactiva `context1m` para ese modelo y así usar como respaldo la ventana de contexto normal.
2. Usa una credencial de Anthropic que sea apta para solicitudes de contexto largo, o cambia a una clave API de Anthropic.
3. Configura modelos de respaldo para que las ejecuciones continúen cuando se rechacen las solicitudes de contexto largo de Anthropic.

Relacionado:

- [Anthropic](/es/providers/anthropic)
- [Uso de tokens y costos](/es/reference/token-use)
- [¿Por qué veo HTTP 429 de Anthropic?](/es/help/faq-first-run#why-am-i-seeing-http-429-ratelimiterror-from-anthropic)

## El backend local compatible con OpenAI pasa sondas directas, pero fallan las ejecuciones del agente

Usa esto cuando:

- `curl ... /v1/models` funciona
- las llamadas directas pequeñas a `/v1/chat/completions` funcionan
- las ejecuciones de modelos de OpenClaw fallan solo en turnos normales del agente

```bash
curl http://127.0.0.1:1234/v1/models
curl http://127.0.0.1:1234/v1/chat/completions \
  -H 'content-type: application/json' \
  -d '{"model":"<id>","messages":[{"role":"user","content":"hi"}],"stream":false}'
openclaw infer model run --model <provider/model> --prompt "hi" --json
openclaw logs --follow
```

Busca:

- las llamadas directas pequeñas tienen éxito, pero las ejecuciones de OpenClaw fallan solo con prompts más grandes
- errores del backend sobre `messages[].content` que espera una cadena
- fallos del backend que aparecen solo con recuentos mayores de tokens del prompt o con prompts completos del runtime del agente

Firmas comunes:

- `messages[...].content: invalid type: sequence, expected a string` → el backend
  rechaza partes estructuradas de contenido de Chat Completions. Solución: establece
  `models.providers.<provider>.models[].compat.requiresStringContent: true`.
- las solicitudes directas pequeñas tienen éxito, pero las ejecuciones del agente OpenClaw fallan con
  fallos del backend/modelo (por ejemplo Gemma en algunas compilaciones `inferrs`) → el transporte de OpenClaw
  probablemente ya es correcto; el backend está fallando con la forma más grande
  del prompt del runtime del agente.
- los fallos se reducen después de desactivar herramientas, pero no desaparecen → los esquemas de herramientas
  formaban parte de la presión, pero el problema restante sigue siendo la capacidad ascendente del servidor/modelo o un bug del backend.

Opciones para corregir:

1. Establece `compat.requiresStringContent: true` para backends de Chat Completions que solo admiten cadenas.
2. Establece `compat.supportsTools: false` para modelos/backends que no pueden manejar
   de forma fiable la superficie de esquemas de herramientas de OpenClaw.
3. Reduce la presión del prompt cuando sea posible: bootstrap del espacio de trabajo más pequeño, historial
   de sesión más corto, modelo local más ligero o un backend con mejor compatibilidad
   de contexto largo.
4. Si las solicitudes directas pequeñas siguen funcionando mientras los turnos del agente OpenClaw siguen fallando
   dentro del backend, trátalo como una limitación ascendente del servidor/modelo y presenta
   allí un caso reproducible con la forma de payload aceptada.

Relacionado:

- [Modelos locales](/es/gateway/local-models)
- [Configuración](/es/gateway/configuration)
- [Endpoints compatibles con OpenAI](/es/gateway/configuration-reference#openai-compatible-endpoints)

## Sin respuestas

Si los canales están activos pero nada responde, revisa el enrutamiento y la política antes de reconectar nada.

```bash
openclaw status
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw config get channels
openclaw logs --follow
```

Busca:

- Emparejamiento pendiente para remitentes de mensajes directos.
- Restricción por mención en grupos (`requireMention`, `mentionPatterns`).
- Incompatibilidades de listas de permitidos de canal/grupo.

Firmas comunes:

- `drop guild message (mention required` → mensaje de grupo ignorado hasta que haya una mención.
- `pairing request` → el remitente necesita aprobación.
- `blocked` / `allowlist` → el remitente/canal fue filtrado por la política.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [Emparejamiento](/es/channels/pairing)
- [Grupos](/es/channels/groups)

## Conectividad de la interfaz de usuario de Dashboard/Control

Cuando dashboard/la interfaz de usuario de Control no puede conectarse, valida la URL, el modo de autenticación y las suposiciones de contexto seguro.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --json
```

Busca:

- URL correcta de sonda y URL correcta de dashboard.
- Incompatibilidad entre el modo de autenticación/token del cliente y el gateway.
- Uso de HTTP donde se requiere identidad del dispositivo.

Firmas comunes:

- `device identity required` → contexto no seguro o falta autenticación del dispositivo.
- `origin not allowed` → el `Origin` del navegador no está en `gateway.controlUi.allowedOrigins`
  (o te estás conectando desde un origen de navegador no loopback sin una
  lista de permitidos explícita).
- `device nonce required` / `device nonce mismatch` → el cliente no está completando el
  flujo de autenticación del dispositivo basado en desafío (`connect.challenge` + `device.nonce`).
- `device signature invalid` / `device signature expired` → el cliente firmó el payload incorrecto
  (o con una marca de tiempo obsoleta) para el handshake actual.
- `AUTH_TOKEN_MISMATCH` con `canRetryWithDeviceToken=true` → el cliente puede hacer un reintento confiable usando el token de dispositivo en caché.
- Ese reintento con token en caché reutiliza el conjunto de alcances en caché almacenado con el
  token de dispositivo emparejado. Quienes llaman con `deviceToken` explícito / `scopes` explícitos conservan su
  conjunto de alcances solicitado.
- Fuera de esa ruta de reintento, la precedencia de autenticación de conexión es primero
  token/contraseña compartidos explícitos, luego `deviceToken` explícito, luego token de dispositivo almacenado,
  luego token bootstrap.
- En la ruta asíncrona de la interfaz de usuario de Control de Tailscale Serve, los intentos fallidos para el mismo
  `{scope, ip}` se serializan antes de que el limitador registre el fallo. Dos reintentos concurrentes incorrectos del mismo cliente pueden por lo tanto mostrar `retry later`
  en el segundo intento en lugar de dos incompatibilidades simples.
- `too many failed authentication attempts (retry later)` desde un cliente loopback con origen de navegador
  → los fallos repetidos desde ese mismo `Origin` normalizado se bloquean temporalmente; otro origen localhost usa un bucket separado.
- `unauthorized` repetido después de ese reintento → desajuste de token compartido/token de dispositivo; actualiza la configuración del token y vuelve a aprobar/rotar el token del dispositivo si es necesario.
- `gateway connect failed:` → destino de host/puerto/url incorrecto.

### Mapa rápido de códigos detallados de autenticación

Usa `error.details.code` de la respuesta fallida de `connect` para elegir la siguiente acción:

| Detail code                  | Significado                                                                                                                                                                                | Acción recomendada                                                                                                                                                                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AUTH_TOKEN_MISSING`         | El cliente no envió un token compartido requerido.                                                                                                                                         | Pega/configura el token en el cliente y vuelve a intentarlo. Para rutas de dashboard: `openclaw config get gateway.auth.token` y luego pégalo en la configuración de la interfaz de usuario de Control.                                                                             |
| `AUTH_TOKEN_MISMATCH`        | El token compartido no coincidió con el token de autenticación del gateway.                                                                                                                | Si `canRetryWithDeviceToken=true`, permite un reintento confiable. Los reintentos con token en caché reutilizan los alcances aprobados almacenados; quienes llaman con `deviceToken` / `scopes` explícitos conservan los alcances solicitados. Si sigue fallando, ejecuta la [lista de verificación de recuperación por deriva de token](/es/cli/devices#token-drift-recovery-checklist). |
| `AUTH_DEVICE_TOKEN_MISMATCH` | El token por dispositivo en caché está obsoleto o fue revocado.                                                                                                                            | Rota/vuelve a aprobar el token del dispositivo usando la [CLI de devices](/es/cli/devices), y luego vuelve a conectar.                                                                                                                                                                   |
| `PAIRING_REQUIRED`           | La identidad del dispositivo necesita aprobación. Revisa `error.details.reason` para `not-paired`, `scope-upgrade`, `role-upgrade` o `metadata-upgrade`, y usa `requestId` / `remediationHint` cuando estén presentes. | Aprueba la solicitud pendiente: `openclaw devices list` y luego `openclaw devices approve <requestId>`. Las actualizaciones de alcance/rol usan el mismo flujo después de revisar el acceso solicitado.                                                                              |

Comprobación de migración a autenticación de dispositivo v2:

```bash
openclaw --version
openclaw doctor
openclaw gateway status
```

Si los logs muestran errores de nonce/firma, actualiza el cliente que se conecta y verifica que:

1. espere `connect.challenge`
2. firme el payload vinculado al desafío
3. envíe `connect.params.device.nonce` con el mismo nonce del desafío

Si `openclaw devices rotate` / `revoke` / `remove` se deniega inesperadamente:

- las sesiones con token de dispositivo emparejado solo pueden administrar **su propio** dispositivo, a menos que quien llama también tenga `operator.admin`
- `openclaw devices rotate --scope ...` solo puede solicitar alcances de operador que
  la sesión llamadora ya posea

Relacionado:

- [Interfaz de usuario de Control](/es/web/control-ui)
- [Configuración](/es/gateway/configuration) (modos de autenticación del gateway)
- [Autenticación con proxy confiable](/es/gateway/trusted-proxy-auth)
- [Acceso remoto](/es/gateway/remote)
- [Devices](/es/cli/devices)

## El servicio del Gateway no está en ejecución

Usa esto cuando el servicio está instalado pero el proceso no se mantiene activo.

```bash
openclaw gateway status
openclaw status
openclaw logs --follow
openclaw doctor
openclaw gateway status --deep   # also scan system-level services
```

Busca:

- `Runtime: stopped` con pistas de salida.
- Incompatibilidad de configuración (`Config (cli)` frente a `Config (service)`).
- Conflictos de puerto/listener.
- Instalaciones adicionales de launchd/systemd/schtasks cuando se usa `--deep`.
- Pistas de limpieza de `Other gateway-like services detected (best effort)`.

Firmas comunes:

- `Gateway start blocked: set gateway.mode=local` o `existing config is missing gateway.mode` → el modo gateway local no está habilitado, o el archivo de configuración fue sobrescrito y perdió `gateway.mode`. Solución: establece `gateway.mode="local"` en tu configuración, o vuelve a ejecutar `openclaw onboard --mode local` / `openclaw setup` para volver a sellar la configuración esperada de modo local. Si ejecutas OpenClaw mediante Podman, la ruta de configuración predeterminada es `~/.openclaw/openclaw.json`.
- `refusing to bind gateway ... without auth` → enlace no loopback sin una ruta válida de autenticación del gateway (token/contraseña, o trusted-proxy cuando está configurado).
- `another gateway instance is already listening` / `EADDRINUSE` → conflicto de puertos.
- `Other gateway-like services detected (best effort)` → existen unidades launchd/systemd/schtasks obsoletas o paralelas. La mayoría de las configuraciones deberían mantener un gateway por máquina; si realmente necesitas más de uno, aísla puertos + configuración/estado/espacio de trabajo. Consulta [/gateway#multiple-gateways-same-host](/es/gateway#multiple-gateways-same-host).

Relacionado:

- [Exec en segundo plano y herramienta process](/es/gateway/background-process)
- [Configuración](/es/gateway/configuration)
- [Doctor](/es/gateway/doctor)

## El Gateway restauró la configuración válida conocida más reciente

Usa esto cuando el Gateway inicia, pero los logs dicen que restauró `openclaw.json`.

```bash
openclaw logs --follow
openclaw config file
openclaw config validate
openclaw doctor
```

Busca:

- `Config auto-restored from last-known-good`
- `gateway: invalid config was restored from last-known-good backup`
- `config reload restored last-known-good config after invalid-config`
- Un archivo con marca de tiempo `openclaw.json.clobbered.*` junto a la configuración activa
- Un evento del sistema del agente principal que comienza con `Config recovery warning`

Qué ocurrió:

- La configuración rechazada no pasó la validación durante el inicio o la recarga en caliente.
- OpenClaw conservó el payload rechazado como `.clobbered.*`.
- La configuración activa se restauró a partir de la última copia válida conocida y validada.
- El siguiente turno del agente principal recibe una advertencia para no reescribir a ciegas la configuración rechazada.
- Si todos los problemas de validación estaban bajo `plugins.entries.<id>...`, OpenClaw no restauraría el archivo completo. Los fallos locales del Plugin siguen siendo visibles mientras las configuraciones del usuario no relacionadas permanecen en la configuración activa.

Inspeccionar y reparar:

```bash
CONFIG="$(openclaw config file)"
ls -lt "$CONFIG".clobbered.* "$CONFIG".rejected.* 2>/dev/null | head
diff -u "$CONFIG" "$(ls -t "$CONFIG".clobbered.* 2>/dev/null | head -n 1)"
openclaw config validate
openclaw doctor
```

Firmas comunes:

- existe `.clobbered.*` → una edición directa externa o una lectura al inicio fue restaurada.
- existe `.rejected.*` → una escritura de configuración propiedad de OpenClaw no pasó las comprobaciones de esquema o sobrescritura antes del commit.
- `Config write rejected:` → la escritura intentó eliminar una forma requerida, reducir drásticamente el tamaño del archivo o persistir una configuración no válida.
- `missing-meta-vs-last-good`, `gateway-mode-missing-vs-last-good` o `size-drop-vs-last-good:*` → durante el inicio, el archivo actual se trató como sobrescrito porque perdió campos o tamaño en comparación con la copia válida conocida más reciente.
- `Config last-known-good promotion skipped` → el candidato contenía marcadores de secretos redactados como `***`.

Opciones para corregir:

1. Conserva la configuración activa restaurada si es correcta.
2. Copia solo las claves previstas desde `.clobbered.*` o `.rejected.*`, y luego aplícalas con `openclaw config set` o `config.patch`.
3. Ejecuta `openclaw config validate` antes de reiniciar.
4. Si editas manualmente, conserva la configuración JSON5 completa, no solo el objeto parcial que querías cambiar.

Relacionado:

- [Configuración: validación estricta](/es/gateway/configuration#strict-validation)
- [Configuración: recarga en caliente](/es/gateway/configuration#config-hot-reload)
- [Config](/es/cli/config)
- [Doctor](/es/gateway/doctor)

## Advertencias de `gateway probe`

Usa esto cuando `openclaw gateway probe` llega a algo, pero aun así imprime un bloque de advertencia.

```bash
openclaw gateway probe
openclaw gateway probe --json
openclaw gateway probe --ssh user@gateway-host
```

Busca:

- `warnings[].code` y `primaryTargetId` en la salida JSON.
- Si la advertencia es sobre fallback SSH, varios gateways, alcances faltantes o referencias de autenticación sin resolver.

Firmas comunes:

- `SSH tunnel failed to start; falling back to direct probes.` → la configuración SSH falló, pero el comando igualmente probó los destinos directos configurados/loopback.
- `multiple reachable gateways detected` → respondió más de un destino. Normalmente esto significa una configuración intencional de múltiples gateways o listeners obsoletos/duplicados.
- `Read-probe diagnostics are limited by gateway scopes (missing operator.read)` → la conexión funcionó, pero el RPC detallado está limitado por alcances; empareja la identidad del dispositivo o usa credenciales con `operator.read`.
- `Capability: pairing-pending` o `gateway closed (1008): pairing required` → el gateway respondió, pero este cliente aún necesita emparejamiento/aprobación antes del acceso normal de operador.
- texto de advertencia de SecretRef sin resolver en `gateway.auth.*` / `gateway.remote.*` → el material de autenticación no estaba disponible en esta ruta del comando para el destino fallido.

Relacionado:

- [Gateway](/es/cli/gateway)
- [Varios gateways en el mismo host](/es/gateway#multiple-gateways-same-host)
- [Acceso remoto](/es/gateway/remote)

## El canal está conectado pero los mensajes no fluyen

Si el estado del canal es conectado pero el flujo de mensajes está muerto, concéntrate en la política, los permisos y las reglas de entrega específicas del canal.

```bash
openclaw channels status --probe
openclaw pairing list --channel <channel> [--account <id>]
openclaw status --deep
openclaw logs --follow
openclaw config get channels
```

Busca:

- Política de mensajes directos (`pairing`, `allowlist`, `open`, `disabled`).
- Lista de permitidos de grupo y requisitos de mención.
- Permisos/alcances faltantes de la API del canal.

Firmas comunes:

- `mention required` → mensaje ignorado por la política de mención del grupo.
- trazas `pairing` / aprobación pendiente → el remitente no está aprobado.
- `missing_scope`, `not_in_channel`, `Forbidden`, `401/403` → problema de autenticación/permisos del canal.

Relacionado:

- [Solución de problemas de canales](/es/channels/troubleshooting)
- [WhatsApp](/es/channels/whatsapp)
- [Telegram](/es/channels/telegram)
- [Discord](/es/channels/discord)

## Entrega de Cron y Heartbeat

Si Cron o Heartbeat no se ejecutó o no entregó, verifica primero el estado del programador y luego el destino de entrega.

```bash
openclaw cron status
openclaw cron list
openclaw cron runs --id <jobId> --limit 20
openclaw system heartbeat last
openclaw logs --follow
```

Busca:

- Cron habilitado y próxima activación presente.
- Estado del historial de ejecución del trabajo (`ok`, `skipped`, `error`).
- Motivos de omisión de Heartbeat (`quiet-hours`, `requests-in-flight`, `alerts-disabled`, `empty-heartbeat-file`, `no-tasks-due`).

Firmas comunes:

- `cron: scheduler disabled; jobs will not run automatically` → Cron deshabilitado.
- `cron: timer tick failed` → falló el tick del programador; revisa errores de archivo/log/runtime.
- `heartbeat skipped` con `reason=quiet-hours` → fuera de la ventana de horas activas.
- `heartbeat skipped` con `reason=empty-heartbeat-file` → `HEARTBEAT.md` existe pero solo contiene líneas en blanco / encabezados markdown, así que OpenClaw omite la llamada al modelo.
- `heartbeat skipped` con `reason=no-tasks-due` → `HEARTBEAT.md` contiene un bloque `tasks:`, pero ninguna de las tareas vence en este tick.
- `heartbeat: unknown accountId` → id de cuenta no válido para el destino de entrega de Heartbeat.
- `heartbeat skipped` con `reason=dm-blocked` → el destino de Heartbeat se resolvió como un destino de estilo mensaje directo mientras `agents.defaults.heartbeat.directPolicy` (o la sobrescritura por agente) está establecido en `block`.

Relacionado:

- [Tareas programadas: solución de problemas](/es/automation/cron-jobs#troubleshooting)
- [Tareas programadas](/es/automation/cron-jobs)
- [Heartbeat](/es/gateway/heartbeat)

## Falla una herramienta de Node emparejada

Si un Node está emparejado pero las herramientas fallan, aísla el estado de primer plano, permisos y aprobaciones.

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
openclaw status
```

Busca:

- Node en línea con las capacidades esperadas.
- Permisos del sistema operativo concedidos para cámara/micrófono/ubicación/pantalla.
- Aprobaciones de exec y estado de la lista de permitidos.

Firmas comunes:

- `NODE_BACKGROUND_UNAVAILABLE` → la app de Node debe estar en primer plano.
- `*_PERMISSION_REQUIRED` / `LOCATION_PERMISSION_REQUIRED` → falta un permiso del sistema operativo.
- `SYSTEM_RUN_DENIED: approval required` → aprobación de exec pendiente.
- `SYSTEM_RUN_DENIED: allowlist miss` → comando bloqueado por la lista de permitidos.

Relacionado:

- [Solución de problemas de Node](/es/nodes/troubleshooting)
- [Nodes](/es/nodes/index)
- [Aprobaciones de exec](/es/tools/exec-approvals)

## Falla la herramienta browser

Usa esto cuando las acciones de la herramienta browser fallan aunque el gateway en sí esté en buen estado.

```bash
openclaw browser status
openclaw browser start --browser-profile openclaw
openclaw browser profiles
openclaw logs --follow
openclaw doctor
```

Busca:

- Si `plugins.allow` está establecido e incluye `browser`.
- Ruta válida del ejecutable del browser.
- Alcance del perfil CDP.
- Disponibilidad local de Chrome para perfiles `existing-session` / `user`.

Firmas comunes:

- `unknown command "browser"` o `unknown command 'browser'` → el Plugin browser incluido está excluido por `plugins.allow`.
- la herramienta browser falta / no está disponible mientras `browser.enabled=true` → `plugins.allow` excluye `browser`, por lo que el Plugin nunca se cargó.
- `Failed to start Chrome CDP on port` → el proceso del browser no pudo iniciarse.
- `browser.executablePath not found` → la ruta configurada no es válida.
- `browser.cdpUrl must be http(s) or ws(s)` → la URL CDP configurada usa un esquema no compatible como `file:` o `ftp:`.
- `browser.cdpUrl has invalid port` → la URL CDP configurada tiene un puerto incorrecto o fuera de rango.
- `Could not find DevToolsActivePort for chrome` → Chrome MCP existing-session todavía no pudo adjuntarse al directorio de datos del browser seleccionado. Abre la página de inspección del browser, habilita la depuración remota, mantén el browser abierto, aprueba el primer prompt de adjuntar y vuelve a intentarlo. Si no necesitas el estado de sesión iniciada, prefiere el perfil administrado `openclaw`.
- `No Chrome tabs found for profile="user"` → el perfil de adjuntar Chrome MCP no tiene pestañas locales de Chrome abiertas.
- `Remote CDP for profile "<name>" is not reachable` → el endpoint CDP remoto configurado no es accesible desde el host del gateway.
- `Browser attachOnly is enabled ... not reachable` o `Browser attachOnly is enabled and CDP websocket ... is not reachable` → el perfil de solo adjuntar no tiene un destino accesible, o el endpoint HTTP respondió pero aun así no se pudo abrir el WebSocket CDP.
- `Playwright is not available in this gateway build; '<feature>' is unsupported.` → la instalación actual del gateway no tiene la dependencia de runtime `playwright-core` del Plugin browser incluido; ejecuta `openclaw doctor --fix` y luego reinicia el gateway. Las instantáneas ARIA y las capturas de pantalla básicas de páginas aún pueden funcionar, pero la navegación, las instantáneas de IA, las capturas de elementos por selector CSS y la exportación a PDF seguirán sin estar disponibles.
- `fullPage is not supported for element screenshots` → la solicitud de captura mezcló `--full-page` con `--ref` o `--element`.
- `element screenshots are not supported for existing-session profiles; use ref from snapshot.` → las llamadas de captura de pantalla de Chrome MCP / `existing-session` deben usar captura de página o un `--ref` de snapshot, no `--element` CSS.
- `existing-session file uploads do not support element selectors; use ref/inputRef.` → los hooks de carga de Chrome MCP necesitan referencias de snapshot, no selectores CSS.
- `existing-session file uploads currently support one file at a time.` → envía una carga por llamada en perfiles Chrome MCP.
- `existing-session dialog handling does not support timeoutMs.` → los hooks de diálogo en perfiles Chrome MCP no admiten sobrescrituras de timeout.
- `existing-session type does not support timeoutMs overrides.` → omite `timeoutMs` para `act:type` en perfiles `profile="user"` / Chrome MCP existing-session, o usa un perfil browser administrado/CDP cuando necesites un timeout personalizado.
- `existing-session evaluate does not support timeoutMs overrides.` → omite `timeoutMs` para `act:evaluate` en perfiles `profile="user"` / Chrome MCP existing-session, o usa un perfil browser administrado/CDP cuando necesites un timeout personalizado.
- `response body is not supported for existing-session profiles yet.` → `responsebody` todavía requiere un browser administrado o un perfil CDP sin procesar.
- sobrescrituras obsoletas de viewport / modo oscuro / configuración regional / modo offline en perfiles attach-only o CDP remotos → ejecuta `openclaw browser stop --browser-profile <name>` para cerrar la sesión de control activa y liberar el estado de emulación de Playwright/CDP sin reiniciar todo el gateway.

Relacionado:

- [Solución de problemas de browser](/es/tools/browser-linux-troubleshooting)
- [Browser (administrado por OpenClaw)](/es/tools/browser)

## Si actualizaste y algo dejó de funcionar de repente

La mayoría de las fallas posteriores a una actualización son deriva de configuración o valores predeterminados más estrictos que ahora se están aplicando.

### 1) Cambió el comportamiento de autenticación y sobrescritura de URL

```bash
openclaw gateway status
openclaw config get gateway.mode
openclaw config get gateway.remote.url
openclaw config get gateway.auth.mode
```

Qué revisar:

- Si `gateway.mode=remote`, las llamadas de la CLI pueden estar apuntando a remoto mientras tu servicio local está bien.
- Las llamadas explícitas con `--url` no usan como respaldo las credenciales almacenadas.

Firmas comunes:

- `gateway connect failed:` → destino de URL incorrecto.
- `unauthorized` → el endpoint es accesible pero la autenticación es incorrecta.

### 2) Las protecciones de bind y auth son más estrictas

```bash
openclaw config get gateway.bind
openclaw config get gateway.auth.mode
openclaw config get gateway.auth.token
openclaw gateway status
openclaw logs --follow
```

Qué revisar:

- Los binds no loopback (`lan`, `tailnet`, `custom`) necesitan una ruta válida de autenticación del gateway: autenticación compartida con token/contraseña, o una implementación `trusted-proxy` no loopback correctamente configurada.
- Claves antiguas como `gateway.token` no reemplazan `gateway.auth.token`.

Firmas comunes:

- `refusing to bind gateway ... without auth` → bind no loopback sin una ruta válida de autenticación del gateway.
- `Connectivity probe: failed` mientras el runtime está en ejecución → el gateway está activo pero inaccesible con la autenticación/URL actual.

### 3) Cambió el estado de emparejamiento e identidad del dispositivo

```bash
openclaw devices list
openclaw pairing list --channel <channel> [--account <id>]
openclaw logs --follow
openclaw doctor
```

Qué revisar:

- Aprobaciones pendientes de dispositivos para dashboard/nodes.
- Aprobaciones pendientes de emparejamiento de mensajes directos después de cambios de política o identidad.

Firmas comunes:

- `device identity required` → la autenticación del dispositivo no está satisfecha.
- `pairing required` → el remitente/dispositivo debe ser aprobado.

Si la configuración del servicio y el runtime siguen sin coincidir después de las comprobaciones, reinstala los metadatos del servicio desde el mismo perfil/directorio de estado:

```bash
openclaw gateway install --force
openclaw gateway restart
```

Relacionado:

- [Emparejamiento administrado por el Gateway](/es/gateway/pairing)
- [Autenticación](/es/gateway/authentication)
- [Exec en segundo plano y herramienta process](/es/gateway/background-process)

## Relacionado

- [Runbook del Gateway](/es/gateway)
- [Doctor](/es/gateway/doctor)
- [FAQ](/es/help/faq)
