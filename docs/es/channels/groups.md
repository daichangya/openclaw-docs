---
read_when:
    - Cambiar el comportamiento del chat grupal o la restricción por menciones
summary: Comportamiento de chats grupales en todas las superficies (Discord/iMessage/Matrix/Microsoft Teams/Signal/Slack/Telegram/WhatsApp/Zalo)
title: Grupos
x-i18n:
    generated_at: "2026-04-06T03:06:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8620de6f7f0b866bf43a307fdbec3399790f09f22a87703704b0522caba80b18
    source_path: channels/groups.md
    workflow: 15
---

# Grupos

OpenClaw trata los chats grupales de forma consistente en todas las superficies: Discord, iMessage, Matrix, Microsoft Teams, Signal, Slack, Telegram, WhatsApp, Zalo.

## Introducción para principiantes (2 minutos)

OpenClaw “vive” en tus propias cuentas de mensajería. No existe un usuario bot separado de WhatsApp.
Si **tú** estás en un grupo, OpenClaw puede ver ese grupo y responder allí.

Comportamiento predeterminado:

- Los grupos están restringidos (`groupPolicy: "allowlist"`).
- Las respuestas requieren una mención, a menos que desactives explícitamente la restricción por menciones.

En otras palabras: los remitentes en la lista de permitidos pueden activar OpenClaw mencionándolo.

> En resumen
>
> - El **acceso por MD** se controla con `*.allowFrom`.
> - El **acceso a grupos** se controla con `*.groupPolicy` + listas de permitidos (`*.groups`, `*.groupAllowFrom`).
> - La **activación de respuestas** se controla con la restricción por menciones (`requireMention`, `/activation`).

Flujo rápido (qué ocurre con un mensaje de grupo):

```
groupPolicy? disabled -> descartar
groupPolicy? allowlist -> grupo permitido? no -> descartar
requireMention? yes -> mencionado? no -> almacenar solo para contexto
otherwise -> responder
```

## Visibilidad del contexto y listas de permitidos

Hay dos controles distintos implicados en la seguridad de los grupos:

- **Autorización de activación**: quién puede activar al agente (`groupPolicy`, `groups`, `groupAllowFrom`, listas de permitidos específicas del canal).
- **Visibilidad del contexto**: qué contexto suplementario se inyecta en el modelo (texto de respuesta, citas, historial del hilo, metadatos reenviados).

De forma predeterminada, OpenClaw prioriza el comportamiento normal del chat y mantiene el contexto principalmente tal como se recibe. Esto significa que las listas de permitidos deciden principalmente quién puede activar acciones, no un límite universal de redacción para cada fragmento citado o histórico.

El comportamiento actual depende del canal:

- Algunos canales ya aplican filtrado basado en remitente para el contexto suplementario en rutas específicas (por ejemplo, inicialización de hilos en Slack, búsquedas de respuestas/hilos en Matrix).
- Otros canales siguen pasando el contexto de cita/respuesta/reenvío tal como se recibe.

Dirección del endurecimiento (planificado):

- `contextVisibility: "all"` (predeterminado) mantiene el comportamiento actual tal como se recibe.
- `contextVisibility: "allowlist"` filtra el contexto suplementario a remitentes en la lista de permitidos.
- `contextVisibility: "allowlist_quote"` es `allowlist` más una excepción explícita para una cita/respuesta.

Hasta que este modelo de endurecimiento se implemente de forma consistente en todos los canales, espera diferencias según la superficie.

![Flujo de mensajes de grupo](/images/groups-flow.svg)

Si quieres...

| Objetivo                                     | Qué configurar                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| Permitir todos los grupos pero responder solo a @mentions | `groups: { "*": { requireMention: true } }`                |
| Desactivar todas las respuestas en grupos    | `groupPolicy: "disabled"`                                  |
| Solo grupos específicos                      | `groups: { "<group-id>": { ... } }` (sin clave `"*"`)      |
| Solo tú puedes activar en grupos             | `groupPolicy: "allowlist"`, `groupAllowFrom: ["+1555..."]` |

## Claves de sesión

- Las sesiones de grupo usan claves de sesión `agent:<agentId>:<channel>:group:<id>` (las salas/canales usan `agent:<agentId>:<channel>:channel:<id>`).
- Los temas de foros de Telegram agregan `:topic:<threadId>` al id del grupo para que cada tema tenga su propia sesión.
- Los chats directos usan la sesión principal (o por remitente si está configurado).
- Los heartbeats se omiten en las sesiones de grupo.

