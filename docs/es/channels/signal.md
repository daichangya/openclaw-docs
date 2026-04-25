---
read_when:
    - Configurar la compatibilidad con Signal
    - Depurar el envío y la recepción de Signal
summary: Compatibilidad con Signal mediante signal-cli (JSON-RPC + SSE), rutas de configuración y modelo de números
title: Signal
x-i18n:
    generated_at: "2026-04-25T13:41:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: cb1ff4328aae73576a78b00be3dd79e9768badfc6193843ed3c05439765ae295
    source_path: channels/signal.md
    workflow: 15
---

Estado: integración con CLI externa. El Gateway se comunica con `signal-cli` mediante HTTP JSON-RPC + SSE.

## Requisitos previos

- OpenClaw instalado en tu servidor (el flujo de Linux a continuación se probó en Ubuntu 24).
- `signal-cli` disponible en el host donde se ejecuta el gateway.
- Un número de teléfono que pueda recibir un SMS de verificación (para la ruta de registro por SMS).
- Acceso a un navegador para el captcha de Signal (`signalcaptchas.org`) durante el registro.

## Configuración rápida (principiantes)

1. Usa un **número de Signal separado** para el bot (recomendado).
2. Instala `signal-cli` (se requiere Java si usas la compilación JVM).
3. Elige una ruta de configuración:
   - **Ruta A (enlace por QR):** `signal-cli link -n "OpenClaw"` y escanea con Signal.
   - **Ruta B (registro por SMS):** registra un número dedicado con captcha + verificación por SMS.
4. Configura OpenClaw y reinicia el gateway.
5. Envía un primer mensaje directo y aprueba el emparejamiento (`openclaw pairing approve signal <CODE>`).

Configuración mínima:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Referencia de campos:

| Campo       | Descripción                                        |
| ----------- | -------------------------------------------------- |
| `account`   | Número de teléfono del bot en formato E.164 (`+15551234567`) |
| `cliPath`   | Ruta a `signal-cli` (`signal-cli` si está en `PATH`) |
| `dmPolicy`  | Política de acceso a mensajes directos (`pairing` recomendado) |
| `allowFrom` | Números de teléfono o valores `uuid:<id>` autorizados para enviar mensajes directos |

## Qué es

- Canal de Signal mediante `signal-cli` (no una libsignal integrada).
- Enrutamiento determinista: las respuestas siempre vuelven a Signal.
- Los mensajes directos comparten la sesión principal del agente; los grupos están aislados (`agent:<agentId>:signal:group:<groupId>`).

## Escrituras de configuración

Por defecto, Signal puede escribir actualizaciones de configuración activadas por `/config set|unset` (requiere `commands.config: true`).

Desactívalo con:

```json5
{
  channels: { signal: { configWrites: false } },
}
```

## El modelo de números (importante)

- El gateway se conecta a un **dispositivo Signal** (la cuenta de `signal-cli`).
- Si ejecutas el bot en **tu cuenta personal de Signal**, ignorará tus propios mensajes (protección contra bucles).
- Para “yo le escribo al bot y responde”, usa un **número de bot separado**.

## Ruta de configuración A: enlazar una cuenta de Signal existente (QR)

1. Instala `signal-cli` (compilación JVM o nativa).
2. Enlaza una cuenta de bot:
   - `signal-cli link -n "OpenClaw"` y luego escanea el QR en Signal.
3. Configura Signal e inicia el gateway.

