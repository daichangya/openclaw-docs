---
read_when:
    - Sie möchten das Claude-Max-Abonnement mit OpenAI-kompatiblen Tools verwenden
    - Sie möchten einen lokalen API-Server, der Claude Code CLI kapselt
    - Sie möchten abonnementbasierte im Vergleich zu API-schlüsselbasierter Anthropic-Nutzung bewerten
summary: Community-Proxy, um Claude-Abonnement-Anmeldedaten als OpenAI-kompatiblen Endpunkt verfügbar zu machen
title: Claude Max API Proxy
x-i18n:
    generated_at: "2026-04-12T23:30:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 534bc3d189e68529fb090258eb0d6db6d367eb7e027ad04b1f0be55f6aa7d889
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy** ist ein Community-Tool, das Ihr Claude Max/Pro-Abonnement als OpenAI-kompatiblen API-Endpunkt verfügbar macht. Dadurch können Sie Ihr Abonnement mit jedem Tool verwenden, das das OpenAI-API-Format unterstützt.

<Warning>
Dieser Pfad dient nur der technischen Kompatibilität. Anthropic hat in der Vergangenheit manche Abonnement-
Nutzung außerhalb von Claude Code blockiert. Sie müssen selbst entscheiden, ob Sie
ihn verwenden möchten, und Anthropics aktuelle Bedingungen prüfen, bevor Sie sich darauf verlassen.
</Warning>

## Warum das verwenden?

| Ansatz                  | Kosten                                              | Am besten geeignet für                     |
| ----------------------- | --------------------------------------------------- | ------------------------------------------ |
| Anthropic API           | Bezahlung pro Token (~$15/M Eingabe, $75/M Ausgabe für Opus) | Produktionsanwendungen, hohes Volumen      |
| Claude Max-Abonnement   | 200 $/Monat pauschal                                | Persönliche Nutzung, Entwicklung, unbegrenzte Nutzung |

Wenn Sie ein Claude-Max-Abonnement haben und es mit OpenAI-kompatiblen Tools verwenden möchten, kann dieser Proxy die Kosten für manche Workflows senken. API keys bleiben der klarere Richtlinienpfad für die Produktionsnutzung.

## So funktioniert es

```
Your App → claude-max-api-proxy → Claude Code CLI → Anthropic (via subscription)
     (OpenAI format)              (converts format)      (uses your login)
```

Der Proxy:

1. akzeptiert Anfragen im OpenAI-Format unter `http://localhost:3456/v1/chat/completions`
2. konvertiert sie in Claude-Code-CLI-Befehle
3. gibt Antworten im OpenAI-Format zurück (Streaming unterstützt)

## Erste Schritte

<Steps>
  <Step title="Install the proxy">
    Erfordert Node.js 20+ und Claude Code CLI.

    ```bash
    npm install -g claude-max-api-proxy

    # Verify Claude CLI is authenticated
    claude --version
    ```

  </Step>
  <Step title="Start the server">
    ```bash
    claude-max-api
    # Server runs at http://localhost:3456
    ```
  </Step>
  <Step title="Test the proxy">
    ```bash
    # Health check
    curl http://localhost:3456/health

    # List models
    curl http://localhost:3456/v1/models

    # Chat completion
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="Configure OpenClaw">
    Richten Sie OpenClaw so ein, dass es den Proxy als benutzerdefinierten OpenAI-kompatiblen Endpunkt verwendet:

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

## Verfügbare Modelle

| Modell-ID         | Entspricht      |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## Erweitert

<AccordionGroup>
  <Accordion title="Hinweise zum Proxy-Stil für OpenAI-Kompatibilität">
    Dieser Pfad verwendet denselben Proxy-Stil für OpenAI-kompatible Routen wie andere benutzerdefinierte
    `/v1`-Backends:

    - Native nur-OpenAI-Anfrageformung wird nicht angewendet
    - Kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und keine
      OpenAI-Reasoning-kompatible Payload-Formung
    - Verborgene OpenClaw-Attribution-Header (`originator`, `version`, `User-Agent`)
      werden nicht in die Proxy-URL eingefügt

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

- Dies ist ein **Community-Tool**, das nicht offiziell von Anthropic oder OpenClaw unterstützt wird
- Erfordert ein aktives Claude-Max/Pro-Abonnement mit authentifizierter Claude Code CLI
- Der Proxy läuft lokal und sendet keine Daten an Drittanbieter-Server
- Streaming-Antworten werden vollständig unterstützt

<Note>
Für die native Anthropic-Integration mit Claude CLI oder API keys siehe [Anthropic provider](/de/providers/anthropic). Für OpenAI/Codex-Abonnements siehe [OpenAI provider](/de/providers/openai).
</Note>

## Verwandt

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/de/providers/anthropic" icon="bolt">
    Native OpenClaw-Integration mit Claude CLI oder API keys.
  </Card>
  <Card title="OpenAI provider" href="/de/providers/openai" icon="robot">
    Für OpenAI/Codex-Abonnements.
  </Card>
  <Card title="Model providers" href="/de/concepts/model-providers" icon="layers">
    Überblick über alle Provider, Modell-Referenzen und Failover-Verhalten.
  </Card>
  <Card title="Configuration" href="/de/gateway/configuration" icon="gear">
    Vollständige Konfigurationsreferenz.
  </Card>
</CardGroup>
