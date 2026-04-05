---
read_when:
    - Sie möchten Vercel AI Gateway mit OpenClaw verwenden
    - Sie benötigen die API-Key-Umgebungsvariable oder die CLI-Authentifizierungsoption
summary: Einrichtung von Vercel AI Gateway (Authentifizierung + Modellauswahl)
title: Vercel AI Gateway
x-i18n:
    generated_at: "2026-04-05T12:54:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: f30768dc3db49708b25042d317906f7ad9a2c72b0fa03263bc04f5eefbf7a507
    source_path: providers/vercel-ai-gateway.md
    workflow: 15
---

# Vercel AI Gateway

Das [Vercel AI Gateway](https://vercel.com/ai-gateway) bietet eine einheitliche API für den Zugriff auf Hunderte von Modellen über einen einzigen Endpunkt.

- Provider: `vercel-ai-gateway`
- Authentifizierung: `AI_GATEWAY_API_KEY`
- API: kompatibel mit Anthropic Messages
- OpenClaw erkennt den Gateway-Katalog unter `/v1/models` automatisch, sodass `/models vercel-ai-gateway`
  aktuelle Modellreferenzen wie `vercel-ai-gateway/openai/gpt-5.4` enthält.

## Schnellstart

1. Setzen Sie den API-Schlüssel (empfohlen: für das Gateway speichern):

```bash
openclaw onboard --auth-choice ai-gateway-api-key
```

2. Legen Sie ein Standardmodell fest:

```json5
{
  agents: {
    defaults: {
      model: { primary: "vercel-ai-gateway/anthropic/claude-opus-4.6" },
    },
  },
}
```

## Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice ai-gateway-api-key \
  --ai-gateway-api-key "$AI_GATEWAY_API_KEY"
```

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `AI_GATEWAY_API_KEY`
diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über
`env.shellEnv`).

## Kurzform für Modell-IDs

OpenClaw akzeptiert Kurzform-Modellreferenzen für Vercel Claude und normalisiert sie zur Laufzeit:

- `vercel-ai-gateway/claude-opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4.6`
- `vercel-ai-gateway/opus-4.6` -> `vercel-ai-gateway/anthropic/claude-opus-4-6`
