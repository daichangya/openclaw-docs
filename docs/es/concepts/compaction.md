---
read_when:
    - Quieres entender la Compaction automática y `/compact`
    - Estás depurando sesiones largas que alcanzan los límites de contexto
summary: Cómo OpenClaw resume conversaciones largas para mantenerse dentro de los límites del modelo
title: Compaction
x-i18n:
    generated_at: "2026-04-25T13:44:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3e396a59d5346355cf2d87cd08ca8550877b103b1c613670fb3908fe1b028170
    source_path: concepts/compaction.md
    workflow: 15
---

Todo modelo tiene una ventana de contexto: el número máximo de tokens que puede procesar.
Cuando una conversación se acerca a ese límite, OpenClaw **realiza Compaction** de los mensajes
más antiguos en un resumen para que el chat pueda continuar.

## Cómo funciona

1. Los turnos más antiguos de la conversación se resumen en una entrada compacta.
2. El resumen se guarda en la transcripción de la sesión.
3. Los mensajes recientes se mantienen intactos.

Cuando OpenClaw divide el historial en fragmentos de Compaction, mantiene las
llamadas de herramientas del asistente emparejadas con sus entradas `toolResult`
correspondientes. Si un punto de división cae dentro de un bloque de herramienta,
OpenClaw mueve el límite para que el par permanezca junto y se conserve la cola
actual no resumida.

El historial completo de la conversación permanece en disco. La Compaction solo cambia lo que el
modelo ve en el siguiente turno.

## Compaction automática

La Compaction automática está activada de forma predeterminada. Se ejecuta cuando la sesión se acerca al límite de
contexto, o cuando el modelo devuelve un error de desbordamiento de contexto (en cuyo caso
OpenClaw realiza Compaction y vuelve a intentarlo). Las firmas típicas de desbordamiento incluyen
`request_too_large`, `context length exceeded`, `input exceeds the maximum
number of tokens`, `input token count exceeds the maximum number of input
tokens`, `input is too long for the model` y `ollama error: context length
exceeded`.

<Info>
Antes de realizar Compaction, OpenClaw recuerda automáticamente al agente que guarde notas importantes
en archivos de [memory](/es/concepts/memory). Esto evita la pérdida de contexto.
</Info>

Usa la configuración `agents.defaults.compaction` en tu `openclaw.json` para configurar el comportamiento de la Compaction (modo, tokens objetivo, etc.).
La resumición de Compaction conserva de forma predeterminada los identificadores opacos (`identifierPolicy: "strict"`). Puedes anular esto con `identifierPolicy: "off"` o proporcionar texto personalizado con `identifierPolicy: "custom"` e `identifierInstructions`.

Opcionalmente, puedes especificar un modelo diferente para la resumición de Compaction mediante `agents.defaults.compaction.model`. Esto es útil cuando tu modelo principal es un modelo local o pequeño y quieres que los resúmenes de Compaction los produzca un modelo más capaz. La anulación acepta cualquier cadena `provider/model-id`:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "openrouter/anthropic/claude-sonnet-4-6"
      }
    }
  }
}
```

Esto también funciona con modelos locales, por ejemplo un segundo modelo de Ollama dedicado a la resumición o un especialista afinado en Compaction:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "model": "ollama/llama3.1:8b"
      }
    }
  }
}
```

Cuando no se configura, la Compaction usa el modelo principal del agente.

## Proveedores de Compaction conectables

Los plugins pueden registrar un proveedor personalizado de Compaction mediante `registerCompactionProvider()` en la API del plugin. Cuando un proveedor está registrado y configurado, OpenClaw le delega la resumición en lugar de la canalización integrada de LLM.

Para usar un proveedor registrado, establece el ID del proveedor en tu configuración:

```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "provider": "my-provider"
      }
    }
  }
}
```

