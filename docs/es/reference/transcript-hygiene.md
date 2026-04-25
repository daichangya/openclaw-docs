---
read_when:
    - Estás depurando rechazos de solicitudes del proveedor relacionados con la forma de la transcripción
    - Estás cambiando la lógica de saneamiento de transcripciones o de reparación de llamadas a herramientas
    - Estás investigando discrepancias de ID de llamadas a herramientas entre proveedores
summary: 'Referencia: reglas de saneamiento y reparación de transcripciones específicas del proveedor'
title: Higiene de transcripciones
x-i18n:
    generated_at: "2026-04-25T13:56:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: 00cac47fb9a238e3cb8b6ea69b47210685ca6769a31973b4aeef1d18e75d78e6
    source_path: reference/transcript-hygiene.md
    workflow: 15
---

Este documento describe las **correcciones específicas del proveedor** aplicadas a las transcripciones antes de una ejecución (al construir el contexto del modelo). Estos son ajustes **en memoria** usados para satisfacer requisitos estrictos del proveedor. Estos pasos de higiene **no** reescriben la transcripción JSONL almacenada en disco; sin embargo, una pasada separada de reparación de archivos de sesión puede reescribir archivos JSONL malformados eliminando líneas no válidas antes de que se cargue la sesión. Cuando ocurre una reparación, se crea una copia de seguridad del archivo original junto al archivo de sesión.

El alcance incluye:

- Contexto de prompt solo de runtime que se mantiene fuera de los turnos de transcripción visibles para el usuario
- Saneamiento de ID de llamadas a herramientas
- Validación de entrada de llamadas a herramientas
- Reparación de emparejamiento de resultados de herramientas
- Validación / ordenación de turnos
- Limpieza de firmas de pensamientos
- Saneamiento de cargas útiles de imágenes
- Etiquetado de procedencia de entrada del usuario (para prompts enrutados entre sesiones)

Si necesitas detalles sobre el almacenamiento de transcripciones, consulta:

- [Análisis profundo de la gestión de sesiones](/es/reference/session-management-compaction)

---

## Regla global: el contexto de runtime no es la transcripción del usuario

El contexto de runtime/sistema puede añadirse al prompt del modelo para un turno, pero no es contenido creado por el usuario final. OpenClaw mantiene un cuerpo de prompt orientado a la transcripción separado para las respuestas de Gateway, seguimientos en cola, ACP, CLI y ejecuciones embebidas de Pi. Los turnos visibles de usuario almacenados usan ese cuerpo de transcripción en lugar del prompt enriquecido en runtime.

Para sesiones heredadas que ya persistieron envoltorios de runtime, las superficies de historial de Gateway aplican una proyección de visualización antes de devolver mensajes a clientes WebChat, TUI, REST o SSE.

---

## Dónde se ejecuta esto

Toda la higiene de transcripciones está centralizada en el ejecutor embebido:

