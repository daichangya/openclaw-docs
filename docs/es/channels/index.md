---
read_when:
    - Quieres elegir un canal de chat para OpenClaw
    - Necesitas una vista general rápida de las plataformas de mensajería compatibles
summary: Plataformas de mensajería a las que OpenClaw puede conectarse
title: Canales de chat
x-i18n:
    generated_at: "2026-04-25T13:41:32Z"
    model: gpt-5.4
    provider: openai
    source_hash: e97818dce89ea06a60f2cccd0cc8a78cba48d66ea39e4769f2b583690a4f75d0
    source_path: channels/index.md
    workflow: 15
---

OpenClaw puede hablar contigo en cualquier app de chat que ya uses. Cada canal se conecta a través del Gateway.
El texto es compatible en todas partes; los medios y las reacciones varían según el canal.

## Notas de entrega

- Las respuestas de Telegram que contienen sintaxis markdown de imagen, como `![alt](url)`,
  se convierten en respuestas multimedia en la ruta final de salida cuando es posible.
- Los mensajes directos de Slack entre varias personas se enrutan como chats grupales, por lo que la política de grupos, el comportamiento de menciones
  y las reglas de sesión grupal se aplican a las conversaciones MPIM.
- La configuración de WhatsApp es instalación bajo demanda: el onboarding puede mostrar el flujo de configuración antes de
  que se preparen las dependencias de runtime de Baileys, y el Gateway carga el runtime de WhatsApp
  solo cuando el canal está realmente activo.

## Canales compatibles

- [BlueBubbles](/es/channels/bluebubbles) — **Recomendado para iMessage**; usa la API REST del servidor macOS de BlueBubbles con compatibilidad completa de funciones (Plugin incluido; editar, retirar envío, efectos, reacciones, gestión de grupos — editar está roto actualmente en macOS 26 Tahoe).
- [Discord](/es/channels/discord) — API de bot de Discord + Gateway; compatible con servidores, canales y mensajes directos.
- [Feishu](/es/channels/feishu) — bot de Feishu/Lark mediante WebSocket (Plugin incluido).
- [Google Chat](/es/channels/googlechat) — app de Google Chat API mediante Webhook HTTP.
- [iMessage (legacy)](/es/channels/imessage) — integración heredada de macOS mediante CLI imsg (obsoleta, usa BlueBubbles para configuraciones nuevas).
- [IRC](/es/channels/irc) — servidores IRC clásicos; canales + mensajes directos con controles de emparejamiento/lista permitida.
- [LINE](/es/channels/line) — bot de LINE Messaging API (Plugin incluido).
- [Matrix](/es/channels/matrix) — protocolo Matrix (Plugin incluido).
- [Mattermost](/es/channels/mattermost) — API de bot + WebSocket; canales, grupos, mensajes directos (Plugin incluido).
- [Microsoft Teams](/es/channels/msteams) — Bot Framework; compatibilidad empresarial (Plugin incluido).
- [Nextcloud Talk](/es/channels/nextcloud-talk) — chat autoalojado mediante Nextcloud Talk (Plugin incluido).
- [Nostr](/es/channels/nostr) — mensajes directos descentralizados mediante NIP-04 (Plugin incluido).
- [QQ Bot](/es/channels/qqbot) — API de QQ Bot; chat privado, chat grupal y multimedia enriquecido (Plugin incluido).
- [Signal](/es/channels/signal) — signal-cli; centrado en la privacidad.
- [Slack](/es/channels/slack) — SDK Bolt; apps de espacio de trabajo.
- [Synology Chat](/es/channels/synology-chat) — chat de Synology NAS mediante Webhooks salientes+entrantes (Plugin incluido).
- [Telegram](/es/channels/telegram) — API de bot mediante grammY; compatible con grupos.
- [Tlon](/es/channels/tlon) — mensajero basado en Urbit (Plugin incluido).
- [Twitch](/es/channels/twitch) — chat de Twitch mediante conexión IRC (Plugin incluido).
- [Voice Call](/es/plugins/voice-call) — telefonía mediante Plivo o Twilio (plugin, se instala por separado).
- [WebChat](/es/web/webchat) — interfaz de usuario WebChat del Gateway sobre WebSocket.
- [WeChat](/es/channels/wechat) — plugin Tencent iLink Bot mediante inicio de sesión por QR; solo chats privados (plugin externo).
- [WhatsApp](/es/channels/whatsapp) — el más popular; usa Baileys y requiere emparejamiento por QR.
- [Zalo](/es/channels/zalo) — API de Zalo Bot; el mensajero popular de Vietnam (Plugin incluido).
- [Zalo Personal](/es/channels/zalouser) — cuenta personal de Zalo mediante inicio de sesión por QR (Plugin incluido).

## Notas

- Los canales pueden ejecutarse simultáneamente; configura varios y OpenClaw enrutará por chat.
- La configuración más rápida suele ser **Telegram** (token de bot simple). WhatsApp requiere emparejamiento por QR y
  almacena más estado en disco.
- El comportamiento de grupos varía según el canal; consulta [Grupos](/es/channels/groups).
- El emparejamiento de mensajes directos y las listas permitidas se aplican por seguridad; consulta [Seguridad](/es/gateway/security).
- Solución de problemas: [Solución de problemas de canales](/es/channels/troubleshooting).
- Los proveedores de modelos se documentan por separado; consulta [Proveedores de modelos](/es/providers/models).
