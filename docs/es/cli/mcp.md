---
read_when:
    - Conectar Codex, Claude Code u otro cliente MCP a canales respaldados por OpenClaw
    - Ejecutar `openclaw mcp serve`
    - Gestionar definiciones de servidores MCP guardadas por OpenClaw
summary: Expón las conversaciones de canales de OpenClaw a través de MCP y gestiona las definiciones guardadas de servidores MCP
title: MCP
x-i18n:
    generated_at: "2026-04-25T13:44:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: ca2a76d1dbca71b4048659c21ac7ff98a01cc6095f6baad67df5347f45cd32e6
    source_path: cli/mcp.md
    workflow: 15
---

`openclaw mcp` tiene dos funciones:

- ejecutar OpenClaw como servidor MCP con `openclaw mcp serve`
- gestionar definiciones salientes de servidores MCP propiedad de OpenClaw con `list`, `show`,
  `set` y `unset`

En otras palabras:

- `serve` es OpenClaw actuando como servidor MCP
- `list` / `show` / `set` / `unset` es OpenClaw actuando como un registro del lado cliente MCP
  para otros servidores MCP que sus entornos de ejecución podrían consumir más adelante

Usa [`openclaw acp`](/es/cli/acp) cuando OpenClaw deba alojar una sesión de
arnés de programación por sí mismo y enrutar ese entorno de ejecución mediante ACP.

## OpenClaw como servidor MCP

Esta es la ruta `openclaw mcp serve`.

## Cuándo usar `serve`

Usa `openclaw mcp serve` cuando:

- Codex, Claude Code u otro cliente MCP deba hablar directamente con
  conversaciones de canal respaldadas por OpenClaw
- ya tengas un Gateway de OpenClaw local o remoto con sesiones enrutadas
- quieras un único servidor MCP que funcione con los backends de canales de OpenClaw
  en lugar de ejecutar bridges separados por canal

Usa [`openclaw acp`](/es/cli/acp) en su lugar cuando OpenClaw deba alojar el entorno
de ejecución de programación por sí mismo y mantener la sesión del agente dentro de OpenClaw.

## Cómo funciona

`openclaw mcp serve` inicia un servidor MCP stdio. El cliente MCP posee ese
proceso. Mientras el cliente mantenga abierta la sesión stdio, el bridge se conecta a un
Gateway de OpenClaw local o remoto mediante WebSocket y expone conversaciones de canal
enrutadas a través de MCP.

Ciclo de vida:

1. el cliente MCP genera `openclaw mcp serve`
2. el bridge se conecta al Gateway
3. las sesiones enrutadas se convierten en conversaciones MCP y herramientas de transcript/historial
4. los eventos en vivo se ponen en cola en memoria mientras el bridge está conectado
5. si el modo de canal Claude está habilitado, la misma sesión también puede recibir
   notificaciones push específicas de Claude

Comportamiento importante:

- el estado de la cola en vivo empieza cuando el bridge se conecta
- el historial de transcript anterior se lee con `messages_read`
- las notificaciones push de Claude solo existen mientras la sesión MCP está activa
- cuando el cliente se desconecta, el bridge sale y la cola en vivo desaparece
- los puntos de entrada de agente de una sola ejecución como `openclaw agent` y
  `openclaw infer model run` retiran cualquier entorno de ejecución MCP incluido que abran cuando
  la respuesta se completa, por lo que las ejecuciones repetidas por script no acumulan procesos hijo MCP stdio
- los servidores MCP stdio iniciados por OpenClaw (incluidos o configurados por el usuario) se desmontan
  como árbol de procesos al apagarse, de modo que los subprocesos hijo iniciados por el
  servidor no sobreviven después de que el cliente stdio padre salga
- eliminar o restablecer una sesión libera los clientes MCP de esa sesión mediante
  la ruta compartida de limpieza del entorno de ejecución, por lo que no quedan conexiones stdio persistentes
  ligadas a una sesión eliminada

## Elegir un modo de cliente

