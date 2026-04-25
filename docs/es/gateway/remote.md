---
read_when:
    - Ejecutar o solucionar problemas de configuraciones remotas de gateway
summary: Acceso remoto mediante túneles SSH (Gateway WS) y tailnets
title: Acceso remoto
x-i18n:
    generated_at: "2026-04-25T13:47:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 91f53a1f6798f56b3752c96c01f6944c4b5e9ee649ae58975a2669a099203e40
    source_path: gateway/remote.md
    workflow: 15
---

Este repositorio admite “remoto sobre SSH” manteniendo un único Gateway (el maestro) en ejecución en un host dedicado (escritorio/servidor) y conectando los clientes a él.

- Para **operadores (tú / la app de macOS)**: el túnel SSH es el respaldo universal.
- Para **nodos (iOS/Android y futuros dispositivos)**: conéctate al **WebSocket** del Gateway (LAN/tailnet o túnel SSH según sea necesario).

## La idea principal

- El WebSocket del Gateway se enlaza a **loopback** en el puerto configurado (el valor predeterminado es 18789).
- Para uso remoto, reenvías ese puerto loopback por SSH (o usas una tailnet/VPN y haces menos túneles).

## Configuraciones comunes de VPN/tailnet (donde vive el agente)

Piensa en el **host del Gateway** como “donde vive el agente”. Posee las sesiones, perfiles de autenticación, canales y estado.
Tu portátil/escritorio (y nodos) se conectan a ese host.

### 1) Gateway siempre activo en tu tailnet (VPS o servidor doméstico)

Ejecuta el Gateway en un host persistente y accede a él mediante **Tailscale** o SSH.

- **Mejor experiencia:** mantén `gateway.bind: "loopback"` y usa **Tailscale Serve** para la UI de control.
- **Respaldo:** mantén loopback + túnel SSH desde cualquier máquina que necesite acceso.
- **Ejemplos:** [exe.dev](/es/install/exe-dev) (VM sencilla) o [Hetzner](/es/install/hetzner) (VPS de producción).

Esto es ideal cuando tu portátil entra en suspensión con frecuencia, pero quieres que el agente esté siempre activo.

### 2) El escritorio de casa ejecuta el Gateway, el portátil es el control remoto

El portátil **no** ejecuta el agente. Se conecta de forma remota:

- Usa el modo **Remote over SSH** de la app de macOS (Settings → General → “OpenClaw runs”).
- La app abre y gestiona el túnel, por lo que WebChat + comprobaciones de estado “simplemente funcionan”.

Manual operativo: [acceso remoto en macOS](/es/platforms/mac/remote).

### 3) El portátil ejecuta el Gateway, acceso remoto desde otras máquinas

Mantén el Gateway local, pero expónlo de forma segura:

- Túnel SSH al portátil desde otras máquinas, o
- Tailscale Serve para la UI de control y mantén el Gateway solo en loopback.

Guía: [Tailscale](/es/gateway/tailscale) y [Resumen de Web](/es/web).

## Flujo de comandos (qué se ejecuta y dónde)

Un servicio gateway posee el estado + canales. Los nodos son periféricos.

Ejemplo de flujo (Telegram → nodo):

- Llega un mensaje de Telegram al **Gateway**.
- El Gateway ejecuta el **agente** y decide si debe llamar a una herramienta del nodo.
- El Gateway llama al **nodo** por el WebSocket del Gateway (`node.*` RPC).
- El nodo devuelve el resultado; el Gateway responde de vuelta a Telegram.

Notas:

- **Los nodos no ejecutan el servicio gateway.** Solo debe ejecutarse un gateway por host, salvo que ejecutes intencionadamente perfiles aislados (consulta [Múltiples gateways](/es/gateway/multiple-gateways)).
- El “modo nodo” de la app de macOS es solo un cliente nodo sobre el WebSocket del Gateway.

## Túnel SSH (CLI + herramientas)

Crea un túnel local hacia el WebSocket del Gateway remoto:

```bash
ssh -N -L 18789:127.0.0.1:18789 user@host
```

Con el túnel activo:

- `openclaw health` y `openclaw status --deep` ahora llegan al gateway remoto mediante `ws://127.0.0.1:18789`.
- `openclaw gateway status`, `openclaw gateway health`, `openclaw gateway probe` y `openclaw gateway call` también pueden apuntar a la URL reenviada mediante `--url` cuando sea necesario.

