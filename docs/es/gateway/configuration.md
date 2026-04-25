---
read_when:
    - Configurar OpenClaw por primera vez
    - Buscar patrones de configuración comunes
    - Ir a secciones específicas de configuración
summary: 'Resumen de configuración: tareas comunes, configuración rápida y enlaces a la referencia completa'
title: Configuración
x-i18n:
    generated_at: "2026-04-25T13:45:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: a8ffe1972fc7680d4cfc55a24fd6fc3869af593faf8c1137369dad0dbefde43a
    source_path: gateway/configuration.md
    workflow: 15
---

OpenClaw lee una configuración opcional en <Tooltip tip="JSON5 admite comentarios y comas finales">**JSON5**</Tooltip> desde `~/.openclaw/openclaw.json`.
La ruta de configuración activa debe ser un archivo normal. Los diseños con `openclaw.json`
enlazado mediante symlink no son compatibles con las escrituras propiedad de OpenClaw; una escritura atómica puede reemplazar
la ruta en lugar de conservar el symlink. Si mantienes la configuración fuera del
directorio de estado predeterminado, apunta `OPENCLAW_CONFIG_PATH` directamente al archivo real.

Si falta el archivo, OpenClaw usa valores predeterminados seguros. Motivos comunes para añadir una configuración:

- Conectar canales y controlar quién puede enviar mensajes al bot
- Establecer modelos, herramientas, sandboxing o automatización (Cron, hooks)
- Ajustar sesiones, medios, redes o UI

Consulta la [referencia completa](/es/gateway/configuration-reference) para ver todos los campos disponibles.

<Tip>
**¿Eres nuevo en la configuración?** Empieza con `openclaw onboard` para una configuración interactiva, o consulta la guía de [Ejemplos de configuración](/es/gateway/configuration-examples) para ver configuraciones completas listas para copiar y pegar.
</Tip>

## Configuración mínima

