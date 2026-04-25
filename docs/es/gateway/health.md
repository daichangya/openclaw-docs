---
read_when:
    - Diagnosticar la conectividad de canales o el estado del gateway
    - Comprender los comandos y opciones de la CLI de comprobación de estado
summary: Comandos de comprobación de estado y supervisión del estado del gateway
title: Comprobaciones de estado
x-i18n:
    generated_at: "2026-04-25T13:46:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d00e842dc0d67d71ac6e6547ebb7e3cd2b476562a7cde0f81624c6e20d67683
    source_path: gateway/health.md
    workflow: 15
---

Guía breve para verificar la conectividad de canales sin hacer suposiciones.

## Comprobaciones rápidas

- `openclaw status` — resumen local: accesibilidad/modo del gateway, sugerencia de actualización, antigüedad de autenticación de canales vinculados, sesiones y actividad reciente.
- `openclaw status --all` — diagnóstico local completo (solo lectura, con color, seguro para pegar al depurar).
- `openclaw status --deep` — solicita al gateway en ejecución un sondeo de estado en vivo (`health` con `probe:true`), incluidos sondeos por cuenta de canal cuando son compatibles.
- `openclaw health` — solicita al gateway en ejecución su instantánea de estado (solo WS; sin sockets directos de canal desde la CLI).
- `openclaw health --verbose` — fuerza un sondeo de estado en vivo e imprime detalles de conexión del gateway.
- `openclaw health --json` — salida de instantánea de estado legible por máquinas.
- Envía `/status` como mensaje independiente en WhatsApp/WebChat para obtener una respuesta de estado sin invocar al agente.
- Registros: sigue `/tmp/openclaw/openclaw-*.log` y filtra por `web-heartbeat`, `web-reconnect`, `web-auto-reply`, `web-inbound`.

## Diagnósticos avanzados

- Credenciales en disco: `ls -l ~/.openclaw/credentials/whatsapp/<accountId>/creds.json` (la hora de modificación debería ser reciente).
- Almacén de sesiones: `ls -l ~/.openclaw/agents/<agentId>/sessions/sessions.json` (la ruta puede anularse en la configuración). El recuento y los destinatarios recientes se muestran mediante `status`.
- Flujo de revinculación: `openclaw channels logout && openclaw channels login --verbose` cuando aparezcan códigos de estado 409–515 o `loggedOut` en los registros. (Nota: el flujo de inicio de sesión por QR se reinicia automáticamente una vez para el estado 515 después del emparejamiento).
- Los diagnósticos están habilitados de forma predeterminada. El gateway registra hechos operativos a menos que se configure `diagnostics.enabled: false`. Los eventos de memoria registran recuentos de bytes de RSS/heap, presión de umbral y presión de crecimiento. Los eventos de carga útil sobredimensionada registran qué se rechazó, truncó o fragmentó, además de tamaños y límites cuando están disponibles. No registran el texto del mensaje, el contenido de archivos adjuntos, el cuerpo del Webhook, el cuerpo sin procesar de solicitudes o respuestas, tokens, cookies ni valores secretos. El mismo Heartbeat inicia el registrador acotado de estabilidad, disponible mediante `openclaw gateway stability` o el RPC del Gateway `diagnostics.stability`. Las salidas fatales del Gateway, los tiempos de espera de apagado y los errores de inicio durante reinicios conservan la instantánea más reciente del registrador en `~/.openclaw/logs/stability/` cuando existen eventos; inspecciona el paquete guardado más reciente con `openclaw gateway stability --bundle latest`.
- Para informes de errores, ejecuta `openclaw gateway diagnostics export` y adjunta el zip generado. La exportación combina un resumen en Markdown, el paquete de estabilidad más reciente, metadatos de registros saneados, instantáneas saneadas de estado/salud del Gateway y la forma de la configuración. Está pensada para compartirse: el texto del chat, los cuerpos de Webhook, las salidas de herramientas, las credenciales, las cookies, los identificadores de cuenta/mensaje y los valores secretos se omiten o se redactan. Consulta [Exportación de diagnósticos](/es/gateway/diagnostics).

## Configuración del monitor de estado

- `gateway.channelHealthCheckMinutes`: con qué frecuencia el gateway comprueba el estado del canal. Predeterminado: `5`. Configura `0` para desactivar globalmente los reinicios del monitor de estado.
- `gateway.channelStaleEventThresholdMinutes`: cuánto tiempo puede permanecer inactivo un canal conectado antes de que el monitor de estado lo considere obsoleto y lo reinicie. Predeterminado: `30`. Mantén este valor mayor o igual que `gateway.channelHealthCheckMinutes`.
- `gateway.channelMaxRestartsPerHour`: límite móvil de una hora para reinicios del monitor de estado por canal/cuenta. Predeterminado: `10`.
- `channels.<provider>.healthMonitor.enabled`: desactiva los reinicios del monitor de estado para un canal específico mientras mantienes habilitada la supervisión global.
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: anulación para varias cuentas que prevalece sobre la configuración a nivel de canal.
- Estas anulaciones por canal se aplican a los monitores de canal integrados que las exponen actualmente: Discord, Google Chat, iMessage, Microsoft Teams, Signal, Slack, Telegram y WhatsApp.

## Cuando algo falla

- `logged out` o estado 409–515 → vuelve a vincular con `openclaw channels logout` y luego `openclaw channels login`.
- Gateway inaccesible → inícialo: `openclaw gateway --port 18789` (usa `--force` si el puerto está ocupado).
- No hay mensajes entrantes → confirma que el teléfono vinculado está en línea y que el remitente está permitido (`channels.whatsapp.allowFrom`); para chats de grupo, asegúrate de que la lista de permitidos y las reglas de menciones coincidan (`channels.whatsapp.groups`, `agents.list[].groupChat.mentionPatterns`).

## Comando dedicado `health`

`openclaw health` solicita al gateway en ejecución su instantánea de estado (sin sockets directos de canal desde la CLI). De forma predeterminada puede devolver una instantánea reciente en caché del gateway; luego el gateway actualiza esa caché en segundo plano. `openclaw health --verbose` fuerza un sondeo en vivo. El comando informa de la antigüedad de credenciales/autenticación vinculadas cuando está disponible, resúmenes de sondeos por canal, resumen del almacén de sesiones y duración del sondeo. Termina con un código distinto de cero si el gateway es inaccesible o si el sondeo falla/supera el tiempo de espera.

Opciones:

- `--json`: salida JSON legible por máquinas
- `--timeout <ms>`: anula el tiempo de espera predeterminado del sondeo de 10 s
- `--verbose`: fuerza un sondeo en vivo e imprime detalles de conexión del gateway
- `--debug`: alias de `--verbose`

La instantánea de estado incluye: `ok` (booleano), `ts` (marca de tiempo), `durationMs` (tiempo del sondeo), estado por canal, disponibilidad del agente y resumen del almacén de sesiones.

## Relacionado

- [Guía operativa del Gateway](/es/gateway)
- [Exportación de diagnósticos](/es/gateway/diagnostics)
- [Solución de problemas del Gateway](/es/gateway/troubleshooting)