Usa el mismo bridge de dos maneras distintas:

- Clientes MCP genéricos: solo herramientas MCP estándar. Usa `conversations_list`,
  `messages_read`, `events_poll`, `events_wait`, `messages_send` y las
  herramientas de aprobación.
- Claude Code: herramientas MCP estándar más el adaptador de canal específico de Claude.
  Habilita `--claude-channel-mode on` o deja el valor predeterminado `auto`.

Hoy, `auto` se comporta igual que `on`. Todavía no hay detección de capacidades del cliente.

## Qué expone `serve`

El bridge usa metadatos existentes de enrutamiento de sesión del Gateway para exponer
conversaciones respaldadas por canales. Una conversación aparece cuando OpenClaw ya tiene
estado de sesión con una ruta conocida, como:

- `channel`
- metadatos de destinatario o destino
- `accountId` opcional
- `threadId` opcional

Esto ofrece a los clientes MCP un único lugar para:

- listar conversaciones enrutadas recientes
- leer historial reciente del transcript
- esperar nuevos eventos entrantes
- enviar una respuesta de vuelta a través de la misma ruta
- ver solicitudes de aprobación que lleguen mientras el bridge está conectado

## Uso

```bash
# Gateway local
openclaw mcp serve

# Gateway remoto
openclaw mcp serve --url wss://gateway-host:18789 --token-file ~/.openclaw/gateway.token

# Gateway remoto con autenticación por contraseña
openclaw mcp serve --url wss://gateway-host:18789 --password-file ~/.openclaw/gateway.password

# Habilitar registros detallados del bridge
openclaw mcp serve --verbose

# Deshabilitar notificaciones push específicas de Claude
openclaw mcp serve --claude-channel-mode off
```

## Herramientas del bridge

El bridge actual expone estas herramientas MCP:

- `conversations_list`
- `conversation_get`
- `messages_read`
- `attachments_fetch`
- `events_poll`
- `events_wait`
- `messages_send`
- `permissions_list_open`
- `permissions_respond`

### `conversations_list`

Lista conversaciones recientes respaldadas por sesión que ya tienen metadatos de ruta en
el estado de sesión del Gateway.

Filtros útiles:

- `limit`
- `search`
- `channel`
- `includeDerivedTitles`
- `includeLastMessage`

### `conversation_get`

Devuelve una conversación por `session_key`.

### `messages_read`

Lee mensajes recientes del transcript para una conversación respaldada por sesión.

### `attachments_fetch`

Extrae bloques de contenido de mensaje no textual de un mensaje del transcript. Esta es una
vista de metadatos sobre el contenido del transcript, no un almacén independiente y duradero
de blobs adjuntos.

### `events_poll`

Lee eventos en vivo en cola desde un cursor numérico.

### `events_wait`

Hace long-polling hasta que llegue el siguiente evento coincidente en cola o expire un tiempo de espera.

Usa esto cuando un cliente MCP genérico necesite entrega casi en tiempo real sin un
protocolo push específico de Claude.

### `messages_send`

Envía texto de vuelta a través de la misma ruta ya registrada en la sesión.

Comportamiento actual:

- requiere una ruta de conversación existente
- usa el canal, destinatario, ID de cuenta e ID de hilo de la sesión
- envía solo texto

### `permissions_list_open`

Lista solicitudes pendientes de aprobación de ejecución/plugin que el bridge ha observado desde que
se conectó al Gateway.

### `permissions_respond`

Resuelve una solicitud pendiente de aprobación de ejecución/plugin con:

- `allow-once`
- `allow-always`
- `deny`

## Modelo de eventos

El bridge mantiene una cola de eventos en memoria mientras está conectado.

Tipos de evento actuales:

- `message`
- `exec_approval_requested`
- `exec_approval_resolved`
- `plugin_approval_requested`
- `plugin_approval_resolved`
- `claude_permission_request`

Límites importantes:

