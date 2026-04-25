---
read_when:
    - Necesitas una vista general de logging apta para principiantes
    - Quieres configurar niveles o formatos de log
    - Estás solucionando problemas y necesitas encontrar los logs rápidamente
summary: 'Resumen de logs: logs en archivo, salida de consola, seguimiento con CLI y la interfaz Control UI'
title: Resumen de logs
x-i18n:
    generated_at: "2026-04-25T13:49:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: e16a8aa487616c338c625c55fdfcc604759ee7b1e235b0b318b36d7a6fb07ab8
    source_path: logging.md
    workflow: 15
---

# Logging

OpenClaw tiene dos superficies principales de logs:

- **Logs en archivo** (líneas JSON) escritos por el Gateway.
- **Salida de consola** mostrada en terminales y en la interfaz Gateway Debug UI.

La pestaña **Logs** de Control UI sigue el log de archivo del gateway. Esta página explica dónde
viven los logs, cómo leerlos y cómo configurar niveles y formatos de log.

## Dónde viven los logs

Por defecto, el Gateway escribe un archivo de log rotativo en:

`/tmp/openclaw/openclaw-YYYY-MM-DD.log`

La fecha usa la zona horaria local del host del gateway.

Puedes sobrescribirlo en `~/.openclaw/openclaw.json`:

```json
{
  "logging": {
    "file": "/path/to/openclaw.log"
  }
}
```

## Cómo leer los logs

### CLI: seguimiento live (recomendado)

Usa la CLI para seguir el archivo de log del gateway mediante RPC:

```bash
openclaw logs --follow
```

Opciones útiles actuales:

- `--local-time`: muestra las marcas de tiempo en tu zona horaria local
- `--url <url>` / `--token <token>` / `--timeout <ms>`: flags estándar de RPC del Gateway
- `--expect-final`: flag de espera de respuesta final de RPC respaldado por agente (aceptado aquí mediante la capa de cliente compartida)

Modos de salida:

- **Sesiones TTY**: líneas de log estructuradas, colorizadas y legibles.
- **Sesiones no TTY**: texto plano.
- `--json`: JSON delimitado por líneas (un evento de log por línea).
- `--plain`: fuerza texto plano en sesiones TTY.
- `--no-color`: desactiva los colores ANSI.

Cuando pasas un `--url` explícito, la CLI no aplica automáticamente la configuración ni las
credenciales del entorno; incluye `--token` tú mismo si el Gateway de destino
requiere autenticación.

En modo JSON, la CLI emite objetos etiquetados con `type`:

- `meta`: metadatos del stream (archivo, cursor, tamaño)
- `log`: entrada de log analizada
- `notice`: sugerencias de truncado / rotación
- `raw`: línea de log sin analizar

Si el Gateway local de loopback solicita emparejamiento, `openclaw logs` recurre
automáticamente al archivo de log local configurado. Los destinos `--url` explícitos no
usan este fallback.

Si el Gateway no es accesible, la CLI imprime una pista breve para ejecutar:

```bash
openclaw doctor
```

### Control UI (web)

La pestaña **Logs** de Control UI sigue el mismo archivo usando `logs.tail`.
Consulta [/web/control-ui](/es/web/control-ui) para ver cómo abrirla.

### Logs solo de canal

Para filtrar actividad de canales (WhatsApp/Telegram/etc.), usa:

```bash
openclaw channels logs --channel whatsapp
```

## Formatos de log

### Logs en archivo (JSONL)

Cada línea del archivo de log es un objeto JSON. La CLI y Control UI analizan estas
entradas para mostrar salida estructurada (hora, nivel, subsistema, mensaje).

### Salida de consola

Los logs de consola son **conscientes de TTY** y están formateados para legibilidad:

- Prefijos de subsistema (p. ej. `gateway/channels/whatsapp`)
- Colores por nivel (info/warn/error)
- Modo compacto o JSON opcional

El formato de consola está controlado por `logging.consoleStyle`.

### Logs WebSocket del Gateway

`openclaw gateway` también tiene logging del protocolo WebSocket para tráfico RPC:

- modo normal: solo resultados interesantes (errores, errores de análisis, llamadas lentas)
- `--verbose`: todo el tráfico de solicitud/respuesta
- `--ws-log auto|compact|full`: elige el estilo de renderizado detallado
- `--compact`: alias de `--ws-log compact`

Ejemplos:

```bash
openclaw gateway
openclaw gateway --verbose --ws-log compact
openclaw gateway --verbose --ws-log full
```

## Configurar logging

Toda la configuración de logging vive bajo `logging` en `~/.openclaw/openclaw.json`.

