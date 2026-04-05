---
read_when:
    - Sie möchten Chutes mit OpenClaw verwenden
    - Sie benötigen den Einrichtungsweg über OAuth oder API-Key
    - Sie möchten das Standard-Model, Aliase oder das Erkennungsverhalten kennen
summary: Chutes-Einrichtung (OAuth oder API-Key, Model-Erkennung, Aliase)
title: Chutes
x-i18n:
    generated_at: "2026-04-05T12:52:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: e275f32e7a19fa5b4c64ffabfb4bf116dd5c9ab95bfa25bd3b1a15d15e237674
    source_path: providers/chutes.md
    workflow: 15
---

# Chutes

[Chutes](https://chutes.ai) stellt Open-Source-Model-Kataloge über eine
OpenAI-kompatible API bereit. OpenClaw unterstützt sowohl Browser-OAuth als auch direkte API-Key-
Authentifizierung für den gebündelten Provider `chutes`.

- Provider: `chutes`
- API: OpenAI-kompatibel
- Base URL: `https://llm.chutes.ai/v1`
- Authentifizierung:
  - OAuth über `openclaw onboard --auth-choice chutes`
  - API-Key über `openclaw onboard --auth-choice chutes-api-key`
  - Runtime-Umgebungsvariablen: `CHUTES_API_KEY`, `CHUTES_OAUTH_TOKEN`

## Schnellstart

### OAuth

```bash
openclaw onboard --auth-choice chutes
```

OpenClaw startet den Browser-Ablauf lokal oder zeigt auf Remote-/Headless-Hosts
einen Ablauf mit URL + Einfügen der Weiterleitungs-URL an. OAuth-Tokens werden über OpenClaw-Auth-
Profile automatisch aktualisiert.

Optionale OAuth-Overrides:

- `CHUTES_CLIENT_ID`
- `CHUTES_CLIENT_SECRET`
- `CHUTES_OAUTH_REDIRECT_URI`
- `CHUTES_OAUTH_SCOPES`

### API-Key

```bash
openclaw onboard --auth-choice chutes-api-key
```

Holen Sie sich Ihren Schlüssel unter
[chutes.ai/settings/api-keys](https://chutes.ai/settings/api-keys).

Beide Authentifizierungspfade registrieren den gebündelten Chutes-Katalog und setzen das Standard-Model
auf `chutes/zai-org/GLM-4.7-TEE`.

## Erkennungsverhalten

Wenn Chutes-Authentifizierung verfügbar ist, fragt OpenClaw den Chutes-Katalog mit diesen
Zugangsdaten ab und verwendet die erkannten Modelle. Wenn die Erkennung fehlschlägt, greift OpenClaw
auf einen gebündelten statischen Katalog zurück, damit Onboarding und Start weiterhin funktionieren.

## Standardaliase

OpenClaw registriert außerdem drei praktische Aliase für den gebündelten Chutes-
Katalog:

- `chutes-fast` -> `chutes/zai-org/GLM-4.7-FP8`
- `chutes-pro` -> `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes-vision` -> `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`

## Integrierter Starter-Katalog

Der gebündelte Fallback-Katalog enthält aktuelle Chutes-Referenzen wie:

- `chutes/zai-org/GLM-4.7-TEE`
- `chutes/zai-org/GLM-5-TEE`
- `chutes/deepseek-ai/DeepSeek-V3.2-TEE`
- `chutes/deepseek-ai/DeepSeek-R1-0528-TEE`
- `chutes/moonshotai/Kimi-K2.5-TEE`
- `chutes/chutesai/Mistral-Small-3.2-24B-Instruct-2506`
- `chutes/Qwen/Qwen3-Coder-Next-TEE`
- `chutes/openai/gpt-oss-120b-TEE`

## Konfigurationsbeispiel

```json5
{
  agents: {
    defaults: {
      model: { primary: "chutes/zai-org/GLM-4.7-TEE" },
      models: {
        "chutes/zai-org/GLM-4.7-TEE": { alias: "Chutes GLM 4.7" },
        "chutes/deepseek-ai/DeepSeek-V3.2-TEE": { alias: "Chutes DeepSeek V3.2" },
      },
    },
  },
}
```

## Hinweise

- Hilfe zu OAuth und Anforderungen der Redirect-App: [Chutes OAuth docs](https://chutes.ai/docs/sign-in-with-chutes/overview)
- Die Erkennung per API-Key und OAuth verwendet dieselbe Provider-ID `chutes`.
- Chutes-Modelle werden als `chutes/<model-id>` registriert.
