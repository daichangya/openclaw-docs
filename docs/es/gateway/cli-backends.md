---
read_when:
    - Quieres un respaldo fiable cuando fallan los proveedores de API
    - Estás ejecutando Codex CLI u otras CLI de IA locales y quieres reutilizarlas
    - Quieres entender el puente local loopback de MCP para el acceso a herramientas del backend de CLI
summary: 'Backends de CLI: respaldo en CLI de IA local con puente opcional de herramientas MCP'
title: backends de CLI
x-i18n:
    generated_at: "2026-04-25T13:45:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07a4651d7faf1ebafc66bda2e3ade6e541d59c9827f314169e1593e07f0bc2f5
    source_path: gateway/cli-backends.md
    workflow: 15
---

OpenClaw puede ejecutar **CLI de IA locales** como **respaldo solo de texto** cuando los proveedores de API fallan,
están limitados por tasa o se comportan mal temporalmente. Esto es intencionadamente conservador:

- **Las herramientas de OpenClaw no se inyectan directamente**, pero los backends con `bundleMcp: true`
  pueden recibir herramientas del gateway mediante un puente MCP local loopback.
- **Streaming JSONL** para las CLI que lo admiten.
- **Las sesiones son compatibles** (para que los turnos de seguimiento mantengan la coherencia).
- **Las imágenes pueden pasarse** si la CLI acepta rutas de imagen.

Esto está diseñado como una **red de seguridad** más que como una ruta principal. Úsalo cuando
quieras respuestas de texto de “siempre funciona” sin depender de API externas.

Si quieres un entorno de ejecución completo con controles de sesión ACP, tareas en segundo plano,
asociación de hilos/conversaciones y sesiones externas persistentes de programación, usa
[ACP Agents](/es/tools/acp-agents) en su lugar. Los backends de CLI no son ACP.

## Inicio rápido para principiantes

Puedes usar Codex CLI **sin ninguna configuración** (el plugin integrado de OpenAI
registra un backend predeterminado):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Si tu gateway se ejecuta bajo launchd/systemd y PATH es mínimo, añade solo la
ruta del comando:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Eso es todo. No se necesitan claves ni configuración de autenticación adicional más allá de la propia CLI.

Si usas un backend de CLI integrado como **proveedor principal de mensajes** en un
host de gateway, OpenClaw ahora carga automáticamente el plugin integrado propietario cuando tu configuración
hace referencia explícita a ese backend en una referencia de modelo o en
`agents.defaults.cliBackends`.

## Usarlo como respaldo

Añade un backend de CLI a tu lista de respaldo para que solo se ejecute cuando fallen los modelos principales:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Notas:

- Si usas `agents.defaults.models` (lista de permitidos), también debes incluir allí los modelos de tu backend de CLI.
- Si el proveedor principal falla (autenticación, límites de tasa, tiempos de espera), OpenClaw
  probará a continuación el backend de CLI.

## Resumen de configuración

Todos los backends de CLI viven en:

```
agents.defaults.cliBackends
```

Cada entrada se identifica por un **ID de proveedor** (por ejemplo, `codex-cli`, `my-cli`).
El ID del proveedor se convierte en la parte izquierda de tu referencia de modelo:

```
<provider>/<model>
```

