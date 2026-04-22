---
read_when:
    - El transporte del canal indica conectado, pero las respuestas fallan
    - Necesitas comprobaciones específicas del canal antes de revisar la documentación detallada del proveedor
summary: Solución rápida de problemas a nivel de canal con firmas de fallo y correcciones por canal
title: Solución de problemas de canales
x-i18n:
    generated_at: "2026-04-22T04:20:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8c57934b52086ea5f41565c5aae77ef6fa772cf7d56a6427655a844a5c63d1c6
    source_path: channels/troubleshooting.md
    workflow: 15
---

# Solución de problemas de canales

Usa esta página cuando un canal se conecta pero el comportamiento es incorrecto.

## Escalera de comandos

Ejecuta primero estos comandos en este orden:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

Línea base saludable:

- `Runtime: running`
- `Connectivity probe: ok`
- `Capability: read-only`, `write-capable`, o `admin-capable`
- La sonda del canal muestra el transporte conectado y, cuando es compatible, `works` o `audit ok`

## WhatsApp

### Firmas de fallo de WhatsApp

| Síntoma                         | Comprobación más rápida                               | Corrección                                              |
| ------------------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| Conectado pero sin respuestas en DM | `openclaw pairing list whatsapp`                    | Aprueba el remitente o cambia la política/lista de permitidos de DM. |
| Los mensajes grupales se ignoran | Revisa `requireMention` + patrones de mención en la configuración | Menciona al bot o relaja la política de menciones para ese grupo. |
| Desconexiones aleatorias/bucles de reinicio de sesión | `openclaw channels status --probe` + registros           | Vuelve a iniciar sesión y verifica que el directorio de credenciales esté en buen estado. |

