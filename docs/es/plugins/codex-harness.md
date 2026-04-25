---
read_when:
    - Quieres usar el harness app-server de Codex incluido
    - Necesitas ejemplos de configuración del harness Codex
    - Quieres que las implementaciones solo de Codex fallen en lugar de recurrir a Pi
summary: Ejecuta turnos de agentes embebidos de OpenClaw mediante el harness app-server de Codex incluido
title: Harness Codex
x-i18n:
    generated_at: "2026-04-25T13:50:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5458c8501338361a001c3457235d2a9abfc7e24709f2e50185bc31b92bbadb3b
    source_path: plugins/codex-harness.md
    workflow: 15
---

El plugin `codex` incluido permite que OpenClaw ejecute turnos de agentes embebidos a través del
app-server de Codex en lugar del harness PI integrado.

Úsalo cuando quieras que Codex posea la sesión de agente de bajo nivel: descubrimiento
de modelos, reanudación nativa de hilos, Compaction nativa y ejecución en app-server.
OpenClaw sigue siendo responsable de los canales de chat, archivos de sesión, selección de modelos, herramientas,
aprobaciones, entrega de multimedia y el espejo visible de la transcripción.

Si estás intentando orientarte, empieza con
[Runtimes de agentes](/es/concepts/agent-runtimes). La versión corta es:
`openai/gpt-5.5` es la referencia del modelo, `codex` es el runtime, y Telegram,
Discord, Slack u otro canal sigue siendo la superficie de comunicación.

Los turnos nativos de Codex mantienen los hooks de plugins de OpenClaw como la capa pública de compatibilidad.
Estos son hooks en proceso de OpenClaw, no hooks de comandos `hooks.json` de Codex:

- `before_prompt_build`
- `before_compaction`, `after_compaction`
- `llm_input`, `llm_output`
- `before_tool_call`, `after_tool_call`
- `before_message_write` para registros reflejados de transcripción
- `agent_end`

Los plugins también pueden registrar middleware neutral al runtime para resultados de herramientas a fin de reescribir
los resultados de herramientas dinámicas de OpenClaw después de que OpenClaw ejecuta la herramienta y antes de que
el resultado se devuelva a Codex. Esto es independiente del hook público de plugin
`tool_result_persist`, que transforma las escrituras de resultados de herramientas en transcripciones propiedad de OpenClaw.

Para la semántica de los hooks de plugins en sí, consulta [Hooks de plugins](/es/plugins/hooks)
y [Comportamiento de guard de plugins](/es/tools/plugin).

El harness está desactivado por defecto. Las configuraciones nuevas deberían mantener canónicas
las referencias de modelo OpenAI como `openai/gpt-*` y forzar explícitamente
`embeddedHarness.runtime: "codex"` o `OPENCLAW_AGENT_RUNTIME=codex` cuando
quieran ejecución nativa en app-server. Las referencias heredadas `codex/*` siguen seleccionando
automáticamente el harness por compatibilidad, pero los prefijos de proveedor heredados respaldados por runtime
no se muestran como opciones normales de modelo/proveedor.

## Elige el prefijo de modelo correcto

Las rutas de la familia OpenAI son específicas por prefijo. Usa `openai-codex/*` cuando quieras
OAuth de Codex a través de PI; usa `openai/*` cuando quieras acceso directo a la API de OpenAI o
cuando estés forzando el harness nativo de app-server de Codex:

| Referencia de modelo                                 | Ruta de runtime                              | Úsalo cuando                                                              |
| ---------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `openai/gpt-5.4`                                     | Proveedor OpenAI a través del plumbing de OpenClaw/PI | Quieres acceso actual directo a la API de OpenAI Platform con `OPENAI_API_KEY`. |
| `openai-codex/gpt-5.5`                               | OAuth de OpenAI Codex a través de OpenClaw/PI | Quieres autenticación de suscripción de ChatGPT/Codex con el runner PI predeterminado. |
| `openai/gpt-5.5` + `embeddedHarness.runtime: "codex"` | Harness de app-server de Codex               | Quieres ejecución nativa en app-server de Codex para el turno del agente embebido. |