### Ejemplo de configuración

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // Para CLI con una bandera dedicada a archivo de prompt:
          // systemPromptFileArg: "--system-file",
          // Las CLI de estilo Codex pueden apuntar a un archivo de prompt en su lugar:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          serialize: true,
        },
      },
    },
  },
}
```

## Cómo funciona

1. **Selecciona un backend** según el prefijo del proveedor (`codex-cli/...`).
2. **Construye un prompt del sistema** usando el mismo prompt + contexto de espacio de trabajo de OpenClaw.
3. **Ejecuta la CLI** con un ID de sesión (si es compatible) para que el historial se mantenga coherente.
   El backend integrado `claude-cli` mantiene vivo un proceso stdio de Claude por
   sesión de OpenClaw y envía los turnos de seguimiento por stdin `stream-json`.
4. **Analiza la salida** (JSON o texto sin formato) y devuelve el texto final.
5. **Persiste los ID de sesión** por backend, para que los seguimientos reutilicen la misma sesión de CLI.

<Note>
El backend integrado Anthropic `claude-cli` vuelve a ser compatible. El personal de Anthropic
nos indicó que el uso de Claude CLI al estilo de OpenClaw vuelve a estar permitido, así que OpenClaw trata
el uso de `claude -p` como autorizado para esta integración, a menos que Anthropic publique
una nueva política.
</Note>

El backend integrado OpenAI `codex-cli` pasa el prompt del sistema de OpenClaw mediante
la anulación de configuración `model_instructions_file` de Codex (`-c
model_instructions_file="..."`). Codex no expone una bandera de estilo Claude
`--append-system-prompt`, así que OpenClaw escribe el prompt ensamblado en un
archivo temporal para cada sesión nueva de Codex CLI.

El backend integrado Anthropic `claude-cli` recibe la instantánea de Skills de OpenClaw
de dos formas: el catálogo compacto de Skills de OpenClaw en el prompt del sistema añadido y
un plugin temporal de Claude Code pasado con `--plugin-dir`. El plugin contiene
solo las Skills elegibles para ese agente/sesión, de modo que el resolvedor nativo de Skills de Claude Code
ve el mismo conjunto filtrado que OpenClaw anunciaría en el prompt. Las anulaciones de entorno/claves de API de Skills
siguen siendo aplicadas por OpenClaw al entorno del proceso hijo durante la ejecución.

Claude CLI también tiene su propio modo de permisos no interactivo. OpenClaw lo asigna
a la política existente de exec en lugar de añadir configuración específica de Claude: cuando la
política efectiva solicitada de exec es YOLO (`tools.exec.security: "full"` y
`tools.exec.ask: "off"`), OpenClaw añade `--permission-mode bypassPermissions`.
La configuración por agente `agents.list[].tools.exec` anula `tools.exec` global para
ese agente. Para forzar un modo distinto de Claude, configura argumentos sin procesar explícitos del backend,
como `--permission-mode default` o `--permission-mode acceptEdits` en
`agents.defaults.cliBackends.claude-cli.args` y los `resumeArgs` correspondientes.

Antes de que OpenClaw pueda usar el backend integrado `claude-cli`, Claude Code mismo
debe haber iniciado sesión ya en el mismo host:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Usa `agents.defaults.cliBackends.claude-cli.command` solo cuando el binario `claude`
no esté ya en `PATH`.

## Sesiones

- Si la CLI admite sesiones, configura `sessionArg` (por ejemplo, `--session-id`) o
  `sessionArgs` (marcador `{sessionId}`) cuando el ID deba insertarse
  en varias banderas.
- Si la CLI usa un **subcomando de reanudación** con banderas diferentes, configura
  `resumeArgs` (sustituye a `args` al reanudar) y opcionalmente `resumeOutput`
  (para reanudaciones no JSON).
- `sessionMode`:
  - `always`: siempre envía un ID de sesión (UUID nuevo si no hay ninguno almacenado).
  - `existing`: solo envía un ID de sesión si ya se almacenó antes.
  - `none`: nunca envía un ID de sesión.
- `claude-cli` usa por defecto `liveSession: "claude-stdio"`, `output: "jsonl"`
  e `input: "stdin"`, de modo que los turnos de seguimiento reutilicen el proceso activo de Claude mientras
  siga activo. El stdio en caliente es ahora el valor predeterminado, incluso para configuraciones personalizadas
  que omiten campos de transporte. Si el Gateway se reinicia o el proceso inactivo
  sale, OpenClaw reanuda desde el ID de sesión de Claude almacenado. Los ID de sesión almacenados
  se verifican frente a una transcripción de proyecto existente y legible antes de
  reanudar, de modo que las asociaciones fantasma se limpian con `reason=transcript-missing`
  en lugar de iniciar silenciosamente una sesión nueva de Claude CLI con `--resume`.
- Las sesiones de CLI almacenadas son continuidad propiedad del proveedor. El restablecimiento diario implícito de sesión
  no las corta; `/reset` y las políticas explícitas de `session.reset` sí.

Notas sobre serialización:

- `serialize: true` mantiene ordenadas las ejecuciones del mismo carril.
- La mayoría de las CLI serializan en un solo carril de proveedor.
- OpenClaw descarta la reutilización de sesiones de CLI almacenadas cuando cambia la identidad de autenticación seleccionada,
  incluido un cambio en el ID del perfil de autenticación, clave de API estática, token estático o
  identidad de cuenta OAuth cuando la CLI expone una. La rotación de tokens de acceso y actualización OAuth
  no corta la sesión de CLI almacenada. Si una CLI no expone un ID de cuenta OAuth
  estable, OpenClaw deja que esa CLI aplique sus propios permisos de reanudación.

## Imágenes (paso directo)

Si tu CLI acepta rutas de imagen, configura `imageArg`:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw escribirá las imágenes base64 en archivos temporales. Si `imageArg` está configurado, esas
rutas se pasan como argumentos de CLI. Si falta `imageArg`, OpenClaw añade las
rutas de archivo al prompt (inyección de rutas), lo cual es suficiente para CLI que cargan
automáticamente archivos locales desde rutas sin formato.

## Entradas / salidas

- `output: "json"` (predeterminado) intenta analizar JSON y extraer texto + ID de sesión.
- Para la salida JSON de Gemini CLI, OpenClaw lee el texto de respuesta de `response` y
  el uso de `stats` cuando `usage` falta o está vacío.
- `output: "jsonl"` analiza flujos JSONL (por ejemplo Codex CLI `--json`) y extrae el mensaje final del agente junto con los identificadores de sesión
  cuando están presentes.
- `output: "text"` trata stdout como la respuesta final.

Modos de entrada:

- `input: "arg"` (predeterminado) pasa el prompt como último argumento de CLI.
- `input: "stdin"` envía el prompt por stdin.
- Si el prompt es muy largo y `maxPromptArgChars` está configurado, se usa stdin.

## Valores predeterminados (propiedad del plugin)

El plugin integrado OpenAI también registra un valor predeterminado para `codex-cli`:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

El plugin integrado Google también registra un valor predeterminado para `google-gemini-cli`:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Requisito previo: la Gemini CLI local debe estar instalada y disponible como
`gemini` en `PATH` (`brew install gemini-cli` o
`npm install -g @google/gemini-cli`).

Notas sobre JSON de Gemini CLI:

- El texto de respuesta se lee del campo JSON `response`.
- El uso recurre a `stats` cuando `usage` no existe o está vacío.
- `stats.cached` se normaliza a `cacheRead` de OpenClaw.
- Si falta `stats.input`, OpenClaw deriva los tokens de entrada de
  `stats.input_tokens - stats.cached`.

Anula esto solo si es necesario (lo habitual: ruta absoluta de `command`).

## Valores predeterminados propiedad del plugin

Los valores predeterminados de los backends de CLI ahora forman parte de la superficie del plugin:

- Los plugins los registran con `api.registerCliBackend(...)`.
- El `id` del backend se convierte en el prefijo del proveedor en las referencias de modelo.
- La configuración del usuario en `agents.defaults.cliBackends.<id>` sigue anulando el valor predeterminado del plugin.
- La limpieza de configuración específica del backend sigue siendo propiedad del plugin mediante el gancho opcional
  `normalizeConfig`.

Los plugins que necesiten pequeños ajustes de compatibilidad de prompt/mensaje pueden declarar
transformaciones bidireccionales de texto sin reemplazar un proveedor ni un backend de CLI:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input` reescribe el prompt del sistema y el prompt del usuario pasados a la CLI. `output`
reescribe los deltas transmitidos del asistente y el texto final analizado antes de que OpenClaw maneje
sus propios marcadores de control y la entrega al canal.

