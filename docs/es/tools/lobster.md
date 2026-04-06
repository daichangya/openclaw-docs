---
read_when:
    - Quieres flujos de trabajo deterministas de varios pasos con aprobaciones explícitas
    - Necesitas reanudar un flujo de trabajo sin volver a ejecutar pasos anteriores
summary: Entorno de ejecución tipado de flujos de trabajo para OpenClaw con controles de aprobación reanudables.
title: Lobster
x-i18n:
    generated_at: "2026-04-06T03:12:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: c1014945d104ef8fdca0d30be89e35136def1b274c6403b06de29e8502b8124b
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster es un shell de flujos de trabajo que permite a OpenClaw ejecutar secuencias de herramientas de varios pasos como una única operación determinista con puntos de control de aprobación explícitos.

Lobster está una capa de autoría por encima del trabajo desacoplado en segundo plano. Para la orquestación de flujos por encima de tareas individuales, consulta [Task Flow](/es/automation/taskflow) (`openclaw tasks flow`). Para el registro de actividad de tareas, consulta [`openclaw tasks`](/es/automation/tasks).

## Hook

Tu asistente puede construir las herramientas que se gestionan a sí mismas. Pide un flujo de trabajo y, 30 minutos después, tendrás una CLI más pipelines que se ejecutan como una sola llamada. Lobster es la pieza que faltaba: pipelines deterministas, aprobaciones explícitas y estado reanudable.

## Por qué

Hoy, los flujos de trabajo complejos requieren muchas llamadas de herramientas de ida y vuelta. Cada llamada consume tokens y el LLM tiene que orquestar cada paso. Lobster traslada esa orquestación a un entorno de ejecución tipado:

- **Una llamada en lugar de muchas**: OpenClaw ejecuta una sola llamada de herramienta Lobster y obtiene un resultado estructurado.
- **Aprobaciones integradas**: los efectos secundarios (enviar correo, publicar comentario) detienen el flujo de trabajo hasta que se apruebe explícitamente.
- **Reanudable**: los flujos de trabajo detenidos devuelven un token; aprueba y reanuda sin volver a ejecutar todo.

## ¿Por qué un DSL en lugar de programas normales?

Lobster es intencionadamente pequeño. El objetivo no es “un lenguaje nuevo”, sino una especificación de pipeline predecible y amigable para IA con aprobaciones y tokens de reanudación de primera clase.

- **Aprobar/reanudar está integrado**: un programa normal puede solicitar a una persona, pero no puede _pausarse y reanudarse_ con un token persistente sin que tú inventes ese entorno de ejecución.
- **Determinismo + auditabilidad**: los pipelines son datos, así que son fáciles de registrar, comparar, reproducir y revisar.
- **Superficie acotada para IA**: una gramática pequeña + canalización JSON reduce rutas de código “creativas” y hace realista la validación.
- **Política de seguridad integrada**: el entorno de ejecución aplica tiempos de espera, límites de salida, comprobaciones de sandbox y listas permitidas, no cada script.
- **Sigue siendo programable**: cada paso puede llamar a cualquier CLI o script. Si quieres JS/TS, genera archivos `.lobster` desde código.

## Cómo funciona

OpenClaw ejecuta flujos de trabajo de Lobster **en proceso** usando un runner integrado. No se genera ningún subproceso externo de CLI; el motor del flujo de trabajo se ejecuta dentro del proceso del gateway y devuelve directamente un sobre JSON.
Si el pipeline se pausa para una aprobación, la herramienta devuelve un `resumeToken` para que puedas continuar después.

## Patrón: CLI pequeña + canalizaciones JSON + aprobaciones

Crea comandos pequeños que hablen JSON y luego encadénalos en una sola llamada de Lobster. (Los nombres de comandos de ejemplo de abajo son solo ilustrativos: cámbialos por los tuyos).

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

Si el pipeline solicita aprobación, reanúdalo con el token:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

La IA activa el flujo de trabajo; Lobster ejecuta los pasos. Los controles de aprobación mantienen los efectos secundarios explícitos y auditables.

Ejemplo: mapear elementos de entrada a llamadas de herramientas:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Pasos LLM solo JSON (llm-task)

Para flujos de trabajo que necesitan un **paso LLM estructurado**, habilita la herramienta opcional del plugin
`llm-task` y llámala desde Lobster. Esto mantiene el flujo de trabajo
determinista y al mismo tiempo permite clasificar/resumir/redactar con un modelo.

Habilita la herramienta:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Úsala en un pipeline:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Consulta [LLM Task](/es/tools/llm-task) para obtener detalles y opciones de configuración.

## Archivos de flujo de trabajo (.lobster)

Lobster puede ejecutar archivos YAML/JSON de flujo de trabajo con campos `name`, `args`, `steps`, `env`, `condition` y `approval`. En llamadas de herramienta de OpenClaw, establece `pipeline` en la ruta del archivo.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Notas:

- `stdin: $step.stdout` y `stdin: $step.json` pasan la salida de un paso anterior.
- `condition` (o `when`) puede controlar pasos según `$step.approved`.

## Instalar Lobster