```json
{
  "logging": {
    "level": "info",
    "file": "/tmp/openclaw/openclaw-YYYY-MM-DD.log",
    "consoleLevel": "info",
    "consoleStyle": "pretty",
    "redactSensitive": "tools",
    "redactPatterns": ["sk-.*"]
  }
}
```

### Niveles de log

- `logging.level`: nivel de los **logs en archivo** (JSONL).
- `logging.consoleLevel`: nivel de verbosidad de la **consola**.

Puedes sobrescribir ambos mediante la variable de entorno **`OPENCLAW_LOG_LEVEL`** (p. ej. `OPENCLAW_LOG_LEVEL=debug`). La variable de entorno tiene prioridad sobre el archivo de configuración, así que puedes aumentar la verbosidad para una sola ejecución sin editar `openclaw.json`. También puedes pasar la opción global de CLI **`--log-level <level>`** (por ejemplo, `openclaw --log-level debug gateway run`), que sobrescribe la variable de entorno para ese comando.

`--verbose` solo afecta la salida de consola y la verbosidad de logs WS; no cambia
los niveles de log en archivo.

### Estilos de consola

`logging.consoleStyle`:

- `pretty`: legible para humanos, con colores y marcas de tiempo.
- `compact`: salida más ajustada (mejor para sesiones largas).
- `json`: JSON por línea (para procesadores de logs).

### Redacción

Los resúmenes de herramientas pueden redactar tokens sensibles antes de llegar a la consola:

- `logging.redactSensitive`: `off` | `tools` (predeterminado: `tools`)
- `logging.redactPatterns`: lista de cadenas regex para sobrescribir el conjunto predeterminado

La redacción afecta **solo a la salida de consola** y no altera los logs en archivo.

## Diagnóstico + OpenTelemetry

Los diagnósticos son eventos estructurados y legibles por máquina para ejecuciones de modelos **y**
telemetría de flujo de mensajes (Webhooks, colas, estado de sesión). **No**
reemplazan los logs; existen para alimentar métricas, trazas y otros exportadores.

Los eventos de diagnóstico se emiten dentro del proceso, pero los exportadores solo se adjuntan cuando
están habilitados los diagnósticos + el plugin exportador.

### OpenTelemetry vs OTLP

- **OpenTelemetry (OTel)**: el modelo de datos + SDK para trazas, métricas y logs.
- **OTLP**: el protocolo de red usado para exportar datos OTel a un collector/backend.
- OpenClaw exporta mediante **OTLP/HTTP (protobuf)** actualmente.

### Señales exportadas

- **Métricas**: contadores + histogramas (uso de tokens, flujo de mensajes, colas).
- **Trazas**: spans para uso del modelo + procesamiento de Webhooks/mensajes.
- **Logs**: exportados por OTLP cuando `diagnostics.otel.logs` está habilitado. El
  volumen de logs puede ser alto; ten en cuenta `logging.level` y los filtros del exportador.

### Catálogo de eventos de diagnóstico

Uso de modelo:

- `model.usage`: tokens, costo, duración, contexto, proveedor/modelo/canal, ids de sesión.

Flujo de mensajes:

- `webhook.received`: ingreso de Webhook por canal.
- `webhook.processed`: Webhook gestionado + duración.
- `webhook.error`: errores del controlador de Webhook.
- `message.queued`: mensaje encolado para procesamiento.
- `message.processed`: resultado + duración + error opcional.
- `message.delivery.started`: inicio del intento de entrega saliente.
- `message.delivery.completed`: fin del intento de entrega saliente + duración/recuento de resultados.
- `message.delivery.error`: fallo del intento de entrega saliente + duración/categoría de error acotada.

Cola + sesión:

- `queue.lane.enqueue`: encolado de lane de cola de comandos + profundidad.
- `queue.lane.dequeue`: salida de lane de cola de comandos + tiempo de espera.
- `session.state`: transición de estado de sesión + motivo.
- `session.stuck`: advertencia de sesión atascada + antigüedad.
- `run.attempt`: metadatos de intento/reintento de ejecución.
- `diagnostic.heartbeat`: contadores agregados (Webhooks/cola/sesión).

Exec:

- `exec.process.completed`: resultado, duración, destino, modo,
  código de salida y tipo de fallo del proceso exec de terminal. El texto del comando y los directorios de trabajo no
  se incluyen.

### Habilitar diagnósticos (sin exportador)

Usa esto si quieres que los eventos de diagnóstico estén disponibles para plugins o sinks personalizados:

```json
{
  "diagnostics": {
    "enabled": true
  }
}
```

### Flags de diagnóstico (logs dirigidos)