```json5
// ~/.openclaw/openclaw.json
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

## Editar la configuración

<Tabs>
  <Tab title="Asistente interactivo">
    ```bash
    openclaw onboard       # flujo completo de incorporación
    openclaw configure     # asistente de configuración
    ```
  </Tab>
  <Tab title="CLI (líneas únicas)">
    ```bash
    openclaw config get agents.defaults.workspace
    openclaw config set agents.defaults.heartbeat.every "2h"
    openclaw config unset plugins.entries.brave.config.webSearch.apiKey
    ```
  </Tab>
  <Tab title="UI de control">
    Abre [http://127.0.0.1:18789](http://127.0.0.1:18789) y usa la pestaña **Config**.
    La UI de control renderiza un formulario a partir del esquema de configuración en vivo, incluido el
    metadato de documentación de campos `title` / `description`, además de esquemas de plugins y canales cuando
    están disponibles, con un editor **Raw JSON** como vía de escape. Para UIs de navegación detallada
    y otras herramientas, el gateway también expone `config.schema.lookup` para
    obtener un nodo del esquema acotado a una ruta más resúmenes inmediatos de sus hijos.
  </Tab>
  <Tab title="Edición directa">
    Edita `~/.openclaw/openclaw.json` directamente. El Gateway observa el archivo y aplica los cambios automáticamente (consulta [recarga en caliente](#config-hot-reload)).
  </Tab>
</Tabs>

## Validación estricta

<Warning>
OpenClaw solo acepta configuraciones que coincidan completamente con el esquema. Las claves desconocidas, los tipos mal formados o los valores no válidos hacen que el Gateway **se niegue a iniciarse**. La única excepción en el nivel raíz es `$schema` (cadena), para que los editores puedan adjuntar metadatos de JSON Schema.
</Warning>

`openclaw config schema` imprime el JSON Schema canónico que usa la UI de control
y la validación. `config.schema.lookup` obtiene un único nodo acotado a una ruta más
resúmenes de los hijos para herramientas de navegación detallada. El metadato de documentación `title`/`description`
de los campos se conserva en objetos anidados, comodines (`*`), elementos de matriz (`[]`) y ramas `anyOf`/
`oneOf`/`allOf`. Los esquemas de plugins y canales en tiempo de ejecución se fusionan cuando el
registro de manifiestos está cargado.

Cuando falla la validación:

- El Gateway no se inicia
- Solo funcionan los comandos de diagnóstico (`openclaw doctor`, `openclaw logs`, `openclaw health`, `openclaw status`)
- Ejecuta `openclaw doctor` para ver los problemas exactos
- Ejecuta `openclaw doctor --fix` (o `--yes`) para aplicar reparaciones

El Gateway conserva una copia fiable de último estado correcto después de cada inicio exitoso.
Si `openclaw.json` falla más tarde la validación (o elimina `gateway.mode`, se reduce
bruscamente o tiene una línea de registro extra al principio), OpenClaw conserva el archivo
dañado como `.clobbered.*`, restaura la última copia correcta conocida y registra el motivo
de la recuperación. El siguiente turno del agente también recibe una advertencia de evento del sistema para que el agente principal no reescriba a ciegas la configuración restaurada. La promoción a última-copia-correcta
se omite cuando un candidato contiene marcadores redactados de secretos como `***`.
Cuando todos los problemas de validación están acotados a `plugins.entries.<id>...`, OpenClaw
no realiza recuperación de archivo completo. Mantiene activa la configuración actual y
muestra el fallo local del plugin para que una discrepancia entre esquema de plugin y versión del host
no revierta configuraciones del usuario no relacionadas.

## Tareas comunes

<AccordionGroup>
  <Accordion title="Configurar un canal (WhatsApp, Telegram, Discord, etc.)">
    Cada canal tiene su propia sección de configuración en `channels.<provider>`. Consulta la página dedicada del canal para ver los pasos de configuración:

    - [WhatsApp](/es/channels/whatsapp) — `channels.whatsapp`
    - [Telegram](/es/channels/telegram) — `channels.telegram`
    - [Discord](/es/channels/discord) — `channels.discord`
    - [Feishu](/es/channels/feishu) — `channels.feishu`
    - [Google Chat](/es/channels/googlechat) — `channels.googlechat`
    - [Microsoft Teams](/es/channels/msteams) — `channels.msteams`
    - [Slack](/es/channels/slack) — `channels.slack`
    - [Signal](/es/channels/signal) — `channels.signal`
    - [iMessage](/es/channels/imessage) — `channels.imessage`
    - [Mattermost](/es/channels/mattermost) — `channels.mattermost`

    Todos los canales comparten el mismo patrón de política de mensajes directos:

    ```json5
    {
      channels: {
        telegram: {
          enabled: true,
          botToken: "123:abc",
          dmPolicy: "pairing",   // pairing | allowlist | open | disabled
          allowFrom: ["tg:123"], // solo para allowlist/open
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Elegir y configurar modelos">
    Establece el modelo principal y los respaldos opcionales:

    ```json5
    {
      agents: {
        defaults: {
          model: {
            primary: "anthropic/claude-sonnet-4-6",
            fallbacks: ["openai/gpt-5.4"],
          },
          models: {
            "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
            "openai/gpt-5.4": { alias: "GPT" },
          },
        },
      },
    }
    ```

    - `agents.defaults.models` define el catálogo de modelos y actúa como lista de permitidos para `/model`.
    - Usa `openclaw config set agents.defaults.models '<json>' --strict-json --merge` para añadir entradas a la lista de permitidos sin eliminar modelos existentes. Los reemplazos simples que eliminarían entradas se rechazan a menos que pases `--replace`.
    - Las referencias de modelo usan el formato `provider/model` (por ejemplo `anthropic/claude-opus-4-6`).
    - `agents.defaults.imageMaxDimensionPx` controla la reducción de escala de imágenes de transcript/herramienta (predeterminado `1200`); los valores menores suelen reducir el uso de tokens de visión en ejecuciones con muchas capturas de pantalla.
    - Consulta [CLI de modelos](/es/concepts/models) para cambiar modelos en el chat y [Failover de modelos](/es/concepts/model-failover) para la rotación de autenticación y el comportamiento de respaldo.
    - Para proveedores personalizados/alojados por cuenta propia, consulta [Proveedores personalizados](/es/gateway/config-tools#custom-providers-and-base-urls) en la referencia.

  </Accordion>

  <Accordion title="Controlar quién puede enviar mensajes al bot">
    El acceso por mensajes directos se controla por canal mediante `dmPolicy`:

    - `"pairing"` (predeterminado): los remitentes desconocidos reciben un código único de vinculación para aprobar
    - `"allowlist"`: solo remitentes en `allowFrom` (o en el almacén de permitidos vinculado)
    - `"open"`: permite todos los mensajes directos entrantes (requiere `allowFrom: ["*"]`)
    - `"disabled"`: ignora todos los mensajes directos

    Para grupos, usa `groupPolicy` + `groupAllowFrom` o listas de permitidos específicas del canal.

    Consulta la [referencia completa](/es/gateway/config-channels#dm-and-group-access) para ver detalles por canal.

  </Accordion>

  <Accordion title="Configurar el requisito de mención en chats grupales">
    Los mensajes de grupo requieren **mención** de forma predeterminada. Configura patrones por agente:

    ```json5
    {
      agents: {
        list: [
          {
            id: "main",
            groupChat: {
              mentionPatterns: ["@openclaw", "openclaw"],
            },
          },
        ],
      },
      channels: {
        whatsapp: {
          groups: { "*": { requireMention: true } },
        },
      },
    }
    ```

    - **Menciones de metadatos**: menciones nativas con @ (mención táctil de WhatsApp, Telegram @bot, etc.)
    - **Patrones de texto**: patrones regex seguros en `mentionPatterns`
    - Consulta la [referencia completa](/es/gateway/config-channels#group-chat-mention-gating) para ver sobrescrituras por canal y el modo de chat propio.

  </Accordion>

  <Accordion title="Restringir Skills por agente">
    Usa `agents.defaults.skills` para una base compartida y luego sobrescribe agentes específicos con `agents.list[].skills`:

    ```json5
    {
      agents: {
        defaults: {
          skills: ["github", "weather"],
        },
        list: [
          { id: "writer" }, // hereda github, weather
          { id: "docs", skills: ["docs-search"] }, // reemplaza los valores predeterminados
          { id: "locked-down", skills: [] }, // sin Skills
        ],
      },
    }
    ```

    - Omite `agents.defaults.skills` para tener Skills sin restricciones de forma predeterminada.
    - Omite `agents.list[].skills` para heredar los valores predeterminados.
    - Establece `agents.list[].skills: []` para no tener Skills.
    - Consulta [Skills](/es/tools/skills), [Configuración de Skills](/es/tools/skills-config) y
      la [Referencia de configuración](/es/gateway/config-agents#agents-defaults-skills).

  </Accordion>

  <Accordion title="Ajustar la supervisión de estado de canales del gateway">
    Controla cuán agresivamente el gateway reinicia canales que parecen obsoletos:

    ```json5
    {
      gateway: {
        channelHealthCheckMinutes: 5,
        channelStaleEventThresholdMinutes: 30,
        channelMaxRestartsPerHour: 10,
      },
      channels: {
        telegram: {
          healthMonitor: { enabled: false },
          accounts: {
            alerts: {
              healthMonitor: { enabled: true },
            },
          },
        },
      },
    }
    ```

    - Establece `gateway.channelHealthCheckMinutes: 0` para desactivar globalmente los reinicios por monitor de estado.
    - `channelStaleEventThresholdMinutes` debe ser mayor o igual que el intervalo de comprobación.
    - Usa `channels.<provider>.healthMonitor.enabled` o `channels.<provider>.accounts.<id>.healthMonitor.enabled` para desactivar los reinicios automáticos para un canal o cuenta sin desactivar el monitor global.
    - Consulta [Comprobaciones de estado](/es/gateway/health) para la depuración operativa y la [referencia completa](/es/gateway/configuration-reference#gateway) para todos los campos.

  </Accordion>

  <Accordion title="Configurar sesiones y restablecimientos">
    Las sesiones controlan la continuidad y el aislamiento de la conversación:

    ```json5
    {
      session: {
        dmScope: "per-channel-peer",  // recomendado para varios usuarios
        threadBindings: {
          enabled: true,
          idleHours: 24,
          maxAgeHours: 0,
        },
        reset: {
          mode: "daily",
          atHour: 4,
          idleMinutes: 120,
        },
      },
    }
    ```

    - `dmScope`: `main` (compartido) | `per-peer` | `per-channel-peer` | `per-account-channel-peer`
    - `threadBindings`: valores predeterminados globales para el enrutamiento de sesiones ligadas a hilos (Discord admite `/focus`, `/unfocus`, `/agents`, `/session idle` y `/session max-age`).
    - Consulta [Gestión de sesiones](/es/concepts/session) para ver alcance, vínculos de identidad y política de envío.
    - Consulta la [referencia completa](/es/gateway/config-agents#session) para todos los campos.

  </Accordion>

  <Accordion title="Habilitar sandboxing">
    Ejecuta sesiones del agente en entornos de ejecución aislados:

    ```json5
    {
      agents: {
        defaults: {
          sandbox: {
            mode: "non-main",  // off | non-main | all
            scope: "agent",    // session | agent | shared
          },
        },
      },
    }
    ```

    Construye primero la imagen: `scripts/sandbox-setup.sh`

    Consulta [Sandboxing](/es/gateway/sandboxing) para la guía completa y la [referencia completa](/es/gateway/config-agents#agentsdefaultssandbox) para todas las opciones.

  </Accordion>

  <Accordion title="Habilitar push con relay para compilaciones oficiales de iOS">
    El push con relay se configura en `openclaw.json`.

    Establece esto en la configuración del gateway:

    ```json5
    {
      gateway: {
        push: {
          apns: {
            relay: {
              baseUrl: "https://relay.example.com",
              // Opcional. Predeterminado: 10000
              timeoutMs: 10000,
            },
          },
        },
      },
    }
    ```

    Equivalente en CLI:

    ```bash
    openclaw config set gateway.push.apns.relay.baseUrl https://relay.example.com
    ```

    Qué hace esto:

    - Permite que el gateway envíe `push.test`, avisos de activación y activaciones de reconexión a través del relay externo.
    - Usa un permiso de envío con alcance de registro reenviado por la app iOS vinculada. El gateway no necesita un token de relay de toda la implementación.
    - Vincula cada registro respaldado por relay con la identidad del gateway con la que se emparejó la app iOS, para que otro gateway no pueda reutilizar el registro almacenado.
    - Mantiene las compilaciones locales/manuales de iOS en APNs directo. Los envíos respaldados por relay se aplican solo a las compilaciones oficiales distribuidas que se registraron a través del relay.
    - Debe coincidir con la URL base del relay integrada en la compilación oficial/TestFlight de iOS, para que el tráfico de registro y envío llegue a la misma implementación del relay.

    Flujo de extremo a extremo:

    1. Instala una compilación oficial/TestFlight de iOS que se haya compilado con la misma URL base del relay.
    2. Configura `gateway.push.apns.relay.baseUrl` en el gateway.
    3. Vincula la app iOS con el gateway y deja que se conecten las sesiones de nodo y operador.
    4. La app iOS obtiene la identidad del gateway, se registra en el relay usando App Attest más el recibo de la app y después publica la carga útil `push.apns.register` respaldada por relay en el gateway vinculado.
    5. El gateway almacena el identificador del relay y el permiso de envío, y luego los usa para `push.test`, avisos de activación y activaciones de reconexión.

    Notas operativas:

    - Si cambias la app iOS a otro gateway, vuelve a conectar la app para que pueda publicar un nuevo registro de relay vinculado a ese gateway.
    - Si distribuyes una nueva compilación de iOS que apunte a otra implementación de relay, la app actualiza su registro de relay en caché en lugar de reutilizar el origen antiguo del relay.

    Nota de compatibilidad:

    - `OPENCLAW_APNS_RELAY_BASE_URL` y `OPENCLAW_APNS_RELAY_TIMEOUT_MS` siguen funcionando como sobrescrituras temporales por entorno.
    - `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true` sigue siendo una vía de escape de desarrollo solo para loopback; no persistas URL HTTP del relay en la configuración.

    Consulta [App iOS](/es/platforms/ios#relay-backed-push-for-official-builds) para el flujo completo de extremo a extremo y [Flujo de autenticación y confianza](/es/platforms/ios#authentication-and-trust-flow) para el modelo de seguridad del relay.

  </Accordion>

  <Accordion title="Configurar Heartbeat (comprobaciones periódicas)">
    ```json5
    {
      agents: {
        defaults: {
          heartbeat: {
            every: "30m",
            target: "last",
          },
        },
      },
    }
    ```

    - `every`: cadena de duración (`30m`, `2h`). Establece `0m` para desactivar.
    - `target`: `last` | `none` | `<channel-id>` (por ejemplo `discord`, `matrix`, `telegram` o `whatsapp`)
    - `directPolicy`: `allow` (predeterminado) o `block` para destinos de Heartbeat de estilo DM
    - Consulta [Heartbeat](/es/gateway/heartbeat) para ver la guía completa.

  </Accordion>

  <Accordion title="Configurar trabajos Cron">
    ```json5
    {
      cron: {
        enabled: true,
        maxConcurrentRuns: 2,
        sessionRetention: "24h",
        runLog: {
          maxBytes: "2mb",
          keepLines: 2000,
        },
      },
    }
    ```

    - `sessionRetention`: elimina sesiones aisladas completadas de `sessions.json` (predeterminado `24h`; establece `false` para desactivar).
    - `runLog`: poda `cron/runs/<jobId>.jsonl` por tamaño y líneas retenidas.
    - Consulta [Trabajos Cron](/es/automation/cron-jobs) para ver una visión general de la función y ejemplos de CLI.

  </Accordion>

  <Accordion title="Configurar Webhooks (hooks)">
    Habilita endpoints HTTP de Webhook en el Gateway:

    ```json5
    {
      hooks: {
        enabled: true,
        token: "shared-secret",
        path: "/hooks",
        defaultSessionKey: "hook:ingress",
        allowRequestSessionKey: false,
        allowedSessionKeyPrefixes: ["hook:"],
        mappings: [
          {
            match: { path: "gmail" },
            action: "agent",
            agentId: "main",
            deliver: true,
          },
        ],
      },
    }
    ```

    Nota de seguridad:
    - Trata todo el contenido de carga útil de hooks/Webhook como entrada no confiable.
    - Usa un `hooks.token` dedicado; no reutilices el token compartido del Gateway.
    - La autenticación de hooks es solo por encabezado (`Authorization: Bearer ...` o `x-openclaw-token`); los tokens en query string se rechazan.
    - `hooks.path` no puede ser `/`; mantén el ingreso de Webhook en una subruta dedicada como `/hooks`.
    - Mantén deshabilitadas las marcas de omisión de contenido no seguro (`hooks.gmail.allowUnsafeExternalContent`, `hooks.mappings[].allowUnsafeExternalContent`) a menos que estés haciendo depuración muy acotada.
    - Si habilitas `hooks.allowRequestSessionKey`, establece también `hooks.allowedSessionKeyPrefixes` para limitar las claves de sesión elegidas por quien llama.
    - Para agentes impulsados por hooks, prefiere niveles de modelo modernos y sólidos y una política estricta de herramientas (por ejemplo, solo mensajería más sandboxing cuando sea posible).

    Consulta la [referencia completa](/es/gateway/configuration-reference#hooks) para ver todas las opciones de mapeo y la integración con Gmail.

  </Accordion>

  <Accordion title="Configurar enrutamiento multiagente">
    Ejecuta varios agentes aislados con espacios de trabajo y sesiones separados:

    ```json5
    {
      agents: {
        list: [
          { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
          { id: "work", workspace: "~/.openclaw/workspace-work" },
        ],
      },
      bindings: [
        { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
        { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
      ],
    }
    ```

    Consulta [Multi-Agent](/es/concepts/multi-agent) y la [referencia completa](/es/gateway/config-agents#multi-agent-routing) para ver reglas de vinculación y perfiles de acceso por agente.

  </Accordion>

  <Accordion title="Dividir la configuración en varios archivos ($include)">
    Usa `$include` para organizar configuraciones grandes:

    ```json5
    // ~/.openclaw/openclaw.json
    {
      gateway: { port: 18789 },
      agents: { $include: "./agents.json5" },
      broadcast: {
        $include: ["./clients/a.json5", "./clients/b.json5"],
      },
    }
    ```

    - **Archivo único**: reemplaza el objeto contenedor
    - **Matriz de archivos**: se fusiona en profundidad en orden (el posterior prevalece)
    - **Claves hermanas**: se fusionan después de los includes (sobrescriben valores incluidos)
    - **Includes anidados**: compatibles hasta 10 niveles de profundidad
    - **Rutas relativas**: se resuelven respecto del archivo que incluye
    - **Escrituras propiedad de OpenClaw**: cuando una escritura cambia solo una sección de nivel superior
      respaldada por un include de archivo único como `plugins: { $include: "./plugins.json5" }`,
      OpenClaw actualiza ese archivo incluido y deja intacto `openclaw.json`
    - **Escritura directa no compatible**: includes de raíz, matrices de includes e includes
      con sobrescrituras hermanas fallan de forma cerrada para escrituras propiedad de OpenClaw en lugar de
      aplanar la configuración
    - **Manejo de errores**: errores claros para archivos faltantes, errores de análisis e includes circulares

  </Accordion>
</AccordionGroup>

## Recarga en caliente de configuración

El Gateway observa `~/.openclaw/openclaw.json` y aplica los cambios automáticamente; no hace falta reiniciar manualmente para la mayoría de configuraciones.

Las ediciones directas del archivo se tratan como no confiables hasta que validan. El observador espera
a que se estabilicen los cambios temporales/escrituras con renombrado del editor, lee el archivo final y rechaza
ediciones externas no válidas restaurando la última configuración correcta conocida. Las escrituras de configuración
propiedad de OpenClaw usan la misma restricción de esquema antes de escribir; sobrescrituras destructivas como
eliminar `gateway.mode` o reducir el archivo a menos de la mitad se rechazan
y se guardan como `.rejected.*` para su inspección.

Los fallos de validación locales del plugin son la excepción: si todos los problemas están bajo
`plugins.entries.<id>...`, la recarga mantiene la configuración actual e informa el problema del plugin
en lugar de restaurar `.last-good`.

Si ves `Config auto-restored from last-known-good` o
`config reload restored last-known-good config` en los registros, inspecciona el archivo
`.clobbered.*` correspondiente junto a `openclaw.json`, corrige la carga útil rechazada y luego ejecuta
`openclaw config validate`. Consulta [Solución de problemas del Gateway](/es/gateway/troubleshooting#gateway-restored-last-known-good-config)
para la lista de recuperación.

### Modos de recarga

| Modo                   | Comportamiento                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------- |
| **`hybrid`** (predeterminado) | Aplica en caliente los cambios seguros al instante. Reinicia automáticamente para los críticos. |
| **`hot`**              | Aplica en caliente solo los cambios seguros. Registra una advertencia cuando se necesita reinicio: tú te encargas. |
| **`restart`**          | Reinicia el Gateway ante cualquier cambio de configuración, seguro o no.              |
| **`off`**              | Desactiva la observación de archivos. Los cambios surten efecto en el siguiente reinicio manual. |

```json5
{
  gateway: {
    reload: { mode: "hybrid", debounceMs: 300 },
  },
}
```

### Qué se aplica en caliente y qué necesita reinicio

La mayoría de los campos se aplican en caliente sin tiempo de inactividad. En modo `hybrid`, los cambios que requieren reinicio se gestionan automáticamente.

| Categoría            | Campos                                                            | ¿Necesita reinicio? |
| ------------------- | ----------------------------------------------------------------- | ------------------- |
| Canales             | `channels.*`, `web` (WhatsApp): todos los canales integrados y de plugins | No                  |
| Agente y modelos    | `agent`, `agents`, `models`, `routing`                            | No                  |
| Automatización      | `hooks`, `cron`, `agent.heartbeat`                                | No                  |
| Sesiones y mensajes | `session`, `messages`                                             | No                  |
| Herramientas y medios | `tools`, `browser`, `skills`, `mcp`, `audio`, `talk`            | No                  |
| UI y varios         | `ui`, `logging`, `identity`, `bindings`                           | No                  |
| Servidor Gateway    | `gateway.*` (puerto, bind, auth, tailscale, TLS, HTTP)            | **Sí**              |
| Infraestructura     | `discovery`, `canvasHost`, `plugins`                              | **Sí**              |

<Note>
`gateway.reload` y `gateway.remote` son excepciones: cambiarlos **no** provoca reinicio.
</Note>

### Planificación de recarga

Cuando editas un archivo fuente al que se hace referencia mediante `$include`, OpenClaw planifica
la recarga a partir del diseño creado en el origen, no de la vista aplanada en memoria.
Eso mantiene predecibles las decisiones de recarga en caliente (aplicar en caliente frente a reiniciar) incluso cuando una
única sección de nivel superior vive en su propio archivo incluido, como
`plugins: { $include: "./plugins.json5" }`. La planificación de recarga falla de forma cerrada si el
diseño de origen es ambiguo.

## RPC de configuración (actualizaciones programáticas)

Para herramientas que escriben configuración a través de la API del gateway, prefiere este flujo:

- `config.schema.lookup` para inspeccionar un subárbol (nodo de esquema superficial +
  resúmenes de hijos)
- `config.get` para obtener la instantánea actual más `hash`
- `config.patch` para actualizaciones parciales (JSON merge patch: los objetos se fusionan, `null`
  elimina, las matrices reemplazan)
- `config.apply` solo cuando pretendas reemplazar la configuración completa
- `update.run` para autoactualización explícita más reinicio

<Note>
Las escrituras del plano de control (`config.apply`, `config.patch`, `update.run`) están
limitadas a 3 solicitudes por 60 segundos por `deviceId+clientIp`. Las solicitudes de reinicio se agrupan y luego imponen un tiempo de espera de 30 segundos entre ciclos de reinicio.
</Note>

Ejemplo de parche parcial:

```bash
openclaw gateway call config.get --params '{}'  # capturar payload.hash
openclaw gateway call config.patch --params '{
  "raw": "{ channels: { telegram: { groups: { \"*\": { requireMention: false } } } } }",
  "baseHash": "<hash>"
}'
```

Tanto `config.apply` como `config.patch` aceptan `raw`, `baseHash`, `sessionKey`,
`note` y `restartDelayMs`. `baseHash` es obligatorio para ambos métodos cuando ya
existe una configuración.

## Variables de entorno

OpenClaw lee variables de entorno del proceso padre además de:

- `.env` del directorio de trabajo actual (si existe)
- `~/.openclaw/.env` (respaldo global)

Ninguno de los archivos sobrescribe variables de entorno existentes. También puedes establecer variables de entorno inline en la configuración:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: { GROQ_API_KEY: "gsk-..." },
  },
}
```

<Accordion title="Importación de env del shell (opcional)">
  Si está habilitado y las claves esperadas no están establecidas, OpenClaw ejecuta tu shell de inicio de sesión e importa solo las claves faltantes:

```json5
{
  env: {
    shellEnv: { enabled: true, timeoutMs: 15000 },
  },
}
```

Equivalente en variable de entorno: `OPENCLAW_LOAD_SHELL_ENV=1`
</Accordion>

<Accordion title="Sustitución de variables de entorno en valores de configuración">
  Haz referencia a variables de entorno en cualquier valor de cadena de configuración con `${VAR_NAME}`:

```json5
{
  gateway: { auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" } },
  models: { providers: { custom: { apiKey: "${CUSTOM_API_KEY}" } } },
}
```

Reglas:

- Solo coinciden nombres en mayúsculas: `[A-Z_][A-Z0-9_]*`
- Las variables faltantes/vacías producen un error en tiempo de carga
- Escapa con `$${VAR}` para una salida literal
- Funciona dentro de archivos `$include`
- Sustitución inline: `"${BASE}/v1"` → `"https://api.example.com/v1"`

</Accordion>

<Accordion title="Referencias a secretos (env, file, exec)">
  Para campos que admiten objetos SecretRef, puedes usar:

```json5
{
  models: {
    providers: {
      openai: { apiKey: { source: "env", provider: "default", id: "OPENAI_API_KEY" } },
    },
  },
  skills: {
    entries: {
      "image-lab": {
        apiKey: {
          source: "file",
          provider: "filemain",
          id: "/skills/entries/image-lab/apiKey",
        },
      },
    },
  },
  channels: {
    googlechat: {
      serviceAccountRef: {
        source: "exec",
        provider: "vault",
        id: "channels/googlechat/serviceAccount",
      },
    },
  },
}
```

Los detalles de SecretRef (incluido `secrets.providers` para `env`/`file`/`exec`) están en [Gestión de secretos](/es/gateway/secrets).
Las rutas de credenciales compatibles se enumeran en [Superficie de credenciales SecretRef](/es/reference/secretref-credential-surface).
</Accordion>

Consulta [Entorno](/es/help/environment) para ver la precedencia completa y las fuentes.

## Referencia completa

Para la referencia completa campo por campo, consulta **[Referencia de configuración](/es/gateway/configuration-reference)**.

---

_Relacionado: [Ejemplos de configuración](/es/gateway/configuration-examples) · [Referencia de configuración](/es/gateway/configuration-reference) · [Doctor](/es/gateway/doctor)_

## Relacionado

- [Referencia de configuración](/es/gateway/configuration-reference)
- [Ejemplos de configuración](/es/gateway/configuration-examples)
- [Manual operativo del Gateway](/es/gateway)
