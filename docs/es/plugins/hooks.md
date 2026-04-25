---
read_when:
    - Estás creando un Plugin que necesita `before_tool_call`, `before_agent_reply`, hooks de mensajes o hooks del ciclo de vida
    - Necesitas bloquear, reescribir o requerir aprobación para llamadas a herramientas desde un Plugin
    - Estás decidiendo entre hooks internos y hooks de Plugin
summary: 'Hooks de Plugin: interceptar eventos del ciclo de vida de agente, herramienta, mensaje, sesión y Gateway'
title: Hooks de Plugin
x-i18n:
    generated_at: "2026-04-25T13:51:23Z"
    model: gpt-5.4
    provider: openai
    source_hash: f263fb9064811de79fc4744ce13c5a7b9afb2d3b00330975426348af3411dc76
    source_path: plugins/hooks.md
    workflow: 15
---

Los hooks de Plugin son puntos de extensión en proceso para Plugins de OpenClaw. Úsalos
cuando un Plugin necesite inspeccionar o cambiar ejecuciones de agentes, llamadas a herramientas, flujo de mensajes,
ciclo de vida de sesiones, enrutamiento de subagentes, instalaciones o el inicio del Gateway.

Usa [hooks internos](/es/automation/hooks) en su lugar cuando quieras un pequeño
script `HOOK.md` instalado por el operador para eventos de comandos y del Gateway como
`/new`, `/reset`, `/stop`, `agent:bootstrap` o `gateway:startup`.

## Inicio rápido

Registra hooks de Plugin tipados con `api.on(...)` desde la entrada de tu Plugin:

```typescript
import { definePluginEntry } from "openclaw/plugin-sdk/plugin-entry";

export default definePluginEntry({
  id: "tool-preflight",
  name: "Tool Preflight",
  register(api) {
    api.on(
      "before_tool_call",
      async (event) => {
        if (event.toolName !== "web_search") {
          return;
        }

        return {
          requireApproval: {
            title: "Run web search",
            description: `Allow search query: ${String(event.params.query ?? "")}`,
            severity: "info",
            timeoutMs: 60_000,
            timeoutBehavior: "deny",
          },
        };
      },
      { priority: 50 },
    );
  },
});
```

Los controladores de hooks se ejecutan secuencialmente en orden descendente de `priority`. Los hooks con la misma prioridad conservan el orden de registro.

## Catálogo de hooks

Los hooks se agrupan por la superficie que extienden. Los nombres en **negrita** aceptan un
resultado de decisión (bloquear, cancelar, sobrescribir o requerir aprobación); todos los demás son solo de observación.

**Turno del agente**

- `before_model_resolve` — sobrescribir proveedor o modelo antes de cargar mensajes de sesión
- `before_prompt_build` — agregar contexto dinámico o texto al prompt del sistema antes de la llamada al modelo
- `before_agent_start` — fase combinada solo por compatibilidad; prefiere los dos hooks anteriores
- **`before_agent_reply`** — cortocircuitar el turno del modelo con una respuesta sintética o silencio
- `agent_end` — observar mensajes finales, estado de éxito y duración de la ejecución

**Observación de conversaciones**

- `llm_input` — observar entrada del proveedor (prompt del sistema, prompt, historial)
- `llm_output` — observar salida del proveedor

**Herramientas**

- **`before_tool_call`** — reescribir parámetros de herramienta, bloquear ejecución o requerir aprobación
- `after_tool_call` — observar resultados, errores y duración de herramientas
- **`tool_result_persist`** — reescribir el mensaje del asistente producido a partir de un resultado de herramienta
- **`before_message_write`** — inspeccionar o bloquear una escritura de mensaje en curso (poco común)

**Mensajes y entrega**

