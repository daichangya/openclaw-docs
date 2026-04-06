---
read_when:
    - Generar música o audio mediante el agente
    - Configurar proveedores y modelos de generación de música
    - Comprender los parámetros de la herramienta music_generate
summary: Generar música con proveedores compartidos, incluidos plugins respaldados por workflows
title: Generación de música
x-i18n:
    generated_at: "2026-04-06T03:12:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: a03de8aa75cfb7248eb0c1d969fb2a6da06117967d097e6f6e95771d0f017ae1
    source_path: tools/music-generation.md
    workflow: 15
---

# Generación de música

La herramienta `music_generate` permite al agente crear música o audio mediante la
capacidad compartida de generación de música con proveedores configurados como Google,
MiniMax y ComfyUI configurado por workflow.

Para las sesiones de agente compartidas respaldadas por proveedores, OpenClaw inicia la generación de música como una
tarea en segundo plano, la rastrea en el registro de tareas y luego vuelve a activar al agente cuando
la pista está lista para que el agente pueda publicar el audio terminado de vuelta en el
canal original.

<Note>
La herramienta compartida integrada solo aparece cuando al menos un proveedor de generación de música está disponible. Si no ves `music_generate` en las herramientas de tu agente, configura `agents.defaults.musicGenerationModel` o establece una clave de API del proveedor.
</Note>

## Inicio rápido

### Generación compartida respaldada por proveedores

1. Establece una clave de API para al menos un proveedor, por ejemplo `GEMINI_API_KEY` o
   `MINIMAX_API_KEY`.
2. Opcionalmente, configura tu modelo preferido:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
      },
    },
  },
}
```

3. Pídele al agente: _"Genera una pista synthpop animada sobre un paseo nocturno
   por una ciudad de neón."_

El agente llama a `music_generate` automáticamente. No hace falta una lista de permitidos de herramientas.

Para contextos síncronos directos sin una ejecución de agente respaldada por sesión, la
herramienta integrada sigue recurriendo a la generación en línea y devuelve la ruta final del medio en
el resultado de la herramienta.

Ejemplos de prompts:

```text
Genera una pista cinematográfica de piano con cuerdas suaves y sin voces.
```

```text
Genera un loop chiptune enérgico sobre el lanzamiento de un cohete al amanecer.
```

### Generación con Comfy basada en workflows

El plugin integrado `comfy` se conecta a la herramienta compartida `music_generate` mediante
el registro de proveedores de generación de música.

1. Configura `models.providers.comfy.music` con un workflow JSON y
   nodos de prompt/salida.
2. Si usas Comfy Cloud, establece `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`.
3. Pídele música al agente o llama a la herramienta directamente.

Ejemplo:

```text
/tool music_generate prompt="Loop de sintetizador ambiental cálido con textura suave de cinta"
```

## Compatibilidad compartida de proveedores integrados

| Provider | Modelo predeterminado  | Entradas de referencia | Controles compatibles                                      | Clave de API                           |
| -------- | ---------------------- | ---------------------- | ---------------------------------------------------------- | -------------------------------------- |
| ComfyUI  | `workflow`             | Hasta 1 imagen         | Música o audio definidos por workflow                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google   | `lyria-3-clip-preview` | Hasta 10 imágenes      | `lyrics`, `instrumental`, `format`                         | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax  | `music-2.5+`           | Ninguna                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3`  | `MINIMAX_API_KEY`                      |

Usa `action: "list"` para inspeccionar los proveedores y modelos compartidos disponibles en
tiempo de ejecución:

```text
/tool music_generate action=list
```

Usa `action: "status"` para inspeccionar la tarea de música activa respaldada por sesión:

```text
/tool music_generate action=status
```

Ejemplo de generación directa:

```text
/tool music_generate prompt="Lo-fi hip hop soñador con textura de vinilo y lluvia suave" instrumental=true
```

## Parámetros de la herramienta integrada

| Parameter         | Type     | Descripción                                                                                          |
| ----------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt de generación de música (obligatorio para `action: "generate"`)                               |
| `action`          | string   | `"generate"` (predeterminado), `"status"` para la tarea actual de la sesión o `"list"` para inspeccionar proveedores |
| `model`           | string   | Anulación de proveedor/modelo, por ejemplo `google/lyria-3-pro-preview` o `comfy/workflow`          |
| `lyrics`          | string   | Letra opcional cuando el proveedor admite entrada explícita de letras                                |
| `instrumental`    | boolean  | Solicita salida solo instrumental cuando el proveedor lo admite                                      |
| `image`           | string   | Ruta o URL de una sola imagen de referencia                                                           |
| `images`          | string[] | Varias imágenes de referencia (hasta 10)                                                              |
| `durationSeconds` | number   | Duración objetivo en segundos cuando el proveedor admite sugerencias de duración                     |
| `format`          | string   | Sugerencia de formato de salida (`mp3` o `wav`) cuando el proveedor lo admite                        |
| `filename`        | string   | Sugerencia de nombre de archivo de salida                                                             |

