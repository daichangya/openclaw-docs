---
read_when:
    - Generar música o audio mediante el agente
    - Configurar proveedores y modelos de generación de música
    - Entender los parámetros de la herramienta `music_generate`
summary: Genera música con proveedores compartidos, incluidos Plugins respaldados por workflow
title: Generación de música
x-i18n:
    generated_at: "2026-04-25T13:58:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: fe66c6dfb54c71b1d08a486c574e8a86cf3731d5339b44b9eef121f045c13cb8
    source_path: tools/music-generation.md
    workflow: 15
---

La herramienta `music_generate` permite al agente crear música o audio mediante la
capacidad compartida de generación de música con proveedores configurados como Google,
MiniMax y ComfyUI configurado por workflow.

Para sesiones de agente compartidas respaldadas por proveedores, OpenClaw inicia la generación de música como una
tarea en segundo plano, la rastrea en el registro de tareas y luego vuelve a despertar al agente cuando
la pista está lista para que el agente pueda publicar el audio terminado en el
canal original.

<Note>
La herramienta compartida integrada solo aparece cuando al menos un proveedor de generación de música está disponible. Si no ves `music_generate` en las herramientas de tu agente, configura `agents.defaults.musicGenerationModel` o establece una clave API de proveedor.
</Note>

## Inicio rápido

### Generación compartida respaldada por proveedores

1. Establece una clave API para al menos un proveedor, por ejemplo `GEMINI_API_KEY` o
   `MINIMAX_API_KEY`.
2. Opcionalmente, establece tu modelo preferido:

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

3. Pídele al agente: _"Genera una pista synthpop animada sobre un viaje nocturno
   por una ciudad de neón."_

El agente llama a `music_generate` automáticamente. No hace falta una lista de herramientas permitidas.

Para contextos síncronos directos sin una ejecución de agente respaldada por sesión, la herramienta integrada
sigue recurriendo a la generación en línea y devuelve la ruta final del medio en
el resultado de la herramienta.

Prompts de ejemplo:

```text
Genera una pista de piano cinematográfica con cuerdas suaves y sin voces.
```

```text
Genera un loop chiptune enérgico sobre el lanzamiento de un cohete al amanecer.
```

### Generación con Comfy controlada por workflow

El Plugin `comfy` incluido se conecta a la herramienta compartida `music_generate` mediante
el registro de proveedores de generación de música.

1. Configura `plugins.entries.comfy.config.music` con un JSON de workflow y
   nodos de prompt/salida.
2. Si usas Comfy Cloud, establece `COMFY_API_KEY` o `COMFY_CLOUD_API_KEY`.
3. Pídele música al agente o llama a la herramienta directamente.

Ejemplo:

```text
/tool music_generate prompt="Loop synth ambiental cálido con textura de cinta suave"
```

## Compatibilidad integrada compartida de proveedores

| Proveedor | Modelo predeterminado     | Entradas de referencia | Controles compatibles                                      | Clave API                              |
| --------- | ------------------------- | ---------------------- | ---------------------------------------------------------- | -------------------------------------- |
| ComfyUI   | `workflow`                | Hasta 1 imagen         | Música o audio definidos por workflow                      | `COMFY_API_KEY`, `COMFY_CLOUD_API_KEY` |
| Google    | `lyria-3-clip-preview`    | Hasta 10 imágenes      | `lyrics`, `instrumental`, `format`                         | `GEMINI_API_KEY`, `GOOGLE_API_KEY`     |
| MiniMax   | `music-2.6`               | Ninguna                | `lyrics`, `instrumental`, `durationSeconds`, `format=mp3`  | `MINIMAX_API_KEY`                      |

### Matriz de capacidades declaradas

Este es el contrato de modo explícito usado por `music_generate`, las pruebas de contrato
y la barrida compartida en vivo.

