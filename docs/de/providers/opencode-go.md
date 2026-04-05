---
read_when:
    - Sie möchten den OpenCode-Go-Katalog verwenden
    - Sie benötigen die Runtime-Modellreferenzen für auf Go gehostete Modelle
summary: Den OpenCode-Go-Katalog mit dem gemeinsamen OpenCode-Setup verwenden
title: OpenCode Go
x-i18n:
    generated_at: "2026-04-05T12:53:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8650af7c64220c14bab8c22472fff8bebd7abde253e972b6a11784ad833d321c
    source_path: providers/opencode-go.md
    workflow: 15
---

# OpenCode Go

OpenCode Go ist der Go-Katalog innerhalb von [OpenCode](/providers/opencode).
Er verwendet denselben `OPENCODE_API_KEY` wie der Zen-Katalog, behält aber die Runtime-
Provider-ID `opencode-go` bei, damit das Upstream-Routing pro Modell korrekt bleibt.

## Unterstützte Modelle

- `opencode-go/kimi-k2.5`
- `opencode-go/glm-5`
- `opencode-go/minimax-m2.5`

## CLI-Einrichtung

```bash
openclaw onboard --auth-choice opencode-go
# oder nicht interaktiv
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Konfigurations-Snippet

```json5
{
  env: { OPENCODE_API_KEY: "YOUR_API_KEY_HERE" }, // pragma: allowlist secret
  agents: { defaults: { model: { primary: "opencode-go/kimi-k2.5" } } },
}
```

## Routing-Verhalten

OpenClaw übernimmt das Routing pro Modell automatisch, wenn die Modellreferenz `opencode-go/...` verwendet.

## Hinweise

- Verwenden Sie [OpenCode](/providers/opencode) für das gemeinsame Onboarding und den Katalogüberblick.
- Runtime-Referenzen bleiben explizit: `opencode/...` für Zen, `opencode-go/...` für Go.
