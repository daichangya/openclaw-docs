---
read_when:
    - Sie möchten OpenClaw über einen LiteLLM-Proxy leiten
    - Sie benötigen Kostenverfolgung, Logging oder Modell-Routing über LiteLLM
summary: OpenClaw über LiteLLM Proxy ausführen, für einheitlichen Modellzugriff und Kostenverfolgung
title: LiteLLM
x-i18n:
    generated_at: "2026-04-05T12:53:17Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4e8ca73458186285bc06967b397b8a008791dc58eea1159d6c358e1a794982d1
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai) ist ein Open-Source-LLM-Gateway, das eine einheitliche API für mehr als 100 Modell-Provider bereitstellt. Leiten Sie OpenClaw über LiteLLM, um zentrale Kostenverfolgung, Logging und die Flexibilität zu erhalten, Backends zu wechseln, ohne Ihre OpenClaw-Konfiguration zu ändern.

## Warum LiteLLM mit OpenClaw verwenden?

- **Kostenverfolgung** — Sehen Sie genau, was OpenClaw für alle Modelle ausgibt
- **Modell-Routing** — Wechseln Sie zwischen Claude, GPT-4, Gemini, Bedrock ohne Konfigurationsänderungen
- **Virtuelle Schlüssel** — Erstellen Sie Schlüssel mit Ausgabenlimits für OpenClaw
- **Logging** — Vollständige Request-/Response-Logs zum Debuggen
- **Fallbacks** — Automatisches Failover, wenn Ihr primärer Provider nicht verfügbar ist

## Schnellstart

### Über das Onboarding

```bash
openclaw onboard --auth-choice litellm-api-key
```

### Manuelle Einrichtung

1. LiteLLM Proxy starten:

```bash
pip install 'litellm[proxy]'
litellm --model claude-opus-4-6
```

2. OpenClaw auf LiteLLM verweisen lassen:

```bash
export LITELLM_API_KEY="your-litellm-key"

openclaw
```

Das ist alles. OpenClaw wird jetzt über LiteLLM geleitet.

## Konfiguration

### Umgebungsvariablen

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Konfigurationsdatei

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Virtuelle Schlüssel

Erstellen Sie einen dedizierten Schlüssel für OpenClaw mit Ausgabenlimits:

```bash
curl -X POST "http://localhost:4000/key/generate" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "key_alias": "openclaw",
    "max_budget": 50.00,
    "budget_duration": "monthly"
  }'
```

Verwenden Sie den generierten Schlüssel als `LITELLM_API_KEY`.

## Modell-Routing

LiteLLM kann Modellanfragen an verschiedene Backends weiterleiten. Konfigurieren Sie dies in Ihrer LiteLLM-`config.yaml`:

```yaml
model_list:
  - model_name: claude-opus-4-6
    litellm_params:
      model: claude-opus-4-6
      api_key: os.environ/ANTHROPIC_API_KEY

  - model_name: gpt-4o
    litellm_params:
      model: gpt-4o
      api_key: os.environ/OPENAI_API_KEY
```

OpenClaw fordert weiterhin `claude-opus-4-6` an — LiteLLM übernimmt das Routing.

## Nutzung anzeigen

Prüfen Sie das Dashboard oder die API von LiteLLM:

```bash
# Schlüsselinformationen
curl "http://localhost:4000/key/info" \
  -H "Authorization: Bearer sk-litellm-key"

# Ausgabenprotokolle
curl "http://localhost:4000/spend/logs" \
  -H "Authorization: Bearer $LITELLM_MASTER_KEY"
```

## Hinweise

- LiteLLM läuft standardmäßig auf `http://localhost:4000`
- OpenClaw verbindet sich über den Proxy-artigen OpenAI-kompatiblen `/v1`-
  Endpunkt von LiteLLM
- Natives nur-für-OpenAI Request-Shaping wird über LiteLLM nicht angewendet:
  kein `service_tier`, kein Responses-`store`, keine Prompt-Cache-Hinweise und kein
  OpenAI-Reasoning-Kompatibilitäts-Payload-Shaping
- Verborgene OpenClaw-Attribution-Header (`originator`, `version`, `User-Agent`)
  werden bei benutzerdefinierten LiteLLM-Base-URLs nicht eingefügt

## Siehe auch

- [LiteLLM-Dokumentation](https://docs.litellm.ai)
- [Modell-Provider](/de/concepts/model-providers)