Para CLI que emiten JSONL compatible con `stream-json` de Claude Code, configura
`jsonlDialect: "claude-stream-json"` en la configuración de ese backend.

## Superposiciones MCP integradas

Los backends de CLI **no** reciben directamente las llamadas a herramientas de OpenClaw, pero un backend puede
activar una superposición de configuración MCP generada con `bundleMcp: true`.

Comportamiento integrado actual:

- `claude-cli`: archivo de configuración MCP estricta generado
- `codex-cli`: anulaciones de configuración en línea para `mcp_servers`; el servidor
  local loopback generado de OpenClaw se marca con el modo de aprobación de herramientas por servidor de Codex
  para que las llamadas MCP no se queden bloqueadas en avisos de aprobación local
- `google-gemini-cli`: archivo generado de configuración del sistema de Gemini

Cuando el MCP integrado está habilitado, OpenClaw:

- inicia un servidor MCP HTTP local loopback que expone herramientas del gateway al proceso de la CLI
- autentica el puente con un token por sesión (`OPENCLAW_MCP_TOKEN`)
- limita el acceso a herramientas al contexto actual de sesión, cuenta y canal
- carga los servidores bundle-MCP habilitados para el espacio de trabajo actual
- los combina con cualquier forma existente de configuración/ajustes MCP del backend
- reescribe la configuración de inicio usando el modo de integración propiedad del backend desde la extensión propietaria