GPT-5.5 actualmente es solo por suscripción/OAuth en OpenClaw. Usa
`openai-codex/gpt-5.5` para OAuth de PI, o `openai/gpt-5.5` con el harness de
app-server de Codex. El acceso directo por API key para `openai/gpt-5.5` será compatible
una vez que OpenAI habilite GPT-5.5 en la API pública.

Las referencias heredadas `codex/gpt-*` siguen aceptándose como alias de compatibilidad. La
migración de compatibilidad de Doctor reescribe las referencias primarias heredadas de runtime a referencias
canónicas de modelo y registra la política de runtime por separado, mientras que las referencias heredadas
solo de fallback permanecen sin cambios porque el runtime se configura para todo el contenedor del agente.
Las nuevas configuraciones de OAuth de PI Codex deberían usar `openai-codex/gpt-*`; las nuevas configuraciones del harness nativo de
app-server deberían usar `openai/gpt-*` más
`embeddedHarness.runtime: "codex"`.

`agents.defaults.imageModel` sigue la misma división por prefijo. Usa
`openai-codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse a través de la ruta del proveedor
OAuth de OpenAI Codex. Usa `codex/gpt-*` cuando la comprensión de imágenes deba ejecutarse
mediante un turno acotado del app-server de Codex. El modelo de app-server de Codex debe
anunciar compatibilidad con entrada de imagen; los modelos de Codex solo de texto fallan antes de que comience
el turno multimedia.

Usa `/status` para confirmar el harness efectivo de la sesión actual. Si la
selección es sorprendente, habilita logging de depuración para el subsistema
`agents/harness` e inspecciona el registro estructurado `agent harness selected` del gateway. Este
incluye el id del harness seleccionado, la razón de selección, la política de runtime/fallback y,
en modo `auto`, el resultado de compatibilidad de cada candidato de plugin.

La selección de harness no es un control de sesión live. Cuando se ejecuta un turno embebido,
OpenClaw registra el id del harness seleccionado en esa sesión y sigue usándolo en
turnos posteriores con el mismo id de sesión. Cambia la configuración de `embeddedHarness` o
`OPENCLAW_AGENT_RUNTIME` cuando quieras que sesiones futuras usen otro harness;
usa `/new` o `/reset` para iniciar una sesión nueva antes de cambiar una conversación existente entre PI y Codex. Esto evita reproducir una misma transcripción a través de
dos sistemas nativos de sesión incompatibles.

Las sesiones heredadas creadas antes de fijar harnesses se tratan como fijadas a PI una vez que
tienen historial de transcripción. Usa `/new` o `/reset` para hacer que esa conversación pase a
Codex después de cambiar la configuración.

`/status` muestra el runtime efectivo del modelo. El harness PI predeterminado aparece como
`Runtime: OpenClaw Pi Default`, y el harness app-server de Codex aparece como
`Runtime: OpenAI Codex`.

## Requisitos

- OpenClaw con el plugin `codex` incluido disponible.
- App-server de Codex `0.118.0` o más reciente.
- Autenticación de Codex disponible para el proceso del app-server.

El plugin bloquea handshakes de app-server más antiguos o sin versión. Eso mantiene
a OpenClaw en la superficie de protocolo contra la que se ha probado.

Para pruebas smoke live y de Docker, la autenticación suele provenir de `OPENAI_API_KEY`, más
archivos opcionales de Codex CLI como `~/.codex/auth.json` y
`~/.codex/config.toml`. Usa el mismo material de autenticación que usa tu app-server local de Codex.

## Configuración mínima

Usa `openai/gpt-5.5`, habilita el plugin incluido y fuerza el harness `codex`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
}
```