- la cola es solo en vivo; empieza cuando se inicia el bridge MCP
- `events_poll` y `events_wait` no reproducen por sí solos historial anterior del Gateway
- el backlog duradero debe leerse con `messages_read`

## Notificaciones de canal Claude

El bridge también puede exponer notificaciones de canal específicas de Claude. Este es el
equivalente en OpenClaw de un adaptador de canal Claude Code: las herramientas MCP estándar siguen
disponibles, pero los mensajes entrantes en vivo también pueden llegar como notificaciones MCP
específicas de Claude.

Indicadores:

- `--claude-channel-mode off`: solo herramientas MCP estándar
- `--claude-channel-mode on`: habilita notificaciones de canal Claude
- `--claude-channel-mode auto`: valor predeterminado actual; mismo comportamiento de bridge que `on`

Cuando el modo de canal Claude está habilitado, el servidor anuncia capacidades experimentales de Claude
y puede emitir:

- `notifications/claude/channel`
- `notifications/claude/channel/permission`

Comportamiento actual del bridge:

- los mensajes entrantes del transcript de tipo `user` se reenvían como
  `notifications/claude/channel`
- las solicitudes de permiso de Claude recibidas por MCP se rastrean en memoria
- si la conversación vinculada luego envía `yes abcde` o `no abcde`, el bridge
  lo convierte en `notifications/claude/channel/permission`
- estas notificaciones son solo de sesión en vivo; si el cliente MCP se desconecta,
  no hay un destino push

Esto es intencionadamente específico del cliente. Los clientes MCP genéricos deben apoyarse en las
herramientas estándar de polling.

## Configuración del cliente MCP

Ejemplo de configuración de cliente stdio:

```json
{
  "mcpServers": {
    "openclaw": {
      "command": "openclaw",
      "args": [
        "mcp",
        "serve",
        "--url",
        "wss://gateway-host:18789",
        "--token-file",
        "/path/to/gateway.token"
      ]
    }
  }
}
```

Para la mayoría de clientes MCP genéricos, empieza con la superficie estándar de herramientas e ignora
el modo Claude. Activa el modo Claude solo para clientes que realmente entiendan los
métodos de notificación específicos de Claude.

## Opciones

`openclaw mcp serve` admite:

- `--url <url>`: URL de WebSocket del Gateway
- `--token <token>`: token del Gateway
- `--token-file <path>`: lee el token desde un archivo
- `--password <password>`: contraseña del Gateway
- `--password-file <path>`: lee la contraseña desde un archivo
- `--claude-channel-mode <auto|on|off>`: modo de notificación de Claude
- `-v`, `--verbose`: registros detallados en stderr

Prefiere `--token-file` o `--password-file` frente a secretos inline cuando sea posible.

## Seguridad y límite de confianza

El bridge no inventa el enrutamiento. Solo expone conversaciones que el Gateway
ya sabe cómo enrutar.

Eso significa que:

- las listas de permitidos de remitentes, la vinculación y la confianza a nivel de canal siguen perteneciendo a la
  configuración subyacente de canales de OpenClaw
- `messages_send` solo puede responder a través de una ruta existente almacenada
- el estado de aprobación es solo en vivo/en memoria para la sesión actual del bridge
- la autenticación del bridge debe usar los mismos controles de token o contraseña del Gateway en los que
  confiarías para cualquier otro cliente remoto del Gateway

Si una conversación falta en `conversations_list`, la causa habitual no es la configuración
de MCP. Son metadatos de ruta ausentes o incompletos en la sesión subyacente del Gateway.

## Pruebas

OpenClaw incluye una smoke determinista de Docker para este bridge:

```bash
pnpm test:docker:mcp-channels
```

Esa smoke:

- inicia un contenedor Gateway precargado
- inicia un segundo contenedor que genera `openclaw mcp serve`
- verifica descubrimiento de conversaciones, lecturas de transcript, lecturas de metadatos de adjuntos,
  comportamiento de cola de eventos en vivo y enrutamiento de envío saliente