| Proveedor | `generate` | `edit` | Límite de edición | Lanes compartidos en vivo                                                  |
| --------- | ---------- | ------ | ----------------- | -------------------------------------------------------------------------- |
| ComfyUI   | Sí         | Sí     | 1 imagen          | No está en la barrida compartida; cubierto por `extensions/comfy/comfy.live.test.ts` |
| Google    | Sí         | Sí     | 10 imágenes       | `generate`, `edit`                                                         |
| MiniMax   | Sí         | No     | Ninguno           | `generate`                                                                 |

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
/tool music_generate prompt="Dreamy lo-fi hip hop with vinyl texture and gentle rain" instrumental=true
```

## Parámetros de la herramienta integrada

| Parámetro         | Tipo     | Descripción                                                                                         |
| ----------------- | -------- | --------------------------------------------------------------------------------------------------- |
| `prompt`          | string   | Prompt de generación de música (obligatorio para `action: "generate"`)                              |
| `action`          | string   | `"generate"` (predeterminado), `"status"` para la tarea actual de la sesión, o `"list"` para inspeccionar proveedores |
| `model`           | string   | Sustitución de proveedor/modelo, por ejemplo `google/lyria-3-pro-preview` o `comfy/workflow`       |
| `lyrics`          | string   | Letra opcional cuando el proveedor admite entrada explícita de letras                               |
| `instrumental`    | boolean  | Solicita una salida solo instrumental cuando el proveedor lo admite                                 |
| `image`           | string   | Ruta o URL de una sola imagen de referencia                                                         |
| `images`          | string[] | Múltiples imágenes de referencia (hasta 10)                                                         |
| `durationSeconds` | number   | Duración objetivo en segundos cuando el proveedor admite sugerencias de duración                    |
| `timeoutMs`       | number   | Tiempo de espera opcional de la solicitud del proveedor en milisegundos                             |
| `format`          | string   | Sugerencia de formato de salida (`mp3` o `wav`) cuando el proveedor lo admite                       |
| `filename`        | string   | Sugerencia de nombre de archivo de salida                                                           |

No todos los proveedores admiten todos los parámetros. OpenClaw sigue validando límites estrictos
como el número de entradas antes del envío. Cuando un proveedor admite duración pero
usa un máximo más corto que el valor solicitado, OpenClaw ajusta automáticamente
a la duración admitida más cercana. Las sugerencias opcionales realmente no admitidas se ignoran
con una advertencia cuando el proveedor o modelo seleccionado no puede respetarlas.

Los resultados de la herramienta informan los ajustes aplicados. Cuando OpenClaw ajusta la duración durante el failover del proveedor, el valor devuelto de `durationSeconds` refleja el valor enviado y `details.normalization.durationSeconds` muestra la asignación de lo solicitado a lo aplicado.

## Comportamiento asíncrono para la ruta compartida respaldada por proveedores

- Ejecuciones de agente respaldadas por sesión: `music_generate` crea una tarea en segundo plano, devuelve inmediatamente una respuesta de iniciada/tarea y publica la pista terminada más tarde en un mensaje de seguimiento del agente.
- Prevención de duplicados: mientras esa tarea en segundo plano siga en estado `queued` o `running`, las llamadas posteriores a `music_generate` en la misma sesión devuelven el estado de la tarea en lugar de iniciar otra generación.
- Consulta de estado: usa `action: "status"` para inspeccionar la tarea de música activa respaldada por sesión sin iniciar una nueva.
- Seguimiento de tareas: usa `openclaw tasks list` o `openclaw tasks show <taskId>` para inspeccionar el estado en cola, en ejecución y terminal de la generación.
- Despertar por finalización: OpenClaw inyecta un evento interno de finalización de vuelta en la misma sesión para que el modelo pueda escribir por sí mismo el seguimiento orientado al usuario.
- Sugerencia en el prompt: los turnos posteriores del usuario/manuales en la misma sesión reciben una pequeña sugerencia de runtime cuando ya hay una tarea de música en curso para que el modelo no llame ciegamente a `music_generate` otra vez.
- Respaldo sin sesión: los contextos directos/locales sin una sesión real de agente siguen ejecutándose en línea y devuelven el resultado final de audio en el mismo turno.

### Ciclo de vida de la tarea

Cada solicitud `music_generate` pasa por cuatro estados:

1. **queued** -- tarea creada, esperando a que el proveedor la acepte.
2. **running** -- el proveedor está procesando (normalmente entre 30 segundos y 3 minutos según el proveedor y la duración).
3. **succeeded** -- pista lista; el agente despierta y la publica en la conversación.
4. **failed** -- error del proveedor o tiempo de espera agotado; el agente despierta con detalles del error.

Comprueba el estado desde la CLI:

```bash
openclaw tasks list
openclaw tasks show <taskId>
openclaw tasks cancel <taskId>
```

Prevención de duplicados: si ya existe una tarea de música `queued` o `running` para la sesión actual, `music_generate` devuelve el estado de la tarea existente en lugar de iniciar una nueva. Usa `action: "status"` para comprobarlo explícitamente sin activar una nueva generación.

## Configuración

### Selección de modelo

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "google/lyria-3-clip-preview",
        fallbacks: ["minimax/music-2.6"],
      },
    },
  },
}
```

### Orden de selección del proveedor