Si tu configuración usa `plugins.allow`, incluye también `codex` allí:

```json5
{
  plugins: {
    allow: ["codex"],
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Las configuraciones heredadas que establecen `agents.defaults.model` o un modelo de agente en
`codex/<model>` siguen habilitando automáticamente el plugin `codex` incluido. Las configuraciones nuevas deberían
preferir `openai/<model>` más la entrada explícita `embeddedHarness` anterior.

## Agrega Codex junto a otros modelos

No establezcas `runtime: "codex"` globalmente si el mismo agente debe cambiar libremente
entre modelos de proveedores Codex y no Codex. Un runtime forzado se aplica a cada
turno embebido de ese agente o sesión. Si seleccionas un modelo Anthropic mientras
ese runtime está forzado, OpenClaw sigue intentando el harness Codex y falla de forma cerrada
en lugar de enrutar silenciosamente ese turno a través de PI.

Usa una de estas formas en su lugar:

- Coloca Codex en un agente dedicado con `embeddedHarness.runtime: "codex"`.
- Mantén el agente predeterminado en `runtime: "auto"` y fallback a PI para el uso normal mixto
  de proveedores.
- Usa referencias heredadas `codex/*` solo por compatibilidad. Las configuraciones nuevas deberían preferir
  `openai/*` más una política explícita de runtime Codex.

Por ejemplo, esto mantiene el agente predeterminado con la selección automática normal y
agrega un agente Codex independiente:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
        },
      },
    ],
  },
}
```

Con esta forma:

- El agente predeterminado `main` usa la ruta normal del proveedor y el fallback de compatibilidad de PI.
- El agente `codex` usa el harness app-server de Codex.
- Si falta Codex o no es compatible para el agente `codex`, el turno falla
  en lugar de usar PI silenciosamente.

## Implementaciones solo de Codex

Fuerza el harness Codex cuando necesites demostrar que cada turno de agente embebido
usa Codex. Los runtimes explícitos de plugins tienen por defecto ausencia de fallback a PI, por lo que
`fallback: "none"` es opcional pero a menudo útil como documentación:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

Sobrescritura por entorno:

```bash
OPENCLAW_AGENT_RUNTIME=codex openclaw gateway run
```

Con Codex forzado, OpenClaw falla pronto si el plugin Codex está deshabilitado, el
app-server es demasiado antiguo o el app-server no puede iniciarse. Establece
`OPENCLAW_AGENT_HARNESS_FALLBACK=pi` solo si intencionalmente quieres que PI maneje
la ausencia de selección de harness.

## Codex por agente

Puedes hacer que un agente sea solo Codex mientras el agente predeterminado mantiene la
selección automática normal:

```json5
{
  agents: {
    defaults: {
      embeddedHarness: {
        runtime: "auto",
        fallback: "pi",
      },
    },
    list: [
      {
        id: "main",
        default: true,
        model: "anthropic/claude-opus-4-6",
      },
      {
        id: "codex",
        name: "Codex",
        model: "openai/gpt-5.5",
        embeddedHarness: {
          runtime: "codex",
          fallback: "none",
        },
      },
    ],
  },
}
```

Usa los comandos normales de sesión para cambiar de agente y modelo. `/new` crea una
sesión nueva de OpenClaw y el harness Codex crea o reanuda su hilo sidecar de app-server
según sea necesario. `/reset` limpia el enlace de sesión de OpenClaw para ese hilo
y permite que el siguiente turno vuelva a resolver el harness desde la configuración actual.

## Descubrimiento de modelos

Por defecto, el plugin Codex pide al app-server los modelos disponibles. Si el
descubrimiento falla o agota el tiempo, usa un catálogo fallback incluido para:

- GPT-5.5
- GPT-5.4 mini
- GPT-5.2

Puedes ajustar el descubrimiento en `plugins.entries.codex.config.discovery`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: true,
            timeoutMs: 2500,
          },
        },
      },
    },
  },
}
```

Desactiva el descubrimiento cuando quieras que el inicio evite sondear Codex y se quede con el
catálogo fallback:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          discovery: {
            enabled: false,
          },
        },
      },
    },
  },
}
```

## Conexión y política del app-server

Por defecto, el plugin inicia Codex localmente con:

```bash
codex app-server --listen stdio://
```

Por defecto, OpenClaw inicia sesiones locales del harness Codex en modo YOLO:
`approvalPolicy: "never"`, `approvalsReviewer: "user"` y
`sandbox: "danger-full-access"`. Esta es la postura local confiable del operador usada
para Heartbeats autónomos: Codex puede usar herramientas de shell y red sin
detenerse en prompts nativos de aprobación que nadie está presente para responder.

Para activar aprobaciones revisadas por guardian de Codex, establece `appServer.mode:
"guardian"`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            serviceTier: "fast",
          },
        },
      },
    },
  },
}
```

El modo Guardian usa la ruta nativa de aprobación con revisión automática de Codex. Cuando Codex pide
salir del sandbox, escribir fuera del espacio de trabajo o agregar permisos como acceso de red,
Codex enruta esa solicitud de aprobación al revisor nativo en lugar de a un prompt humano. El revisor aplica el marco de riesgo de Codex y aprueba o deniega la solicitud específica. Usa Guardian cuando quieras más barreras de protección que en el modo YOLO
pero sigas necesitando que agentes desatendidos progresen.

El preset `guardian` se expande a `approvalPolicy: "on-request"`,
`approvalsReviewer: "auto_review"` y `sandbox: "workspace-write"`.
Los campos individuales de política siguen sobrescribiendo `mode`, por lo que las implementaciones avanzadas pueden combinar
el preset con elecciones explícitas. El valor anterior de revisor `guardian_subagent`
sigue aceptándose como alias de compatibilidad, pero las configuraciones nuevas deberían usar
`auto_review`.

Para un app-server ya en ejecución, usa transporte WebSocket:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://127.0.0.1:39175",
            authToken: "${CODEX_APP_SERVER_TOKEN}",
            requestTimeoutMs: 60000,
          },
        },
      },
    },
  },
}
```

Campos `appServer` compatibles:

| Campo               | Predeterminado                           | Significado                                                                                                      |
| ------------------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `transport`         | `"stdio"`                                | `"stdio"` inicia Codex; `"websocket"` se conecta a `url`.                                                        |
| `command`           | `"codex"`                                | Ejecutable para transporte stdio.                                                                                |
| `args`              | `["app-server", "--listen", "stdio://"]` | Argumentos para transporte stdio.                                                                                |
| `url`               | sin definir                              | URL WebSocket del app-server.                                                                                    |
| `authToken`         | sin definir                              | Token Bearer para transporte WebSocket.                                                                          |
| `headers`           | `{}`                                     | Encabezados WebSocket adicionales.                                                                               |
| `requestTimeoutMs`  | `60000`                                  | Tiempo de espera para llamadas del plano de control del app-server.                                              |
| `mode`              | `"yolo"`                                 | Preset para ejecución YOLO o revisada por guardian.                                                              |
| `approvalPolicy`    | `"never"`                                | Política nativa de aprobación de Codex enviada al iniciar/reanudar hilo/turno.                                  |
| `sandbox`           | `"danger-full-access"`                   | Modo sandbox nativo de Codex enviado al iniciar/reanudar hilo.                                                   |
| `approvalsReviewer` | `"user"`                                 | Usa `"auto_review"` para dejar que Codex revise prompts nativos de aprobación. `guardian_subagent` sigue siendo un alias heredado. |
| `serviceTier`       | sin definir                              | Nivel de servicio opcional del app-server de Codex: `"fast"`, `"flex"` o `null`. Los valores heredados inválidos se ignoran. |

Las variables de entorno anteriores siguen funcionando como fallback para pruebas locales cuando
el campo de configuración correspondiente no está definido:

- `OPENCLAW_CODEX_APP_SERVER_BIN`
- `OPENCLAW_CODEX_APP_SERVER_ARGS`
- `OPENCLAW_CODEX_APP_SERVER_MODE=yolo|guardian`
- `OPENCLAW_CODEX_APP_SERVER_APPROVAL_POLICY`
- `OPENCLAW_CODEX_APP_SERVER_SANDBOX`

`OPENCLAW_CODEX_APP_SERVER_GUARDIAN=1` fue eliminado. Usa
`plugins.entries.codex.config.appServer.mode: "guardian"` en su lugar, o
`OPENCLAW_CODEX_APP_SERVER_MODE=guardian` para pruebas locales puntuales. Se
prefiere la configuración para implementaciones repetibles porque mantiene el comportamiento del plugin en el
mismo archivo revisado que el resto de la configuración del harness Codex.

## Recetas comunes

Codex local con transporte stdio predeterminado:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Validación de harness solo Codex:

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
      },
    },
  },
  plugins: {
    entries: {
      codex: {
        enabled: true,
      },
    },
  },
}
```

Aprobaciones de Codex revisadas por guardian:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            mode: "guardian",
            approvalPolicy: "on-request",
            approvalsReviewer: "auto_review",
            sandbox: "workspace-write",
          },
        },
      },
    },
  },
}
```

App-server remoto con encabezados explícitos:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          appServer: {
            transport: "websocket",
            url: "ws://gateway-host:39175",
            headers: {
              "X-OpenClaw-Agent": "main",
            },
          },
        },
      },
    },
  },
}
```

El cambio de modelo sigue controlado por OpenClaw. Cuando una sesión de OpenClaw está adjunta
a un hilo existente de Codex, el siguiente turno vuelve a enviar al
app-server el modelo OpenAI actualmente seleccionado, el proveedor, la política de aprobación, el sandbox y el nivel de servicio.
Cambiar de `openai/gpt-5.5` a `openai/gpt-5.2` conserva el
enlace del hilo, pero le pide a Codex que continúe con el modelo recién seleccionado.

## Comando Codex

El plugin incluido registra `/codex` como comando slash autorizado. Es
genérico y funciona en cualquier canal que admita comandos de texto de OpenClaw.

Formas comunes:

- `/codex status` muestra conectividad live del app-server, modelos, cuenta, límites de tasa, servidores MCP y Skills.
- `/codex models` lista los modelos live del app-server de Codex.
- `/codex threads [filter]` lista hilos recientes de Codex.
- `/codex resume <thread-id>` adjunta la sesión actual de OpenClaw a un hilo existente de Codex.
- `/codex compact` pide al app-server de Codex que compacte el hilo adjunto.
- `/codex review` inicia la revisión nativa de Codex para el hilo adjunto.
- `/codex account` muestra el estado de la cuenta y los límites de tasa.
- `/codex mcp` lista el estado de los servidores MCP del app-server de Codex.
- `/codex skills` lista las Skills del app-server de Codex.

`/codex resume` escribe el mismo archivo de enlace sidecar que el harness usa para
los turnos normales. En el siguiente mensaje, OpenClaw reanuda ese hilo de Codex, pasa el
modelo OpenClaw actualmente seleccionado al app-server y mantiene habilitado el historial
extendido.

La superficie de comandos requiere app-server de Codex `0.118.0` o más reciente. Los métodos individuales de
control se informan como `unsupported by this Codex app-server` si un
app-server futuro o personalizado no expone ese método JSON-RPC.

## Límites de hooks

El harness Codex tiene tres capas de hooks:

| Capa                                  | Responsable               | Propósito                                                           |
| ------------------------------------- | ------------------------- | ------------------------------------------------------------------- |
| Hooks de plugins de OpenClaw          | OpenClaw                  | Compatibilidad de producto/plugin entre harnesses PI y Codex.       |
| Middleware de extensión del app-server de Codex | Plugins incluidos de OpenClaw | Comportamiento del adaptador por turno alrededor de herramientas dinámicas de OpenClaw. |
| Hooks nativos de Codex                | Codex                     | Ciclo de vida de bajo nivel de Codex y política de herramientas nativas desde la configuración de Codex. |

OpenClaw no usa archivos `hooks.json` de Codex de proyecto o globales para enrutar
el comportamiento de los plugins de OpenClaw. Para el puente compatible de herramientas nativas y permisos,
OpenClaw inyecta configuración por hilo de Codex para `PreToolUse`, `PostToolUse` y
`PermissionRequest`. Otros hooks de Codex como `SessionStart`,
`UserPromptSubmit` y `Stop` siguen siendo controles a nivel de Codex; no están expuestos
como hooks de plugins de OpenClaw en el contrato v1.

Para herramientas dinámicas de OpenClaw, OpenClaw ejecuta la herramienta después de que Codex solicita la
llamada, por lo que OpenClaw activa el comportamiento de plugin y middleware que posee en el
adaptador del harness. Para herramientas nativas de Codex, Codex posee el registro canónico de la herramienta.
OpenClaw puede reflejar eventos seleccionados, pero no puede reescribir el hilo nativo de Codex
a menos que Codex exponga esa operación mediante app-server o callbacks de hooks nativos.

Las proyecciones de Compaction y del ciclo de vida del LLM provienen de notificaciones del
app-server de Codex y del estado del adaptador de OpenClaw, no de comandos de hooks nativos de Codex.
Los eventos `before_compaction`, `after_compaction`, `llm_input` y
`llm_output` de OpenClaw son observaciones a nivel de adaptador, no capturas byte a byte
de la solicitud interna o del payload de Compaction de Codex.

Las notificaciones nativas de app-server `hook/started` y `hook/completed` de Codex se
proyectan como eventos de agente `codex_app_server.hook` para trayectoria y depuración.
No invocan hooks de plugins de OpenClaw.

## Contrato de compatibilidad v1

El modo Codex no es PI con una llamada de modelo diferente por debajo. Codex posee más del
bucle de modelo nativo, y OpenClaw adapta sus superficies de plugins y sesiones
alrededor de ese límite.

Compatible en el runtime Codex v1:

| Superficie                              | Compatibilidad                           | Por qué                                                                                                                                       |
| --------------------------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Bucle de modelo OpenAI mediante Codex   | Compatible                               | El app-server de Codex posee el turno OpenAI, la reanudación nativa de hilos y la continuación nativa de herramientas.                     |
| Enrutamiento y entrega de canales de OpenClaw | Compatible                          | Telegram, Discord, Slack, WhatsApp, iMessage y otros canales permanecen fuera del runtime del modelo.                                       |
| Herramientas dinámicas de OpenClaw      | Compatible                               | Codex pide a OpenClaw que ejecute estas herramientas, por lo que OpenClaw sigue en la ruta de ejecución.                                    |
| Plugins de prompt y contexto            | Compatible                               | OpenClaw compila superposiciones de prompts y proyecta contexto en el turno de Codex antes de iniciar o reanudar el hilo.                 |
| Ciclo de vida del motor de contexto     | Compatible                               | El ensamblado, mantenimiento de ingestión o after-turn y la coordinación de Compaction del motor de contexto se ejecutan para turnos Codex. |
| Hooks de herramientas dinámicas         | Compatible                               | `before_tool_call`, `after_tool_call` y el middleware de resultados de herramientas se ejecutan alrededor de herramientas dinámicas propiedad de OpenClaw. |
| Hooks de ciclo de vida                  | Compatibles como observaciones del adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` y `after_compaction` se activan con payloads honestos en modo Codex.       |
| Bloqueo u observación de shell y patch nativos | Compatible mediante el relay de hooks nativos | `PreToolUse` y `PostToolUse` de Codex se retransmiten para las superficies comprometidas de herramientas nativas. Se admite bloqueo; no reescritura de argumentos. |
| Política de permisos nativos            | Compatible mediante el relay de hooks nativos | `PermissionRequest` de Codex puede enrutarse mediante la política de OpenClaw donde el runtime lo expone.                               |
| Captura de trayectoria del app-server   | Compatible                               | OpenClaw registra la solicitud enviada al app-server y las notificaciones que recibe del app-server.                                       |

No compatible en el runtime Codex v1:

| Superficie                                          | Límite de v1                                                                                                                                     | Ruta futura                                                                                                 |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Mutación de argumentos de herramientas nativas      | Los hooks nativos pre-tool de Codex pueden bloquear, pero OpenClaw no reescribe los argumentos de herramientas nativas de Codex.               | Requiere compatibilidad de hooks/esquemas de Codex para reemplazar la entrada de herramientas.             |
| Historial editable de transcripción nativa de Codex | Codex posee el historial canónico nativo del hilo. OpenClaw posee un espejo y puede proyectar contexto futuro, pero no debería mutar elementos internos no compatibles. | Agregar APIs explícitas de app-server de Codex si se necesita cirugía nativa de hilos.                     |
| `tool_result_persist` para registros de herramientas nativas de Codex | Ese hook transforma escrituras de transcripción propiedad de OpenClaw, no registros de herramientas nativas de Codex.                          | Podría reflejar registros transformados, pero la reescritura canónica requiere compatibilidad de Codex.    |
| Metadatos ricos de Compaction nativa                | OpenClaw observa el inicio y la finalización de Compaction, pero no recibe una lista estable de elementos conservados/descartados, delta de tokens ni payload de resumen. | Necesita eventos de Compaction de Codex más ricos.                                                          |
| Intervención en Compaction                          | Los hooks actuales de Compaction de OpenClaw son de nivel notificación en modo Codex.                                                           | Agregar hooks pre/post Compaction de Codex si los plugins necesitan vetar o reescribir la Compaction nativa. |
| Control de parada o respuesta final                 | Codex tiene hooks nativos de parada, pero OpenClaw no expone el control de respuesta final como contrato de plugin v1.                          | Primitiva futura de participación explícita con salvaguardas de bucle y tiempo de espera.                  |
| Paridad de hooks MCP nativos como superficie v1 comprometida | El relay es genérico, pero OpenClaw no ha puesto compuertas por versión ni probado de extremo a extremo el comportamiento de hooks MCP nativos pre/post. | Agregar pruebas y documentación del relay MCP de OpenClaw cuando el piso del protocolo del app-server compatible cubra esos payloads. |
| Captura byte a byte de solicitudes de la API del modelo | OpenClaw puede capturar solicitudes y notificaciones del app-server, pero el núcleo de Codex construye internamente la solicitud final a la API de OpenAI. | Necesita un evento de trazado de solicitudes del modelo de Codex o una API de depuración.                  |

## Herramientas, multimedia y Compaction

El harness Codex cambia solo el ejecutor embebido del agente de bajo nivel.

OpenClaw sigue construyendo la lista de herramientas y recibe resultados de herramientas dinámicas desde el
harness. El texto, las imágenes, el video, la música, TTS, las aprobaciones y la salida de herramientas de mensajería
siguen pasando por la ruta normal de entrega de OpenClaw.

El relay de hooks nativos es intencionalmente genérico, pero el contrato de compatibilidad v1 está
limitado a las rutas de herramientas nativas y permisos de Codex que OpenClaw prueba. No
supongas que cada futuro evento de hook de Codex sea una superficie de plugin de OpenClaw hasta que el
contrato del runtime lo nombre.

Las solicitudes de aprobación de herramientas MCP de Codex se enrutan mediante el flujo de aprobación de plugins
de OpenClaw cuando Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Los prompts `request_user_input` de Codex se envían de vuelta al
chat de origen, y el siguiente mensaje de seguimiento en cola responde a esa solicitud nativa del
servidor en lugar de dirigirse como contexto adicional. Otras solicitudes de elicitación MCP
siguen fallando de forma cerrada.

Cuando el modelo seleccionado usa el harness Codex, la Compaction nativa del hilo se
delega al app-server de Codex. OpenClaw mantiene un espejo de la transcripción para el
historial del canal, búsqueda, `/new`, `/reset` y futuros cambios de modelo o harness. El
espejo incluye el prompt del usuario, el texto final del asistente y registros ligeros de razonamiento o plan de Codex
cuando el app-server los emite. Hoy, OpenClaw solo
registra señales de inicio y finalización de Compaction nativa. Todavía no expone un
resumen legible por humanos de Compaction ni una lista auditable de qué entradas conservó
Codex después de la Compaction.

Como Codex posee el hilo nativo canónico, `tool_result_persist` actualmente no
reescribe registros de resultados de herramientas nativas de Codex. Solo se aplica cuando
OpenClaw está escribiendo un resultado de herramienta en una transcripción de sesión propiedad de OpenClaw.

La generación de multimedia no requiere PI. La imagen, el video, la música, PDF, TTS y la
comprensión multimedia siguen usando la configuración correspondiente de proveedor/modelo como
`agents.defaults.imageGenerationModel`, `videoGenerationModel`, `pdfModel` y
`messages.tts`.

## Solución de problemas

**Codex no aparece como proveedor normal en `/model`:** eso es lo esperado en
configuraciones nuevas. Selecciona un modelo `openai/gpt-*` con
`embeddedHarness.runtime: "codex"` (o una referencia heredada `codex/*`), habilita
`plugins.entries.codex.enabled` y comprueba si `plugins.allow` excluye
`codex`.

**OpenClaw usa PI en lugar de Codex:** `runtime: "auto"` todavía puede usar PI como
backend de compatibilidad cuando ningún harness Codex reclama la ejecución. Establece
`embeddedHarness.runtime: "codex"` para forzar la selección de Codex durante las pruebas. Un
runtime Codex forzado ahora falla en lugar de recurrir a PI, a menos que
establezcas explícitamente `embeddedHarness.fallback: "pi"`. Una vez seleccionado el app-server de Codex,
sus fallos aparecen directamente sin configuración adicional de fallback.

**El app-server es rechazado:** actualiza Codex para que el handshake del app-server
informe la versión `0.118.0` o superior.

**El descubrimiento de modelos es lento:** reduce `plugins.entries.codex.config.discovery.timeoutMs`
o desactiva el descubrimiento.

**El transporte WebSocket falla inmediatamente:** comprueba `appServer.url`, `authToken`
y que el app-server remoto hable la misma versión del protocolo de app-server de Codex.

**Un modelo no Codex usa PI:** eso es lo esperado salvo que fuerces
`embeddedHarness.runtime: "codex"` para ese agente o selecciones una referencia heredada
`codex/*`. Las referencias simples `openai/gpt-*` y las de otros proveedores permanecen en su ruta normal
de proveedor en modo `auto`. Si fuerzas `runtime: "codex"`, cada turno embebido
de ese agente debe ser un modelo OpenAI compatible con Codex.

## Relacionado

- [Plugins de harness de agente](/es/plugins/sdk-agent-harness)
- [Runtimes de agentes](/es/concepts/agent-runtimes)
- [Proveedores de modelos](/es/concepts/model-providers)
- [Proveedor OpenAI](/es/providers/openai)
- [Estado](/es/cli/status)
- [Hooks de plugins](/es/plugins/hooks)
- [Referencia de configuración](/es/gateway/configuration-reference)
- [Pruebas](/es/help/testing-live#live-codex-app-server-harness-smoke)