Usa flags para activar logs de depuración adicionales y dirigidos sin aumentar `logging.level`.
Los flags no distinguen mayúsculas/minúsculas y admiten comodines (p. ej. `telegram.*` o `*`).

```json
{
  "diagnostics": {
    "flags": ["telegram.http"]
  }
}
```

Sobrescritura por entorno (puntual):

```text
OPENCLAW_DIAGNOSTICS=telegram.http,telegram.payload
```

Notas:

- Los logs por flags van al archivo de log estándar (el mismo que `logging.file`).
- La salida sigue redactándose según `logging.redactSensitive`.
- Guía completa: [/diagnostics/flags](/es/diagnostics/flags).

### Exportar a OpenTelemetry

Los diagnósticos pueden exportarse mediante el plugin `diagnostics-otel` (OTLP/HTTP). Esto
funciona con cualquier collector/backend de OpenTelemetry que acepte OTLP/HTTP.

```json
{
  "plugins": {
    "allow": ["diagnostics-otel"],
    "entries": {
      "diagnostics-otel": {
        "enabled": true
      }
    }
  },
  "diagnostics": {
    "enabled": true,
    "otel": {
      "enabled": true,
      "endpoint": "http://otel-collector:4318",
      "protocol": "http/protobuf",
      "serviceName": "openclaw-gateway",
      "traces": true,
      "metrics": true,
      "logs": true,
      "sampleRate": 0.2,
      "flushIntervalMs": 60000,
      "captureContent": {
        "enabled": false,
        "inputMessages": false,
        "outputMessages": false,
        "toolInputs": false,
        "toolOutputs": false,
        "systemPrompt": false
      }
    }
  }
}
```

Notas:

- También puedes habilitar el plugin con `openclaw plugins enable diagnostics-otel`.
- `protocol` actualmente solo admite `http/protobuf`. `grpc` se ignora.
- Las métricas incluyen uso de tokens, costo, tamaño de contexto, duración de la ejecución y
  contadores/histogramas del flujo de mensajes (Webhooks, colas, estado de sesión, profundidad/espera de cola).
- Las trazas/métricas pueden activarse o desactivarse con `traces` / `metrics` (predeterminado: activado). Las trazas
  incluyen spans de uso del modelo más spans de procesamiento de Webhooks/mensajes cuando están habilitadas.
- El contenido bruto de modelo/herramienta no se exporta por defecto. Usa
  `diagnostics.otel.captureContent` solo cuando tu collector y política de retención
  estén aprobados para texto de prompt, respuesta, herramientas o prompt del sistema.
- Establece `headers` cuando tu collector requiera autenticación.
- Variables de entorno compatibles: `OTEL_EXPORTER_OTLP_ENDPOINT`,
  `OTEL_SERVICE_NAME`, `OTEL_EXPORTER_OTLP_PROTOCOL`.
- Establece `OPENCLAW_OTEL_PRELOADED=1` cuando otra precarga o proceso host ya
  haya registrado el SDK global de OpenTelemetry. En ese modo el plugin no inicia
  ni apaga su propio SDK, pero sigue conectando listeners de diagnóstico de OpenClaw y
  respeta `diagnostics.otel.traces`, `metrics` y `logs`.

### Métricas exportadas (nombres + tipos)

Uso de modelo:

- `openclaw.tokens` (contador, attrs: `openclaw.token`, `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.cost.usd` (contador, attrs: `openclaw.channel`, `openclaw.provider`,
  `openclaw.model`)
- `openclaw.run.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.provider`, `openclaw.model`)
- `openclaw.context.tokens` (histograma, attrs: `openclaw.context`,
  `openclaw.channel`, `openclaw.provider`, `openclaw.model`)

Flujo de mensajes:

- `openclaw.webhook.received` (contador, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.error` (contador, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.webhook.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.webhook`)
- `openclaw.message.queued` (contador, attrs: `openclaw.channel`,
  `openclaw.source`)
- `openclaw.message.processed` (contador, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.duration_ms` (histograma, attrs: `openclaw.channel`,
  `openclaw.outcome`)
- `openclaw.message.delivery.started` (contador, attrs: `openclaw.channel`,
  `openclaw.delivery.kind`)
- `openclaw.message.delivery.duration_ms` (histograma, attrs:
  `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
  `openclaw.errorCategory`)

Colas + sesiones:

- `openclaw.queue.lane.enqueue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.lane.dequeue` (contador, attrs: `openclaw.lane`)
- `openclaw.queue.depth` (histograma, attrs: `openclaw.lane` o
  `openclaw.channel=heartbeat`)