Los flujos de trabajo integrados de Lobster se ejecutan en proceso; no se requiere un binario `lobster` independiente. El runner integrado se distribuye con el plugin Lobster.

Si necesitas la CLI independiente de Lobster para desarrollo o pipelines externos, instálala desde el [repositorio de Lobster](https://github.com/openclaw/lobster) y asegúrate de que `lobster` esté en `PATH`.

## Habilitar la herramienta

Lobster es una **herramienta de plugin opcional** (no está habilitada de forma predeterminada).

Recomendado (aditivo y seguro):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

O por agente:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

Evita usar `tools.allow: ["lobster"]` salvo que tengas la intención de ejecutar en modo restrictivo de lista permitida.

Nota: las listas permitidas son opcionales para plugins opcionales. Si tu lista permitida solo nombra
herramientas de plugin (como `lobster`), OpenClaw mantiene habilitadas las herramientas del núcleo. Para restringir las herramientas del núcleo,
incluye también en la lista permitida las herramientas o grupos del núcleo que quieras.

## Ejemplo: clasificación de correo electrónico

Sin Lobster:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Con Lobster:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Devuelve un sobre JSON (truncado):

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

El usuario aprueba → reanudar:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Un flujo de trabajo. Determinista. Seguro.

## Parámetros de la herramienta

### `run`

Ejecuta un pipeline en modo herramienta.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Ejecuta un archivo de flujo de trabajo con argumentos:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Continúa un flujo de trabajo detenido después de la aprobación.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### Entradas opcionales

- `cwd`: directorio de trabajo relativo para el pipeline (debe permanecer dentro del directorio de trabajo del gateway).
- `timeoutMs`: aborta el flujo de trabajo si supera esta duración (predeterminado: 20000).
- `maxStdoutBytes`: aborta el flujo de trabajo si la salida supera este tamaño (predeterminado: 512000).
- `argsJson`: cadena JSON pasada a `lobster run --args-json` (solo archivos de flujo de trabajo).

## Sobre de salida

Lobster devuelve un sobre JSON con uno de tres estados:

- `ok` → terminó correctamente
- `needs_approval` → en pausa; `requiresApproval.resumeToken` es necesario para reanudar
- `cancelled` → denegado o cancelado explícitamente

La herramienta muestra el sobre tanto en `content` (JSON con formato) como en `details` (objeto sin procesar).

## Aprobaciones

Si `requiresApproval` está presente, inspecciona el prompt y decide:

- `approve: true` → reanudar y continuar con efectos secundarios
- `approve: false` → cancelar y finalizar el flujo de trabajo

Usa `approve --preview-from-stdin --limit N` para adjuntar una vista previa JSON a las solicitudes de aprobación sin pegamento personalizado con jq/heredoc. Los tokens de reanudación ahora son compactos: Lobster almacena el estado de reanudación del flujo de trabajo en su directorio de estado y devuelve una pequeña clave de token.

## OpenProse

OpenProse combina bien con Lobster: usa `/prose` para orquestar la preparación multiagente y luego ejecuta un pipeline de Lobster para aprobaciones deterministas. Si un programa de Prose necesita Lobster, permite la herramienta `lobster` para subagentes mediante `tools.subagents.tools`. Consulta [OpenProse](/es/prose).

## Seguridad

- **Solo local en proceso** — los flujos de trabajo se ejecutan dentro del proceso del gateway; no hay llamadas de red desde el propio plugin.
- **Sin secretos** — Lobster no gestiona OAuth; llama a herramientas de OpenClaw que sí lo hacen.
- **Consciente del sandbox** — deshabilitado cuando el contexto de la herramienta está en sandbox.
- **Reforzado** — el runner integrado aplica tiempos de espera y límites de salida.

## Solución de problemas

- **`lobster timed out`** → aumenta `timeoutMs` o divide un pipeline largo.
- **`lobster output exceeded maxStdoutBytes`** → aumenta `maxStdoutBytes` o reduce el tamaño de la salida.
- **`lobster returned invalid JSON`** → asegúrate de que el pipeline se ejecute en modo herramienta e imprima solo JSON.
- **`lobster failed`** → revisa los registros del gateway para ver los detalles del error del runner integrado.

## Más información

- [Plugins](/es/tools/plugin)
- [Creación de herramientas de plugin](/es/plugins/building-plugins#registering-agent-tools)

## Caso de estudio: flujos de trabajo de la comunidad

Un ejemplo público: una CLI de “segundo cerebro” + pipelines de Lobster que gestionan tres bóvedas de Markdown (personal, pareja, compartida). La CLI emite JSON para estadísticas, listados de bandeja de entrada y escaneos de obsolescencia; Lobster encadena esos comandos en flujos de trabajo como `weekly-review`, `inbox-triage`, `memory-consolidation` y `shared-task-sync`, cada uno con controles de aprobación. La IA se encarga del juicio (categorización) cuando está disponible y recurre a reglas deterministas cuando no lo está.

- Hilo: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repositorio: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## Relacionado

- [Automatización y tareas](/es/automation) — programar flujos de trabajo de Lobster
- [Resumen de automatización](/es/automation) — todos los mecanismos de automatización
- [Resumen de herramientas](/es/tools) — todas las herramientas de agente disponibles