- Selección de políticas: `src/agents/transcript-policy.ts`
- Aplicación de saneamiento/reparación: `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

La política usa `provider`, `modelApi` y `modelId` para decidir qué aplicar.

Por separado de la higiene de transcripciones, los archivos de sesión se reparan (si es necesario) antes de cargarse:

- `repairSessionFileIfNeeded` en `src/agents/session-file-repair.ts`
- Llamado desde `run/attempt.ts` y `compact.ts` (ejecutor embebido)

---

## Regla global: saneamiento de imágenes

Las cargas útiles de imágenes siempre se sanean para evitar rechazos del proveedor por límites de tamaño (reducción de escala/recompresión de imágenes base64 sobredimensionadas).

Esto también ayuda a controlar la presión de tokens causada por imágenes en modelos con capacidad de visión.
Las dimensiones máximas más bajas generalmente reducen el uso de tokens; las dimensiones más altas preservan más detalle.

Implementación:

- `sanitizeSessionMessagesImages` en `src/agents/pi-embedded-helpers/images.ts`
- `sanitizeContentBlocksImages` en `src/agents/tool-images.ts`
- El lado máximo de la imagen es configurable mediante `agents.defaults.imageMaxDimensionPx` (predeterminado: `1200`).

---

## Regla global: llamadas a herramientas malformadas

Los bloques de llamadas a herramientas del asistente a los que les faltan tanto `input` como `arguments` se eliminan antes de construir el contexto del modelo. Esto evita rechazos del proveedor debidos a llamadas a herramientas parcialmente persistidas (por ejemplo, después de un fallo por límite de tasa).

Implementación:

- `sanitizeToolCallInputs` en `src/agents/session-transcript-repair.ts`
- Aplicado en `sanitizeSessionHistory` en `src/agents/pi-embedded-runner/replay-history.ts`

---

## Regla global: procedencia de entradas entre sesiones

Cuando un agente envía un prompt a otra sesión mediante `sessions_send` (incluidos los pasos de respuesta/anuncio entre agentes), OpenClaw persiste el turno de usuario creado con:

- `message.provenance.kind = "inter_session"`

Estos metadatos se escriben en el momento de anexar la transcripción y no cambian el rol
(`role: "user"` se mantiene por compatibilidad con el proveedor). Los lectores de transcripciones pueden usar esto para evitar tratar prompts internos enrutados como instrucciones creadas por el usuario final.

Durante la reconstrucción del contexto, OpenClaw también antepone en memoria un marcador corto `[Inter-session message]` a esos turnos de usuario para que el modelo pueda distinguirlos de instrucciones externas del usuario final.

---

## Matriz de proveedores (comportamiento actual)

**OpenAI / OpenAI Codex**

- Solo saneamiento de imágenes.
- Elimina firmas de razonamiento huérfanas (elementos de razonamiento independientes sin un bloque de contenido siguiente) para transcripciones de OpenAI Responses/Codex, y elimina razonamiento reproducible de OpenAI después de un cambio de ruta del modelo.
- Sin saneamiento de ID de llamadas a herramientas.
- La reparación de emparejamiento de resultados de herramientas puede mover salidas reales coincidentes y sintetizar salidas `aborted` al estilo Codex para llamadas a herramientas faltantes.
- Sin validación ni reordenación de turnos.
- Las salidas faltantes de herramientas de la familia OpenAI Responses se sintetizan como `aborted` para coincidir con la normalización de repetición de Codex.
- Sin eliminación de firmas de pensamientos.

**Google (Generative AI / Gemini CLI / Antigravity)**

- Saneamiento de ID de llamadas a herramientas: alfanumérico estricto.
- Reparación de emparejamiento de resultados de herramientas y resultados sintéticos de herramientas.
- Validación de turnos (alternancia de turnos al estilo Gemini).
- Corrección del orden de turnos de Google (antepone un pequeño bootstrap de usuario si el historial comienza con el asistente).
- Antigravity Claude: normaliza firmas de pensamiento; elimina bloques de pensamiento sin firma.

**Anthropic / Minimax (compatible con Anthropic)**

- Reparación de emparejamiento de resultados de herramientas y resultados sintéticos de herramientas.
- Validación de turnos (fusiona turnos consecutivos de usuario para satisfacer la alternancia estricta).

**Mistral (incluida la detección basada en ID de modelo)**

- Saneamiento de ID de llamadas a herramientas: strict9 (alfanumérico de longitud 9).

**OpenRouter Gemini**

- Limpieza de firmas de pensamientos: elimina valores `thought_signature` que no sean base64 (conserva base64).

**Todo lo demás**

- Solo saneamiento de imágenes.

---

## Comportamiento histórico (anterior a 2026.1.22)

Antes de la versión 2026.1.22, OpenClaw aplicaba varias capas de higiene de transcripciones:

- Una **extensión transcript-sanitize** se ejecutaba en cada construcción de contexto y podía:
  - Reparar el emparejamiento de uso/resultado de herramientas.
  - Sanear ID de llamadas a herramientas (incluido un modo no estricto que conservaba `_`/`-`).
- El ejecutor también realizaba saneamiento específico del proveedor, lo que duplicaba trabajo.
- Se producían mutaciones adicionales fuera de la política del proveedor, incluidas:
  - Eliminar etiquetas `<final>` del texto del asistente antes de persistirlo.
  - Eliminar turnos vacíos de error del asistente.
  - Recortar el contenido del asistente después de llamadas a herramientas.

Esta complejidad provocó regresiones entre proveedores (en particular en el emparejamiento `call_id|fc_id` de `openai-responses`). La limpieza de 2026.1.22 eliminó la extensión, centralizó la lógica en el ejecutor y convirtió OpenAI en **sin intervención** más allá del saneamiento de imágenes.

## Relacionado

- [Gestión de sesiones](/es/concepts/session)
- [Poda de sesiones](/es/concepts/session-pruning)