- `openclaw.queue.wait_ms` (histograma, attrs: `openclaw.lane`)
- `openclaw.session.state` (contador, attrs: `openclaw.state`, `openclaw.reason`)
- `openclaw.session.stuck` (contador, attrs: `openclaw.state`)
- `openclaw.session.stuck_age_ms` (histograma, attrs: `openclaw.state`)
- `openclaw.run.attempt` (contador, attrs: `openclaw.attempt`)

Exec:

- `openclaw.exec.duration_ms` (histograma, attrs: `openclaw.exec.target`,
  `openclaw.exec.mode`, `openclaw.outcome`, `openclaw.failureKind`)

### Spans exportados (nombres + atributos clave)

- `openclaw.model.usage`
  - `openclaw.channel`, `openclaw.provider`, `openclaw.model`
  - `openclaw.tokens.*` (input/output/cache_read/cache_write/total)
- `openclaw.run`
  - `openclaw.outcome`, `openclaw.channel`, `openclaw.provider`,
    `openclaw.model`, `openclaw.errorCategory`
- `openclaw.model.call`
  - `gen_ai.system`, `gen_ai.request.model`, `gen_ai.operation.name`,
    `openclaw.provider`, `openclaw.model`, `openclaw.api`,
    `openclaw.transport`
- `openclaw.tool.execution`
  - `gen_ai.tool.name`, `openclaw.toolName`, `openclaw.errorCategory`,
    `openclaw.tool.params.*`
- `openclaw.exec`
  - `openclaw.exec.target`, `openclaw.exec.mode`, `openclaw.outcome`,
    `openclaw.failureKind`, `openclaw.exec.command_length`,
    `openclaw.exec.exit_code`, `openclaw.exec.timed_out`
- `openclaw.webhook.processed`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`
- `openclaw.webhook.error`
  - `openclaw.channel`, `openclaw.webhook`, `openclaw.chatId`,
    `openclaw.error`
- `openclaw.message.processed`
  - `openclaw.channel`, `openclaw.outcome`, `openclaw.chatId`,
    `openclaw.messageId`, `openclaw.reason`
- `openclaw.message.delivery`
  - `openclaw.channel`, `openclaw.delivery.kind`, `openclaw.outcome`,
    `openclaw.errorCategory`, `openclaw.delivery.result_count`
- `openclaw.session.stuck`
  - `openclaw.state`, `openclaw.ageMs`, `openclaw.queueDepth`

Cuando la captura de contenido está habilitada explícitamente, los spans de modelo/herramienta también pueden incluir
atributos `openclaw.content.*` acotados y redactados para las clases de contenido específicas
que hayas activado.

### Muestreo + vaciado

- Muestreo de trazas: `diagnostics.otel.sampleRate` (0.0–1.0, solo spans raíz).
- Intervalo de exportación de métricas: `diagnostics.otel.flushIntervalMs` (mínimo 1000ms).

### Notas sobre el protocolo

- Los endpoints OTLP/HTTP pueden establecerse mediante `diagnostics.otel.endpoint` o
  `OTEL_EXPORTER_OTLP_ENDPOINT`.
- Si el endpoint ya contiene `/v1/traces` o `/v1/metrics`, se usa tal cual.
- Si el endpoint ya contiene `/v1/logs`, se usa tal cual para logs.
- `OPENCLAW_OTEL_PRELOADED=1` reutiliza un SDK OpenTelemetry registrado externamente
  para trazas/métricas en lugar de iniciar un NodeSDK propiedad del plugin.
- `diagnostics.otel.logs` habilita la exportación de logs OTLP para la salida del logger principal.

### Comportamiento de exportación de logs

- Los logs OTLP usan los mismos registros estructurados escritos en `logging.file`.
- Respetan `logging.level` (nivel de log en archivo). La redacción de consola **no** se aplica
  a los logs OTLP.
- Las instalaciones de alto volumen deberían preferir el muestreo/filtrado del collector OTLP.

## Consejos de solución de problemas

- **¿No se puede acceder al Gateway?** Ejecuta primero `openclaw doctor`.
- **¿Los logs están vacíos?** Comprueba que el Gateway esté en ejecución y escribiendo en la ruta de archivo
  de `logging.file`.
- **¿Necesitas más detalle?** Establece `logging.level` en `debug` o `trace` y vuelve a intentarlo.

## Relacionado

- [Internos de Logging del Gateway](/es/gateway/logging) — estilos de log WS, prefijos de subsistema y captura de consola
- [Diagnóstico](/es/gateway/configuration-reference#diagnostics) — exportación de OpenTelemetry y configuración de trazas de caché