No todos los proveedores admiten todos los parámetros. OpenClaw sigue validando límites estrictos
como el número de entradas antes del envío, pero las sugerencias opcionales no compatibles
se ignoran con una advertencia cuando el proveedor o modelo seleccionado no puede respetarlas.

## Comportamiento asíncrono para la ruta compartida respaldada por proveedores

- Ejecuciones de agente respaldadas por sesión: `music_generate` crea una tarea en segundo plano, devuelve inmediatamente una respuesta de inicio/tarea y publica la pista terminada más tarde en un mensaje de seguimiento del agente.
- Prevención de duplicados: mientras esa tarea en segundo plano siga en estado `queued` o `running`, las llamadas posteriores a `music_generate` en la misma sesión devuelven el estado de la tarea en lugar de iniciar otra generación.
- Consulta de estado: usa `action: "status"` para inspeccionar la tarea de música activa respaldada por la sesión sin iniciar una nueva.
- Seguimiento de tareas: usa `openclaw tasks list` o `openclaw tasks show <taskId>` para inspeccionar el estado en cola, en ejecución y terminal de la generación.
- Activación al completarse: OpenClaw inyecta de nuevo un evento interno de finalización en la misma sesión para que el modelo pueda escribir por sí mismo el mensaje de seguimiento visible para el usuario.
- Pista en el prompt: los turnos posteriores del usuario/manuales en la misma sesión reciben una pequeña pista de runtime cuando ya hay una tarea de música en curso para que el modelo no llame ciegamente a `music_generate` otra vez.
- Fallback sin sesión: los contextos directos/locales sin una sesión real de agente siguen ejecutándose en línea y devuelven el resultado final de audio en el mismo turno.

## Configuración

### Selección de modelo

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.5+"],
      },
    },
  },
}
```

### Orden de selección de proveedores

Al generar música, OpenClaw prueba los proveedores en este orden:

1. El parámetro `model` de la llamada a la herramienta, si el agente especifica uno
2. `musicGenerationModel.primary` de la configuración
3. `musicGenerationModel.fallbacks` en orden
4. Detección automática usando solo valores predeterminados de proveedor respaldados por autenticación:
   - primero el proveedor predeterminado actual
   - luego los proveedores restantes de generación de música registrados en orden de id de proveedor

Si un proveedor falla, se prueba automáticamente el siguiente candidato. Si todos fallan, el
error incluye detalles de cada intento.

## Notas sobre proveedores

- Google usa generación por lotes de Lyria 3. El flujo integrado actual admite
  prompt, texto opcional de letras e imágenes de referencia opcionales.
- MiniMax usa el endpoint por lotes `music_generation`. El flujo integrado actual
  admite prompt, letras opcionales, modo instrumental, ajuste de duración y
  salida mp3.
- La compatibilidad con ComfyUI está impulsada por workflows y depende del grafo configurado más
  el mapeo de nodos para campos de prompt/salida.

## Elegir la ruta adecuada

- Usa la ruta compartida respaldada por proveedores cuando quieras selección de modelo, failover de proveedor y el flujo integrado asíncrono de tarea/estado.
- Usa una ruta de plugin como ComfyUI cuando necesites un grafo de workflow personalizado o un proveedor que no forme parte de la capacidad compartida integrada de música.
- Si estás depurando comportamiento específico de ComfyUI, consulta [ComfyUI](/providers/comfy). Si estás depurando comportamiento de proveedores compartidos, empieza por [Google (Gemini)](/es/providers/google) o [MiniMax](/es/providers/minimax).

## Pruebas live

Cobertura live opt-in para los proveedores compartidos integrados:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Cobertura live opt-in para la ruta de música ComfyUI integrada:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

El archivo live de Comfy también cubre workflows de imagen y video de comfy cuando esas
secciones están configuradas.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) - seguimiento de tareas para ejecuciones desacopladas de `music_generate`
- [Referencia de configuración](/es/gateway/configuration-reference#agent-defaults) - configuración `musicGenerationModel`
- [ComfyUI](/providers/comfy)
- [Google (Gemini)](/es/providers/google)
- [MiniMax](/es/providers/minimax)
- [Models](/es/concepts/models) - configuración de modelos y failover
- [Resumen de herramientas](/es/tools)