- valida notificaciones de canal y permisos estilo Claude sobre el bridge MCP stdio real

Esta es la forma más rápida de demostrar que el bridge funciona sin conectar una cuenta real de
Telegram, Discord o iMessage a la ejecución de prueba.

Para un contexto más amplio de pruebas, consulta [Pruebas](/es/help/testing).

## Solución de problemas

### No se devuelven conversaciones

Normalmente significa que la sesión del Gateway aún no es enrutable. Confirma que la
sesión subyacente tiene almacenados metadatos de ruta de canal/proveedor, destinatario y cuenta/hilo opcionales.

### `events_poll` o `events_wait` omite mensajes anteriores

Es lo esperado. La cola en vivo empieza cuando el bridge se conecta. Lee el historial anterior
del transcript con `messages_read`.

### No aparecen notificaciones de Claude

Comprueba todo lo siguiente:

- el cliente mantuvo abierta la sesión MCP stdio
- `--claude-channel-mode` es `on` o `auto`
- el cliente realmente entiende los métodos de notificación específicos de Claude
- el mensaje entrante ocurrió después de que el bridge se conectó

### Faltan aprobaciones

`permissions_list_open` solo muestra solicitudes de aprobación observadas mientras el bridge
estaba conectado. No es una API de historial duradero de aprobaciones.

## OpenClaw como registro de cliente MCP

Esta es la ruta `openclaw mcp list`, `show`, `set` y `unset`.

Estos comandos no exponen OpenClaw por MCP. Gestionan definiciones de servidores MCP
propiedad de OpenClaw en `mcp.servers` dentro de la configuración de OpenClaw.

Esas definiciones guardadas son para entornos de ejecución que OpenClaw lanza o configura
más adelante, como Pi incrustado y otros adaptadores de entorno de ejecución. OpenClaw almacena las
definiciones de forma centralizada para que esos entornos no necesiten mantener sus propias listas
duplicadas de servidores MCP.

Comportamiento importante:

- estos comandos solo leen o escriben la configuración de OpenClaw
- no se conectan al servidor MCP de destino
- no validan si el comando, la URL o el transporte remoto son accesibles
  ahora mismo
- los adaptadores de entorno de ejecución deciden qué formas de transporte admiten realmente en
  tiempo de ejecución
- Pi incrustado expone herramientas MCP configuradas en perfiles normales de herramientas `coding` y `messaging`;
  `minimal` sigue ocultándolas, y `tools.deny: ["bundle-mcp"]`
  las desactiva explícitamente
- los entornos de ejecución MCP incluidos con alcance de sesión se recolectan tras `mcp.sessionIdleTtlMs`
  milisegundos de inactividad (10 minutos de forma predeterminada; establece `0` para desactivar) y
  las ejecuciones incrustadas de una sola vez los limpian al finalizar

## Definiciones guardadas de servidores MCP

OpenClaw también almacena un registro ligero de servidores MCP en la configuración para superficies
que quieren definiciones MCP gestionadas por OpenClaw.

Comandos:

- `openclaw mcp list`
- `openclaw mcp show [name]`
- `openclaw mcp set <name> <json>`
- `openclaw mcp unset <name>`

Notas:

- `list` ordena los nombres de los servidores.
- `show` sin un nombre imprime el objeto completo de servidores MCP configurado.
- `set` espera un único valor de objeto JSON en la línea de comandos.
- `unset` falla si el servidor nombrado no existe.

Ejemplos:

```bash
openclaw mcp list
openclaw mcp show context7 --json
openclaw mcp set context7 '{"command":"uvx","args":["context7-mcp"]}'
openclaw mcp set docs '{"url":"https://mcp.example.com"}'
openclaw mcp unset context7
```

Ejemplo de formato de configuración:

```json
{
  "mcp": {
    "servers": {
      "context7": {
        "command": "uvx",
        "args": ["context7-mcp"]
      },
      "docs": {
        "url": "https://mcp.example.com"
      }
    }
  }
}
```

