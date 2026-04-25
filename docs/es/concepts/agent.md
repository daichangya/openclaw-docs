---
read_when:
    - Cambiar el runtime del agente, el arranque del espacio de trabajo o el comportamiento de la sesión
summary: Runtime del agente, contrato del espacio de trabajo y arranque de la sesión
title: Runtime del agente
x-i18n:
    generated_at: "2026-04-25T13:44:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 37483fdb62d41a8f888bd362db93078dc8ecb8bb3fd19270b0234689aa82f309
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw ejecuta un **único runtime de agente integrado**: un proceso de agente por Gateway, con su propio espacio de trabajo, archivos de arranque y almacén de sesiones. Esta página cubre ese contrato del runtime: qué debe contener el espacio de trabajo, qué archivos se inyectan y cómo se inicializan las sesiones sobre él.

## Espacio de trabajo (obligatorio)

OpenClaw usa un único directorio de espacio de trabajo del agente (`agents.defaults.workspace`) como el **único** directorio de trabajo (`cwd`) del agente para herramientas y contexto.

Recomendado: usa `openclaw setup` para crear `~/.openclaw/openclaw.json` si falta e inicializar los archivos del espacio de trabajo.

Diseño completo del espacio de trabajo + guía de copia de seguridad: [Espacio de trabajo del agente](/es/concepts/agent-workspace)

Si `agents.defaults.sandbox` está habilitado, las sesiones que no sean la principal pueden sobrescribir esto con espacios de trabajo por sesión bajo `agents.defaults.sandbox.workspaceRoot` (consulta [Configuración del Gateway](/es/gateway/configuration)).

## Archivos de arranque (inyectados)

Dentro de `agents.defaults.workspace`, OpenClaw espera estos archivos editables por el usuario:

- `AGENTS.md` — instrucciones operativas + “memoria”
- `SOUL.md` — personalidad, límites, tono
- `TOOLS.md` — notas de herramientas mantenidas por el usuario (por ejemplo `imsg`, `sag`, convenciones)
- `BOOTSTRAP.md` — ritual único de primera ejecución (se elimina tras completarse)
- `IDENTITY.md` — nombre/estilo/emoji del agente
- `USER.md` — perfil del usuario + forma preferida de tratamiento

En el primer turno de una nueva sesión, OpenClaw inyecta directamente en el contexto del agente el contenido de estos archivos.

Los archivos vacíos se omiten. Los archivos grandes se recortan y truncan con un marcador para que los prompts sigan siendo ligeros (lee el archivo para ver el contenido completo).

Si falta un archivo, OpenClaw inyecta una sola línea de marcador de “archivo faltante” (y `openclaw setup` creará una plantilla predeterminada segura).

`BOOTSTRAP.md` solo se crea para un **espacio de trabajo completamente nuevo** (sin otros archivos de arranque presentes). Si lo eliminas después de completar el ritual, no debería recrearse en reinicios posteriores.

Para desactivar por completo la creación de archivos de arranque (para espacios de trabajo preinicializados), configura:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Herramientas integradas

Las herramientas principales (read/exec/edit/write y herramientas del sistema relacionadas) están siempre disponibles, sujetas a la política de herramientas. `apply_patch` es opcional y está restringida por `tools.exec.applyPatch`. `TOOLS.md` **no** controla qué herramientas existen; es una guía sobre cómo _quieres_ usarlas.

## Skills

OpenClaw carga Skills desde estas ubicaciones (de mayor a menor precedencia):

- Espacio de trabajo: `<workspace>/skills`
- Skills de agente del proyecto: `<workspace>/.agents/skills`
- Skills de agente personales: `~/.agents/skills`
- Administradas/locales: `~/.openclaw/skills`
- Incluidas (distribuidas con la instalación)
- Carpetas adicionales de Skills: `skills.load.extraDirs`

Las Skills pueden estar restringidas por configuración/entorno (consulta `skills` en [Configuración del Gateway](/es/gateway/configuration)).

## Límites del runtime

El runtime de agente integrado está construido sobre el núcleo del agente Pi (modelos, herramientas y pipeline de prompts). La gestión de sesiones, el descubrimiento, la conexión de herramientas y la entrega por canal son capas propiedad de OpenClaw sobre ese núcleo.

## Sesiones

Las transcripciones de las sesiones se almacenan como JSONL en:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

El ID de sesión es estable y lo elige OpenClaw.
No se leen carpetas de sesiones heredadas de otras herramientas.

## Dirección durante el streaming

Cuando el modo de cola es `steer`, los mensajes entrantes se inyectan en la ejecución actual. La dirección en cola se entrega **después de que el turno actual del asistente termine de ejecutar sus llamadas a herramientas**, antes de la siguiente llamada al LLM. La dirección ya no omite las llamadas a herramientas restantes del mensaje actual del asistente; en su lugar, inyecta el mensaje en cola en el siguiente límite del modelo.

Cuando el modo de cola es `followup` o `collect`, los mensajes entrantes se retienen hasta que termina el turno actual y luego comienza un nuevo turno del agente con las cargas en cola. Consulta [Queue](/es/concepts/queue) para ver el comportamiento de modo + debounce/límite.

El streaming por bloques envía bloques completados del asistente en cuanto terminan; está **desactivado de forma predeterminada** (`agents.defaults.blockStreamingDefault: "off"`).
Ajusta el límite mediante `agents.defaults.blockStreamingBreak` (`text_end` frente a `message_end`; el valor predeterminado es text_end).
Controla la fragmentación suave de bloques con `agents.defaults.blockStreamingChunk` (valor predeterminado de 800–1200 caracteres; prefiere saltos de párrafo, luego nuevas líneas; las oraciones al final).
Combina fragmentos transmitidos con `agents.defaults.blockStreamingCoalesce` para reducir el spam de líneas individuales (fusión basada en inactividad antes del envío). Los canales que no son Telegram requieren `*.blockStreaming: true` explícito para habilitar respuestas por bloques.
Los resúmenes detallados de herramientas se emiten al inicio de la herramienta (sin debounce); Control UI transmite la salida de herramientas mediante eventos del agente cuando está disponible.
Más detalles: [Streaming + fragmentación](/es/concepts/streaming).

## Referencias de modelos

Las referencias de modelos en la configuración (por ejemplo `agents.defaults.model` y `agents.defaults.models`) se analizan dividiendo por la **primera** `/`.

- Usa `provider/model` al configurar modelos.
- Si el ID del modelo contiene `/` (estilo OpenRouter), incluye el prefijo del proveedor (ejemplo: `openrouter/moonshotai/kimi-k2`).
- Si omites el proveedor, OpenClaw primero intenta un alias, luego una coincidencia única de proveedor configurado para ese ID exacto de modelo, y solo después usa como respaldo el proveedor predeterminado configurado. Si ese proveedor ya no expone el modelo predeterminado configurado, OpenClaw usa como respaldo el primer proveedor/modelo configurado en lugar de mostrar un valor predeterminado obsoleto de un proveedor eliminado.

## Configuración (mínima)

Como mínimo, configura:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (muy recomendado)

---

_Siguiente: [Chats grupales](/es/channels/group-messages)_ 🦞

## Relacionado

- [Espacio de trabajo del agente](/es/concepts/agent-workspace)
- [Enrutamiento de varios agentes](/es/concepts/multi-agent)
- [Gestión de sesiones](/es/concepts/session)