<a id="pattern-personal-dms-public-groups-single-agent"></a>

## Patrón: MD personales + grupos públicos (agente único)

Sí: esto funciona bien si tu tráfico “personal” son **MD** y tu tráfico “público” son **grupos**.

Por qué: en el modo de agente único, los MD normalmente llegan a la clave de sesión **principal** (`agent:main:main`), mientras que los grupos siempre usan claves de sesión **no principales** (`agent:main:<channel>:group:<id>`). Si habilitas el sandbox con `mode: "non-main"`, esas sesiones de grupo se ejecutan en Docker mientras tu sesión principal de MD permanece en el host.

Esto te da un único “cerebro” de agente (espacio de trabajo + memoria compartidos), pero dos posturas de ejecución:

- **MD**: herramientas completas (host)
- **Grupos**: sandbox + herramientas restringidas (Docker)

> Si necesitas espacios de trabajo/personas realmente separados (“personal” y “público” nunca deben mezclarse), usa un segundo agente + bindings. Consulta [Enrutamiento multiagente](/es/concepts/multi-agent).

Ejemplo (MD en host, grupos en sandbox + solo herramientas de mensajería):

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // grupos/canales son no principales -> en sandbox
        scope: "session", // aislamiento más fuerte (un contenedor por grupo/canal)
        workspaceAccess: "none",
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        // Si allow no está vacío, todo lo demás se bloquea (deny sigue teniendo prioridad).
        allow: ["group:messaging", "group:sessions"],
        deny: ["group:runtime", "group:fs", "group:ui", "nodes", "cron", "gateway"],
      },
    },
  },
}
```

¿Quieres que “los grupos solo puedan ver la carpeta X” en vez de “sin acceso al host”? Mantén `workspaceAccess: "none"` y monta solo las rutas de la lista de permitidos en el sandbox:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
        docker: {
          binds: [
            // hostPath:containerPath:mode
            "/home/user/FriendsShared:/data:ro",
          ],
        },
      },
    },
  },
}
```

Relacionado:

- Claves de configuración y valores predeterminados: [Configuración del Gateway](/es/gateway/configuration-reference#agentsdefaultssandbox)
- Depurar por qué una herramienta está bloqueada: [Sandbox vs Tool Policy vs Elevated](/es/gateway/sandbox-vs-tool-policy-vs-elevated)
- Detalles de bind mounts: [Sandboxing](/es/gateway/sandboxing#custom-bind-mounts)

## Etiquetas visibles

- Las etiquetas de la UI usan `displayName` cuando está disponible, con formato `<channel>:<token>`.
- `#room` está reservado para salas/canales; los chats grupales usan `g-<slug>` (minúsculas, espacios -> `-`, conservar `#@+._-`).

## Política de grupos

Controla cómo se manejan los mensajes de grupos/salas por canal:

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "disabled", // "open" | "disabled" | "allowlist"
      groupAllowFrom: ["+15551234567"],
    },
    telegram: {
      groupPolicy: "disabled",
      groupAllowFrom: ["123456789"], // id numérico de usuario de Telegram (el asistente puede resolver @username)
    },
    signal: {
      groupPolicy: "disabled",
      groupAllowFrom: ["+15551234567"],
    },
    imessage: {
      groupPolicy: "disabled",
      groupAllowFrom: ["chat_id:123"],
    },
    msteams: {
      groupPolicy: "disabled",
      groupAllowFrom: ["user@org.com"],
    },
    discord: {
      groupPolicy: "allowlist",
      guilds: {
        GUILD_ID: { channels: { help: { allow: true } } },
      },
    },
    slack: {
      groupPolicy: "allowlist",
      channels: { "#general": { allow: true } },
    },
    matrix: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["@owner:example.org"],
      groups: {
        "!roomId:example.org": { allow: true },
        "#alias:example.org": { allow: true },
      },
    },
  },
}
```

| Política      | Comportamiento                                              |
| ------------- | ----------------------------------------------------------- |
| `"open"`      | Los grupos omiten las listas de permitidos; la restricción por menciones sigue aplicándose. |
| `"disabled"`  | Bloquea por completo todos los mensajes de grupo.           |
| `"allowlist"` | Solo permite grupos/salas que coincidan con la lista de permitidos configurada. |

Notas:

- `groupPolicy` es independiente de la restricción por menciones (que requiere @mentions).
- WhatsApp/Telegram/Signal/iMessage/Microsoft Teams/Zalo: usa `groupAllowFrom` (alternativa: `allowFrom` explícito).
- Las aprobaciones de emparejamiento por MD (entradas almacenadas en `*-allowFrom`) se aplican solo al acceso por MD; la autorización de remitentes en grupos sigue siendo explícita en las listas de permitidos de grupos.
- Discord: la lista de permitidos usa `channels.discord.guilds.<id>.channels`.
- Slack: la lista de permitidos usa `channels.slack.channels`.
- Matrix: la lista de permitidos usa `channels.matrix.groups`. Prefiere IDs o alias de sala; la búsqueda por nombre de sala unida es de mejor esfuerzo, y los nombres no resueltos se ignoran en tiempo de ejecución. Usa `channels.matrix.groupAllowFrom` para restringir remitentes; también se admiten listas de permitidos `users` por sala.
- Los MD grupales se controlan por separado (`channels.discord.dm.*`, `channels.slack.dm.*`).
- La lista de permitidos de Telegram puede coincidir con IDs de usuario (`"123456789"`, `"telegram:123456789"`, `"tg:123456789"`) o nombres de usuario (`"@alice"` o `"alice"`); los prefijos no distinguen mayúsculas de minúsculas.
- El valor predeterminado es `groupPolicy: "allowlist"`; si tu lista de permitidos de grupos está vacía, los mensajes de grupo se bloquean.
- Seguridad en tiempo de ejecución: cuando falta por completo un bloque de proveedor (`channels.<provider>` ausente), la política de grupos recurre a un modo de cierre por defecto (normalmente `allowlist`) en lugar de heredar `channels.defaults.groupPolicy`.

Modelo mental rápido (orden de evaluación para mensajes de grupo):

1. `groupPolicy` (open/disabled/allowlist)
2. listas de permitidos de grupo (`*.groups`, `*.groupAllowFrom`, lista de permitidos específica del canal)
3. restricción por menciones (`requireMention`, `/activation`)

## Restricción por menciones (predeterminado)

Los mensajes de grupo requieren una mención a menos que se anule por grupo. Los valores predeterminados viven por subsistema en `*.groups."*"`.

Responder a un mensaje del bot cuenta como una mención implícita (cuando el canal admite metadatos de respuesta). Esto se aplica a Telegram, WhatsApp, Slack, Discord y Microsoft Teams.

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "*": { requireMention: true },
        "123@g.us": { requireMention: false },
      },
    },
    telegram: {
      groups: {
        "*": { requireMention: true },
        "123456789": { requireMention: false },
      },
    },
    imessage: {
      groups: {
        "*": { requireMention: true },
        "123": { requireMention: false },
      },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw", "\\+15555550123"],
          historyLimit: 50,
        },
      },
    ],
  },
}
```

Notas:

- `mentionPatterns` son patrones regex seguros y sin distinción entre mayúsculas y minúsculas; los patrones no válidos y las formas inseguras de repetición anidada se ignoran.
- Las superficies que proporcionan menciones explícitas siguen pasando; los patrones son un mecanismo de respaldo.
- Anulación por agente: `agents.list[].groupChat.mentionPatterns` (útil cuando varios agentes comparten un grupo).
- La restricción por menciones solo se aplica cuando es posible detectar menciones (menciones nativas o `mentionPatterns` configurados).
- Los valores predeterminados de Discord viven en `channels.discord.guilds."*"` (anulables por guild/canal).
- El contexto del historial de grupo se encapsula uniformemente entre canales y es **solo pendiente** (mensajes omitidos por la restricción por menciones); usa `messages.groupChat.historyLimit` para el valor predeterminado global y `channels.<channel>.historyLimit` (o `channels.<channel>.accounts.*.historyLimit`) para anulaciones. Establece `0` para desactivarlo.

## Restricciones de herramientas por grupo/canal (opcional)

Algunas configuraciones de canal permiten restringir qué herramientas están disponibles **dentro de un grupo/sala/canal específico**.

