---
read_when:
    - Sie möchten eine vollständige Liste dessen, was OpenClaw unterstützt
summary: OpenClaw-Fähigkeiten über Kanäle, Routing, Medien und UX hinweg.
title: Funktionen
x-i18n:
    generated_at: "2026-04-24T06:34:12Z"
    model: gpt-5.4
    provider: openai
    source_hash: b188d786b06e1a51d42130242e8bef6290a728783f24b2fbce513bf4d6c9ec23
    source_path: concepts/features.md
    workflow: 15
---

## Highlights

<Columns>
  <Card title="Kanäle" icon="message-square" href="/de/channels">
    Discord, iMessage, Signal, Slack, Telegram, WhatsApp, WebChat und mehr mit einem einzigen Gateway.
  </Card>
  <Card title="Plugins" icon="plug" href="/de/tools/plugin">
    Gebündelte Plugins fügen Matrix, Nextcloud Talk, Nostr, Twitch, Zalo und mehr hinzu, ohne separate Installationen in normalen aktuellen Releases.
  </Card>
  <Card title="Routing" icon="route" href="/de/concepts/multi-agent">
    Multi-Agent-Routing mit isolierten Sitzungen.
  </Card>
  <Card title="Medien" icon="image" href="/de/nodes/images">
    Bilder, Audio, Video, Dokumente sowie Bild-/Videogenerierung.
  </Card>
  <Card title="Apps und UI" icon="monitor" href="/de/web/control-ui">
    Web Control UI und macOS-Begleit-App.
  </Card>
  <Card title="Mobile Nodes" icon="smartphone" href="/de/nodes">
    iOS- und Android-Nodes mit Pairing, Sprache/Chat und umfangreichen Gerätebefehlen.
  </Card>
</Columns>

## Vollständige Liste

**Kanäle:**

- Zu den integrierten Kanälen gehören Discord, Google Chat, iMessage (Legacy), IRC, Signal, Slack, Telegram, WebChat und WhatsApp
- Zu den gebündelten Plugin-Kanälen gehören BlueBubbles für iMessage, Feishu, LINE, Matrix, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Tlon, Twitch, Zalo und Zalo Personal
- Optional separat installierte Kanal-Plugins umfassen Voice Call und Drittanbieter-Pakete wie WeChat
- Drittanbieter-Kanal-Plugins können das Gateway weiter erweitern, etwa mit WeChat
- Unterstützung für Gruppenchats mit erwähnungsbasierter Aktivierung
- DM-Sicherheit mit Allowlists und Pairing

**Agent:**

- Eingebettete Agentenlaufzeit mit Tool-Streaming
- Multi-Agent-Routing mit isolierten Sitzungen pro Workspace oder Absender
- Sitzungen: Direktchats werden im gemeinsamen `main` zusammengeführt; Gruppen sind isoliert
- Streaming und Chunking für lange Antworten

**Auth und Provider:**

- Über 35 Modell-Provider (Anthropic, OpenAI, Google und mehr)
- Abo-Authentifizierung über OAuth (z. B. OpenAI Codex)
- Unterstützung für benutzerdefinierte und selbst gehostete Provider (vLLM, SGLang, Ollama und jeder mit OpenAI oder Anthropic kompatible Endpunkt)

**Medien:**

- Bilder, Audio, Video und Dokumente hinein und hinaus
- Gemeinsame Fähigkeitsoberflächen für Bild- und Videogenerierung
- Transkription von Sprachnotizen
- Text-to-Speech mit mehreren Providern

**Apps und Oberflächen:**

- WebChat und browserbasierte Control UI
- macOS-Menüleisten-Begleit-App
- iOS-Node mit Pairing, Canvas, Kamera, Bildschirmaufnahme, Standort und Sprache
- Android-Node mit Pairing, Chat, Sprache, Canvas, Kamera und Gerätebefehlen

**Tools und Automatisierung:**

- Browser-Automatisierung, Exec, Sandboxing
- Websuche (Brave, DuckDuckGo, Exa, Firecrawl, Gemini, Grok, Kimi, MiniMax Search, Ollama Web Search, Perplexity, SearXNG, Tavily)
- Cron-Jobs und Heartbeat-Planung
- Skills, Plugins und Workflow-Pipelines (Lobster)

## Verwandt

- [Experimentelle Funktionen](/de/concepts/experimental-features)
- [Agentenlaufzeit](/de/concepts/agent)