### Transporte stdio

Inicia un proceso hijo local y se comunica mediante stdin/stdout.

| Campo                      | Descripción                         |
| -------------------------- | ----------------------------------- |
| `command`                  | Ejecutable que se va a iniciar (obligatorio) |
| `args`                     | Matriz de argumentos de línea de comandos |
| `env`                      | Variables de entorno adicionales    |
| `cwd` / `workingDirectory` | Directorio de trabajo del proceso   |

#### Filtro de seguridad de env para stdio

OpenClaw rechaza claves de entorno de inicio del intérprete que puedan alterar cómo arranca un servidor MCP stdio antes del primer RPC, incluso si aparecen en el bloque `env` de un servidor. Las claves bloqueadas incluyen `NODE_OPTIONS`, `PYTHONSTARTUP`, `PYTHONPATH`, `PERL5OPT`, `RUBYOPT`, `SHELLOPTS`, `PS4` y variables similares de control del entorno de ejecución. El inicio rechaza estas claves con un error de configuración para que no puedan inyectar un preludio implícito, sustituir el intérprete o habilitar un depurador contra el proceso stdio. Las variables de entorno normales de credenciales, proxy y específicas del servidor (`GITHUB_TOKEN`, `HTTP_PROXY`, `*_API_KEY` personalizados, etc.) no se ven afectadas.

Si tu servidor MCP realmente necesita una de las variables bloqueadas, establécela en el proceso host del gateway en lugar de hacerlo en `env` del servidor stdio.

### Transporte SSE / HTTP

Se conecta a un servidor MCP remoto mediante HTTP Server-Sent Events.

| Campo                 | Descripción                                                          |
| --------------------- | -------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del servidor remoto (obligatorio)                   |
| `headers`             | Mapa opcional clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación) |
| `connectionTimeoutMs` | Tiempo de espera de conexión por servidor en ms (opcional)           |

Ejemplo:

```json
{
  "mcp": {
    "servers": {
      "remote-tools": {
        "url": "https://mcp.example.com",
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Los valores sensibles en `url` (userinfo) y `headers` se redactan en los registros y
la salida de estado.

### Transporte HTTP transmitible

`streamable-http` es una opción de transporte adicional junto con `sse` y `stdio`. Usa streaming HTTP para la comunicación bidireccional con servidores MCP remotos.

| Campo                 | Descripción                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `url`                 | URL HTTP o HTTPS del servidor remoto (obligatorio)                                           |
| `transport`           | Establécelo en `"streamable-http"` para seleccionar este transporte; si se omite, OpenClaw usa `sse` |
| `headers`             | Mapa opcional clave-valor de encabezados HTTP (por ejemplo, tokens de autenticación)         |
| `connectionTimeoutMs` | Tiempo de espera de conexión por servidor en ms (opcional)                                   |

Ejemplo:

```json
{
  "mcp": {
    "servers": {
      "streaming-tools": {
        "url": "https://mcp.example.com/stream",
        "transport": "streamable-http",
        "connectionTimeoutMs": 10000,
        "headers": {
          "Authorization": "Bearer <token>"
        }
      }
    }
  }
}
```

Estos comandos gestionan solo la configuración guardada. No inician el bridge de canal,
no abren una sesión activa de cliente MCP ni demuestran que el servidor de destino sea accesible.

## Límites actuales

Esta página documenta el bridge tal como se distribuye hoy.

Límites actuales:

- el descubrimiento de conversaciones depende de metadatos existentes de ruta de sesión del Gateway
- no hay un protocolo push genérico más allá del adaptador específico de Claude
- aún no hay herramientas para editar mensajes ni reaccionar
- el transporte HTTP/SSE/streamable-http se conecta a un único servidor remoto; todavía no hay upstream multiplexado
- `permissions_list_open` solo incluye aprobaciones observadas mientras el bridge está
  conectado

## Relacionado

- [Referencia de CLI](/es/cli)
- [Plugins](/es/cli/plugins)