- `tools`: permite/deniega herramientas para todo el grupo.
- `toolsBySender`: anulaciones por remitente dentro del grupo.
  Usa prefijos de clave explícitos:
  `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` y comodín `"*"`.
  Las claves heredadas sin prefijo todavía se aceptan y se interpretan solo como `id:`.

Orden de resolución (gana el más específico):

1. coincidencia en `toolsBySender` del grupo/canal
2. `tools` del grupo/canal
3. coincidencia en `toolsBySender` predeterminado (`"*"` )
4. `tools` predeterminado (`"*"`)

Ejemplo (Telegram):

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { tools: { deny: ["exec"] } },
        "-1001234567890": {
          tools: { deny: ["exec", "read", "write"] },
          toolsBySender: {
            "id:123456789": { alsoAllow: ["exec"] },
          },
        },
      },
    },
  },
}
```

Notas:

- Las restricciones de herramientas por grupo/canal se aplican además de la política global/de agente para herramientas (deny sigue teniendo prioridad).
- Algunos canales usan una anidación distinta para salas/canales (por ejemplo, Discord `guilds.*.channels.*`, Slack `channels.*`, Microsoft Teams `teams.*.channels.*`).

## Listas de permitidos de grupos

Cuando `channels.whatsapp.groups`, `channels.telegram.groups` o `channels.imessage.groups` está configurado, las claves actúan como una lista de permitidos de grupos. Usa `"*"` para permitir todos los grupos y aun así definir el comportamiento predeterminado de menciones.

Confusión común: la aprobación de emparejamiento por MD no es lo mismo que la autorización de grupos.
En los canales que admiten emparejamiento por MD, el almacén de emparejamiento desbloquea solo los MD. Los comandos de grupo siguen requiriendo autorización explícita de remitentes del grupo desde listas de permitidos de configuración como `groupAllowFrom` o la alternativa de configuración documentada para ese canal.

Intenciones comunes (copiar/pegar):

1. Desactivar todas las respuestas en grupos

```json5
{
  channels: { whatsapp: { groupPolicy: "disabled" } },
}
```

2. Permitir solo grupos específicos (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groups: {
        "123@g.us": { requireMention: true },
        "456@g.us": { requireMention: false },
      },
    },
  },
}
```

3. Permitir todos los grupos pero exigir mención (explícito)

```json5
{
  channels: {
    whatsapp: {
      groups: { "*": { requireMention: true } },
    },
  },
}
```

4. Solo el propietario puede activar en grupos (WhatsApp)

```json5
{
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
      groups: { "*": { requireMention: true } },
    },
  },
}
```

## Activación (solo propietario)

Los propietarios de grupos pueden alternar la activación por grupo:

- `/activation mention`
- `/activation always`

El propietario se determina mediante `channels.whatsapp.allowFrom` (o la E.164 propia del bot si no está configurado). Envía el comando como mensaje independiente. Otras superficies actualmente ignoran `/activation`.

## Campos de contexto

Las cargas entrantes de grupo establecen:

- `ChatType=group`
- `GroupSubject` (si se conoce)
- `GroupMembers` (si se conocen)
- `WasMentioned` (resultado de la restricción por menciones)
- Los temas de foros de Telegram también incluyen `MessageThreadId` e `IsForum`.

Notas específicas del canal:

- BlueBubbles puede enriquecer opcionalmente a participantes de grupos sin nombre en macOS desde la base de datos local de Contactos antes de poblar `GroupMembers`. Esto está desactivado de forma predeterminada y solo se ejecuta después de que pase la restricción normal de grupos.

El prompt del sistema del agente incluye una introducción de grupo en el primer turno de una nueva sesión de grupo. Le recuerda al modelo que responda como un humano, que evite tablas Markdown, que minimice las líneas vacías y siga el espaciado normal del chat, y que evite escribir secuencias literales `\n`.

## Detalles específicos de iMessage

- Prefiere `chat_id:<id>` al enrutar o usar listas de permitidos.
- Listar chats: `imsg chats --limit 20`.
- Las respuestas a grupos siempre vuelven al mismo `chat_id`.

## Detalles específicos de WhatsApp

Consulta [Mensajes de grupo](/es/channels/group-messages) para el comportamiento exclusivo de WhatsApp (inyección de historial, detalles del manejo de menciones).