- **`inbound_claim`** — reclamar un mensaje entrante antes del enrutamiento al agente (respuestas sintéticas)
- `message_received` — observar contenido entrante, remitente, hilo y metadatos
- **`message_sending`** — reescribir contenido saliente o cancelar la entrega
- `message_sent` — observar éxito o fracaso de la entrega saliente
- **`before_dispatch`** — inspeccionar o reescribir un dispatch saliente antes del traspaso al canal
- **`reply_dispatch`** — participar en la canalización final de dispatch de respuestas

**Sesiones y Compaction**

- `session_start` / `session_end` — seguir límites del ciclo de vida de la sesión
- `before_compaction` / `after_compaction` — observar o anotar ciclos de Compaction
- `before_reset` — observar eventos de reinicio de sesión (`/reset`, reinicios programáticos)

**Subagentes**

- `subagent_spawning` / `subagent_delivery_target` / `subagent_spawned` / `subagent_ended` — coordinar el enrutamiento y la entrega de finalización de subagentes

**Ciclo de vida**

- `gateway_start` / `gateway_stop` — iniciar o detener servicios propiedad del Plugin con el Gateway
- **`before_install`** — inspeccionar escaneos de instalación de Skills o Plugins y opcionalmente bloquear

## Política de llamadas a herramientas

`before_tool_call` recibe:

- `event.toolName`
- `event.params`
- `event.runId` opcional
- `event.toolCallId` opcional
- campos de contexto como `ctx.agentId`, `ctx.sessionKey`, `ctx.sessionId` y
  diagnóstico `ctx.trace`

Puede devolver:

```typescript
type BeforeToolCallResult = {
  params?: Record<string, unknown>;
  block?: boolean;
  blockReason?: string;
  requireApproval?: {
    title: string;
    description: string;
    severity?: "info" | "warning" | "critical";
    timeoutMs?: number;
    timeoutBehavior?: "allow" | "deny";
    pluginId?: string;
    onResolution?: (
      decision: "allow-once" | "allow-always" | "deny" | "timeout" | "cancelled",
    ) => Promise<void> | void;
  };
};
```

Reglas:

- `block: true` es terminal y omite los controladores de menor prioridad.
- `block: false` se trata como si no hubiera decisión.
- `params` reescribe los parámetros de la herramienta para su ejecución.
- `requireApproval` pausa la ejecución del agente y pregunta al usuario mediante
  aprobaciones del Plugin. El comando `/approve` puede aprobar tanto exec como aprobaciones de Plugin.
- Un `block: true` de menor prioridad todavía puede bloquear después de que un hook de mayor prioridad
  haya solicitado aprobación.
- `onResolution` recibe la decisión de aprobación resuelta: `allow-once`,
  `allow-always`, `deny`, `timeout` o `cancelled`.

## Hooks de prompt y modelo

Usa los hooks específicos de fase para Plugins nuevos:

- `before_model_resolve`: recibe solo el prompt actual y metadatos de
  adjuntos. Devuelve `providerOverride` o `modelOverride`.
- `before_prompt_build`: recibe el prompt actual y los mensajes de la sesión.
  Devuelve `prependContext`, `systemPrompt`, `prependSystemContext` o
  `appendSystemContext`.

`before_agent_start` se mantiene por compatibilidad. Prefiere los hooks explícitos anteriores
para que tu Plugin no dependa de una fase combinada heredada.

`before_agent_start` y `agent_end` incluyen `event.runId` cuando OpenClaw puede
identificar la ejecución activa. El mismo valor también está disponible en `ctx.runId`.

Los Plugins no incluidos que necesiten `llm_input`, `llm_output` o `agent_end` deben establecer:

```json
{
  "plugins": {
    "entries": {
      "my-plugin": {
        "hooks": {
          "allowConversationAccess": true
        }
      }
    }
  }
}
```

Los hooks que mutan prompts pueden deshabilitarse por Plugin con
`plugins.entries.<id>.hooks.allowPromptInjection=false`.

## Hooks de mensajes

Usa hooks de mensajes para políticas de enrutamiento y entrega a nivel de canal:

- `message_received`: observa contenido entrante, remitente, `threadId`, `messageId`,
  `senderId`, correlación opcional de ejecución/sesión y metadatos.
- `message_sending`: reescribe `content` o devuelve `{ cancel: true }`.
- `message_sent`: observa el éxito o fracaso final.

Para respuestas TTS solo de audio, `content` puede contener la transcripción hablada oculta
incluso cuando el payload del canal no tiene texto/subtítulo visible. Reescribir ese
`content` actualiza solo la transcripción visible para hooks; no se renderiza como subtítulo del contenido multimedia.

Los contextos de hooks de mensajes exponen campos estables de correlación cuando están disponibles:
`ctx.sessionKey`, `ctx.runId`, `ctx.messageId`, `ctx.senderId`, `ctx.trace`,
`ctx.traceId`, `ctx.spanId`, `ctx.parentSpanId` y `ctx.callDepth`. Prefiere
estos campos de primera clase antes de leer metadatos heredados.

Prefiere los campos tipados `threadId` y `replyToId` antes de usar metadatos específicos del canal.

Reglas de decisión:

- `message_sending` con `cancel: true` es terminal.
- `message_sending` con `cancel: false` se trata como si no hubiera decisión.
- El `content` reescrito continúa hacia hooks de menor prioridad a menos que un hook posterior
  cancele la entrega.

## Hooks de instalación

`before_install` se ejecuta después del escaneo integrado para instalaciones de Skills y Plugins.
Devuelve hallazgos adicionales o `{ block: true, blockReason }` para detener la
instalación.

`block: true` es terminal. `block: false` se trata como si no hubiera decisión.

## Ciclo de vida del Gateway

Usa `gateway_start` para servicios de Plugin que necesiten estado propiedad del Gateway. El
contexto expone `ctx.config`, `ctx.workspaceDir` y `ctx.getCron?.()` para
inspección y actualizaciones de Cron. Usa `gateway_stop` para limpiar recursos de larga duración.

No dependas del hook interno `gateway:startup` para servicios de runtime propiedad del Plugin.

## Próximas obsolescencias

Algunas superficies adyacentes a hooks están obsoletas, pero siguen siendo compatibles. Migra
antes de la próxima versión principal:

- **Sobres de canal en texto sin formato** en controladores `inbound_claim` y `message_received`.
  Lee `BodyForAgent` y los bloques estructurados de contexto de usuario
  en lugar de analizar texto plano del sobre. Consulta
  [Plaintext channel envelopes → BodyForAgent](/es/plugins/sdk-migration#active-deprecations).
- **`before_agent_start`** se mantiene por compatibilidad. Los Plugins nuevos deben usar
  `before_model_resolve` y `before_prompt_build` en lugar de la fase combinada.
- **`onResolution` en `before_tool_call`** ahora usa la unión tipada
  `PluginApprovalResolution` (`allow-once` / `allow-always` / `deny` /
  `timeout` / `cancelled`) en lugar de una `string` libre.

Para la lista completa — registro de capacidad de memoria, perfil de thinking del proveedor,
proveedores de autenticación externos, tipos de descubrimiento de proveedores, accesores
de runtime de tareas y el cambio de nombre `command-auth` → `command-status` — consulta
[Migración del SDK de Plugin → Obsolescencias activas](/es/plugins/sdk-migration#active-deprecations).

## Relacionado

- [Migración del SDK de Plugin](/es/plugins/sdk-migration) — obsolescencias activas y cronograma de eliminación
- [Creación de Plugins](/es/plugins/building-plugins)
- [Resumen del SDK de Plugin](/es/plugins/sdk-overview)
- [Puntos de entrada de Plugin](/es/plugins/sdk-entrypoints)
- [Hooks internos](/es/automation/hooks)
- [Aspectos internos de la arquitectura de Plugins](/es/plugins/architecture-internals)
