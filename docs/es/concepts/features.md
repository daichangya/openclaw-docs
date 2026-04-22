---
read_when:
    - Quieres una lista completa de todo lo que admite OpenClaw
summary: Capacidades de OpenClaw en todos los canales, enrutamiento, medios y experiencia de usuario.
title: Funciones
x-i18n:
    generated_at: "2026-04-22T04:21:54Z"
    model: gpt-5.4
    provider: openai
    source_hash: 3af9955b65030fe02e35d3056d284271fa9700f3ed094c6f8323eb10e4064e22
    source_path: concepts/features.md
    workflow: 15
---

# Funciones

## Destacados

<Columns>
  <Card title="Canales" icon="message-square" href="/es/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat y más con un solo Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/es/tools/plugin">
    Los plugins incluidos añaden Matrix, Nextcloud Talk, Nostr, Twitch, Zalo y más sin instalaciones separadas en las versiones actuales normales.
  </Card>
  <Card title="Enrutamiento" icon="route" href="/es/concepts/multi-agent">
    Enrutamiento multiagente con sesiones aisladas.
  </Card>
  <Card title="Medios" icon="image" href="/es/nodes/images">
    Imágenes, audio, video, documentos y generación de imágenes/video.
  </Card>
  <Card title="Apps e interfaz" icon="monitor" href="/web/control-ui">
    Interfaz web de Control UI y app complementaria para macOS.
  </Card>
  <Card title="Nodos móviles" icon="smartphone" href="/es/nodes">
    Nodos de iOS y Android con emparejamiento, voz/chat y comandos enriquecidos del dispositivo.
  </Card>
</Columns>

## Lista completa

**Canales:**

- Los canales integrados incluyen Discord, Google Chat, iMessage (heredado), IRC, Signal, Slack, Telegram, WebChat y WhatsApp
- Los canales de plugins incluidos abarcan BlueBubbles para iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo y Zalo Personal
- Los plugins de canal opcionales instalados por separado incluyen Voice Call y paquetes de terceros como WeChat
- Los plugins de canal de terceros pueden ampliar aún más el Gateway, como WeChat
- Compatibilidad con chat grupal con activación basada en menciones
- Seguridad en DM con allowlists y emparejamiento

**Agente:**

- Runtime de agente integrado con transmisión de herramientas
- Enrutamiento multiagente con sesiones aisladas por espacio de trabajo o remitente
- Sesiones: los chats directos se consolidan en `main`; los grupos están aislados
- Streaming y fragmentación para respuestas largas

**Autenticación y proveedores:**

- Más de 35 proveedores de modelos (Anthropic, OpenAI, Google y más)
- Autenticación por suscripción mediante OAuth (por ejemplo, OpenAI Codex)
- Compatibilidad con proveedores personalizados y autoalojados (vLLM, SGLang, Ollama y cualquier endpoint compatible con OpenAI o Anthropic)

**Medios:**

- Imágenes, audio, video y documentos de entrada y salida
- Superficies de capacidad compartida para generación de imágenes y video
- Transcripción de notas de voz
- Texto a voz con múltiples proveedores

**Apps e interfaces:**

- WebChat e interfaz de navegador Control UI
- App complementaria de barra de menús para macOS
- Nodo de iOS con emparejamiento, Canvas, cámara, grabación de pantalla, ubicación y voz
- Nodo de Android con emparejamiento, chat, voz, Canvas, cámara y comandos del dispositivo

**Herramientas y automatización:**

- Automatización del navegador, exec, sandboxing
- Búsqueda web (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Trabajos Cron y programación de Heartbeat
- Skills, plugins y flujos de trabajo (Lobster)