Nota: sustituye `18789` por tu `gateway.port` configurado (o `--port`/`OPENCLAW_GATEWAY_PORT`).
Nota: cuando pasas `--url`, la CLI no recurre a credenciales de configuración ni de entorno.
Incluye `--token` o `--password` explícitamente. La ausencia de credenciales explícitas es un error.

## Valores remotos predeterminados de la CLI

Puedes conservar un destino remoto para que los comandos de la CLI lo usen por defecto:

```json5
{
  gateway: {
    mode: "remote",
    remote: {
      url: "ws://127.0.0.1:18789",
      token: "your-token",
    },
  },
}
```

Cuando el gateway es solo loopback, mantén la URL en `ws://127.0.0.1:18789` y abre primero el túnel SSH.

## Precedencia de credenciales

La resolución de credenciales del Gateway sigue un contrato compartido en las rutas call/probe/status y en la supervisión de aprobaciones de ejecución de Discord. Node-host usa el mismo contrato base con una excepción en modo local (ignora intencionadamente `gateway.remote.*`):

- Las credenciales explícitas (`--token`, `--password` o la herramienta `gatewayToken`) siempre tienen prioridad en las rutas de llamada que aceptan autenticación explícita.
- Seguridad de sobrescritura de URL:
  - Las sobrescrituras de URL de la CLI (`--url`) nunca reutilizan credenciales implícitas de configuración/entorno.
  - Las sobrescrituras de URL por entorno (`OPENCLAW_GATEWAY_URL`) pueden usar solo credenciales de entorno (`OPENCLAW_GATEWAY_TOKEN` / `OPENCLAW_GATEWAY_PASSWORD`).
- Valores predeterminados de modo local:
  - token: `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token` -> `gateway.remote.token` (el respaldo remoto se aplica solo cuando la entrada local del token de autenticación no está establecida)
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.auth.password` -> `gateway.remote.password` (el respaldo remoto se aplica solo cuando la entrada local de la contraseña de autenticación no está establecida)
- Valores predeterminados de modo remoto:
  - token: `gateway.remote.token` -> `OPENCLAW_GATEWAY_TOKEN` -> `gateway.auth.token`
  - password: `OPENCLAW_GATEWAY_PASSWORD` -> `gateway.remote.password` -> `gateway.auth.password`
- Excepción de modo local de Node-host: `gateway.remote.token` / `gateway.remote.password` se ignoran.
- Las comprobaciones probe/status remotas de token son estrictas de forma predeterminada: usan solo `gateway.remote.token` (sin respaldo al token local) al apuntar al modo remoto.
- Las sobrescrituras de entorno del Gateway usan solo `OPENCLAW_GATEWAY_*`.

## UI de chat por SSH

WebChat ya no usa un puerto HTTP separado. La UI de chat SwiftUI se conecta directamente al WebSocket del Gateway.

- Reenvía `18789` por SSH (consulta arriba) y luego conecta los clientes a `ws://127.0.0.1:18789`.
- En macOS, prefiere el modo “Remote over SSH” de la app, que gestiona el túnel automáticamente.

## App de macOS "Remote over SSH"

La app de barra de menús de macOS puede gestionar la misma configuración de extremo a extremo (comprobaciones remotas de estado, WebChat y reenvío de Voice Wake).

Manual operativo: [acceso remoto en macOS](/es/platforms/mac/remote).

## Reglas de seguridad (remoto/VPN)

Versión corta: **mantén el Gateway solo en loopback** salvo que estés seguro de que necesitas un bind.

- **Loopback + SSH/Tailscale Serve** es el valor predeterminado más seguro (sin exposición pública).
- `ws://` en texto plano es solo para loopback de forma predeterminada. Para redes privadas de confianza,
  establece `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1` en el proceso cliente como
  vía de escape. No existe equivalente en `openclaw.json`; esto debe estar en el
  entorno del proceso del cliente que realiza la conexión WebSocket.
