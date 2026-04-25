---
read_when:
    - Implementar funciones de la app de macOS
    - Cambiar el ciclo de vida del gateway o el bridge de nodos en macOS
summary: App complementaria de OpenClaw para macOS (barra de menús + broker del gateway)
title: App de macOS
x-i18n:
    generated_at: "2026-04-25T13:50:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: 852c93694ebb4ac083b9a44c2e4d6e40274e6e7f3aa6fa664a8eba1a82aaf5b1
    source_path: platforms/macos.md
    workflow: 15
---

La app de macOS es la **compañera de barra de menús** de OpenClaw. Es propietaria de los permisos,
gestiona/se conecta al Gateway localmente (launchd o manual) y expone capacidades
de macOS al agente como un nodo.

## Qué hace

- Muestra notificaciones nativas y estado en la barra de menús.
- Gestiona las solicitudes TCC (Notificaciones, Accesibilidad, Grabación de pantalla, Micrófono,
  Reconocimiento de voz, Automatización/AppleScript).
- Ejecuta o se conecta al Gateway (local o remoto).
- Expone herramientas exclusivas de macOS (Canvas, Cámara, Grabación de pantalla, `system.run`).
- Inicia el servicio local de host de nodo en modo **remote** (launchd) y lo detiene en modo **local**.
- Opcionalmente aloja **PeekabooBridge** para automatización de UI.
- Instala la CLI global (`openclaw`) a petición mediante npm, pnpm o bun (la app prefiere npm, luego pnpm y después bun; Node sigue siendo el entorno de ejecución recomendado para el Gateway).

## Modo local frente a remoto

- **Local** (predeterminado): la app se conecta a un Gateway local ya en ejecución si existe;
  en caso contrario, habilita el servicio launchd mediante `openclaw gateway install`.
- **Remote**: la app se conecta a un Gateway por SSH/Tailscale y nunca inicia
  un proceso local.
  La app inicia el **servicio local de host de nodo** para que el Gateway remoto pueda acceder a este Mac.
  La app no genera el Gateway como proceso hijo.
  El descubrimiento del Gateway ahora prefiere nombres MagicDNS de Tailscale a IPs tailnet sin procesar,
  por lo que la app de Mac se recupera con más fiabilidad cuando cambian las IPs de tailnet.

## Control de Launchd

La app gestiona un LaunchAgent por usuario con la etiqueta `ai.openclaw.gateway`
(o `ai.openclaw.<profile>` cuando se usa `--profile`/`OPENCLAW_PROFILE`; la etiqueta heredada `com.openclaw.*` sigue descargándose).

```bash
launchctl kickstart -k gui/$UID/ai.openclaw.gateway
launchctl bootout gui/$UID/ai.openclaw.gateway
```

Sustituye la etiqueta por `ai.openclaw.<profile>` cuando ejecutes un perfil con nombre.

Si el LaunchAgent no está instalado, habilítalo desde la app o ejecuta
`openclaw gateway install`.

## Capacidades de nodo (mac)

La app de macOS se presenta como un nodo. Comandos habituales:

- Canvas: `canvas.present`, `canvas.navigate`, `canvas.eval`, `canvas.snapshot`, `canvas.a2ui.*`
- Cámara: `camera.snap`, `camera.clip`
- Pantalla: `screen.snapshot`, `screen.record`
- Sistema: `system.run`, `system.notify`

El nodo informa un mapa `permissions` para que los agentes puedan decidir qué está permitido.

Servicio de nodo + IPC de la app:

- Cuando el servicio host de nodo sin interfaz está en ejecución (modo remoto), se conecta al WebSocket del Gateway como nodo.
- `system.run` se ejecuta en la app de macOS (contexto UI/TCC) a través de un socket Unix local; las solicitudes y la salida permanecen dentro de la app.

Diagrama (SCI):

```
Gateway -> Node Service (WS)
                 |  IPC (UDS + token + HMAC + TTL)
                 v
             Mac App (UI + TCC + system.run)
```

## Aprobaciones de ejecución (system.run)

`system.run` se controla mediante **Exec approvals** en la app de macOS (Settings → Exec approvals).
Security + ask + allowlist se almacenan localmente en el Mac en:

```
~/.openclaw/exec-approvals.json
```

Ejemplo:

```json
{
  "version": 1,
  "defaults": {
    "security": "deny",
    "ask": "on-miss"
  },
  "agents": {
    "main": {
      "security": "allowlist",
      "ask": "on-miss",
      "allowlist": [{ "pattern": "/opt/homebrew/bin/rg" }]
    }
  }
}
```

Notas:

