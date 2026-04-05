---
read_when:
    - Sie möchten Cloudflare AI Gateway mit OpenClaw verwenden
    - Sie benötigen die Konto-ID, Gateway-ID oder die API-Key-Umgebungsvariable
summary: Einrichtung von Cloudflare AI Gateway (Authentifizierung + Modellauswahl)
title: Cloudflare AI Gateway
x-i18n:
    generated_at: "2026-04-05T12:52:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: db77652c37652ca20f7c50f32382dbaeaeb50ea5bdeaf1d4fd17dc394e58950c
    source_path: providers/cloudflare-ai-gateway.md
    workflow: 15
---

# Cloudflare AI Gateway

Cloudflare AI Gateway sitzt vor Provider-APIs und ermöglicht es Ihnen, Analysen, Caching und Kontrollen hinzuzufügen. Für Anthropic verwendet OpenClaw die Anthropic Messages API über Ihren Gateway-Endpunkt.

- Provider: `cloudflare-ai-gateway`
- Basis-URL: `https://gateway.ai.cloudflare.com/v1/<account_id>/<gateway_id>/anthropic`
- Standardmodell: `cloudflare-ai-gateway/claude-sonnet-4-5`
- API-Schlüssel: `CLOUDFLARE_AI_GATEWAY_API_KEY` (Ihr Provider-API-Schlüssel für Anfragen über das Gateway)

Für Anthropic-Modelle verwenden Sie Ihren Anthropic-API-Schlüssel.

## Schnellstart

1. Legen Sie den Provider-API-Schlüssel und die Gateway-Details fest:

```bash
openclaw onboard --auth-choice cloudflare-ai-gateway-api-key
```

2. Legen Sie ein Standardmodell fest:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cloudflare-ai-gateway/claude-sonnet-4-5" },
    },
  },
}
```

## Nicht interaktives Beispiel

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cloudflare-ai-gateway-api-key \
  --cloudflare-ai-gateway-account-id "your-account-id" \
  --cloudflare-ai-gateway-gateway-id "your-gateway-id" \
  --cloudflare-ai-gateway-api-key "$CLOUDFLARE_AI_GATEWAY_API_KEY"
```

## Authentifizierte Gateways

Wenn Sie die Gateway-Authentifizierung in Cloudflare aktiviert haben, fügen Sie den Header `cf-aig-authorization` hinzu (zusätzlich zu Ihrem Provider-API-Schlüssel).

```json5
{
  models: {
    providers: {
      "cloudflare-ai-gateway": {
        headers: {
          "cf-aig-authorization": "Bearer <cloudflare-ai-gateway-token>",
        },
      },
    },
  },
}
```

## Hinweis zur Umgebung

Wenn das Gateway als Daemon läuft (launchd/systemd), stellen Sie sicher, dass `CLOUDFLARE_AI_GATEWAY_API_KEY` diesem Prozess zur Verfügung steht (zum Beispiel in `~/.openclaw/.env` oder über `env.shellEnv`).
