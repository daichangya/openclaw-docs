---
read_when:
    - Sie möchten eine vollständige Liste dessen, was OpenClaw unterstützt
summary: OpenClaw-Funktionen über Kanäle, Routing, Medien und UX hinweg.
title: Funktionen
x-i18n:
    generated_at: "2026-04-05T12:39:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 43eae89d9af44ea786dd0221d8d602ebcea15da9d5064396ac9920c0345e2ad3
    source_path: concepts/features.md
    workflow: 15
---

# Funktionen

## Highlights

<Columns>
  <Card title="Kanäle" icon="message-square">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat und mehr mit einem einzigen Gateway.
  </Card>
  <Card title="Plugins" icon="plug">
    Gebündelte Plugins fügen Matrix, Nextcloud Talk, Nostr, Twitch, Zalo und mehr ohne separate Installationen in normalen aktuellen Releases hinzu.
  </Card>
  <Card title="Routing" icon="route">
    Multi-Agent-Routing mit isolierten Sitzungen.
  </Card>
  <Card title="Medien" icon="image">
    Bilder, Audio, Video, Dokumente sowie Bild-/Videogenerierung.
  </Card>
  <Card title="Apps und UI" icon="monitor">
    Web-Control-UI und macOS-Begleit-App.
  </Card>
  <Card title="Mobile Nodes" icon="smartphone">
    iOS- und Android-Nodes mit Pairing, Sprache/Chat und umfangreichen Gerätebefehlen.
  </Card>
</Columns>

## Vollständige Liste

**Kanäle:**

- Integrierte Kanäle umfassen Discord, Google Chat, iMessage (veraltet), IRC, Signal, Slack, Telegram, WebChat und WhatsApp
- Gebündelte Plugin-Kanäle umfassen BlueBubbles für iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo und Zalo Personal
- Optionale separat installierte Kanal-Plugins umfassen Voice Call und Drittanbieter-Pakete wie WeChat
- Drittanbieter-Kanal-Plugins können das Gateway weiter erweitern, zum Beispiel WeChat
- Unterstützung für Gruppenchats mit Mention-basierter Aktivierung
- DM-Sicherheit mit Allowlists und Pairing

**Agent:**

- Eingebettete Agent-Runtime mit Tool-Streaming
- Multi-Agent-Routing mit isolierten Sitzungen pro Workspace oder Absender
- Sitzungen: Direktchats werden in gemeinsam genutztem `main` zusammengeführt; Gruppen sind isoliert
- Streaming und Chunking für lange Antworten

**Authentifizierung und Provider:**

- 35+ Modell-Provider (Anthropic, OpenAI, Google und mehr)
- Subscription-Authentifizierung über OAuth (z. B. OpenAI Codex)
- Unterstützung für benutzerdefinierte und selbstgehostete Provider (vLLM, SGLang, Ollama und jeder OpenAI-kompatible oder Anthropic-kompatible Endpunkt)

**Medien:**

- Bilder, Audio, Video und Dokumente ein- und ausgehend
- Gemeinsame Funktionsoberflächen für Bildgenerierung und Videogenerierung
- Transkription von Sprachnachrichten
- Text-to-Speech mit mehreren Providern

**Apps und Oberflächen:**

- WebChat und browserbasierte Control UI
- macOS-Menüleisten-Begleit-App
- iOS-Node mit Pairing, Canvas, Kamera, Bildschirmaufnahme, Standort und Sprache
- Android-Node mit Pairing, Chat, Sprache, Canvas, Kamera und Gerätebefehlen

**Tools und Automatisierung:**

- Browser-Automatisierung, exec, Sandboxing
- Websuche (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-Jobs und Heartbeat-Zeitplanung
- Skills, Plugins und Workflow-Pipelines (Lobster)
