---
read_when:
    - Sie möchten mit Bedrock Mantle gehostete OSS-Modelle mit OpenClaw verwenden
    - Sie benötigen den OpenAI-kompatiblen Mantle-Endpunkt für GPT-OSS, Qwen, Kimi oder GLM
summary: Amazon Bedrock Mantle-Modelle (OpenAI-kompatibel) mit OpenClaw verwenden
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-04-05T12:52:31Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2efe61261fbb430f63be9f5025c0654c44b191dbe96b3eb081d7ccbe78458907
    source_path: providers/bedrock-mantle.md
    workflow: 15
---

# Amazon Bedrock Mantle

OpenClaw enthält einen gebündelten Provider für **Amazon Bedrock Mantle**, der eine Verbindung zum
OpenAI-kompatiblen Mantle-Endpunkt herstellt. Mantle hostet Open-Source- und
Drittanbieter-Modelle (GPT-OSS, Qwen, Kimi, GLM und ähnliche) über eine standardmäßige
Oberfläche `/v1/chat/completions`, die von der Bedrock-Infrastruktur unterstützt wird.

## Was OpenClaw unterstützt

- Provider: `amazon-bedrock-mantle`
- API: `openai-completions` (OpenAI-kompatibel)
- Authentifizierung: Bearer-Token über `AWS_BEARER_TOKEN_BEDROCK`
- Region: `AWS_REGION` oder `AWS_DEFAULT_REGION` (Standard: `us-east-1`)

## Automatische Model-Erkennung

Wenn `AWS_BEARER_TOKEN_BEDROCK` gesetzt ist, erkennt OpenClaw automatisch
verfügbare Mantle-Modelle, indem der Endpunkt `/v1/models` der Region abgefragt wird.
Erkennungsergebnisse werden 1 Stunde lang im Cache gespeichert.

Unterstützte Regionen: `us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Onboarding

1. Setzen Sie das Bearer-Token auf dem **Gateway-Host**:

```bash
export AWS_BEARER_TOKEN_BEDROCK="..."
# Optional (Standard ist us-east-1):
export AWS_REGION="us-west-2"
```

2. Prüfen Sie, ob Modelle erkannt werden:

```bash
openclaw models list
```

Erkannte Modelle werden unter dem Provider `amazon-bedrock-mantle` angezeigt. Es ist
keine zusätzliche Konfiguration erforderlich, es sei denn, Sie möchten Standardwerte überschreiben.

## Manuelle Konfiguration

Wenn Sie eine explizite Konfiguration statt automatischer Erkennung bevorzugen:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

## Hinweise

- Mantle erfordert derzeit ein Bearer-Token. Normale IAM-Zugangsdaten (Instance Roles,
  SSO, Access Keys) reichen ohne ein Token nicht aus.
- Das Bearer-Token ist dasselbe `AWS_BEARER_TOKEN_BEDROCK`, das vom standardmäßigen
  Provider [Amazon Bedrock](/providers/bedrock) verwendet wird.
- Die Unterstützung für Reasoning wird aus Model-IDs mit Mustern wie
  `thinking`, `reasoner` oder `gpt-oss-120b` abgeleitet.
- Wenn der Mantle-Endpunkt nicht verfügbar ist oder keine Modelle zurückgibt, wird der Provider
  stillschweigend übersprungen.