Configurar un `provider` fuerza automáticamente `mode: "safeguard"`. Los proveedores reciben las mismas instrucciones de Compaction y la misma política de conservación de identificadores que la ruta integrada, y OpenClaw sigue conservando el contexto del sufijo de turnos recientes y turnos divididos después de la salida del proveedor. Si el proveedor falla o devuelve un resultado vacío, OpenClaw recurre a la resumición integrada con LLM.

## Compaction automática (activada de forma predeterminada)

Cuando una sesión se acerca o supera la ventana de contexto del modelo, OpenClaw activa la Compaction automática y puede reintentar la solicitud original usando el contexto compactado.

Verás:

- `🧹 Auto-compaction complete` en modo detallado
- `/status` mostrando `🧹 Compactions: <count>`

Antes de la Compaction, OpenClaw puede ejecutar un turno silencioso de vaciado de memoria para almacenar
notas duraderas en disco. Consulta [Memory](/es/concepts/memory) para obtener detalles y configuración.

## Compaction manual

Escribe `/compact` en cualquier chat para forzar una Compaction. Añade instrucciones para orientar
el resumen:

```
/compact Focus on the API design decisions
```

Cuando `agents.defaults.compaction.keepRecentTokens` está configurado, la Compaction manual
respeta ese punto de corte de Pi y conserva la cola reciente en el contexto reconstruido. Sin
un presupuesto de conservación explícito, la Compaction manual se comporta como un punto de control rígido y
continúa solo desde el nuevo resumen.

## Usar un modelo diferente

De forma predeterminada, la Compaction usa el modelo principal de tu agente. Puedes usar un modelo más
capaz para obtener mejores resúmenes:

```json5
{
  agents: {
    defaults: {
      compaction: {
        model: "openrouter/anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

## Avisos de Compaction

De forma predeterminada, la Compaction se ejecuta silenciosamente. Para mostrar avisos breves cuando la Compaction
empieza y cuando termina, habilita `notifyUser`:

```json5
{
  agents: {
    defaults: {
      compaction: {
        notifyUser: true,
      },
    },
  },
}
```

Cuando está habilitado, el usuario ve mensajes de estado breves alrededor de cada ejecución de Compaction
(por ejemplo, "Compacting context..." y "Compaction complete").

## Compaction frente a poda

|                  | Compaction                    | Poda                             |
| ---------------- | ----------------------------- | -------------------------------- |
| **Qué hace**     | Resume la conversación más antigua | Recorta resultados de herramientas antiguos |
| **¿Se guarda?**  | Sí (en la transcripción de la sesión)   | No (solo en memoria, por solicitud) |
| **Alcance**      | Conversación completa           | Solo resultados de herramientas                |

La [poda de sesión](/es/concepts/session-pruning) es un complemento más ligero que
recorta la salida de herramientas sin resumir.

## Solución de problemas

**¿Se realiza Compaction con demasiada frecuencia?** La ventana de contexto del modelo puede ser pequeña, o las
salidas de herramientas pueden ser grandes. Prueba a habilitar la
[poda de sesión](/es/concepts/session-pruning).

**¿El contexto parece desactualizado después de la Compaction?** Usa `/compact Focus on <topic>` para
orientar el resumen, o habilita el [vaciado de memory](/es/concepts/memory) para que las notas
se conserven.

**¿Necesitas empezar desde cero?** `/new` inicia una sesión nueva sin realizar Compaction.

Para la configuración avanzada (reserva de tokens, conservación de identificadores, motores de
contexto personalizados, Compaction del lado del servidor de OpenAI), consulta la
[Guía avanzada de gestión de sesiones](/es/reference/session-management-compaction).

## Relacionado

- [Sesión](/es/concepts/session) — gestión y ciclo de vida de la sesión
- [Poda de sesión](/es/concepts/session-pruning) — recorte de resultados de herramientas
- [Contexto](/es/concepts/context) — cómo se construye el contexto para los turnos del agente
- [Hooks](/es/automation/hooks) — hooks del ciclo de vida de Compaction (before_compaction, after_compaction)