- Las entradas `allowlist` son patrones glob para rutas resueltas de binarios, o nombres de comandos sin prefijo para comandos invocados mediante PATH.
- El texto sin procesar del comando de shell que contiene sintaxis de control o expansión del shell (`&&`, `||`, `;`, `|`, `` ` ``, `$`, `<`, `>`, `(`, `)`) se trata como un fallo de `allowlist` y requiere aprobación explícita (o incluir el binario del shell en la lista de permitidos).
- Elegir “Always Allow” en la solicitud añade ese comando a la `allowlist`.
- Las sobrescrituras de entorno de `system.run` se filtran (elimina `PATH`, `DYLD_*`, `LD_*`, `NODE_OPTIONS`, `PYTHON*`, `PERL*`, `RUBYOPT`, `SHELLOPTS`, `PS4`) y luego se fusionan con el entorno de la app.
- Para envoltorios de shell (`bash|sh|zsh ... -c/-lc`), las sobrescrituras de entorno con alcance de solicitud se reducen a una pequeña lista explícita de permitidos (`TERM`, `LANG`, `LC_*`, `COLORTERM`, `NO_COLOR`, `FORCE_COLOR`).
- Para decisiones de permitir siempre en modo allowlist, los envoltorios de despacho conocidos (`env`, `nice`, `nohup`, `stdbuf`, `timeout`) conservan rutas del ejecutable interno en lugar de rutas del envoltorio. Si el desempaquetado no es seguro, no se conserva automáticamente ninguna entrada de allowlist.

## Enlaces profundos

La app registra el esquema de URL `openclaw://` para acciones locales.

### `openclaw://agent`

Activa una solicitud `agent` del Gateway.
__OC_I18N_900004__
Parámetros de consulta:

- `message` (obligatorio)
- `sessionKey` (opcional)
- `thinking` (opcional)
- `deliver` / `to` / `channel` (opcional)
- `timeoutSeconds` (opcional)
- `key` (opcional, clave de modo no supervisado)

Seguridad:

- Sin `key`, la app solicita confirmación.
- Sin `key`, la app aplica un límite corto de mensaje para la solicitud de confirmación e ignora `deliver` / `to` / `channel`.
- Con una `key` válida, la ejecución es no supervisada (pensada para automatizaciones personales).

## Flujo de incorporación (típico)

1. Instala y abre **OpenClaw.app**.
2. Completa la lista de permisos (solicitudes TCC).
3. Asegúrate de que el modo **Local** esté activo y de que el Gateway esté en ejecución.
4. Instala la CLI si quieres acceso desde terminal.

## Ubicación del directorio de estado (macOS)

Evita colocar tu directorio de estado de OpenClaw en iCloud u otras carpetas sincronizadas en la nube.
Las rutas respaldadas por sincronización pueden añadir latencia y ocasionalmente causar condiciones de carrera de bloqueo/sincronización de archivos para
sesiones y credenciales.

Prefiere una ruta de estado local no sincronizada como:
__OC_I18N_900005__
Si `openclaw doctor` detecta el estado en:

- `~/Library/Mobile Documents/com~apple~CloudDocs/...`
- `~/Library/CloudStorage/...`

mostrará una advertencia y recomendará volver a una ruta local.

## Flujo de compilación y desarrollo (nativo)

- `cd apps/macos && swift build`
- `swift run OpenClaw` (o Xcode)
- Empaquetar app: `scripts/package-mac-app.sh`

## Depurar conectividad del gateway (CLI de macOS)

Usa la CLI de depuración para ejercer la misma lógica de handshake y descubrimiento del WebSocket del Gateway
que usa la app de macOS, sin abrir la app.
__OC_I18N_900006__
Opciones de conexión:

- `--url <ws://host:port>`: sobrescribir configuración
- `--mode <local|remote>`: resolver desde la configuración (predeterminado: configuración o local)
- `--probe`: forzar una comprobación de estado nueva
- `--timeout <ms>`: tiempo de espera de la solicitud (predeterminado: `15000`)
- `--json`: salida estructurada para comparar diferencias

Opciones de descubrimiento:

- `--include-local`: incluir gateways que se filtrarían como “local”
- `--timeout <ms>`: ventana total de descubrimiento (predeterminado: `2000`)
- `--json`: salida estructurada para comparar diferencias

Consejo: compáralo con `openclaw gateway discover --json` para ver si la
canalización de descubrimiento de la app de macOS (`local.` más el dominio de área amplia configurado, con
respaldos de área amplia y Tailscale Serve) difiere del descubrimiento basado en `dns-sd`
de la CLI de Node.

## Infraestructura de conexión remota (túneles SSH)

Cuando la app de macOS se ejecuta en modo **Remote**, abre un túnel SSH para que los componentes locales de la UI
puedan hablar con un Gateway remoto como si estuviera en localhost.

### Túnel de control (puerto del WebSocket del Gateway)

- **Propósito:** comprobaciones de estado, estado, Web Chat, configuración y otras llamadas del plano de control.
- **Puerto local:** el puerto del Gateway (predeterminado `18789`), siempre estable.
- **Puerto remoto:** el mismo puerto del Gateway en el host remoto.
- **Comportamiento:** sin puerto local aleatorio; la app reutiliza un túnel sano existente
  o lo reinicia si es necesario.
- **Forma SSH:** `ssh -N -L <local>:127.0.0.1:<remote>` con opciones BatchMode +
  ExitOnForwardFailure + keepalive.
- **Informe de IP:** el túnel SSH usa loopback, por lo que el gateway verá la IP del nodo
  como `127.0.0.1`. Usa transporte **Direct (ws/wss)** si quieres que aparezca la
  IP real del cliente (consulta [acceso remoto en macOS](/es/platforms/mac/remote)).

Para los pasos de configuración, consulta [acceso remoto en macOS](/es/platforms/mac/remote). Para los
detalles del protocolo, consulta [Protocolo del Gateway](/es/gateway/protocol).

## Documentación relacionada

- [Manual operativo del Gateway](/es/gateway)
- [Gateway (macOS)](/es/platforms/mac/bundled-gateway)
- [Permisos de macOS](/es/platforms/mac/permissions)
- [Canvas](/es/platforms/mac/canvas)