Ejemplo:

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15551234567",
      cliPath: "signal-cli",
      dmPolicy: "pairing",
      allowFrom: ["+15557654321"],
    },
  },
}
```

Compatibilidad con varias cuentas: usa `channels.signal.accounts` con configuración por cuenta y `name` opcional. Consulta [`gateway/configuration`](/es/gateway/config-channels#multi-account-all-channels) para el patrón compartido.

## Ruta de configuración B: registrar un número de bot dedicado (SMS, Linux)

Usa esto cuando quieras un número de bot dedicado en lugar de enlazar una cuenta de la app de Signal existente.

1. Consigue un número que pueda recibir SMS (o verificación por voz para líneas fijas).
   - Usa un número de bot dedicado para evitar conflictos de cuenta/sesión.
2. Instala `signal-cli` en el host del gateway:

```bash
VERSION=$(curl -Ls -o /dev/null -w %{url_effective} https://github.com/AsamK/signal-cli/releases/latest | sed -e 's/^.*\/v//')
curl -L -O "https://github.com/AsamK/signal-cli/releases/download/v${VERSION}/signal-cli-${VERSION}-Linux-native.tar.gz"
sudo tar xf "signal-cli-${VERSION}-Linux-native.tar.gz" -C /opt
sudo ln -sf /opt/signal-cli /usr/local/bin/
signal-cli --version
```

Si usas la compilación JVM (`signal-cli-${VERSION}.tar.gz`), instala primero JRE 25+.
Mantén `signal-cli` actualizado; upstream señala que las versiones antiguas pueden dejar de funcionar a medida que cambian las APIs del servidor de Signal.

3. Registra y verifica el número:

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register
```

Si se requiere captcha:

1. Abre `https://signalcaptchas.org/registration/generate.html`.
2. Completa el captcha y copia el destino del enlace `signalcaptcha://...` desde “Open Signal”.
3. Ejecuta desde la misma IP externa que la sesión del navegador cuando sea posible.
4. Ejecuta el registro de nuevo inmediatamente (los tokens de captcha caducan rápido):

```bash
signal-cli -a +<BOT_PHONE_NUMBER> register --captcha '<SIGNALCAPTCHA_URL>'
signal-cli -a +<BOT_PHONE_NUMBER> verify <VERIFICATION_CODE>
```

4. Configura OpenClaw, reinicia el gateway y verifica el canal:

```bash
# Si ejecutas el gateway como un servicio systemd de usuario:
systemctl --user restart openclaw-gateway.service

# Luego verifica:
openclaw doctor
openclaw channels status --probe
```

5. Empareja tu remitente de mensajes directos:
   - Envía cualquier mensaje al número del bot.
   - Aprueba el código en el servidor: `openclaw pairing approve signal <PAIRING_CODE>`.
   - Guarda el número del bot como contacto en tu teléfono para evitar “Unknown contact”.

Importante: registrar una cuenta de número de teléfono con `signal-cli` puede desautenticar la sesión principal de la app Signal para ese número. Prefiere un número de bot dedicado, o usa el modo de enlace por QR si necesitas conservar la configuración existente de tu app en el teléfono.

Referencias upstream:

- README de `signal-cli`: `https://github.com/AsamK/signal-cli`
- Flujo de captcha: `https://github.com/AsamK/signal-cli/wiki/Registration-with-captcha`
- Flujo de enlace: `https://github.com/AsamK/signal-cli/wiki/Linking-other-devices-(Provisioning)`

## Modo de daemon externo (httpUrl)

Si quieres administrar `signal-cli` tú mismo (inicios en frío lentos de JVM, inicialización de contenedor o CPUs compartidas), ejecuta el daemon por separado y haz que OpenClaw apunte a él:

```json5
{
  channels: {
    signal: {
      httpUrl: "http://127.0.0.1:8080",
      autoStart: false,
    },
  },
}
```

Esto omite el autoarranque y la espera de inicio dentro de OpenClaw. Para inicios lentos al usar autoarranque, configura `channels.signal.startupTimeoutMs`.

## Control de acceso (mensajes directos + grupos)

Mensajes directos:

- Predeterminado: `channels.signal.dmPolicy = "pairing"`.
- Los remitentes desconocidos reciben un código de emparejamiento; los mensajes se ignoran hasta que se aprueban (los códigos caducan después de 1 hora).
- Aprueba mediante:
  - `openclaw pairing list signal`
  - `openclaw pairing approve signal <CODE>`
- El emparejamiento es el intercambio de tokens predeterminado para los mensajes directos de Signal. Detalles: [Emparejamiento](/es/channels/pairing)
- Los remitentes solo con UUID (desde `sourceUuid`) se almacenan como `uuid:<id>` en `channels.signal.allowFrom`.

Grupos:

- `channels.signal.groupPolicy = open | allowlist | disabled`.
- `channels.signal.groupAllowFrom` controla quién puede activar en grupos cuando se establece `allowlist`.
- `channels.signal.groups["<group-id>" | "*"]` puede sobrescribir el comportamiento del grupo con `requireMention`, `tools` y `toolsBySender`.
- Usa `channels.signal.accounts.<id>.groups` para sobrescrituras por cuenta en configuraciones con varias cuentas.
- Nota de runtime: si falta por completo `channels.signal`, el runtime recurre a `groupPolicy="allowlist"` para las comprobaciones de grupos (incluso si está configurado `channels.defaults.groupPolicy`).

## Cómo funciona (comportamiento)

- `signal-cli` se ejecuta como daemon; el gateway lee eventos mediante SSE.
- Los mensajes entrantes se normalizan en el sobre compartido del canal.
- Las respuestas siempre se enrutan de vuelta al mismo número o grupo.

## Multimedia + límites

- El texto saliente se divide en fragmentos según `channels.signal.textChunkLimit` (por defecto 4000).
- Fragmentación opcional por saltos de línea: establece `channels.signal.chunkMode="newline"` para dividir por líneas en blanco (límites de párrafo) antes de dividir por longitud.
- Archivos adjuntos compatibles (base64 obtenido desde `signal-cli`).
- Los adjuntos de notas de voz usan el nombre de archivo de `signal-cli` como respaldo MIME cuando falta `contentType`, para que la transcripción de audio aún pueda clasificar notas de voz AAC.
- Límite multimedia predeterminado: `channels.signal.mediaMaxMb` (por defecto 8).
- Usa `channels.signal.ignoreAttachments` para omitir la descarga de multimedia.
- El contexto del historial de grupos usa `channels.signal.historyLimit` (o `channels.signal.accounts.*.historyLimit`), con fallback a `messages.groupChat.historyLimit`. Establece `0` para desactivar (por defecto 50).

## Escritura y confirmaciones de lectura

- **Indicadores de escritura**: OpenClaw envía señales de escritura mediante `signal-cli sendTyping` y las actualiza mientras se está generando una respuesta.
- **Confirmaciones de lectura**: cuando `channels.signal.sendReadReceipts` es true, OpenClaw reenvía confirmaciones de lectura para mensajes directos permitidos.
- Signal-cli no expone confirmaciones de lectura para grupos.

## Reacciones (herramienta message)

- Usa `message action=react` con `channel=signal`.
- Objetivos: E.164 del remitente o UUID (usa `uuid:<id>` desde la salida de emparejamiento; un UUID sin prefijo también funciona).
- `messageId` es la marca de tiempo de Signal del mensaje al que estás reaccionando.
- Las reacciones en grupos requieren `targetAuthor` o `targetAuthorUuid`.

Ejemplos:

```text
message action=react channel=signal target=uuid:123e4567-e89b-12d3-a456-426614174000 messageId=1737630212345 emoji=🔥
message action=react channel=signal target=+15551234567 messageId=1737630212345 emoji=🔥 remove=true
message action=react channel=signal target=signal:group:<groupId> targetAuthor=uuid:<sender-uuid> messageId=1737630212345 emoji=✅
```

Configuración:

- `channels.signal.actions.reactions`: habilita/deshabilita acciones de reacción (por defecto true).
- `channels.signal.reactionLevel`: `off | ack | minimal | extensive`.
  - `off`/`ack` desactiva las reacciones del agente (la herramienta `react` de message devolverá error).
  - `minimal`/`extensive` habilita las reacciones del agente y establece el nivel de guía.
- Sobrescrituras por cuenta: `channels.signal.accounts.<id>.actions.reactions`, `channels.signal.accounts.<id>.reactionLevel`.

## Objetivos de entrega (CLI/Cron)

- Mensajes directos: `signal:+15551234567` (o E.164 simple).
- Mensajes directos por UUID: `uuid:<id>` (o UUID sin prefijo).
- Grupos: `signal:group:<groupId>`.
- Nombres de usuario: `username:<name>` (si tu cuenta de Signal los admite).

## Solución de problemas

Ejecuta primero esta secuencia:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Luego confirma el estado del emparejamiento de mensajes directos si es necesario:

```bash
openclaw pairing list signal
```

Fallos comunes:

- El daemon es accesible pero no hay respuestas: verifica la configuración de cuenta/daemon (`httpUrl`, `account`) y el modo de recepción.
- Mensajes directos ignorados: el remitente está pendiente de aprobación de emparejamiento.
- Mensajes de grupo ignorados: el control de remitente/mención del grupo bloquea la entrega.
- Errores de validación de configuración después de editar: ejecuta `openclaw doctor --fix`.
- Signal no aparece en el diagnóstico: confirma `channels.signal.enabled: true`.

Comprobaciones adicionales:

```bash
openclaw pairing list signal
pgrep -af signal-cli
grep -i "signal" "/tmp/openclaw/openclaw-$(date +%Y-%m-%d).log" | tail -20
```

Para el flujo de triaje: [/channels/troubleshooting](/es/channels/troubleshooting).

## Notas de seguridad

- `signal-cli` almacena las claves de la cuenta localmente (normalmente en `~/.local/share/signal-cli/data/`).
- Haz copia de seguridad del estado de la cuenta de Signal antes de migrar o reconstruir el servidor.
- Mantén `channels.signal.dmPolicy: "pairing"` salvo que quieras explícitamente un acceso más amplio a mensajes directos.
- La verificación por SMS solo es necesaria para los flujos de registro o recuperación, pero perder el control del número/cuenta puede complicar el nuevo registro.

## Referencia de configuración (Signal)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones del proveedor:

- `channels.signal.enabled`: habilita/deshabilita el inicio del canal.
- `channels.signal.account`: E.164 para la cuenta del bot.
- `channels.signal.cliPath`: ruta a `signal-cli`.
- `channels.signal.httpUrl`: URL completa del daemon (sobrescribe host/port).
- `channels.signal.httpHost`, `channels.signal.httpPort`: enlace del daemon (por defecto 127.0.0.1:8080).
- `channels.signal.autoStart`: inicia automáticamente el daemon (por defecto true si `httpUrl` no está definido).
- `channels.signal.startupTimeoutMs`: tiempo de espera de inicio en ms (límite máximo 120000).
- `channels.signal.receiveMode`: `on-start | manual`.
- `channels.signal.ignoreAttachments`: omite las descargas de archivos adjuntos.
- `channels.signal.ignoreStories`: ignora las historias del daemon.
- `channels.signal.sendReadReceipts`: reenvía confirmaciones de lectura.
- `channels.signal.dmPolicy`: `pairing | allowlist | open | disabled` (por defecto: pairing).
- `channels.signal.allowFrom`: lista permitida de mensajes directos (E.164 o `uuid:<id>`). `open` requiere `"*"`. Signal no tiene nombres de usuario; usa identificadores de teléfono/UUID.
- `channels.signal.groupPolicy`: `open | allowlist | disabled` (por defecto: allowlist).
- `channels.signal.groupAllowFrom`: lista permitida de remitentes de grupo.
- `channels.signal.groups`: sobrescrituras por grupo indexadas por el id de grupo de Signal (o `"*"`). Campos compatibles: `requireMention`, `tools`, `toolsBySender`.
- `channels.signal.accounts.<id>.groups`: versión por cuenta de `channels.signal.groups` para configuraciones con varias cuentas.
- `channels.signal.historyLimit`: máximo de mensajes grupales que se incluirán como contexto (0 desactiva).
- `channels.signal.dmHistoryLimit`: límite del historial de mensajes directos en turnos de usuario. Sobrescrituras por usuario: `channels.signal.dms["<phone_or_uuid>"].historyLimit`.
- `channels.signal.textChunkLimit`: tamaño del fragmento saliente (caracteres).
- `channels.signal.chunkMode`: `length` (por defecto) o `newline` para dividir por líneas en blanco (límites de párrafo) antes de dividir por longitud.
- `channels.signal.mediaMaxMb`: límite de multimedia entrante/saliente (MB).

Opciones globales relacionadas:

- `agents.list[].groupChat.mentionPatterns` (Signal no admite menciones nativas).
- `messages.groupChat.mentionPatterns` (fallback global).
- `messages.responsePrefix`.

## Relacionado

- [Resumen de canales](/es/channels) — todos los canales compatibles
- [Emparejamiento](/es/channels/pairing) — autenticación de mensajes directos y flujo de emparejamiento
- [Grupos](/es/channels/groups) — comportamiento de chat grupal y control por menciones
- [Enrutamiento de canales](/es/channels/channel-routing) — enrutamiento de sesión para mensajes
- [Seguridad](/es/gateway/security) — modelo de acceso y endurecimiento
