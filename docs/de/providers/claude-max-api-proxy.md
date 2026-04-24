---
read_when:
    - Sie möchten das Claude-Max-Abo mit OpenAI-kompatiblen Tools verwenden.
    - Sie möchten einen lokalen API-Server, der die Claude Code CLI umhüllt.
    - Sie möchten Abo-basierten gegenüber API-key-basiertem Anthropic-Zugriff bewerten.
summary: Community-Proxy, um Claude-Abo-Zugangsdaten als OpenAI-kompatiblen Endpunkt bereitzustellen
title: Claude Max API proxy
x-i18n:
    generated_at: "2026-04-24T06:53:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 06c685c2f42f462a319ef404e4980f769e00654afb9637d873b98144e6a41c87
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

**claude-max-api-proxy** ist ein Community-Tool, das Ihr Claude-Max-/Pro-Abo als OpenAI-kompatiblen API-Endpunkt bereitstellt. Dadurch können Sie Ihr Abo mit jedem Tool verwenden, das das OpenAI-API-Format unterstützt.

<Warning>
Dieser Pfad ist nur technische Kompatibilität. Anthropic hat in der Vergangenheit einige Abo-
Nutzungen außerhalb von Claude Code blockiert. Sie müssen selbst entscheiden, ob Sie
ihn verwenden, und die aktuellen Bedingungen von Anthropic prüfen, bevor Sie sich darauf verlassen.
</Warning>

## Warum das verwenden?

| Ansatz                  | Kosten                                              | Am besten geeignet für                      |
| ----------------------- | --------------------------------------------------- | ------------------------------------------- |
| Anthropic API           | Zahlung pro Token (~$15/M Input, $75/M Output für Opus) | Produktions-Apps, hohes Volumen          |
| Claude-Max-Abo          | $200/Monat pauschal                                 | Persönliche Nutzung, Entwicklung, unbegrenzte Nutzung |

Wenn Sie ein Claude-Max-Abo haben und es mit OpenAI-kompatiblen Tools nutzen möchten, kann dieser Proxy für einige Workflows die Kosten senken. API keys bleiben der klarere Richtlinienpfad für den produktiven Einsatz.

## So funktioniert es

```text
Ihre App → claude-max-api-proxy → Claude Code CLI → Anthropic (über Abo)
   (OpenAI-Format)             (Format wird konvertiert)   (verwendet Ihren Login)
```

Der Proxy:

1. akzeptiert Requests im OpenAI-Format unter `http://localhost:3456/v1/chat/completions`
2. konvertiert sie in Befehle für Claude Code CLI
3. gibt Antworten im OpenAI-Format zurück (Streaming wird unterstützt)

## Erste Schritte

<Steps>
  <Step title="Den Proxy installieren">
    Erfordert Node.js 20+ und Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Prüfen, ob Claude CLI authentifiziert ist
    claude --version
    ```

  </Step>
  <Step title="Den Server starten">
    ```bash
    claude-max-api
    # Der Server läuft unter http://localhost:3456
    ```
  </Step>
  <Step title="Den Proxy testen">
    ```bash
    # Health-Check
    curl http://localhost:3456/health

    # Modelle auflisten
    curl http://localhost:3456/v1/models

    # Chat-Completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="OpenClaw konfigurieren">
    OpenClaw auf den Proxy als benutzerdefinierten OpenAI-kompatiblen Endpunkt zeigen lassen:

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## Eingebauter Katalog

| Modell-ID         | Entspricht       |
| ----------------- | ---------------- |
| `claude-opus-4`   | Claude Opus 4    |
| `claude-sonnet-4` | Claude Sonnet 4  |
| `claude-haiku-4`  | Claude Haiku 4   |

## Erweiterte Konfiguration

<AccordionGroup>
  <Accordion title="Hinweise zum proxyartigen OpenAI-kompatiblen Pfad">
    Dieser Pfad verwendet dieselbe proxyartige OpenAI-kompatible Route wie andere benutzerdefinierte
    `/v1`-Backends:

    - Native, nur für OpenAI gedachte Request-Formung wird nicht angewendet
    - Kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und keine
      OpenAI-Reasoning-kompatible Payload-Formung
    - Versteckte OpenClaw-Zuordnungs-Header (`originator`, `version`, `User-Agent`)
      werden auf der Proxy-URL nicht injiziert

  </Accordion>

  <Accordion title="Automatischer Start unter macOS mit LaunchAgent">
    Erstellen Sie einen LaunchAgent, um den Proxy automatisch auszuführen:

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## Links

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Hinweise

- Dies ist ein **Community-Tool**, das weder offiziell von Anthropic noch von OpenClaw unterstützt wird
- Erfordert ein aktives Claude-Max-/Pro-Abo mit authentifizierter Claude Code CLI
- Der Proxy läuft lokal und sendet keine Daten an Drittserver
- Streaming-Antworten werden vollständig unterstützt

<Note>
Für native Anthropic-Integration mit Claude CLI oder API keys siehe [Anthropic provider](/de/providers/anthropic). Für OpenAI-/Codex-Abos siehe [OpenAI provider](/de/providers/openai).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/de/providers/anthropic" icon="bolt">
    Native OpenClaw-Integration mit Claude CLI oder API keys.
  </Card>
  <Card title="OpenAI provider" href="/de/providers/openai" icon="robot">
    Für OpenAI-/Codex-Abos.
  </Card>
  <Card title="Model selection" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modell-Referenzen und Failover-Verhalten.
  </Card>
  <Card title="Configuration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
