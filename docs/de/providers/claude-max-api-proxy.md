---
read_when:
    - Sie möchten ein Claude-Max-Abonnement mit OpenAI-kompatiblen Tools verwenden
    - Sie möchten einen lokalen API-Server, der die Claude Code CLI kapselt
    - Sie möchten abonnementsbasierten gegenüber API-key-basiertem Anthropic-Zugriff bewerten
summary: Community-Proxy, der Claude-Abonnement-Anmeldedaten als OpenAI-kompatiblen Endpunkt bereitstellt
title: Claude Max API Proxy
x-i18n:
    generated_at: "2026-04-05T12:52:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2e125a6a46e48371544adf1331137a1db51e93e905b8c44da482cf2fba180a09
    source_path: providers/claude-max-api-proxy.md
    workflow: 15
---

# Claude Max API Proxy

**claude-max-api-proxy** ist ein Community-Tool, das Ihr Claude-Max-/Pro-Abonnement als OpenAI-kompatiblen API-Endpunkt bereitstellt. Dadurch können Sie Ihr Abonnement mit jedem Tool verwenden, das das OpenAI-API-Format unterstützt.

<Warning>
Dieser Pfad dient nur der technischen Kompatibilität. Anthropic hat in der Vergangenheit manche
Abonnementnutzung außerhalb von Claude Code blockiert. Sie müssen selbst entscheiden, ob Sie
ihn verwenden möchten, und die aktuellen Bedingungen von Anthropic prüfen, bevor Sie sich darauf verlassen.
</Warning>

## Warum das verwenden?

| Ansatz                  | Kosten                                              | Am besten geeignet für                    |
| ----------------------- | --------------------------------------------------- | ----------------------------------------- |
| Anthropic API           | Zahlung pro Token (~15 $/M Eingabe, 75 $/M Ausgabe für Opus) | Produktions-Apps, hohes Volumen |
| Claude-Max-Abonnement   | 200 $/Monat pauschal                                | Persönliche Nutzung, Entwicklung, unbegrenzte Nutzung |

Wenn Sie ein Claude-Max-Abonnement haben und es mit OpenAI-kompatiblen Tools verwenden möchten, kann dieser Proxy für manche Workflows die Kosten senken. API keys bleiben der klarere Richtlinienpfad für den Produktionseinsatz.

## So funktioniert es

```
Ihre App → claude-max-api-proxy → Claude Code CLI → Anthropic (über Abonnement)
  (OpenAI-Format)              (Format wird konvertiert)     (verwendet Ihr Login)
```

Der Proxy:

1. Akzeptiert Anfragen im OpenAI-Format unter `http://localhost:3456/v1/chat/completions`
2. Konvertiert sie in Claude-Code-CLI-Befehle
3. Gibt Antworten im OpenAI-Format zurück (Streaming unterstützt)

## Installation

```bash
# Requires Node.js 20+ and Claude Code CLI
npm install -g claude-max-api-proxy

# Verify Claude CLI is authenticated
claude --version
```

## Verwendung

### Server starten

```bash
claude-max-api
# Server runs at http://localhost:3456
```

### Testen

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

### Mit OpenClaw

Sie können OpenClaw auf den Proxy als benutzerdefinierten OpenAI-kompatiblen Endpunkt verweisen lassen:

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

Dieser Pfad verwendet dieselbe Proxy-artige OpenAI-kompatible Route wie andere benutzerdefinierte
`/v1`-Backends:

- natives nur-für-OpenAI Request-Shaping wird nicht angewendet
- kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und kein
  OpenAI-Reasoning-Kompatibilitäts-Payload-Shaping
- verborgene OpenClaw-Attribution-Header (`originator`, `version`, `User-Agent`)
  werden nicht in die Proxy-URL eingefügt

## Verfügbare Modelle

| Modell-ID         | Entspricht       |
| ----------------- | ---------------- |
| `claude-opus-4`   | Claude Opus 4    |
| `claude-sonnet-4` | Claude Sonnet 4  |
| `claude-haiku-4`  | Claude Haiku 4   |

## Automatischer Start unter macOS

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

## Links

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## Hinweise

- Dies ist ein **Community-Tool**, das nicht offiziell von Anthropic oder OpenClaw unterstützt wird
- Erfordert ein aktives Claude-Max-/Pro-Abonnement mit authentifizierter Claude Code CLI
- Der Proxy läuft lokal und sendet keine Daten an Drittanbieter-Server
- Streaming-Antworten werden vollständig unterstützt

## Siehe auch

- [Anthropic-Provider](/providers/anthropic) - Native OpenClaw-Integration mit Claude CLI oder API keys
- [OpenAI-Provider](/providers/openai) - Für OpenAI-/Codex-Abonnements