Solución completa: [Solución de problemas de WhatsApp](/es/channels/whatsapp#troubleshooting)

## Telegram

### Firmas de fallo de Telegram

| Síntoma                             | Comprobación más rápida                            | Corrección                                                                                                                 |
| ----------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `/start` pero sin un flujo de respuesta utilizable | `openclaw pairing list telegram`                 | Aprueba el emparejamiento o cambia la política de DM.                                                                     |
| Bot en línea pero el grupo sigue en silencio | Verifica el requisito de mención y el modo de privacidad del bot | Desactiva el modo de privacidad para la visibilidad en grupos o menciona al bot.                                          |
| Fallos de envío con errores de red  | Inspecciona los registros en busca de fallos en llamadas a la API de Telegram | Corrige el enrutamiento de DNS/IPv6/proxy hacia `api.telegram.org`.                                                       |
| El polling se detiene o se reconecta lentamente | `openclaw logs --follow` para diagnósticos de polling | Actualiza; si los reinicios son falsos positivos, ajusta `pollingStallThresholdMs`. Si los bloqueos persisten, siguen apuntando a proxy/DNS/IPv6. |
| `setMyCommands` rechazado al inicio | Inspecciona los registros para `BOT_COMMANDS_TOO_MUCH` | Reduce los comandos personalizados/de Plugin/Skills de Telegram o desactiva los menús nativos.                           |
| Actualizaste y la allowlist te bloquea | `openclaw security audit` y las allowlists de configuración | Ejecuta `openclaw doctor --fix` o reemplaza `@username` por IDs numéricos de remitente.                                   |

Solución completa: [Solución de problemas de Telegram](/es/channels/telegram#troubleshooting)

## Discord

### Firmas de fallo de Discord

| Síntoma                         | Comprobación más rápida              | Corrección                                                |
| ------------------------------- | ------------------------------------ | --------------------------------------------------------- |
| Bot en línea pero sin respuestas en el guild | `openclaw channels status --probe`  | Permite el guild/canal y verifica el intent de contenido de mensajes. |
| Los mensajes grupales se ignoran | Revisa los registros para descartes por restricción de menciones | Menciona al bot o configura `requireMention: false` para el guild/canal. |
| Faltan respuestas en DM         | `openclaw pairing list discord`      | Aprueba el emparejamiento de DM o ajusta la política de DM. |

Solución completa: [Solución de problemas de Discord](/es/channels/discord#troubleshooting)

## Slack

### Firmas de fallo de Slack

| Síntoma                                | Comprobación más rápida                      | Corrección                                                                                                                                             |
| -------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Socket mode conectado pero sin respuestas | `openclaw channels status --probe`        | Verifica el token de app + el token del bot y los scopes requeridos; observa `botTokenStatus` / `appTokenStatus = configured_unavailable` en configuraciones respaldadas por SecretRef. |
| DMs bloqueados                         | `openclaw pairing list slack`               | Aprueba el emparejamiento o relaja la política de DM.                                                                                                 |
| Mensaje de canal ignorado              | Revisa `groupPolicy` y la allowlist del canal | Permite el canal o cambia la política a `open`.                                                                                                       |

Solución completa: [Solución de problemas de Slack](/es/channels/slack#troubleshooting)

## iMessage y BlueBubbles

### Firmas de fallo de iMessage y BlueBubbles

| Síntoma                          | Comprobación más rápida                                                   | Corrección                                            |
| -------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------- |
| No hay eventos entrantes         | Verifica la accesibilidad del Webhook/servidor y los permisos de la app   | Corrige la URL del Webhook o el estado del servidor BlueBubbles. |
| Puede enviar pero no recibir en macOS | Revisa los permisos de privacidad de macOS para la automatización de Mensajes | Vuelve a conceder permisos de TCC y reinicia el proceso del canal. |
| Remitente de DM bloqueado        | `openclaw pairing list imessage` o `openclaw pairing list bluebubbles`    | Aprueba el emparejamiento o actualiza la allowlist.   |

Solución completa:

- [Solución de problemas de iMessage](/es/channels/imessage#troubleshooting)
- [Solución de problemas de BlueBubbles](/es/channels/bluebubbles#troubleshooting)

## Signal

### Firmas de fallo de Signal

| Síntoma                         | Comprobación más rápida                      | Corrección                                                     |
| ------------------------------- | -------------------------------------------- | -------------------------------------------------------------- |
| Daemon accesible pero el bot en silencio | `openclaw channels status --probe`         | Verifica la URL/cuenta del daemon `signal-cli` y el modo de recepción. |
| DM bloqueado                    | `openclaw pairing list signal`               | Aprueba el remitente o ajusta la política de DM.               |
| Las respuestas de grupo no se activan | Revisa la allowlist del grupo y los patrones de mención | Agrega el remitente/grupo o flexibiliza la restricción.        |

Solución completa: [Solución de problemas de Signal](/es/channels/signal#troubleshooting)

## QQ Bot

### Firmas de fallo de QQ Bot

| Síntoma                         | Comprobación más rápida                       | Corrección                                                      |
| ------------------------------- | --------------------------------------------- | --------------------------------------------------------------- |
| El bot responde "gone to Mars"  | Verifica `appId` y `clientSecret` en la configuración | Configura las credenciales o reinicia el Gateway.               |
| No hay mensajes entrantes       | `openclaw channels status --probe`            | Verifica las credenciales en la plataforma abierta de QQ.       |
| La voz no se transcribe         | Revisa la configuración del proveedor de STT  | Configura `channels.qqbot.stt` o `tools.media.audio`.           |
| Los mensajes proactivos no llegan | Revisa los requisitos de interacción de la plataforma QQ | QQ puede bloquear mensajes iniciados por el bot sin interacción reciente. |

Solución completa: [Solución de problemas de QQ Bot](/es/channels/qqbot#troubleshooting)

## Matrix

### Firmas de fallo de Matrix

| Síntoma                             | Comprobación más rápida                  | Corrección                                                                |
| ----------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------- |
| Sesión iniciada pero ignora mensajes de sala | `openclaw channels status --probe`     | Revisa `groupPolicy`, la allowlist de salas y la restricción por menciones. |
| Los DMs no se procesan              | `openclaw pairing list matrix`           | Aprueba el remitente o ajusta la política de DM.                          |
| Las salas cifradas fallan           | `openclaw matrix verify status`          | Vuelve a verificar el dispositivo y luego revisa `openclaw matrix verify backup status`. |
| La restauración de respaldo está pendiente/rota | `openclaw matrix verify backup status` | Ejecuta `openclaw matrix verify backup restore` o vuelve a ejecutarlo con una clave de recuperación. |
| La firma cruzada/bootstrap parece incorrecta | `openclaw matrix verify bootstrap`     | Repara el almacenamiento de secretos, la firma cruzada y el estado del respaldo en una sola pasada. |

Configuración e instalación completas: [Matrix](/es/channels/matrix)