- Los **binds no loopback** (`lan`/`tailnet`/`custom`, o `auto` cuando loopback no está disponible) deben usar autenticación del gateway: token, password o un proxy inverso con reconocimiento de identidad con `gateway.auth.mode: "trusted-proxy"`.
- `gateway.remote.token` / `.password` son fuentes de credenciales del cliente. **No** configuran por sí solas la autenticación del servidor.
- Las rutas de llamada locales pueden usar `gateway.remote.*` como respaldo solo cuando `gateway.auth.*` no está establecido.
- Si `gateway.auth.token` / `gateway.auth.password` está configurado explícitamente mediante SecretRef y no se resuelve, la resolución falla de forma cerrada (sin respaldo remoto que enmascare).
- `gateway.remote.tlsFingerprint` fija el certificado TLS remoto cuando se usa `wss://`.
- **Tailscale Serve** puede autenticar tráfico de la UI de control/WebSocket mediante encabezados de identidad
  cuando `gateway.auth.allowTailscale: true`; los endpoints de API HTTP no
  usan esa autenticación por encabezado de Tailscale y en su lugar siguen el modo
  normal de autenticación HTTP del gateway. Este flujo sin token asume que el host del gateway es de confianza. Establécelo en
  `false` si quieres autenticación de secreto compartido en todas partes.
- La autenticación **trusted-proxy** es solo para configuraciones no loopback con proxy y reconocimiento de identidad.
  Los proxies inversos loopback en el mismo host no satisfacen `gateway.auth.mode: "trusted-proxy"`.
- Trata el control del navegador como acceso de operador: solo tailnet + vinculación deliberada de nodo.

Análisis detallado: [Seguridad](/es/gateway/security).

### macOS: túnel SSH persistente mediante LaunchAgent

Para clientes macOS que se conectan a un gateway remoto, la configuración persistente más sencilla usa una entrada SSH `LocalForward` más un LaunchAgent para mantener el túnel activo tras reinicios y fallos.

#### Paso 1: añadir configuración SSH

Edita `~/.ssh/config`:

```ssh
Host remote-gateway
    HostName <REMOTE_IP>
    User <REMOTE_USER>
    LocalForward 18789 127.0.0.1:18789
    IdentityFile ~/.ssh/id_rsa
```

Sustituye `<REMOTE_IP>` y `<REMOTE_USER>` por tus valores.

#### Paso 2: copiar la clave SSH (una sola vez)

```bash
ssh-copy-id -i ~/.ssh/id_rsa <REMOTE_USER>@<REMOTE_IP>
```

#### Paso 3: configurar el token del gateway

Guarda el token en la configuración para que persista tras reinicios:

```bash
openclaw config set gateway.remote.token "<your-token>"
```

#### Paso 4: crear el LaunchAgent

Guarda esto como `~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>ai.openclaw.ssh-tunnel</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/bin/ssh</string>
        <string>-N</string>
        <string>remote-gateway</string>
    </array>
    <key>KeepAlive</key>
    <true/>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>
```

#### Paso 5: cargar el LaunchAgent

```bash
launchctl bootstrap gui/$UID ~/Library/LaunchAgents/ai.openclaw.ssh-tunnel.plist
```

El túnel se iniciará automáticamente al iniciar sesión, se reiniciará en caso de fallo y mantendrá activo el puerto reenviado.

Nota: si tienes un LaunchAgent `com.openclaw.ssh-tunnel` sobrante de una configuración anterior, descárgalo y elimínalo.

#### Solución de problemas

Comprueba si el túnel está en ejecución:

```bash
ps aux | grep "ssh -N remote-gateway" | grep -v grep
lsof -i :18789
```

Reinicia el túnel:

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.ssh-tunnel
```

Detén el túnel:

```bash
launchctl bootout gui/$UID/ai.openclaw.ssh-tunnel
```

| Entrada de configuración              | Qué hace                                                     |
| ------------------------------------ | ------------------------------------------------------------ |
| `LocalForward 18789 127.0.0.1:18789` | Reenvía el puerto local 18789 al puerto remoto 18789         |
| `ssh -N`                             | SSH sin ejecutar comandos remotos (solo reenvío de puertos) |
| `KeepAlive`                          | Reinicia automáticamente el túnel si falla                   |
| `RunAtLoad`                          | Inicia el túnel cuando el LaunchAgent se carga al iniciar sesión |

## Relacionado

- [Tailscale](/es/gateway/tailscale)
- [Autenticación](/es/gateway/authentication)
- [Configuración de gateway remoto](/es/gateway/remote-gateway-readme)
