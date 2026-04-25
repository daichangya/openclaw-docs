---
read_when:
    - Depurar o configurar el acceso a WebChat
summary: Host estático de WebChat en loopback y uso de WS del Gateway para la IU de chat
title: WebChat
x-i18n:
    generated_at: "2026-04-25T14:00:09Z"
    model: gpt-5.4
    provider: openai
    source_hash: c112aca6c6fb29c5752fe931dcd47749acf0b8d8d505522f75b82533fc3ffb5a
    source_path: web/webchat.md
    workflow: 15
---

Estado: la IU de chat SwiftUI de macOS/iOS se comunica directamente con el WebSocket del Gateway.

## Qué es

- Una IU de chat nativa para el gateway (sin navegador embebido ni servidor estático local).
- Usa las mismas sesiones y reglas de enrutamiento que otros canales.
- Enrutamiento determinista: las respuestas siempre vuelven a WebChat.

## Inicio rápido

1. Inicia el gateway.
2. Abre la IU de WebChat (app de macOS/iOS) o la pestaña de chat de Control UI.
3. Asegúrate de que haya configurada una ruta válida de autenticación del gateway (secreto compartido por defecto, incluso en loopback).

## Cómo funciona (comportamiento)

- La IU se conecta al WebSocket del Gateway y usa `chat.history`, `chat.send` y `chat.inject`.
- `chat.history` está acotado para la estabilidad: Gateway puede truncar campos de texto largos, omitir metadatos pesados y reemplazar entradas sobredimensionadas con `[chat.history omitted: message too large]`.
- `chat.history` también está normalizado para visualización: el contexto de OpenClaw solo de runtime, los envoltorios de sobres de entrada, las etiquetas directivas de entrega en línea como `[[reply_to_*]]` y `[[audio_as_voice]]`, las cargas útiles XML de llamadas a herramientas en texto plano (incluidas `<tool_call>...</tool_call>`, `<function_call>...</function_call>`, `<tool_calls>...</tool_calls>`, `<function_calls>...</function_calls>` y bloques truncados de llamadas a herramientas), y los tokens de control del modelo filtrados en ASCII/ancho completo se eliminan del texto visible, y las entradas del asistente cuyo texto visible completo es solo el token silencioso exacto `NO_REPLY` / `no_reply` se omiten.
- `chat.inject` añade una nota del asistente directamente a la transcripción y la difunde a la IU (sin ejecución del agente).
- Las ejecuciones abortadas pueden mantener visible en la IU la salida parcial del asistente.
- Gateway persiste en el historial de la transcripción el texto parcial abortado del asistente cuando existe salida en búfer, y marca esas entradas con metadatos de aborto.
- El historial siempre se obtiene desde el gateway (sin observación de archivos local).
- Si no se puede acceder al gateway, WebChat es de solo lectura.

## Panel de herramientas de agentes de Control UI

- El panel Tools de `/agents` en Control UI tiene dos vistas separadas:
  - **Available Right Now** usa `tools.effective(sessionKey=...)` y muestra lo que la sesión actual realmente puede usar en runtime, incluidas herramientas core, de Plugin y propiedad del canal.
  - **Tool Configuration** usa `tools.catalog` y sigue centrado en perfiles, sobrescrituras y semántica del catálogo.
- La disponibilidad en runtime tiene alcance de sesión. Cambiar de sesión en el mismo agente puede cambiar la lista de **Available Right Now**.
- El editor de configuración no implica disponibilidad en runtime; el acceso efectivo sigue la precedencia de políticas (`allow`/`deny`, sobrescrituras por agente y por proveedor/canal).

## Uso remoto

- El modo remoto tuneliza el WebSocket del gateway sobre SSH/Tailscale.
- No necesitas ejecutar un servidor WebChat separado.

## Referencia de configuración (WebChat)

Configuración completa: [Configuración](/es/gateway/configuration)

Opciones de WebChat:

- `gateway.webchat.chatHistoryMaxChars`: recuento máximo de caracteres para campos de texto en respuestas de `chat.history`. Cuando una entrada de la transcripción supera este límite, Gateway trunca campos de texto largos y puede reemplazar mensajes sobredimensionados con un marcador de posición. El cliente también puede enviar `maxChars` por solicitud para sobrescribir este valor predeterminado en una sola llamada a `chat.history`.

Opciones globales relacionadas:

- `gateway.port`, `gateway.bind`: host/puerto del WebSocket.
- `gateway.auth.mode`, `gateway.auth.token`, `gateway.auth.password`:
  autenticación de WebSocket con secreto compartido.
- `gateway.auth.allowTailscale`: la pestaña de chat de Control UI del navegador puede usar encabezados de identidad de Tailscale Serve cuando está habilitado.
- `gateway.auth.mode: "trusted-proxy"`: autenticación de proxy inverso para clientes del navegador detrás de una fuente de proxy **sin loopback** con reconocimiento de identidad (consulta [Autenticación de Trusted Proxy](/es/gateway/trusted-proxy-auth)).
- `gateway.remote.url`, `gateway.remote.token`, `gateway.remote.password`: destino remoto del gateway.
- `session.*`: almacenamiento de sesiones y valores predeterminados de clave principal.

## Relacionado

- [Control UI](/es/web/control-ui)
- [Panel](/es/web/dashboard)
