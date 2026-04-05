---
read_when:
    - Sie möchten Zugriff auf von OpenCode gehostete Modelle
    - Sie möchten zwischen den Zen- und Go-Katalogen wählen
summary: OpenCode-Zen- und -Go-Kataloge mit OpenClaw verwenden
title: OpenCode
x-i18n:
    generated_at: "2026-04-05T12:53:37Z"
    model: gpt-5.4
    provider: openai
    source_hash: c23bc99208d9275afcb1731c28eee250c9f4b7d0578681ace31416135c330865
    source_path: providers/opencode.md
    workflow: 15
---

# OpenCode

OpenCode stellt in OpenClaw zwei gehostete Kataloge bereit:

- `opencode/...` für den **Zen**-Katalog
- `opencode-go/...` für den **Go**-Katalog

Beide Kataloge verwenden denselben OpenCode-API-Schlüssel. OpenClaw hält die Runtime-Provider-IDs
getrennt, damit das Upstream-Routing pro Modell korrekt bleibt, aber Onboarding und Docs behandeln sie
als ein gemeinsames OpenCode-Setup.

## CLI-Einrichtung

### Zen-Katalog

```bash
openclaw onboard --auth-choice opencode-zen
openclaw onboard --opencode-zen-api-key "$OPENCODE_API_KEY"
```

### Go-Katalog

```bash
openclaw onboard --auth-choice opencode-go
openclaw onboard --opencode-go-api-key "$OPENCODE_API_KEY"
```

## Konfigurations-Snippet

```json5
{
  env: { OPENCODE_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "opencode/claude-opus-4-6" } } },
}
```

## Kataloge

### Zen

- Runtime-Provider: `opencode`
- Beispielmodelle: `opencode/claude-opus-4-6`, `opencode/gpt-5.4`, `opencode/gemini-3-pro`
- Am besten geeignet, wenn Sie den kuratierten OpenCode-Multi-Model-Proxy verwenden möchten

### Go

- Runtime-Provider: `opencode-go`
- Beispielmodelle: `opencode-go/kimi-k2.5`, `opencode-go/glm-5`, `opencode-go/minimax-m2.5`
- Am besten geeignet, wenn Sie die von OpenCode gehostete Kimi-/GLM-/MiniMax-Auswahl verwenden möchten

## Hinweise

- `OPENCODE_ZEN_API_KEY` wird ebenfalls unterstützt.
- Wenn Sie während des Setups einen OpenCode-Schlüssel eingeben, werden Anmeldedaten für beide Runtime-Provider gespeichert.
- Sie melden sich bei OpenCode an, hinterlegen Zahlungsdaten und kopieren Ihren API-Schlüssel.
- Abrechnung und Katalogverfügbarkeit werden über das OpenCode-Dashboard verwaltet.
- Gemini-basierte OpenCode-Referenzen bleiben auf dem Proxy-Gemini-Pfad, sodass OpenClaw
  dort die Bereinigung von Gemini-Thought-Signatures beibehält, ohne native Gemini-
  Replay-Validierung oder Bootstrap-Umschreibungen zu aktivieren.
- Nicht-Gemini-OpenCode-Referenzen behalten die minimale OpenAI-kompatible Replay-Richtlinie bei.