Si no hay servidores MCP habilitados, OpenClaw sigue inyectando una configuración estricta cuando un
backend activa `bundleMcp` para que las ejecuciones en segundo plano permanezcan aisladas.

Los tiempos de ejecución MCP integrados con ámbito de sesión se almacenan en caché para reutilizarse dentro de una sesión y luego
se recolectan después de `mcp.sessionIdleTtlMs` milisegundos de inactividad (10
minutos de forma predeterminada; configura `0` para desactivarlo). Las ejecuciones incrustadas de un solo uso, como
sondeos de autenticación, generación de slugs y recuperación de Active Memory, solicitan la limpieza al final de la ejecución para que los
hijos stdio y los flujos HTTP/SSE transmisibles no sobrevivan a la ejecución.

## Limitaciones

- **Sin llamadas directas a herramientas de OpenClaw.** OpenClaw no inyecta llamadas de herramientas en
  el protocolo del backend de CLI. Los backends solo ven las herramientas del gateway cuando activan
  `bundleMcp: true`.
- **El streaming depende del backend.** Algunos backends transmiten JSONL; otros almacenan en búfer
  hasta la salida.
- **Las salidas estructuradas** dependen del formato JSON de la CLI.
- **Las sesiones de Codex CLI** se reanudan mediante salida de texto (sin JSONL), lo que es menos
  estructurado que la ejecución inicial con `--json`. Las sesiones de OpenClaw siguen funcionando
  con normalidad.

## Solución de problemas

- **No se encuentra la CLI**: configura `command` con una ruta completa.
- **Nombre de modelo incorrecto**: usa `modelAliases` para asignar `provider/model` → modelo de CLI.
- **Sin continuidad de sesión**: asegúrate de que `sessionArg` esté configurado y de que `sessionMode` no sea
  `none` (Codex CLI actualmente no puede reanudar con salida JSON).
- **Se ignoran las imágenes**: configura `imageArg` (y verifica que la CLI admita rutas de archivo).

## Relacionado

- [Guía operativa del Gateway](/es/gateway)
- [Modelos locales](/es/gateway/local-models)