Al generar música, OpenClaw prueba los proveedores en este orden:

1. El parámetro `model` de la llamada a la herramienta, si el agente especifica uno
2. `musicGenerationModel.primary` de la configuración
3. `musicGenerationModel.fallbacks` en orden
4. Detección automática usando solo valores predeterminados de proveedores respaldados por autenticación:
   - primero el proveedor predeterminado actual
   - luego los proveedores de generación de música registrados restantes en orden de id de proveedor

Si un proveedor falla, el siguiente candidato se prueba automáticamente. Si todos fallan, el
error incluye detalles de cada intento.

Establece `agents.defaults.mediaGenerationAutoProviderFallback: false` si quieres que la
generación de música use solo las entradas explícitas `model`, `primary` y `fallbacks`.

## Notas de proveedores

- Google usa generación por lotes Lyria 3. El flujo incluido actual admite
  prompt, texto opcional de letras e imágenes de referencia opcionales.
- MiniMax usa el endpoint por lotes `music_generation`. El flujo incluido actual
  admite prompt, letras opcionales, modo instrumental, ajuste de duración y
  salida mp3.
- La compatibilidad con ComfyUI está controlada por workflow y depende del grafo configurado más
  la asignación de nodos para los campos de prompt/salida.

## Modos de capacidad del proveedor

El contrato compartido de generación de música ahora admite declaraciones explícitas de modo:

- `generate` para generación solo con prompt
- `edit` cuando la solicitud incluye una o más imágenes de referencia

Las nuevas implementaciones de proveedores deberían preferir bloques de modo explícitos:

```typescript
capabilities: {
  generate: {
    maxTracks: 1,
    supportsLyrics: true,
    supportsFormat: true,
  },
  edit: {
    enabled: true,
    maxTracks: 1,
    maxInputImages: 1,
    supportsFormat: true,
  },
}
```

Los campos planos heredados como `maxInputImages`, `supportsLyrics` y
`supportsFormat` no bastan para anunciar compatibilidad de edición. Los proveedores deberían
declarar `generate` y `edit` explícitamente para que las pruebas en vivo, las pruebas de contrato y
la herramienta compartida `music_generate` puedan validar la compatibilidad de modo de forma determinista.

## Elegir la ruta correcta

- Usa la ruta compartida respaldada por proveedores cuando quieras selección de modelo, failover de proveedor y el flujo integrado asíncrono de tarea/estado.
- Usa una ruta de Plugin como ComfyUI cuando necesites un grafo de workflow personalizado o un proveedor que no forme parte de la capacidad compartida integrada de música.
- Si estás depurando un comportamiento específico de ComfyUI, consulta [ComfyUI](/es/providers/comfy). Si estás depurando comportamiento compartido de proveedores, empieza con [Google (Gemini)](/es/providers/google) o [MiniMax](/es/providers/minimax).

## Pruebas en vivo

Cobertura en vivo opcional para los proveedores integrados compartidos:

```bash
OPENCLAW_LIVE_TEST=1 pnpm test:live -- extensions/music-generation-providers.live.test.ts
```

Envoltorio del repositorio:

```bash
pnpm test:live:media music
```

Este archivo en vivo carga las variables de entorno de proveedor que falten desde `~/.profile`, da prioridad
a las claves API en vivo/del entorno sobre los perfiles de autenticación almacenados de forma predeterminada y ejecuta cobertura tanto de
`generate` como de `edit` declarado cuando el proveedor habilita el modo de edición.

Hoy eso significa:

- `google`: `generate` más `edit`
- `minimax`: solo `generate`
- `comfy`: cobertura en vivo de Comfy por separado, no en la barrida compartida de proveedores

Cobertura en vivo opcional para la ruta de música ComfyUI incluida:

```bash
OPENCLAW_LIVE_TEST=1 COMFY_LIVE_TEST=1 pnpm test:live -- extensions/comfy/comfy.live.test.ts
```

El archivo en vivo de Comfy también cubre workflows de imagen y video de Comfy cuando esas
secciones están configuradas.

## Relacionado

- [Tareas en segundo plano](/es/automation/tasks) - seguimiento de tareas para ejecuciones desacopladas de `music_generate`
- [Referencia de configuración](/es/gateway/config-agents#agent-defaults) - configuración de `musicGenerationModel`
- [ComfyUI](/es/providers/comfy)
- [Google (Gemini)](/es/providers/google)
- [MiniMax](/es/providers/minimax)
- [Modelos](/es/concepts/models) - configuración de modelos y failover
- [Resumen de herramientas](/es/tools)
